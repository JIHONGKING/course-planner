// app/api/sync/route.ts
import { NextResponse } from 'next/server';
import { syncCoursesWithMadgrades } from '@/lib/madgrades';

export async function POST() {
  try {
    if (!process.env.MADGRADES_API_TOKEN) {
      return NextResponse.json(
        { error: 'Madgrades API token is not configured' },
        { status: 500 }
      );
    }

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
      { error: 'Internal server error during sync', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}