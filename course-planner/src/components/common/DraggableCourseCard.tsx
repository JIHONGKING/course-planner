// src/components/common/DraggableCourseCard.tsx
import React, { useRef } from 'react';
import { useDrag } from 'react-dnd';
import { X } from 'lucide-react';
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
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'course',
    item: { 
      type: 'course',
      courseId: course.id,
      sourceId,
      course 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [course, sourceId]);

  drag(ref);  // drag 함수를 ref에 연결

  return (
    <div
      ref={ref}
      className={`group relative border border-gray-200 rounded-md p-3 
                  ${isDragging ? 'opacity-50' : 'hover:bg-gray-50'} 
                  transition-colors cursor-move`}
    >
      {/* 나머지 코드는 동일 */}
    </div>
  );
}