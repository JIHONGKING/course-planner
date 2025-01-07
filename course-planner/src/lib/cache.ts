// src/lib/cache.ts

type CacheItem<T> = {
  data: T;
  timestamp: number;
  expiresIn: number;
};

class CourseCache {
  private cache: Map<string, CacheItem<any>>;
  private lruQueue: string[];
  private readonly MAX_CACHE_SIZE = 100;
  private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.cache = new Map();
    this.lruQueue = [];
  }

  set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY): void {
    // LRU 캐시 크기 관리
    if (this.lruQueue.length >= this.MAX_CACHE_SIZE) {
      const oldest = this.lruQueue.shift();
      if (oldest) this.cache.delete(oldest);
    }

    // 캐시 데이터 설정
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });

    // LRU 큐 업데이트
    this.lruQueue = this.lruQueue.filter(k => k !== key);
    this.lruQueue.push(key);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // 만료 체크
    if (Date.now() - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      this.lruQueue = this.lruQueue.filter(k => k !== key);
      return null;
    }

    // LRU 큐 업데이트
    this.lruQueue = this.lruQueue.filter(k => k !== key);
    this.lruQueue.push(key);

    return item.data as T;
  }

  clear(): void {
    this.cache.clear();
    this.lruQueue = [];
  }

  // 특정 패턴의 캐시만 삭제
  clearPattern(pattern: RegExp): void {
    Array.from(this.cache.keys()).forEach(key => {
      if (pattern.test(key)) {
        this.cache.delete(key);
        this.lruQueue = this.lruQueue.filter(k => k !== key);
      }
    });
  }

  // 만료된 캐시 정리
  cleanup(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, item]) => {
      if (now - item.timestamp > item.expiresIn) {
        this.cache.delete(key);
        this.lruQueue = this.lruQueue.filter(k => k !== key);
      }
    });
  }

  // 캐시 상태 확인
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.MAX_CACHE_SIZE,
      oldestItem: this.lruQueue[0],
      newestItem: this.lruQueue[this.lruQueue.length - 1],
    };
  }
}

export const courseCache = new CourseCache();