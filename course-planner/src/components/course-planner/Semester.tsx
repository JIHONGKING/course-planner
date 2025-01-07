// src/components/course-planner/Semester.tsx
import { useState, useRef, useEffect } from 'react';
import { useDrop } from 'react-dnd';
import { Plus, Trash2, Info } from 'lucide-react';
import type { Course } from '@/types/course';
import DraggableCourseCard from '@/components/common/DraggableCourseCard';
import { CREDITS_PER_SEMESTER } from '@/data/constants';
import CourseSelectionModal from './CourseSelectionModal';  // 추가


interface DropItem {
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
  onMoveCourse?: (courseId: string, fromSemesterId: string, toSemesterId: string) => void;
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
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태 추가
  const [isDropping, setIsDropping] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleAddCourseClick = () => {
    setIsModalOpen(true);  // Add Course 버튼 클릭시 모달 열기
  };

  const handleCourseSelect = (course: Course) => {
    onAddCourse(course);  // 선택된 과목 추가
    setIsModalOpen(false);  // 모달 닫기
  };


  // useDrop 훅으로 드롭 영역 설정
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: 'course',
    
    // 드롭 가능 여부 체크
    canDrop: (item: DropItem) => {
      const currentCredits = calculateCredits(semester.id);
      const wouldExceedLimit = currentCredits + item.course.credits > CREDITS_PER_SEMESTER.max;
      const isSameSemester = item.sourceId === semester.id;
      
      console.log('Checking if can drop:', {
        semesterId: semester.id,
        currentCredits,
        wouldAdd: item.course.credits,
        wouldExceedLimit,
        isSameSemester
      });

      return !wouldExceedLimit && !isSameSemester;
    },
    
    // 드롭 처리
    drop: (item: DropItem) => {
      console.log('Drop event:', {
        course: item.course.code,
        fromSemester: item.sourceId,
        toSemester: semester.id
      });

      // 드롭 애니메이션
      setIsDropping(true);
      setTimeout(() => setIsDropping(false), 500);

      // 과목 이동 또는 추가
      if (item.sourceId && onMoveCourse) {
        onMoveCourse(item.courseId, item.sourceId, semester.id);
      } else {
        onAddCourse(item.course);
      }

      return { semesterId: semester.id };
    },

    // 드래그 요소가 드롭 영역 위에 있을 때
    hover: (item: DropItem, monitor) => {
      console.log('Hover:', {
        course: item.course.code,
        overSemester: semester.id,
        canDrop: monitor.canDrop()
      });
    },

    // 상태 수집
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  }), [semester.id, calculateCredits, onMoveCourse, onAddCourse]);

  // ref에 drop 기능 연결
  useEffect(() => {
    drop(ref);
  }, [drop]);

  const totalCredits = calculateCredits(semester.id);
  const remainingSlots = 6 - semester.courses.length;

  // 드롭 영역의 상태에 따른 스타일
  const getDropzoneStyle = () => {
    if (isOver && !canDrop) return 'border-red-400 bg-red-50';
    if (isOver && canDrop) return 'border-blue-400 bg-blue-50';
    if (isDropping) return 'border-green-400 bg-green-50';
    return 'border-gray-200';
  };

  return (
    <div
      ref={ref}
      className={`
        relative border-2 rounded-lg transition-colors duration-200
        ${getDropzoneStyle()}
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
              totalCredits > CREDITS_PER_SEMESTER.max ? 'text-red-600' : 'text-gray-700'
            }`}>
              {totalCredits} credits
            </span>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-1 text-gray-400 hover:text-gray-600"
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

        {/* Settings Dropdown */}
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

      {/* Course List */}
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
        {remainingSlots > 0 && (
          <button
            onClick={handleAddCourseClick}
            className="w-full p-3 border border-gray-200 rounded-md 
                     hover:bg-gray-50 flex items-center justify-center 
                     text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {/* Drop Overlay */}
      {isOver && (
        <div 
          className={`absolute inset-0 pointer-events-none rounded-lg border-2 
                     ${canDrop ? 'border-blue-400' : 'border-red-400'}`}
        />
      )}
      {/* Course Selection Modal 추가 */}
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