export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { inArray, notInArray, eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function POST() {
  return executeCleanup();
}

async function executeCleanup() {
  try {
    // 1. Fetch all artwork IDs currently linked to any exhibition
    const activeLinks = await db
      .select({ artworkId: schema.exhibitionArtworks.artworkId })
      .from(schema.exhibitionArtworks);

    const activeArtworkIds = activeLinks.map((l: any) => l.artworkId).filter(Boolean);

    // 2. Delete all orphan artworks not in active exhibition in 1 fast query
    if (activeArtworkIds.length > 0) {
      await db.delete(schema.artworks).where(notInArray(schema.artworks.id, activeArtworkIds));
    }

    // 3. Delete ghost artists (those with 0 artworks created from early text parser tests)
    const remainingArtworks = await db.select({ artistId: schema.artworks.artistId }).from(schema.artworks);
    const validArtistIdSet = new Set(remainingArtworks.map((a: any) => a.artistId));
    const defaultIds = ['curator-1', 'curator-2', 'artist-1', 'artist-2', 'artist-3', 'artist-4', 'artist-5', 'artist-6', 'artist-7', 'artist-8'];

    const allUsers = await db.select().from(schema.users);
    const ghostUserIds = allUsers
      .filter((u: any) => u.role === 'artist' && !validArtistIdSet.has(u.id) && !defaultIds.includes(u.id))
      .map((u: any) => u.id);

    if (ghostUserIds.length > 0) {
      await db.delete(schema.users).where(inArray(schema.users.id, ghostUserIds));
    }

    // 4. Get updated counts
    const finalArtworks = await db.select({ id: schema.artworks.id }).from(schema.artworks);
    const finalUsers = await db.select({ id: schema.users.id }).from(schema.users);

    return NextResponse.json({
      success: true,
      remainingArtworksCount: finalArtworks.length,
      activeExhibitionArtworksCount: activeArtworkIds.length,
      totalArtistsCount: finalUsers.length,
      ghostArtistsDeleted: ghostUserIds.length,
    });
  } catch (error) {
    console.error('Error cleaning orphan artworks:', error);
    return NextResponse.json({ error: 'Failed to cleanup orphan artworks', details: String(error) }, { status: 500 });
  }
}
