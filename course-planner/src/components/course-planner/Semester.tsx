// src/components/course-planner/Semester.tsx
import { useState } from 'react';
import { Plus, Trash2, Info } from 'lucide-react';
import type { Course, Semester as SemesterType } from '@/types/course';
import CourseCard from './CourseCard';
import { CREDITS_PER_SEMESTER } from '@/data/constants';
import CourseSelectionModal from './CourseSelectionModal';

interface SemesterProps {
  semester: SemesterType;
  onAddCourse: (semesterId: string) => void;
  onRemoveCourse: (courseId: string) => void;
}

export default function Semester({ semester, onAddCourse, onRemoveCourse }: SemesterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
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
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <Info className="h-4 w-4" />
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
          <CourseCard
            key={course.id}
            course={course}
            onRemove={() => onRemoveCourse(course.id)}
          />
        ))}

        {[...Array(remainingSlots)].map((_, index) => (
          <button
            key={`empty-${index}`}
            onClick={() => onAddCourse(semester.id)}
            className="w-full p-3 border border-gray-200 rounded-md hover:bg-gray-50 flex items-center justify-center text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            <span>Add Course</span>
          </button>
        ))}
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