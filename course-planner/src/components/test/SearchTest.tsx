import React from 'react';
import { Search } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { SortControls } from '@/components/ui/SortControls';

export default function SearchTest() {
  const {
    courses,
    loading,
    error,
    sortBy,
    sortOrder,
    handleSortChange,
    toggleSortOrder,
    searchCourses
  } = useCourses();

  // 검색 요청 디버그용 콘솔 로그
  const handleSearch = (value: string) => {
    console.log('Searching for:', value);
    searchCourses(value);
  };

  // 정렬 변경 디버그용 콘솔 로그
  const handleSort = (newSortBy: any) => {
    console.log('Sorting by:', newSortBy);
    handleSortChange(newSortBy);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search courses (e.g., CS 252, MATH 221)..."
            className="w-full pl-10 pr-4 py-2 border rounded-md"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        </div>
      </div>
      
      {/* Sort Controls */}
      <div className="flex justify-between items-center mb-4">
        <div>
          {courses.length > 0 && (
            <p className="text-sm text-gray-500">
              Found {courses.length} courses
            </p>
          )}
        </div>
        <SortControls
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={handleSort}
          onOrderChange={toggleSortOrder}
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500 mx-auto" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-red-500 text-center py-4 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {courses.map(course => (
          <div key={course.id} className="border p-4 rounded-lg hover:bg-gray-50">
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold text-gray-900">{course.code}</h3>
                <p className="text-gray-600">{course.name}</p>
                <p className="text-sm text-gray-500 mt-1">{course.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{course.credits} Credits</div>
                <div className="text-sm text-green-600">
                  A: {typeof course.gradeDistribution === 'string'
                    ? JSON.parse(course.gradeDistribution).A
                    : course.gradeDistribution.A}%
                </div>
                <div className="text-sm text-gray-500">
                  {course.term.join(', ')}
                </div>
              </div>
            </div>
          </div>
        ))}

        {courses.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No courses found. Try a different search term.
          </div>
        )}
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-md text-sm">
          <h3 className="font-bold mb-2">Debug Info:</h3>
          <pre>
            {JSON.stringify(
              {
                coursesCount: courses.length,
                sortBy,
                sortOrder,
                loading,
                error
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}