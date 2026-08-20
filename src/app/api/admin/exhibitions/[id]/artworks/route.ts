export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// POST: Add artwork to exhibition
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { artworkId } = body;

    if (!artworkId) {
      return NextResponse.json({ error: 'Artwork ID is required' }, { status: 400 });
    }

    // Check if already linked
    const existing = await db
      .select()
      .from(schema.exhibitionArtworks)
      .where(
        and(
          eq(schema.exhibitionArtworks.exhibitionId, params.id),
          eq(schema.exhibitionArtworks.artworkId, artworkId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Artwork already in exhibition' }, { status: 400 });
    }

    await db.insert(schema.exhibitionArtworks).values({
      exhibitionId: params.id,
      artworkId,
      displayOrder: 99,
      wallPosition: JSON.stringify({
        x: 0,
        y: 2.0,
        z: -6.85,
        rotationY: 0,
        wallIndex: 0,
        scale: 1,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error linking artwork to exhibition:', error);
    return NextResponse.json({ error: 'Failed to add artwork to exhibition' }, { status: 500 });
  }
}

// DELETE: Remove artwork from exhibition
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const artworkId = searchParams.get('artworkId');

    if (!artworkId) {
      return NextResponse.json({ error: 'Artwork ID is required' }, { status: 400 });
    }

    await db
      .delete(schema.exhibitionArtworks)
      .where(
        and(
          eq(schema.exhibitionArtworks.exhibitionId, params.id),
          eq(schema.exhibitionArtworks.artworkId, artworkId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing artwork from exhibition:', error);
    return NextResponse.json({ error: 'Failed to remove artwork from exhibition' }, { status: 500 });
  }
}
