// src/components/course-planner/CourseRecommendations.tsx

import React, { useMemo, useState } from 'react';
import { Wand2, ChevronDown, Star, Info, Filter } from 'lucide-react';
import type { Course } from '@/types/course';
import { PlanGenerator } from '@/lib/planGenerator';
import { usePlanner } from '@/hooks/usePlanner';
import { useCourseData } from '@/hooks/useCourseData';
import CourseCard from '@/components/common/CourseCard';

interface RecommendationPreferences {
  prioritizeGrades: boolean;
  balanceWorkload: boolean;
  includeMajorReqs: boolean;
  preferredTerms: string[];
  maxCreditsPerTerm: number;
}

export default function CourseRecommendations() {
  const { academicPlan, saveCourse } = usePlanner();
  const { courses: allCourses, loading, error } = useCourseData();
  
  const [preferences, setPreferences] = useState<RecommendationPreferences>({
    prioritizeGrades: true,
    balanceWorkload: true,
    includeMajorReqs: true,
    preferredTerms: ['Fall', 'Spring'],
    maxCreditsPerTerm: 15
  });

  const [selectedTerm, setSelectedTerm] = useState<string>('Fall');
  const [showFilters, setShowFilters] = useState(false);

  // 추천 과목 계산
  const recommendations = useMemo(() => {
    if (!allCourses.length || loading) return [];
    
    // PlanGenerator 인스턴스 생성
    const generator = new PlanGenerator();
    
    try {
      // 현재 학기에 적합한 과목 필터링
      const currentSemester = academicPlan
        .flatMap(year => year.semesters)
        .find(sem => sem.term === selectedTerm);

      if (!currentSemester) return [];

      // 이미 수강한 과목 필터링
      const takenCourses = new Set(
        academicPlan
          .flatMap(year => year.semesters)
          .flatMap(sem => sem.courses)
          .map(course => course.code)
      );

      // 수강 가능한 과목 필터링
      const availableCourses = allCourses.filter(course => 
        !takenCourses.has(course.code) &&
        course.term.includes(selectedTerm)
      );

      // 계획 생성
      const plan = generator.generatePlan(
        availableCourses,
        {
          prioritizeGrades: preferences.prioritizeGrades,
          balanceWorkload: preferences.balanceWorkload,
          includeRequirements: preferences.includeMajorReqs
        },
        {
          maxCreditsPerSemester: preferences.maxCreditsPerTerm,
          requiredCourses: [],
          preferredTerms: {}
        }
      );

      // 추천 과목 정렬 및 필터링
      return plan.years[0].semesters[0].courses
        .map(course => ({
          course,
          reasons: generateRecommendationReasons(course, currentSemester)
        }))
        .slice(0, 5);

    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }, [allCourses, academicPlan, preferences, selectedTerm, loading]);

  // 추천 이유 생성
  const generateRecommendationReasons = (course: Course, currentSemester: any) => {
    const reasons: string[] = [];

    // 높은 성적 분포
    if (preferences.prioritizeGrades) {
      const gradeA = parseFloat(course.gradeDistribution.toString());
      if (gradeA > 80) {
        reasons.push('높은 A학점 비율');
      }
    }

    // 워크로드 밸런스
    if (preferences.balanceWorkload) {
      const currentCredits = currentSemester.courses.reduce(
        (sum: number, c: Course) => sum + c.credits, 0
      );
      if (currentCredits + course.credits <= preferences.maxCreditsPerTerm) {
        reasons.push('적절한 학점 배분');
      }
    }

    // 전공 요건
    if (preferences.includeMajorReqs && course.prerequisites.length === 0) {
      reasons.push('선수과목 없음');
    }

    return reasons;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-600">
          <Info className="h-5 w-5" />
          <p>추천 과목을 불러오는데 실패했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-medium">추천 과목</h2>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="h-4 w-4" />
            <span>필터</span>
            <ChevronDown className={`h-4 w-4 transform transition-transform ${
              showFilters ? 'rotate-180' : ''
            }`} />
          </button>
        </div>

        {/* 필터 패널 */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학기 선택
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                >
                  <option value="Fall">Fall</option>
                  <option value="Spring">Spring</option>
                  <option value="Summer">Summer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  최대 학점
                </label>
                <select
                  value={preferences.maxCreditsPerTerm}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    maxCreditsPerTerm: parseInt(e.target.value)
                  }))}
                  className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                >
                  <option value={12}>12 학점</option>
                  <option value={15}>15 학점</option>
                  <option value={18}>18 학점</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
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
                <span className="text-sm text-gray-600">높은 학점 우선</span>
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
                <span className="text-sm text-gray-600">워크로드 균형</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={preferences.includeMajorReqs}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    includeMajorReqs: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-600">전공 요건 포함</span>
              </label>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}

        {/* 추천 과목 목록 */}
        {!loading && (
          <div className="space-y-4">
            {recommendations.map(({ course, reasons }, index) => (
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

            {recommendations.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                현재 추천할 수 있는 과목이 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}