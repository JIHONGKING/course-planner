// app/api/courses/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('query');
    const level = searchParams.get('level');
    const term = searchParams.get('term');
    const department = searchParams.get('department');

    const courses = await prisma.course.findMany({
      where: {
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
      },
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Failed to fetch courses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}