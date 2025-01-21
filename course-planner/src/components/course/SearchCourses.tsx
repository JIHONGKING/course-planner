// /Users/jihong/Desktop/AutoClassfinder/course-planner/src/components/course/SearchCourses.tsx

import React, { useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { useOptimizedSearchCourses } from '@/hooks/useOptimizedSearchCourses';
import CourseSearchResults from './CourseSearchResults';
import CourseFilters from './CourseFilters';
import CourseCard from '@/components/common/CourseCard';
import type { Course } from '@/types/course';
import type { SortOption } from '@/utils/sortUtils';
import type { FilterOptions } from '@/components/ui/FilterSection';
import debounce from 'lodash/debounce';

export default function SearchCourses() {
  const {
    courses,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    sortBy,
    sortOrder,
    currentPage,
    totalPages,
    handleSort,
    handleOrderChange,
    handlePageChange,
    searchCourses
  } = useOptimizedSearchCourses({ autoSearch: true });

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  const isValidSearch = useCallback((query: string): boolean => {
    if (query.length < 2) return false;
    const incompleteHangul = /[ㄱ-ㅎㅏ-ㅣ]/;
    if (incompleteHangul.test(query)) return false;
    return true;
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (isValidSearch(value)) {
      searchCourses(value);
    }
  }, [searchCourses, setSearchTerm, isValidSearch]);

  const onFilterChange = useCallback((filters: FilterOptions): void => {
    if (searchTerm) {
      searchCourses(searchTerm, currentPage);
    }
  }, [searchTerm, currentPage, searchCourses]);

  const handleCourseClick = useCallback((course: Course) => {
    setSelectedCourse(course);
  }, []);

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          placeholder="과목명, 과목코드로 검색 (예: CS 300)"
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          disabled={isLoading}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
          </div>
        )}
      </div>

      {/* Course Results */}
      <div className="space-y-2">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onClick={() => handleCourseClick(course)}
            className="cursor-pointer"
            showPrerequisites={true}
          />
        ))}

        {courses.length === 0 && searchTerm && !isLoading && (
          <div className="text-center py-8 text-gray-500">
            검색 결과가 없습니다
          </div>
        )}
      </div>

      {/* Filters */}
      <CourseFilters 
        onFilterChange={onFilterChange} 
      />

      {/* Search Results */}
      <CourseSearchResults
        courses={courses}
        loading={isLoading}
        error={error || undefined}
        currentPage={currentPage}
        totalPages={totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={(sortBy: string) => handleSort(sortBy as SortOption)}
        onOrderChange={handleOrderChange}
        onPageChange={handlePageChange}
      />
    </div>
  );
}