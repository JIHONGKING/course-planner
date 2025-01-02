// src/components/course-planner/CourseFilters.tsx
import { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';
import type { FilterOptions } from '@/types/course';

interface CourseFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
}

const initialFilters: FilterOptions = {
  level: '',
  term: '',
  department: '',
  credits: '',
  requirements: []  // 빈 배열로 초기화
};

export default function CourseFilters({ onFilterChange }: CourseFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const handleFilterChange = (key: keyof FilterOptions, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <Filter className="h-4 w-4" />
        <span>Advanced Filters</span>
        <ChevronDown className={`h-4 w-4 transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Level</label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">Any Level</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500+ Level</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Credits</label>
              <select
                value={filters.credits}
                onChange={(e) => handleFilterChange('credits', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">Any Credits</option>
                <option value="1">1 Credit</option>
                <option value="2">2 Credits</option>
                <option value="3">3 Credits</option>
                <option value="4">4 Credits</option>
                <option value="5">5 Credits</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Term</label>
              <select
                value={filters.term}
                onChange={(e) => handleFilterChange('term', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">Any Term</option>
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Requirements</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {['Communication', 'Quantitative', 'Science', 'Humanities', 'Social Science'].map((req) => (
                <label key={req} className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-red-600 shadow-sm focus:border-red-300 focus:ring focus:ring-red-200 focus:ring-opacity-50"
                    checked={filters.requirements.includes(req)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleFilterChange('requirements', [...filters.requirements, req]);
                      } else {
                        handleFilterChange(
                          'requirements',
                          filters.requirements.filter(r => r !== req)
                        );
                      }
                    }}
                  />
                  <span className="ml-2 text-sm text-gray-600">{req}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}