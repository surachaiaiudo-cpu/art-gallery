export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET: Auto-resequence all artworks in all exhibitions from 1 to N
export async function GET() {
  try {
    const allExhibitions = await db.select({ id: schema.exhibitions.id }).from(schema.exhibitions);
    let totalUpdated = 0;

    for (const exh of allExhibitions) {
      const links = await db
        .select({
          artworkId: schema.exhibitionArtworks.artworkId,
          displayOrder: schema.exhibitionArtworks.displayOrder,
        })
        .from(schema.exhibitionArtworks)
        .where(eq(schema.exhibitionArtworks.exhibitionId, exh.id))
        .orderBy(asc(schema.exhibitionArtworks.displayOrder));

      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const newOrder = i + 1;
        if (link.displayOrder !== newOrder) {
          await db
            .update(schema.exhibitionArtworks)
            .set({ displayOrder: newOrder })
            .where(
              and(
                eq(schema.exhibitionArtworks.exhibitionId, exh.id),
                eq(schema.exhibitionArtworks.artworkId, link.artworkId)
              )
            );
          totalUpdated++;
        }
      }
    }

    return NextResponse.json({ success: true, totalUpdated });
  } catch (error) {
    console.error('Error resequencing all exhibitions:', error);
    return NextResponse.json({ error: 'Failed to resequence exhibitions', details: String(error) }, { status: 500 });
  }
}

// PUT / POST: Reorder artworks display order
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { exhibitionId, orderedArtworkIds, items } = body;

    // Mode 1: Ordered array of artwork IDs
    if (Array.isArray(orderedArtworkIds) && orderedArtworkIds.length > 0) {
      for (let i = 0; i < orderedArtworkIds.length; i++) {
        const artId = orderedArtworkIds[i];
        const newOrder = i + 1;

        if (exhibitionId) {
          await db
            .update(schema.exhibitionArtworks)
            .set({ displayOrder: newOrder })
            .where(
              and(
                eq(schema.exhibitionArtworks.exhibitionId, exhibitionId),
                eq(schema.exhibitionArtworks.artworkId, artId)
              )
            );
        } else {
          await db
            .update(schema.exhibitionArtworks)
            .set({ displayOrder: newOrder })
            .where(eq(schema.exhibitionArtworks.artworkId, artId));
        }
      }

      return NextResponse.json({ success: true, count: orderedArtworkIds.length });
    }

    // Mode 2: Array of items { artworkId, displayOrder, exhibitionId }
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (item.artworkId && typeof item.displayOrder === 'number') {
          if (item.exhibitionId || exhibitionId) {
            const exhId = item.exhibitionId || exhibitionId;
            await db
              .update(schema.exhibitionArtworks)
              .set({ displayOrder: item.displayOrder })
              .where(
                and(
                  eq(schema.exhibitionArtworks.exhibitionId, exhId),
                  eq(schema.exhibitionArtworks.artworkId, item.artworkId)
                )
              );
          } else {
            await db
              .update(schema.exhibitionArtworks)
              .set({ displayOrder: item.displayOrder })
              .where(eq(schema.exhibitionArtworks.artworkId, item.artworkId));
          }
        }
      }

      return NextResponse.json({ success: true, count: items.length });
    }

    return NextResponse.json({ error: 'No reorder data provided' }, { status: 400 });
  } catch (error) {
    console.error('Error reordering artworks:', error);
    return NextResponse.json({ error: 'Failed to reorder artworks', details: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}
