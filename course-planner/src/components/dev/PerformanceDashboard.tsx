// src/components/dev/PerformanceDashboard.tsx

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Activity, AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { PerformanceMetrics } from '@/types/performance';
import { AlertPanel } from '../performance/AlertPanel';
import { FilterControls } from '../performance/FilterControls';
import { ExportControls } from '../performance/ExportControls';
import MemoryMonitorComponent from '@/components/dev/MemoryMonitorComponent';

interface PerformanceDashboardProps {
  metrics?: PerformanceMetrics;
  isRefreshing?: boolean;
  onRefresh?: () => void;
  onClear?: () => void;
  onToggleRefresh?: () => void;
}

export default function PerformanceDashboard({
  metrics = { 
    operations: {}, 
    totalOperations: 0, 
    totalDuration: 0, 
    slowOperations: [] // 기본값 추가
  },
  isRefreshing = false,
  onRefresh,
  onClear,
  onToggleRefresh,
}: PerformanceDashboardProps) {

  return (
    <div className="p-6 space-y-6 bg-gray-50">
      <Tabs defaultValue="overview">
        <div className="flex justify-between items-center mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="memory">Memory</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            {onToggleRefresh && (
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
            )}
            {onClear && (
              <button
                onClick={onClear}
                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                title="Clear metrics"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        <TabsContent value="overview">
          <FilterControls onFilterChange={() => {}} />
          <AlertPanel />
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(metrics.operations || {}).map(([key, value]) => (
                <Card key={key}>
                  <CardContent>
                    <h3 className="text-sm font-medium text-gray-500">{key}</h3>
                    <div className="mt-2">
                      <p className="text-2xl font-bold">{value.stats.averageDuration.toFixed(2)} ms</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="memory">
          <MemoryMonitorComponent />
        </TabsContent>

        <TabsContent value="export">
          <ExportControls data={metrics} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
