// src/types/prisma.ts

import { Prisma } from '@prisma/client';

// CourseSchedule 타입을 Prisma 스키마와 일치하도록 수정
export type PrismaCourseSchedule = {
  id: string;
  courseId: string;
  dayOfWeek: 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI';
  startTime: string;
  endTime: string;
  createdAt: Date;
  updatedAt: Date;
};

// Course 타입 수정
export type PrismaCourse = Prisma.CourseGetPayload<{
  include: {
    courseSchedules: true;
    metadata: true;
  }
}>;

// Course 생성 입력 타입
export type PrismaCourseCreateInput = Omit<Prisma.CourseCreateInput, 'gradeDistribution'> & {
  gradeDistribution: string;
};

// Course 업데이트 입력 타입
export type PrismaCourseUpdateInput = Omit<Prisma.CourseUpdateInput, 'prerequisites'> & {
  prerequisites?: string[];
};

export const includeCourseRelations = {
  courseSchedules: true,
  metadata: true
} as const;