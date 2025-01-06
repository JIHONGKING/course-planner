import React, { useState } from 'react';
import { Wand2, Sparkles, AlertCircle } from 'lucide-react';
import type { Course } from '@/types/course';
import { PlanGenerator } from '@/lib/planGenerator';

interface AutoPlanGeneratorProps {
  courses: Course[];
  onPlanGenerated: (plan: any) => void;
}

export default function AutoPlanGenerator({ courses, onPlanGenerated }: AutoPlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    prioritizeGrades: true,
    balanceWorkload: true,
    includeRequirements: true,
    maxCreditsPerSemester: 15,
    preferredTerms: {} as Record<string, string[]>
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generator = new PlanGenerator();
      const plan = generator.generatePlan(courses, {
        prioritizeGrades: preferences.prioritizeGrades,
        balanceWorkload: preferences.balanceWorkload,
        includeRequirements: preferences.includeRequirements
      }, {
        maxCreditsPerSemester: preferences.maxCreditsPerSemester,
        requiredCourses: [],
        preferredTerms: preferences.preferredTerms
      });

      onPlanGenerated(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-medium">Auto Plan Generator</h2>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white
            ${isGenerating 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700'}`}
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate Plan</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Preferences</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.prioritizeGrades}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  prioritizeGrades: e.target.checked
                }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">Prioritize courses with higher A grades</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.balanceWorkload}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  balanceWorkload: e.target.checked
                }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">Balance workload across semesters</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.includeRequirements}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  includeRequirements: e.target.checked
                }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-600">Include degree requirements</span>
            </label>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Constraints</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Maximum credits per semester
              </label>
              <select
                value={preferences.maxCreditsPerSemester}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  maxCreditsPerSemester: parseInt(e.target.value)
                }))}
                className="w-full rounded-md border border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
              >
                <option value={12}>12 credits</option>
                <option value={15}>15 credits</option>
                <option value={18}>18 credits</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}