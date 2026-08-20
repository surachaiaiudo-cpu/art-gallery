import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and } from 'drizzle-orm';
import { getExhibitionBySlug } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const exhibition = await getExhibitionBySlug(params.slug);
    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }
    return NextResponse.json({ exhibition });
  } catch (error) {
    console.error('Error fetching exhibition:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibition' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json();
    const { wallPositions, roomSize } = body;

    // Update roomSize in themeConfig if provided
    if (roomSize) {
      const existing = await db
        .select()
        .from(schema.exhibitions)
        .where(eq(schema.exhibitions.slug, params.slug))
        .limit(1);

      if (existing.length > 0) {
        let currentTheme: Record<string, any> = {};
        if (existing[0].themeConfig) {
          try {
            currentTheme = JSON.parse(existing[0].themeConfig);
          } catch {}
        }

        currentTheme.roomSize = roomSize;

        await db
          .update(schema.exhibitions)
          .set({ themeConfig: JSON.stringify(currentTheme) })
          .where(eq(schema.exhibitions.slug, params.slug));
      }
    }

    // wallPositions: Array<{ exhibitionId: string, artworkId: string, wallPosition: object, displayOrder?: number }>
    if (Array.isArray(wallPositions) && wallPositions.length > 0) {
      for (const item of wallPositions) {
        if (item && item.exhibitionId && item.artworkId) {
          await db
            .update(schema.exhibitionArtworks)
            .set({
              wallPosition: JSON.stringify(item.wallPosition),
              displayOrder: item.displayOrder ?? 0,
            })
            .where(
              and(
                eq(schema.exhibitionArtworks.exhibitionId, item.exhibitionId),
                eq(schema.exhibitionArtworks.artworkId, item.artworkId)
              )
            );
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating exhibition wall positions:', error);
    return NextResponse.json({ error: 'Failed to update exhibition', details: String(error) }, { status: 500 });
  }
}
