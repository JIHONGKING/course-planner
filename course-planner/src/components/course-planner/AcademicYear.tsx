// src/components/course-planner/AcademicYear.tsx
import React, { useState } from 'react';
import { ChevronDown, Trash2, Plus, X } from 'lucide-react';
import CourseCard from '@/components/common/CourseCard';
import CourseSelectionModal from './CourseSelectionModal';
import type { 
  AcademicYear as AcademicYearType, 
  Course, 
  Semester 
} from '@/types/course';

interface AcademicYearProps {
  year: AcademicYearType;
  onRemoveCourse: (semesterId: string, courseId: string) => void;
  onAddCourse: (semesterId: string, course: Course) => void;
  onClearSemester: (semesterId: string) => void;
}


export default function AcademicYear({ 
  year, 
  onRemoveCourse, 
  onAddCourse,
  onClearSemester
}: AcademicYearProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);

  const totalCredits = year.semesters.reduce((sum, semester) => 
    sum + semester.courses.reduce((total, course) => total + course.credits, 0), 0);

  const handleAddCourse = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
    setIsModalOpen(true);
  };

  const handleCourseSelect = (course: Course) => {
    if (selectedSemesterId) {
      onAddCourse(selectedSemesterId, course);
      setIsModalOpen(false);
    }
  };

  return (
    <>
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
              <button className="text-gray-400 hover:text-gray-600">
                <ChevronDown className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Semesters Grid */}
        <div className="p-4">
          <div className="grid md:grid-cols-3 gap-6">
            {year.semesters.map((semester) => (
              <div key={semester.id} className="border border-gray-200 rounded-lg">
                {/* Semester Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">
                      {`${semester.term} ${semester.year}`}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-700">
                        {semester.courses.reduce((sum, course) => sum + course.credits, 0)} credits
                      </span>
                      <button
                        onClick={() => onClearSemester(semester.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Course List */}
                <div className="p-4 space-y-2">
                  {semester.courses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      showPrerequisites={false}
                      onRemove={() => onRemoveCourse(semester.id, course.id)}
                    />
                  ))}

                  {/* Add Course Button */}
                  {semester.courses.length < 6 && (
                    <button
                      onClick={() => handleAddCourse(semester.id)}
                      className="w-full p-3 border border-gray-200 rounded-md 
                               hover:bg-gray-50 flex items-center justify-center 
                               text-gray-500 hover:text-gray-700"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      <span>Add Course</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
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
    </>
  );
}