// src/components/performance/AlertPanel.tsx

import React, { useEffect, useState } from 'react';
import { Alert, AlertSystem } from '@/lib/performance/alertSystem';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AlertPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const alertSystem = AlertSystem.getInstance();
    
    // 알림 구독
    const unsubscribe = alertSystem.subscribe((alert) => {
      setAlerts(prev => [...prev, alert]);
    });

    // 초기 알림 설정
    alertSystem.setConfiguration({
      id: 'performance-threshold',
      type: 'performance',
      threshold: 1000, // 1초
      severity: 'warning',
      message: 'Operation took longer than expected'
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const renderIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Alerts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`flex items-start gap-2 p-3 rounded-lg ${
                alert.severity === 'error' ? 'bg-red-50' :
                alert.severity === 'warning' ? 'bg-yellow-50' :
                'bg-blue-50'
              }`}
            >
              {renderIcon(alert.severity)}
              <div>
                <p className="font-medium">{alert.message}</p>
                <p className="text-sm text-gray-600">
                  {new Date(alert.timestamp).toLocaleString()}
                </p>
                {alert.data && (
                  <pre className="mt-2 text-xs bg-white p-2 rounded">
                    {JSON.stringify(alert.data, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}