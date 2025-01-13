// src/hooks/usePerformanceMonitoring.ts

import { useState, useEffect, useCallback } from 'react';
import { 
    ValidationPerformanceMonitor,
    type OperationStats 
} from '../lib/performance/validationPerformance';  // 경로 수정
  
  
interface UsePerformanceMonitoringOptions {
  autoRefreshInterval?: number;  // milliseconds
  enableAutoRefresh?: boolean;
}

export function usePerformanceMonitoring(options: UsePerformanceMonitoringOptions = {}) {
  const {
    autoRefreshInterval = 5000,
    enableAutoRefresh = false
  } = options;

  const [metrics, setMetrics] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(enableAutoRefresh);
  const [error, setError] = useState<Error | null>(null);

  const refreshMetrics = useCallback(() => {
    try {
      const monitor = ValidationPerformanceMonitor.getInstance();
      const report = monitor.generateReport();
      setMetrics(report);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh metrics'));
    }
  }, []);

  useEffect(() => {
    // 초기 로드
    refreshMetrics();

    // 자동 갱신 설정
    if (isRefreshing) {
      const interval = setInterval(refreshMetrics, autoRefreshInterval);
      return () => clearInterval(interval);
    }
  }, [isRefreshing, autoRefreshInterval, refreshMetrics]);

  const toggleRefreshing = useCallback(() => {
    setIsRefreshing(prev => !prev);
  }, []);

  const clearMetrics = useCallback(() => {
    const monitor = ValidationPerformanceMonitor.getInstance();
    monitor.clearMetrics();
    refreshMetrics();
  }, [refreshMetrics]);

  return {
    metrics,
    error,
    isRefreshing,
    toggleRefreshing,
    refreshMetrics,
    clearMetrics
  };
}