// src/hooks/useCourses.ts
import { useState, useCallback, useEffect } from 'react';
import type { Course } from '@/types/course';
import type { SortOption, SortOrder } from '@/utils/sortUtils';
import { useError } from '@/context/ErrorContext';
import { useDebounce } from '@/hooks/useDebounce';

interface UseCoursesOptions {
  initialQuery?: string;
  autoSearch?: boolean;
  debounceMs?: number;
}

interface FilterOptions {
  department?: string;
  level?: string;
  term?: string;
}

const VALID_SORT_OPTIONS = {
  gradeDistribution: 'grade',
  code: 'code',
  name: 'name',
  credits: 'credits',
  level: 'level'
} as const;

export function useCourses(options: UseCoursesOptions = {}) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(options.initialQuery || '');
  const [sortBy, setSortBy] = useState<SortOption>('grade');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<FilterOptions>({});
  
  const debouncedSearchTerm = useDebounce(searchTerm, options.debounceMs || 300);
  const { addError } = useError();

  const searchCourses = useCallback(async (query: string) => {
    if (!query.trim()) {
      setCourses([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const actualSortBy = sortBy === 'grade' ? 'gradeDistribution' : sortBy;
      
      const params = new URLSearchParams({
        query,
        page: String(currentPage),
        sortBy: actualSortBy,
        sortOrder,
        ...filters
      });

      const response = await fetch(`/api/courses?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to search courses';
      setError(errorMessage);
      addError({
        code: 'SEARCH_ERROR',
        message: errorMessage,
        severity: 'error',
        timestamp: Date.now()
      });
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, filters, addError]);

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

  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
    if (searchTerm) {
      searchCourses(searchTerm);
    }
  }, [searchTerm, searchCourses]);

  const handleFilter = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    if (searchTerm) {
      searchCourses(searchTerm);
    }
  }, [searchTerm, searchCourses]);

  useEffect(() => {
    if (options.autoSearch && debouncedSearchTerm) {
      searchCourses(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm, options.autoSearch, searchCourses]);

  return {
    courses,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    handleSort,
    handleOrderChange,
    handlePageChange,
    handleFilter
  };
}