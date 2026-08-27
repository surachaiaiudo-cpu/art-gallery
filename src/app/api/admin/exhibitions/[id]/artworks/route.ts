export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, or, asc } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET: Fetch artworks for an exhibition directly from D1 (fresh, no-cache)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let targetExhibitionId = params.id;
    const exhRow = await db
      .select({ id: schema.exhibitions.id })
      .from(schema.exhibitions)
      .where(or(eq(schema.exhibitions.id, params.id), eq(schema.exhibitions.slug, params.id)))
      .limit(1);

    if (exhRow && exhRow.length > 0) {
      targetExhibitionId = exhRow[0].id;
    }

    const rows = await db
      .select({
        link: schema.exhibitionArtworks,
        art: schema.artworks,
        artist: schema.users,
      })
      .from(schema.exhibitionArtworks)
      .innerJoin(schema.artworks, eq(schema.exhibitionArtworks.artworkId, schema.artworks.id))
      .leftJoin(schema.users, eq(schema.artworks.artistId, schema.users.id))
      .where(eq(schema.exhibitionArtworks.exhibitionId, targetExhibitionId))
      .orderBy(asc(schema.exhibitionArtworks.displayOrder));

    const artworks = rows.map((item: any) => {
      let wallPos = null;
      if (item.link.wallPosition) {
        try {
          wallPos = JSON.parse(item.link.wallPosition);
        } catch {}
      }
      return {
        ...item.art,
        displayOrder: item.link.displayOrder ?? 0,
        wallPosition: wallPos,
        artist: item.artist || null,
      };
    });

    return NextResponse.json(
      { artworks },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    console.error('Error fetching exhibition artworks:', error);
    return NextResponse.json({ error: 'Failed to fetch artworks', details: error?.message }, { status: 500 });
  }
}

// POST: Add artwork to exhibition
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { artworkId, displayOrder = 0, wallPosition } = body;

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
      displayOrder,
      wallPosition: wallPosition ? JSON.stringify(wallPosition) : null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding artwork to exhibition:', error);
    return NextResponse.json({ error: 'Failed to add artwork to exhibition' }, { status: 500 });
  }
}

// PUT: Batch update artwork order/positions in exhibition
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { artworks } = body;

    if (!Array.isArray(artworks)) {
      return NextResponse.json({ error: 'Artworks array is required' }, { status: 400 });
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

    for (const item of artworks) {
      await db
        .update(schema.exhibitionArtworks)
        .set({
          displayOrder: item.displayOrder,
          ...(item.wallPosition ? { wallPosition: JSON.stringify(item.wallPosition) } : {}),
        })
        .where(
          and(
            or(
              eq(schema.exhibitionArtworks.exhibitionId, targetExhibitionId),
              eq(schema.exhibitionArtworks.exhibitionId, params.id)
            ),
            eq(schema.exhibitionArtworks.artworkId, item.artworkId)
          )
        );
    }

    return NextResponse.json({ success: true, count: artworks.length });
  } catch (error) {
    console.error('Error updating exhibition artworks:', error);
    return NextResponse.json({ error: 'Failed to update exhibition artworks' }, { status: 500 });
  }
}

// DELETE: Remove artwork(s) from exhibition (Supports single 'artworkId' or batch 'artworkIds')
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

    // Automatically re-sequence remaining artworks in this exhibition: 1, 2, 3, ... N
    const remainingLinks = await db
      .select({
        artworkId: schema.exhibitionArtworks.artworkId,
        displayOrder: schema.exhibitionArtworks.displayOrder,
      })
      .from(schema.exhibitionArtworks)
      .where(
        or(
          eq(schema.exhibitionArtworks.exhibitionId, targetExhibitionId),
          eq(schema.exhibitionArtworks.exhibitionId, params.id)
        )
      )
      .orderBy(asc(schema.exhibitionArtworks.displayOrder));

    for (let i = 0; i < remainingLinks.length; i++) {
      const link = remainingLinks[i];
      const newOrder = i + 1;
      if (link.displayOrder !== newOrder) {
        await db
          .update(schema.exhibitionArtworks)
          .set({ displayOrder: newOrder })
          .where(
            and(
              or(
                eq(schema.exhibitionArtworks.exhibitionId, targetExhibitionId),
                eq(schema.exhibitionArtworks.exhibitionId, params.id)
              ),
              eq(schema.exhibitionArtworks.artworkId, link.artworkId)
            )
          );
      }
    }

    return NextResponse.json({
      success: true,
      count: idsToDelete.length,
      remainingCount: remainingLinks.length,
    });
  } catch (error: any) {
    console.error('Error removing artwork(s) from exhibition:', error);
    return NextResponse.json(
      { error: 'Failed to remove artwork(s) from exhibition', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
