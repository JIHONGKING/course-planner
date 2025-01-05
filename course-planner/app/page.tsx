'use client';

import React, { useState } from 'react';
import { Wand2, ChevronDown, X, Plus, Trash2, Search, Info } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { usePlanner } from '@/hooks/usePlanner';
import { usePrerequisiteValidation } from '@/hooks/usePrerequisiteValidation';
import type { Course, GradeDistribution } from '@/types/course';
import CourseCard from '@/components/course/CourseCard';

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
      // 선수과목 검증 추가
      const isValid = validateCourseSelection(
        course,
        completedCourses,
        currentTermCourses,
        'Fall' // 현재는 하드코딩, 나중에 동적으로 변경
      );

      if (isValid) {
        saveCourse(course);
        clearValidationError();
      }
    } catch (error) {
      console.error('Failed to save course:', error);
    }
  };

  const renderGradeA = (course: Course) => {
    const gradeData = parseGradeDistribution(course.gradeDistribution);
    return (
      <div className="text-sm text-green-600 font-medium">
        A: {gradeData.A}%
      </div>
    );
  };

  const handleCourseAdd = (course: Course, semesterId: string) => {
    try {
      // 선수과목 검증 추가
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
          {academicPlan.map((year) => (
            <div key={year.id} className="border border-gray-200 rounded-lg shadow-sm">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-900">{year.year}</h2>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-600">
                      Total Credits: {calculateYearCredits(year.id)}/30
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
                              {calculateCredits(semester.id)} credits
                            </span>
                            <button 
                              onClick={() => clearSemester(semester.id)}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 space-y-2">
                        {semester.courses.map((course) => (
                          <CourseCard
                            key={course.id}
                            course={course}
                            showPrerequisites={false}
                            onRemove={() => removeCourse(course.id, semester.id)}
                            onClick={() => {}} // 빈 onClick 핸들러 추가
                          />
                        ))}
                        {semester.courses.length < 6 && (
                          <div className="flex justify-center items-center min-h-[60px]">
                            <button 
                              className="flex items-center space-x-1 text-gray-400 hover:text-gray-600"
                              onClick={() => setSelectedYear(year.name)}
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
          ))}
        </div>

        {/* Saved Courses Section */}
        <div className="mt-8 border-t border-gray-200 pt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Saved for later</h2>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => clearSavedCourses()}
                className="text-sm text-red-500 hover:text-red-600 flex items-center space-x-1"
              >
                <Trash2 className="h-4 w-4" />
                <span>Clear All</span>
              </button>
              <select className="text-sm border border-gray-300 rounded-md px-2 py-1">
                <option>Highest A %</option>
                <option>Required First</option>
                <option>Credits</option>
              </select>
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {savedCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  showPrerequisites={true}
                  onRemove={() => removeSavedCourse(course.id)}
                  onClick={() => handleCourseAdd(course, `${selectedYear}-${course.term[0]}`)}
                />
              ))}
              {savedCourses.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No saved courses yet
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
  }