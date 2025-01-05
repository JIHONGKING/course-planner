// src/components/course-planner/ProgressTracker.tsx
import React from 'react';
import { AcademicPlan } from '@/types/course';

interface ProgressTrackerProps {
  plan: AcademicPlan;
  totalRequired: number;
}

export function ProgressTracker({ plan, totalRequired }: ProgressTrackerProps) {
  const completedCredits = React.useMemo(() => {
    return plan.years.reduce((sum, year) =>
      sum + year.semesters.reduce((semSum, sem) =>
        semSum + sem.courses.reduce((courseSum, course) =>
          courseSum + course.credits, 0), 0), 0);
  }, [plan]);

  const progress = (completedCredits / totalRequired) * 100;

  return (
    <div className="progress-tracker p-4 border rounded-lg">
      <h3 className="text-lg font-medium mb-4">Progress Tracker</h3>
      <div className="relative pt-1">
        <div className="flex mb-2 items-center justify-between">
          <div>
            <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full bg-blue-200">
              Progress
            </span>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold inline-block">
              {completedCredits}/{totalRequired} Credits
            </span>
          </div>
        </div>
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
          <div
            style={{ width: `${progress}%` }}
            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
          />
        </div>
      </div>
    </div>
  );
}