// src/types/error.ts
export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface AppError {
  code: string;
  message: string;
  severity: ErrorSeverity;
  timestamp?: number;
  context?: Record<string, any>;
}

export interface ValidationError extends AppError {
  field: string;
  value: any;
}

export interface PrerequisiteError extends AppError {
  courseId: string;
  missingPrerequisites: string[];
}

export const ERROR_CODES = {
  SEARCH_ERROR: 'SEARCH_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SCHEDULE_CONFLICT: 'SCHEDULE_CONFLICT',
  PREREQUISITE_ERROR: 'PREREQUISITE_ERROR',
  API_ERROR: 'API_ERROR',
  PREREQUISITES_NOT_MET: 'PREREQUISITES_NOT_MET'
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;