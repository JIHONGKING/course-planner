// src/utils/errorUtils.ts
import type { AppError, ErrorSeverity, ValidationError, PrerequisiteError } from '@/types/error';
import { ERROR_CODES } from '@/types/error';

export function createError(
  code: keyof typeof ERROR_CODES,
  message: string,
  severity: ErrorSeverity = 'error',
  context?: Record<string, any>
): AppError {
  return {
    code: ERROR_CODES[code],
    message,
    severity,
    context,
    timestamp: Date.now()
  };
}

export function createValidationError(
  message: string,
  field?: string,
  value?: any
): ValidationError {
  return {
    code: ERROR_CODES.VALIDATION_ERROR,
    message,
    severity: 'error',
    field,
    value,
    timestamp: Date.now()
  };
}

export function createPrerequisiteError(
  courseId: string,
  missingPrerequisites: string[]
): PrerequisiteError {
  return {
    code: ERROR_CODES.PREREQUISITES_NOT_MET,
    message: `Missing prerequisites for course ${courseId}`,
    severity: 'error',
    courseId,
    missingPrerequisites,
    timestamp: Date.now()
  };
}

export function handleAPIError(error: unknown): AppError {
  if (error instanceof Error) {
    return createError('API_ERROR', error.message);
  }
  
  if (typeof error === 'string') {
    return createError('API_ERROR', error);
  }
  
  return createError(
    'API_ERROR',
    'An unexpected error occurred',
    'error',
    { originalError: error }
  );
}

export function handleNetworkError(error: unknown): AppError {
  return createError(
    'NETWORK_ERROR',
    'Failed to connect to the server. Please check your internet connection.',
    'error',
    { originalError: error }
  );
}