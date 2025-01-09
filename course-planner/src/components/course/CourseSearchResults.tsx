// src/components/course/CourseSearchResults.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Course } from '@/types/course';
import type { SortOption, SortOrder } from '@/utils/sortUtils';
import CourseCard from '@/components/common/CourseCard';
import { Pagination } from '@/components/ui/Pagination';
import { SortControls } from '@/components/ui/SortControls';

interface CourseSearchResultsProps {
  courses: Course[];
  loading: boolean;
  error?: string | null;
  currentPage: number;
  totalPages: number;
  sortBy: SortOption;
  sortOrder: SortOrder;
  onSort?: (sortBy: SortOption) => void;
  onOrderChange?: () => void;
  onPageChange?: (page: number) => void;
}



export default function CourseSearchResults({
  courses,
  loading,
  error,
  currentPage,
  totalPages,
  sortBy,
  sortOrder,
  onSort,
  onOrderChange,
  onPageChange
}: CourseSearchResultsProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8 text-red-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>{error}</span>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        검색 결과가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">
          총 {courses.length}개의 과목
        </p>
        {onSort && <SortControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={onSort}
          onOrderChange={onOrderChange || (() => {})}  // 기본 빈 함수 제공
          />}
      </div>

      <div className="space-y-2">
        {courses.map(course => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>

      {onPageChange && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}