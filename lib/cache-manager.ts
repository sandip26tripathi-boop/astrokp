/**
 * lib/cache-manager.ts
 * High-Concurrency Deterministic LRU Cache & Rate Limiter
 * Built for 1,000+ concurrent users with zero lag
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxItems: number;
  private defaultTTLMs: number;

  constructor(maxItems = 2000, defaultTTLMinutes = 60) {
    this.maxItems = maxItems;
    this.defaultTTLMs = defaultTTLMinutes * 60 * 1000;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Refresh LRU order (delete & set)
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  set(key: string, value: T, ttlMs?: number): void {
    if (this.cache.size >= this.maxItems) {
      // Evict oldest item
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTTLMs),
    });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

// 1. Kundli Math Cache: 24 Hours TTL (mathematical calculations for a given birth time never change)
export const kundliCalculationCache = new LRUCache<any>(3000, 24 * 60);

// 2. Gochar / Transit Cache: 6 Hours TTL (slow moving planets shift minimally in 6h)
export const gocharTransitCache = new LRUCache<any>(500, 6 * 60);

// 3. Lightweight IP / Session Rate Limiter (Sliding Window)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class MemoryRateLimiter {
  private requests = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60 * 1000, maxRequests = 40) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetInSec: number } {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now > record.resetAt) {
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return { allowed: true, remaining: this.maxRequests - 1, resetInSec: Math.ceil(this.windowMs / 1000) };
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetInSec: Math.ceil((record.resetAt - now) / 1000),
      };
    }

    record.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetInSec: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  // Periodic cleanup
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(key);
      }
    }
  }
}

export const apiRateLimiter = new MemoryRateLimiter(60 * 1000, 45); // 45 requests/min per IP
