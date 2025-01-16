import React, { useEffect, useState } from 'react';
import { MemoryMonitor } from '@/lib/performance/memoryMonitor';

const MemoryMonitorComponent: React.FC = () => {
  const [memoryStats, setMemoryStats] = useState(MemoryMonitor.getInstance().getMemoryStats());

  useEffect(() => {
    const monitor = MemoryMonitor.getInstance();
    monitor.startMonitoring();

    const unsubscribe = monitor.subscribe('memory-monitor', (data) => {
      setMemoryStats(data.stats);
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
        {memoryStats.map((stat, index) => (
          <li key={index}>
            <strong>Used:</strong> {stat.usedJSHeapSize} bytes, <strong>Total:</strong> {stat.totalJSHeapSize} bytes
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MemoryMonitorComponent;
