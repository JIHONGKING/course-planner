// src/hooks/useCourseRecommendations.ts
import { useState, useCallback } from 'react';
import { CourseRecommender, type RecommendationOptions, type RecommendationResult } from '@/lib/courseRecommender';
import type { Course } from '@/types/course';

export interface UseRecommendationsOptions {
  autoRefresh?: boolean;
  cacheResults?: boolean;
  maxResults?: number;
}

export function useCourseRecommendations(
  courses: Course[],
  completedCourses: Course[] = [],
  currentTermCourses: Course[] = [],
  options: UseRecommendationsOptions = {}
) {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recommender = new CourseRecommender(courses, completedCourses, currentTermCourses);

  const generateRecommendations = useCallback(async (preferences: RecommendationOptions) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = recommender.recommendCourses({
        ...preferences,
        maxResults: options.maxResults ?? 5
      });
      setRecommendations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations');
      console.error('Recommendation error:', err);
    } finally {
      setLoading(false);
    }
  }, [recommender, options.maxResults]);

  return {
    recommendations,
    loading,
    error,
    generateRecommendations,
  };
}