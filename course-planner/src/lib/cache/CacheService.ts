// src/lib/cache/CacheService.ts

import { OptimizedCacheManager } from './OptimizedCacheManager';
import type { Course } from '@/types/course';
import type { PerformanceMetrics } from '@/types/performance';

// 캐시 설정 타입
interface CacheConfig {
  ttl: number;
  maxSize: number;
  compression?: boolean;
}

// 각 데이터 타입별 캐시 설정
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  courses: {
    ttl: 5 * 60 * 1000, // 5분
    maxSize: 50 * 1024 * 1024, // 50MB
    compression: true
  },
  performance: {
    ttl: 60 * 1000, // 1분
    maxSize: 20 * 1024 * 1024, // 20MB
    compression: false
  },
  search: {
    ttl: 10 * 60 * 1000, // 10분
    maxSize: 30 * 1024 * 1024, // 30MB
    compression: true
  }
};

interface CacheStats {
  courses: {
    hitRate: number;
    size: number;
    itemCount: number;
  };
  performance: {
    hitRate: number;
    size: number;
    itemCount: number;
  };
  search: {
    hitRate: number;
    size: number;
    itemCount: number;
  };
}

export class CacheService {
  private static instance: CacheService | null = null;
  private courseCache: OptimizedCacheManager<Course[]>;
  private performanceCache: OptimizedCacheManager<PerformanceMetrics>;
  private searchCache: OptimizedCacheManager<any>;
  private maintenanceInterval: number | null = null;

  private constructor() {
    this.courseCache = new OptimizedCacheManager(CACHE_CONFIGS.courses);
    this.performanceCache = new OptimizedCacheManager(CACHE_CONFIGS.performance);
    this.searchCache = new OptimizedCacheManager(CACHE_CONFIGS.search);
    this.startMaintenanceTask();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }


  private startMaintenanceTask(): void {
    if (typeof window === 'undefined') return;

    this.maintenanceInterval = window.setInterval(() => {
      this.performMaintenance();
    }, 5 * 60 * 1000); // 5분마다 실행
  }

  // performMaintenance 메서드 수정
private async performMaintenance(): Promise<void> {
  try {
    // prune 대신 clear 사용
    const stats = this.getCacheStats();
    if (stats.courses.size > CACHE_CONFIGS.courses.maxSize * 0.9) {
      this.courseCache.clear();
    }
    if (stats.performance.size > CACHE_CONFIGS.performance.maxSize * 0.9) {
      this.performanceCache.clear();
    }
    if (stats.search.size > CACHE_CONFIGS.search.maxSize * 0.9) {
      this.searchCache.clear();
    }
  } catch (error) {
    console.error('Cache maintenance error:', error);
  }

  }

  // 과목 캐시 관련 메서드
  async getCachedCourses(key: string): Promise<Course[] | null> {
    try {
      return await this.courseCache.get(key);
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
      return await this.performanceCache.get(key);
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
      return await this.searchCache.get(key);
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
  async invalidateCourseCache(pattern?: string | RegExp): Promise<void> {
    this.courseCache.clear();
  }
  
  async invalidatePerformanceCache(pattern?: string | RegExp): Promise<void> {
    this.performanceCache.clear();
  }
  
  async invalidateSearchCache(query?: string): Promise<void> {
    this.searchCache.clear();
  }

 // getCacheStats 메서드 수정
getCacheStats(): CacheStats {
  const courseStats = this.courseCache.getStats();
  const perfStats = this.performanceCache.getStats();
  const searchStats = this.searchCache.getStats();

  return {
    courses: {
      hitRate: courseStats.hitRate,
      size: courseStats.size,
      itemCount: courseStats.itemCount
    },
    performance: {
      hitRate: perfStats.hitRate,
      size: perfStats.size,
      itemCount: perfStats.itemCount
    },
    search: {
      hitRate: searchStats.hitRate,
      size: searchStats.size,
      itemCount: searchStats.itemCount
    }
  };
}


  // 유틸리티 메서드
  private generateSearchKey(query: string): string {
    return `search:${query.toLowerCase().trim()}`;
  }

  // 리소스 정리
  public destroy(): void {
    if (this.maintenanceInterval !== null) {
      clearInterval(this.maintenanceInterval);
      this.maintenanceInterval = null;
    }
    
    this.courseCache.clear();
    this.performanceCache.clear();
    this.searchCache.clear();
  }
}

