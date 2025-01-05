// src/components/course-planner/PlanGenerator.tsx
import React, { useState } from 'react';
import { PlanGenerator } from '@/lib/planGenerator';
import type { Course, AcademicPlan } from '@/types/course';


interface PlanGeneratorProps {
  availableCourses: Course[];
  onPlanGenerated: (plan: AcademicPlan) => void;
}

export function PlanGeneratorComponent({ availableCourses, onPlanGenerated }: PlanGeneratorProps) {
  const [preferences, setPreferences] = useState({
    prioritizeGrades: true,
    balanceWorkload: true,
    includeRequirements: true
  });

  const handleGenerate = () => {
    const generator = new PlanGenerator();
    const plan = generator.generatePlan(
      availableCourses,
      preferences,
      {
        maxCreditsPerSemester: 15,
        requiredCourses: [],
        preferredTerms: {}
      }
    );
    onPlanGenerated(plan);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={preferences.prioritizeGrades}
            onChange={e => setPreferences(prev => ({
              ...prev,
              prioritizeGrades: e.target.checked
            }))}
            className="rounded border-gray-300"
          />
          <span>Prioritize High Grades</span>
        </label>
        {/* 다른 선호도 옵션들 */}
      </div>

      <button
        onClick={handleGenerate}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Generate Plan
      </button>
    </div>
  );
}