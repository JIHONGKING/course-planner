// app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { syncCoursesWithMadgrades } from '@/lib/madgrades';

export async function POST() {
  try {
    // 기본적인 인증 체크 추가
    const result = await syncCoursesWithMadgrades();
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sync API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync' },
      { status: 500 }
    );
  }
}