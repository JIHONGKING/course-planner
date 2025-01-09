// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface CourseInput {
  id?: string;
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  level: string;
  prerequisites: string[];
  term: string[];
  gradeDistribution: {
    A: number;
    AB: number;
    B: number;
    BC: number;
    C: number;
    D: number;
    F: number;
  };
}

// 샘플 코스 데이터
const courses: CourseInput[] = [
  {
    id: 'course-1',
    code: 'COMP SCI 300',
    name: 'Programming II',
    description: 'Introduction to Object-Oriented Programming using Java.',
    credits: 3.0,
    department: 'COMP SCI',
    level: '300',
    prerequisites: [],
    term: ['Fall', 'Spring'],
    gradeDistribution: {
      A: 45.2,
      AB: 30.1,
      B: 15.3,
      BC: 5.2,
      C: 2.1,
      D: 1.1,
      F: 1.0
    }
  },
  {
    code: 'COMP SCI 400',
    name: 'Programming III',
    description: 'Advanced Programming and Data Structures',
    credits: 3.0,
    department: 'COMP SCI',
    level: '400',
    prerequisites: ['COMP SCI 300'],
    term: ['Fall', 'Spring'],
    gradeDistribution: {
      A: 38.5,
      AB: 28.3,
      B: 20.1,
      BC: 7.2,
      C: 3.8,
      D: 1.2,
      F: 0.9
    }
  },
  {
    code: 'COMP SCI 252',
    name: 'Introduction to Computer Engineering',
    description: 'Digital system fundamentals and hardware design',
    credits: 3.0,
    department: 'COMP SCI',
    level: '200',
    prerequisites: [],
    term: ['Fall', 'Spring'],
    gradeDistribution: {
      A: 42.0,
      AB: 28.0,
      B: 18.0,
      BC: 7.0,
      C: 3.0,
      D: 1.5,
      F: 0.5
    }
  },
  {
    code: 'MATH 221',
    name: 'Calculus and Analytic Geometry 1',
    description: 'Functions, limits, continuity, differentiation, integration',
    credits: 5.0,
    department: 'MATH',
    level: '200',
    prerequisites: [],
    term: ['Fall', 'Spring'],
    gradeDistribution: {
      A: 32.5,
      AB: 27.3,
      B: 23.1,
      BC: 9.2,
      C: 5.8,
      D: 1.2,
      F: 0.9
    }
  }
];

async function main() {
  try {
    console.log('Starting to seed...');

    // 기존 데이터 삭제
    await prisma.courseSchedules.deleteMany();
    await prisma.course.deleteMany();
    console.log('Cleared existing data');

    // 새로운 데이터 생성
    for (const course of courses) {
      const data: Prisma.CourseCreateInput = {
        id: course.id || `seed-${course.code.replace(/\s+/g, '-')}`,
        ...course,
        gradeDistribution: JSON.stringify(course.gradeDistribution)
      };

      const createdCourse = await prisma.course.create({ data });
      console.log(`Created course: ${createdCourse.code}`);

      // 샘플 스케줄 추가
      await prisma.courseSchedules.createMany({
        data: [
          {
            courseId: createdCourse.id,
            dayOfWeek: 'MON',
            startTime: '09:00',
            endTime: '09:50'
          },
          {
            courseId: createdCourse.id,
            dayOfWeek: 'WED',
            startTime: '09:00',
            endTime: '09:50'
          }
        ]
      });
      console.log(`Created schedules for ${createdCourse.code}`);
    }

    console.log('\nSeeding completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
