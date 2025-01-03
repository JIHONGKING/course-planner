// src/components/ui/Pagination.tsx
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  // 페이지 번호 계산
  const getPageNumbers = () => {
    const MAX_VISIBLE_PAGES = 5;
    const pages: (number | string)[] = [];
    
    if (totalPages <= MAX_VISIBLE_PAGES) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // 항상 첫 페이지 표시
    pages.push(1);
    
    // 현재 페이지 주변 페이지 계산
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      end = Math.min(totalPages - 1, MAX_VISIBLE_PAGES - 1);
    }
    
    if (currentPage >= totalPages - 2) {
      start = Math.max(2, totalPages - MAX_VISIBLE_PAGES + 2);
    }

    // 시작 부분에 ... 추가
    if (start > 2) {
      pages.push('...');
    }

    // 중간 페이지 추가
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // 끝 부분에 ... 추가
    if (end < totalPages - 1) {
      pages.push('...');
    }

    // 항상 마지막 페이지 표시
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2 mt-6">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
          currentPage === 1 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <div className="flex space-x-1">
        {pageNumbers.map((page, index) => (
          typeof page === 'number' ? (
            <button
              key={index}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
                currentPage === page
                  ? 'bg-red-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          ) : (
            <span
              key={index}
              className="px-3 py-1 text-gray-400"
            >
              {page}
            </span>
          )
        ))}
      </div>

      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 ${
          currentPage === totalPages 
            ? 'text-gray-300 cursor-not-allowed' 
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}