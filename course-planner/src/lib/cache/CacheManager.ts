// src/lib/cache/CacheManager.ts
import type { Course } from '@/types/course';

interface CacheItem<T> {
  data: T;
  expiresAt: number;
  lastAccessed: number;
}

export class CacheManager<T> {
  private cache: Map<string, CacheItem<T>>;
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: T, ttl: number = this.defaultTTL): void {
    this.evictIfNeeded();
    this.cleanup();

    const now = Date.now();
    this.cache.set(key, {
      data: value,
      expiresAt: now + ttl,
      lastAccessed: now
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    item.lastAccessed = now;
    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private evictIfNeeded(): void {
    if (this.cache.size < this.maxSize) return;

    let oldestKey = '';
    let oldestAccess = Date.now();

    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (item.lastAccessed < oldestAccess) {
        oldestAccess = item.lastAccessed;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keys = Array.from(this.cache.keys());
    
    for (const key of keys) {
      const item = this.cache.get(key);
      if (item && now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  clearPattern(pattern: RegExp): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    });
  }

  getStats(): Record<string, any> {
    let totalSize = 0;
    let expiredItems = 0;
    const now = Date.now();

    this.cache.forEach(item => {
      totalSize += JSON.stringify(item.data).length;
      if (now > item.expiresAt) expiredItems++;
    });

    return {
      totalItems: this.cache.size,
      maxSize: this.maxSize,
      totalSizeBytes: totalSize,
      expiredItems,
      hitRate: this.hitCount / Math.max(1, this.totalAccesses)
    };
  }

  private hitCount = 0;
  private totalAccesses = 0;
}

export const courseCache = new CacheManager<Course>();
export const performanceCache = new CacheManager<any>();
export const apiCache = new CacheManager<any>();
