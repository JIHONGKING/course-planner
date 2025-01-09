// app/api/courses/search/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import type { Course } from '@/types/course';
import type { Prisma } from '@prisma/client';

const MADGRADES_API_TOKEN = process.env.MADGRADES_API_TOKEN;

async function searchMadgradesCourses(query: string) {
  console.log('Searching Madgrades API with query:', query);
  
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

    console.log('Madgrades API response status:', response.status);

    if (!response.ok) {
      throw new Error('Failed to fetch from Madgrades API');
    }

    const data = await response.json();
    console.log('Madgrades API data:', JSON.stringify(data, null, 2));
    
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

    return {
      A: (latestOffering.cumulative.aCount / latestOffering.cumulative.total * 100).toFixed(1),
      AB: (latestOffering.cumulative.abCount / latestOffering.cumulative.total * 100).toFixed(1),
      B: (latestOffering.cumulative.bCount / latestOffering.cumulative.total * 100).toFixed(1),
      BC: (latestOffering.cumulative.bcCount / latestOffering.cumulative.total * 100).toFixed(1),
      C: (latestOffering.cumulative.cCount / latestOffering.cumulative.total * 100).toFixed(1),
      D: (latestOffering.cumulative.dCount / latestOffering.cumulative.total * 100).toFixed(1),
      F: (latestOffering.cumulative.fCount / latestOffering.cumulative.total * 100).toFixed(1)
    };
  } catch (error) {
    console.error('Error fetching grade distribution:', error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query') || '';

    console.log('Search API called with query:', query);

    // First try database
    const dbCourses = await prisma.course.findMany({
      where: {
        OR: [
          { code: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        courseSchedules: true
      }
    });

    if (dbCourses.length > 0) {
      return NextResponse.json({
        courses: dbCourses,
        total: dbCourses.length,
        source: 'database'
      });
    }

    // If no results in database, search Madgrades API
    console.log('No results in database, searching Madgrades API');
    const madgradesCourses = await searchMadgradesCourses(query);
    
    if (!madgradesCourses?.length) {
      return NextResponse.json({
        courses: [],
        total: 0,
        source: 'no_results'
      });
    }

    const coursesWithGrades = await Promise.all(
      madgradesCourses.slice(0, 5).map(async (course: any) => {
        const grades = await getGradeDistribution(course.uuid);
        
        return {
          id: course.uuid,
          code: `${course.subjects?.[0]?.code} ${course.number}`,
          name: course.name,
          description: course.description || 'No description available',
          credits: 3,
          department: course.subjects?.[0]?.code || 'UNKNOWN',
          level: String(Math.floor(Number(course.number) / 100) * 100),
          prerequisites: [],
          term: ['Fall', 'Spring'],
          gradeDistribution: JSON.stringify(grades || {
            A: '45.2',
            AB: '30.1',
            B: '15.3',
            BC: '5.2',
            C: '2.1',
            D: '1.1',
            F: '1.0'
          }),
          courseSchedules: []
        };
      })
    );

    return NextResponse.json({
      courses: coursesWithGrades,
      total: coursesWithGrades.length,
      source: 'madgrades'
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