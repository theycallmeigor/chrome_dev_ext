import { NextRequest, NextResponse } from 'next/server';
import { importExtensionData } from '@/lib/database-utils';
import type { ExtensionHistoricalData } from '@/lib/types';

// POST /api/import - Import data from Chrome extension
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ExtensionHistoricalData;

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 400 }
      );
    }

    const result = importExtensionData(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Import failed',
          details: result.errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Data imported successfully',
      data: {
        funnelsImported: result.funnelsImported,
        pagesImported: result.pagesImported,
        errors: result.errors,
      },
    });
  } catch (error) {
    console.error('Error importing data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import data' },
      { status: 500 }
    );
  }
}
