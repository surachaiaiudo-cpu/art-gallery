export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { cleanEmail, cleanText } from '@/lib/utils';
import { findMatchingArtist } from '@/lib/artistMatcher';
import { getCountryFlagEmoji } from '@/lib/countryUtils';

export const dynamic = 'force-dynamic';

interface ArtistImportRow {
  name: string;
  country?: string;
  email: string;
  bio?: string;
  avatarUrl?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artists } = body;

    if (!Array.isArray(artists) || artists.length === 0) {
      return NextResponse.json({ error: 'No artist data provided' }, { status: 400 });
    }

    const inserted: string[] = [];
    const skipped: string[] = [];

    const existingUsers = await db.select().from(schema.users);
    const candidateArtists = existingUsers.filter((u: any) => u.role !== 'curator');

    for (let i = 0; i < artists.length; i++) {
      const item: ArtistImportRow = artists[i];
      const cleanName = cleanText(item.name || '');
      const cleanE = cleanEmail(item.email || '');
      const cleanCountry = cleanText(item.country || 'Thailand');

      if (!cleanName) {
        skipped.push(item.name || `Row #${i + 1}`);
        continue;
      }

      // Smart match against existing artists
      const matchedArtist = findMatchingArtist(candidateArtists, {
        name: cleanName,
        email: cleanE,
        country: cleanCountry,
      });

      if (matchedArtist) {
        // Update existing artist info if new details are provided
        const updateData: any = {};
        if (cleanCountry && (!matchedArtist.country || matchedArtist.country === 'Thailand')) {
          updateData.country = cleanCountry;
          updateData.flagEmoji = getCountryFlagEmoji(cleanCountry);
        }
        if (cleanE && (!matchedArtist.email || matchedArtist.email.includes('@artvara'))) {
          updateData.email = cleanE;
        }
        if (item.avatarUrl && !matchedArtist.avatarUrl) {
          updateData.avatarUrl = item.avatarUrl;
        }
        if (item.bio && !matchedArtist.bio) {
          updateData.bio = item.bio;
        }

        if (Object.keys(updateData).length > 0) {
          await db
            .update(schema.users)
            .set(updateData)
            .where(eq(schema.users.id, matchedArtist.id));
        }

        inserted.push(cleanName);
        continue;
      }

      const newId = `artist-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const fallbackEmail = cleanE || `artist.${Date.now()}.${i}@artvara.gallery`;
      const flag = getCountryFlagEmoji(cleanCountry);

      const newArtist = {
        id: newId,
        name: cleanName,
        email: fallbackEmail,
        role: 'artist',
        country: cleanCountry,
        flagEmoji: flag,
        bio: item.bio || '',
        avatarUrl: item.avatarUrl || '',
        socialLinks: JSON.stringify({}),
      };

      await db.insert(schema.users).values(newArtist);
      candidateArtists.push(newArtist);

      inserted.push(cleanName);
    }

    return NextResponse.json({
      success: true,
      count: inserted.length,
      inserted,
      skipped,
    });
  } catch (error) {
    console.error('Error batch importing artists:', error);
    return NextResponse.json(
      { error: 'Failed to batch import artists', details: String(error) },
      { status: 500 }
    );
  }
}
