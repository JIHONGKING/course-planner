// src/app/search/page.tsx'use client';

import { useState } from 'react';
import { useSearchCourses } from '@/hooks/useSearchCourses';
import CourseSearchResults from '@/components/course/CourseSearchResults';
import { Search } from 'lucide-react';
import type { SortOrder } from '@/utils/sortUtils';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { 
    courses, 
    isLoading, 
    error, 
    searchCourses,
    currentPage,
    totalPages,
    searchTerm,
    setSearchTerm
  } = useSearchCourses();
  
  const [sortBy, setSortBy] = useState<string>('grade');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchCourses(query);
  };

  const handleSort = (newSortBy: string) => {
    setSortBy(newSortBy);
    if (query) {
      searchCourses(query);
    }
  };

  const handleOrderChange = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    if (query) {
      searchCourses(query);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Course Search</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for courses..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" />
            </div>
          )}
        </div>
      </form>

      <CourseSearchResults
        courses={courses}
        loading={isLoading}
        error={error || undefined}
        currentPage={currentPage}
        totalPages={totalPages}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onOrderChange={handleOrderChange}
        onPageChange={(page) => searchCourses(query, page)}
      />
    </main>
  );
}