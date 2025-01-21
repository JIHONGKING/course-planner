// src/hooks/useOptimizedSearchCourses.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import type { Course } from '@/types/course';
import type { SortOption, SortOrder } from '@/utils/sortUtils';
import { sortCourses } from '@/utils/sortUtils';
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
  const [sortBy, setSortBy] = useState<SortOption>('grade');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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
      const cacheKey = `search:${query}:${page}`;
      const cachedResults = await cacheService.getCachedSearchResults(cacheKey);

      if (cachedResults) {
        setCourses(cachedResults.courses);
        setTotalPages(cachedResults.totalPages);
        setCurrentPage(page);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/courses/search?query=${encodeURIComponent(query)}&page=${page}&limit=${itemsPerPage}`
      );

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data = await response.json();
      
      await cacheService.setCachedSearchResults(cacheKey, data);

      const sortedData = sortCourses(data.courses, sortBy, sortOrder);
      setCourses(sortedData);
      setTotalPages(data.totalPages);
      setCurrentPage(page);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setCourses([]);
    } finally {
      setIsLoading(false);
    }
  }, [itemsPerPage, sortBy, sortOrder]);

  const clearSearch = useCallback(() => {
    setCourses([]);
    setCurrentPage(1);
    setTotalPages(1);
    setSearchTerm('');
    setError(null);
  }, []);

  const handleSort = useCallback((newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    
    const sortedData = sortCourses(courses, newSortBy, sortOrder);
    setCourses(sortedData);
  }, [courses, sortBy, sortOrder]);

  const handleOrderChange = useCallback(() => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    const sortedData = sortCourses(courses, sortBy, newOrder);
    setCourses(sortedData);
  }, [courses, sortBy, sortOrder]);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    if (searchTerm) {
      searchCourses(searchTerm, page);
    }
  }, [searchTerm, searchCourses]);

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
    sortBy,
    sortOrder,
    searchCourses,
    clearSearch,
    handleSort: handleSort,
    handleOrderChange: handleOrderChange,
    handlePageChange: handlePageChange
  };
}