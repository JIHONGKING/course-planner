// src/components/common/CourseFilters.tsx
import { useState } from 'react';
import { Filter, ChevronDown } from 'lucide-react';

export interface FilterOptions {
  department: string;
  level: string;
  credits: string;
  term: string;
  sortBy: string;
  requirements: string[];
}

interface CourseFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
  expanded?: boolean;
}

const initialFilters: FilterOptions = {
  department: '',
  level: '',
  credits: '',
  term: '',
  sortBy: 'default',
  requirements: []
};

const DEPARTMENTS = [
  { value: 'COMP SCI', label: 'Computer Sciences' },
  { value: 'MATH', label: 'Mathematics' },
  { value: 'STAT', label: 'Statistics' }
];

const LEVELS = [
  { value: '100', label: '100 Level' },
  { value: '200', label: '200 Level' },
  { value: '300', label: '300 Level' },
  { value: '400', label: '400 Level' },
  { value: '500', label: '500+ Level' }
];

const REQUIREMENTS = [
  'Communication',
  'Quantitative',
  'Science',
  'Humanities',
  'Social Science'
];

export default function CourseFilters({ onFilterChange, expanded = false }: CourseFiltersProps) {
  const [isOpen, setIsOpen] = useState(expanded);
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const handleFilterChange = (key: keyof FilterOptions, value: string | string[]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    onFilterChange(initialFilters);
  };

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
        >
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          <ChevronDown className={`h-4 w-4 transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <button
            onClick={resetFilters}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Reset Filters
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">Any Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Course Level</label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">Any Level</option>
                {LEVELS.map(level => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Credits Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Credits</label>
              <select
                value={filters.credits}
                onChange={(e) => handleFilterChange('credits', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="">Any Credits</option>
                {[1, 2, 3, 4, 5].map(credit => (
                  <option key={credit} value={credit}>
                    {credit} Credit{credit !== 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Term Filter */}
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

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm"
              >
                <option value="default">Default</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="credits">Credits</option>
                <option value="grade">Grade</option>
              </select>
            </div>
          </div>

          {/* Requirements */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Requirements</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {REQUIREMENTS.map((req) => (
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