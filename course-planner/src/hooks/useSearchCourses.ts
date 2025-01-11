// src/hooks/useSearchCourses.tsuseSearchCourses

import { useState, useCallback } from 'react';
import type { Course } from '@/types/course';
import type { SortOption } from '@/utils/sortUtils';

export function useSearchCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const searchCourses = useCallback(async (query: string, currentPage: number = 1) => {
    if (!query.trim()) {
      setCourses([]);
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/search?query=${encodeURIComponent(query)}&page=${currentPage}`
      );
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to search courses');
      }
      
      setCourses(data.courses);
      setTotalPages(data.totalPages || 1);
      setPage(currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    courses,
    isLoading,
    error,
    searchCourses,
    currentPage: page,
    totalPages,
    searchTerm,
    setSearchTerm
  };
}