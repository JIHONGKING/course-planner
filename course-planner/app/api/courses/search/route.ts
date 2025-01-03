// app/api/courses/search/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sortCourses } from '@/utils/sortUtils';
import type { SortOption, SortOrder } from '@/utils/sortUtils';
import type { Course } from '@/types/course';
import type { Prisma } from '@prisma/client';

function convertPrismaCourseToCourse(prismaData: any): Course {
  return {
    ...prismaData,
    gradeDistribution: typeof prismaData.gradeDistribution === 'string'
      ? prismaData.gradeDistribution
      : JSON.stringify(prismaData.gradeDistribution)
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sortBy = (searchParams.get('sortBy') || 'grade') as SortOption;
    const order = (searchParams.get('order') || 'desc') as SortOrder;
    
    const department = searchParams.get('department');
    const level = searchParams.get('level');
    const credits = searchParams.get('credits');
    const term = searchParams.get('term');

    const where: Prisma.CourseWhereInput = {
      AND: [
        {
          OR: [
            { code: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ]
        },
        ...(department ? [{ department }] : []),
        ...(level ? [{ level }] : []),
        ...(credits ? [{ credits: parseFloat(credits) }] : []),
        ...(term ? [{ term: { has: term } }] : [])
      ]
    };

    const [prismaCourses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: {
          code: 'asc'
        }
      }),
      prisma.course.count({ where })
    ]);

    // Convert Prisma courses to our Course type
    const courses = prismaCourses.map(convertPrismaCourseToCourse);
    const sortedCourses = sortCourses(courses, sortBy, order);

    return NextResponse.json({
      courses: sortedCourses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasMore: (page * limit) < total,
      filters: {
        department,
        level,
        credits,
        term
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}