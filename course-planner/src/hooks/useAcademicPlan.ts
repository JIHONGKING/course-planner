// src/hooks/useAcademicPlan.ts
import { useState, useCallback } from 'react';
import type { Course, SemesterCourse, AcademicYear, Semester } from '@/types/course';

export function useAcademicPlan() {
  const [academicPlan, setAcademicPlan] = useState<AcademicYear[]>([]);
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('Freshman');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const calculateCredits = useCallback((semesterId: string): number => {
    const semester = academicPlan
      .flatMap(year => year.semesters)
      .find(sem => sem.id === semesterId);

    if (!semester) return 0;
    return semester.courses.reduce((sum, course) => sum + course.credits, 0);
  }, [academicPlan]);

  const calculateYearCredits = useCallback((yearId: string): number => {
    const year = academicPlan.find(y => y.id === yearId);
    if (!year) return 0;

    return year.semesters.reduce(
      (sum, semester) => sum + semester.courses.reduce(
        (semSum, course) => semSum + course.credits, 0
      ), 0
    );
  }, [academicPlan]);

  const addCourse = useCallback((course: Course, semesterId: string) => {
    setAcademicPlan(prevPlan => prevPlan.map(year => ({
      ...year,
      semesters: year.semesters.map(semester => {
        if (semester.id !== semesterId) return semester;

        const semesterCourse: SemesterCourse = {
          ...course,
          semesterId
        };

        return {
          ...semester,
          courses: [...semester.courses, semesterCourse]
        };
      })
    })));
  }, []);

  const removeCourse = useCallback((courseId: string, semesterId: string) => {
    setAcademicPlan(prevPlan => prevPlan.map(year => ({
      ...year,
      semesters: year.semesters.map(semester => {
        if (semester.id !== semesterId) return semester;
        return {
          ...semester,
          courses: semester.courses.filter(course => course.id !== courseId)
        };
      })
    })));
  }, []);

  const saveCourse = useCallback((course: Course) => {
    setSavedCourses(prev => {
      if (prev.some(saved => saved.id === course.id)) {
        return prev;
      }
      return [...prev, course];
    });
  }, []);

  const removeSavedCourse = useCallback((courseId: string) => {
    setSavedCourses(prev => prev.filter(course => course.id !== courseId));
  }, []);

  const clearSemester = useCallback((semesterId: string) => {
    setAcademicPlan(prevPlan => prevPlan.map(year => ({
      ...year,
      semesters: year.semesters.map(semester => {
        if (semester.id !== semesterId) return semester;
        return {
          ...semester,
          courses: []
        };
      })
    })));
  }, []);

  const clearSavedCourses = useCallback(() => {
    setSavedCourses([]);
  }, []);

  const generatePlan = useCallback((preferences: {
    prioritizeGrades: boolean;
    balanceWorkload: boolean;
    includeRequirements: boolean;
  }) => {
    // Implementation of plan generation logic
    console.log('Generating plan with preferences:', preferences);
  }, []);

  return {
    academicPlan,
    savedCourses,
    selectedYear,
    loading,
    error,
    setSelectedYear,
    calculateCredits,
    calculateYearCredits,
    addCourse,
    removeCourse,
    saveCourse,
    removeSavedCourse,
    clearSemester,
    clearSavedCourses,
    generatePlan
  };
}
