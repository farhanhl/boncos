import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/rate-limit";

describe("Rate Limiter (lib/rate-limit.ts)", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests under the limit", () => {
    const key = "user-123";
    const res1 = checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("blocks requests exceeding the limit", () => {
    const key = "user-blocked";
    for (let i = 0; i < 3; i++) {
      checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    }

    const blocked = checkRateLimit(key, { limit: 3, windowMs: 10_000 });
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it("isolates different keys", () => {
    const keyA = "user-a";
    const keyB = "user-b";

    for (let i = 0; i < 2; i++) {
      checkRateLimit(keyA, { limit: 2, windowMs: 10_000 });
    }

    // keyA is exhausted
    expect(checkRateLimit(keyA, { limit: 2, windowMs: 10_000 }).success).toBe(false);

    // keyB is still fresh
    const resB = checkRateLimit(keyB, { limit: 2, windowMs: 10_000 });
    expect(resB.success).toBe(true);
    expect(resB.remaining).toBe(1);
  });

  it("resets after window expiry", () => {
    const key = "user-expire";
    const now = 1000000;
    vi.setSystemTime(now);

    checkRateLimit(key, { limit: 1, windowMs: 5_000 });
    expect(checkRateLimit(key, { limit: 1, windowMs: 5_000 }).success).toBe(false);

    // Advance past window
    vi.setSystemTime(now + 6_000);
    const resAfter = checkRateLimit(key, { limit: 1, windowMs: 5_000 });
    expect(resAfter.success).toBe(true);
    expect(resAfter.remaining).toBe(0);

    vi.useRealTimers();
  });
});
