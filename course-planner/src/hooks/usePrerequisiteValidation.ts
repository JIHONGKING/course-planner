import { useState, useCallback } from 'react';
import type { Course } from '@/types/course';
import { validatePrerequisites, canTakeCourse } from '@/utils/prerequisiteUtils';

export function usePrerequisiteValidation() {
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateCourseSelection = useCallback((
    course: Course,
    completedCourses: Course[],
    currentTermCourses: Course[],
    term: string
  ) => {
    // 먼저 해당 학기 수강 가능 여부 확인
    const { canTake, reason } = canTakeCourse(
      course,
      completedCourses,
      currentTermCourses,
      term
    );

    if (!canTake) {
      setValidationError(reason || 'Cannot take this course this term');
      return false;
    }

    // 선수과목 검증
    const validation = validatePrerequisites(
      course,
      completedCourses,
      currentTermCourses
    );

    if (!validation.isValid) {
      setValidationError(validation.messages[0] || null);     
      return false;
    }

    setValidationError(null);
    return true;
  }, []);

  const clearValidationError = useCallback(() => {
    setValidationError(null);
  }, []);

  return {
    validationError,
    validateCourseSelection,
    clearValidationError
  };
}