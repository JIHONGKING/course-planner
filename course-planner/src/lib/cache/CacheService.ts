// src/lib/cache/CacheService.ts

import { OptimizedCacheManager } from './OptimizedCacheManager';
import type { Course } from '@/types/course';
import type { PerformanceMetrics } from '@/types/performance';

// 캐시 설정 타입
interface CacheConfig {
  ttl: number;
  maxSize: number;
}

// 각 데이터 타입별 캐시 설정
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  courses: {
    ttl: 5 * 60 * 1000, // 5분
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  performance: {
    ttl: 60 * 1000, // 1분
    maxSize: 20 * 1024 * 1024 // 20MB
  },
  search: {
    ttl: 10 * 60 * 1000, // 10분
    maxSize: 30 * 1024 * 1024 // 30MB
  }
};

export class CacheService {
  private static instance: CacheService;
  private courseCache: OptimizedCacheManager<Course[]>;
  private performanceCache: OptimizedCacheManager<PerformanceMetrics>;
  private searchCache: OptimizedCacheManager<any>;

  private constructor() {
    this.courseCache = new OptimizedCacheManager(CACHE_CONFIGS.courses);
    this.performanceCache = new OptimizedCacheManager(CACHE_CONFIGS.performance);
    this.searchCache = new OptimizedCacheManager(CACHE_CONFIGS.search);
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  // 과목 캐시 관련 메서드
  async getCachedCourses(key: string): Promise<Course[] | null> {
    try {
      return this.courseCache.get(key);
    } catch (error) {
      console.error('Error getting cached courses:', error);
      return null;
    }
  }

  async setCachedCourses(key: string, courses: Course[]): Promise<void> {
    try {
      await this.courseCache.set(key, courses);
    } catch (error) {
      console.error('Error setting cached courses:', error);
    }
  }

  // 성능 메트릭 캐시 메서드
  async getCachedMetrics(key: string): Promise<PerformanceMetrics | null> {
    try {
      return this.performanceCache.get(key);
    } catch (error) {
      console.error('Error getting cached metrics:', error);
      return null;
    }
  }

  async setCachedMetrics(key: string, metrics: PerformanceMetrics): Promise<void> {
    try {
      await this.performanceCache.set(key, metrics);
    } catch (error) {
      console.error('Error setting cached metrics:', error);
    }
  }

  // 검색 결과 캐시 메서드
  async getCachedSearchResults(query: string): Promise<any | null> {
    try {
      const key = this.generateSearchKey(query);
      return this.searchCache.get(key);
    } catch (error) {
      console.error('Error getting cached search results:', error);
      return null;
    }
  }

  async setCachedSearchResults(query: string, results: any): Promise<void> {
    try {
      const key = this.generateSearchKey(query);
      await this.searchCache.set(key, results);
    } catch (error) {
      console.error('Error setting cached search results:', error);
    }
  }

  // 캐시 무효화 메서드
  async invalidateCourseCache(key?: string): Promise<void> {
    if (key) {
      this.courseCache.delete(key);
    } else {
      this.courseCache.clear();
    }
  }

  async invalidatePerformanceCache(key?: string): Promise<void> {
    if (key) {
      this.performanceCache.delete(key);
    } else {
      this.performanceCache.clear();
    }
  }

  async invalidateSearchCache(query?: string): Promise<void> {
    if (query) {
      const key = this.generateSearchKey(query);
      this.searchCache.delete(key);
    } else {
      this.searchCache.clear();
    }
  }

  // 캐시 통계 조회
  getCacheStats() {
    return {
      courses: this.courseCache.getStats(),
      performance: this.performanceCache.getStats(),
      search: this.searchCache.getStats()
    };
  }

  private generateSearchKey(query: string): string {
    // 검색 쿼리 정규화 및 키 생성
    return `search:${query.toLowerCase().trim()}`;
  }
}