// app/api/cron/sync/route.ts
import { NextResponse } from 'next/server';
import { syncCoursesWithMadgrades } from '@/lib/madgrades';

export async function GET(request: Request) {
  // Vercel Cron Job으로부터의 요청인지 확인
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET_KEY}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const result = await syncCoursesWithMadgrades();
  return NextResponse.json(result);
}