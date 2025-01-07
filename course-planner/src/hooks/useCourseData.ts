// src/hooks/useCourseData.ts

import { useState, useEffect } from 'react';
import type { Course } from '@/types/course';

export function useCourseData() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCourses() {
      try {
        setLoading(true);
        const response = await fetch('/api/courses');
        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }
        const data = await response.json();
        setCourses(data.courses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    }

    fetchCourses();
  }, []);

  // 캐시된 과목 데이터 가져오기
  const getCourseById = (id: string) => {
    return courses.find(course => course.id === id);
  };

  // 과목 코드로 과목 가져오기
  const getCourseByCode = (code: string) => {
    return courses.find(course => course.code === code);
  };

  // 학과별 과목 필터링
  const getCoursesByDepartment = (department: string) => {
    return courses.filter(course => course.department === department);
  };

  // 레벨별 과목 필터링
  const getCoursesByLevel = (level: string) => {
    return courses.filter(course => course.level === level);
  };

  return {
    courses,
    loading,
    error,
    getCourseById,
    getCourseByCode,
    getCoursesByDepartment,
    getCoursesByLevel
  };
}