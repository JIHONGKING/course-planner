// src/lib/performance.ts

interface PerformanceMetric {
    startTime: number;
    endTime?: number;
    duration?: number;
    metadata?: Record<string, any>;
  }
  
  class PerformanceMonitor {
    private metrics: Map<string, PerformanceMetric[]>;
    private activeTimers: Map<string, number>;
    private readonly MAX_METRICS_PER_KEY = 100;
  
    constructor() {
      this.metrics = new Map();
      this.activeTimers = new Map();
    }
  
    startTimer(key: string, metadata?: Record<string, any>): void {
      const startTime = performance.now();
      this.activeTimers.set(key, startTime);
      
      // 메트릭 초기화
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      
      const metrics = this.metrics.get(key)!;
      metrics.push({
        startTime,
        metadata
      });
  
      // 메트릭 제한
      if (metrics.length > this.MAX_METRICS_PER_KEY) {
        metrics.shift();
      }
    }
  
    endTimer(key: string): number {
      const endTime = performance.now();
      const startTime = this.activeTimers.get(key);
  
      if (startTime === undefined) {
        console.warn(`No active timer found for key: ${key}`);
        return 0;
      }
  
      const duration = endTime - startTime;
      this.activeTimers.delete(key);
  
      const metrics = this.metrics.get(key);
      if (metrics && metrics.length > 0) {
        const lastMetric = metrics[metrics.length - 1];
        lastMetric.endTime = endTime;
        lastMetric.duration = duration;
      }
  
      return duration;
    }
  
    getMetrics(key: string) {
      return this.metrics.get(key) || [];
    }
  
    getAverageTime(key: string): number {
      const metrics = this.metrics.get(key);
      if (!metrics || metrics.length === 0) return 0;
  
      const completedMetrics = metrics.filter(m => m.duration !== undefined);
      if (completedMetrics.length === 0) return 0;
  
      const total = completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
      return total / completedMetrics.length;
    }
  
    clearMetrics(key?: string): void {
      if (key) {
        this.metrics.delete(key);
        this.activeTimers.delete(key);
      } else {
        this.metrics.clear();
        this.activeTimers.clear();
      }
    }
  
    getReport(): Record<string, any> {
      const report: Record<string, any> = {};
      
      this.metrics.forEach((metrics, key) => {
        const completedMetrics = metrics.filter(m => m.duration !== undefined);
        
        report[key] = {
          count: completedMetrics.length,
          averageTime: this.getAverageTime(key),
          totalTime: completedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0),
          lastDuration: completedMetrics[completedMetrics.length - 1]?.duration,
          metadata: completedMetrics[completedMetrics.length - 1]?.metadata
        };
      });
  
      return report;
    }
  }
  
  export const performanceMonitor = new PerformanceMonitor();
  
  // 성능 측정을 위한 데코레이터
  export function measure(key: string) {
    return function (
      target: any,
      propertyKey: string,
      descriptor: PropertyDescriptor
    ) {
      const originalMethod = descriptor.value;
  
      descriptor.value = function (...args: any[]) {
        performanceMonitor.startTimer(key, { args });
        const result = originalMethod.apply(this, args);
  
        // Promise 처리
        if (result instanceof Promise) {
          return result.finally(() => {
            performanceMonitor.endTimer(key);
          });
        }
  
        performanceMonitor.endTimer(key);
        return result;
      };
  
      return descriptor;
    };
  }