// src/utils/cacheUtils.ts

export function calculateObjectSize(obj: any): number {
    try {
      const str = JSON.stringify(obj);
      return new Blob([str]).size;
    } catch {
      return 0;
    }
  }
  
  export function hashKey(key: string): string {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
  
  export function isExpired(timestamp: number, ttl: number): boolean {
    return Date.now() > timestamp + ttl;
  }
  
  export function normalizeKey(key: string): string {
    return key.toLowerCase().trim().replace(/\s+/g, ':');
  }
  
  // LRU (Least Recently Used) 캐시 구현
  export class LRUCache<K, V> {
    private readonly max: number;
    private readonly cache: Map<K, V>;
    private readonly timestamps: Map<K, number>;
  
    constructor(maxSize: number) {
      this.max = maxSize;
      this.cache = new Map();
      this.timestamps = new Map();
    }
  
    get(key: K): V | undefined {
      const value = this.cache.get(key);
      if (value !== undefined) {
        // 접근 시간 업데이트
        this.timestamps.set(key, Date.now());
      }
      return value;
    }
  
    set(key: K, value: V): void {
      if (this.cache.size >= this.max) {
        this.evictLRU();
      }
      this.cache.set(key, value);
      this.timestamps.set(key, Date.now());
    }
  
    private evictLRU(): void {
      let oldestKey: K | undefined;
      let oldestTime = Infinity;
  
      for (const [key, time] of this.timestamps.entries()) {
        if (time < oldestTime) {
          oldestTime = time;
          oldestKey = key;
        }
      }
  
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.timestamps.delete(oldestKey);
      }
    }
  
    clear(): void {
      this.cache.clear();
      this.timestamps.clear();
    }
  }