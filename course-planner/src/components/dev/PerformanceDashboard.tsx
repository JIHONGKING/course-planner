// src/components/dev/PerformanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, Clock, Activity, Settings } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OptimizedCacheManager } from '@/lib/cache/OptimizedCacheManager';
import { CacheService } from '@/lib/cache/CacheService';
import { ValidationPerformanceMonitor } from '@/lib/performance/validationPerformance';

interface ThresholdConfig {
  warning: number;
  critical: number;
}

interface DashboardConfig {
  refreshInterval: number;
  thresholds: {
    responseTime: ThresholdConfig;
    memoryUsage: ThresholdConfig;
    errorRate: ThresholdConfig;
  };
}

export default function EnhancedPerformanceDashboard() {
  const [metrics, setMetrics] = useState<any>({});
  const [config, setConfig] = useState<DashboardConfig>({
    refreshInterval: 5000,
    thresholds: {
      responseTime: { warning: 1000, critical: 3000 },
      memoryUsage: { warning: 70, critical: 90 },
      errorRate: { warning: 5, critical: 10 }
    }
  });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const monitor = ValidationPerformanceMonitor.getInstance();
    const cacheService = CacheService.getInstance();
    
    const updateMetrics = async () => {
      const performanceReport = monitor.generateReport();
      const cacheStats = cacheService.getCacheStats();
      
      setMetrics({
        performance: performanceReport,
        cache: cacheStats,
        timestamp: Date.now()
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, config.refreshInterval);

    return () => clearInterval(interval);
  }, [config.refreshInterval]);

  const renderPerformanceMetrics = () => (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-500" />
          Response Time Metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={metrics.performance?.operations?.[0]?.trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)}ms`}
                labelFormatter={(label) => new Date(label).toLocaleString()}
              />
              <Line 
                type="monotone" 
                dataKey="duration" 
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const renderCacheMetrics = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-green-500" />
          Cache Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(metrics.cache || {}).map(([type, stats]: [string, any]) => (
            <div key={type} className="border-b pb-4">
              <h4 className="font-medium mb-2 capitalize">{type}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>Hit Rate: {(stats.hitRate * 100).toFixed(1)}%</div>
                <div>Items: {stats.totalItems}</div>
                <div>Size: {formatBytes(stats.totalSize)}</div>
                <div>Evictions: {stats.evictionCount}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const renderAlerts = () => {
    const alerts = [];
    const { performance } = metrics;

    if (performance?.slowOperations?.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${performance.slowOperations.length} slow operations detected`,
        timestamp: Date.now()
      });
    }

    return alerts.length > 0 ? (
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Active Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {alerts.map((alert, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-2 bg-white rounded border border-yellow-200"
              >
                <span className="text-yellow-700">{alert.message}</span>
                <span className="text-sm text-gray-500">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    ) : null;
  };

  const renderConfigPanel = () => (
    <Card className="absolute right-4 top-16 w-80 z-10 bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Dashboard Configuration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Refresh Interval (ms)
            </label>
            <input
              type="number"
              value={config.refreshInterval}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                refreshInterval: parseInt(e.target.value)
              }))}
              className="w-full p-2 border rounded"
            />
          </div>
          {Object.entries(config.thresholds).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={value.warning}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    thresholds: {
                      ...prev.thresholds,
                      [key]: {
                        ...prev.thresholds[key as keyof typeof prev.thresholds],
                        warning: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="p-2 border rounded"
                  placeholder="Warning"
                />
                <input
                  type="number"
                  value={value.critical}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    thresholds: {
                      ...prev.thresholds,
                      [key]: {
                        ...prev.thresholds[key as keyof typeof prev.thresholds],
                        critical: parseInt(e.target.value)
                      }
                    }
                  }))}
                  className="p-2 border rounded"
                  placeholder="Critical"
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-blue-500" />
          Performance Dashboard
        </h2>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      {showConfig && renderConfigPanel()}

      <div className="grid grid-cols-3 gap-6">
        {renderPerformanceMetrics()}
        {renderCacheMetrics()}
      </div>

      {renderAlerts()}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}