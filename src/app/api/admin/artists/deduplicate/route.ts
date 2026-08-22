export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { normalizeArtistName, getNameTokens } from '@/lib/artistMatcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  return executeArtistDeduplication();
}

export async function POST() {
  return executeArtistDeduplication();
}

async function executeArtistDeduplication() {
  try {
    const allUsers = await db.select().from(schema.users);
    const artists = allUsers.filter((u: any) => u.role !== 'curator');

    // Group artists by normalized key
    const groups = new Map<string, any[]>();

    for (const artist of artists) {
      const normKey = normalizeArtistName(artist.name);
      if (!normKey) continue;

      if (!groups.has(normKey)) {
        groups.set(normKey, []);
      }
      groups.get(normKey)!.push(artist);
    }

    let mergedCount = 0;
    const deletedArtistIds: string[] = [];

    const groupList = Array.from(groups.values());
    for (const group of groupList) {
      if (group.length > 1) {
        // Pick canonical artist: prefer one with real email, avatarUrl, or bio
        group.sort((a: any, b: any) => {
          const aHasRealEmail = a.email && !a.email.includes('@artvara-artists.com');
          const bHasRealEmail = b.email && !b.email.includes('@artvara-artists.com');
          if (aHasRealEmail && !bHasRealEmail) return -1;
          if (!aHasRealEmail && bHasRealEmail) return 1;

          const aScore = (a.avatarUrl ? 2 : 0) + (a.country ? 1 : 0) + (a.bio ? 1 : 0);
          const bScore = (b.avatarUrl ? 2 : 0) + (b.country ? 1 : 0) + (b.bio ? 1 : 0);
          return bScore - aScore;
        });

        const canonical = group[0];
        const duplicates = group.slice(1);

        for (const dup of duplicates) {
          // Re-link artworks from duplicate artist to canonical artist
          const dupArtworks = await db
            .select({ id: schema.artworks.id })
            .from(schema.artworks)
            .where(eq(schema.artworks.artistId, dup.id));

          for (const art of dupArtworks) {
            await db
              .update(schema.artworks)
              .set({ artistId: canonical.id })
              .where(eq(schema.artworks.id, art.id));
          }

          deletedArtistIds.push(dup.id);
          mergedCount++;
        }
      }
    }

    // Delete duplicate artist rows
    for (const dupId of deletedArtistIds) {
      await db.delete(schema.users).where(eq(schema.users.id, dupId));
    }

    const remainingUsers = await db.select().from(schema.users);
    const cleanArtists = remainingUsers.filter((u: any) => u.role !== 'curator');

    return NextResponse.json({
      success: true,
      mergedCount,
      deletedArtistIdsCount: deletedArtistIds.length,
      totalRemainingArtists: cleanArtists.length,
    });
  } catch (error) {
    console.error('Error deduplicating artists:', error);
    return NextResponse.json({ error: 'Failed to deduplicate artists', details: String(error) }, { status: 500 });
  }
}
