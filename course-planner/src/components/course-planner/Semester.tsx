// src/components/course-planner/Semester.tsx

import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Info } from 'lucide-react';
import type { Course } from '@/types/course';
import type { DropTargetMonitor } from 'react-dnd';
import DraggableCourseCard from '@/components/common/DraggableCourseCard';
import { CREDITS_PER_SEMESTER } from '@/data/constants';
import CourseSelectionModal from './CourseSelectionModal';

interface DragItem {
  type: 'course';
  courseId: string;
  sourceId?: string;
  course: Course;
}

interface SemesterProps {
  semester: {
    id: string;
    term: string;
    year: number;
    courses: Course[];
  };
  onClearSemester: () => void;
  onRemoveCourse: (courseId: string) => void;
  onAddCourse: (course: Course) => void;
  onMoveCourse: (courseId: string, fromSemesterId: string, toSemesterId: string) => void;
  calculateCredits: (semesterId: string) => number;
}

export default function Semester({ 
  semester,
  onClearSemester,
  onRemoveCourse,
  onAddCourse,
  onMoveCourse,
  calculateCredits
}: SemesterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 현재 학기의 총 학점 계산을 메모이제이션
  const currentCredits = useMemo(() => 
    calculateCredits(semester.id), 
    [calculateCredits, semester.id]
  );

  // 드롭 가능 여부 검증 로직을 메모이제이션
  const canAcceptDrop = useCallback((item: DragItem) => {
    if (!item || !item.course) return false;
    
    // 같은 학기면 드롭 불가
    if (item.sourceId === semester.id) return false;
    
    // 학점 제한 체크
    const wouldExceedLimit = currentCredits + item.course.credits > CREDITS_PER_SEMESTER.max;
    
    // 학기 제공 여부 체크
    const isOfferedInTerm = item.course.term.includes(semester.term);
    
    return !wouldExceedLimit && isOfferedInTerm;
  }, [currentCredits, semester.id, semester.term]);

  // 드롭 핸들러 최적화
  const handleDrop = useCallback((item: DragItem) => {
    if (item.sourceId === semester.id) return;

    setIsDropping(true);
    onMoveCourse(item.courseId, item.sourceId || '', semester.id);
    
    // 드롭 애니메이션
    setTimeout(() => setIsDropping(false), 500);
  }, [semester.id, onMoveCourse]);

  // useDrop 훅 최적화
  const [{ isOver, canDrop }, drop] = useDrop({
    accept: 'course',
    canDrop: (item: DragItem, monitor: DropTargetMonitor) => {
      return canAcceptDrop(item);
    },
    drop: handleDrop,
    collect: (monitor: DropTargetMonitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // 모달 핸들러 메모이제이션
  const handleCourseSelect = useCallback((course: Course) => {
    onAddCourse(course);
    setIsModalOpen(false);
  }, [onAddCourse]);

  // 드롭 영역 스타일 계산을 메모이제이션
  const dropzoneStyle = useMemo(() => {
    if (isOver && !canDrop) return 'border-red-400 bg-red-50';
    if (isOver && canDrop) return 'border-blue-400 bg-blue-50';
    if (isDropping) return 'border-green-400 bg-green-50';
    return 'border-gray-200';
  }, [isOver, canDrop, isDropping]);

  // drop ref 연결
  drop(ref);

  return (
    <div
      ref={ref}
      className={`
        relative border-2 rounded-lg transition-colors duration-200
        ${dropzoneStyle}
      `}
      data-semester-id={semester.id}
    >
      {/* Semester Header */}
      <div className="p-4 border-b bg-gray-50/80">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {`${semester.term} ${semester.year}`}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              currentCredits > CREDITS_PER_SEMESTER.max ? 'text-red-600' : 'text-gray-700'
            }`}>
              {currentCredits} credits
            </span>
            <button
              onClick={onClearSemester}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Courses List with Optimized Rendering */}
      <div className="p-4 space-y-2 min-h-[100px]">
        {semester.courses.map((course) => (
          <DraggableCourseCard
            key={course.id}
            course={course}
            sourceId={semester.id}
            onRemove={() => onRemoveCourse(course.id)}
          />
        ))}

        {/* Empty State */}
        {semester.courses.length === 0 && (
          <div className="flex items-center justify-center h-20 border-2 border-dashed border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500">
              {isOver && canDrop ? 'Drop here!' : 'Drag courses here'}
            </p>
          </div>
        )}

        {/* Add Course Button */}
        {semester.courses.length < 6 && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full p-3 border border-gray-200 rounded-md 
                     hover:bg-gray-50 flex items-center justify-center 
                     text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {/* Course Selection Modal */}
      <CourseSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleCourseSelect}
        currentSemesterCourses={semester.courses}
      />

      {/* Drop Animation */}
      {isDropping && (
        <div className="absolute inset-0 bg-green-100 opacity-50 pointer-events-none rounded-lg" />
      )}
    </div>
  );
}