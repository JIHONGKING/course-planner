// src/lib/utils/typeConverters.ts

import type { Course, CourseSchedule, GradeDistribution, Prerequisite, DayOfWeek } from '@/types/course';
import type { Prisma } from '@prisma/client';

export const convertPrismaToCourse = (prismaData: any): Course => ({
  ...prismaData,
  courseSchedules: prismaData.courseSchedules?.map(convertPrismaToSchedule) ?? [],
  gradeDistribution: typeof prismaData.gradeDistribution === 'string' 
    ? prismaData.gradeDistribution 
    : JSON.stringify(prismaData.gradeDistribution),
  prerequisites: prismaData.prerequisites.map((id: string) => ({
    courseId: id,
    type: 'required' as const
  })),
  createdAt: prismaData.createdAt.toISOString(),
  updatedAt: prismaData.updatedAt.toISOString()
});

export const convertPrismaToSchedule = (schedule: any): CourseSchedule => ({
  id: schedule.id,
  dayOfWeek: schedule.dayOfWeek as DayOfWeek,
  startTime: schedule.startTime,
  endTime: schedule.endTime
});

export const convertScheduleToPrisma = (
  schedule: CourseSchedule
): Prisma.CourseScheduleCreateInput => ({
  dayOfWeek: schedule.dayOfWeek,
  startTime: schedule.startTime,
  endTime: schedule.endTime,
  course: { connect: { id: schedule.id } }
});

export const convertGradeDistribution = (data: any): GradeDistribution => {
  if (typeof data === 'string') {
    return JSON.parse(data);
  }
  if (typeof data === 'object' && data !== null) {
    return data as GradeDistribution;
  }
  return {
    A: '0',
    AB: '0',
    B: '0',
    BC: '0',
    C: '0',
    D: '0',
    F: '0'
  };
};