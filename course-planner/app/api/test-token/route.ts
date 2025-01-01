// app/api/test-token/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.madgrades.com/v1/courses?per_page=1', {
      headers: {
        'Authorization': `Token token=${process.env.MADGRADES_API_TOKEN}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      message: 'Token is valid!',
      sample_data: data 
    });
  } catch (error) {
    console.error('Token test failed:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Token test failed', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}