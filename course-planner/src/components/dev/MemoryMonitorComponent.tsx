import React, { useEffect, useState } from 'react';
import { MemoryMonitor, type MemoryStats, type MemoryLeak } from '@/lib/performance/memoryMonitor';

const MemoryMonitorComponent: React.FC = () => {
  const [memoryStats, setMemoryStats] = useState<{ 
    stats: MemoryStats[]; 
    leaks: MemoryLeak[] 
  }>({ stats: [], leaks: [] });

  useEffect(() => {
    const monitor = MemoryMonitor.getInstance();
    monitor.startMonitoring();

    const unsubscribe = monitor.subscribe('memory-monitor', (data) => {
      setMemoryStats(prev => ({
        ...prev,
        stats: [...prev.stats, data.stats],
        leaks: data.leaks
      }));
    });

    return () => {
      unsubscribe();
      monitor.stopMonitoring();
    };
  }, []);

  return (
    <div>
      <h1>Memory Usage</h1>
      <ul>
        {memoryStats.stats.map((stat, index) => (
          <li key={index}>
            <strong>Used:</strong> {stat.usedJSHeapSize} bytes, 
            <strong>Total:</strong> {stat.totalJSHeapSize} bytes
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemoryMonitorComponent;