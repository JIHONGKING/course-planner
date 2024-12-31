// src/hooks/useAcademicPlan.ts
import { useState, useCallback, useEffect } from 'react';
import type { Course, AcademicYear } from '@/src/types/course';

const initialYears: AcademicYear[] = []; // 초기값 설정

export function useAcademicPlan() {
  const [years, setYears] = useState<AcademicYear[]>(initialYears);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const addCourse = useCallback((yearId: string, semesterId: string, course: Course) => {
    setYears(prevYears => 
      prevYears.map(year => {
        if (year.id !== yearId) return year;
        return {
          ...year,
          semesters: year.semesters.map(semester => {
            if (semester.id !== semesterId) return semester;
            return {
              ...semester,
              courses: [...semester.courses, course]
            };
          })
        };
      })
    );
  }, []);

  const removeCourse = useCallback((yearId: string, semesterId: string, courseId: string) => {
    setYears(prevYears =>
      prevYears.map(year => {
        if (year.id !== yearId) return year;
        return {
          ...year,
          semesters: year.semesters.map(semester => {
            if (semester.id !== semesterId) return semester;
            return {
              ...semester,
              courses: semester.courses.filter(course => course.id !== courseId)
            };
          })
        };
      })
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