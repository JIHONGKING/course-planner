// src/hooks/useAdvancedCourseSearch.ts

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { CacheService } from '@/lib/cache/CacheService';
import type { Course } from '@/types/course';
import type { SortOption } from '@/utils/sortUtils';

export interface SearchFilters {
  department?: string;
  level?: string;
  credits?: number;
  term?: string[];
  minimumGrade?: number;
  maximumWorkload?: number;
}

export interface SearchOptions {
  filters: SearchFilters;
  sort: {
    by: SortOption;
    order: 'asc' | 'desc';
  };
  page: number;
  limit: number;
}

export function useAdvancedCourseSearch(initialOptions?: Partial<SearchOptions>) {
  // 상태 관리
  const [searchQuery, setSearchQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [options, setOptions] = useState<SearchOptions>({
    filters: {},
    sort: {
      by: 'grade',
      order: 'desc'
    },
    page: 1,
    limit: 20,
    ...initialOptions
  });

  const debouncedSearchTerm = useDebounce(searchQuery, 300);
  const cacheService = CacheService.getInstance();

  const searchCourses = useCallback(async () => {
    if (!debouncedSearchTerm.trim()) {
      setCourses([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 캐시 확인
      const cacheKey = `${debouncedSearchTerm}:${JSON.stringify(options)}`;
      const cached = await cacheService.getCachedSearchResults(cacheKey);

      if (cached) {
        setCourses(cached.courses);
        setIsLoading(false);
        return;
      }

      // 쿼리 파라미터 구성
      const params = new URLSearchParams({
        query: debouncedSearchTerm,
        page: String(options.page),
        limit: String(options.limit),
        sortBy: options.sort.by,
        sortOrder: options.sort.order
      });

      // 필터 추가
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, String(value));
          }
        }
      });

      const response = await fetch(`/api/courses/search?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      
      // 결과 캐싱
      await cacheService.setCachedSearchResults(cacheKey, data);

      setCourses(data.courses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearchTerm, options, cacheService]);

  // 검색어 변경 시 자동 검색
  useEffect(() => {
    searchCourses();
  }, [debouncedSearchTerm, options, searchCourses]);

  const updateFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    setOptions(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        ...newFilters
      },
      page: 1 // 필터 변경 시 첫 페이지로 리셋
    }));
  }, []);

  const updateSort = useCallback((by: SortOption, order?: 'asc' | 'desc') => {
    setOptions(prev => ({
      ...prev,
      sort: {
        by,
        order: order || (by === prev.sort.by ? 
          (prev.sort.order === 'asc' ? 'desc' : 'asc') : 
          'desc'
        )
      }
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setOptions(prev => ({
      ...prev,
      page
    }));
  }, []);

  return {
    courses,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    filters: options.filters,
    sort: options.sort,
    page: options.page,
    updateFilters,
    updateSort,
    setPage
  };
}