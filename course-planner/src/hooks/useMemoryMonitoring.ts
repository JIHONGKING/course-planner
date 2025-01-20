import { useState, useCallback, useEffect } from 'react';
import { MemoryMonitor, type MemoryStats, type MemoryLeak } from '@/lib/performance/memoryMonitor';

interface UseMemoryMonitoringOptions {
  onLeak?: (leak: MemoryLeak) => void;
  warningThreshold?: number;
  monitoringInterval?: number;
  componentName?: string;
}

export function useMemoryMonitoring(options: UseMemoryMonitoringOptions = {}) {
  const [memoryData, setMemoryData] = useState<{
    stats: MemoryStats[];
    leaks: MemoryLeak[];
  }>({ stats: [], leaks: [] });
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
      const currentData = monitor.getCurrentData();
      const usageRatio = currentData.stats.usedJSHeapSize / currentData.stats.jsHeapSize;
      
      if (usageRatio > (options.warningThreshold || 0.8)) {
        console.warn(`High memory usage detected during ${name}: ${(usageRatio * 100).toFixed(1)}%`);
      }
    }
  }, [options.warningThreshold]);

  useEffect(() => {
    const unsubscribe = monitor.subscribe(
      options.componentName || 'default',
      (data) => {
        setMemoryData(prev => ({
          stats: [...prev.stats, data.stats],
          leaks: data.leaks
        }));

        if (data.leaks.length > 0 && options.onLeak) {
          data.leaks.forEach(options.onLeak);
        }
      }
    );

    monitor.startMonitoring();
    setIsMonitoring(true);

    return () => {
      unsubscribe();
      monitor.stopMonitoring();
      setIsMonitoring(false);
    };
  }, [options.componentName, options.onLeak]);

  return {
    memoryData,
    isMonitoring,
    trackOperation
  };
}