// src/components/course-planner/AutoPlanGenerator.tsx
import React, { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { OptimizedPlanGenerator } from '@/lib/planGenerator/OptimizedPlanGenerator';
import { useCourseData } from '@/hooks/useCourseData';
import type { Course, AcademicPlan } from '@/types/course';

interface AutoPlanGeneratorProps {
  onPlanGenerated: (plan: AcademicPlan) => void;
}

export default function AutoPlanGenerator({ onPlanGenerated }: AutoPlanGeneratorProps) {
  const { courses } = useCourseData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState({
    prioritizeGrades: true,
    balanceWorkload: true,
    includeRequirements: true
  });

  const handleGeneratePlan = async () => {
    if (!courses.length) return;
    
    setIsGenerating(true);
    try {
      // OptimizedPlanGenerator 인스턴스 생성 시 courses 전달
      const generator = new OptimizedPlanGenerator(courses);
      
      // generateOptimalPlan 메서드 호출 시 preferences 전달
      const plan = generator.generateOptimalPlan(preferences);
      
      onPlanGenerated(plan);
    } catch (error) {
      console.error('Failed to generate plan:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-blue-500" />
          Auto Plan Generator
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
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
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.balanceWorkload}
                onChange={e => setPreferences(prev => ({
                  ...prev,
                  balanceWorkload: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <span>Balance Workload</span>
            </label>
            
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.includeRequirements}
                onChange={e => setPreferences(prev => ({
                  ...prev,
                  includeRequirements: e.target.checked
                }))}
                className="rounded border-gray-300"
              />
              <span>Include Requirements</span>
            </label>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={isGenerating}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Plan
              </>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}