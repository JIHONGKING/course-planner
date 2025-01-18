// src/components/course/SearchCourses.tsx

import React from 'react';
import { Search } from 'lucide-react';
import { useOptimizedSearchCourses } from '@/hooks/useOptimizedSearchCourses';
import CourseSearchResults from './CourseSearchResults';
import CourseFilters from './CourseFilters';
import type { Course } from '@/types/course';
import type { SortOption } from '@/utils/sortUtils';
import type { FilterOptions } from '@/components/ui/FilterSection';

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

  const isValidSearch = (query: string): boolean => {
    if (query.length < 2) return false;
    const incompleteHangul = /[ㄱ-ㅎㅏ-ㅣ]/;
    if (incompleteHangul.test(query)) return false;
    return true;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setSearchTerm(value);

    if (isValidSearch(value)) {
      searchCourses(value);
    }
  };

  // Filter Change Handler
  const onFilterChange = (filters: FilterOptions): void => {
    if (searchTerm) {
      searchCourses(searchTerm, currentPage);
    }
  };

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
      <div className="space-y-4">
        {courses.length > 0 ? (
          courses.map((course: Course) => (
            <div key={course.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
              <div className="flex justify-between">
                <div>
                  <h3 className="text-lg font-medium">{course.code}</h3>
                  <p className="text-gray-600">{course.name}</p>
                  <p className="text-sm text-gray-500 mt-1">{course.credits} credits</p>
                </div>
                {course.courseSchedules && course.courseSchedules.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {course.courseSchedules.map((schedule, index: number) => (
                      <div key={index}>
                        {schedule.dayOfWeek} {schedule.startTime}-{schedule.endTime}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {course.description && (
                <p className="mt-2 text-sm text-gray-500">{course.description}</p>
              )}
            </div>
          ))
        ) : (
          !isLoading && searchTerm && (
            <div className="text-center py-8 text-gray-500">
              검색 결과가 없습니다
            </div>
          )
        )}
      </div>

      {/* Filters and Results Pagination */}
      <CourseFilters onFilterChange={onFilterChange} />

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