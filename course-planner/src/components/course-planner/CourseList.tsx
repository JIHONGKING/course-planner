// src/components/course-planner/CourseList.tsx
import { Course } from '@/types/course';
import { useCourses } from '@/hooks/useCourses';

export default function CourseList() {
  const { courses, loading, error } = useCourses();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
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
    <div className="grid gap-4 mt-4">
      {courses.map((course: Course) => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

function CourseCard({ course }: { course: Course }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
      <div className="flex justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{course.code}</h3>
          <p className="text-sm text-gray-500">{course.name}</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">{course.credits} Credits</div>
          <div className="text-xs text-green-600">
            A: {JSON.parse(course.gradeDistribution).A}%
          </div>
        </div>
      </div>
    </div>
  );
}