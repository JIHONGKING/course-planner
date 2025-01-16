// src/hooks/useMemoryMonitoring.ts

import { useState, useEffect, useCallback } from 'react';
import { MemoryMonitor, MemoryStats } from '@/lib/performance/memoryMonitor';

interface UseMemoryMonitoringOptions {
  onLeak?: (leak: any) => void;
  warningThreshold?: number;  // percentage of heap size (0-100)
  monitoringInterval?: number;  // milliseconds
}

export function useMemoryMonitoring(options: UseMemoryMonitoringOptions = {}) {
  const [memoryStats, setMemoryStats] = useState<MemoryStats[]>([]);
  const [detectedLeaks, setDetectedLeaks] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const monitor = MemoryMonitor.getInstance();

  useEffect(() => {
    const handleMemoryLeak = (event: CustomEvent) => {
      const leak = event.detail;
      setDetectedLeaks(prev => [...prev, leak]);
      options.onLeak?.(leak);
    };

    // 메모리 누수 이벤트 리스너 등록
    window.addEventListener('memory-leak', handleMemoryLeak as EventListener);

    return () => {
      window.removeEventListener('memory-leak', handleMemoryLeak as EventListener);
    };
  }, [options.onLeak]);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    // 모니터링 시작 시 기존 통계 가져오기
    setMemoryStats(monitor.getMemoryStats());
  }, []);

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
    monitor.stopMonitoring();
  }, []);

  const clearLeaks = useCallback(() => {
    setDetectedLeaks([]);
  }, []);

  useEffect(() => {
    if (isMonitoring) {
      const intervalId = setInterval(() => {
        setMemoryStats(monitor.getMemoryStats());
      }, options.monitoringInterval || 5000);

      return () => clearInterval(intervalId);
    }
  }, [isMonitoring, options.monitoringInterval]);

  return {
    memoryStats,
    detectedLeaks,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    clearLeaks
  };
}