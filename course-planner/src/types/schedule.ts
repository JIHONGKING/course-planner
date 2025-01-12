// src/types/schedule.ts
import type { Course, DayOfWeek } from '@/types/course';  // import 추가

export interface ScheduleValidationResult {
  isValid: boolean;
  conflicts: ScheduleConflict[];
  messages: string[];
  totalCredits: number;
}

export interface TimeSlot {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string;
}

export interface ScheduleConflict {
  course1: Course;
  course2: Course;
  conflictingSlots: {
    slot1: TimeSlot;
    slot2: TimeSlot;
  };
}