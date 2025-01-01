// src/components/layout/Header.tsx
import { useState } from 'react';
import { Search, Wand2 } from 'lucide-react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { SCHOOLS, MAJORS, CLASS_STANDINGS } from '@/data/constants';

interface HeaderProps {
  onSearch: (query: string) => Promise<void>;
}

export default function Header({ onSearch }: HeaderProps) {
  const { preferences, updatePreference } = useUserPreferences();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await onSearch(searchQuery);
  };

  const handleSearchClick = async () => {
    await onSearch(searchQuery);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Academic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <select
              className="w-full p-2 border rounded"
              value={preferences.school}
              onChange={(e) => updatePreference('school', e.target.value)}
            >
              <option value="">Select School/College</option>
              {SCHOOLS.map((school) => (
                <option key={school.id} value={school.id}>{school.name}</option>
              ))}
            </select>
          </div>

          <div className="flex space-x-4">
            <select
              className="flex-1 p-2 border rounded"
              value={preferences.classStanding}
              onChange={(e) => updatePreference('classStanding', e.target.value)}
            >
              <option value="">Class Standing</option>
              {CLASS_STANDINGS.map((standing) => (
                <option key={standing}>{standing}</option>
              ))}
            </select>
            
            <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              <span>Auto Fill</span>
            </button>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by name, number, or instructor"
            className="w-full pl-10 pr-4 py-2 border rounded"
          />
          <button
            type="button"
            onClick={handleSearchClick}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <Search className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}