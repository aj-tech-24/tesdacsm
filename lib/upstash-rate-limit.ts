// Lightweight wrapper to use Upstash Rate Limit when available.
// Dynamically imports @upstash/ratelimit and @upstash/redis if installed.
// If not configured or imports fail, callers should fall back to in-memory logic.

type DistributedLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
  retryAfterSeconds: number;
};

const UPSTASH_ENABLED = Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);

export async function distributedRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<DistributedLimitResult> {
  if (!UPSTASH_ENABLED) {
    throw new Error('Upstash not configured');
  }

  try {
    // Try dynamic import of the official client. If it's not installed, fallback will occur.
    const { Ratelimit } = await import('@upstash/ratelimit');
    const { Redis } = await import('@upstash/redis');

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });

    const rl = new Ratelimit(redis, {
      limiter: Ratelimit.slidingWindow(limit, Math.ceil(windowMs / 1000)),
    });

    const res = await rl.limit(key);

    const allowed = res.success;
    const remaining = typeof res.remaining === 'number' ? res.remaining : 0;
    const resetAt = Date.now() + (res.reset ?? Math.ceil(windowMs / 1000)) * 1000;
    const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

    return { allowed, remaining, resetAt, retryAfterSeconds };
  } catch (err) {
    // Propagate an error that callers can detect and fall back to local limiter
    throw err;
  }
}

export function isUpstashConfigured() {
  return UPSTASH_ENABLED;
}
