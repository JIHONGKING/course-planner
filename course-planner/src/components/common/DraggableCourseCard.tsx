// src/components/common/DraggableCourseCard.tsx
import React, { useRef, useEffect } from 'react';
import { useDrag } from 'react-dnd';
import { X, GripHorizontal } from 'lucide-react';
import type { Course } from '@/types/course';
import { getGradeA } from '@/utils/gradeUtils';

interface DraggableCourseCardProps {
  course: Course;
  onRemove?: () => void;
  sourceId?: string;
}

export default function DraggableCourseCard({ 
  course, 
  onRemove,
  sourceId 
}: DraggableCourseCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // useDrag 훅으로 드래그 가능한 요소 설정
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'course',
    
    // 드래그할 데이터
    item: () => {
      console.log('Started dragging:', course.code);
      return { 
        courseId: course.id,
        sourceId,
        course 
      };
    },

    // 드래그 끝났을 때    
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult();
      console.log('Drag ended:', { 
        dropResult,
        wasDropped: monitor.didDrop(),
        course: course.code
      });
    },

    // 드래그 가능 여부
    canDrag: () => {
      return true; // 항상 드래그 가능
    },

    // 상태 수집
    collect: (monitor) => {
      const isDragging = monitor.isDragging();
      console.log('Drag state for course', course.code, ':', isDragging);
      return {
        isDragging
      };
    }
  }), [course, sourceId]);

  // ref에 drag 기능 연결
  useEffect(() => {
    if (ref.current) {
      drag(ref);
      console.log('Drag handler attached for:', course.code);
    }
  }, [drag, course.code]);

  return (
    <div
      ref={ref}
      className={`
        group relative border rounded-md p-3 select-none
        ${isDragging ? 'opacity-50 border-blue-500 shadow-lg' : 'border-gray-200'}
        hover:border-gray-300 transition-all duration-200
        cursor-move
      `}
      data-course-id={course.id}
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
            A: {getGradeA(course.gradeDistribution)}%
          </div>
          {/* Drag State Indicator */}
          {isDragging && (
            <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
              Moving...
            </span>
          )}
        </div>
        
        {/* Remove Button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
          </button>
        )}
      </div>

      {/* Drag Preview Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-50 pointer-events-none" />
      )}
    </div>
  );
}