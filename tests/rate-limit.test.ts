import { describe, expect, it } from 'vitest';
import { checkRateLimit, resetRateLimit } from '../src/lib/rateLimit';

describe('rate limiter', () => {
  it('enforces limits within a window', () => {
    resetRateLimit();
    const key = 'test:ip';
    const limit = 3;
    const windowMs = 1000;
    const now = 1_000;

    expect(checkRateLimit(key, limit, windowMs, now).allowed).toBe(true);
    expect(checkRateLimit(key, limit, windowMs, now + 1).allowed).toBe(true);
    expect(checkRateLimit(key, limit, windowMs, now + 2).allowed).toBe(true);
    expect(checkRateLimit(key, limit, windowMs, now + 3).allowed).toBe(false);
  });

  it('resets after window', () => {
    resetRateLimit();
    const key = 'test:ip';
    const limit = 2;
    const windowMs = 1000;
    const now = 10_000;

    expect(checkRateLimit(key, limit, windowMs, now).allowed).toBe(true);
    expect(checkRateLimit(key, limit, windowMs, now + 1).allowed).toBe(true);
    expect(checkRateLimit(key, limit, windowMs, now + 2).allowed).toBe(false);

    expect(checkRateLimit(key, limit, windowMs, now + 1001).allowed).toBe(true);
  });
});
