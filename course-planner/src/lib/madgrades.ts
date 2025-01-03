// src/lib/madgrades.ts

import prisma from '@/lib/prisma';
import type { Course, GradeDistribution } from '@/types/course';
import { Prisma } from '@prisma/client';



// 로컬 인터페이스는 제거하고 import된 타입만 사용
interface MadgradesGrades {
  aCount: number;
  abCount: number;
  bCount: number;
  bcCount: number;
  cCount: number;
  dCount: number;
  fCount: number;
  total: number;
}

function convertToPrismaFormat(course: Course): Prisma.CourseCreateInput {
  return {
    ...course,
    id: course.id,
    code: course.code,
    name: course.name,
    description: course.description,
    credits: course.credits,
    department: course.department,
    level: course.level,
    prerequisites: course.prerequisites,
    term: course.term,
    // Convert gradeDistribution to string for Prisma JSON field
    gradeDistribution: typeof course.gradeDistribution === 'string' 
      ? course.gradeDistribution 
      : JSON.stringify(course.gradeDistribution)
  };
}

export const DEPARTMENT_CODES: { [key: string]: string } = {
  '250': 'AFRICAN',
  '448': 'SCAND ST',
  '266': 'COMP SCI',
  '600': 'MATH',
  '146': 'CHEM',
  '205': 'PHYSICS',
  '200': 'STAT'
};


export interface MadgradesCourse {
  uuid: string;
  number: number;
  name: string;
  subjects: Array<{
    code: string;
    name: string;
  }>;
  description?: string;
}

interface SyncLog {
  timestamp: Date;
  courseId: string;
  action: 'create' | 'update';
  success: boolean;
  error?: string;
}

export async function testMadgradesConnection() {
  try {
    const response = await fetch('https://api.madgrades.com/v1/courses?per_page=1', {
      headers: {
        'Authorization': `Token token=${process.env.MADGRADES_API_TOKEN}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API test failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    return {
      success: true,
      message: 'Successfully connected to Madgrades API',
      sample: data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function syncCoursesWithMadgrades() {
  const batchSize = 50;
  let page = 1;
  let totalSynced = 0;
  let hasMore = true;
  const logs: SyncLog[] = [];

  try {
    console.log('Starting course sync...');
    
    while (hasMore) {
      console.log(`Processing page ${page}...`);
      
      const response = await fetch(
        `https://api.madgrades.com/v1/courses?page=${page}&per_page=${batchSize}`,
        {
          headers: {
            'Authorization': `Token token=${process.env.MADGRADES_API_TOKEN}`,
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch courses: ${response.statusText}`);
      }

      const data = await response.json();
      
      for (const course of data.results) {
        try {
          const grades = await getGradeDistribution(course.uuid);
          const appCourse = convertToAppCourse(course, grades);
          const prismaData = convertToPrismaFormat(appCourse);
          
          await prisma.course.upsert({
            where: { id: course.uuid },
            create: prismaData,
            update: prismaData
          });

          logs.push({
            timestamp: new Date(),
            courseId: course.uuid,
            action: 'update',
            success: true
          });

          totalSynced++;
        } catch (error) {
          logs.push({
            timestamp: new Date(),
            courseId: course.uuid,
            action: 'update',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          console.error(`Failed to sync course ${course.uuid}:`, error);
        }
      }

      hasMore = data.totalPages > page;
      page++;

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return { 
      success: true, 
      totalSynced,
      message: `Successfully synced ${totalSynced} courses`,
      logs: logs.slice(-100)
    };

  } catch (error) {
    console.error('Error during course sync:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      totalSynced,
      logs: logs.slice(-100)
    };
  }
}

export async function getGradeDistribution(courseUuid: string): Promise<GradeDistribution | null> {
  try {
    const response = await fetch(
      `https://api.madgrades.com/v1/courses/${courseUuid}/grades`,
      {
        headers: {
          'Authorization': `Token token=${process.env.MADGRADES_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const latestTerm = Math.max(...data.courseOfferings.map((o: any) => o.termCode));
    const latestOffering = data.courseOfferings.find((o: any) => o.termCode === latestTerm);

    if (!latestOffering?.cumulative) return null;

    const grades: MadgradesGrades = latestOffering.cumulative;
    const total = grades.total;
    
    if (total === 0) return null;

    return {
      A: (grades.aCount / total * 100).toFixed(1),
      AB: (grades.abCount / total * 100).toFixed(1),
      B: (grades.bCount / total * 100).toFixed(1),
      BC: (grades.bcCount / total * 100).toFixed(1),
      C: (grades.cCount / total * 100).toFixed(1),
      D: (grades.dCount / total * 100).toFixed(1),
      F: (grades.fCount / total * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Error fetching grade distribution:', error);
    return null;
  }
}

export async function searchCourses(query: string): Promise<MadgradesCourse[]> {
  try {
    const response = await fetch(
      `https://api.madgrades.com/v1/courses?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Token token=${process.env.MADGRADES_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Madgrades API');
    }

    const data = await response.json();
    const searchTerms = query.toLowerCase().split(' ');
    
    return data.results.filter((course: MadgradesCourse) => {
      const deptCode = course.subjects[0]?.code;
      const deptName = DEPARTMENT_CODES[deptCode] || deptCode;
      const courseCode = `${deptName} ${course.number}`.toLowerCase();
      
      return searchTerms.every(term => 
        courseCode.includes(term.toLowerCase()) || 
        course.name.toLowerCase().includes(term.toLowerCase())
      );
    });
  } catch (error) {
    console.error('Error searching courses:', error);
    return [];
  }
}

export function convertToAppCourse(madgradesCourse: MadgradesCourse, grades: GradeDistribution | null): Course {
  const deptCode = madgradesCourse.subjects[0]?.code;
  const gradeData = grades || {
    A: '45.2',
    AB: '30.1',
    B: '15.3',
    BC: '5.2',
    C: '2.1',
    D: '1.1',
    F: '1.0'
  };
  
  return {
    id: madgradesCourse.uuid,
    code: `${DEPARTMENT_CODES[deptCode] || deptCode} ${madgradesCourse.number}`,
    name: madgradesCourse.name,
    description: madgradesCourse.description || 'No description available',
    credits: 3,
    department: DEPARTMENT_CODES[deptCode] || deptCode,
    level: String(Math.floor(madgradesCourse.number / 100) * 100),
    prerequisites: [],
    term: ['Fall', 'Spring'],
    gradeDistribution: JSON.stringify(gradeData)  // GradeDistribution을 문자열로 변환
  };
}