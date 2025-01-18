// src/components/ui/SearchBar.tsx
// src/components/ui/SearchBar.tsx
import { useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { useOptimizedSearchCourses } from '@/hooks/useOptimizedSearchCourses';  // 변경된 부분
import debounce from 'lodash/debounce';

export default function SearchBar() {
  const [searchTerm, setSearchTerm] = useState('');
  const { searchCourses, isLoading } = useOptimizedSearchCourses();  // 변경된 부분

  // 디바운스된 검색 함수 생성
  const debouncedSearch = useCallback(
    debounce((term: string) => {
      if (term) {
        searchCourses(term);
      }
    }, 300),
    [searchCourses]
  );

  // 검색어 변경 시 API 호출
  useEffect(() => {
    debouncedSearch(searchTerm);
    // 클린업 함수
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchTerm, debouncedSearch]);

  const handleClear = () => {
    setSearchTerm('');
    debouncedSearch.cancel();
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 ${isLoading ? 'text-blue-500' : 'text-gray-400'}`} />
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
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-3 flex items-center"
        >
          <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
        </button>
      )}
    </div>
  );
}