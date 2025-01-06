// src/components/course-planner/Semester.tsx
import { useState, useRef } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Info } from 'lucide-react';
import type { Course, Semester as SemesterType } from '@/types/course';
import DraggableCourseCard from '@/components/common/DraggableCourseCard';
import { CREDITS_PER_SEMESTER } from '@/data/constants';
import CourseSelectionModal from './CourseSelectionModal';

interface DropItem {
  type: 'course';
  courseId: string;
  sourceId?: string;
  course: Course;
}

interface SemesterProps {
  semester: SemesterType;
  onClearSemester: () => void;
  onRemoveCourse: (courseId: string) => void;
  onAddCourseClick: () => void;
  calculateCredits: (semesterId: string) => number;
  onMoveCourse?: (courseId: string, fromSemesterId: string, toSemesterId: string) => void;
}

export default function Semester({ 
  semester,
  onClearSemester,
  onRemoveCourse,
  onAddCourseClick,
  calculateCredits,
  onMoveCourse
}: SemesterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const totalCredits = calculateCredits(semester.id);
  const remainingSlots = 6 - semester.courses.length;
  const isOverCredits = totalCredits > CREDITS_PER_SEMESTER.max;

  const [{ isOver, canDrop }, drop] = useDrop<DropItem, void, { isOver: boolean; canDrop: boolean }>(() => ({
    accept: 'course',
    canDrop: (item: DropItem) => {
      const currentCredits = calculateCredits(semester.id);
      const wouldExceedLimit = currentCredits + item.course.credits > CREDITS_PER_SEMESTER.max;
      const isSameSemester = item.sourceId === semester.id;
      return !wouldExceedLimit && !isSameSemester;
    },
    drop: (item: DropItem) => {
      if (item.sourceId && onMoveCourse) {
        onMoveCourse(item.courseId, item.sourceId, semester.id);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [semester.id, calculateCredits, onMoveCourse]);

  drop(ref);

  return (
    <div
      ref={ref}
      className={`border border-gray-200 rounded-lg ${
        isOver && canDrop ? 'bg-blue-50 border-blue-200' :
        isOver && !canDrop ? 'bg-red-50 border-red-200' : ''
      }`}
    >
      <div className="p-4 border-b bg-gray-50 relative">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {`${semester.term} ${semester.year}`}
          </h3>
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${
              isOverCredits ? 'text-red-600' : 'text-gray-700'
            }`}>
              {totalCredits} credits
            </span>
            <button
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Semester Information"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Info className="h-4 w-4" />
            </button>
            <button 
              onClick={onClearSemester}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
            <div className="py-1">
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                학기 설정
              </button>
              <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                GPA 계산
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2">
        {semester.courses.map((course) => (
          <DraggableCourseCard
            key={course.id}
            course={course}
            sourceId={semester.id}
            onRemove={() => onRemoveCourse(course.id)}
          />
        ))}

        {remainingSlots > 0 && (
          <button
            onClick={onAddCourseClick}
            className="w-full p-3 border border-gray-200 rounded-md hover:bg-gray-50 
                     flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      <CourseSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={() => {}}
        currentSemesterCourses={semester.courses}
      />
    </div>
  );
}