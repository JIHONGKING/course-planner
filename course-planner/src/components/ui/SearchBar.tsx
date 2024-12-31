import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const { searchCourses, loading } = useCourses();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) {
        searchCourses(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, searchCourses]);

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 ${loading ? 'text-blue-500' : 'text-gray-400'}`} />
      </div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search courses by name, number, subject, or instructor"
        className="w-full pl-10 pr-16 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
      />
      {searchTerm && (
        <button
          onClick={() => setSearchTerm('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
}