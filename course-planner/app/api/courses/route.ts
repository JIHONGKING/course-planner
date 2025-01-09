// app/api/courses/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Course, GradeDistribution } from '@/types/course';
import type { Prisma } from '@prisma/client';
import { searchMadgradesCourses, getGradeDistribution } from '@/lib/madgrades';

interface SearchOptions {
  query?: string;
  department?: string;
  level?: string;
  term?: string;
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const options: SearchOptions = {
      query: searchParams.get('query') || undefined,
      department: searchParams.get('department') || undefined,
      level: searchParams.get('level') || undefined,
      term: searchParams.get('term') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
    };


    // 1. 로컬 DB 검색
    const whereClause: Prisma.CourseWhereInput = {
      AND: [
        options.query ? {
          OR: [
            { code: { contains: options.query, mode: 'insensitive' } },
            { name: { contains: options.query, mode: 'insensitive' } },
            { description: { contains: options.query, mode: 'insensitive' } }
          ]
        } : {},
        options.department ? { department: options.department } : {},
        options.level ? { level: options.level } : {},
        options.term ? { term: { has: options.term } } : {}
      ]
    };

    const skip = (options.page - 1) * options.limit;

    // sortBy가 'grade'인 경우 gradeDistribution으로 변경
    let orderBy: Prisma.CourseOrderByWithRelationInput = {};
    if (options.sortBy === 'grade') {
      orderBy = { gradeDistribution: options.sortOrder };
    } else if (options.sortBy) {
      orderBy = { [options.sortBy]: options.sortOrder };
    }
    
    const [dbCourses, total] = await Promise.all([
      prisma.course.findMany({
        where: whereClause,
        take: options.limit,
        skip,
        orderBy,
        include: {
          courseSchedules: true
        }
      }),
      prisma.course.count({ where: whereClause })
    ]);

    if (dbCourses.length > 0) {
      return NextResponse.json({
        courses: dbCourses,
        total,
        page: options.page,
        totalPages: Math.ceil(total / options.limit),
        source: 'database'
      });
    }

    // 2. Madgrades API 검색
    if (options.query) {
      const madgradesCourses = await searchMadgradesCourses(options.query);
      
      if (madgradesCourses && madgradesCourses.length > 0) {
        const processedCourses = await Promise.all(
          madgradesCourses.slice(0, 5).map(async (madgradeCourse: any) => {
            const grades = await getGradeDistribution(madgradeCourse.uuid);
            
            const courseData = {
              id: madgradeCourse.uuid,
              code: `${madgradeCourse.subjects[0]?.code} ${madgradeCourse.number}`,
              name: madgradeCourse.name,
              description: madgradeCourse.description || 'No description available',
              credits: 3,
              department: madgradeCourse.subjects[0]?.code || 'UNKNOWN',
              level: String(Math.floor(Number(madgradeCourse.number) / 100) * 100),
              prerequisites: [] as string[],
              term: ['Fall', 'Spring'],
              gradeDistribution: grades ? JSON.stringify(grades) : JSON.stringify({
                A: '0', AB: '0', B: '0', BC: '0', C: '0', D: '0', F: '0'
              })
            };

            // DB에 캐싱
            try {
              await prisma.course.create({
                data: {
                  ...courseData
                }
              });
            } catch (error) {
              console.error('Failed to cache course:', error);
            }

            return courseData;
          })
        );

        return NextResponse.json({
          courses: processedCourses,
          total: processedCourses.length,
          page: 1,
          totalPages: 1,
          source: 'madgrades'
        });
      }
    }

    return NextResponse.json({
      courses: [],
      total: 0,
      page: 1,
      totalPages: 0,
      source: 'none'
    });

  } catch (error) {
    console.error('Course API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}