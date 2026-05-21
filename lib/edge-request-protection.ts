import { NextResponse } from "next/server";

type EdgeRateLimitBucket = {
    count: number;
    resetAt: number;
};

type EdgeRateLimitConfig = {
    scope: string;
    limit: number;
    windowMs: number;
    includeUserAgent?: boolean;
};

type EdgeRateLimitResult = {
    allowed: boolean;
    scope: string;
    limit: number;
    remaining: number;
    resetAt: number;
    retryAfterSeconds: number;
};

type EdgeRequestProtectionState = {
    rateLimitBuckets: Map<string, EdgeRateLimitBucket>;
};

type EdgePolicy = {
    limits: EdgeRateLimitConfig[];
};

const globalForEdgeRequestProtection = globalThis as typeof globalThis & {
    __edgeRequestProtectionState?: EdgeRequestProtectionState;
};

const edgePolicies: Array<{
    matcher: RegExp;
    methods?: string[];
    policy: EdgePolicy;
}> = [
    {
        matcher: /^\/api\/submit-feedback(?:\/|$)/,
        methods: ["POST"],
        policy: {
            limits: [
                { scope: "edge:submit-feedback:burst", limit: 12, windowMs: 30 * 1000 },
                { scope: "edge:submit-feedback:sustained", limit: 48, windowMs: 15 * 60 * 1000 },
            ],
        },
    },
    {
        matcher: /^\/api\/print-feedback(?:\/|$)/,
        methods: ["POST"],
        policy: {
            limits: [
                { scope: "edge:print-feedback:burst", limit: 18, windowMs: 60 * 1000 },
                { scope: "edge:print-feedback:sustained", limit: 72, windowMs: 15 * 60 * 1000 },
            ],
        },
    },
    {
        matcher: /^\/api\/admin\/login(?:\/|$)/,
        methods: ["POST"],
        policy: {
            limits: [
                { scope: "edge:admin-login:burst", limit: 8, windowMs: 60 * 1000 },
                { scope: "edge:admin-login:sustained", limit: 24, windowMs: 15 * 60 * 1000 },
            ],
        },
    },
    {
        matcher: /^\/api\/achievements(?:\/|$)/,
        methods: ["GET"],
        policy: {
            limits: [
                { scope: "edge:achievements:burst", limit: 60, windowMs: 60 * 1000 },
                { scope: "edge:achievements:sustained", limit: 600, windowMs: 15 * 60 * 1000 },
            ],
        },
    },
    {
        matcher: /^\/api\/report-metadata(?:\/|$)/,
        methods: ["GET", "PUT"],
        policy: {
            limits: [
                { scope: "edge:report-metadata:burst", limit: 30, windowMs: 60 * 1000 },
                { scope: "edge:report-metadata:sustained", limit: 240, windowMs: 15 * 60 * 1000 },
            ],
        },
    },
];

function getEdgeRequestProtectionState(): EdgeRequestProtectionState {
    if (!globalForEdgeRequestProtection.__edgeRequestProtectionState) {
        globalForEdgeRequestProtection.__edgeRequestProtectionState = {
            rateLimitBuckets: new Map<string, EdgeRateLimitBucket>(),
        };
    }

    return globalForEdgeRequestProtection.__edgeRequestProtectionState;
}

function normalizeHeaderValue(value: string | null): string {
    return value?.trim() || "unknown";
}

export function getEdgeClientIp(request: Request): string {
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

export function getEdgePolicy(pathname: string, method: string): EdgePolicy | null {
    const normalizedMethod = method.toUpperCase();

    for (const entry of edgePolicies) {
        if (!entry.matcher.test(pathname)) {
            continue;
        }

        if (entry.methods && !entry.methods.includes(normalizedMethod)) {
            continue;
        }

        return entry.policy;
    }

    return null;
}

function getEdgeRequestFingerprint(request: Request, scope: string, includeUserAgent = true): string {
    const userAgent = includeUserAgent ? normalizeHeaderValue(request.headers.get("user-agent")) : "unknown";
    const method = normalizeHeaderValue(request.method);
    const ip = getEdgeClientIp(request);

    return `${scope}:${method}:${ip}:${userAgent}`;
}

function enforceSingleEdgeLimit(request: Request, config: EdgeRateLimitConfig): EdgeRateLimitResult {
    const state = getEdgeRequestProtectionState();
    const now = Date.now();
    const key = getEdgeRequestFingerprint(request, config.scope, config.includeUserAgent ?? true);
    const bucketKey = `${config.scope}:${key}`;

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

export function applyEdgeRateLimit(request: Request, pathname: string): NextResponse | null {
    const policy = getEdgePolicy(pathname, request.method);
    if (!policy) {
        return null;
    }

    for (const limit of policy.limits) {
        const result = enforceSingleEdgeLimit(request, limit);
        if (!result.allowed) {
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
    }

    return null;
}

export function resetEdgeRequestProtectionStateForTests() {
    const state = getEdgeRequestProtectionState();
    state.rateLimitBuckets.clear();
}