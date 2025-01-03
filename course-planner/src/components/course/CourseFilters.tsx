// src/components/course/CourseFilters.tsx
import React, { useState } from 'react';
import { Filter } from 'lucide-react';

export interface FilterOptions {
  department: string;
  level: string;
  credits: string;
  term: string;
  sortBy: string; // Added sortBy for sorting functionality
}

interface CourseFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
}

const initialFilters: FilterOptions = {
  department: '',
  level: '',
  credits: '',
  term: '',
  sortBy: 'default',
};

export default function CourseFilters({ onFilterChange }: CourseFiltersProps) {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const handleChange = (key: keyof FilterOptions, value: string) => {
    const updatedFilters = { ...filters, [key]: value };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    onFilterChange(initialFilters);
  };

  return (
    <div className="course-filters">
      <div className="filter-group">
        <label htmlFor="department">Department</label>
        <input
          type="text"
          id="department"
          value={filters.department}
          onChange={(e) => handleChange('department', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="level">Level</label>
        <input
          type="text"
          id="level"
          value={filters.level}
          onChange={(e) => handleChange('level', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="credits">Credits</label>
        <input
          type="text"
          id="credits"
          value={filters.credits}
          onChange={(e) => handleChange('credits', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="term">Term</label>
        <input
          type="text"
          id="term"
          value={filters.term}
          onChange={(e) => handleChange('term', e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label htmlFor="sortBy">Sort By</label>
        <select
          id="sortBy"
          value={filters.sortBy}
          onChange={(e) => handleChange('sortBy', e.target.value)}
        >
          <option value="default">Default</option>
          <option value="alphabetical">Alphabetical</option>
          <option value="credits">Credits</option>
          <option value="grade">Grade</option>
        </select>
      </div>

      <button onClick={resetFilters}>Reset Filters</button>
    </div>
  );
}
