// src/hooks/useMemoryMonitoring.ts
import { useState, useEffect, useCallback } from 'react';
import { MemoryMonitor, MemoryStats } from '@/lib/performance/memoryMonitor';

interface UseMemoryMonitoringOptions {
  onLeak?: (leak: any) => void;
  warningThreshold?: number;  // percentage of heap size (0-100)
  monitoringInterval?: number;  // milliseconds
  componentName?: string;
}

export function useMemoryMonitoring(options: UseMemoryMonitoringOptions = {}) {
  const [memoryStats, setMemoryStats] = useState<MemoryStats[]>([]);
  const [detectedLeaks, setDetectedLeaks] = useState<any[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const monitor = MemoryMonitor.getInstance();

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
      monitor.collectStats({
        name: options.componentName ? `${options.componentName}.${name}` : name,
        duration,
        category,
        timestamp: Date.now()
      });
    }
  }, [options.componentName]);

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

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
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
    clearLeaks,
    trackOperation
  };
}
