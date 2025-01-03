// src/components/course-planner/SavedCourses.tsx
import { Trash2, X } from 'lucide-react';
import type { Course, GradeDistribution } from '@/types/course';

interface SavedCoursesProps {
  courses: Course[];
  onRemove: (courseId: string) => void;
  onClearAll: () => void;
  onAddToPlan: (course: Course) => void;
}

export default function SavedCourses({
  courses,
  onRemove,
  onClearAll,
  onAddToPlan
}: SavedCoursesProps) {
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

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Saved for later</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={onClearAll}
            className="text-sm text-red-500 hover:text-red-600 flex items-center space-x-1"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </button>
          <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
            <option>Highest A %</option>
            <option>Required First</option>
            <option>Credits</option>
          </select>
        </div>
      </div>
      <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {courses.map(course => (
            <div key={course.id} className="group border border-gray-200 rounded-md p-3 hover:bg-gray-50 relative">
              <button
                onClick={() => onRemove(course.id)}
                className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="flex justify-between items-center pr-6">
                <div>
                  <h3 className="font-medium text-gray-900">{course.code}</h3>
                  <p className="text-sm text-gray-500">{course.name}</p>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-green-600 font-medium">
                    A: {getGradeA(course.gradeDistribution)}%
                  </span>
                  <button
                    onClick={() => onAddToPlan(course)}
                    className="text-blue-500 hover:text-blue-600 font-medium text-sm"
                  >
                    Add to Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
          {courses.length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500">
              No saved courses yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
