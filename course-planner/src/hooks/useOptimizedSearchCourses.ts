// src/hooks/useOptimizedSearchCourses.ts

import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { CacheService } from '@/lib/cache/CacheService';
import type { Course } from '@/types/course';
import type { SortOption } from '@/utils/sortUtils';

export interface SearchOptions {
  initialQuery?: string;
  debounceTime?: number;
  autoSearch?: boolean;
  cacheResults?: boolean;
}

export function useOptimizedSearchCourses(options: SearchOptions = {}) {
  const {
    initialQuery = '',
    debounceTime = 300,
    autoSearch = true,
    cacheResults = true
  } = options;

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>('grade');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const debouncedSearchTerm = useDebounce(searchTerm, debounceTime);
  const cacheService = CacheService.getInstance();

  const searchCourses = useCallback(async (
    query: string,
    page: number = 1
  ) => {
    if (!query.trim()) {
      setCourses([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 캐시된 결과 확인
      if (cacheResults) {
        const cachedResults = await cacheService.getCachedSearchResults(
          `${query}:${page}:${sortBy}:${sortOrder}`
        );
        if (cachedResults) {
          setCourses(cachedResults.courses);
          setTotalPages(cachedResults.totalPages);
          setIsLoading(false);
          return;
        }
      }

      // API 호출
      const response = await fetch(
        `/api/courses/search?query=${encodeURIComponent(query)}&page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search courses');
      }

      const data = await response.json();
      
      // 결과 캐싱
      if (cacheResults) {
        await cacheService.setCachedSearchResults(
          `${query}:${page}:${sortBy}:${sortOrder}`,
          data
        );
      }

      setCourses(data.courses);
      setTotalPages(data.totalPages || 1);
      setCurrentPage(page);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [sortBy, sortOrder, cacheResults]);

  // 자동 검색 처리
  useEffect(() => {
    if (autoSearch && debouncedSearchTerm) {
      searchCourses(debouncedSearchTerm, 1);
    }
  }, [debouncedSearchTerm, searchCourses, autoSearch]);

  // 정렬 처리
  const handleSort = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    if (searchTerm) {
      // 정렬 변경 시 캐시 무효화
      if (cacheResults) {
        cacheService.invalidateSearchCache(searchTerm);
      }
      searchCourses(searchTerm, currentPage);
    }
  }, [searchTerm, currentPage, cacheResults]);

  const handleOrderChange = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    if (searchTerm) {
      // 정렬 순서 변경 시 캐시 무효화
      if (cacheResults) {
        cacheService.invalidateSearchCache(searchTerm);
      }
      searchCourses(searchTerm, currentPage);
    }
  }, [searchTerm, currentPage, cacheResults]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (searchTerm) {
      searchCourses(searchTerm, page);
    }
  }, [searchTerm, searchCourses]);

  return {
    courses,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    currentPage,
    totalPages,
    sortBy,
    sortOrder,
    handleSort,
    handleOrderChange,
    handlePageChange,
    searchCourses
  };
}