// src/components/course-planner/CoursePlanner.tsx

import React, { useState, useCallback } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Search, Filter, AlertCircle } from 'lucide-react';
import type { Course } from '@/types/course';
import { usePlanner } from '@/hooks/usePlanner';
import { useOptimizedSearchCourses } from '@/hooks/useOptimizedSearchCourses';
import { useMemoryMonitoring } from '@/hooks/useMemoryMonitoring';
import DraggableCourseCard from '@/components/common/DraggableCourseCard';
import CourseSearchResults from '@/components/course/CourseSearchResults';
import YearPlanner from '../course-planner/YearPlanner';  // 경로 수정


export default function CoursePlanner() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [draggedCourse, setDraggedCourse] = useState<Course | null>(null);

  const { courses, searchCourses, isLoading } = useOptimizedSearchCourses();
  const { academicPlan, addCourse, moveCourse } = usePlanner();
  const { trackOperation } = useMemoryMonitoring({
    componentName: 'CoursePlanner',
    monitoringInterval: 3000, 
    warningThreshold: 80,
    onLeak: (leak) => {
      console.warn('Memory leak detected:', leak);
    }
  });


  // 향상된 드래그 앤 드롭 핸들러
  const handleDragStart = useCallback((course: Course) => {
    setDraggedCourse(course);
    document.body.style.cursor = 'grabbing';
  }, []);

    

  const handleDragEnd = useCallback(() => {
    setDraggedCourse(null);
    // 드래그 종료 시 커서 복원
    document.body.style.cursor = 'default';
  }, []);


  const handleDrop = useCallback((courseId: string, targetSemesterId: string) => {
    trackOperation(
      'moveCourse',
      'computation',
      async () => moveCourse(courseId, '', targetSemesterId)  // fromSemesterId 추가
    );
  }, [moveCourse, trackOperation]);

  // 향상된 검색 핸들러
  const handleSearch = useCallback(async (term: string) => {
    setSearchTerm(term);
    if (term.length >= 2) {
      await trackOperation(
        'searchCourses',
        'api',
        () => searchCourses(term)
      );
    }
  }, [searchCourses, trackOperation]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        {/* 상단 검색바 */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="과목 검색..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg ${
                  showFilters ? 'bg-blue-50 text-blue-600' : 'text-gray-500'
                }`}
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 왼쪽: 검색 결과 */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-4">
                <h2 className="text-lg font-medium mb-4">검색 결과</h2>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                  </div>
                ) : courses.length > 0 ? (
                  <div className="space-y-2">
                    {courses.map((course) => (
                      <DraggableCourseCard
                        key={course.id}
                        course={course}
                        onDragStart={() => handleDragStart(course)}
                        onDragEnd={handleDragEnd}
                        className="hover:shadow-md transition-shadow"
                      />
                    ))}
                  </div>
                ) : searchTerm ? (
                  <div className="flex items-center justify-center py-8 text-gray-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    검색 결과가 없습니다
                  </div>
                ) : null}
              </div>
            </div>

            {/* 오른쪽: 학년 계획 */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {academicPlan.map((year) => (
                  <YearPlanner
                    key={year.id}
                    year={year}
                    onDrop={handleDrop}
                    draggedCourse={draggedCourse}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 드래그 중인 과목 프리뷰 */}
        {draggedCourse && (
          <div 
            className="fixed pointer-events-none bg-white rounded-lg shadow-lg p-4 z-50"
            style={{
              left: '0px',
              top: '0px',
              transform: 'translate(var(--drag-x, 0px), var(--drag-y, 0px))'
            }}
          >
            <h3 className="font-medium">{draggedCourse.code}</h3>
            <p className="text-sm text-gray-500">{draggedCourse.name}</p>
          </div>
        )}
      </div>
    </DndProvider>
  );
}