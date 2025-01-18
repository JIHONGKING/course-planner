// src/components/course-planner/CourseList.tsx
import React, { useMemo, useCallback } from 'react';
import { useOptimizedSearchCourses } from '@/hooks/useOptimizedSearchCourses';  // 변경된 부분
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SortControls } from '@/components/ui/SortControls';
import { Pagination } from '@/components/ui/Pagination';
import type { Course, GradeDistribution } from '@/types/course';

const CourseList = React.memo(() => {
  const {
    courses,
    isLoading,
    error,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    handleSort,
    handleOrderChange,
    handlePageChange
  } = useOptimizedSearchCourses();

  // GradeA 계산 함수 메모이제이션
  const getGradeA = useCallback((gradeDistribution: string | GradeDistribution): number => {
    if (typeof gradeDistribution === 'string') {
      try {
        return parseFloat(JSON.parse(gradeDistribution).A);
      } catch {
        return 0;
      }
    }
    return parseFloat(gradeDistribution.A.toString());
  }, []);

  // 과목 통계 메모이제이션
  const stats = useMemo(() => ({
    totalCourses: courses.length,
    totalCredits: courses.reduce((sum, course) => sum + course.credits, 0),
    averageGrade: courses.length > 0 
      ? courses.reduce((sum, course) => sum + getGradeA(course.gradeDistribution), 0) / courses.length 
      : 0
  }), [courses, getGradeA]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-4">
      {courses.length > 0 && (
        <div className="flex justify-between items-center py-4">
          <div className="text-sm text-gray-500">
            <p>Showing {courses.length} courses</p>
            <p>Total Credits: {stats.totalCredits}</p>
            <p>Average A Grade: {stats.averageGrade.toFixed(1)}%</p>
          </div>
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSort}
            onOrderChange={handleOrderChange}
          />
        </div>
      )}

      <div className="space-y-4">
        {courses.map((course) => (
          <div
            key={course.id}
            className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors duration-200"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-gray-900">{course.code}</h3>
                  <span className="px-2 py-0.5 text-sm bg-gray-100 rounded-full text-gray-600">
                    {course.credits} credits
                  </span>
                </div>
                <p className="mt-1 text-gray-600">{course.name}</p>
                {course.description && (
                  <p className="mt-1 text-sm text-gray-500">{course.description}</p>
                )}
                {course.courseSchedules && course.courseSchedules.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 font-medium">Schedule:</p>
                    <div className="space-y-1">
                      {course.courseSchedules.map((schedule, index) => (
                        <p key={index} className="text-sm text-gray-500">
                          {schedule.dayOfWeek} {schedule.startTime}-{schedule.endTime}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="ml-4 text-right">
                <div className="text-sm text-green-600 font-medium">
                  A: {getGradeA(course.gradeDistribution)}%
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  {course.term.join(', ')}
                </div>
              </div>
            </div>
          </div>
        ))}

        {courses.length === 0 && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            No courses found. Try adjusting your search or filters.
          </div>
        )}
      </div>

      {courses.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
});

CourseList.displayName = 'CourseList';

export default CourseList;