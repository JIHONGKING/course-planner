// src/components/semester/SemesterManager.tsx

import React, { useRef, useEffect, memo, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { AlertTriangle, Clock } from 'lucide-react';
import type { Course, Semester } from '@/types/course';

interface SemesterManagerProps {
  semester: Semester;
  onAddCourse: (course: Course) => void;
  onRemoveCourse: (courseId: string) => void;
  onMoveCourse: (courseId: string, fromId: string, toId: string) => void;
}

const SemesterManager = memo(({ 
  semester,
  onAddCourse,
  onRemoveCourse,
  onMoveCourse
}: SemesterManagerProps) => {
  // 메모이제이션된 통계 계산
  const stats = React.useMemo(() => {
    const totalCredits = semester.courses.reduce((sum, c) => sum + c.credits, 0);
    const courseCount = semester.courses.length;
    return { totalCredits, courseCount };
  }, [semester.courses]);

  const dropRef = useRef<HTMLDivElement>(null);

  // 드롭 핸들러 최적화
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'course',
    drop: (item: { course: Course, sourceId?: string }) => {
      if (item.sourceId) {
        onMoveCourse(item.course.id, item.sourceId, semester.id);
      } else {
        onAddCourse(item.course);
      }
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    }),
    canDrop: (item: { course: Course }) => {
      // 학점 제한 체크
      const newTotalCredits = stats.totalCredits + item.course.credits;
      return newTotalCredits <= 18 && semester.courses.length < 6;
    }
  });

  useEffect(() => {
    drop(dropRef);
  }, [drop]);

  // 과목 제거 핸들러
  const handleRemove = useCallback((courseId: string) => {
    onRemoveCourse(courseId);
  }, [onRemoveCourse]);

  return (
    <div
      ref={dropRef}
      className={`p-4 rounded-lg border-2 transition-colors ${
        isOver && canDrop ? 'border-blue-400 bg-blue-50' :
        isOver && !canDrop ? 'border-red-400 bg-red-50' :
        'border-gray-200'
      }`}
    >
      {/* 학기 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">{semester.term} {semester.year}</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {stats.totalCredits}/18 credits
          </span>
          {stats.totalCredits > 15 && (
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          )}
        </div>
      </div>

      {/* 과목 목록 */}
      <div className="space-y-2">
        {semester.courses.map(course => (
          <div
            key={course.id}
            className="p-3 bg-white rounded border group hover:border-blue-200 transition-colors"
          >
            <div className="flex justify-between">
              <div>
                <h4 className="font-medium">{course.code}</h4>
                <p className="text-sm text-gray-600">{course.name}</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-sm text-gray-500">
                  {course.credits} cr
                </span>
                <button
                  onClick={() => handleRemove(course.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                >
                  ×
                </button>
              </div>
            </div>

            {/* 수업 시간 표시 */}
            {course.courseSchedules?.length > 0 && (
              <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>
                  {course.courseSchedules.map(schedule => 
                    `${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}`
                  ).join(', ')}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* 빈 상태 표시 */}
        {semester.courses.length === 0 && (
          <div className="h-32 flex items-center justify-center border-2 border-dashed rounded-lg">
            <p className="text-sm text-gray-500">
              {isOver ? 'Drop here!' : 'Drag courses here'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

SemesterManager.displayName = 'SemesterManager';

export default SemesterManager;