// src/components/common/OptimizedDraggable.tsx

import React, { useRef, useMemo, useCallback } from 'react';
import { useDrag } from 'react-dnd';
import { X, GripHorizontal } from 'lucide-react';
import type { Course } from '@/types/course';
import type { DragSourceMonitor } from 'react-dnd';

interface DraggableProps {
  course: Course;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  className?: string;
  onRemove?: () => void;
  sourceId?: string;
}

interface DragItem {
  type: 'course';
  courseId: string;
  sourceId?: string;
  course: Course;
}

const OptimizedDraggable = React.memo(({ 
  course, 
  onRemove,
  sourceId,
  onDragStart,
  onDragEnd
}: DraggableProps) => {
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
    item: () => {
      onDragStart?.();
      return dragItem;
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: useCallback((item: DragItem | undefined, monitor: DragSourceMonitor) => {
      onDragEnd?.();
      const dropResult = monitor.getDropResult();
      if (dropResult) {
        console.log('Drag ended:', { 
          item,
          dropResult,
          course: course.code 
        });
      }
    }, [course.code, onDragEnd])
  });

  // 삭제 핸들러 메모이제이션
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  }, [onRemove]);

  // 드래그 ref 연결
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
      {/* 드래그 핸들 */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100">
        <GripHorizontal className="h-4 w-4" />
      </div>

      <div className="flex justify-between items-start pl-6">
        {/* 과목 정보 */}
        <div>
          <h3 className="font-medium text-gray-900">{course.code}</h3>
          <p className="text-sm text-gray-500">{course.name}</p>
          <p className="text-xs text-gray-400">{course.credits} credits</p>
          {isDragging && (
            <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
              Moving...
            </span>
          )}
        </div>
        
        {/* 삭제 버튼 */}
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

OptimizedDraggable.displayName = 'OptimizedDraggable';

export default OptimizedDraggable;