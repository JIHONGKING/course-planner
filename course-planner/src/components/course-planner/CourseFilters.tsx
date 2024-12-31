// src/components/course-planner/CourseFilters.tsx
import { useState } from 'react';
import { Filter } from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';

export default function CourseFilters() {
  const [isOpen, setIsOpen] = useState(false);
  const { filterCourses } = useCourses();
  const [filters, setFilters] = useState({
    level: '',
    term: '',
    department: '',
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    filterCourses(newFilters);
  };

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
      >
        <Filter className="h-4 w-4" />
        <span>Filters</span>
      </button>

      {isOpen && (
        <div className="mt-2 p-4 border border-gray-200 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Level</label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="">All Levels</option>
                <option value="100">100 Level</option>
                <option value="200">200 Level</option>
                <option value="300">300 Level</option>
                <option value="400">400 Level</option>
                <option value="500">500 Level</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Term</label>
              <select
                value={filters.term}
                onChange={(e) => handleFilterChange('term', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="">All Terms</option>
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="">All Departments</option>
                <option value="COMP SCI">Computer Science</option>
                <option value="MATH">Mathematics</option>
                <option value="STAT">Statistics</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}