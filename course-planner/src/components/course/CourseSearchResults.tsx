// src/components/course/CourseSearchResults.tsx
import React from 'react';
import type { Course, GradeDistribution } from '@/types/course';

interface CourseSearchResultsProps {
  courses: Course[];
  isLoading: boolean;
  error?: string;
}

const getGradeA = (gradeDistribution: string | GradeDistribution): string => {
  if (typeof gradeDistribution === 'string') {
    try {
      const parsed = JSON.parse(gradeDistribution);
      return parsed.A.toString();
    } catch {
      return '0';
    }
  }
  return gradeDistribution.A.toString();
};

export default function CourseSearchResults({ courses, isLoading, error }: CourseSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        {error}
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No courses found. Try adjusting your search.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div 
          key={course.id}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{course.code}</h3>
              <p className="text-gray-600">{course.name}</p>
              <p className="text-sm text-gray-500 mt-1">{course.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{course.credits} credits</div>
              <div className="text-sm text-green-600">
              A: {getGradeA(course.gradeDistribution)}%
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}