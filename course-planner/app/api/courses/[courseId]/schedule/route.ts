// app/api/courses/[courseId]/schedule/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';

// 스키마 정의
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
  // 스케줄 충돌 검사 로직
  for (const slot1 of schedule) {
    for (const slot2 of schedule) {
      if (slot1 === slot2) continue;

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

export async function PUT(
  request: Request,
  { params }: { params: { courseId: string } }
) {
  const { courseId } = params;

  try {
    // 과목 존재 여부 확인
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!courseExists) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    console.log('Received schedule data:', JSON.stringify(body, null, 2));

    // 스키마 검증
    const parseResult = scheduleSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('Validation error:', parseResult.error);
      return NextResponse.json(
        {
          error: 'Invalid schedule data',
          details: parseResult.error.flatten()
        },
        { status: 400 }
      );
    }

    const scheduleData = parseResult.data;

    // 트랜잭션 처리
    await prisma.$transaction(async (tx) => {
      // 기존 스케줄 삭제
      await tx.courseSchedule.deleteMany({
        where: { courseId }
      });

      // 새 스케줄 생성
      if (scheduleData.length > 0) {
        await tx.courseSchedule.createMany({
          data: scheduleData.map(slot => ({
            courseId,
            ...slot
          }))
        });
      }
    });

    // 업데이트된 스케줄 조회
    const updatedSchedules = await prisma.courseSchedule.findMany({
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

    return NextResponse.json(updatedSchedules);

  } catch (error) {
    console.error('Schedule update error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      courseId
    });

    return NextResponse.json(
      {
        error: 'Failed to update course schedule',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
