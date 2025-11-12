import { NextRequest, NextResponse } from 'next/server';
import { importExtensionData } from '@/lib/database-utils';
import type { ExtensionHistoricalData } from '@/lib/types';

// POST /api/import - Import data from Chrome extension
export async function POST(request: NextRequest) {
  try {
    let body = await request.json();

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // Handle wrapped format: { "funnels": { ... } }
    // Extract the funnels object if it exists
    let dataToImport: ExtensionHistoricalData;
    if ('funnels' in body && typeof body.funnels === 'object') {
      dataToImport = body.funnels as ExtensionHistoricalData;
    } else {
      // Assume it's already in the correct format
      dataToImport = body as ExtensionHistoricalData;
    }

    const result = importExtensionData(dataToImport);

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
