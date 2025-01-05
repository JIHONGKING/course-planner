// src/components/course-planner/SemesterStats.tsx
import React, { useMemo } from 'react';
import type { Course, Semester } from '@/types/course';  // Course 타입 추가

interface StatProps {
  label: string;
  value: string | number;
}

function Stat({ label, value }: StatProps) {
  return (
    <div className="text-center">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-lg font-medium">{value}</div>
    </div>
  );
}

// 평균 학점 계산 함수 추가
function calculateAverageGrade(courses: Course[]): number {
  if (courses.length === 0) return 0;
  
  const totalGrades = courses.reduce((sum, course) => {
    const gradeData = typeof course.gradeDistribution === 'string' 
      ? JSON.parse(course.gradeDistribution) 
      : course.gradeDistribution;
    return sum + parseFloat(gradeData.A || '0');
  }, 0);

  return Number((totalGrades / courses.length).toFixed(1));
}

export function SemesterStats({ semester }: { semester: Semester }) {
    const totalCredits = useMemo(() => 
      semester.courses.reduce((sum, c) => sum + c.credits, 0), 
      [semester.courses]
    );
  
    const averageGrade = useMemo(() => 
      calculateAverageGrade(semester.courses),
      [semester.courses]
    );
  
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <Stat label="Total Credits" value={totalCredits} />
          <Stat label="Avg. Grade" value={`${averageGrade}%`} />
          {/* 추가 통계 */}
        </div>
      </div>
    );
  }