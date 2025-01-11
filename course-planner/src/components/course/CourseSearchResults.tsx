// src/components/course/CourseSearchResults.tsx
import React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Course } from '@/types/course';

export interface CourseSearchResultsProps {
  courses: Course[];
  loading: boolean;
  error?: string;
  currentPage: number;
  totalPages: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSort?: (sortBy: string) => void;
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
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
        No courses found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <div className="flex justify-between">
            <div>
              <h3 className="font-medium">{course.code}</h3>
              <p className="text-sm text-gray-500">{course.name}</p>
            </div>
            <div className="text-sm text-gray-500">
              {course.credits} credits
            </div>
          </div>
        </div>
      ))}
      
      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => onPageChange(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1
                  ? 'bg-red-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}