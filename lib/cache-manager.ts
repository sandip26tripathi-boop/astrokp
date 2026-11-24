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
  private lastPrune: number = Date.now();

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
    const now = Date.now();

    // Auto-prune expired items if cache is approaching limit
    if (this.cache.size >= this.maxItems * 0.9 && now - this.lastPrune > 60000) {
      this.pruneExpired();
      this.lastPrune = now;
    }

    if (this.cache.size >= this.maxItems) {
      // Evict oldest item
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: now + (ttlMs || this.defaultTTLMs),
    });
  }

  pruneExpired(): number {
    const now = Date.now();
    let deletedCount = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    return deletedCount;
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

// 3. Geocoding / Location Cache: 24 Hours TTL (city coordinates never change)
export const geoSearchCache = new LRUCache<any>(1000, 24 * 60);

// 4. Lightweight Memory Rate Limiter (Sliding Window with Auto-Pruning)
interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class MemoryRateLimiter {
  private requests = new Map<string, RateLimitRecord>();
  private windowMs: number;
  private maxRequests: number;
  private maxStoredEntries: number;
  private lastCleanup: number = Date.now();

  constructor(windowMs = 60 * 1000, maxRequests = 45, maxStoredEntries = 5000) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.maxStoredEntries = maxStoredEntries;
  }

  check(identifier: string): { allowed: boolean; remaining: number; resetInSec: number } {
    const now = Date.now();

    // Auto-prune expired records to prevent unbounded memory growth under thousands of concurrent users
    if (now - this.lastCleanup > 30000 || this.requests.size > this.maxStoredEntries * 0.8) {
      this.cleanup();
      this.lastCleanup = now;
    }

    // Safety hard cap on map size
    if (this.requests.size >= this.maxStoredEntries) {
      const oldestKey = this.requests.keys().next().value;
      if (oldestKey) this.requests.delete(oldestKey);
    }

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

  // Self-pruning periodic cleanup
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetAt) {
        this.requests.delete(key);
      }
    }
  }

  size(): number {
    return this.requests.size;
  }
}

export const apiRateLimiter = new MemoryRateLimiter(60 * 1000, 45); // 45 requests/min per IP
