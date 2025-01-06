// src/hooks/usePlanner.ts
import { useState, useCallback } from 'react';
import type { Course } from '@/types/course';

function parseYear(yearString: string): number {
  const currentYear = new Date().getFullYear();
  switch (yearString) {
    case 'Freshman': return currentYear;
    case 'Sophomore': return currentYear + 1;
    case 'Junior': return currentYear + 2;
    case 'Senior': return currentYear + 3;
    default: return currentYear;
  }
}

interface SemesterCourse extends Course {
  semesterId: string;
}

interface Semester {
  id: string;
  year: number;
  term: string;
  courses: SemesterCourse[];
  academicYearId: string;
}

interface AcademicYear {
  id: string;
  name: string;
  yearName: string;
  year: string;
  startYear: number;
  semesters: Semester[];
}

export function usePlanner() {
  const [savedCourses, setSavedCourses] = useState<Course[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('Freshman');
  const [academicPlan, setAcademicPlan] = useState<AcademicYear[]>(() => {
    const startYear = new Date().getFullYear();
    return ['Freshman', 'Sophomore', 'Junior', 'Senior'].map((yearName, index) => ({
      id: `year-${index}`,
      name: yearName,
      yearName: yearName,
      year: `${startYear + index}-${startYear + index + 1}`,
      startYear: startYear + index,
      semesters: ['Fall', 'Spring', 'Summer'].map((term): Semester => ({
        id: `${yearName.toLowerCase()}-${term.toLowerCase()}`,
        year: startYear + index,
        term,
        academicYearId: `year-${index}`,
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

  // usePlanner.ts에 새로운 함수 추가
  
  const moveCourse = useCallback((
    courseId: string, 
    fromSemesterId: string, 
    toSemesterId: string
  ) => {
    setAcademicPlan(prev => {
      // 이동할 과목 찾기
      const course = prev
        .flatMap(year => year.semesters)
        .find(sem => sem.id === fromSemesterId)
        ?.courses.find(course => course.id === courseId);

      if (!course) return prev;

      // 동일한 과목이 이미 대상 학기에 있는지 확인
      const targetSemester = prev
        .flatMap(year => year.semesters)
        .find(sem => sem.id === toSemesterId);

      if (targetSemester?.courses.some(c => c.id === courseId)) {
        return prev;
      }

      // 과목 이동
      return prev.map(year => ({
        ...year,
        semesters: year.semesters.map(semester => {
          if (semester.id === fromSemesterId) {
            return {
              ...semester,
              courses: semester.courses.filter(c => c.id !== courseId)
            };
          }
          if (semester.id === toSemesterId) {
            return {
              ...semester,
              courses: [...semester.courses, { ...course, semesterId: toSemesterId }]
            };
          }
          return semester;
        })
      }));
    });
  }, []);
  
  // 연도별 총 학점 계산
  const calculateYearCredits = useCallback((yearId: string) => {
    const year = academicPlan.find(y => y.id === yearId);
    if (!year) return 0;
    return year.semesters.reduce((sum, semester) => 
      sum + semester.courses.reduce((total, course) => total + course.credits, 0), 0);
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
    clearSavedCourses
  };
}