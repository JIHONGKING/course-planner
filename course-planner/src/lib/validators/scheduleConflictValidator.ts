// src/lib/validators/scheduleConflictValidator.ts

import type { Course, CourseSchedule, DayOfWeek, ScheduleConflict } from '@/types/course';

interface TimeSlot {
  startMinutes: number;
  endMinutes: number;
  day: DayOfWeek;
}

interface ValidationContext {
  maxCreditsPerTerm: number;
  allowedTimeSlots?: TimeSlot[];
  restrictedDays?: DayOfWeek[];
}

interface ValidationResult {
  isValid: boolean;
  conflicts: ScheduleConflict[];
  messages: string[];
  totalCredits: number;
}

export class ScheduleValidator {
  private static readonly MINUTES_PER_HOUR = 60;
  private static readonly DEFAULT_MAX_CREDITS = 18;
  private static readonly TIME_PATTERN = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;

  constructor(private context: ValidationContext = { maxCreditsPerTerm: 18 }) {}

  validateSchedule(courses: Course[]): ValidationResult {
    const validation: ValidationResult = {
      isValid: true,
      conflicts: [],
      messages: [],
      totalCredits: 0
    };

    // 총 학점 검사
    validation.totalCredits = this.calculateTotalCredits(courses);
    if (validation.totalCredits > this.context.maxCreditsPerTerm) {
      validation.isValid = false;
      validation.messages.push(
        `Total credits (${validation.totalCredits}) exceed maximum allowed (${this.context.maxCreditsPerTerm})`
      );
    }

    // 스케줄 충돌 검사
    const conflicts = this.findScheduleConflicts(courses);
    if (conflicts.length > 0) {
      validation.isValid = false;
      validation.conflicts = conflicts;
      conflicts.forEach(conflict => {
        validation.messages.push(
          `Schedule conflict between ${conflict.course1.code} and ${conflict.course2.code}`
        );
      });
    }

    // 시간대 제한 검사
    if (this.context.allowedTimeSlots) {
      const invalidTimeSlots = this.findInvalidTimeSlots(courses);
      if (invalidTimeSlots.length > 0) {
        validation.isValid = false;
        invalidTimeSlots.forEach(({ course, schedule }) => {
          validation.messages.push(
            `Course ${course.code} has invalid time slot: ${schedule.dayOfWeek} ${schedule.startTime}-${schedule.endTime}`
          );
        });
      }
    }

    // 요일 제한 검사
    if (this.context.restrictedDays) {
      const coursesOnRestrictedDays = this.findCoursesOnRestrictedDays(courses);
      if (coursesOnRestrictedDays.length > 0) {
        validation.isValid = false;
        coursesOnRestrictedDays.forEach(({ course, day }) => {
          validation.messages.push(
            `Course ${course.code} is scheduled on restricted day: ${day}`
          );
        });
      }
    }

    return validation;
  }

  private calculateTotalCredits(courses: Course[]): number {
    return courses.reduce((sum, course) => sum + course.credits, 0);
  }

  private findScheduleConflicts(courses: Course[]): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];

    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        const course1 = courses[i];
        const course2 = courses[j];

        const conflictingSlots = this.findConflictingSlots(
          course1.courseSchedules || [],
          course2.courseSchedules || []
        );

        if (conflictingSlots.length > 0) {
          conflicts.push({
            course1,
            course2,
            overlappingSlots: conflictingSlots[0]
          });
        }
      }
    }

    return conflicts;
  }

  private findConflictingSlots(
    schedule1: CourseSchedule[],
    schedule2: CourseSchedule[]
  ): Array<{ slot1: CourseSchedule; slot2: CourseSchedule }> {
    const conflicts: Array<{ slot1: CourseSchedule; slot2: CourseSchedule }> = [];

    for (const slot1 of schedule1) {
      for (const slot2 of schedule2) {
        if (this.doSlotsOverlap(slot1, slot2)) {
          conflicts.push({ slot1, slot2 });
        }
      }
    }

    return conflicts;
  }

  private doSlotsOverlap(slot1: CourseSchedule, slot2: CourseSchedule): boolean {
    if (slot1.dayOfWeek !== slot2.dayOfWeek) return false;

    const start1 = this.timeToMinutes(slot1.startTime);
    const end1 = this.timeToMinutes(slot1.endTime);
    const start2 = this.timeToMinutes(slot2.startTime);
    const end2 = this.timeToMinutes(slot2.endTime);

    return start1 < end2 && end1 > start2;
  }

  private timeToMinutes(time: string): number {
    if (!ScheduleValidator.TIME_PATTERN.test(time)) {
      throw new Error(`Invalid time format: ${time}`);
    }

    const [hours, minutes] = time.split(':').map(Number);
    return hours * ScheduleValidator.MINUTES_PER_HOUR + minutes;
  }

  private findInvalidTimeSlots(courses: Course[]): Array<{
    course: Course;
    schedule: CourseSchedule;
  }> {
    const invalid: Array<{ course: Course; schedule: CourseSchedule }> = [];

    for (const course of courses) {
      for (const schedule of course.courseSchedules || []) {
        const slot = {
          startMinutes: this.timeToMinutes(schedule.startTime),
          endMinutes: this.timeToMinutes(schedule.endTime),
          day: schedule.dayOfWeek
        };

        if (!this.isTimeSlotAllowed(slot)) {
          invalid.push({ course, schedule });
        }
      }
    }

    return invalid;
  }

  private isTimeSlotAllowed(slot: TimeSlot): boolean {
    if (!this.context.allowedTimeSlots) return true;

    return this.context.allowedTimeSlots.some(allowed =>
      allowed.day === slot.day &&
      allowed.startMinutes <= slot.startMinutes &&
      allowed.endMinutes >= slot.endMinutes
    );
  }

  private findCoursesOnRestrictedDays(courses: Course[]): Array<{
    course: Course;
    day: DayOfWeek;
  }> {
    if (!this.context.restrictedDays) return [];

    const restricted: Array<{ course: Course; day: DayOfWeek }> = [];

    for (const course of courses) {
      for (const schedule of course.courseSchedules || []) {
        if (this.context.restrictedDays.includes(schedule.dayOfWeek)) {
          restricted.push({ course, day: schedule.dayOfWeek });
        }
      }
    }

    return restricted;
  }
}
