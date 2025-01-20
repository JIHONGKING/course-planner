// src/components/common/OptimizedDraggable.tsx

import React, { useRef, useMemo, useCallback, memo, useEffect } from 'react'; // useEffect 추가
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

const OptimizedDraggable = memo(({ 
  course, 
  onRemove,
  sourceId,
  onDragStart,
  onDragEnd,
  className = ''
}: DraggableProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const dragItem = useMemo<DragItem>(() => ({
    type: 'course',
    courseId: course.id,
    sourceId,
    course
  }), [course, sourceId]);

  // 드래그 핸들러 최적화
  const handleDragEnd = useCallback((_: DragItem, monitor: DragSourceMonitor<DragItem, unknown>) => {
    onDragEnd?.();
    const dropResult = monitor.getDropResult();
    if (dropResult) {
      console.log('Drag ended:', { dropResult, course: course.code });
    }
  }, [course.code, onDragEnd]);

  const [{ isDragging }, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: 'course',
    item: dragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    }),
    end: handleDragEnd
  });


  // 삭제 핸들러 메모이제이션
  const handleRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  }, [onRemove]);

  // 성능 최적화를 위한 스타일 메모이제이션
  const styles = useMemo(() => ({
    container: `
      group relative border rounded-md p-3 select-none
      ${isDragging ? 'opacity-50 shadow-lg border-blue-500' : 'border-gray-200'}
      hover:border-gray-300 transition-all duration-200
      cursor-move
      ${className}
    `,
    dragHandle: `
      absolute left-2 top-1/2 -translate-y-1/2 
      opacity-50 group-hover:opacity-100 transition-opacity
    `,
    content: 'flex justify-between items-start pl-6',
    removeButton: `
      opacity-0 group-hover:opacity-100 transition-opacity p-1
      text-gray-400 hover:text-red-500
    `
  }), [isDragging, className]);

  // 렌더링 최적화를 위한 메모이제이션된 컨텐츠
  const courseInfo = useMemo(() => (
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
  ), [course, isDragging]);

  // IntersectionObserver를 사용한 지연 로딩
  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.target.classList.contains('course-card')) {
            entry.target.classList.toggle('visible', entry.isIntersecting);
          }
        });
      },
      { rootMargin: '50px' }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // 드래그 ref 연결
  drag(ref);

  return (
    <div
      ref={ref}
      className={styles.container}
      data-course-id={course.id}
      data-source-id={sourceId}
    >
      <div className={styles.dragHandle}>
        <GripHorizontal className="h-4 w-4" />
      </div>

      <div className={styles.content}>
        {courseInfo}
        {onRemove && (
          <button onClick={handleRemove} className={styles.removeButton}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
});

OptimizedDraggable.displayName = 'OptimizedDraggable';

export default OptimizedDraggable;
