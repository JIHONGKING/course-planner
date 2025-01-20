// src/hooks/useOptimizedSearchCourses.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Course } from '@/types/course';
import { CacheService } from '@/lib/cache/CacheService';

interface SearchOptions {
  autoSearch?: boolean;
  debounceTime?: number;
  itemsPerPage?: number;
}

export function useOptimizedSearchCourses(options: SearchOptions = {}) {
  const {
    autoSearch = true,
    debounceTime = 300,
    itemsPerPage = 10
  } = options;

  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const cacheService = CacheService.getInstance();

  const searchCourses = useCallback(async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setCourses([]);
      setTotalPages(1);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cacheKey = `search:${query}:${page}`;
      const cachedResults = await cacheService.getCachedSearchResults(cacheKey);

      if (cachedResults) {
        setCourses(cachedResults.courses);
        setTotalPages(cachedResults.totalPages);
        setCurrentPage(page);
        setIsLoading(false);
        return;
      }

      // Fetch from API
      const response = await fetch(
        `/api/courses/search?query=${encodeURIComponent(query)}&page=${page}&limit=${itemsPerPage}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      // Cache the results
      await cacheService.setCachedSearchResults(cacheKey, data);

      setCourses(data.courses);
      setTotalPages(data.totalPages);
      setCurrentPage(page);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage]);

  const clearSearch = useCallback(() => {
    setCourses([]);
    setCurrentPage(1);
    setTotalPages(1);
    setSearchTerm('');
    setError(null);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    courses,
    isLoading,
    error,
    currentPage,
    totalPages,
    searchTerm,
    setSearchTerm,
    searchCourses,
    clearSearch
  };
}