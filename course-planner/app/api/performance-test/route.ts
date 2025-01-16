// src/app/api/performance-test/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // 테스트를 위한 지연 시간 추가
  await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

  return NextResponse.json({
    message: 'Test API response',
    timestamp: Date.now()
  });
}