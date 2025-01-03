// src/app/search/page.tsx
'use client';

import { useState } from 'react';
import { useSearchCourses } from '@/hooks/useSearchCourses';
import CourseSearchResults from '@/components/course/CourseSearchResults';
import { Search } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const { courses, isLoading, error, searchCourses } = useSearchCourses();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchCourses(query);
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
        </div>
      </form>

      <CourseSearchResults
        courses={courses}
        isLoading={isLoading}
        error={error || undefined}
      />
    </main>
  );
}