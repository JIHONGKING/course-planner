// src/lib/cache/OptimizedCacheManager.ts

import type { Course } from '@/types/course';

interface CacheOptions {
  maxSize?: number;       // 최대 캐시 크기 (bytes)
  ttl?: number;          // Time To Live (milliseconds)
  updateAgeOnGet?: boolean;  // 조회 시 age 업데이트 여부
}

interface CacheItem<T> {
  data: T;
  size: number;
  hits: number;
  lastAccessed: number;
  expiresAt: number;
}

export class OptimizedCacheManager<T> {
  private cache: Map<string, CacheItem<T>>;
  private currentSize: number;
  private readonly maxSize: number;
  private readonly ttl: number;
  private readonly updateAgeOnGet: boolean;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.currentSize = 0;
    this.maxSize = options.maxSize || 50 * 1024 * 1024; // 기본 50MB
    this.ttl = options.ttl || 5 * 60 * 1000; // 기본 5분
    this.updateAgeOnGet = options.updateAgeOnGet ?? true;
  }

  async set(key: string, value: T, options?: { ttl?: number }): Promise<void> {
    const size = this.calculateSize(value);
    const ttl = options?.ttl ?? this.ttl;

    // 공간 확보가 필요한 경우
    if (this.currentSize + size > this.maxSize) {
      await this.evict(size);
    }

    const item: CacheItem<T> = {
      data: value,
      size,
      hits: 0,
      lastAccessed: Date.now(),
      expiresAt: Date.now() + ttl
    };

    const existingItem = this.cache.get(key);
    if (existingItem) {
      this.currentSize -= existingItem.size;
    }

    this.cache.set(key, item);
    this.currentSize += size;
  }

  async get(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now > item.expiresAt) {
      this.delete(key);
      return null;
    }

    item.hits++;
    if (this.updateAgeOnGet) {
      item.lastAccessed = now;
    }

    return item.data;
  }

  delete(key: string): void {
    const item = this.cache.get(key);
    if (item) {
      this.currentSize -= item.size;
      this.cache.delete(key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.currentSize = 0;
  }

  private calculateSize(value: T): number {
    try {
      const str = JSON.stringify(value);
      return new Blob([str]).size;
    } catch {
      return 0;
    }
  }

  private async evict(requiredSize: number): Promise<void> {
    if (requiredSize > this.maxSize) {
      throw new Error('Item size exceeds cache maximum size');
    }

    const items = Array.from(this.cache.entries())
      .map(([key, item]) => ({
        key,
        score: this.calculateEvictionScore(item)
      }))
      .sort((a, b) => a.score - b.score);

    let freedSpace = 0;
    for (const { key } of items) {
      const item = this.cache.get(key);
      if (!item) continue;

      this.delete(key);
      freedSpace += item.size;

      if (freedSpace >= requiredSize) break;
    }
  }

  private calculateEvictionScore(item: CacheItem<T>): number {
    const age = Date.now() - item.lastAccessed;
    const hitRate = item.hits / Math.max(age / 1000, 1); // hits per second
    return hitRate / item.size; // 높은 점수 = 보존 가치 높음
  }

  async evictIfNeeded(requiredSize: number): Promise<void> {
    let currentSize = Array.from(this.cache.values())
      .reduce((sum, item) => sum + item.size, 0);

    while (currentSize + requiredSize > this.maxSize && this.cache.size > 0) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)[0][0];

      const evictedItem = this.cache.get(oldestKey);
      if (evictedItem) {
        currentSize -= evictedItem.size;
        this.cache.delete(oldestKey);
      }
    }
  }

  public clearPattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      itemCount: this.cache.size,
      currentSize: this.currentSize,
      maxSize: this.maxSize,
      utilizationPercent: (this.currentSize / this.maxSize) * 100
    };
  }
}

export const courseCache = new OptimizedCacheManager<Course>();
export const performanceCache = new OptimizedCacheManager<any>();
export const apiCache = new OptimizedCacheManager<any>({
  maxSize: 50 * 1024 * 1024, // 50MB
  ttl: 5 * 60 * 1000 // 5 minutes
});
