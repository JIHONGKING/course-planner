import { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import type { Semester as SemesterType } from '@/src/types/course';
import CourseCard from './CourseCard';
import { CREDITS_PER_SEMESTER } from '@/src/data/constants';
import CourseSelectionModal from './CourseSelectionModal';

interface SemesterProps {
  semester: SemesterType;
  onAddCourse: (semesterId: string) => void; // semesterId를 인자로 받도록 수정
  onRemoveCourse: (courseId: string) => void;
}

export default function Semester({ semester, onAddCourse, onRemoveCourse }: SemesterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달 창 표시 여부 상태
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const totalCredits = semester.courses.reduce((sum, course) => sum + course.credits, 0);
  const remainingSlots = 6 - semester.courses.length;
  const isOverCredits = totalCredits > CREDITS_PER_SEMESTER.max;

  return (
    <div className="border border-gray-200 rounded-lg">
      <div className="p-4 border-b bg-gray-50 relative">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">{`${semester.term} ${semester.year}`}</h3>
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm font-medium ${
                isOverCredits ? 'text-red-600' : 'text-gray-700'
              }`}
            >
              {totalCredits.toFixed(2)} credits
            </span>
            <button
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Semester Information"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)} // 드롭다운 토글
              >
              <Info className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 드롭다운 메뉴 (구현 필요) */}
        {isDropdownOpen && (
    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-md shadow-lg">
      {/* 드롭다운 메뉴 내용 */}
      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        학기 설정
      </a>
      <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        GPA 계산
      </a>
      {/* 필요한 메뉴 항목 추가 */}
    </div>
  )}
</div>

      <div className="p-4 space-y-2">
        {/* Existing Courses */}
        {semester.courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onRemove={() => onRemoveCourse(course.id)}
          />
        ))}

        {/* Empty Course Slots */}
        {Array.from({ length: remainingSlots }).map((_, index) => (
          <button
            key={`empty-${index}`}
            onClick={() => onAddCourse(semester.id)} // semester.id를 인자로 전달
            className="w-full p-3 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Add Course</span>
          </button>
        ))}
      </div>

      {/* CourseSelectionModal 컴포넌트 조건부 렌더링 */}
      {isModalOpen && (
        <CourseSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)} // 모달 창 닫는 함수 전달
          onSelect={() => {}} // onSelect 함수는 나중에 구현
          courses={[]} // courses 데이터는 나중에 전달
          currentCourses={semester.courses} 
          semesterId={semester.id} 
        />
      )}
    </div>
  );
}