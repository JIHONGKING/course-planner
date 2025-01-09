// src/hooks/useCourseSchedule.ts

import { useState, useCallback, useEffect } from 'react';
import type { Schedule } from '@/types/course';

interface UseCourseScheduleProps {
  courseId: string;
  initialSchedule?: Schedule[];
}

export function useCourseSchedule({ courseId, initialSchedule = [] }: UseCourseScheduleProps) {
  const [schedule, setSchedule] = useState<Schedule[]>(initialSchedule);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch schedule
  const fetchSchedule = useCallback(async () => {
    if (!courseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/schedule`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch schedule');
      }

      setSchedule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch schedule');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  // Update schedule
  const updateSchedule = useCallback(async (newSchedule: Schedule[]) => {
    if (!courseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/schedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSchedule),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update schedule');
      }

      setSchedule(newSchedule);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update schedule');
      throw err; // Re-throw to handle in the component
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  // Clear schedule
  const clearSchedule = useCallback(async () => {
    if (!courseId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/courses/${courseId}/schedule`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to clear schedule');
      }

      setSchedule([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear schedule');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  // Load initial schedule
  useEffect(() => {
    if (courseId && initialSchedule.length === 0) {
      fetchSchedule();
    }
  }, [courseId, initialSchedule.length, fetchSchedule]);

  return {
    schedule,
    isLoading,
    error,
    updateSchedule,
    clearSchedule,
    refreshSchedule: fetchSchedule,
  };
}