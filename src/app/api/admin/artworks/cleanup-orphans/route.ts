export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { inArray, notInArray, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    // 1. Fetch all artwork IDs currently linked to any exhibition
    const activeLinks = await db
      .select({ artworkId: schema.exhibitionArtworks.artworkId })
      .from(schema.exhibitionArtworks);

    const activeArtworkIds = new Set(activeLinks.map((l: any) => l.artworkId));

    // 2. Fetch all artworks
    const allArtworks = await db.select({ id: schema.artworks.id }).from(schema.artworks);

    const orphanArtworkIds: string[] = [];
    for (const art of allArtworks) {
      if (!activeArtworkIds.has(art.id)) {
        orphanArtworkIds.push(art.id);
      }
    }

    let deletedCount = 0;
    // Delete orphan artworks in batches
    for (const orphanId of orphanArtworkIds) {
      await db.delete(schema.artworks).where(eq(schema.artworks.id, orphanId));
      deletedCount++;
    }

    // 3. Get updated counts
    const remainingArtworks = await db.select({ id: schema.artworks.id }).from(schema.artworks);
    const activeUsers = await db.select({ id: schema.users.id }).from(schema.users);

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
