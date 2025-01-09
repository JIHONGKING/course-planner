// src/utils/sortUtils.ts

import type { Course } from '@/types/course';
import { getGradeA } from './gradeUtils';

export type SortOption = 'grade' | 'credits' | 'code' | 'level' | 'name';
export type SortOrder = 'asc' | 'desc';


export function sortCourses(courses: Course[], sortBy: SortOption, order: SortOrder = 'desc'): Course[] {
  const sorted = [...courses].sort((a, b) => {
    switch (sortBy) {
      case 'grade':
        const gradeA = parseFloat(getGradeA(a.gradeDistribution));
        const gradeB = parseFloat(getGradeA(b.gradeDistribution));
        return order === 'desc' ? gradeB - gradeA : gradeA - gradeB;
      
      case 'credits':
        return order === 'desc' ? b.credits - a.credits : a.credits - b.credits;
      
      case 'code':
        return order === 'desc' ? 
          b.code.localeCompare(a.code) : 
          a.code.localeCompare(b.code);
      
      case 'level':
        return order === 'desc' ? 
          parseInt(b.level) - parseInt(a.level) : 
          parseInt(a.level) - parseInt(b.level);
      
      default:
        return 0;
    }
  });

  return sorted;
}

export const SORT_OPTIONS = [
  { value: 'grade', label: 'A Grade %' },
  { value: 'credits', label: 'Credits' },
  { value: 'code', label: 'Course Code' },
  { value: 'level', label: 'Course Level' }
] as const;