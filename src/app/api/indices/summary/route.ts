import { NextResponse } from 'next/server';
import { INDICES_METADATA, generateHistoricalData } from '@/lib/mock-data';

export async function GET() {
  try {
    const historical = generateHistoricalData();

    return NextResponse.json({
      success: true,
      indices: INDICES_METADATA,
      historical,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
