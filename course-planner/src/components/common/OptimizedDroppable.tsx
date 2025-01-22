// src/components/common/OptimizedDroppable.tsx

import React, { useRef, useMemo, useCallback, memo, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import type { Course } from '@/types/course';
import { AlertTriangle } from 'lucide-react';

interface DroppableProps {
  onDrop: (courseId: string, sourceId?: string) => void;
  accepts?: string[];
  children: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
  maxItems?: number;
  currentItems?: number;
  validateDrop?: (item: any) => boolean;
  dropId: string;
}

interface DropItem {
  type: 'course';
  courseId: string;
  sourceId?: string;
  course: Course;
}

const OptimizedDroppable = memo(({
  onDrop,
  accepts = ['course'],
  children,
  className = '',
  isDisabled = false,
  maxItems,
  currentItems = 0,
  validateDrop,
  dropId
}: DroppableProps) => {
  const dropRef = useRef<HTMLDivElement>(null);

  // 드롭 가능 여부 검증
  const canAcceptDrop = useCallback((item: DropItem) => {
    if (isDisabled) return false;
    if (maxItems && currentItems >= maxItems) return false;
    if (item.sourceId === dropId) return false;
    return validateDrop ? validateDrop(item) : true;
  }, [isDisabled, maxItems, currentItems, dropId, validateDrop]);

  // 드롭 핸들러
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: accepts,
    drop: (item: DropItem) => {
      console.log('Dropping item:', item);
      onDrop(item.courseId, item.sourceId);
      return { dropId };
    },
    canDrop: canAcceptDrop,
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [onDrop, canAcceptDrop, accepts, dropId]);

  // 정확한 ref 연결
  useEffect(() => {
    if (dropRef.current) {
      drop(dropRef);
    }
  }, [drop]);

  // 컨테이너 클래스 계산
  const containerClass = useMemo(() => {
    const baseClass = `relative transition-colors duration-200 ${className}`;
    if (isOver && !canDrop) return `${baseClass} border-red-400 bg-red-50`;
    if (isOver && canDrop) return `${baseClass} border-blue-400 bg-blue-50`;
    return `${baseClass} border-gray-200`;
  }, [className, isOver, canDrop]);

  // 경고 메시지
  const warningMessage = useMemo(() => {
    if (maxItems && currentItems >= maxItems) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 bg-opacity-50">
          <div className="flex items-center gap-2 p-2 bg-white rounded shadow text-sm text-gray-600">
            <AlertTriangle className="h-4 w-4" />
            <span>Maximum items reached</span>
          </div>
        </div>
      );
    }
    return null;
  }, [maxItems, currentItems]);

  return (
    <div
      ref={dropRef}
      className={containerClass}
      data-drop-id={dropId}
    >
      {children}

      {/* 드래그 오버 인디케이터 */}
      {isOver && (
        <div className={`
          absolute inset-0 pointer-events-none rounded-lg border-2
          ${canDrop ? 'border-blue-500' : 'border-red-500'}
          opacity-50
          transition-opacity duration-200
        `} />
      )}

      {/* 경고 메시지 */}
      {warningMessage}
    </div>
  );
});

OptimizedDroppable.displayName = 'OptimizedDroppable';

export default OptimizedDroppable;
