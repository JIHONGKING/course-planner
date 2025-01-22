// src/hooks/useMemoryMonitoring.ts

import { useState, useEffect, useCallback } from 'react';
import { MemoryMonitor } from '@/lib/performance/memoryMonitor';

interface UseMemoryMonitoringOptions {
  componentName: string;
  warningThreshold?: number;
  monitoringInterval?: number;
  onLeak?: (leak: any) => void;
}

interface OperationMetrics {
  name: string;
  duration: number;
  category: 'api' | 'computation' | 'io';
  timestamp: number;
}

export function useMemoryMonitoring(options: UseMemoryMonitoringOptions) {
  const [memoryStats, setMemoryStats] = useState<any[]>([]);
  const [detectedLeaks, setDetectedLeaks] = useState<any[]>([]);
  const monitor = MemoryMonitor.getInstance();

  // trackOperation 수정
  const trackOperation = useCallback(async <T>(
    name: string,
    category: 'api' | 'computation' | 'io',
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      return await operation();
    } finally {
      const duration = performance.now() - startTime;
      // 직접 메모리 상태 업데이트
      setMemoryStats(prev => [...prev.slice(-29), {
        name: `${options.componentName}.${name}`,
        duration,
        category,
        timestamp: Date.now()
      }]);
    }
  }, [options.componentName]);

  // 메모리 리크 감지 이벤트 핸들러
  useEffect(() => {
    const handleMemoryLeak = (event: CustomEvent) => {
      const leak = event.detail;
      setDetectedLeaks(prev => [...prev, leak]);
      options.onLeak?.(leak);
    };

    window.addEventListener('memory-leak', handleMemoryLeak as EventListener);

    return () => {
      window.removeEventListener('memory-leak', handleMemoryLeak as EventListener);
    };
  }, [options.onLeak]);

  // 모니터링 인터벌
  useEffect(() => {
    let intervalId: number | undefined = undefined;

    intervalId = window.setInterval(() => {
      setMemoryStats(monitor.getMemoryStats().slice(-30));
    }, options.monitoringInterval || 5000);

    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [options.monitoringInterval]);

  return {
    memoryStats,
    detectedLeaks,
    trackOperation
  };
}