// src/components/course-planner/PlanGenerator.tsx
import React, { useState, useCallback } from 'react';
import { Wand2, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import { PlanGenerator as PlanGeneratorLib } from '@/lib/planGenerator';
import type { Course, AcademicPlan } from '@/types/course';

interface PlanGeneratorProps {
  courses: Course[];
  onPlanGenerated: (plan: AcademicPlan) => void;
  maxCreditsPerSemester?: number;
  requiredCourses?: string[];
}

const PlanGenerator = ({
  courses,
  onPlanGenerated,
  maxCreditsPerSemester = 18,
  requiredCourses = []
}: PlanGeneratorProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState({
    prioritizeGrades: true,
    balanceWorkload: true,
    includeRequirements: true,
    preferredTerms: {} as Record<string, string[]>
  });

  const [preview, setPreview] = useState<{
    totalCredits: number;
    estimatedGPA: number;
    semesters: number;
  } | null>(null);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const generator = new PlanGeneratorLib();
      const plan = generator.generatePlan(courses, {
        prioritizeGrades: preferences.prioritizeGrades,
        balanceWorkload: preferences.balanceWorkload,
        includeRequirements: preferences.includeRequirements
      }, {
        maxCreditsPerSemester,
        requiredCourses,
        preferredTerms: preferences.preferredTerms
      });

      // 계획 프리뷰 생성
      const totalCredits = plan.years.reduce((total, year) => 
        total + year.semesters.reduce((semTotal, sem) =>
          semTotal + sem.courses.reduce((courseTotal, course) =>
            courseTotal + course.credits, 0), 0), 0);

      const estimatedGPA = plan.years.reduce((total, year) => {
        const yearGPA = year.semesters.reduce((semTotal, sem) => {
          const semGPA = sem.courses.reduce((courseTotal, course) => {
            const gradeData = typeof course.gradeDistribution === 'string'
              ? JSON.parse(course.gradeDistribution)
              : course.gradeDistribution;
            // A를 4.0, AB를 3.5 등으로 변환하여 계산
            return courseTotal + (parseFloat(gradeData.A) * 4.0 + 
                               parseFloat(gradeData.AB) * 3.5 + 
                               parseFloat(gradeData.B) * 3.0) / 100 * course.credits;
          }, 0);
          return semTotal + semGPA;
        }, 0);
        return total + yearGPA;
      }, 0) / totalCredits;

      setPreview({
        totalCredits,
        estimatedGPA,
        semesters: plan.years.reduce((total, year) => total + year.semesters.length, 0)
      });

      onPlanGenerated(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  }, [courses, preferences, maxCreditsPerSemester, requiredCourses, onPlanGenerated]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-medium">Course Plan Generator</h2>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white transition
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

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Preferences */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Planning Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.prioritizeGrades}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                prioritizeGrades: e.target.checked
              }))}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <span className="text-sm text-gray-900">Prioritize Higher Grades</span>
              <p className="text-xs text-gray-500">
                Prefer courses with higher historical A grades
              </p>
            </div>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.balanceWorkload}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                balanceWorkload: e.target.checked
              }))}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <span className="text-sm text-gray-900">Balance Workload</span>
              <p className="text-xs text-gray-500">
                Distribute course difficulty evenly
              </p>
            </div>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={preferences.includeRequirements}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                includeRequirements: e.target.checked
              }))}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <div>
              <span className="text-sm text-gray-900">Include Requirements</span>
              <p className="text-xs text-gray-500">
                Prioritize required courses for your major
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Constraints */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-700">Planning Constraints</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Maximum credits per semester
            </label>
            <select
              value={maxCreditsPerSemester}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                maxCreditsPerSemester: parseInt(e.target.value)
              }))}
              className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 
                        focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value={12}>12 credits</option>
              <option value={15}>15 credits</option>
              <option value={18}>18 credits</option>
            </select>
          </div>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mt-6 p-4 bg-purple-50 rounded-lg">
          <h3 className="text-sm font-medium text-purple-900 mb-3">Plan Preview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-semibold text-purple-600">
                {preview.totalCredits}
              </p>
              <p className="text-sm text-purple-900">Total Credits</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-purple-600">
                {preview.estimatedGPA.toFixed(2)}
              </p>
              <p className="text-sm text-purple-900">Estimated GPA</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-semibold text-purple-600">
                {preview.semesters}
              </p>
              <p className="text-sm text-purple-900">Semesters</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanGenerator;