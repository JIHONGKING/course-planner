// src/hooks/useRealtime.ts

import { useEffect, useCallback } from 'react';
import { realtimeSync } from '@/lib/realtime';
import type { Course } from '@/types/course';

export function useRealtime() {
  useEffect(() => {
    const unsubscribeCourse = realtimeSync.subscribe('course', (event) => {
      console.log('Course update received:', event);
      // 여기서 상태 업데이트 로직 구현
    });

    const unsubscribePlan = realtimeSync.subscribe('plan', (event) => {
      console.log('Plan update received:', event);
      // 여기서 계획 업데이트 로직 구현
    });

    return () => {
      unsubscribeCourse();
      unsubscribePlan();
    };
  }, []);

  const publishUpdate = useCallback((
    type: 'course' | 'plan' | 'semester',
    action: 'add' | 'update' | 'delete',
    data: any
  ) => {
    realtimeSync.publish({
      type,
      action,
      data,
      timestamp: Date.now()
    });
  }, []);

  return { publishUpdate };
}