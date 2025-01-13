// src/lib/performance/validationPerformance.ts

export interface PerformanceMetric {
    operation: string;
    duration: number;
    timestamp: number;
    metadata?: Record<string, any>;
  }
  
  export interface OperationStats {
    count: number;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    totalDuration: number;
  }
  
  export class ValidationPerformanceMonitor {
    private static instance: ValidationPerformanceMonitor;
    private metrics: PerformanceMetric[] = [];
    private readonly MAX_METRICS = 1000;
    private readonly SLOW_THRESHOLD = 1000; // 1 second
  
    private constructor() {}
  
    static getInstance(): ValidationPerformanceMonitor {
      if (!ValidationPerformanceMonitor.instance) {
        ValidationPerformanceMonitor.instance = new ValidationPerformanceMonitor();
      }
      return ValidationPerformanceMonitor.instance;
    }
  
    measureOperation<T>(
      operation: string,
      fn: () => T,
      metadata?: Record<string, any>
    ): T {
      const startTime = performance.now();
      const result = fn();
      const endTime = performance.now();
  
      this.addMetric({
        operation,
        duration: endTime - startTime,
        timestamp: Date.now(),
        metadata,
      });
  
      return result;
    }
  
    async measureAsyncOperation<T>(
      operation: string,
      fn: () => Promise<T>,
      metadata?: Record<string, any>
    ): Promise<T> {
      const startTime = performance.now();
      const result = await fn();
      const endTime = performance.now();
  
      this.addMetric({
        operation,
        duration: endTime - startTime,
        timestamp: Date.now(),
        metadata,
      });
  
      return result;
    }
  
    private addMetric(metric: PerformanceMetric): void {
      this.metrics.push(metric);
      if (this.metrics.length > this.MAX_METRICS) {
        this.metrics.shift();
      }
    }
  
    getMetrics(options: {
      operation?: string;
      startTime?: number | null;
      endTime?: number | null;
    } = {}): PerformanceMetric[] {
      return this.metrics.filter((metric) => {
        if (options.operation && metric.operation !== options.operation) {
          return false;
        }
  
        const startTime = options.startTime ?? -Infinity;
        const endTime = options.endTime ?? Infinity;
  
        return metric.timestamp >= startTime && metric.timestamp <= endTime;
      });
    }
  
    getOperationStats(operation: string): OperationStats {
      const metrics = this.getMetrics({ operation });
  
      if (metrics.length === 0) {
        return {
          count: 0,
          averageDuration: 0,
          minDuration: 0,
          maxDuration: 0,
          p95Duration: 0,
          totalDuration: 0,
        };
      }
  
      const durations = metrics.map((m) => m.duration).sort((a, b) => a - b);
      const p95Index = Math.floor(durations.length * 0.95);
  
      return {
        count: metrics.length,
        averageDuration:
          durations.reduce((a, b) => a + b, 0) / metrics.length,
        minDuration: durations[0],
        maxDuration: durations[durations.length - 1],
        p95Duration: durations[p95Index],
        totalDuration: durations.reduce((a, b) => a + b, 0),
      };
    }
  
    clearMetrics(): void {
      this.metrics = [];
    }
  
    generateReport(): {
      operations: Record<
        string,
        {
          stats: OperationStats;
          trend: number[];
        }
      >;
      totalOperations: number;
      totalDuration: number;
      slowOperations: PerformanceMetric[];
    } {
      const operations = new Set(this.metrics.map((m) => m.operation));
      const report: Record<string, any> = {};
  
      operations.forEach((operation) => {
        const stats = this.getOperationStats(operation);
        const metrics = this.getMetrics({ operation });
        const trend = metrics.slice(-10).map((m) => m.duration);
  
        report[operation] = { stats, trend };
      });
  
      return {
        operations: report,
        totalOperations: this.metrics.length,
        totalDuration: this.metrics.reduce((sum, m) => sum + m.duration, 0),
        slowOperations: this.metrics
          .filter((m) => m.duration > this.SLOW_THRESHOLD)
          .sort((a, b) => b.duration - a.duration),
      };
    }
  }
  
  // Usage Example
  function demonstrateUsage(): void {
    const monitor = ValidationPerformanceMonitor.getInstance();
  
    // Synchronous operation measurement
    const result = monitor.measureOperation(
      'syncOperation',
      () => {
        // Synchronous logic
        return 'result';
      },
      { additionalInfo: 'metadata' }
    );
  
    // Asynchronous operation measurement
    const asyncDemo = async () => {
      const asyncResult = await monitor.measureAsyncOperation(
        'asyncOperation',
        async () => {
          // Asynchronous logic
          return 'async result';
        }
      );
  
      // Retrieve operation stats
      const stats = monitor.getOperationStats('syncOperation');
      console.log('Operation stats:', stats);
  
      // Generate full report
      const report = monitor.generateReport();
      console.log('Performance report:', report);
    };
  
    // Execute async example
    void asyncDemo();
  }
  