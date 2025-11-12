import { NextResponse } from 'next/server';
import { exportToExtensionFormat } from '@/lib/database-utils';

// GET /api/export - Export data in Chrome extension format
export async function GET() {
  try {
    const data = exportToExtensionFormat();

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
