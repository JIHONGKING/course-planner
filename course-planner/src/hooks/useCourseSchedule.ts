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
      const response = await fetch(`/api/courses/${courseId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSchedule)
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || data.details || 'Failed to update schedule';
        throw new Error(errorMessage);
      }

      setSchedule(data);
      return data;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update schedule';
      setError(errorMessage);
      throw error;

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