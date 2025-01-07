// src/components/course-planner/AcademicYear.tsx
import React, { useState } from 'react';
import type { AcademicYear as AcademicYearType, Course } from '@/types/course';
import Semester from './Semester';
import CourseSelectionModal from './CourseSelectionModal';

interface AcademicYearProps {
  year: AcademicYearType;
  onRemoveCourse: (semesterId: string, courseId: string) => void;
  onAddCourse: (semesterId: string, course: Course) => void;
  onMoveCourse: (courseId: string, fromSemesterId: string, toSemesterId: string) => void;
  onClearSemester: (semesterId: string) => void;
}

export default function AcademicYear({
  year,
  onRemoveCourse,
  onAddCourse,
  onMoveCourse,
  onClearSemester
}: AcademicYearProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);

  // 학년의 총 학점 계산
  const totalCredits = year.semesters.reduce((sum, semester) => 
    sum + semester.courses.reduce((total, course) => total + course.credits, 0), 0);

  // 과목 추가 버튼 클릭 핸들러
  const handleAddCourse = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
    setIsModalOpen(true);
  };

  // 모달에서 과목 선택 핸들러
  const handleCourseSelect = (course: Course) => {
    if (selectedSemesterId) {
      onAddCourse(selectedSemesterId, course);
      setIsModalOpen(false);
    }
  };

  // 과목 이동 핸들러
  const handleMoveCourse = (courseId: string, fromSemesterId: string, toSemesterId: string) => {
    console.log('Moving course:', {
      courseId,
      from: fromSemesterId,
      to: toSemesterId
    });
    onMoveCourse(courseId, fromSemesterId, toSemesterId);
  };

  // 각 학기의 학점 계산
  const calculateSemesterCredits = (semesterId: string): number => {
    const semester = year.semesters.find(sem => sem.id === semesterId);
    if (!semester) return 0;
    return semester.courses.reduce((sum, course) => sum + course.credits, 0);
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm">
      {/* Year Header */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {`${year.yearName} Year (${year.startYear}-${year.startYear + 1})`}
          </h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-600">
              Total Credits: {totalCredits}/30
            </span>
          </div>
        </div>
      </div>

      {/* Semesters Grid */}
      <div className="p-4">
        <div className="grid md:grid-cols-3 gap-6">
          {year.semesters.map((semester) => (
            <Semester
              key={semester.id}
              semester={semester}
              onClearSemester={() => onClearSemester(semester.id)}
              onRemoveCourse={(courseId) => onRemoveCourse(semester.id, courseId)}
              onAddCourse={(course) => onAddCourse(semester.id, course)}
              onMoveCourse={handleMoveCourse}
              calculateCredits={calculateSemesterCredits}
            />
          ))}
        </div>
      </div>

      {/* Course Selection Modal */}
      <CourseSelectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleCourseSelect}
        currentSemesterCourses={selectedSemesterId ? 
          year.semesters.find(s => s.id === selectedSemesterId)?.courses : []}
      />
    </div>
  );
}