// src/hooks/useCourses.ts
import { useState, useCallback } from 'react';
import type { Course, FilterOptions } from '@/types/course';

type SortOrder = 'asc' | 'desc';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const getGradeA = (gradeDistribution: Course['gradeDistribution']) => {
    if (typeof gradeDistribution === 'string') {
      return parseFloat(JSON.parse(gradeDistribution).A.toString());
    }
    return parseFloat(gradeDistribution.A.toString());
  };

  const sortCourses = useCallback((coursesToSort: Course[]) => {
    if (!sortBy) return coursesToSort;

    return [...coursesToSort].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'grade':
          const aGrade = getGradeA(a.gradeDistribution);
          const bGrade = getGradeA(b.gradeDistribution);
          comparison = aGrade - bGrade;
          break;

        case 'credits':
          comparison = a.credits - b.credits;
          break;

        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;

        case 'level':
          comparison = parseInt(a.level) - parseInt(b.level);
          break;

        default:
          return 0;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [sortBy, sortOrder]);

  const searchCourses = useCallback(async (query: string, filters?: FilterOptions) => {
    if (!query.trim() && !filters) {
      setCourses([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) {
            if (Array.isArray(value)) {
              value.forEach(v => params.append(key, v));
            } else {
              params.append(key, value);
            }
          }
        });
      }

      const response = await fetch(`/api/courses?${params}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();
      const sortedCourses = sortCourses(data.courses);
      setCourses(sortedCourses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load courses');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [sortCourses]);

  const handleSortChange = useCallback((value: string) => {
    setSortBy(value);
    setCourses(prev => sortCourses(prev));
  }, [sortCourses]);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    setCourses(prev => sortCourses(prev));
  }, [sortCourses]);

  return {
    courses,
    loading,
    error,
    sortBy,
    sortOrder,
    searchCourses,
    handleSortChange,
    toggleSortOrder,
  };
}