//src/components/course-planner/CourseRecommendations.tsx


import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wand2, Star, BookOpen, ListChecks } from 'lucide-react';
import { useCourseRecommendations } from '@/hooks/useCourseRecommendations';
import { getGradeA } from '@/utils/gradeUtils';
import type { Course } from '@/types/course';

interface RecommendationCardProps {
  course: Course;
  score: number;
  reasons: string[];
  onSelect?: (course: Course) => void;
}

const RecommendationCard = ({ course, score, reasons, onSelect }: RecommendationCardProps) => {
  // 성적 데이터 메모이제이션
  const gradeA = useMemo(() => getGradeA(course.gradeDistribution), [course.gradeDistribution]);

  return (
    <div
      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onSelect?.(course)}
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium text-gray-900">{course.code}</h4>
          <p className="text-sm text-gray-500">{course.name}</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Score: {score.toFixed(1)}
        </Badge>
      </div>

      <div className="mt-2">
        <div className="flex items-center gap-2 text-sm">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-gray-600">A Grade: {gradeA}%</span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1">
          <BookOpen className="h-4 w-4 text-blue-500" />
          <span className="text-gray-600">{course.credits} Credits</span>
        </div>
      </div>

      {reasons.length > 0 && (
        <div className="mt-3 space-y-1">
          {reasons.map((reason, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-gray-500">
              <ListChecks className="h-3 w-3" />
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function CourseRecommender({ 
  courses,
  completedCourses = [],
  currentTermCourses = [],
  onSelectCourse
}: {
  courses: Course[];
  completedCourses?: Course[];
  currentTermCourses?: Course[];
  onSelectCourse?: (course: Course) => void;
}) {
  const {
    recommendations,
    loading,
    error,
    generateRecommendations
  } = useCourseRecommendations(courses, completedCourses, currentTermCourses);

  // 필터 및 설정 상태
  const [preferences, setPreferences] = React.useState({
    prioritizeGrades: true,
    balanceWorkload: true,
    includeRequirements: true,
    maxCreditsPerTerm: 15,
    preferredDays: ['MON', 'WED', 'FRI'] as string[] // readonly 제거
  });

  // 추천 생성 핸들러
  const handleGenerateRecommendations = () => {
    generateRecommendations({
      prioritizeGrades: preferences.prioritizeGrades,
      balanceWorkload: preferences.balanceWorkload,
      includeRequirements: preferences.includeRequirements,
      maxCreditsPerTerm: preferences.maxCreditsPerTerm,
      preferredTerms: preferences.preferredDays
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5 text-blue-500" />
          Course Recommendations
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Preferences Controls */}
        <div className="mb-4 space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.prioritizeGrades}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                prioritizeGrades: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm">Prioritize High Grades</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.balanceWorkload}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                balanceWorkload: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm">Balance Workload</span>
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preferences.includeRequirements}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                includeRequirements: e.target.checked
              }))}
              className="rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm">Include Requirements</span>
          </label>
        </div>

        {/* Generate Button */}
        <button
          onClick={handleGenerateRecommendations}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                     flex items-center justify-center gap-2 mb-4"
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4" />
              <span>Generate Recommendations</span>
            </>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Recommendations List */}
        <div className="space-y-3">
          {recommendations.map(({ course, score, reasons }) => (
            <RecommendationCard
              key={course.id}
              course={course}
              score={score}
              reasons={reasons}
              onSelect={onSelectCourse}
            />
          ))}

          {!loading && recommendations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No recommendations available. Try adjusting your preferences.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}