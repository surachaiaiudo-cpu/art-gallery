export const runtime = 'edge';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET() {
  try {
    const allUsers = await db.select().from(schema.users);
    const allArtworks = await db.select().from(schema.artworks);
    const allExhibitions = await db.select().from(schema.exhibitions);
    const allLinks = await db.select().from(schema.exhibitionArtworks);

    const artists = allUsers.filter((u: any) => u.role === 'artist');
    const curators = allUsers.filter((u: any) => u.role === 'curator');

    return NextResponse.json({
      status: 'ok',
      time: new Date().toISOString(),
      database: {
        totalUsers: allUsers.length,
        artistsCount: artists.length,
        curatorsCount: curators.length,
        artworksCount: allArtworks.length,
        exhibitionsCount: allExhibitions.length,
        exhibitionLinksCount: allLinks.length,
        sampleArtists: artists.slice(0, 10).map((a: any) => ({
          id: a.id,
          name: a.name,
          country: a.country,
          flagEmoji: a.flagEmoji,
        })),
        sampleArtworks: allArtworks.slice(0, 10).map((art: any) => ({
          id: art.id,
          title: art.title,
          artistId: art.artistId,
          imageUrl: art.imageUrl,
          createdAt: art.createdAt,
        })),
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: String(error),
      time: new Date().toISOString(),
    }, { status: 500 });
  }
}
