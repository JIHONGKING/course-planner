// src/hooks/useAcademicPlan.ts
import { useState, useCallback } from 'react';
import type { Course, AcademicYear, Semester } from '@/types/course';

const initialYears: AcademicYear[] = [];

export function useAcademicPlan() {
  const [years, setYears] = useState<AcademicYear[]>(initialYears);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addCourse = useCallback((semester: Semester, course: Course) => {
    setYears(prevYears => 
      prevYears.map(year => ({
        ...year,
        semesters: year.semesters.map(sem => 
          sem.id === semester.id
            ? { ...sem, courses: [...sem.courses, course] }
            : sem
        )
      }))
    );
  }, []);

  const removeCourse = useCallback((semester: Semester, courseId: string) => {
    setYears(prevYears =>
      prevYears.map(year => ({
        ...year,
        semesters: year.semesters.map(sem =>
          sem.id === semester.id
            ? { ...sem, courses: sem.courses.filter(course => course.id !== courseId) }
            : sem
        )
      }))
    );
  }, []);

  const saveCourse = useCallback((course: Course) => {
    setSavedCourses(prev => [...prev, course]);
  }, []);

  const removeSavedCourse = useCallback((courseId: string) => {
    setSavedCourses(prev => prev.filter(course => course.id !== courseId));
  }, []);

  const clearSavedCourses = useCallback(() => {
    setSavedCourses([]);
  }, []);

  return {
    years,
    savedCourses,
    loading,
    error,
    addCourse,
    removeCourse,
    saveCourse,
    removeSavedCourse,
    clearSavedCourses,
  };
}