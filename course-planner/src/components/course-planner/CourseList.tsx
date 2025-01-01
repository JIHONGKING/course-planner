// src/components/course-planner/CourseList.tsx
import { useState } from 'react';
import type { Course } from '@/types/course';
import { useCourses } from '@/hooks/useCourses';

export default function CourseList() {
  const { courses, loading, error, searchCourses } = useCourses();
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const getGradeDistribution = (distribution: string | any) => {
    try {
      if (typeof distribution === 'string') {
        const parsed = JSON.parse(distribution);
        return parsed.A ? parsed.A.toFixed(1) : 'N/A';
      }
      return distribution.A ? distribution.A.toFixed(1) : 'N/A';
    } catch {
      return 'N/A';
    }
  };

  const toggleCourseSelection = (courseId: string) => {
    setSelectedCourses(prev => 
      prev.includes(courseId) 
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  // 초기 상태에서는 아무것도 보여주지 않음
  if (!hasSearched) {
    return (
      <div className="text-center py-8 text-gray-500">
        Search for courses to begin
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        Failed to load courses. Please try again.
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="space-y-2">
        {courses.map((course) => (
          <div 
            key={course.id}
            onClick={() => toggleCourseSelection(course.id)}
            className={`
              p-4 rounded-lg border cursor-pointer transition-colors
              ${selectedCourses.includes(course.id) ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}
            `}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-900 whitespace-nowrap">{course.code}</h3>
                  <span className="px-2 py-0.5 text-sm bg-gray-100 rounded-full text-gray-600">
                    {course.credits} credits
                  </span>
                </div>
                <p className="mt-1 text-gray-600">{course.name}</p>
                {course.description && (
                  <p className="mt-1 text-sm text-gray-500">{course.description}</p>
                )}
              </div>
              <div className="ml-4 text-right whitespace-nowrap">
                <div className="text-sm text-green-600 font-medium">
                  A: {getGradeDistribution(course.gradeDistribution)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {course.term.join(', ')}
                </div>
              </div>
            </div>
          </div>
        ))}

        {hasSearched && courses.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No courses found. Try adjusting your search.
          </div>
        )}
      </div>
    </div>
  );
}