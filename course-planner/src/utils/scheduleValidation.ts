// src/utils/scheduleValidation.ts
import type { Course, Schedule, ScheduleConflict, ValidationResult } from '@/types/course';
import { timeToMinutes } from '@/utils/scheduleUtils';
import _ from 'lodash';

export class ScheduleValidator {
  private readonly MAX_CREDITS_PER_SEMESTER = 18;
  private readonly MIN_CREDITS_PER_SEMESTER = 12;

  constructor(
    private readonly currentCourses: Course[] = [],
    private readonly maxCredits: number = 18
  ) {}

  validateSchedule(newCourse: Course): ValidationResult {
    const result: ValidationResult = {
      isValid: true,
      conflicts: [],
      messages: [],
      totalCredits: this.calculateTotalCredits(newCourse)
    };

    // 1. 학점 검증 (성능: O(1))
    this.validateCredits(newCourse, result);

    // 2. 시간 충돌 검증 (성능: O(n * m), n = 현재 과목 수, m = 각 과목의 스케줄 수)
    this.validateTimeConflicts(newCourse, result);

    // 3. 학기 제공 여부 검증 (성능: O(1))
    this.validateTermAvailability(newCourse, result);

    return result;
  }

  private calculateTotalCredits(newCourse?: Course): number {
    const existingCredits = this.currentCourses.reduce((sum, course) => sum + course.credits, 0);
    return existingCredits + (newCourse?.credits || 0);
  }

  private validateCredits(course: Course, result: ValidationResult): void {
    if (result.totalCredits > this.maxCredits) {
      result.isValid = false;
      result.messages.push(
        `Adding this course would exceed the maximum credits (${this.maxCredits})`
      );
    }

    if (result.totalCredits < this.MIN_CREDITS_PER_SEMESTER) {
      result.messages.push(
        `Warning: Current credits (${result.totalCredits}) are below the recommended minimum (${this.MIN_CREDITS_PER_SEMESTER})`
      );
    }
  }

  private validateTimeConflicts(course: Course, result: ValidationResult): void {
    if (!course.courseSchedules?.length) return;

    // 성능 최적화: Map을 사용하여 요일별 스케줄 그룹화
    const schedulesByDay = new Map<string, Schedule[]>();
    
    this.currentCourses.forEach(existingCourse => {
      existingCourse.courseSchedules?.forEach(schedule => {
        if (!schedulesByDay.has(schedule.dayOfWeek)) {
          schedulesByDay.set(schedule.dayOfWeek, []);
        }
        schedulesByDay.get(schedule.dayOfWeek)?.push(schedule);
      });
    });

    // 충돌 검사
    course.courseSchedules.forEach(newSchedule => {
      const daySchedules = schedulesByDay.get(newSchedule.dayOfWeek) || [];
      
      daySchedules.forEach(existingSchedule => {
        if (this.doTimeSlotsOverlap(newSchedule, existingSchedule)) {
          const conflictingCourse = this.currentCourses.find(c => 
            c.courseSchedules?.some(s => s === existingSchedule)
          );
          
          if (conflictingCourse) {
            result.isValid = false;
            result.conflicts.push({
              course1: course,
              course2: conflictingCourse,
              overlappingSlots: {
                slot1: newSchedule,
                slot2: existingSchedule
              }
            });
          }
        }
      });
    });
  }

  private validateTermAvailability(course: Course, result: ValidationResult): void {
    // 구현 예정: 학기 제공 여부 검증
  }

  private doTimeSlotsOverlap(slot1: Schedule, slot2: Schedule): boolean {
    const start1 = timeToMinutes(slot1.startTime);
    const end1 = timeToMinutes(slot1.endTime);
    const start2 = timeToMinutes(slot2.startTime);
    const end2 = timeToMinutes(slot2.endTime);

    return (start1 < end2 && end1 > start2);
  }
}