// src/components/course-planner/SavedCourses.tsx
import React from 'react';
import { Trash2, ArrowDownWideNarrow, Info } from 'lucide-react';
import CourseCard from '@/components/common/CourseCard';
import type { Course } from '@/types/course';
import { sortCourses, type SortOption, type SortOrder } from '@/utils/sortUtils';

interface SavedCoursesProps {
  courses: Course[];
  onRemove: (courseId: string) => void;
  onClearAll: () => void;
  onAddToPlan: (course: Course) => void;
  onSort?: (sortBy: SortOption) => void;
  sortBy?: SortOption;
  sortOrder?: SortOrder;
}

export default function SavedCourses({
  courses,
  onRemove,
  onClearAll,
  onAddToPlan,
  onSort,
  sortBy = 'grade',
  sortOrder = 'desc'
}: SavedCoursesProps) {

  const sortedCourses = React.useMemo(() => {
    return sortCourses(courses, sortBy, sortOrder);
  }, [courses, sortBy, sortOrder]);

  return (
    <div className="mt-8 border-t border-gray-200 pt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">
          Saved Courses ({courses.length})
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={onClearAll}
            className="flex items-center gap-2 text-sm text-red-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear All</span>
          </button>

          <select
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
            value={sortBy}
            onChange={(e) => onSort?.(e.target.value as SortOption)}
          >
            <option value="grade">Highest A %</option>
            <option value="credits">Credits</option>
            <option value="code">Course Code</option>
          </select>

          <button 
            onClick={() => onSort?.(sortBy)}
            className="p-1 text-gray-400 hover:text-gray-600"
            title="Change sort order"
          >
            <ArrowDownWideNarrow className={`h-4 w-4 transform ${
              sortOrder === 'asc' ? 'rotate-180' : ''
            }`} />
          </button>
        </div>
      </div>

      {/* 과목 목록 */}
      <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedCourses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onRemove={() => onRemove(course.id)}
              onAdd={() => onAddToPlan(course)}
              showPrerequisites={true}
            />
          ))}

          {courses.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
              <Info className="h-5 w-5" />
              <p>No saved courses yet</p>
              <p className="text-sm">Search for courses and save them to plan your schedule</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}