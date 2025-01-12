// src/utils/scheduleUtils.ts

import type { Course, CourseSchedule, DayOfWeek, ScheduleConflict } from '@/types/course';

export interface TimeRange {
  start: string;
  end: string;
}

export interface DaySchedule {
  dayOfWeek: DayOfWeek;
  timeSlots: TimeRange[];
}

export type WeeklySchedule = {
  [K in DayOfWeek]?: TimeRange[];
};

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
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

      for (const slot1 of course1.courseSchedules || []) {
        for (const slot2 of course2.courseSchedules || []) {
          if (doTimeSlotsOverlap(slot1, slot2)) {
            conflicts.push({
              course1,
              course2,
              overlappingSlots: {
                slot1,
                slot2
              }
            });
            break;
          }
        }
      }
    }
  }

  return conflicts;
}

export function canAddCourseToSchedule(
  newCourse: Course,
  existingCourses: Course[]
): { canAdd: boolean; conflicts: ScheduleConflict[] } {
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

// 스케줄 최적화
export function optimizeWeeklySchedule(courses: Course[]): WeeklySchedule {
  const schedule: WeeklySchedule = {};
  
  courses.forEach(course => {
    (course.courseSchedules || []).forEach(slot => {
      if (!schedule[slot.dayOfWeek]) {
        schedule[slot.dayOfWeek] = [];
      }
      schedule[slot.dayOfWeek]?.push({
        start: slot.startTime,
        end: slot.endTime
      });
    });
  });

  const days = Object.keys(schedule) as DayOfWeek[];
  days.forEach(day => {
    if (schedule[day]) {
      schedule[day] = mergeTimeSlots(schedule[day] || []);
    }
  });

  return schedule;
}

export function mergeTimeSlots(slots: TimeRange[]): TimeRange[] {
  if (slots.length <= 1) return slots;

  const sorted = slots.sort((a, b) => 
    timeToMinutes(a.start) - timeToMinutes(b.start)
  );

  const merged: TimeRange[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (timeToMinutes(current.start) <= timeToMinutes(last.end)) {
      last.end = timeToMinutes(current.end) > timeToMinutes(last.end) 
        ? current.end 
        : last.end;
    } else {
      merged.push(current);
    }
  }

  return merged;
}

// 공강 시간 찾기
export function findFreeTimeSlots(
  schedule: WeeklySchedule,
  minDuration: number = 30
): WeeklySchedule {
  const freeTime: WeeklySchedule = {};
  const workingHours = { start: '09:00', end: '17:00' };
  const days = Object.keys(schedule) as DayOfWeek[];

  days.forEach(day => {
    freeTime[day] = [];
    const daySchedule = schedule[day] || [];

    let currentTime = timeToMinutes(workingHours.start);
    const endOfDay = timeToMinutes(workingHours.end);

    daySchedule.forEach(slot => {
      const slotStart = timeToMinutes(slot.start);
      
      if (slotStart - currentTime >= minDuration) {
        freeTime[day]?.push({
          start: minutesToTime(currentTime),
          end: minutesToTime(slotStart)
        });
      }
      
      currentTime = timeToMinutes(slot.end);
    });

    if (endOfDay - currentTime >= minDuration) {
      freeTime[day]?.push({
        start: minutesToTime(currentTime),
        end: minutesToTime(endOfDay)
      });
    }
  });

  return freeTime;
}