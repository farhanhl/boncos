/**
 * In-memory sliding window rate limiter for API endpoints.
 * Thread-safe for Node.js single-threaded event loop.
 * Automatically cleans up expired windows to prevent memory leaks.
 */

interface RateLimitRecord {
  timestamps: number[];
  expiresAt: number;
}

const store = new Map<string, RateLimitRecord>();

let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;

function cleanupExpiredRecords(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of store.entries()) {
    if (record.expiresAt <= now) {
      store.delete(key);
    }
  }
}

export interface RateLimitOptions {
  /** Maximum number of allowed requests in the time window (default: 15) */
  limit?: number;
  /** Window duration in milliseconds (default: 60_000 ms = 1 minute) */
  windowMs?: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetMs: number;
}

/**
 * Checks if a given key (e.g. user key or IP) is within the rate limit.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? 15;
  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();

  cleanupExpiredRecords(now);

  const windowStart = now - windowMs;
  let record = store.get(key);

  if (!record) {
    record = {
      timestamps: [now],
      expiresAt: now + windowMs,
    };
    store.set(key, record);
    return {
      success: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetMs: windowMs,
    };
  }

  // Filter out timestamps outside the sliding window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);
  record.expiresAt = now + windowMs;

  if (record.timestamps.length >= limit) {
    const oldest = record.timestamps[0] || now;
    const resetMs = Math.max(0, oldest + windowMs - now);
    return {
      success: false,
      limit,
      remaining: 0,
      resetMs,
    };
  }

  record.timestamps.push(now);
  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - record.timestamps.length),
    resetMs: windowMs,
  };
}

/**
 * Helper to reset rate limits (useful for testing).
 */
export function resetRateLimits(): void {
  store.clear();
  lastCleanup = Date.now();
}
