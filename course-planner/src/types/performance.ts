// src/types/performance.ts

export interface OperationStats {
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    totalDuration: number;
  }
  
  export interface Operation {
    stats: OperationStats;
    trend: number[];
  }
  
  export interface SlowOperation {
    operation: string;
    duration: number;
    timestamp: number;
  }
  
  export interface PerformanceMetrics {
    operations: Record<string, Operation>;
    slowOperations: SlowOperation[];
    totalOperations: number;
    totalDuration: number;
  }