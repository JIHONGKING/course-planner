// src/components/ui/FilterSection.tsx
import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { COURSE_LEVELS } from '@/data/constants';

interface FilterSectionProps {
 onFilterChange: (filterType: string, value: string) => void;
}

export interface FilterOptions {
  department?: string;
  level?: string;
  term?: string;
}

export default function FilterSection({ onFilterChange }: FilterSectionProps) {
 const [isOpen, setIsOpen] = useState(false);
 const [activeFilters, setActiveFilters] = useState<{[key: string]: string}>({});

 const handleFilterAdd = (type: string, value: string) => {
   setActiveFilters(prev => ({ ...prev, [type]: value }));
   onFilterChange(type, value);
 };

 const handleFilterRemove = (type: string) => {
   setActiveFilters(prev => {
     const newFilters = { ...prev };
     delete newFilters[type];
     return newFilters;
   });
   onFilterChange(type, '');
 };

 return (
   <div className="mt-2">
     {/* Active Filters */}
     <div className="flex flex-wrap gap-2 mb-2">
       {Object.entries(activeFilters).map(([type, value]) => (
         <div
           key={type}
           className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-sm"
         >
           <span>{type}: {value}</span>
           <button
             onClick={() => handleFilterRemove(type)}
             className="text-gray-500 hover:text-gray-700"
           >
             <X className="h-3 w-3" />
           </button>
         </div>
       ))}
     </div>

     {/* Filter Actions */}
     <div className="flex items-center space-x-4 text-sm">
       <button
         onClick={() => setIsOpen(!isOpen)}
         className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
       >
         <Filter className="h-4 w-4" />
         <span>Filters</span>
       </button>
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

     {/* Filter Panel */}
     {isOpen && (
       <div className="mt-2 p-4 border border-gray-200 rounded-md bg-white shadow-sm">
         <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Course Level
             </label>
             <select
               onChange={(e) => handleFilterAdd('level', e.target.value)}
               className="w-full rounded-md border border-gray-300 p-2"
               value={activeFilters['level'] || ''}
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
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Term
             </label>
             <select
               onChange={(e) => handleFilterAdd('term', e.target.value)}
               className="w-full rounded-md border border-gray-300 p-2"
               value={activeFilters['term'] || ''}
             >
               <option value="">All Terms</option>
               <option value="Fall">Fall</option>
               <option value="Spring">Spring</option>
               <option value="Summer">Summer</option>
             </select>
           </div>

           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Department
             </label>
             <select
               onChange={(e) => handleFilterAdd('department', e.target.value)}
               className="w-full rounded-md border border-gray-300 p-2"
               value={activeFilters['department'] || ''}
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