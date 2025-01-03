import { useState, useCallback } from 'react';
import type { Course } from '@/types/course';
import { sortCourses, type SortOption, type SortOrder } from '@/utils/sortUtils';

export interface FilterOptions {
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

  const searchCourses = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setCourses([]);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams({
        query: searchTerm.trim(),
        page: String(currentPage),
        sortBy,
        order: sortOrder
      });

      // Add filters to params if they exist
      if (filters.department) params.append('department', filters.department);
      if (filters.level) params.append('level', filters.level);
      if (filters.credits) params.append('credits', filters.credits);
      if (filters.term) params.append('term', filters.term);

      const response = await fetch(`/api/courses/search?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCourses(sortCourses(data.courses, sortBy, sortOrder));
      setTotalPages(data.totalPages);
      setCurrentPage(data.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, filters]);

  const handleSortChange = useCallback((newSortBy: SortOption) => {
    setSortBy(newSortBy);
    setCourses(prev => sortCourses(prev, newSortBy, sortOrder));
  }, [sortOrder]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => {
      const newOrder = prev === 'asc' ? 'desc' : 'asc';
      setCourses(prev => sortCourses(prev, sortBy, newOrder));
      return newOrder;
    });
  }, [sortBy]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handleFilterChange = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      department: '',
      level: '',
      credits: '',
      term: ''
    });
    setCurrentPage(1);
  }, []);

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