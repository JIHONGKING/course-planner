// src/components/course-planner/PaginatedSearchResults.tsx
import React, { useCallback, memo } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import type { Course } from '@/types/course';
import OptimizedDraggable from '../common/OptimizedDraggable';

interface PaginatedSearchResultsProps {
  courses: Course[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onDragStart: (course: Course) => void;
  onDragEnd: () => void;
  searchTerm: string;
}

const ITEMS_PER_PAGE = 10;

const PaginatedSearchResults = memo(({
  courses,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onDragStart,
  onDragEnd,
  searchTerm
}: PaginatedSearchResultsProps) => {
  // 페이지 변경 핸들러
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  }, [totalPages, onPageChange]);

  // 페이지 번호 배열 생성
  const getPageNumbers = useCallback(() => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // 첫 페이지
    pages.push(1);
    
    let startPage = Math.max(2, page - 1);
    let endPage = Math.min(totalPages - 1, page + 1);

    if (page <= 3) {
      endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
    }
    
    if (page >= totalPages - 2) {
      startPage = Math.max(2, totalPages - maxVisiblePages + 2);
    }

    if (startPage > 2) {
      pages.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages - 1) {
      pages.push('...');
    }

    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  }, [page, totalPages]);

  // 로딩 상태 표시
  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  // 검색 결과 없음
  if (courses.length === 0 && searchTerm) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-500">
        <AlertCircle className="h-5 w-5 mr-2" />
        No results found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 검색 결과 목록 */}
      <div className="space-y-2">
        {courses.map((course) => (
          <OptimizedDraggable
            key={course.id}
            course={course}
            onDragStart={() => onDragStart(course)}
            onDragEnd={onDragEnd}
            className="hover:shadow-md transition-shadow"
          />
        ))}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-4">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={`p-2 rounded-md ${
              page === 1
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex space-x-1">
            {getPageNumbers().map((pageNum, index) => (
              typeof pageNum === 'number' ? (
                <button
                  key={index}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-3 py-1 rounded-md ${
                    page === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              ) : (
                <span
                  key={index}
                  className="px-3 py-1 text-gray-400"
                >
                  {pageNum}
                </span>
              )
            ))}
          </div>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className={`p-2 rounded-md ${
              page === totalPages
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
});

PaginatedSearchResults.displayName = 'PaginatedSearchResults';

export default PaginatedSearchResults;