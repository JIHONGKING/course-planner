// src/components/ui/SortControls.tsx
import { ChevronDown, ArrowUpDown } from 'lucide-react';

export type SortOption = {
  value: string;
  label: string;
};

interface SortControlsProps {
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (value: string) => void;
  onOrderChange: () => void;
}

const sortOptions: SortOption[] = [
  { value: 'grade', label: 'Grade Distribution (A%)' },
  { value: 'credits', label: 'Credits' },
  { value: 'code', label: 'Course Number' },
  { value: 'level', label: 'Course Level' }
];

export function SortControls({ 
  sortBy, 
  sortOrder, 
  onSortChange, 
  onOrderChange 
}: SortControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1"
      >
        <option value="">Sort by</option>
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={onOrderChange}
        className="p-1 hover:bg-gray-100 rounded"
        title={sortOrder === 'asc' ? 'Sort Ascending' : 'Sort Descending'}
      >
        <ArrowUpDown className={`h-4 w-4 ${sortOrder === 'desc' ? 'transform rotate-180' : ''}`} />
      </button>
    </div>
  );
}