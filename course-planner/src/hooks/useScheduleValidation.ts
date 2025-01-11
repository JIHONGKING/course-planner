// src/hooks/useScheduleValidation.ts

import { useState, useCallback } from 'react';
import type { Course, DayOfWeek, ScheduleConflict, ValidationResult } from '@/types/course';
import { findScheduleConflicts, canAddCourseToSchedule } from '@/utils/scheduleUtils';

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
   conflicts: []
 });

 // 과목 추가 시 충돌 검사
 const validateCourseAddition = useCallback((course: Course): ValidationResult => {
   const { canAdd, conflicts } = canAddCourseToSchedule(course, semesterCourses);
   
   const result = {
     isValid: canAdd,
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
     conflicts
   };

   onValidationChange?.(result);
   setValidationResult(result);
   return result;
 }, [onValidationChange]);

 // 특정 과목의 특정 시간대 충돌 검사
 const validateTimeSlot = useCallback((
   course: Course, 
   dayOfWeek: DayOfWeek, 
   startTime: string, 
   endTime: string
 ): ValidationResult => {
   const courseWithNewSlot: Course = {
     ...course,
     courseSchedules: [{
       dayOfWeek: dayOfWeek as DayOfWeek,
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