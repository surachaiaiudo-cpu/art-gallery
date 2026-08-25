export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { normalizeArtistName, getNameTokens, findMatchingArtist } from '@/lib/artistMatcher';
import { invalidateDataCache } from '@/lib/data';

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

    // Smart Multi-Pass Grouping
    const groups: any[][] = [];

    for (const artist of artists) {
      let matchedGroup: any[] | null = null;

      for (const group of groups) {
        const leader = group[0];
        const match = findMatchingArtist([leader], {
          name: artist.name,
          email: artist.email,
          country: artist.country,
        });

        if (match) {
          matchedGroup = group;
          break;
        }

        // Also check if normalized names or tokens match any member in group
        const normArtist = normalizeArtistName(artist.name);
        const normLeader = normalizeArtistName(leader.name);
        if (normArtist && normLeader && (normArtist === normLeader || normArtist.includes(normLeader) || normLeader.includes(normArtist))) {
          matchedGroup = group;
          break;
        }

        // Check email username prefix match (e.g. bunditinkong@...)
        const aEmailPrefix = (artist.email || '').split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
        const lEmailPrefix = (leader.email || '').split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (aEmailPrefix && lEmailPrefix && aEmailPrefix.length >= 5 && aEmailPrefix === lEmailPrefix) {
          matchedGroup = group;
          break;
        }
      }

      if (matchedGroup) {
        matchedGroup.push(artist);
      } else {
        groups.push([artist]);
      }
    }

    let mergedCount = 0;
    const deletedArtistIds: string[] = [];

    for (const group of groups) {
      if (group.length > 1) {
        // Pick canonical artist: prefer one with real email, avatarUrl, or bio
        group.sort((a: any, b: any) => {
          const aHasRealEmail = a.email && !a.email.includes('@artvara-artists.com') && !a.email.includes('@artvara.gallery');
          const bHasRealEmail = b.email && !b.email.includes('@artvara-artists.com') && !b.email.includes('@artvara.gallery');
          if (aHasRealEmail && !bHasRealEmail) return -1;
          if (!aHasRealEmail && bHasRealEmail) return 1;

          const aScore = (a.avatarUrl ? 3 : 0) + (a.country ? 1 : 0) + (a.bio ? 1 : 0);
          const bScore = (b.avatarUrl ? 3 : 0) + (b.country ? 1 : 0) + (b.bio ? 1 : 0);
          return bScore - aScore;
        });

        const canonical = group[0];
        const duplicates = group.slice(1);

        for (const dup of duplicates) {
          // Merge metadata if canonical is missing it
          const updateFields: any = {};
          if (!canonical.avatarUrl && dup.avatarUrl) {
            canonical.avatarUrl = dup.avatarUrl;
            updateFields.avatarUrl = dup.avatarUrl;
          }
          if ((!canonical.email || canonical.email.includes('@artvara')) && dup.email && !dup.email.includes('@artvara')) {
            canonical.email = dup.email;
            updateFields.email = dup.email;
          }
          if (!canonical.bio && dup.bio) {
            canonical.bio = dup.bio;
            updateFields.bio = dup.bio;
          }
          if (!canonical.country && dup.country) {
            canonical.country = dup.country;
            canonical.flagEmoji = dup.flagEmoji;
            updateFields.country = dup.country;
            updateFields.flagEmoji = dup.flagEmoji;
          }

          if (Object.keys(updateFields).length > 0) {
            await db
              .update(schema.users)
              .set(updateFields)
              .where(eq(schema.users.id, canonical.id));
          }

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

    invalidateDataCache();
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
