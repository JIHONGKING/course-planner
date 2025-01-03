// app/api/test-connection/route.ts
import { NextResponse } from 'next/server';
import { testMadgradesConnection } from '@/lib/madgrades';

export async function GET() {
  const result = await testMadgradesConnection();
  
  if (!result.success) {
    return NextResponse.json(result, { status: 500 });
  }
  
  return NextResponse.json(result);
}