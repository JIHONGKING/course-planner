// app/api/academic-plans/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  try {
    const plan = await prisma.academicPlan.findUnique({
      where: { userId: userId as string },
      include: {
        years: {
          include: {
            semesters: {
              include: {
                courses: true
              }
            }
          }
        }
      }
    });
    
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Failed to fetch academic plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch academic plan' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, years } = body;

    const plan = await prisma.academicPlan.create({
      data: {
        userId,
        years: {
          create: years.map((year: any) => ({
            startYear: year.startYear,
            yearName: year.yearName,
            semesters: {
              create: year.semesters
            }
          }))
        }
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