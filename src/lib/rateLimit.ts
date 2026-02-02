type RateLimitState = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitState>();

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type RateLimitHeaders = Record<string, string>;

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    const resetAt = now + windowMs;
    const next: RateLimitState = { count: 1, resetAt };
    buckets.set(key, next);
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  buckets.set(key, existing);
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

export function getRateLimitHeaders(
  limit: number,
  result: RateLimitResult
): RateLimitHeaders {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000))
  };
}

export function applyRateLimitHeaders(
  headers: Headers,
  limit: number,
  result: RateLimitResult
) {
  const rateHeaders = getRateLimitHeaders(limit, result);
  Object.entries(rateHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
}

export function resetRateLimit() {
  buckets.clear();
}
