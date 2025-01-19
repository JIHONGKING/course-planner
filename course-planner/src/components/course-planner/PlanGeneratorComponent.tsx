// src/components/course-planner/PlanGeneratorComponent.tsx
import React from 'react';
import { OptimizedPlanGenerator } from '@/lib/planGenerator/OptimizedPlanGenerator';
import type { Course } from '@/types/course';

interface PlanGeneratorComponentProps {
  courses: Course[];
  onPlanGenerated: (plan: any) => void;
}

export default function PlanGeneratorComponent({ courses, onPlanGenerated }: PlanGeneratorComponentProps) {
  const handleGeneratePlan = () => {
    const generator = new OptimizedPlanGenerator(courses);
    const plan = generator.generateOptimalPlan({
      prioritizeGrades: true,
      balanceWorkload: true,
      includeRequirements: true
    });
    onPlanGenerated(plan);
  };

  return (
    <div>
      <button 
        onClick={handleGeneratePlan}
        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
      >
        Generate Plan
      </button>
    </div>
  );
}