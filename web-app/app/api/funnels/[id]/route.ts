import { NextRequest, NextResponse } from 'next/server';
import { getFunnelById, updateFunnelFlags, deleteFunnel } from '@/lib/database-utils';
import type { Funnel } from '@/lib/types';

// GET /api/funnels/[id] - Get a single funnel
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const funnel = getFunnelById(id);

    if (!funnel) {
      return NextResponse.json(
        { success: false, error: 'Funnel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: funnel,
    });
  } catch (error) {
    console.error('Error fetching funnel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch funnel' },
      { status: 500 }
    );
  }
}

// PUT /api/funnels/[id] - Update funnel flags (pinned, favorite, owned, notes, tags)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json() as Partial<Pick<Funnel, 'isPinned' | 'isFavorite' | 'isOwned' | 'notes' | 'tags'>>;

    updateFunnelFlags(id, body);

    return NextResponse.json({
      success: true,
      message: 'Funnel updated successfully',
    });
  } catch (error) {
    console.error('Error updating funnel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update funnel' },
      { status: 500 }
    );
  }
}

// DELETE /api/funnels/[id] - Delete a funnel
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    deleteFunnel(id);

    return NextResponse.json({
      success: true,
      message: 'Funnel deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting funnel:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete funnel' },
      { status: 500 }
    );
  }
}
