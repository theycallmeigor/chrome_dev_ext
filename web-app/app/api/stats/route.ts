import { NextResponse } from 'next/server';
import { getStatistics } from '@/lib/database-utils';

// GET /api/stats - Get database statistics
export async function GET() {
  try {
    const stats = getStatistics();

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
