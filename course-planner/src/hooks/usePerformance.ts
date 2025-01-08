// src/hooks/usePerformance.ts

import { useEffect, useRef, useCallback, useState } from 'react';
import { performanceMonitor } from '@/lib/performance';

export function usePerformanceMonitoring(componentName: string) {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(0);
  const [isMonitoring, setIsMonitoring] = useState(false);

  useEffect(() => {
    renderCount.current++;
    const timerId = performanceMonitor.startTimer(
      `${componentName}.render`,
      'render',
      { 
        renderCount: renderCount.current,
        timestamp: Date.now()
      }
    );

    return () => {
      const duration = performanceMonitor.endTimer(timerId);
      lastRenderTime.current = duration;
    };
  });

  const trackOperation = useCallback((
    name: string,
    category: 'api' | 'computation' | 'io',
    operation: () => Promise<any>,
    metadata?: Record<string, any>
  ) => {
    const timerId = performanceMonitor.startTimer(
      `${componentName}.${name}`,
      category,
      {
        ...metadata,
        timestamp: Date.now(),
        componentName
      }
    );

    return operation().finally(() => {
      performanceMonitor.endTimer(timerId);
    });
  }, [componentName]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    performanceMonitor.clearMetrics();
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  const getMetrics = useCallback(() => {
    return {
      renderCount: renderCount.current,
      lastRenderTime: lastRenderTime.current,
      fullMetrics: performanceMonitor.generateReport()
    };
  }, []);

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
    isMonitoring,
    trackOperation,
    startMonitoring,
    stopMonitoring,
    getMetrics
  };
}

// 성능 대시보드용 Hook
export function usePerformanceDashboard() {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshInterval = useRef<NodeJS.Timeout>();

  const generateReport = useCallback(() => {
    const report = performanceMonitor.generateReport();
    setMetrics(report);
    return report;
  }, []);

  const clearMetrics = useCallback((category?: string) => {
    performanceMonitor.clearMetrics(category);
    generateReport();
  }, [generateReport]);

  const startAutoRefresh = useCallback((intervalMs: number = 5000) => {
    setAutoRefresh(true);
    refreshInterval.current = setInterval(generateReport, intervalMs);
  }, [generateReport]);

  const stopAutoRefresh = useCallback(() => {
    setAutoRefresh(false);
    if (refreshInterval.current) {
      clearInterval(refreshInterval.current);
      refreshInterval.current = undefined;
    }
  }, []);

  useEffect(() => {
    generateReport();
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [generateReport]);

  return {
    metrics,
    autoRefresh,
    generateReport,
    clearMetrics,
    startAutoRefresh,
    stopAutoRefresh
  };
}