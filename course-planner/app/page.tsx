'use client';

import React, { useState } from 'react';
import { Wand2, ChevronDown, X, Plus, Trash2, Search, Info } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { usePlanner } from '@/hooks/usePlanner';
import { usePrerequisiteValidation } from '@/hooks/usePrerequisiteValidation';
import type { Course, GradeDistribution } from '@/types/course';
import type { SortOption, SortOrder } from '@/utils/sortUtils';
import CourseCard from '@/components/common/CourseCard';
import Semester from '@/components/course-planner/Semester';
import SavedCourses from '@/components/course-planner/SavedCourses';
import AcademicYear from '@/components/course-planner/AcademicYear';

function isGradeDistribution(value: any): value is GradeDistribution {
  return value && typeof value === 'object' && 'A' in value;
}

function parseGradeDistribution(distribution: string | GradeDistribution): GradeDistribution {
  if (typeof distribution === 'string') {
    try {
      const parsed = JSON.parse(distribution);
      return parsed as GradeDistribution;
    } catch {
      return { A: '0', AB: '0', B: '0', BC: '0', C: '0', D: '0', F: '0' };
    }
  }
  return distribution;
}

export default function Home() {
  const [isPlanGenerated, setIsPlanGenerated] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('grade');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const { courses, loading, error, searchCourses } = useCourses();
  const {
    savedCourses,
    selectedYear,
    academicPlan,
    setSelectedYear,
    calculateCredits,
    calculateYearCredits,
    addCourse,
    removeCourse,
    saveCourse,
    removeSavedCourse,
    clearSemester,
    generatePlan,
    clearSavedCourses 
  } = usePlanner();

  const {
    validationError,
    validateCourseSelection,
    clearValidationError
  } = usePrerequisiteValidation();
  
  const [preferences, setPreferences] = useState({
    school: '',
    major: '',
    classStanding: '',
    graduationYear: '',
    planningStrategy: 'grades' as 'grades' | 'workload' | 'balanced'
  });

  // 임시 상태들 (나중에 전역 상태 관리로 이동 예정)
  const [completedCourses, setCompletedCourses] = useState<Course[]>([]);
  const [currentTermCourses, setCurrentTermCourses] = useState<Course[]>([]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    await searchCourses(query);
  };

  const handleCourseClick = (course: Course) => {
    try {
      const isValid = validateCourseSelection(
        course,
        completedCourses,
        currentTermCourses,
        'Fall'
      );

      if (isValid) {
        saveCourse(course);
        clearValidationError();
      }
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const handleCourseAdd = (course: Course, semesterId: string) => {
    try {
      const [year, term] = semesterId.split('-');
      const isValid = validateCourseSelection(
        course,
        completedCourses,
        currentTermCourses,
        term
      );

      if (isValid) {
        addCourse(course, semesterId);
        removeSavedCourse(course.id);
        clearValidationError();
      }
    } catch (error) {
      console.error('Failed to add course:', error);
    }
  };

  const handleGeneratePlan = () => {
    const planPreferences = {
      prioritizeGrades: preferences.planningStrategy === 'grades',
      balanceWorkload: preferences.planningStrategy === 'workload',
      includeRequirements: preferences.planningStrategy === 'balanced'
    };

    generatePlan(planPreferences);
    setIsPlanGenerated(true);
  };

  const handleSortChange = (newSortBy: SortOption) => {
    if (newSortBy === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container mx-auto px-6">
          {/* School Selection */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">School/College</label>
              <select 
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1"
                value={preferences.school}
                onChange={(e) => setPreferences(prev => ({ ...prev, school: e.target.value }))}
              >
                <option value="">Select School/College</option>
                <option value="L&S">College of Letters & Science</option>
                <option value="ENGR">College of Engineering</option>
                <option value="BUS">School of Business</option>
                <option value="CDIS">School of Computer, Data & Information Sciences</option>
              </select>

              <select
                className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1"
                value={preferences.major}
                onChange={(e) => setPreferences(prev => ({ ...prev, major: e.target.value }))}
              >
                <option value="">Select Major/Program</option>
                <option value="CS">Computer Sciences, BS</option>
                <option value="DS">Data Science, BS</option>
                <option value="STAT">Statistics, BS</option>
                <option value="MATH">Mathematics, BS</option>
              </select>
            </div>

            {/* Academic Status Section */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Academic Status</label>
              <div className="flex space-x-4">
                <select
                  className="flex-1 rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1"
                  value={preferences.classStanding}
                  onChange={(e) => setPreferences(prev => ({ ...prev, classStanding: e.target.value }))}
                >
                  <option value="">Class Standing</option>
                  <option>Freshman</option>
                  <option>Sophomore</option>
                  <option>Junior</option>
                  <option>Senior</option>
                </select>
                
                <select
                  className="flex-1 rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1"
                  value={preferences.graduationYear}
                  onChange={(e) => setPreferences(prev => ({ ...prev, graduationYear: e.target.value }))}
                >
                  <option value="">Graduation Year</option>
                  <option>2028</option>
                  <option>2027</option>
                  <option>2026</option>
                  <option>2025</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <select 
                  className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1"
                  value={preferences.planningStrategy}
                  onChange={(e) => setPreferences(prev => ({ ...prev, planningStrategy: e.target.value as any }))}
                >
                  <option value="grades">Prioritize A Grade %</option>
                  <option value="workload">Balance Workload</option>
                  <option value="balanced">Mix Required/Electives</option>
                </select>
                <button 
                  className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 shadow-sm"
                  onClick={handleGeneratePlan}
                >
                  <Wand2 className="h-4 w-4" />
                  <span>Auto Fill Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Validation Error Display */}
          {validationError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                <p className="text-red-600">{validationError}</p>
              </div>
            </div>
          )}

          {/* Search and Course List */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className={`h-5 w-5 ${loading ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search courses by name, number, or instructor"
              className="w-full pl-10 pr-4 py-2 border rounded-md"
            />
          </div>

          {/* Course Search Results */}
          <div className="space-y-2">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto" />
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-500">
                Failed to load courses. Please try again.
              </div>
            )}

            {courses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onClick={() => handleCourseClick(course)}
                showPrerequisites={true}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="container mx-auto px-6 py-8">
        {/* Auto Fill Preview Banner */}
        {isPlanGenerated && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <Wand2 className="h-5 w-5 text-blue-500" />
                <div>
                  <h3 className="font-medium text-gray-900">4-Year Plan Generated</h3>
                  <p className="text-sm text-gray-600">
                    Optimized for highest A grade probability while meeting all requirements
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button className="text-sm text-gray-600 hover:text-gray-900">View Details</button>
                <button className="text-sm text-blue-500 font-medium hover:text-blue-600">Apply Plan</button>
              </div>
            </div>
          </div>
        )}

        {/* Year Navigation */}
        <div className="flex space-x-2 mb-8">
          {academicPlan.map((year) => (
            <button
              key={year.id}
              onClick={() => setSelectedYear(year.name)}
              className={`px-4 py-2 ${
                selectedYear === year.name
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'hover:bg-gray-50 text-gray-600'
              } rounded-md`}
            >
              {year.name}
            </button>
          ))}
        </div>

{/* Academic Plan Display */}
<div className="space-y-8">
  {academicPlan.map((academicYear) => (
    <AcademicYear
      key={academicYear.id}
      year={academicYear}  // academicYear는 이미 필요한 모든 필드를 포함
      onRemoveCourse={removeCourse}
      onAddCourse={(semesterId, course) => {
        addCourse(course, semesterId);
        removeSavedCourse(course.id);
      }}
      onClearSemester={clearSemester}
    />
  ))}
</div>

        {/* Saved Courses Section */}
        <SavedCourses
          courses={savedCourses}
          onRemove={removeSavedCourse}
          onClearAll={clearSavedCourses}
          onAddToPlan={(course) => handleCourseAdd(course, `${selectedYear}-${course.term[0]}`)}
          onSort={handleSortChange}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </main>
    </div>
  );
}