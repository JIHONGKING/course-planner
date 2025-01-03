// src/hooks/useSearchCourses.ts
import { useState } from 'react';
import type { Course } from '@/types/course';

interface SearchResults {
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
}

export function useSearchCourses() {
  const [results, setResults] = useState<SearchResults>({
    courses: [],
    total: 0,
    page: 1,
    totalPages: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchCourses = async (query: string, page = 1) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/courses/search?query=${encodeURIComponent(query)}&page=${page}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search courses');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    ...results,
    isLoading,
    error,
    searchCourses
  };
}