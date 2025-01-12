// src/hooks/useScheduleValidation.ts
import { useState, useCallback } from 'react';
import type { Course, DayOfWeek, ValidationResult } from '@/types/course';
import { doTimeSlotsOverlap, timeToMinutes } from '@/utils/scheduleUtils';

interface UseScheduleValidationProps {
  currentSemesterCourses: Course[];
  maxCredits?: number;
  operatingHours?: {
    start: string;
    end: string;
  };
  restrictedDays?: DayOfWeek[];
}

export function useScheduleValidation({
  currentSemesterCourses,
  maxCredits = 18,
  operatingHours = { start: '08:00', end: '22:00' },
  restrictedDays = []
}: UseScheduleValidationProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    conflicts: [],
    messages: [],
    totalCredits: 0
  });

  const validateSchedule = useCallback((course: Course): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      conflicts: [],
      messages: [],
      totalCredits: 0
    };

    // 1. 학점 검사
    const currentCredits = currentSemesterCourses.reduce((sum, c) => sum + c.credits, 0);
    result.totalCredits = currentCredits + course.credits;

    if (result.totalCredits > maxCredits) {
      result.isValid = false;
      result.messages.push(
        `Adding this course would exceed the maximum credits (${maxCredits})`
      );
    }

    // 2. 스케줄 충돌 검사
    for (const existingCourse of currentSemesterCourses) {
      for (const newSlot of course.courseSchedules || []) {
        for (const existingSlot of existingCourse.courseSchedules || []) {
          if (doTimeSlotsOverlap(newSlot, existingSlot)) {
            result.isValid = false;
            result.conflicts.push({
              course1: course,
              course2: existingCourse,
              overlappingSlots: {
                slot1: newSlot,
                slot2: existingSlot
              }
            });
            break;
          }
        }
      }
    }

    // 3. 운영 시간 검사
    const opStartMinutes = timeToMinutes(operatingHours.start);
    const opEndMinutes = timeToMinutes(operatingHours.end);

    for (const slot of course.courseSchedules || []) {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);

      if (slotStart < opStartMinutes || slotEnd > opEndMinutes) {
        result.isValid = false;
        result.messages.push(
          `Course scheduled outside operating hours (${operatingHours.start}-${operatingHours.end})`
        );
      }
    }

    // 4. 제한된 요일 검사
    if (restrictedDays.length > 0) {
      for (const slot of course.courseSchedules || []) {
        if (restrictedDays.includes(slot.dayOfWeek)) {
          result.isValid = false;
          result.messages.push(
            `Course scheduled on restricted day: ${slot.dayOfWeek}`
          );
        }
      }
    }

    setValidationResult(result);
    return result;
  }, [currentSemesterCourses, maxCredits, operatingHours, restrictedDays]);

  const clearValidation = useCallback(() => {
    setValidationResult({
      isValid: true,
      conflicts: [],
      messages: [],
      totalCredits: 0
    });
  }, []);

  const validateMultipleCourses = useCallback((courses: Course[]): ValidationResult => {
    const result: ValidationResult = {
      isValid: true,
      conflicts: [],
      messages: [],
      totalCredits: 0
    };

    // 총 학점 계산
    result.totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);

    // 전체 과목 조합에 대해 검증
    for (let i = 0; i < courses.length; i++) {
      for (let j = i + 1; j < courses.length; j++) {
        const course1 = courses[i];
        const course2 = courses[j];

        for (const slot1 of course1.courseSchedules || []) {
          for (const slot2 of course2.courseSchedules || []) {
            if (doTimeSlotsOverlap(slot1, slot2)) {
              result.isValid = false;
              result.conflicts.push({
                course1,
                course2,
                overlappingSlots: {
                  slot1,
                  slot2
                }
              });
            }
          }
        }
      }
    }

    return result;
  }, []);

  return {
    validationResult,
    validateSchedule,
    validateMultipleCourses,
    clearValidation
  };
}