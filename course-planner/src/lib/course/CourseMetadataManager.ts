// src/lib/course/CourseMetadataManager.ts
import { PrismaClient } from '@prisma/client';
import type { Course, GradeDistribution, DayOfWeek } from '@/types/course';
import { ErrorHandlingSystem } from '@/lib/error/ErrorHandlingSystem';

const prisma = new PrismaClient();

interface CourseMetadata {
  averageGrade: number;
  totalEnrollments: number;
  recommendedPrerequisites: string[];
  workloadLevel: 'light' | 'medium' | 'heavy';
  mostCommonTerms: string[];
  relatedCourses: string[];
}



export class CourseMetadataManager {
  private static instance: CourseMetadataManager;
  private errorHandler: ErrorHandlingSystem;
  private metadataCache: Map<string, CourseMetadata>;

  private constructor() {
    this.errorHandler = ErrorHandlingSystem.getInstance();
    this.metadataCache = new Map();
  }

  public static getInstance(): CourseMetadataManager {
    if (!CourseMetadataManager.instance) {
      CourseMetadataManager.instance = new CourseMetadataManager();
    }
    return CourseMetadataManager.instance;
  }

  private parseGradeDistribution(gradeData: string | GradeDistribution): GradeDistribution {
    if (typeof gradeData === 'string') {
      try {
        return JSON.parse(gradeData) as GradeDistribution;
      } catch {
        return {
          A: '0',
          AB: '0',
          B: '0',
          BC: '0',
          C: '0',
          D: '0',
          F: '0'
        };
      }
    }
    return gradeData;
  }

  private async analyzeGrades(course: Course): Promise<{
    averageGrade: number;
    totalEnrollments: number;
  }> {
    const gradeData = this.parseGradeDistribution(course.gradeDistribution);

    const gradePoints = {
      'A': 4.0,
      'AB': 3.5,
      'B': 3.0,
      'BC': 2.5,
      'C': 2.0,
      'D': 1.0,
      'F': 0.0
    };

    let totalPoints = 0;
    let totalStudents = 0;

    Object.entries(gradeData).forEach(([grade, count]) => {
      const numericCount = parseFloat(count);
      const points = gradePoints[grade as keyof typeof gradePoints] ?? 0;
      totalPoints += points * numericCount;
      totalStudents += numericCount;
    });

    return {
      averageGrade: totalStudents > 0 ? totalPoints / totalStudents : 0,
      totalEnrollments: totalStudents
    };

  }

  // src/lib/course/CourseMetadataManager.ts의 해당 부분 수정

public async getAverageGradesByDepartment(department: string): Promise<{
  [level: string]: number
}> {
  const courses = await prisma.course.findMany({
    where: { department },
    select: {
      level: true,
      gradeDistribution: true
    }
  });

  const gradesByLevel: { [level: string]: number[] } = {};

  for (const course of courses) {
    if (!course.gradeDistribution) continue;
    
    const gradeData = this.parseGradeDistribution(course.gradeDistribution as string);
    const avgGrade = (
      (parseFloat(gradeData.A) * 4.0) +
      (parseFloat(gradeData.AB) * 3.5) +
      (parseFloat(gradeData.B) * 3.0) +
      (parseFloat(gradeData.BC) * 2.5) +
      (parseFloat(gradeData.C) * 2.0)
    );

    if (!gradesByLevel[course.level]) {
      gradesByLevel[course.level] = [];
    }
    gradesByLevel[course.level].push(avgGrade);
  }

  return Object.fromEntries(
    Object.entries(gradesByLevel).map(([level, grades]) => [
      level,
      grades.reduce((a, b) => a + b, 0) / grades.length
    ])
  );
}

public async refreshMetadata(courseId: string): Promise<void> {
  this.metadataCache.delete(courseId);
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      courseSchedules: true,
      metadata: true
    }
  });

  if (!course) {
    throw new Error(`Course with ID ${courseId} not found`);
  }

  const defaultGradeDistribution: GradeDistribution = {
    A: '0',
    AB: '0',
    B: '0',
    BC: '0',
    C: '0',
    D: '0',
    F: '0'
  };

  const mappedCourse: Course = {
    ...course,
    description: course.description || '',
    prerequisites: [], // Will need to be loaded separately
    courseSchedules: course.courseSchedules.map(schedule => ({
      dayOfWeek: schedule.dayOfWeek as DayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      id: schedule.id
    })),
    gradeDistribution: course.gradeDistribution 
      ? course.gradeDistribution as string
      : JSON.stringify(defaultGradeDistribution),
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString()
  };

  await this.updateMetadata(mappedCourse);
}
  // CourseMetadataManager 클래스에 추가해야할 메서드
  async updateMetadata(course: Course): Promise<CourseMetadata> {
    try {
      // generateMetadata 메서드가 필요합니다.
      const metadata = await this.generateMetadata(course);
      this.metadataCache.set(course.id, metadata);

      // Prisma에는 JSON 문자열로 저장
      const metadataJson = JSON.stringify(metadata);

      await prisma.courseMetadata.upsert({
        where: { courseId: course.id },
        create: {
          courseId: course.id,
          data: metadataJson
        },
        update: {
          data: metadataJson
        }
      });

      return metadata;
    } catch (error) {
      this.errorHandler.handleError(error as Error, {
        courseId: course.id,
        operation: 'updateMetadata'
      });
      throw error;
    }
  }

  // 누락된 generateMetadata 메서드 추가
  private async generateMetadata(course: Course): Promise<CourseMetadata> {
    const [
      gradeStats,
      relatedCourses,
      scheduleStats,
      recommendedPrereqs
    ] = await Promise.all([
      this.analyzeGrades(course),
      this.findRelatedCourses(course),
      this.analyzeSchedulePatterns(course),
      this.inferPrerequisites(course)
    ]);

    return {
      averageGrade: gradeStats.averageGrade,
      totalEnrollments: gradeStats.totalEnrollments,
      recommendedPrerequisites: recommendedPrereqs,
      workloadLevel: await this.estimateWorkload(course),
      mostCommonTerms: scheduleStats,
      relatedCourses
    };
  }
  private async findRelatedCourses(course: Course): Promise<string[]> {
    const relatedCourses = await prisma.course.findMany({
      where: {
        AND: [
          { department: course.department },
          { level: course.level },
          { NOT: { id: course.id } }
        ]
      },
      select: {
        id: true
      },
      take: 5
    });
  
    const coursesWithSamePrereqs = await prisma.course.findMany({
      where: {
        AND: [
          { prerequisites: { hasSome: course.prerequisites.map(p => p.courseId) } },
          { NOT: { id: course.id } }
        ]
      },
      select: {
        id: true
      },
      take: 5
    });
  
    const combined = [...relatedCourses, ...coursesWithSamePrereqs];
    return Array.from(new Set(combined.map(c => c.id)));
  }
  
  private async analyzeSchedulePatterns(course: Course): Promise<string[]> {
    const scheduleStats = await prisma.courseSchedule.groupBy({
      by: ['dayOfWeek'],
      where: { courseId: course.id },
      _count: {
        dayOfWeek: true
      },
      orderBy: {
        _count: {
          dayOfWeek: 'desc'
        }
      },
      take: 2
    });
  
    return scheduleStats.map((stat: { dayOfWeek: string }) => stat.dayOfWeek);
  }
  
  private async inferPrerequisites(course: Course): Promise<string[]> {
    const prereqCandidates = await prisma.$queryRaw<Array<{ code: string }>>`
      SELECT c.code
      FROM Course c
      WHERE c.department = ${course.department}
        AND c.level < ${course.level}
        AND c.id != ${course.id}
      ORDER BY (
        SELECT COUNT(*)
        FROM Course other
        WHERE other.prerequisites ?| array[c.code]
      ) DESC
      LIMIT 3
    `;
  
    return prereqCandidates.map(c => c.code);
  }
  
  private async estimateWorkload(course: Course): Promise<'light' | 'medium' | 'heavy'> {
    const scheduleCount = await prisma.courseSchedule.count({
      where: { courseId: course.id }
    });
  
    const prerequisiteCount = course.prerequisites.length;
    const totalLoad = scheduleCount + prerequisiteCount;
  
    if (totalLoad <= 2) return 'light';
    if (totalLoad <= 4) return 'medium';
    return 'heavy';
  }
}


