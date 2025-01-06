// src/types/error.ts
export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface AppError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  context?: Record<string, any>;
  timestamp: number;
}

export interface ValidationError extends AppError {
  field?: string;
  value?: any;
}

export interface PrerequisiteError extends AppError {
  courseId: string;
  missingPrerequisites: string[];
}

export type ErrorHandler = (error: AppError) => void;

// 에러 코드 상수
export const ERROR_CODES = {
  PREREQUISITES_NOT_MET: 'PREREQUISITES_NOT_MET',
  COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
  MAX_CREDITS_EXCEEDED: 'MAX_CREDITS_EXCEEDED',
  INVALID_SEMESTER: 'INVALID_SEMESTER',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR'
} as const;