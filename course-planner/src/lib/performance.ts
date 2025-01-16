// src/lib/performance.ts

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  category: 'api' | 'render' | 'computation' | 'io';
  metadata?: Record<string, any>;
}

declare global {
  interface Performance {
    memory?: {
      jsHeapSizeLimit: number;
      totalJSHeapSize: number;
      usedJSHeapSize: number;
    };
  }
}

export interface MemoryStats {
  jsHeapSize: number;
  totalJSHeapSize: number;
  usedJSHeapSize: number;
  timestamp: number;
}

export interface MemoryLeak {
  id: string;
  type: string;
  size: number;
  timestamp: number;
  stackTrace?: string;
  source?: string;
}


interface PerformanceSummary {
  category: string;
  averageTime: number;
  maxTime: number;
  minTime: number;
  count: number;
  totalTime: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]>;
  private activeTimers: Map<string, number>;
  private readonly MAX_METRICS_PER_KEY = 100;
  private readonly SLOW_THRESHOLD = 500; // 500ms

  constructor() {
    this.metrics = new Map();
    this.activeTimers = new Map();
  }

  startTimer(name: string, category: PerformanceMetric['category'], metadata?: Record<string, any>) {
    const startTime = performance.now();
    const id = `${name}-${Date.now()}`;
    
    this.activeTimers.set(id, startTime);
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricList = this.metrics.get(name)!;
    metricList.push({
      name,
      startTime,
      category,
      metadata
    });

    // 메트릭 제한
    if (metricList.length > this.MAX_METRICS_PER_KEY) {
      metricList.shift();
    }

    return id;
  }

  endTimer(id: string): number {
    const endTime = performance.now();
    const startTime = this.activeTimers.get(id);

    if (startTime === undefined) {
      console.warn(`No active timer found for id: ${id}`);
      return 0;
    }

    const duration = endTime - startTime;
    this.activeTimers.delete(id);

    const name = id.split('-')[0];
    const metricList = this.metrics.get(name);
    
    if (metricList && metricList.length > 0) {
      const lastMetric = metricList[metricList.length - 1];
      lastMetric.endTime = endTime;
      lastMetric.duration = duration;

      // 느린 작업 감지
      if (duration > this.SLOW_THRESHOLD) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`, lastMetric.metadata);
      }
    }

    return duration;
  }

  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceSummary[] {
    const categoryMetrics: Record<string, number[]> = {};

    this.metrics.forEach((metricList, name) => {
      metricList
        .filter(metric => metric.category === category && metric.duration !== undefined)
        .forEach(metric => {
          if (!categoryMetrics[name]) {
            categoryMetrics[name] = [];
          }
          categoryMetrics[name].push(metric.duration!);
        });
    });

    return Object.entries(categoryMetrics).map(([name, durations]) => ({
      category: name,
      averageTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      maxTime: Math.max(...durations),
      minTime: Math.min(...durations),
      count: durations.length,
      totalTime: durations.reduce((a, b) => a + b, 0)
    }));
  }

  getSlowOperations(): PerformanceMetric[] {
    const slowOps: PerformanceMetric[] = [];
    
    this.metrics.forEach(metricList => {
      metricList
        .filter(metric => metric.duration && metric.duration > this.SLOW_THRESHOLD)
        .forEach(metric => slowOps.push(metric));
    });

    return slowOps.sort((a, b) => (b.duration || 0) - (a.duration || 0));
  }

  clearMetrics(category?: string) {
    if (category) {
      this.metrics.forEach((metricList, name) => {
        this.metrics.set(
          name,
          metricList.filter(metric => metric.category !== category)
        );
      });
    } else {
      this.metrics.clear();
      this.activeTimers.clear();
    }
  }

  generateReport(): Record<string, any> {
    const categories: PerformanceMetric['category'][] = ['api', 'render', 'computation', 'io'];
    const report: Record<string, any> = {};

    categories.forEach(category => {
      report[category] = this.getMetricsByCategory(category);
    });

    report.slowOperations = this.getSlowOperations();
    
    return report;
  }
}

// 싱글톤 인스턴스 생성
export const performanceMonitor = new PerformanceMonitor();

// 성능 측정 데코레이터
export function measure(category: PerformanceMetric['category']) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      const timerId = performanceMonitor.startTimer(
        `${target.constructor.name}.${propertyKey}`,
        category,
        { args }
      );
      
      const result = originalMethod.apply(this, args);

      // Promise 처리
      if (result instanceof Promise) {
        return result.finally(() => {
          performanceMonitor.endTimer(timerId);
        });
      }

      performanceMonitor.endTimer(timerId);
      return result;
    };

    return descriptor;
  };
}