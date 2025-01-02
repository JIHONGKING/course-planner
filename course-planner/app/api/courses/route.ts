// app/api/courses/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import type { Course } from '@/types/course';
import type { Prisma } from '@prisma/client';

const MADGRADES_API_TOKEN = process.env.MADGRADES_API_TOKEN;

function convertToPrismaData(course: Course): Prisma.CourseCreateInput {
  return {
    ...course,
    gradeDistribution: typeof course.gradeDistribution === 'string' 
      ? course.gradeDistribution 
      : JSON.stringify(course.gradeDistribution),
    term: course.term,
    prerequisites: course.prerequisites
  };
}

async function searchMadgradesCourses(query: string) {
  try {
    const response = await fetch(
      `https://api.madgrades.com/v1/courses?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Authorization': `Token token=${MADGRADES_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Madgrades API');
    }

    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error searching Madgrades courses:', error);
    return [];
  }
}

async function getGradeDistribution(courseUuid: string) {
  try {
    const response = await fetch(
      `https://api.madgrades.com/v1/courses/${courseUuid}/grades`,
      {
        headers: {
          'Authorization': `Token token=${MADGRADES_API_TOKEN}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const latestTerm = Math.max(...data.courseOfferings.map((o: any) => o.termCode));
    const latestOffering = data.courseOfferings.find((o: any) => o.termCode === latestTerm);

    if (!latestOffering?.cumulative) return null;

    const total = latestOffering.cumulative.total;
    if (total === 0) return null;

    return {
      A: (latestOffering.cumulative.aCount / total * 100).toFixed(1),
      AB: (latestOffering.cumulative.abCount / total * 100).toFixed(1),
      B: (latestOffering.cumulative.bCount / total * 100).toFixed(1),
      BC: (latestOffering.cumulative.bcCount / total * 100).toFixed(1),
      C: (latestOffering.cumulative.cCount / total * 100).toFixed(1),
      D: (latestOffering.cumulative.dCount / total * 100).toFixed(1),
      F: (latestOffering.cumulative.fCount / total * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Error fetching grade distribution:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const level = searchParams.get('level');
    const term = searchParams.get('term');
    const department = searchParams.get('department');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Prisma query conditions
    const where: Prisma.CourseWhereInput = {
      AND: [
        query ? {
          OR: [
            { code: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        } : {},
        level ? { level } : {},
        term ? { term: { has: term } } : {},
        department ? { department } : {},
      ],
    };

    // First try to find courses in our database
    const [dbCourses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        take: limit,
        skip: (page - 1) * limit,
        orderBy: { code: 'asc' },
      }),
      prisma.course.count({ where })
    ]);

    // If we find results in our database, return them
    if (dbCourses.length > 0) {
      return NextResponse.json({
        courses: dbCourses,
        total,
        page,
        hasMore: total > page * limit,
        source: 'database'
      });
    }

    // If no results in database and we have a query, search Madgrades API
    if (query) {
      const madgradesCourses = await searchMadgradesCourses(query);
      const coursesWithGrades = await Promise.all(
        madgradesCourses.slice(0, 5).map(async (course: any) => {
          const grades = await getGradeDistribution(course.uuid);
          const courseData: Course = {
            id: course.uuid,
            code: course.code,
            name: course.name,
            description: course.description || 'No description available',
            credits: 3,
            department: course.subjects?.[0]?.code || 'UNKNOWN',
            level: String(Math.floor(Number(course.number) / 100) * 100),
            prerequisites: [] as string[],
            term: ['Fall', 'Spring'] as string[],
            gradeDistribution: grades ? JSON.stringify(grades) : JSON.stringify({
              A: '45.2',
              AB: '30.1',
              B: '15.3',
              BC: '5.2',
              C: '2.1',
              D: '1.1',
              F: '1.0'
            })
          };

          // Save to database for future queries
          try {
            await prisma.course.create({
              data: convertToPrismaData(courseData)
            });
          } catch (error) {
            console.error('Failed to cache course:', error);
          }

          return courseData;
        })
      );

      return NextResponse.json({
        courses: coursesWithGrades,
        total: coursesWithGrades.length,
        page: 1,
        hasMore: false,
        source: 'madgrades'
      });
    }

    // Return empty results if no query and no database results
    return NextResponse.json({
      courses: [],
      total: 0,
      page: 1,
      hasMore: false,
      source: 'empty'
    });

  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch courses',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}