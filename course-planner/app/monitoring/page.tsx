// app/monitoring/page.tsx
'use client';

import PerformanceDashboard from '@/components/dev/PerformanceDashboard';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Performance Monitoring</h1>
      <PerformanceDashboard />
    </div>
  );
}