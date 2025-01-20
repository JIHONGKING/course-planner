// src/components/course-planner/OptimizedCoursePlanner.tsx
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Search, Filter, AlertCircle } from 'lucide-react';
import type { Course } from '@/types/course';
import PaginatedSearchResults from './PaginatedSearchResults';
import { usePlanner } from '@/hooks/usePlanner';
import { useOptimizedSearchCourses } from '@/hooks/useOptimizedSearchCourses';
import { useMemoryMonitoring } from '@/hooks/useMemoryMonitoring';
import OptimizedDraggable from '@/components/common/OptimizedDraggable';
import OptimizedDroppable from '@/components/common/OptimizedDroppable';
import CourseSearchResults from '@/components/course/CourseSearchResults';
import YearPlanner from '../course-planner/YearPlanner';

const SEARCH_DEBOUNCE_MS = 300;

const OptimizedCoursePlanner: React.FC = () => {
  // Refs for performance optimization
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSearchRef = useRef<string>('');

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [draggedCourse, setDraggedCourse] = useState<Course | null>(null);

  // Custom hooks
  const { courses, searchCourses, isLoading } = useOptimizedSearchCourses();
  const { academicPlan, addCourse, moveCourse } = usePlanner();
  const { trackOperation } = useMemoryMonitoring({
    componentName: 'CoursePlanner',
    monitoringInterval: 3000,
    warningThreshold: 80
  });

  // Memoized drag handlers
  const handleDragStart = useCallback((course: Course) => {
    setDraggedCourse(course);
    document.body.style.cursor = 'grabbing';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedCourse(null);
    document.body.style.cursor = 'default';
  }, []);

  // Memoized drop handler
  const handleDrop = useCallback(async (courseId: string, targetSemesterId: string): Promise<unknown> => {
    return trackOperation(
      'moveCourse',
      'computation',
      async () => {
        const result = await moveCourse(courseId, '', targetSemesterId);
        return result;
      }
    );
  }, [moveCourse, trackOperation]);

  // Optimized search handler with debouncing
  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (term === lastSearchRef.current) return;

    searchTimeoutRef.current = setTimeout(async () => {
      if (term.length >= 2) {
        lastSearchRef.current = term;
        await trackOperation(
          'searchCourses',
          'api',
          () => searchCourses(term)
        );
      }
    }, SEARCH_DEBOUNCE_MS);
  }, [searchCourses, trackOperation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Handle page change
  const handlePageChange = useCallback(async (page: number) => {
    await trackOperation(
      'changePage',
      'api',
      async () => {
        setCurrentPage(page);
        if (searchTerm) {
          await searchCourses(searchTerm, page);
        }
      }
    );
  }, [searchTerm, searchCourses, trackOperation]);

  // Memoized search results section
  const searchResultsSection = useMemo(() => (
    <div className="lg:col-span-1">
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-4">Search Results</h2>
        <PaginatedSearchResults
          courses={courses}
          isLoading={isLoading}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  ), [courses, isLoading, currentPage, totalPages, handlePageChange, handleDragStart, handleDragEnd, searchTerm]);

  // Memoized planner section
  const plannerSection = useMemo(() => (
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
  ), [academicPlan, handleDrop, draggedCourse]);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50">
        {/* Search Bar */}
        <div className="sticky top-0 z-10 bg-white border-b shadow-sm p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search courses..."
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

        {/* Main Content */}
        <div className="max-w-7xl mx-auto p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {searchResultsSection}
            {plannerSection}
          </div>
        </div>

        {/* Drag Preview */}
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
};

export default React.memo(OptimizedCoursePlanner);