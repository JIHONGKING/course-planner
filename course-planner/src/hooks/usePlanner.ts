// src/hooks/usePlanner.ts
import { useState, useCallback } from 'react';
import type { Course } from '@/types/course';

interface SemesterCourse extends Course {
  semesterId: string;
}

interface Semester {
  id: string;
  year: number;
  term: string;
  courses: SemesterCourse[];
}

interface AcademicYear {
  id: string;
  name: string;
  year: string;
  semesters: Semester[];
}

export function usePlanner() {
  // 저장된 코스 목록
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  // 현재 선택된 학년
  const [selectedYear, setSelectedYear] = useState<string>('Freshman');
  // 학업 계획 데이터
  const [academicPlan, setAcademicPlan] = useState<AcademicYear[]>(() => {
    const startYear = new Date().getFullYear();
    return ['Freshman', 'Sophomore', 'Junior', 'Senior'].map((year, index) => ({
      id: `year-${index}`,
      name: year,
      year: `${year} Year (${startYear + index}-${startYear + index + 1})`,
      semesters: ['Fall', 'Spring', 'Summer'].map((term) => ({
        id: `${year.toLowerCase()}-${term.toLowerCase()}`,
        year: startYear + index,
        term,
        courses: []
      }))
    }));
  });

  const clearSavedCourses = useCallback(() => {
    setSavedCourses([]);
  }, []);

  // 학기별 학점 계산
  const calculateCredits = useCallback((semesterId: string) => {
    const semester = academicPlan
      .flatMap(year => year.semesters)
      .find(sem => sem.id === semesterId);
    
    if (!semester) return 0;
    return semester.courses.reduce((sum, course) => sum + course.credits, 0);
  }, [academicPlan]);

  // 연도별 총 학점 계산
  const calculateYearCredits = useCallback((yearId: string) => {
    const year = academicPlan.find(y => y.id === yearId);
    if (!year) return 0;
    return year.semesters.reduce((sum, semester) => 
      sum + semester.courses.reduce((semSum, course) => semSum + course.credits, 0), 0);
  }, [academicPlan]);

  // 코스 추가
  const addCourse = useCallback((course: Course, semesterId: string) => {
    setAcademicPlan(prev => prev.map(year => ({
      ...year,
      semesters: year.semesters.map(semester => {
        if (semester.id !== semesterId) return semester;
        
        // 학점 제한 체크 (18학점)
        const currentCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
        if (currentCredits + course.credits > 18) {
          throw new Error('Cannot exceed 18 credits per semester');
        }
        
        return {
          ...semester,
          courses: [...semester.courses, { ...course, semesterId }]
        };
      })
    })));
  }, []);

  // 코스 제거
  const removeCourse = useCallback((courseId: string, semesterId: string) => {
    setAcademicPlan(prev => prev.map(year => ({
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

  // 코스 저장
  const saveCourse = useCallback((course: Course) => {
    setSavedCourses(prev => {
      // 중복 체크
      if (prev.some(saved => saved.id === course.id)) {
        return prev;
      }
      return [...prev, course];
    });
  }, []);

  // 저장된 코스 제거
  const removeSavedCourse = useCallback((courseId: string) => {
    setSavedCourses(prev => prev.filter(course => course.id !== courseId));
  }, []);

  // 학기 초기화
  const clearSemester = useCallback((semesterId: string) => {
    setAcademicPlan(prev => prev.map(year => ({
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

  // 자동 계획 생성
  const generatePlan = useCallback((preferences: {
    prioritizeGrades: boolean;
    balanceWorkload: boolean;
    includeRequirements: boolean;
  }) => {
    // 현재는 콘솔에만 출력
    console.log('Generating plan with preferences:', preferences);
    // TODO: 실제 계획 생성 로직 구현
  }, []);

  return {
    savedCourses,
    selectedYear,
    academicPlan,
    setSelectedYear,
    calculateCredits,
    calculateYearCredits,
    addCourse,
    removeCourse,
    saveCourse,
    removeSavedCourse,
    clearSemester,
    generatePlan,
    clearSavedCourses,  
    setSavedCourses,
  };
}