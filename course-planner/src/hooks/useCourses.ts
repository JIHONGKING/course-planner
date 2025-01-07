// src/hooks/useCourses.ts

import { useState, useCallback } from 'react';
import { useCourseCache } from './useCourseCache';
import type { Course } from '@/types/course';
import type { SortOption, SortOrder } from '@/utils/sortUtils';
import { sortCourses } from '@/utils/sortUtils';

interface FilterOptions {
  department: string;
  level: string;
  credits: string;
  term: string;
}

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('grade');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({
    department: '',
    level: '',
    credits: '',
    term: ''
  });

  const {
    getCachedSearchResults,
    setCachedSearchResults,
    invalidateSearchCache
  } = useCourseCache();

  const searchCourses = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCourses([]);
      return;
    }

    // 캐시 키 생성 (검색어 + 필터 + 정렬 조건)
    const cacheKey = JSON.stringify({
      search: searchTerm,
      filters,
      sort: { by: sortBy, order: sortOrder },
      page: currentPage
    });

    // 캐시된 결과 확인
    const cachedResults = getCachedSearchResults(cacheKey);
    if (cachedResults) {
      setCourses(cachedResults);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 쿼리 파라미터 구성
      const params = new URLSearchParams({
        query: searchTerm,
        page: String(currentPage),
        sortBy,
        order: sortOrder,
        ...filters
      });

      const response = await fetch(`/api/courses/search?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // 결과 정렬 및 캐싱
      const sortedCourses = sortCourses(data.courses, sortBy, sortOrder);
      setCachedSearchResults(cacheKey, sortedCourses);
      
      setCourses(sortedCourses);
      setTotalPages(data.totalPages || 1);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, sortOrder, currentPage, getCachedSearchResults, setCachedSearchResults]);

  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    try {
      setCourses(prev => sortCourses(prev, newSortBy, sortOrder));
    } catch (err) {
      console.error('Error sorting courses:', err);
    }
  }, [sortOrder]);

  const toggleSortOrder = useCallback(() => {
    try {
      setSortOrder(prev => {
        const newOrder = prev === 'asc' ? 'desc' : 'asc';
        setCourses(prevCourses => sortCourses(prevCourses, sortBy, newOrder));
        return newOrder;
      });
    } catch (err) {
      console.error('Error toggling sort order:', err);
    }
  }, [sortBy]);

  const handlePageChange = useCallback((page: number) => {
    try {
      setCurrentPage(page);
      invalidateSearchCache();
    } catch (err) {
      console.error('Error changing page:', err);
    }
  }, [invalidateSearchCache]);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    try {
      setFilters(newFilters);
      setCurrentPage(1);
      invalidateSearchCache();
    } catch (err) {
      console.error('Error changing filters:', err);
    }
  }, [invalidateSearchCache]);

  const clearFilters = useCallback(() => {
    try {
      setFilters({
        department: '',
        level: '',
        credits: '',
        term: ''
      });
      setCurrentPage(1);
      invalidateSearchCache();
    } catch (err) {
      console.error('Error clearing filters:', err);
    }
  }, [invalidateSearchCache]);

  return {
    courses,
    loading,
    error,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    filters,
    searchCourses,
    handleSortChange,
    toggleSortOrder,
    handlePageChange,
    handleFilterChange,
    clearFilters
  };
}