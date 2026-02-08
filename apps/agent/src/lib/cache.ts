/**
 * ⚡️ SIMPLE IN-MEMORY CACHE
 * Caches API responses to reduce database load
 * Production: Consider Redis or Vercel KV for distributed cache
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 30000; // 30 seconds default

  /**
   * Get cached data or null if expired/missing
   */
  get<T>(key: string, ttl?: number): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    const maxAge = ttl || this.defaultTTL;

    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache data
   */
  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Invalidate specific key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get or set pattern - fetch from cache or execute function
   */
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key, ttl);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data);
    return data;
  }
}

// Export singleton instance
export const cache = new SimpleCache();

// Cache TTL constants
export const CACHE_TTL = {
  SHORT: 10000,      // 10 seconds - frequently changing data
  MEDIUM: 30000,     // 30 seconds - moderate changes
  LONG: 300000,      // 5 minutes - relatively static data
  VERY_LONG: 3600000 // 1 hour - rarely changing data
};
