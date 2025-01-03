// src/lib/validators/courseValidator.ts
import type { Course } from '@/types/course';

export function validateCourseData(course: Course): string[] {
  const errors = [];
  if (!course.code) errors.push('Course code is required');
  if (!course.name) errors.push('Course name is required');
  if (course.credits <= 0) errors.push('Credits must be positive');
  return errors;
}

export function validateCourse(course: Course) {
  const errors: string[] = [];
  
  if (!course.code) {
    errors.push('Course code is required');
  }
  
  if (course.credits <= 0) {
    errors.push('Credits must be greater than 0');
  }
  
  return errors;
}