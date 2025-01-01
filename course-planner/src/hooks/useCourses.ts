// src/hooks/useCourses.ts
import { useState, useCallback } from 'react';
import type { Course } from '../types/course';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const searchCourses = useCallback(async (query: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (query) {
        params.append('query', query);
      }

      const response = await fetch(`/api/courses?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }

      const data = await response.json();
      setCourses(data.courses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  const filterCourses = useCallback((filters: { 
    department?: string;
    level?: string;
    term?: string;
  }) => {
    return courses.filter(course => {
      if (filters.department && course.department !== filters.department) return false;
      if (filters.level && course.level !== filters.level) return false;
      if (filters.term && !course.term.includes(filters.term)) return false;
      return true;
    });
  }, [courses]);

  return {
    courses,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    searchCourses,
    filterCourses,
  };
}