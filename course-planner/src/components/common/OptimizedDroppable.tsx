// src/components/common/OptimizedDroppable.tsx

import React, { useCallback, memo, useRef } from 'react';
import { useDrop } from 'react-dnd';
import type { Course } from '@/types/course';

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
    if (validateDrop) return validateDrop(item);
    return true;
  }, [isDisabled, maxItems, currentItems, dropId, validateDrop]);

  // 드롭 핸들러 최적화
  const handleDrop = useCallback((item: DropItem) => {
    if (!canAcceptDrop(item)) return;
    onDrop(item.courseId, item.sourceId);
  }, [canAcceptDrop, onDrop]);

  // useDrop 훅 최적화
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: accepts,
    canDrop: canAcceptDrop,
    drop: handleDrop,
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  // Ref 연결
  drop(dropRef);

  // 드롭 영역 상태에 따른 스타일 계산
  const dropzoneStyle = isOver && !canDrop ? 'border-red-400 bg-red-50' :
                       isOver && canDrop ? 'border-blue-400 bg-blue-50' :
                       'border-gray-200';

  return (
    <div
      ref={dropRef}
      className={`
        relative transition-colors duration-200
        ${dropzoneStyle}
        ${className}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      data-drop-id={dropId}
    >
      {children}

      {/* 드롭 가능 상태 표시 */}
      {isOver && (
        <div
          className={`
            absolute inset-0 pointer-events-none rounded-lg
            ${canDrop ? 'border-2 border-blue-500' : 'border-2 border-red-500'}
          `}
        />
      )}

      {/* 최대 항목 수 도달 시 표시 */}
      {maxItems && currentItems >= maxItems && (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
          <span className="text-sm text-gray-600">Maximum items reached</span>
        </div>
      )}
    </div>
  );
});

OptimizedDroppable.displayName = 'OptimizedDroppable';

export default OptimizedDroppable;