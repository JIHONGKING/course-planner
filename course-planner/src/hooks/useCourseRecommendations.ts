// src/hooks/useCourseRecommendations.ts
import { useState, useCallback } from 'react';
import type { Course } from '@/types/course';
import { CourseRecommender } from '@/lib/courseRecommender';

export function useCourseRecommendations(
  courses: Course[],
  completedCourses: Course[] = [],
  currentTermCourses: Course[] = []
) {
  const [recommendations, setRecommendations] = useState<Array<{
    course: Course;
    score: number;
    reasons: string[];
  }>>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = useCallback(async (options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const recommender = new CourseRecommender(
        courses,
        completedCourses,
        currentTermCourses
      );

      const results = recommender.recommendCourses(options);
      setRecommendations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : '추천 생성 중 오류 발생');
    } finally {
      setLoading(false);
    }
  }, [courses, completedCourses, currentTermCourses]);

  return {
    recommendations,
    loading,
    error,
    generateRecommendations
  };
}