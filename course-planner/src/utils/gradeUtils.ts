// src/utils/gradeUtils.ts

import type { GradeDistribution } from '@/types/course';

export function getGradeA(gradeDistribution: string | GradeDistribution): string {
  if (typeof gradeDistribution === 'string') {
    try {
      const parsed = JSON.parse(gradeDistribution);
      return parsed.A.toString();
    } catch {
      return '0';
    }
  }
  return gradeDistribution.A.toString();
}

export function parseGradeDistribution(distribution: string | GradeDistribution): GradeDistribution {
  if (typeof distribution === 'string') {
    try {
      return JSON.parse(distribution) as GradeDistribution;
    } catch {
      return { A: '0', AB: '0', B: '0', BC: '0', C: '0', D: '0', F: '0' };
    }
  }
  return distribution;
}