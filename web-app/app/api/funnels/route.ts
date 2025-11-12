import { NextRequest, NextResponse } from 'next/server';
import { getAllFunnels, createOrUpdateFunnel } from '@/lib/database-utils';
import type { SearchFilters, Funnel } from '@/lib/types';

// GET /api/funnels - Get all funnels with optional filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters: SearchFilters = {
      search: searchParams.get('search') || undefined,
      pageType: searchParams.get('pageType') || undefined,
      hasSplitTest: searchParams.get('hasSplitTest') === 'true' ? true : undefined,
      showFavorites: searchParams.get('showFavorites') === 'true' ? true : undefined,
      sortBy: (searchParams.get('sortBy') as SearchFilters['sortBy']) || 'newest',
    };

    const funnels = getAllFunnels(filters);

    return NextResponse.json({
      success: true,
      data: funnels,
      count: funnels.length,
    });
  } catch (error) {
    console.error('Error fetching funnels:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch funnels' },
      { status: 500 }
    );
  }
}

// POST /api/funnels - Create or update a funnel
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<Funnel, 'id'>;

    if (!body.funnelId || !body.name || !body.domain) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: funnelId, name, domain' },
        { status: 400 }
      );
    }

    const id = createOrUpdateFunnel(body);

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error creating/updating funnel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update funnel' },
      { status: 500 }
    );
  }
}
