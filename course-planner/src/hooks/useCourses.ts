// src/hooks/useCourses.ts
import { useState, useCallback, useEffect } from 'react';
import type { Course } from '../types/course';

export function useCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 초기 과목 목록 로드
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/courses');
        if (!response.ok) throw new Error('Failed to fetch courses');
        const data = await response.json();
        setCourses(data.courses);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch courses'));
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const searchCourses = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/courses?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data.courses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to search courses'));
    } finally {
      setLoading(false);
    }
  }, []);

  const filterCourses = useCallback(async (
    { level, term, department }: { level?: string; term?: string; department?: string }
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (term) params.append('term', term);
      if (department) params.append('department', department);

      const response = await fetch(`/api/courses?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      const data = await response.json();
      setCourses(data.courses);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to filter courses'));
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    courses,
    loading,
    error,
    searchCourses,
    filterCourses
  };
}