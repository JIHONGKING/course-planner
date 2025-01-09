import React, { useState } from 'react';
import { Wand2, AlertCircle } from 'lucide-react';
import { PlanGenerator } from '@/lib/planGenerator';
import type { Course } from '@/types/course';

interface AutoPlanGeneratorProps {
  courses: Course[];
  completedCourses: Course[];
  onPlanGenerated: (plan: any) => void;
}

export default function AutoPlanGenerator({
  courses,
  completedCourses,
  onPlanGenerated
}: AutoPlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    prioritizeGrades: true,
    balanceWorkload: true,
    includeRequirements: true,
    maxCreditsPerSemester: 15
  });

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
  
    try {
      const generator = new PlanGenerator();
      const constraints = {
        maxCreditsPerSemester: preferences.maxCreditsPerSemester,
        requiredCourses: [],
        preferredTerms: {}
      };
      
      const plan = generator.generatePlan(
        courses, 
        {
          prioritizeGrades: preferences.prioritizeGrades,
          balanceWorkload: preferences.balanceWorkload,
          includeRequirements: preferences.includeRequirements
        },
        constraints
      );
      
      onPlanGenerated(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-blue-500" />
          <h2 className="text-lg font-medium">자동 계획 생성</h2>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">선호도 설정</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.prioritizeGrades}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  prioritizeGrades: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">높은 A학점 비율 우선</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.balanceWorkload}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  balanceWorkload: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">학기별 워크로드 균형</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.includeRequirements}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  includeRequirements: e.target.checked
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">졸업 요건 고려</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            학기당 최대 학점
          </label>
          <select
            value={preferences.maxCreditsPerSemester}
            onChange={(e) => setPreferences(prev => ({
              ...prev,
              maxCreditsPerSemester: parseInt(e.target.value)
            }))}
            className="w-full rounded-md border border-gray-300 shadow-sm py-2 pl-3 pr-10 text-gray-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={12}>12학점</option>
            <option value={15}>15학점</option>
            <option value={18}>18학점</option>
          </select>
        </div>

        <div className="mt-6">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-2 px-4 rounded-md text-white flex items-center justify-center gap-2
              ${isGenerating 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                <span>생성 중...</span>
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                <span>계획 생성하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}