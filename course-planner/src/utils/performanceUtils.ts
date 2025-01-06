// src/utils/performanceUtils.ts
import type { Course } from '@/types/course';

// LRU 캐시 구현
class LRUCache<K, V> {
  private capacity: number;
  private cache: Map<K, V>;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;
    
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value!);
    return value;
  }

  put(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// 메모이제이션 유틸리티
export function memoizeFunction<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string = (...args) => JSON.stringify(args)
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = keyGenerator(...args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// 코스 데이터 처리 최적화
export const courseDataCache = new LRUCache<string, Course[]>(100);

export function optimizeCourseData(courses: Course[]): Course[] {
  const key = JSON.stringify(courses.map(c => c.id));
  const cached = courseDataCache.get(key);
  if (cached) return cached;

  const optimized = courses.map(course => ({
    ...course,
    prerequisites: course.prerequisites.map(p => ({
      ...p,
      // 불필요한 데이터 제거
      courseId: p.courseId
    }))
  }));

  courseDataCache.put(key, optimized);
  return optimized;
}

// 데이터 배치 처리
export function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize: number = 100
): R[] {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...batch.map(processor));
  }
  
  return results;
}

// 비용이 많이 드는 계산 최적화
export const expensiveCalculation = memoizeFunction(
  (data: any) => {
    // 실제 계산 로직
    return data;
  }
);

// 성능 모니터링
export class PerformanceMonitor {
  private static timers = new Map<string, number>();

  static startTimer(label: string): void {
    this.timers.set(label, performance.now());
  }

  static endTimer(label: string): number {
    const start = this.timers.get(label);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.timers.delete(label);
    return duration;
  }

  static measureAsync<T>(
    label: string,
    fn: () => Promise<T>
  ): Promise<T> {
    this.startTimer(label);
    return fn().finally(() => {
      const duration = this.endTimer(label);
      console.debug(`${label} took ${duration.toFixed(2)}ms`);
    });
  }
}