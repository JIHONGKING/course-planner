// src/hooks/useOptimizedCourses.ts

import { useState, useCallback, useRef, useMemo } from 'react';
import { usePerformanceMonitoring } from './usePerformance';
import type { Course } from '@/types/course';
import debounce from 'lodash/debounce';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export function useOptimizedCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, CacheItem<Course[]>>>(new Map());
  const { trackOperation } = usePerformanceMonitoring('useOptimizedCourses');

  // 캐시 유효성 검사
  const isValidCache = useCallback((key: string): boolean => {
    const cached = cacheRef.current.get(key);
    if (!cached) return false;
    return Date.now() - cached.timestamp < CACHE_DURATION;
  }, []);

  // 메모이제이션된 검색 함수
  const searchCourses = useCallback(
    debounce(async (query: string) => {
      // 캐시 체크
      if (isValidCache(query)) {
        const cached = cacheRef.current.get(query);
        if (cached) {
          setCourses(cached.data);
          return;
        }
      }

      setLoading(true);
      setError(null);

      try {
        await trackOperation(
            'searchCourses',
            'api', // category 추가됨
            async () => {          const response = await fetch(`/api/courses/search?query=${encodeURIComponent(query)}`);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Search failed');
          }

          // 결과 캐시 및 상태 업데이트
          cacheRef.current.set(query, {
            data: data.courses,
            timestamp: Date.now()
          });
          setCourses(data.courses);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }, 300),
    [trackOperation, isValidCache]
  );

  // 메모이제이션된 필터링 함수
  const filterCourses = useCallback((
    courses: Course[],
    filters: { department?: string; level?: string; term?: string }
  ) => {
    return courses.filter(course => {
      if (filters.department && course.department !== filters.department) return false;
      if (filters.level && course.level !== filters.level) return false;
      if (filters.term && !course.term.includes(filters.term)) return false;
      return true;
    });
  }, []);

  // 메모이제이션된 정렬 함수
  const sortCourses = useCallback((
    courses: Course[],
    sortBy: string,
    sortOrder: 'asc' | 'desc'
  ) => {
    return [...courses].sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'credits':
          comparison = a.credits - b.credits;
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        // 추가 정렬 기준...
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, []);

  // 메모이제이션된 과목 목록
  const processedCourses = useMemo(() => {
    return courses;
  }, [courses]);

  // 캐시 정리
  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  return {
    courses: processedCourses,
    loading,
    error,
    searchCourses,
    filterCourses,
    sortCourses,
    clearCache
  };
}