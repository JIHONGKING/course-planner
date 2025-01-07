// src/components/course-planner/CourseRecommendations.tsx

import React, { useMemo, useState } from 'react';
import { Wand2, ChevronDown, Star } from 'lucide-react';
import type { Course } from '@/types/course';
import { CourseRecommender } from '@/lib/courseRecommender';
import { usePlanner } from '@/hooks/usePlanner';
import CourseCard from '@/components/common/CourseCard';
import { useCourseData } from '@/hooks/useCourseData';  // useCourseData import 추가

interface RecommendationPreferences {
  prioritizeGrades: boolean;
  balanceWorkload: boolean;
  preferredTerms: string[];
}

export default function CourseRecommendations() {
  const { academicPlan, saveCourse } = usePlanner();
  const [preferences, setPreferences] = useState<RecommendationPreferences>({
    prioritizeGrades: true,
    balanceWorkload: true,
    preferredTerms: ['Fall', 'Spring']
  });

  const { courses: allCourses } = useCourseData();
  
  const recommendations = useMemo(() => {
    if (!allCourses.length) return [];
    
    const recommender = new CourseRecommender(
      allCourses,
      {
        id: 'current-plan',
        userId: '',
        years: academicPlan,
        savedCourses: []
      },
      {
        major: "Computer Science",
        requirements: [] // TODO: 실제 졸업 요건 데이터 필요
      }
    );

    return recommender.recommendCourses({
      prioritizeGrades: preferences.prioritizeGrades,
      balanceWorkload: preferences.balanceWorkload,
      preferredTerms: preferences.preferredTerms
    });
  }, [academicPlan, preferences]);

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-medium">추천 과목</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPreferences(prev => ({
                ...prev,
                prioritizeGrades: !prev.prioritizeGrades
              }))}
              className={`px-3 py-1 rounded-full text-sm ${
                preferences.prioritizeGrades
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              높은 학점 우선
            </button>
            <button
              onClick={() => setPreferences(prev => ({
                ...prev,
                balanceWorkload: !prev.balanceWorkload
              }))}
              className={`px-3 py-1 rounded-full text-sm ${
                preferences.balanceWorkload
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              워크로드 균형
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {recommendations.slice(0, 5).map(({ course, reasons }, index) => (
            <div key={course.id} className="relative">
              <div className="absolute -left-2 top-2 flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full text-sm">
                {index + 1}
              </div>
              <CourseCard
                course={course}
                className="pl-6"
                onAdd={() => saveCourse(course)}
                showPrerequisites
              />
              {reasons.length > 0 && (
                <div className="mt-2 ml-6 text-sm text-gray-500">
                  {reasons.map((reason, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-400" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {recommendations.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              현재 추천할 수 있는 과목이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}