// src/lib/search.ts
import { prisma } from '@/lib/prisma';
import { searchCourses as searchMadgrades } from './madgrades';
import type { Course } from '@/types/course';
import { Prisma } from '@prisma/client';

interface SearchOptions {
  query: string;
  page?: number;
  limit?: number;
  department?: string;
  level?: string;
  term?: string;
}

export async function searchCourses(options: SearchOptions) {
  const { query, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  try {
    // 1. 로컬 데이터베이스 검색
    const whereClause: Prisma.CourseWhereInput = {
      OR: [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { department: { contains: query, mode: 'insensitive' } }
      ]
    };

    // 필터 조건 추가
    if (options.department) {
      whereClause.department = { equals: options.department };
    }
    if (options.level) {
      whereClause.level = { equals: options.level };
    }
    if (options.term) {
      whereClause.term = { has: options.term };
    }

    const [localCourses, totalCount] = await Promise.all([
      prisma.course.findMany({
        where: whereClause,
        take: limit,
        skip,
        orderBy: { code: 'asc' }
      }),
      prisma.course.count({ where: whereClause })
    ]);

    // 검색 결과가 있으면 반환
    if (localCourses.length > 0) {
      return {
        courses: localCourses,
        total: totalCount,
        page,
        totalPages: Math.ceil(totalCount / limit),
        source: 'local'
      };
    }

    // 2. Madgrades API 검색 및 캐싱
    const madgradesCourses = await searchMadgrades(query);
    
    if (madgradesCourses.length > 0) {
      // 새로운 과목들 캐싱
      const coursesToCache = madgradesCourses.slice(0, 50); // 처음 50개만 캐싱
      
      for (const course of coursesToCache) {
        const existingCourse = await prisma.course.findUnique({
          where: { code: `${course.subjects[0]?.code} ${course.number}` }
        });

        if (!existingCourse) {
          await prisma.course.create({
            data: {
              id: course.uuid,
              code: `${course.subjects[0]?.code} ${course.number}`,
              name: course.name,
              description: course.description || 'No description available',
              credits: 3, // 기본값
              department: course.subjects[0]?.code || 'UNKNOWN',
              level: String(Math.floor(course.number / 100) * 100),
              prerequisites: [],
              term: ['Fall', 'Spring'],
              gradeDistribution: JSON.stringify({
                A: '0', AB: '0', B: '0', BC: '0', C: '0', D: '0', F: '0'
              })
            }
          });
        }
      }

      // 페이지네이션 적용
      const paginatedCourses = madgradesCourses.slice(skip, skip + limit);
      
      return {
        courses: paginatedCourses,
        total: madgradesCourses.length,
        page,
        totalPages: Math.ceil(madgradesCourses.length / limit),
        source: 'madgrades'
      };
    }

    // 검색 결과 없음
    return {
      courses: [],
      total: 0,
      page: 1,
      totalPages: 0,
      source: 'none'
    };

  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Failed to search courses');
  }
}

// 과목 코드 정규화 함수
export function normalizeCourseCode(code: string): string {
  // 예: "CS 300" -> "COMP SCI 300"
  const codeMap: { [key: string]: string } = {
    'CS': 'COMP SCI',
    'MATH': 'MATH',
    'STAT': 'STAT',
    // 추가 매핑...
  };

  const parts = code.trim().split(' ');
  if (parts.length >= 2) {
    const dept = parts[0].toUpperCase();
    const number = parts[1];
    return `${codeMap[dept] || dept} ${number}`;
  }
  return code;
}