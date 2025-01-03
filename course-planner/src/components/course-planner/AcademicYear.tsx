// src/components/course-planner/AcademicYear.tsx
import React, { useState } from 'react';
import { ChevronDown, Trash2, Plus, X } from 'lucide-react';
import type { AcademicYear as AcademicYearType, Course, Semester, GradeDistribution } from '@/types/course';
import CourseSelectionModal from './CourseSelectionModal';

interface AcademicYearProps {
  year: AcademicYearType;
  onRemoveCourse: (semesterId: string, courseId: string) => void;
  onAddCourse: (semesterId: string, course: Course) => void;
}

export default function AcademicYear({ year, onRemoveCourse, onAddCourse }: AcademicYearProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSemesterId, setSelectedSemesterId] = useState<string | null>(null);

  const handleAddCourse = (semesterId: string) => {
    setSelectedSemesterId(semesterId);
    setIsModalOpen(true);
  };

  const handleCourseSelect = (course: Course) => {
    if (selectedSemesterId) {
      onAddCourse(selectedSemesterId, course);
    }
  };

  const getGradeA = (gradeDistribution: string | GradeDistribution): number => {
    if (typeof gradeDistribution === 'string') {
      try {
        return parseFloat(JSON.parse(gradeDistribution).A);
      } catch {
        return 0;
      }
    }
    return parseFloat(gradeDistribution.A.toString());
  };

  const totalCredits = year.semesters.reduce((sum, semester) => 
    sum + semester.courses.reduce((total, course) => total + course.credits, 0), 0);

  return (
    <>
      <div className="border border-gray-200 rounded-lg shadow-sm">
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

        <div className="p-4">
          <div className="grid md:grid-cols-3 gap-6">
            {year.semesters.map((semester) => (
              <div key={semester.id} className="border border-gray-200 rounded-lg">
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
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        onClick={() => onRemoveCourse(semester.id, '')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  {semester.courses.map((course) => (
                    <div
                      key={course.id}
                      className="group border border-gray-200 rounded-md p-3 hover:bg-gray-50 transition-colors relative"
                    >
                      <button
                        onClick={() => onRemoveCourse(semester.id, course.id)}
                        className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="flex justify-between pr-6">
                        <div>
                          <h3 className="font-medium text-gray-900">{course.code}</h3>
                          <p className="text-sm text-gray-500">{course.name}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-gray-900">{course.credits} Cr</div>
                          <div className="text-sm text-green-600 font-medium">
                            A: {getGradeA(course.gradeDistribution)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {semester.courses.length < 6 && (
                    <div className="flex justify-center items-center min-h-[60px]">
                      <button
                        className="flex items-center space-x-1 text-gray-400 hover:text-gray-600"
                        onClick={() => handleAddCourse(semester.id)}
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Course</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CourseSelectionModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSelect={handleCourseSelect}
          currentSemesterCourses={selectedSemesterId ? 
            year.semesters.find(s => s.id === selectedSemesterId)?.courses : []}
        />
      )}
    </>
  );
}
