// src/components/course-planner/OptimizedSemester.tsx

import React, { memo, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import type { Course } from '@/types/course';
import OptimizedDraggable from '../common/OptimizedDraggable';
import OptimizedDroppable from '../common/OptimizedDroppable';

interface SemesterProps {
  id: string;
  term: string;
  year: number;
  courses: Course[];
  onAddCourse: (course: Course) => void;
  onRemoveCourse: (courseId: string) => void;
  onMoveCourse: (courseId: string, fromId: string, toId: string) => void;
  maxCredits?: number;
}

const MAX_COURSES = 6;

const OptimizedSemester = memo(({ 
  id,
  term,
  year,
  courses,
  onAddCourse,
  onRemoveCourse,
  onMoveCourse,
  maxCredits = 18
}: SemesterProps) => {
  // 현재 총 학점 계산
  const currentCredits = courses.reduce((sum, course) => sum + course.credits, 0);

  // 드롭 검증
  const validateDrop = useCallback((item: { course: Course }) => {
    const newTotalCredits = currentCredits + item.course.credits;
    return newTotalCredits <= maxCredits;
  }, [currentCredits, maxCredits]);

  // 드롭 핸들러
  const handleDrop = useCallback((courseId: string, sourceId?: string) => {
    if (sourceId) {
      onMoveCourse(courseId, sourceId, id);
    } else {
      const course = courses.find(c => c.id === courseId);
      if (course) onAddCourse(course);
    }
  }, [id, courses, onAddCourse, onMoveCourse]);

  return (
    <OptimizedDroppable
      dropId={id}
      onDrop={handleDrop}
      validateDrop={validateDrop}
      maxItems={MAX_COURSES}
      currentItems={courses.length}
      className="p-4 rounded-lg border min-h-[200px]"
    >
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">{term} {year}</h3>
          <span className="text-sm text-gray-600">
            {currentCredits}/{maxCredits} credits
          </span>
        </div>

        {courses.map(course => (
          <OptimizedDraggable
            key={course.id}
            course={course}
            sourceId={id}
            onRemove={() => onRemoveCourse(course.id)}
          />
        ))}

        {courses.length === 0 && (
          <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg">
            <p className="text-sm text-gray-500">
              Drop courses here
            </p>
          </div>
        )}
      </div>
    </OptimizedDroppable>
  );
});

OptimizedSemester.displayName = 'OptimizedSemester';

export default OptimizedSemester;