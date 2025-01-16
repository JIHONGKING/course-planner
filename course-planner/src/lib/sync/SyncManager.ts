// src/lib/sync/SyncManager.ts

import type { Course, AcademicPlan } from '@/types/course';
import { CacheService } from '@/lib/cache/CacheService';

interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
  retryCount: number;
}

export class SyncManager {
  private static instance: SyncManager;
  private pendingOperations: Map<string, SyncOperation>;
  private syncInterval: number | null = null;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly SYNC_INTERVAL = 5000; // 5 seconds
  private readonly BATCH_SIZE = 10;
  private cacheService: CacheService;

  private constructor() {
    this.pendingOperations = new Map();
    this.cacheService = CacheService.getInstance();
    this.startSyncInterval();
  }

  public static getInstance(): SyncManager {
    if (!SyncManager.instance) {
      SyncManager.instance = new SyncManager();
    }
    return SyncManager.instance;
  }

  /**
   * 과목 데이터 동기화
   */
  async syncCourse(course: Course, type: 'create' | 'update' | 'delete'): Promise<void> {
    const operationId = `course-${course.id}-${Date.now()}`;
    
    this.pendingOperations.set(operationId, {
      id: operationId,
      type,
      entity: 'course',
      data: course,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    });

    // 즉시 동기화 시도
    await this.processPendingOperations();
  }

  /**
   * 학업 계획 동기화
   */
  async syncAcademicPlan(plan: AcademicPlan, type: 'create' | 'update' | 'delete'): Promise<void> {
    const operationId = `plan-${plan.id}-${Date.now()}`;
    
    this.pendingOperations.set(operationId, {
      id: operationId,
      type,
      entity: 'academicPlan',
      data: plan,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0
    });

    await this.processPendingOperations();
  }

  /**
   * 벌크 동기화 작업
   */
  async syncBatch(operations: Array<{ entity: string; data: any; type: 'create' | 'update' | 'delete' }>): Promise<void> {
    operations.forEach(op => {
      const operationId = `${op.entity}-${Date.now()}-${Math.random()}`;
      this.pendingOperations.set(operationId, {
        id: operationId,
        type: op.type,
        entity: op.entity,
        data: op.data,
        timestamp: Date.now(),
        status: 'pending',
        retryCount: 0
      });
    });

    await this.processPendingOperations();
  }

  private startSyncInterval(): void {
    if (this.syncInterval !== null) return;

    this.syncInterval = window.setInterval(
      () => this.processPendingOperations(),
      this.SYNC_INTERVAL
    );
  }

  private async processPendingOperations(): Promise<void> {
    const operations = Array.from(this.pendingOperations.values())
      .filter(op => op.status === 'pending')
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(0, this.BATCH_SIZE);

    if (operations.length === 0) return;

    for (const operation of operations) {
      try {
        await this.processOperation(operation);
        this.pendingOperations.delete(operation.id);
        
        // 캐시 무효화
        if (operation.entity === 'course') {
          await this.cacheService.invalidateCourseCache(operation.data.id);
        }

      } catch (error) {
        console.error(`Sync operation failed: ${operation.id}`, error);
        operation.retryCount++;
        
        if (operation.retryCount >= this.MAX_RETRY_ATTEMPTS) {
          operation.status = 'failed';
          // 실패 이벤트 발생
          this.emitSyncError(operation, error);
        }
      }
    }
  }

  private async processOperation(operation: SyncOperation): Promise<void> {
    const endpoint = this.getEndpoint(operation.entity);
    const method = this.getMethod(operation.type);

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(operation.data)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    operation.status = 'completed';
  }

  private getEndpoint(entity: string): string {
    switch (entity) {
      case 'course':
        return '/api/courses';
      case 'academicPlan':
        return '/api/academic-plans';
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  private getMethod(type: 'create' | 'update' | 'delete'): string {
    switch (type) {
      case 'create':
        return 'POST';
      case 'update':
        return 'PUT';
      case 'delete':
        return 'DELETE';
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  private emitSyncError(operation: SyncOperation, error: any): void {
    const event = new CustomEvent('sync-error', {
      detail: {
        operation,
        error: error instanceof Error ? error.message : String(error)
      }
    });
    window.dispatchEvent(event);
  }

  public getSyncStatus(): {
    pendingCount: number;
    failedCount: number;
    completedCount: number;
  } {
    const operations = Array.from(this.pendingOperations.values());
    return {
      pendingCount: operations.filter(op => op.status === 'pending').length,
      failedCount: operations.filter(op => op.status === 'failed').length,
      completedCount: operations.filter(op => op.status === 'completed').length
    };
  }

  public cleanup(): void {
    if (this.syncInterval !== null) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.pendingOperations.clear();
  }
}