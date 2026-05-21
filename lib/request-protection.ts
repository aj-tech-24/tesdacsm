import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { isUpstashConfigured, distributedRateLimit } from "@/lib/upstash-rate-limit";

type RateLimitBucket = {
    count: number;
    resetAt: number;
};

type RateLimitConfig = {
    scope: string;
    limit: number;
    windowMs: number;
    includeUserAgent?: boolean;
};

export type RateLimitResult = {
    allowed: boolean;
    scope: string;
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
};

type RequestProtectionState = {
    rateLimitBuckets: Map<string, RateLimitBucket>;
};

const globalForRequestProtection = globalThis as typeof globalThis & {
    __requestProtectionState?: RequestProtectionState;
};

function getRequestProtectionState(): RequestProtectionState {
    if (!globalForRequestProtection.__requestProtectionState) {
        globalForRequestProtection.__requestProtectionState = {
            rateLimitBuckets: new Map<string, RateLimitBucket>(),
        };
    }

    return globalForRequestProtection.__requestProtectionState;
}

function normalizeHeaderValue(value: string | null): string {
    return value?.trim() || "unknown";
}

export function getClientIp(request: Request): string {
    const forwardedFor = request.headers.get("x-forwarded-for")
        ?.split(",")
        .map((value) => value.trim())
        .find(Boolean);

    return normalizeHeaderValue(
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-real-ip") ||
        forwardedFor ||
        null,
    );
}

export function getRequestFingerprint(request: Request, scope: string, includeUserAgent = true): string {
    const userAgent = includeUserAgent ? normalizeHeaderValue(request.headers.get("user-agent")) : "unknown";
    const method = normalizeHeaderValue(request.method);
    const ip = getClientIp(request);

    return createHash("sha256")
        .update(`${scope}|${method}|${ip}|${userAgent}`)
        .digest("hex");
}

export async function enforceRateLimit(request: Request, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now();
    const fingerprint = getRequestFingerprint(request, config.scope, config.includeUserAgent ?? true);
    const bucketKey = `${config.scope}:${fingerprint}`;

    // Try distributed Upstash limiter first when configured
    if (isUpstashConfigured()) {
        try {
            const dr = await distributedRateLimit(bucketKey, config.limit, config.windowMs);
            return {
                allowed: dr.allowed,
                scope: config.scope,
                limit: config.limit,
                remaining: dr.remaining,
                resetAt: dr.resetAt,
                retryAfterSeconds: dr.retryAfterSeconds,
            };
        } catch (err) {
            // Fall back to in-memory limiter below
            console.warn('Upstash rate limit failed, falling back to local limiter', err);
        }
    }

    // Local in-memory limiter (per-instance)
    const state = getRequestProtectionState();

    if (state.rateLimitBuckets.size > 10_000) {
        for (const [key, bucket] of state.rateLimitBuckets.entries()) {
            if (bucket.resetAt <= now) {
                state.rateLimitBuckets.delete(key);
            }
        }
    }

    const existingBucket = state.rateLimitBuckets.get(bucketKey);
    const bucket = existingBucket && existingBucket.resetAt > now
        ? existingBucket
        : { count: 0, resetAt: now + config.windowMs };

    bucket.count += 1;
    state.rateLimitBuckets.set(bucketKey, bucket);

    const allowed = bucket.count <= config.limit;
    const remaining = allowed ? Math.max(0, config.limit - bucket.count) : 0;
    const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));

    return {
        allowed,
        scope: config.scope,
        limit: config.limit,
        remaining,
        resetAt: bucket.resetAt,
        retryAfterSeconds,
    };
}

export function rejectIfRequestTooLarge(request: Request, maxBytes: number): NextResponse | null {
    const contentLength = request.headers.get("content-length");
    if (!contentLength) {
        return null;
    }

    const parsedLength = Number(contentLength);
    if (!Number.isFinite(parsedLength) || parsedLength <= 0) {
        return null;
    }

    if (parsedLength <= maxBytes) {
        return null;
    }

    return NextResponse.json(
        {
            success: false,
            error: "Request body too large",
            maxBytes,
        },
        {
            status: 413,
            headers: {
                "Cache-Control": "no-store",
            },
        },
    );
}

export function createRateLimitResponse(result: RateLimitResult): NextResponse {
    return NextResponse.json(
        {
            success: false,
            error: "Too Many Requests",
            scope: result.scope,
            retryAfterSeconds: result.retryAfterSeconds,
        },
        {
            status: 429,
            headers: {
                "Retry-After": String(result.retryAfterSeconds),
                "X-RateLimit-Limit": String(result.limit),
                "X-RateLimit-Remaining": String(result.remaining),
                "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
                "Cache-Control": "no-store",
            },
        },
    );
}

export function resetRequestProtectionStateForTests() {
    const state = getRequestProtectionState();
    state.rateLimitBuckets.clear();
}