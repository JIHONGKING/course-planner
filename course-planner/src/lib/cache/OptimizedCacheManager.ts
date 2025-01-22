// src/lib/cache/OptimizedCacheManager.ts

import type { Course } from '@/types/course';

interface CacheConfig {
  maxSize: number;       // Maximum size in bytes
  ttl: number;           // Time To Live in milliseconds
  invalidationInterval?: number; // Cache cleanup interval
}

interface CacheMetrics {
  hitCount: number;
  missCount: number;
  evictionCount: number;
  totalSize: number;
}

interface CacheStats {
  hitRate: number;
  size: number;          // totalSize를 size로 변경
  itemCount: number;     // totalItems를 itemCount로 변경
  evictionCount: number;
  utilizationRate: number;
}

interface CacheEntry<T> {
  value: T;
  size: number;
  lastAccessed: number;
  expiresAt: number;
  hits: number;
}

export class OptimizedCacheManager<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;
  private readonly ttl: number;
  private metrics: CacheMetrics;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig) {
    this.cache = new Map();
    this.maxSize = config.maxSize;
    this.ttl = config.ttl;
    this.metrics = {
      hitCount: 0,
      missCount: 0,
      evictionCount: 0,
      totalSize: 0
    };

    if (config.invalidationInterval) {
      this.startCleanup(config.invalidationInterval);
    }
  }

  async get(key: string): Promise<T | null> {
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.missCount++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      this.metrics.missCount++;
      return null;
    }

    entry.hits++;
    entry.lastAccessed = Date.now();
    this.metrics.hitCount++;
    return entry.value;
  }

  async set(key: string, value: T, options?: { ttl?: number }): Promise<void> {
    const size = this.calculateSize(value);

    // 공간 확보
    while (this.metrics.totalSize + size > this.maxSize) {
      const evicted = this.evictLRU();
      if (!evicted) break;
    }

    const entry: CacheEntry<T> = {
      value,
      size,
      hits: 0,
      lastAccessed: Date.now(),
      expiresAt: Date.now() + (options?.ttl || this.ttl)
    };

    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.metrics.totalSize -= existingEntry.size;
    }

    this.cache.set(key, entry);
    this.metrics.totalSize += size;
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      this.metrics.totalSize -= entry.size;
      this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.metrics.totalSize = 0;
  }

  getStats(): CacheStats {
    const hitRate =
      this.metrics.hitCount /
        (this.metrics.hitCount + this.metrics.missCount) || 0;

    return {
      size: this.metrics.totalSize,
      itemCount: this.cache.size,
      hitRate,
      evictionCount: this.metrics.evictionCount,
      utilizationRate: this.metrics.totalSize / this.maxSize
    };
  }

  private evictLRU(): boolean {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestAccess) {
        oldestAccess = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
      this.metrics.evictionCount++;
      return true;
    }

    return false;
  }

  private calculateSize(value: T): number {
    try {
      return new Blob([JSON.stringify(value)]).size;
    } catch {
      return 0;
    }
  }

  private startCleanup(interval: number): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.delete(key);
        }
      }
    }, interval);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export function createCache<T>(config: Partial<CacheConfig> = {}): OptimizedCacheManager<T> {
  const defaultConfig: CacheConfig = {
    maxSize: 100 * 1024 * 1024, // 100MB
    ttl: 5 * 60 * 1000, // 5 minutes
    invalidationInterval: 60000, // 1 minute
  };

  return new OptimizedCacheManager<T>({
    ...defaultConfig,
    ...config,
  });
}

export const courseCache = createCache<Course>();
export const performanceCache = createCache<any>();
export const apiCache = createCache<any>({
  maxSize: 50 * 1024 * 1024, // 50MB
  ttl: 5 * 60 * 1000, // 5 minutes
});
