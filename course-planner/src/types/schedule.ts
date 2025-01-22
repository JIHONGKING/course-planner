// src/types/schedule.ts
import type { Course } from './course';

// DayOfWeek는 로컬에서 정의하고 export 합니다
export type DayOfWeek = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';

export interface TimeSlot {
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string;
}

export interface Schedule {
  id?: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  courseId?: string;
}


export interface ScheduleValidationResult {
  isValid: boolean;
  conflicts: ScheduleConflict[];
  messages: string[];
}

export interface ScheduleConflict {
  slot1: Schedule;
  slot2: Schedule;
  message: string;
}