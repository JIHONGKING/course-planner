// src/hooks/useCourseSchedule.ts

import { useState, useCallback } from 'react';
import type { Schedule } from '@/types/schedule';

export function useCourseSchedule({ courseId, initialSchedule = [] }: {
  courseId: string;
  initialSchedule?: Schedule[];
}) {
  const [schedule, setSchedule] = useState<Schedule[]>(initialSchedule);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSchedule = async (newSchedule: Schedule[]) => {
    if (!courseId) {
      throw new Error('Course ID is required');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Updating schedule:', {
        courseId,
        newSchedule
      });

      const response = await fetch(`/api/courses/${courseId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSchedule)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to update schedule');
      }

      setSchedule(data);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule';
      console.error('Error in PUT request:', err);
      setError(errorMessage);
      throw err;

    } finally {
      setIsLoading(false);
    }
  };

  return {
    schedule,
    isLoading,
    error,
    updateSchedule
  };
}