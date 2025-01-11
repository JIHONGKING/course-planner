// src/types/api.ts
import type { Course } from './course';

export interface APIResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  message?: string;
}

export interface SearchResponse {
  courses: Course[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchCoursesResponse extends SearchResponse {
  source: 'database' | 'madgrades' | 'none';
  currentPage: number;
}

export interface MetricsResponse {
  timestamp: number;
  metrics: Record<string, any>;
  slowOperations: Array<{
    name: string;
    duration: number;
    timestamp: number;
  }>;
  [key: string]: unknown;
}