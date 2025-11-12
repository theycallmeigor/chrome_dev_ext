import { NextResponse } from 'next/server';
import { cleanupInvalidFunnels } from '@/lib/database-utils';

// POST /api/cleanup - Clean up invalid funnel entries
export async function POST() {
  try {
    const result = cleanupInvalidFunnels();

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${result.deleted} invalid entries`,
      data: result,
    });
  } catch (error) {
    console.error('Error cleaning up invalid funnels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clean up invalid funnels' },
      { status: 500 }
    );
  }
}
