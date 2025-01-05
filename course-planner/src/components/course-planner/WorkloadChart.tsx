// src/components/course-planner/WorkloadChart.tsx
import React from 'react';
import { AcademicPlan } from '@/types/course';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface WorkloadChartProps {
  plan: AcademicPlan;
}

export function WorkloadChart({ plan }: WorkloadChartProps) {
  const workloadData = plan.years.flatMap(year =>
    year.semesters.map(semester => ({
      term: `${year.name} ${semester.term}`,
      credits: semester.courses.reduce((sum, c) => sum + c.credits, 0)
    }))
  );

  return (
    <div className="workload-chart p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-4">Semester Workload</h3>
      <div style={{ width: '100%', height: 300 }}>
        <LineChart data={workloadData}>
          <XAxis dataKey="term" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="credits" stroke="#8884d8" />
        </LineChart>
      </div>
    </div>
  );
}