// src/hooks/usePrerequisiteData.ts
import { useState, useEffect } from 'react';
import { useCourseCache } from './useCourseCache';
import type { Course } from '@/types/course';


export function usePrerequisiteData(courseId: string) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const { getCourse, setCourse } = useCourseCache();
  
    useEffect(() => {
      async function loadPrerequisites() {
        try {
          const cached = getCourse(courseId);
          if (cached) return;
  
          const response = await fetch(`/api/courses/${courseId}/prerequisites`);
          if (!response.ok) throw new Error('Failed to fetch prerequisites');
          
          const data = await response.json();
          setCourse(courseId, data);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        } finally {
          setLoading(false);
        }
      }
  
      loadPrerequisites();
    }, [courseId, getCourse, setCourse]);
  
    return { loading, error };
  }