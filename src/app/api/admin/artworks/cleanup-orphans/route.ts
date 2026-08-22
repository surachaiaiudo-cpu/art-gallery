export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { inArray, notInArray, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET() {
  return executeCleanup();
}

export async function POST() {
  return executeCleanup();
}

async function executeCleanup() {
  try {
    // 1. Fetch all artwork IDs currently linked to any exhibition
    const activeLinks = await db
      .select({ artworkId: schema.exhibitionArtworks.artworkId })
      .from(schema.exhibitionArtworks);

    const activeArtworkIds = new Set(activeLinks.map((l: any) => l.artworkId));

    // 2. Fetch all artworks
    const allArtworks = await db.select().from(schema.artworks);

    const orphanArtworkIds: string[] = [];
    const seenArtKeys = new Set<string>();
    const keepArtworkIds = new Set<string>();

    for (const art of allArtworks) {
      const isLinked = activeArtworkIds.has(art.id);
      const artKey = `${art.artistId}:::${(art.title || '').trim().toLowerCase()}`;

      if (isLinked) {
        if (!seenArtKeys.has(artKey)) {
          seenArtKeys.add(artKey);
          keepArtworkIds.add(art.id);
        } else {
          // Duplicate within active exhibition
          orphanArtworkIds.push(art.id);
        }
      } else {
        // Not linked to any exhibition -> delete
        orphanArtworkIds.push(art.id);
      }
    }

    let deletedCount = 0;
    const CHUNK_SIZE = 50;
    for (let i = 0; i < orphanArtworkIds.length; i += CHUNK_SIZE) {
      const chunk = orphanArtworkIds.slice(i, i + CHUNK_SIZE);
      await db.delete(schema.artworks).where(inArray(schema.artworks.id, chunk));
      await db.delete(schema.exhibitionArtworks).where(inArray(schema.exhibitionArtworks.artworkId, chunk));
      deletedCount += chunk.length;
    }

    // 4. Get updated counts
    const remainingArtworks = await db.select({ id: schema.artworks.id }).from(schema.artworks);
    const activeUsers = await db.select().from(schema.users);

    return NextResponse.json({
      success: true,
      deletedCount,
      remainingArtworksCount: remainingArtworks.length,
      activeExhibitionArtworksCount: activeArtworkIds.size,
      totalArtistsCount: activeUsers.length,
    });
  } catch (error) {
    console.error('Error cleaning orphan artworks:', error);
    return NextResponse.json({ error: 'Failed to cleanup orphan artworks', details: String(error) }, { status: 500 });
  }
}
