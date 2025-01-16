// src/components/performance/RealtimeMetrics.tsx
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Clock, AlertTriangle } from 'lucide-react';

interface RealtimeMetricsProps {
  metrics: {
    operations: Record<string, {
      stats: {
        count: number;
        averageDuration: number;
        minDuration: number;
        maxDuration: number;
        p95Duration: number;
      };
      trend: number[];
    }>;
    slowOperations: Array<{
      operation: string;
      duration: number;
      timestamp: number;
    }>;
  };
  isLive?: boolean;
}

export default function RealtimeMetrics({ metrics, isLive = false }: RealtimeMetricsProps) {
  const recentTrends = React.useMemo(() => {
    const allTrends = Object.entries(metrics.operations).map(([name, data]) => ({
      name,
      ...data
    }));

    return allTrends.map(trend => ({
      name: trend.name,
      data: trend.trend.slice(-30), // 최근 30개 데이터포인트만
      stats: trend.stats
    }));
  }, [metrics]);

  return (
    <div className="space-y-6">
      {/* 실시간 성능 지표 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Realtime Performance
            </CardTitle>
            {isLive && (
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-green-600">Live</span>
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTrends.map((trend) => (
              <div key={trend.name} className="p-4 bg-gray-50 rounded-lg">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-sm font-medium">{trend.name}</h3>
                  <span className="text-xs text-gray-500">
                    {trend.stats.count} ops
                  </span>
                </div>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trend.data.map((value, index) => ({
                      time: index,
                      value
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        tick={false}
                      />
                      <YAxis 
                        width={40}
                        tickFormatter={(value) => `${value}ms`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(2)}ms`, 'Duration']}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <span>Avg: {trend.stats.averageDuration.toFixed(2)}ms</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-yellow-400" />
                    <span>P95: {trend.stats.p95Duration.toFixed(2)}ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 느린 작업 알림 */}
          {metrics.slowOperations.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Slow Operations</h3>
              <div className="space-y-2">
                {metrics.slowOperations.map((op, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg border border-yellow-100"
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm">{op.operation}</span>
                    </div>
                    <div className="text-sm text-yellow-600">
                      {op.duration.toFixed(2)}ms
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}