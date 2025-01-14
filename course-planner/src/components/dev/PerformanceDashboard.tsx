// src/components/dev/PerformanceDashboard.tsx

// src/components/dev/PerformanceDashboard.tsx

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, RefreshCw, Trash2, Clock, Info, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import type { PerformanceMetrics } from '@/types/performance';
import { AlertPanel } from '../performance/AlertPanel';
import { FilterControls } from '../performance/FilterControls';
import { PerformanceFilter } from '@/lib/performance/filterSystem';
import { MemoryMonitorComponent } from '../performance/MemoryMonitor';
import { ExportControls } from '@/components/performance/ExportControls';

interface PerformanceMetricsData {
  operations: Record<string, {
    stats: {
      count: number;
      averageDuration: number;
      minDuration: number;
      maxDuration: number;
      p95Duration: number;
      totalDuration: number;
    };
    trend: number[];
  }>;
  slowOperations: Array<{
    operation: string;
    duration: number;
    timestamp: number;
  }>;
  totalOperations: number;
  totalDuration: number;
}

interface PerformanceDashboardProps {
  metrics: PerformanceMetricsData;
  isRefreshing: boolean;
  onRefresh: () => void;
  onClear: () => void;
  onToggleRefresh: () => void;
}

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down';
  className?: string;
}

function MetricCard({ title, value, unit, trend, className = '' }: MetricCardProps) {
  return (
    <Card className={`${className} hover:shadow-md transition-shadow duration-200`}>
      <CardContent className="p-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-2xl font-bold">{value.toFixed(2)}</span>
          <span className="text-gray-500 mb-1">{unit}</span>
          {trend && (
            <span className={`text-sm ${
              trend === 'up' ? 'text-red-500' : 'text-green-500'
            }`}>
              {trend === 'up' ? '↑' : '↓'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface TimelineChartProps {
  data: any[];
  category: string;
  threshold?: number;
}

function TimelineChart({ data, category, threshold }: TimelineChartProps) {
  const chartData = data.map((metric, index) => ({
    name: metric.timestamp 
      ? new Date(metric.timestamp).toLocaleTimeString() 
      : `Point ${index + 1}`,
    duration: metric.duration
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
            stroke="#6B7280"
          />
          <YAxis 
            label={{ 
              value: 'Duration (ms)', 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12 
            }}
            stroke="#6B7280"
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '0.375rem'
            }}
          />
          {threshold && (
            <Line
              type="monotone"
              dataKey={() => threshold}
              stroke="#EF4444"
              strokeDasharray="5 5"
              strokeWidth={1}
            />
          )}
          <Line
            type="monotone"
            dataKey="duration"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ r: 3, fill: '#3B82F6' }}
            activeDot={{ r: 5, fill: '#2563EB' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PerformanceDashboard({
  metrics,
  isRefreshing,
  onRefresh,
  onClear,
  onToggleRefresh
}: PerformanceDashboardProps) {
  const [filteredMetrics, setFilteredMetrics] = useState(metrics);

  const getPerformanceTrend = (data: any[], window: number = 5): "up" | "down" | undefined => {
    if (data.length < window) return undefined;
    const recent = data.slice(-window);
    const prevAvg = recent.slice(0, Math.floor(window / 2)).reduce((a, b) => a + b.duration, 0) / Math.floor(window / 2);
    const currAvg = recent.slice(-Math.floor(window / 2)).reduce((a, b) => a + b.duration, 0) / Math.floor(window / 2);
    return currAvg > prevAvg ? 'up' : 'down';
  };

  const handleFilterChange = (filters: any) => {
    const filtered = PerformanceFilter.filterMetrics(metrics, filters);
    setFilteredMetrics(filtered);
  };

  if (!metrics || Object.keys(metrics.operations).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Info className="h-8 w-8 text-blue-500" />
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Load Metrics
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* Tabs 추가 */}
      <Tabs defaultValue="overview">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleRefresh}
              className={`p-2 rounded-lg transition-colors ${
                isRefreshing 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
              title={isRefreshing ? 'Stop auto refresh' : 'Start auto refresh'}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClear}
              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
              title="Clear metrics"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <FilterControls onFilterChange={handleFilterChange} />
          <AlertPanel />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(filteredMetrics.operations).map(([category, data]) => (
              <MetricCard
                key={category}
                title={`${category.toUpperCase()} Performance`}
                value={data.stats.averageDuration}
                unit="ms"
                trend={getPerformanceTrend(data.trend)}
              />
            ))}
          </div>
        </TabsContent>

        {/* Memory Tab */}
        <TabsContent value="memory">
          <MemoryMonitorComponent />
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export">
          <ExportControls data={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
