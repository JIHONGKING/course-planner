// src/lib/course/CourseManager.ts
import { PrismaClient } from '@prisma/client';
import { ErrorHandlingSystem } from '@/lib/error/ErrorHandlingSystem';
import { CourseMetadataManager } from './CourseMetadataManager';
import { SyncManager } from '@/lib/sync/SyncManager';
import type { Course, CourseSchedule, DayOfWeek, Prerequisite, GradeDistribution } from '@/types/course';
import type { PrismaCourseCreateInput } from '@/types/prisma';

const prisma = new PrismaClient();

export class CourseManager {
  private static instance: CourseManager;
  private errorHandler: ErrorHandlingSystem;
  private metadataManager: CourseMetadataManager;
  private syncManager: SyncManager;

  private constructor() {
    this.errorHandler = ErrorHandlingSystem.getInstance();
    this.metadataManager = CourseMetadataManager.getInstance();
    this.syncManager = SyncManager.getInstance();
  }

  public static getInstance(): CourseManager {
    if (!CourseManager.instance) {
      CourseManager.instance = new CourseManager();
    }
    return CourseManager.instance;
  }

  async createCourse(courseData: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    try {
      const existing = await prisma.course.findFirst({
        where: { code: courseData.code }
      });

      if (existing) {
        throw new Error(`Course with code ${courseData.code} already exists`);
      }

      const gradeDistributionString = typeof courseData.gradeDistribution === 'string' 
        ? courseData.gradeDistribution 
        : JSON.stringify(courseData.gradeDistribution);

      const createData: PrismaCourseCreateInput = {
        id: crypto.randomUUID(),
        code: courseData.code,
        name: courseData.name,
        description: courseData.description,
        credits: courseData.credits,
        department: courseData.department,
        level: courseData.level,
        prerequisites: courseData.prerequisites.map(p => p.courseId),
        term: courseData.term,
        gradeDistribution: gradeDistributionString,
        courseSchedules: {
          create: courseData.courseSchedules.map(schedule => ({
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }))
        }
      };

      const course = await prisma.course.create({
        data: createData,
        include: {
          courseSchedules: true
        }
      });

      const mappedCourse: Course = {
        ...course,
        description: course.description || '',
        prerequisites: courseData.prerequisites,
        courseSchedules: course.courseSchedules.map(schedule => ({
          dayOfWeek: schedule.dayOfWeek as DayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          id: schedule.id
        })),
        gradeDistribution: course.gradeDistribution as string,
        createdAt: course.createdAt.toISOString(),
        updatedAt: course.updatedAt.toISOString()
      };

      await this.metadataManager.updateMetadata(mappedCourse);
      return mappedCourse;

    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        operation: 'createCourse',
        courseData
      });
      throw error;
    }
  }

  async updateCourse(courseId: string, updates: Partial<Course>): Promise<Course> {
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          courseSchedules: true
        }
      });

      if (!course) {
        throw new Error(`Course with ID ${courseId} not found`);
      }

      const gradeDistributionString = updates.gradeDistribution
        ? typeof updates.gradeDistribution === 'string'
          ? updates.gradeDistribution
          : JSON.stringify(updates.gradeDistribution)
        : undefined;

      // CourseManager.ts에서 prerequisites 배열 타입 변환 수정
const prerequisitesArray = (updates.prerequisites || course.prerequisites).map(p => 
  typeof p === 'string' ? { courseId: p, type: 'required' as const } : p
) as Prerequisite[];

      const updated = await prisma.course.update({
        where: { id: courseId },
        data: {
          name: updates.name,
          description: updates.description,
          credits: updates.credits,
          department: updates.department,
          level: updates.level,
          prerequisites: prerequisitesArray.map(p => p.courseId),
          term: updates.term,
          gradeDistribution: gradeDistributionString,
          courseSchedules: updates.courseSchedules ? {
            deleteMany: {},
            create: updates.courseSchedules.map(schedule => ({
              dayOfWeek: schedule.dayOfWeek,
              startTime: schedule.startTime,
              endTime: schedule.endTime
            }))
          } : undefined
        },
        include: {
          courseSchedules: true
        }
      });

      const mappedCourse: Course = {
        ...updated,
        description: updated.description || '',
        prerequisites: prerequisitesArray,
        courseSchedules: updated.courseSchedules.map(schedule => ({
          dayOfWeek: schedule.dayOfWeek as DayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          id: schedule.id
        })),
        gradeDistribution: updated.gradeDistribution as string,
        createdAt: updated.createdAt.toISOString(),
        updatedAt: updated.updatedAt.toISOString()
      };

      await this.metadataManager.updateMetadata(mappedCourse);
      await this.syncManager.syncCourse(mappedCourse, 'update');

      return mappedCourse;

    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        operation: 'updateCourse',
        courseId,
        updates
      });
      throw error;
    }
  }
}