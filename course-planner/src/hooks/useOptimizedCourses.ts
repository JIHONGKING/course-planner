// src/hooks/useOptimizedCourses.ts
import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { MemoryMonitor } from '@/lib/performance/memoryMonitor';
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
  const memoryMonitor = MemoryMonitor.getInstance();
  const cacheRef = useRef<Map<string, CacheItem<Course[]>>>(new Map());

  const searchCourses = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);

    const cacheKey = `search:${query}`;
    const cachedData = cacheRef.current.get(cacheKey);

    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      setCourses(cachedData.data);
      setLoading(false);
      return;
    }

    try {
      const startTime = performance.now();
      const response = await fetch(`/api/courses/search?query=${query}`);
      const data = await response.json();

      cacheRef.current.set(cacheKey, {
        data: data.courses,
        timestamp: Date.now(),
      });

      setCourses(data.courses);

      const endTime = performance.now();
      memoryMonitor.getCurrentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const filterCourses = useCallback(
    (
      courses: Course[],
      filters: { department?: string; level?: string; term?: string }
    ) => {
      return courses.filter((course) => {
        if (filters.department && course.department !== filters.department)
          return false;
        if (filters.level && course.level !== filters.level) return false;
        if (filters.term && !course.term.includes(filters.term)) return false;
        return true;
      });
    },
    []
  );

  const sortCourses = useCallback(
    (
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
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      });
    },
    []
  );

  const processedCourses = useMemo(() => courses, [courses]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const debouncedSearch = useMemo(() => debounce(searchCourses, 300), [
    searchCourses,
  ]);

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  return {
    courses: processedCourses,
    loading,
    error,
    searchCourses: debouncedSearch,
    filterCourses,
    sortCourses,
    clearCache,
  };
}
