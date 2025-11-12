import { NextRequest, NextResponse } from 'next/server';
import { createOrUpdatePage, updatePageFavorite } from '@/lib/database-utils';
import type { Page } from '@/lib/types';

// POST /api/pages - Create or update a page
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Omit<Page, 'id'>;

    if (!body.funnelId || !body.pageId || !body.title || !body.urlSlug) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: funnelId, pageId, title, urlSlug' },
        { status: 400 }
      );
    }

    const id = createOrUpdatePage(body);

    return NextResponse.json({
      success: true,
      data: { id },
    });
  } catch (error) {
    console.error('Error creating/updating page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create/update page' },
      { status: 500 }
    );
  }
}

// PUT /api/pages - Update page favorite status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json() as { funnelId: string; pageId: string; isFavorite: boolean };

    if (!body.funnelId || !body.pageId || body.isFavorite === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: funnelId, pageId, isFavorite' },
        { status: 400 }
      );
    }

    updatePageFavorite(body.funnelId, body.pageId, body.isFavorite);

    return NextResponse.json({
      success: true,
      message: 'Page updated successfully',
    });
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update page' },
      { status: 500 }
    );
  }
}
