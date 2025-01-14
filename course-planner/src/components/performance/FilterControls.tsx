// src/components/performance/FilterControls.tsx

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, X } from 'lucide-react';
import type { FilterOptions } from '@/lib/performance/filterSystem';

interface FilterControlsProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export function FilterControls({ onFilterChange }: FilterControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | 'custom'>('24h');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [threshold, setThreshold] = useState<number>(1000);
  
  const handleApplyFilters = () => {
    const now = Date.now();
    let timeRangeFilter;
    
    switch (timeRange) {
      case '1h':
        timeRangeFilter = { start: now - 3600000, end: now };
        break;
      case '24h':
        timeRangeFilter = { start: now - 86400000, end: now };
        break;
      case '7d':
        timeRangeFilter = { start: now - 604800000, end: now };
        break;
      default:
        timeRangeFilter = undefined;
    }

    const filters: FilterOptions = {
      timeRange: timeRangeFilter,
      category: selectedCategories.length > 0 ? selectedCategories : undefined,
      threshold
    };

    onFilterChange(filters);
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          {isOpen && (
            <button
              onClick={() => {
                setSelectedCategories([]);
                setTimeRange('24h');
                setThreshold(1000);
                onFilterChange({});
              }}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Reset
            </button>
          )}
        </div>

        {isOpen && (
          <div className="mt-4 space-y-4">
            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Time Range</label>
              <div className="mt-1 grid grid-cols-4 gap-2">
                {(['1h', '24h', '7d', 'custom'] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1 rounded-md text-sm ${
                      timeRange === range
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Threshold */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Performance Threshold (ms)
              </label>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Number(e.target.value))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Apply Button */}
            <button
              onClick={handleApplyFilters}
              className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Apply Filters
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}