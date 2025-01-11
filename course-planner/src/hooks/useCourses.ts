// src/hooks/useCourses.ts

import { useState, useCallback, useEffect } from 'react';
import type { Course } from '@/types/course';
import type { SortOption, SortOrder } from '@/utils/sortUtils';
import type { FilterOptions } from '@/components/ui/FilterSection';

export function useCourses(options: { autoSearch?: boolean } = {}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('grade');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const searchCourses = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCourses([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/search?query=${encodeURIComponent(query)}&page=${currentPage}&sortBy=${sortBy}&sortOrder=${sortOrder}`
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search courses');
      }
      
      setCourses(data.courses);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, sortBy, sortOrder]);

  const handleSort = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    if (searchTerm) {
      searchCourses(searchTerm);
    }
  }, [searchTerm, searchCourses]);

  const handleOrderChange = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    if (searchTerm) {
      searchCourses(searchTerm);
    }
  }, [searchTerm, searchCourses]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (searchTerm) {
      searchCourses(searchTerm);
    }
  }, [searchTerm, searchCourses]);

  const handleFilter = useCallback((filterOptions: FilterOptions) => {
    // Implement filter logic here
    if (searchTerm) {
      searchCourses(searchTerm);
    }
  }, [searchTerm, searchCourses]);

  useEffect(() => {
    if (options.autoSearch && searchTerm) {
      const timer = setTimeout(() => {
        searchCourses(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, options.autoSearch, searchCourses]);

  return {
    courses,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    handleSort,
    handleFilter,
    handlePageChange,
    handleOrderChange,
    searchCourses
  };
}