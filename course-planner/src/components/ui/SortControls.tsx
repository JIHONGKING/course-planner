import { ArrowUpDown } from 'lucide-react';
import type { SortOption, SortOrder } from '@/utils/sortUtils';

interface SortControlsProps {
  sortBy: SortOption;
  sortOrder: SortOrder;
  onSortChange: (value: SortOption) => void;
  onOrderChange: () => void;
}

export function SortControls({ 
  sortBy, 
  sortOrder, 
  onSortChange, 
  onOrderChange 
}: SortControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        value={sortBy}
        onChange={(e) => onSortChange(e.target.value as SortOption)}
        className="text-sm border border-gray-300 rounded-md px-2 py-1.5 pr-8 
                   focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
      >
        <option value="grade">Grade (A%)</option>
        <option value="credits">Credits</option>
        <option value="code">Course Number</option>
        <option value="level">Course Level</option>
      </select>

      {sortBy && (
        <button
          onClick={onOrderChange}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors
                   focus:outline-none focus:ring-2 focus:ring-red-500"
          title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
        >
          <ArrowUpDown 
            className={`h-4 w-4 transition-transform ${
              sortOrder === 'desc' ? 'transform rotate-180' : ''
            }`}
          />
        </button>
      )}
    </div>
  );
}