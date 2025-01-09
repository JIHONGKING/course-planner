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
  source: 'database' | 'madgrades' | 'none';
}