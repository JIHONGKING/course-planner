// src/components/course-planner/CourseList.tsx
import { useCourses } from '@/hooks/useCourses';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { SortControls } from '@/components/ui/SortControls';
import { Pagination } from '@/components/ui/Pagination';
import type { Course, GradeDistribution } from '@/types/course';

export default function CourseList() {
  const {
    courses,
    loading,
    error,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    handleSortChange,
    toggleSortOrder,
    handlePageChange
  } = useCourses();

  const getGradeA = (gradeDistribution: string | GradeDistribution): number => {
    if (typeof gradeDistribution === 'string') {
      try {
        return parseFloat(JSON.parse(gradeDistribution).A);
      } catch {
        return 0;
      }
    }
    return parseFloat(gradeDistribution.A.toString());
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-4">
      {courses.length > 0 && (
        <div className="flex justify-between items-center py-4">
          <p className="text-sm text-gray-500">
            Showing {courses.length} courses
          </p>
          <SortControls
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
            onOrderChange={toggleSortOrder}
          />
        </div>
      )}

      <div className="space-y-4">
        {courses.map((course: Course) => (
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

        {courses.length === 0 && !loading && (
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
}