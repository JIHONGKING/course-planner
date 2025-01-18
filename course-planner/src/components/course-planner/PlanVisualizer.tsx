// src/components/course-planner/PlanVisualizer.tsx
import React from 'react';
import type { AcademicPlan, Course } from '@/types/course';
import { OptimizedPlanGenerator } from '@/lib/planGenerator/OptimizedPlanGenerator'; // 경로 수정

interface PlanVisualizerProps {
  courses: Course[];
  onPlanGenerated?: (plan: AcademicPlan) => void;
}

export function PlanVisualizer({ courses, onPlanGenerated }: PlanVisualizerProps) {
  const [preferences, setPreferences] = React.useState({
    prioritizeGrades: true,
    balanceWorkload: true,
    includeRequirements: true,
  });

  const [plan, setPlan] = React.useState<AcademicPlan | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);

    try {
      const generator = new OptimizedPlanGenerator(courses);
      const newPlan = await generator.generateOptimalPlan(preferences);
      setPlan(newPlan);
      onPlanGenerated?.(newPlan);
    } catch (error) {
      console.error('Failed to generate plan:', error);
      setError('Failed to generate the academic plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Plan Preferences</h2>

        <div className="space-y-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.prioritizeGrades}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  prioritizeGrades: e.target.checked,
                }))
              }
              className="rounded border-gray-300"
            />
            <span>Prioritize High Grades</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.balanceWorkload}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  balanceWorkload: e.target.checked,
                }))
              }
              className="rounded border-gray-300"
            />
            <span>Balance Workload</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.includeRequirements}
              onChange={(e) =>
                setPreferences((prev) => ({
                  ...prev,
                  includeRequirements: e.target.checked,
                }))
              }
              className="rounded border-gray-300"
            />
            <span>Include Requirements</span>
          </label>
        </div>

        <button
          onClick={generatePlan}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>

        {error && <div className="mt-4 text-red-500">{error}</div>}
      </div>

      {plan && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Generated Plan</h2>
          {plan.years.map((year) => (
            <div key={year.id} className="mb-6">
              <h3 className="text-lg font-medium mb-2">{year.name}</h3>
              <div className="grid grid-cols-3 gap-4">
                {year.semesters.map((semester) => (
                  <div key={semester.id} className="border rounded p-4">
                    <h4 className="font-medium mb-2">{semester.term}</h4>
                    <ul className="space-y-2">
                      {semester.courses.map((course) => (
                        <li key={course.id} className="text-sm">
                          {course.code} - {course.credits} cr
                        </li>
                      ))}
                    </ul>
                    <div className="mt-2 text-sm text-gray-500">
                      Total Credits: {semester.courses.reduce(
                        (sum, c) => sum + c.credits,
                        0
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
