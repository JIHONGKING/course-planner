// src/components/common/OptimizedDraggable.tsx

import React, { useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { X } from 'lucide-react';
import type { Course } from '@/types/course';

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
  onDragEnd,
  className = ''
}: DraggableProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>(() => ({
    type: 'course',
    item: {
      type: 'course',
      courseId: course.id,
      sourceId,
      course
    },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging()
    })
  }), [course, sourceId]);

  // Drag start/end handlers
  useEffect(() => {
    if (isDragging) {
      onDragStart?.();
    } else {
      onDragEnd?.();
    }
  }, [isDragging, onDragStart, onDragEnd]);

  // Connect the drag ref to the div ref
  useEffect(() => {
    drag(ref.current);
  }, [drag]);

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemove) {
      onRemove();
    }
  };

  return (
    <div
      ref={ref}
      className={`
        ${className}
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        relative
        group
        cursor-move
        p-3
        border rounded-md
        border-gray-200 
        hover:border-gray-300
        transition-all duration-200
      `}
      data-course-id={course.id}
      data-source-id={sourceId}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-gray-900">{course.code}</h3>
          <p className="text-sm text-gray-500">{course.name}</p>
          <p className="text-xs text-gray-400">{course.credits} credits</p>
        </div>
        {onRemove && (
          <button
            onClick={handleRemove}
            className="
              opacity-0 
              group-hover:opacity-100 
              p-1 
              rounded-full
              text-gray-400 
              hover:text-red-500 
              hover:bg-red-50
              transition-all 
              duration-200
              z-10
            "
            type="button"
            aria-label="Remove course"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

OptimizedDraggable.displayName = 'OptimizedDraggable';

export default OptimizedDraggable;