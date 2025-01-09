// src/utils/scheduleUtils.ts

import type { Course, CourseSchedule, ScheduleConflict } from '@/types/course';

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function doTimeSlotsOverlap(slot1: CourseSchedule, slot2: CourseSchedule): boolean {
  if (slot1.dayOfWeek !== slot2.dayOfWeek) return false;

  const start1 = timeToMinutes(slot1.startTime);
  const end1 = timeToMinutes(slot1.endTime);
  const start2 = timeToMinutes(slot2.startTime);
  const end2 = timeToMinutes(slot2.endTime);

  return (start1 < end2) && (end1 > start2);
}

export function findScheduleConflicts(courses: Course[]): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  for (let i = 0; i < courses.length; i++) {
    for (let j = i + 1; j < courses.length; j++) {
      const course1 = courses[i];
      const course2 = courses[j];

      // Skip if either course doesn't have schedules
      if (!course1.courseSchedules?.length || !course2.courseSchedules?.length) continue;

      for (const slot1 of course1.courseSchedules) {
        for (const slot2 of course2.courseSchedules) {
          if (doTimeSlotsOverlap(slot1, slot2)) {
            conflicts.push({
              course1,
              course2,
              overlappingSlots: { slot1, slot2 }
            });
            // Break inner loops once conflict is found
            break;
          }
        }
        if (conflicts.length > conflicts.length - 1) break;
      }
    }
  }

  return conflicts;
}

export function canAddCourseToSchedule(
  newCourse: Course,
  existingCourses: Course[]
): {
  canAdd: boolean;
  conflicts: ScheduleConflict[];
} {
  if (!newCourse.courseSchedules?.length) {
    return { canAdd: true, conflicts: [] };
  }

  const conflicts = existingCourses
    .filter(course => course.courseSchedules?.length)
    .map(existingCourse => {
      const conflict = findTimeConflicts(newCourse, existingCourse);
      return conflict ? {
        course1: newCourse,
        course2: existingCourse,
        overlappingSlots: conflict
      } : null;
    })
    .filter((conflict): conflict is ScheduleConflict => conflict !== null);

  return {
    canAdd: conflicts.length === 0,
    conflicts
  };
}

function findTimeConflicts(course1: Course, course2: Course): { slot1: CourseSchedule; slot2: CourseSchedule } | null {
  if (!course1.courseSchedules?.length || !course2.courseSchedules?.length) {
    return null;
  }

  for (const slot1 of course1.courseSchedules) {
    for (const slot2 of course2.courseSchedules) {
      if (doTimeSlotsOverlap(slot1, slot2)) {
        return { slot1, slot2 };
      }
    }
  }

  return null;
}

export function formatTimeSlot(slot: CourseSchedule): string {
  return `${slot.dayOfWeek} ${slot.startTime}-${slot.endTime}`;
}

export function formatConflictMessage(conflict: ScheduleConflict): string {
  return `Schedule conflict between ${conflict.course1.code} and ${conflict.course2.code}: ` +
    `${formatTimeSlot(conflict.overlappingSlots.slot1)} overlaps with ${formatTimeSlot(conflict.overlappingSlots.slot2)}`;
}

// 수업 시간이 적절한지 검사하는 유틸리티 함수들
export function isValidDayOfWeek(day: string): boolean {
  const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  return validDays.includes(day);
}

export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

export function isValidTimeRange(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }

  return timeToMinutes(startTime) < timeToMinutes(endTime);
}

export function isWithinOperatingHours(
  startTime: string,
  endTime: string,
  operatingHours = { start: '08:00', end: '22:00' }
): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const opStart = timeToMinutes(operatingHours.start);
  const opEnd = timeToMinutes(operatingHours.end);

  return start >= opStart && end <= opEnd;
}