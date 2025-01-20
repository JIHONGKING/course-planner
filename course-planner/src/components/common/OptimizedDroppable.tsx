// src/components/common/OptimizedDroppable.tsx

import React, { useCallback, memo, useRef, useMemo } from 'react';
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

  // 드롭 가능 여부 검증 메모이제이션
  const canAcceptDrop = useCallback((item: DropItem) => {
    if (isDisabled) return false;
    if (maxItems && currentItems >= maxItems) return false;
    if (item.sourceId === dropId) return false;
    if (validateDrop) return validateDrop(item);
    return true;
  }, [isDisabled, maxItems, currentItems, dropId, validateDrop]);

  // 드롭 핸들러 메모이제이션
  const handleDrop = useCallback((item: DropItem) => {
    if (!canAcceptDrop(item)) return;
    onDrop(item.courseId, item.sourceId);
  }, [canAcceptDrop, onDrop]);

  const [{ isOver, canDrop }, drop] = useDrop<DropItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: accepts,
    canDrop: canAcceptDrop,
    drop: handleDrop,
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  // 스타일 메모이제이션
  const styles = useMemo(() => {
    const baseStyle = 'relative transition-colors duration-200';
    const dropzoneStyle = isOver && !canDrop ? 'border-red-400 bg-red-50' :
                         isOver && canDrop ? 'border-blue-400 bg-blue-50' :
                         'border-gray-200';
    const disabledStyle = isDisabled ? 'opacity-50 cursor-not-allowed' : '';
    
    return `${baseStyle} ${dropzoneStyle} ${disabledStyle} ${className}`;
  }, [isOver, canDrop, isDisabled, className]);

  // 경고 메시지 메모이제이션
  const warningMessage = useMemo(() => {
    if (maxItems && currentItems >= maxItems) {
      return (
        <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
          <span className="text-sm text-gray-600 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Maximum items reached
          </span>
        </div>
      );
    }
    return null;
  }, [maxItems, currentItems]);

  // Visual feedback for drag state
  const dragStateIndicator = useMemo(() => {
    if (!isOver) return null;
    
    return (
      <div className={`
        absolute inset-0 pointer-events-none rounded-lg border-2
        ${canDrop ? 'border-blue-500' : 'border-red-500'}
        ${isOver ? 'opacity-100' : 'opacity-0'}
        transition-opacity duration-200
      `} />
    );
  }, [isOver, canDrop]);

  drop(dropRef);

  return (
    <div
      ref={dropRef}
      className={styles}
      data-drop-id={dropId}
    >
      {children}
      {dragStateIndicator}
      {warningMessage}
    </div>
  );
});

OptimizedDroppable.displayName = 'OptimizedDroppable';

export default OptimizedDroppable;