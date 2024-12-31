import { useState } from 'react';
import { Search, Wand2, GraduationCap, Book, School } from 'lucide-react';
import { useUserPreferences } from '@/src/hooks/useUserPreferences';
import { SCHOOLS, MAJORS, CLASS_STANDINGS, PLANNING_STRATEGIES } from '@/src/data/constants';
import { ClassStanding } from '@/src/types/course';

interface HeaderProps {
  onSearch: (query: string) => void;
  onFilterChange: (filterType: string, value: string) => void;
}

export default function Header({ onSearch, onFilterChange }: HeaderProps) {
  const { preferences, updatePreference } = useUserPreferences();
  const [searchQuery, setSearchQuery] = useState('');
  const [isPlanGenerated, setIsPlanGenerated] = useState(false); // 계획 생성 여부 state

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="sticky top-0 bg-white border-b border-gray-200 z-10 py-4">
      <div className="container mx-auto px-6">
        {/* Schools and Major Selection */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">School/College</label>
            <select
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1"
              value={preferences.school}
              onChange={(e) => updatePreference('school', e.target.value)}
            >
              <option value="">Select School/College</option>
              {SCHOOLS.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>

            <select
              className="w-full rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1"
              value={preferences.major}
              onChange={(e) => updatePreference('major', e.target.value)}
            >
              <option value="">Select Major/Program</option>
              {preferences.school &&
                MAJORS[preferences.school as keyof typeof MAJORS]?.map((major) => (
                  <option key={major.id} value={major.id}>
                    {major.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Academic Status</label>
            <div className="flex space-x-4">
              <select
                className="flex-1 rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1"
                value={preferences.classStanding}
                onChange={(e) =>
                  updatePreference('classStanding', e.target.value as ClassStanding)
                }
              >
                <option value="">Class Standing</option>
                {CLASS_STANDINGS.map((standing) => (
                  <option key={standing}>{standing}</option>
                ))}
              </select>

              <select
                className="flex-1 rounded-md border border-gray-300 p-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1"
                value={preferences.graduationYear}
                onChange={(e) => updatePreference('graduationYear', e.target.value)}
              >
                <option value="">Graduation Year</option>
                {[2025, 2026, 2027, 2028].map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <select
                className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1"
                value={preferences.planningStrategy}
                onChange={(e) =>
                  updatePreference(
                    'planningStrategy',
                    e.target.value as 'GPA' | 'Workload' | 'Balance',
                  )
                }
              >
                {PLANNING_STRATEGIES.map((strategy) => (
                  <option key={strategy.id} value={strategy.id}>
                    {strategy.name}
                  </option>
                ))}
              </select>
              <button
                className="flex items-center space-x-2 bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 shadow-sm"
                onClick={() => setIsPlanGenerated(true)} // 계획 생성 state 업데이트
              >
                <Wand2 className="h-4 w-4" />
                <span>Auto Fill Plan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search courses by name, number, subject, or instructor (e.g. COMP SCI 540, CS 577)"
            className="w-full pl-10 pr-16 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 space-x-2">
            <button
              onClick={() => onFilterChange('type', 'requirements')}
              className="p-1 hover:text-red-600"
              title="Search by Requirements"
            >
              <GraduationCap className="h-5 w-5" />
            </button>
            <button
              onClick={() => onFilterChange('type', 'level')}
              className="p-1 hover:text-red-600"
              title="Search by Course Level"
            >
              <Book className="h-5 w-5" />
            </button>
            <button
              onClick={() => onFilterChange('type', 'department')}
              className="p-1 hover:text-red-600"
              title="Search by Department"
            >
              <School className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-4 mt-2 text-sm">
          <button className="text-gray-600 hover:text-red-600">
            + Add Course Requirements Filter
          </button>
          <button className="text-gray-600 hover:text-red-600">
            + Add Time/Day Filter
          </button>
          <button className="text-gray-600 hover:text-red-600">
            + Add Professor Filter
          </button>
        </div>
      </div>
    </div>
  );
}