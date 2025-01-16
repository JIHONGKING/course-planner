// src/hooks/useSync.ts

import { useState, useEffect, useCallback } from 'react';
import { SyncManager } from '@/lib/sync/SyncManager';
import type { Course, AcademicPlan } from '@/types/course';

interface SyncStatus {
  pendingCount: number;
  failedCount: number;
  completedCount: number;
  isActive: boolean;
}

export function useSync() {
  const [status, setStatus] = useState<SyncStatus>({
    pendingCount: 0,
    failedCount: 0,
    completedCount: 0,
    isActive: false
  });

  const [error, setError] = useState<string | null>(null);
  const syncManager = SyncManager.getInstance();

  // 상태 업데이트 핸들러
  const updateStatus = useCallback(() => {
    const currentStatus = syncManager.getSyncStatus();
    setStatus({
      ...currentStatus,
      isActive: currentStatus.pendingCount > 0
    });
  }, []);

  // 에러 핸들러
  const handleSyncError = useCallback((event: CustomEvent) => {
    const { operation, error } = event.detail;
    setError(`Sync failed for ${operation.entity}: ${error}`);
  }, []);

  // 이벤트 리스너 설정
  useEffect(() => {
    window.addEventListener('sync-error', handleSyncError as EventListener);
    const statusInterval = setInterval(updateStatus, 1000);

    return () => {
      window.removeEventListener('sync-error', handleSyncError as EventListener);
      clearInterval(statusInterval);
    };
  }, [handleSyncError, updateStatus]);

  // 과목 동기화
  const syncCourse = useCallback(async (
    course: Course,
    type: 'create' | 'update' | 'delete'
  ) => {
    try {
      setError(null);
      await syncManager.syncCourse(course, type);
      updateStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync course');
    }
  }, [updateStatus]);

  // 학업 계획 동기화
  const syncAcademicPlan = useCallback(async (
    plan: AcademicPlan,
    type: 'create' | 'update' | 'delete'
  ) => {
    try {
      setError(null);
      await syncManager.syncAcademicPlan(plan, type);
      updateStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync academic plan');
    }
  }, [updateStatus]);

  // 벌크 동기화
  const syncBatch = useCallback(async (
    operations: Array<{
      entity: string;
      data: any;
      type: 'create' | 'update' | 'delete';
    }>
  ) => {
    try {
      setError(null);
      await syncManager.syncBatch(operations);
      updateStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync batch operations');
    }
  }, [updateStatus]);

  return {
    status,
    error,
    syncCourse,
    syncAcademicPlan,
    syncBatch
  };
}