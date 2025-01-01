// app/api/academic-plans/route.ts
import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import type { Course } from '@/types/course';

interface AcademicPlanCreateInput {
  userId: string;
  years: {
    startYear: number;
    yearName: string;
    semesters: {
      term: string;
      year: number;
    }[];
  }[];
  savedCourses: Course[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, years, savedCourses } = body as AcademicPlanCreateInput;

    const plan = await prisma.academicPlan.create({
      data: {
        userId,
        years: {
          create: years.map((year) => ({
            startYear: year.startYear,
            yearName: year.yearName,
            semesters: {
              create: year.semesters
            }
          }))
        },
        savedCourses: JSON.stringify(savedCourses)
      }
    });
    
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Failed to create academic plan:', error);
    return NextResponse.json(
      { error: 'Failed to create academic plan' },
      { status: 500 }
    );
  }
}