// src/hooks/useCachedData.ts

import { useState, useEffect, useCallback } from 'react';
import { courseCache, performanceCache } from '@/lib/cache/OptimizedCacheManager';
import { cachedCourseApi, cachedPerformanceApi } from '@/lib/api/cachedApi';
import type { Course } from '@/types/course';
import type { SearchCoursesResponse, MetricsResponse } from '@/types/api';


interface UseCachedDataOptions {
  ttl?: number;
  skipCache?: boolean;
}

export function useCachedCourses(options: UseCachedDataOptions = {}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const searchCourses = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    try {
      const result = await cachedCourseApi.searchCourses(query) as SearchCoursesResponse;  // 타입 캐스팅 추가
      setCourses(result.courses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch courses'));
    } finally {
      setLoading(false);
    }
}, []);

  const invalidateCache = useCallback(() => {
    courseCache.clearPattern(/^search:/);
  }, []);

  return {
    courses,
    loading,
    error,
    searchCourses,
    invalidateCache
  };
}

export function useCachedPerformance(options: UseCachedDataOptions = {}) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [metricsData, slowOps] = await Promise.all([
        cachedPerformanceApi.getMetrics() as Promise<MetricsResponse>,  // 타입 캐스팅 추가
        cachedPerformanceApi.getSlowOperations() as Promise<MetricsResponse['slowOperations']>
      ]);

      setMetrics({
        ...metricsData as Record<string, unknown>,  // 타입 캐스팅 추가
        slowOperations: slowOps
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch metrics'));
    } finally {
      setLoading(false);
    }
}, []);

  const invalidateCache = useCallback(() => {
    performanceCache.clear();
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    fetchMetrics,
    invalidateCache
  };
}