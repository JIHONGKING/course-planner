// src/hooks/useCourseCache.ts

import { useCallback } from 'react';
import { courseCache } from '@/lib/cache';
import type { Course } from '@/types/course';

export function useCourseCache() {
  const getCachedCourse = useCallback((courseId: string): Course | null => {
    return courseCache.get<Course>(`course:${courseId}`);
  }, []);

  const setCachedCourse = useCallback((course: Course) => {
    courseCache.set(`course:${course.id}`, course);
  }, []);

  const getCachedSearchResults = useCallback((query: string) => {
    return courseCache.get<Course[]>(`search:${query}`);
  }, []);

  const setCachedSearchResults = useCallback((query: string, results: Course[]) => {
    courseCache.set(`search:${query}`, results);
  }, []);

  const invalidateSearchCache = useCallback(() => {
    courseCache.clearPattern(/^search:/);
  }, []);

  return {
    getCachedCourse,
    setCachedCourse,
    getCachedSearchResults,
    setCachedSearchResults,
    invalidateSearchCache,
  };
}