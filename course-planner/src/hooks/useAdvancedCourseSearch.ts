// src/hooks/useAdvancedCourseSearch.ts

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { courseCache } from '@/lib/cache';
import type { Course } from '@/types/course';
import { sortCourses, type SortOption } from '@/utils/sortUtils';

interface CacheEntry {
  courses: Course[];
  total: number;
  timestamp: number;
}

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
  const [searchTerm, setSearchTerm] = useState('');
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

  const [courses, setCourses] = useState<Course[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const searchCourses = useCallback(async () => {
    if (!debouncedSearchTerm.trim()) {
      setCourses([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First try to get from cache
      const cacheKey = `search:${debouncedSearchTerm}:${JSON.stringify(options)}`;
      const cached = courseCache.get<CacheEntry>(cacheKey);

      if (cached) {
        setCourses(cached.courses);
        setTotalResults(cached.total);
        setLoading(false);
        return;
      }

      // Build query parameters
      const queryParams = new URLSearchParams({
        query: debouncedSearchTerm,
        page: options.page.toString(),
        limit: options.limit.toString(),
        sortBy: options.sort.by,
        sortOrder: options.sort.order
      });

      // Add filter parameters
      if (options.filters.department) queryParams.append('department', options.filters.department);
      if (options.filters.level) queryParams.append('level', options.filters.level);
      if (options.filters.credits) queryParams.append('credits', options.filters.credits.toString());
      if (options.filters.term?.length) options.filters.term.forEach(t => queryParams.append('term', t));
      if (options.filters.minimumGrade) queryParams.append('minGrade', options.filters.minimumGrade.toString());
      if (options.filters.maximumWorkload) queryParams.append('maxWorkload', options.filters.maximumWorkload.toString());

      const response = await fetch(`/api/courses/search?${queryParams}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      
      // Cache the results
      courseCache.set(cacheKey, {
        courses: data.courses,
        total: data.total,
        timestamp: Date.now()
      });

      setCourses(data.courses);
      setTotalResults(data.total);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
      setCourses([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchTerm, options]);

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
      page: 1 // Reset page when filters change
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
    searchTerm,
    setSearchTerm,
    courses,
    totalResults,
    loading,
    error,
    filters: options.filters,
    sort: options.sort,
    page: options.page,
    totalPages: Math.ceil(totalResults / options.limit),
    updateFilters,
    updateSort,
    setPage
  };
}