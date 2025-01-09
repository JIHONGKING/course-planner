// src/hooks/useScheduleValidation.ts

import { useState, useCallback } from 'react';
import type { Course } from '@/types/course';
import { 
  canAddCourseToSchedule, 
  findScheduleConflicts, 
  formatConflictMessage,
  type ScheduleConflict 
} from '@/utils/scheduleUtils';

interface ValidationResult {
  isValid: boolean;
  messages: string[];
  conflicts?: ScheduleConflict[];
}

interface UseScheduleValidationProps {
  semesterCourses: Course[];
  onValidationChange?: (result: ValidationResult) => void;
}

export function useScheduleValidation({ 
  semesterCourses,
  onValidationChange 
}: UseScheduleValidationProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    messages: []
  });

  // 과목 추가 시 충돌 검사
  const validateCourseAddition = useCallback((course: Course): ValidationResult => {
    const { canAdd, conflicts } = canAddCourseToSchedule(course, semesterCourses);
    
    const result = {
      isValid: canAdd,
      messages: conflicts.map(formatConflictMessage),
      conflicts
    };

    onValidationChange?.(result);
    setValidationResult(result);
    return result;
  }, [semesterCourses, onValidationChange]);

  // 현재 학기 전체 스케줄 검증
  const validateCurrentSchedule = useCallback((): ValidationResult => {
    const conflicts = findScheduleConflicts(semesterCourses);
    
    const result = {
      isValid: conflicts.length === 0,
      messages: conflicts.map(formatConflictMessage),
      conflicts
    };

    onValidationChange?.(result);
    setValidationResult(result);
    return result;
  }, [semesterCourses, onValidationChange]);

  // 스케줄 변경 시 검증 (드래그 앤 드롭 등)
  const validateScheduleChange = useCallback((updatedCourses: Course[]): ValidationResult => {
    const conflicts = findScheduleConflicts(updatedCourses);
    
    const result = {
      isValid: conflicts.length === 0,
      messages: conflicts.map(formatConflictMessage),
      conflicts
    };

    onValidationChange?.(result);
    setValidationResult(result);
    return result;
  }, [onValidationChange]);

  // 특정 과목의 특정 시간대 충돌 검사
  const validateTimeSlot = useCallback((
    course: Course, 
    dayOfWeek: string, 
    startTime: string, 
    endTime: string
  ): ValidationResult => {
    const courseWithNewSlot: Course = {
      ...course,
      courseSchedules: [{
        dayOfWeek,
        startTime,
        endTime
      }]
    };

    return validateCourseAddition(courseWithNewSlot);
  }, [validateCourseAddition]);

  // 유효성 검사 결과 수동 설정
  const setValidation = useCallback((result: ValidationResult) => {
    setValidationResult(result);
    onValidationChange?.(result);
  }, [onValidationChange]);

  return {
    validationResult,
    validateCourseAddition,
    validateCurrentSchedule,
    validateScheduleChange,
    validateTimeSlot,
    setValidation
  };
}

// 재사용 가능한 시간 유효성 검사 로직
export function validateTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

// 시작 시간이 종료 시간보다 빠른지 검사
export function validateTimeRange(startTime: string, endTime: string): boolean {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return false;
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  if (startHour > endHour) return false;
  if (startHour === endHour && startMinute >= endMinute) return false;

  return true;
}

// 수업 시간이 적절한 범위 내에 있는지 검사 (예: 8:00 ~ 22:00)
export function validateTimeWithinBounds(
  startTime: string,
  endTime: string,
  bounds = { start: '08:00', end: '22:00' }
): boolean {
  if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
    return false;
  }

  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const boundsStart = timeToMinutes(bounds.start);
  const boundsEnd = timeToMinutes(bounds.end);

  return start >= boundsStart && end <= boundsEnd;
}