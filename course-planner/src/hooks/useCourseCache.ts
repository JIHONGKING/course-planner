// src/hooks/useCourseCache.ts

import { useMemo, useCallback } from 'react';
import type { Course } from '@/types/course';


export function useCourseCache() {
  const cache = useMemo(() => new Map<string, Course>(), []);
  const coursesByDept = useMemo(() => new Map<string, Course[]>(), []);

  const getCourse = useCallback((id: string) => cache.get(id), [cache]);
  const setCourse = useCallback((id: string, course: Course) => {
    cache.set(id, course);
  }, [cache]);

  const getCoursesByDepartment = useCallback((dept: string) => {
    return coursesByDept.get(dept) || [];
  }, [coursesByDept]);

  return {
    getCourse,
    setCourse,
    getCoursesByDepartment
  };
}