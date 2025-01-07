// src/components/common/DraggableCourseCard.tsx

import React, { useRef, useMemo, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { X, GripHorizontal } from 'lucide-react';
import type { Course } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';
import type { DragSourceMonitor } from 'react-dnd';


interface DraggableCourseCardProps {
  course: Course;
  onRemove?: () => void;
  sourceId?: string;
}

interface DragItem {
  type: 'course';
  courseId: string;
  sourceId?: string;
  course: Course;
}


const DraggableCourseCard = React.memo(({ 
  course, 
  onRemove,
  sourceId 
}: DraggableCourseCardProps) => {
  const ref = useRef<HTMLDivElement>(null);

  // 드래그 아이템 데이터 메모이제이션
  const dragItem = useMemo(() => ({
    type: 'course' as const,
    courseId: course.id,
    sourceId,
    course
  }), [course, sourceId]);

  // 드래그 핸들러 최적화
  const [{ isDragging }, drag] = useDrag({
    type: 'course',
    item: dragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: useCallback((item: DragItem | undefined, monitor: DragSourceMonitor) => {
      const dropResult = monitor.getDropResult();
      if (dropResult) {
        console.log('Drag ended successfully:', { 
          dropResult, 
          course: course.code 
        });
      }
    }, [course.code])
  });

  // 성적 데이터 메모이제이션
  const gradeA = useMemo(() => 
    getGradeA(course.gradeDistribution), 
    [course.gradeDistribution]
  );

  // 삭제 핸들러 메모이제이션
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  }, [onRemove]);

  // dragPreview 최적화
  drag(ref);

  return (
    <div
      ref={ref}
      className={`
        group relative border rounded-md p-3 select-none
        ${isDragging ? 'opacity-50 shadow-lg border-blue-500' : 'border-gray-200'}
        hover:border-gray-300 transition-all duration-200
        cursor-move
      `}
      data-course-id={course.id}
      data-source-id={sourceId}
    >
      {/* Drag Handle */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100">
        <GripHorizontal className="h-4 w-4" />
      </div>

      <div className="flex justify-between items-start pl-6">
        {/* Course Info */}
        <div>
          <h3 className="font-medium text-gray-900">{course.code}</h3>
          <p className="text-sm text-gray-500">{course.name}</p>
          <p className="text-xs text-gray-400">{course.credits} credits</p>
          {/* Grade Info */}
          <div className="text-xs text-green-600">
            A: {gradeA}%
          </div>
          {/* Drag Indicator */}
          {isDragging && (
            <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
              Moving...
            </span>
          )}
        </div>
        
        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={handleRemove}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
          </button>
        )}
      </div>
    </div>
  );
});

// 디버깅을 위한 컴포넌트 이름 설정
DraggableCourseCard.displayName = 'DraggableCourseCard';

export default DraggableCourseCard;