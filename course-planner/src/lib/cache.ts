// src/lib/cache.ts
type CacheItem<T> = {
    data: T;
    timestamp: number;
    expiresIn: number;
  };
  
  class CourseCache {
    private cache: Map<string, CacheItem<any>>;
    private readonly DEFAULT_EXPIRY = 5 * 60 * 1000; // 5 minutes
  
    constructor() {
      this.cache = new Map();
    }
  
    set<T>(key: string, data: T, expiresIn: number = this.DEFAULT_EXPIRY) {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        expiresIn,
      });
    }
  
    get<T>(key: string): T | null {
      const item = this.cache.get(key);
      if (!item) return null;
  
      if (Date.now() - item.timestamp > item.expiresIn) {
        this.cache.delete(key);
        return null;
      }
  
      return item.data as T;
    }
  
    clear() {
      this.cache.clear();
    }
  }
  
  export const courseCache = new CourseCache();