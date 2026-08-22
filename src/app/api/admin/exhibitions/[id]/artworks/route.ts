export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, or } from 'drizzle-orm';

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

    // Resolve exhibition ID if slug was passed
    let targetExhibitionId = params.id;
    try {
      const exhRow = await db
        .select({ id: schema.exhibitions.id })
        .from(schema.exhibitions)
        .where(or(eq(schema.exhibitions.id, params.id), eq(schema.exhibitions.slug, params.id)))
        .limit(1);

      if (exhRow && exhRow.length > 0) {
        targetExhibitionId = exhRow[0].id;
      }
    } catch (e) {}

    // Check if already linked
    const existing = await db
      .select()
      .from(schema.exhibitionArtworks)
      .where(
        and(
          or(
            eq(schema.exhibitionArtworks.exhibitionId, targetExhibitionId),
            eq(schema.exhibitionArtworks.exhibitionId, params.id)
          ),
          eq(schema.exhibitionArtworks.artworkId, artworkId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ error: 'Artwork already in exhibition' }, { status: 400 });
    }

    await db.insert(schema.exhibitionArtworks).values({
      exhibitionId: targetExhibitionId,
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

// DELETE: Remove one or multiple artworks from exhibition
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(req.url);
    const singleArtworkId = searchParams.get('artworkId');
    const artworkIdsParam = searchParams.get('artworkIds');

    let idsToDelete: string[] = [];

    if (artworkIdsParam) {
      idsToDelete = artworkIdsParam
        .split(',')
        .map((s) => decodeURIComponent(s).trim())
        .filter(Boolean);
    } else if (singleArtworkId) {
      idsToDelete = [decodeURIComponent(singleArtworkId).trim()];
    }

    // If not found in query params, safely parse request body
    if (idsToDelete.length === 0) {
      try {
        const text = await req.text();
        if (text && text.trim().length > 0) {
          const body = JSON.parse(text);
          if (Array.isArray(body?.artworkIds) && body.artworkIds.length > 0) {
            idsToDelete = body.artworkIds.map((s: any) => String(s).trim()).filter(Boolean);
          } else if (body?.artworkId) {
            idsToDelete = [String(body.artworkId).trim()];
          }
        }
      } catch (parseErr) {
        console.warn('Could not parse JSON body in DELETE:', parseErr);
      }
    }

    if (idsToDelete.length === 0) {
      return NextResponse.json({ error: 'Artwork ID(s) required' }, { status: 400 });
    }

    // Resolve actual exhibition ID if slug was passed in params
    let targetExhibitionId = params.id;
    try {
      const exhRow = await db
        .select({ id: schema.exhibitions.id })
        .from(schema.exhibitions)
        .where(or(eq(schema.exhibitions.id, params.id), eq(schema.exhibitions.slug, params.id)))
        .limit(1);

      if (exhRow && exhRow.length > 0) {
        targetExhibitionId = exhRow[0].id;
      }
    } catch (e) {
      console.warn('Could not resolve exhibition ID:', e);
    }

    // Delete each link reliably from Cloudflare D1
    for (const artId of idsToDelete) {
      await db
        .delete(schema.exhibitionArtworks)
        .where(
          and(
            or(
              eq(schema.exhibitionArtworks.exhibitionId, targetExhibitionId),
              eq(schema.exhibitionArtworks.exhibitionId, params.id)
            ),
            eq(schema.exhibitionArtworks.artworkId, artId)
          )
        );
    }

    return NextResponse.json({ success: true, count: idsToDelete.length });
  } catch (error: any) {
    console.error('Error removing artwork(s) from exhibition:', error);
    return NextResponse.json(
      { error: 'Failed to remove artwork(s) from exhibition', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
