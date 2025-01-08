// src/components/dev/PerformanceDashboard.tsx

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, RefreshCw, Trash2, Clock, BarChart2 } from 'lucide-react';
import { usePerformanceDashboard } from '@/hooks/usePerformance';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  trend?: 'up' | 'down';
  className?: string;
}

function MetricCard({ title, value, unit, trend, className = '' }: MetricCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${className}`}>
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
    </div>
  );
}

interface TimelineChartProps {
  data: any[];
  category: string;
}

function TimelineChart({ data, category }: TimelineChartProps) {
  const chartData = data.map((metric) => ({
    name: new Date(metric.startTime).toLocaleTimeString(),
    duration: metric.duration
  }));

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            label={{ 
              value: 'Duration (ms)', 
              angle: -90, 
              position: 'insideLeft',
              fontSize: 12 
            }}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="duration"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function PerformanceDashboard() {
  const { 
    metrics, 
    autoRefresh, 
    generateReport, 
    clearMetrics, 
    startAutoRefresh, 
    stopAutoRefresh 
  } = usePerformanceDashboard();

  const handleRefresh = () => {
    generateReport();
  };

  const handleClear = () => {
    clearMetrics();
  };

  const toggleAutoRefresh = () => {
    if (autoRefresh) {
      stopAutoRefresh();
    } else {
      startAutoRefresh(5000);
    }
  };

  if (!metrics || Object.keys(metrics).length === 0) {
    return (
      <div className="p-4">
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Load Metrics
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-medium">Performance Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleAutoRefresh}
            className={`p-2 rounded-lg ${
              autoRefresh ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:text-blue-600'
            }`}
            title={autoRefresh ? 'Stop auto refresh' : 'Start auto refresh'}
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg"
          >
            Refresh
          </button>
          <button
            onClick={handleClear}
            className="p-2 text-gray-500 hover:text-red-500"
            title="Clear metrics"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(metrics).map(([category, data]) => {
          if (category === 'slowOperations') return null;
          
          const summary = (data as any[]).reduce(
            (acc, metric) => ({
              totalTime: acc.totalTime + metric.totalTime,
              count: acc.count + metric.count
            }),
            { totalTime: 0, count: 0 }
          );

          const avgTime = summary.count > 0 ? summary.totalTime / summary.count : 0;

          return (
            <MetricCard
              key={category}
              title={`${category.toUpperCase()} Performance`}
              value={avgTime}
              unit="ms"
              className="bg-white"
            />
          );
        })}
      </div>

      {/* Slow Operations */}
      {metrics.slowOperations && metrics.slowOperations.length > 0 && (
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <h3 className="font-medium">Slow Operations</h3>
          </div>
          <div className="space-y-2">
            {metrics.slowOperations.map((op: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-yellow-50 rounded"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <div>
                    <span className="font-medium">{op.name}</span>
                    <span className="ml-2 text-sm text-gray-500">{op.category}</span>
                  </div>
                </div>
                <span className="text-yellow-600 font-medium">
                  {op.duration.toFixed(2)}ms
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Trends */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-5 w-5 text-blue-500" />
          <h3 className="font-medium">Performance Trends</h3>
        </div>
        <div className="space-y-6">
          {Object.entries(metrics).map(([category, data]) => {
            if (category === 'slowOperations' || !Array.isArray(data)) return null;
            
            return (
              <div key={category} className="space-y-2">
                <h4 className="text-sm font-medium text-gray-600">
                  {category.toUpperCase()}
                </h4>
                <TimelineChart data={data} category={category} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}