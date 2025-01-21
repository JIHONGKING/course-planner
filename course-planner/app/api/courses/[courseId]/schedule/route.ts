//// app/api/courses/[courseId]/schedule/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const TimeSchema = z.string().regex(
  /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  'Time must be in HH:mm format'
);

const DayOfWeekSchema = z.enum(['MON', 'TUE', 'WED', 'THU', 'FRI']);

const scheduleSchema = z.array(
  z.object({
    dayOfWeek: DayOfWeekSchema,
    startTime: TimeSchema,
    endTime: TimeSchema
  })
).refine((schedule) => {
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      const slot1 = schedule[i];
      const slot2 = schedule[j];

      if (slot1.dayOfWeek === slot2.dayOfWeek) {
        const start1 = new Date(`1970-01-01T${slot1.startTime}`);
        const end1 = new Date(`1970-01-01T${slot1.endTime}`);
        const start2 = new Date(`1970-01-01T${slot2.startTime}`);
        const end2 = new Date(`1970-01-01T${slot2.endTime}`);

        if (start1 < end2 && end1 > start2) {
          return false;
        }
      }
    }
  }
  return true;
}, 'Schedule time slots cannot overlap');

export async function GET(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = params;

  try {
    const schedules = await prisma.courseSchedule.findMany({
      where: { courseId },
      select: {
        id: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('Failed to fetch course schedule:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch course schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = params;

  try {
    const body = await request.json();
    console.log('Received schedule data:', body);
    const scheduleData = scheduleSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      await tx.courseSchedule.deleteMany({
        where: { courseId }
      });

      if (scheduleData.length > 0) {
        await tx.courseSchedule.createMany({
          data: scheduleData.map((slot) => ({
            courseId,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime
          }))
        });
      }

      return await tx.courseSchedule.findMany({
        where: { courseId },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true
        },
        orderBy: [
          { dayOfWeek: 'asc' },
          { startTime: 'asc' }
        ]
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update course schedule:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid schedule data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update course schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = params;

  try {
    await prisma.courseSchedule.deleteMany({
      where: { courseId }
    });

    return NextResponse.json({
      success: true,
      message: 'Course schedule deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete course schedule:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete course schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
