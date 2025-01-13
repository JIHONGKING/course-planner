// src/components/dev/PerformanceAnalytics.tsx

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Info, AlertTriangle, TrendingUp } from 'lucide-react';

interface AnalyticsProps {
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
}

export default function PerformanceAnalytics({ metrics }: AnalyticsProps) {
  // 성능 점수 계산 (0-100)
  const calculatePerformanceScore = () => {
    const operations = Object.values(metrics.operations);
    if (operations.length === 0) return 0;

    const scores = operations.map(op => {
      const { stats } = op;
      // p95가 1000ms 미만이면 좋은 점수
      const p95Score = Math.max(0, 100 - (stats.p95Duration / 10));
      // 평균이 500ms 미만이면 좋은 점수
      const avgScore = Math.max(0, 100 - (stats.averageDuration / 5));
      return (p95Score + avgScore) / 2;
    });

    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  // 시간대별 성능 분포
  const getHourlyDistribution = () => {
    const distribution: Record<number, number[]> = {};
    
    Object.values(metrics.operations).forEach(op => {
      op.trend.forEach(duration => {
        const hour = new Date().getHours();
        if (!distribution[hour]) {
          distribution[hour] = [];
        }
        distribution[hour].push(duration);
      });
    });

    return Object.entries(distribution).map(([hour, durations]) => ({
      hour: parseInt(hour),
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      p95: durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)]
    }));
  };

  const performanceScore = calculatePerformanceScore();
  const hourlyData = getHourlyDistribution();

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold">
              {performanceScore}
            </div>
            <div className={`text-sm ${
              performanceScore >= 80 ? 'text-green-500' :
              performanceScore >= 60 ? 'text-yellow-500' :
              'text-red-500'
            }`}>
              {performanceScore >= 80 ? 'Good' :
               performanceScore >= 60 ? 'Needs Improvement' :
               'Poor'}
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-gray-200 rounded-full">
              <div
                className={`h-2 rounded-full ${
                  performanceScore >= 80 ? 'bg-green-500' :
                  performanceScore >= 60 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${performanceScore}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hourly Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Hour</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="average" name="Average" fill="#3b82f6" />
                <Bar dataKey="p95" name="P95" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Slow Operations */}
            {metrics.slowOperations.length > 0 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-700">
                    Slow Operations Detected
                  </h4>
                  <p className="text-sm text-yellow-600">
                    {metrics.slowOperations.length} operations exceeded the 1s threshold
                  </p>
                </div>
              </div>
            )}

            {/* Performance Trends */}
            {Object.entries(metrics.operations).map(([operation, data]) => (
              <div key={operation} className="flex items-start gap-2">
                <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-gray-700">{operation}</h4>
                  <p className="text-sm text-gray-600">
                    P95: {data.stats.p95Duration.toFixed(2)}ms, 
                    Avg: {data.stats.averageDuration.toFixed(2)}ms
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}