// src/components/performance/MemoryMonitor.tsx

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Activity } from 'lucide-react';
import { MemoryMonitor, type MemoryStats, type MemoryLeak } from '@/lib/performance/memoryMonitor';

const formatBytes = (bytes: number) => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
};

export function MemoryMonitorComponent() {
  const [memoryStats, setMemoryStats] = useState<MemoryStats[]>([]);
  const [memoryLeaks, setMemoryLeaks] = useState<MemoryLeak[]>([]);

  useEffect(() => {
    const monitor = MemoryMonitor.getInstance();
    
    const unsubscribe = monitor.subscribe((stats) => {
      setMemoryStats(monitor.getMemoryStats());
      setMemoryLeaks(monitor.getMemoryLeaks());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Memory Usage Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Memory Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={memoryStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={(timestamp) => new Date(timestamp).toLocaleTimeString()}
                />
                <YAxis
                  tickFormatter={formatBytes}
                />
                <Tooltip
                  labelFormatter={(timestamp) => new Date(Number(timestamp)).toLocaleString()}
                  formatter={(value: any) => formatBytes(Number(value))}
                />
                <Line
                  type="monotone"
                  dataKey="usedJSHeapSize"
                  stroke="#3B82F6"
                  name="Used Heap"
                />
                <Line
                  type="monotone"
                  dataKey="totalJSHeapSize"
                  stroke="#6B7280"
                  name="Total Heap"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Memory Leaks */}
      {memoryLeaks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Potential Memory Leaks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {memoryLeaks.map((leak) => (
                <div
                  key={leak.id}
                  className="p-4 bg-yellow-50 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Memory Growth Detected</span>
                    <span className="text-sm text-gray-600">
                      {new Date(leak.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-yellow-700">
                    Size: {formatBytes(leak.size)}
                  </p>
                  {leak.stackTrace && (
                    <pre className="mt-2 text-xs bg-white p-2 rounded overflow-x-auto">
                      {leak.stackTrace}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}