// src/lib/validators/scheduleValidator.ts
import type { Course } from '@/types/course';

export function checkScheduleConflicts(
  existingCourses: Course[], 
  newCourse: Course
): boolean {
  // 시간표 충돌 검사 로직
  return false;
}