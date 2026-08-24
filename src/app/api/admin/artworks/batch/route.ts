export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { getCountryFlagEmoji } from '@/lib/countryUtils';
import { findMatchingArtist } from '@/lib/artistMatcher';
import { invalidateDataCache } from '@/lib/data';

export const dynamic = 'force-dynamic';

interface BatchArtworkRow {
  title: string;
  artistName?: string;
  artistCountry?: string;
  artistEmail?: string;
  artistAvatarUrl?: string;
  artistBio?: string;
  medium?: string;
  dimensions?: string;
  yearCreated?: number | string;
  concept?: string;
  imageUrl: string;
  price?: number | string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, exhibitionId }: { items: BatchArtworkRow[]; exhibitionId?: string } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No artwork items provided for import' }, { status: 400 });
    }

    // 1. Fetch all existing users and maintain dynamic candidate list
    const rawUsers = await db.select().from(schema.users);
    const allUsers: any[] = Array.isArray(rawUsers) ? rawUsers : ((rawUsers as any)?.results || (rawUsers as any)?.rows || []);
    const candidateArtists: any[] = allUsers.filter((u: any) => u.role !== 'curator');
    const existingEmails = new Set<string>();

    for (const u of allUsers) {
      if (u.email) existingEmails.add(u.email.toLowerCase().trim());
    }

    // 2. Resolve Exhibition ID & current Max Display Order
    let targetExhibitionId: string | undefined = exhibitionId;
    let maxOrder = 0;
    if (exhibitionId) {
      const rawExhibitions = await db.select().from(schema.exhibitions);
      const allExhibitions: any[] = Array.isArray(rawExhibitions) ? rawExhibitions : ((rawExhibitions as any)?.results || (rawExhibitions as any)?.rows || []);
      const existingExh = allExhibitions.find((e: any) => e.id === exhibitionId);
      if (existingExh) {
        targetExhibitionId = existingExh.id;
      }

      if (targetExhibitionId) {
        const rawArtworks = await db.select().from(schema.exhibitionArtworks);
        const existingArtworks: any[] = Array.isArray(rawArtworks) ? rawArtworks : ((rawArtworks as any)?.results || (rawArtworks as any)?.rows || []);
        const exhArtworks = existingArtworks.filter((ea: any) => ea.exhibitionId === targetExhibitionId);
        for (const row of exhArtworks) {
          if (row.displayOrder && row.displayOrder > maxOrder) {
            maxOrder = row.displayOrder;
          }
        }
      }
    }

    const newArtistsToInsert: any[] = [];
    const artistsToUpdate: Array<{ id: string; avatarUrl?: string; bio?: string }> = [];
    const newArtworksToInsert: any[] = [];
    const newLinksToInsert: any[] = [];
    const importedArtworks: Array<{ id: string; title: string }> = [];
    const failedArtworks: Array<{ index: number; title: string; reason: string }> = [];

    const now = Date.now();

    // 3. Process rows and build batch arrays
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.title && !row.artistName && !row.imageUrl && !row.concept) continue;

      const artistName = (row.artistName || '').trim() || 'ศิลปินร่วมแสดง';
      const title = (row.title || '').trim() || (artistName ? `ผลงานของ ${artistName}` : 'ผลงานศิลปกรรม');
      const artistCountry = (row.artistCountry || '').trim() || 'Thailand';

      // Smart Artist Detection: match against all existing + newly created in this batch
      const matchedArtist = findMatchingArtist(candidateArtists, {
        name: artistName,
        email: row.artistEmail,
        country: artistCountry,
      });

      let artistId: string;

      if (matchedArtist) {
        artistId = matchedArtist.id;
        // If avatar provided and matched artist lacks avatar, queue update
        if (row.artistAvatarUrl && !matchedArtist.avatarUrl) {
          matchedArtist.avatarUrl = row.artistAvatarUrl;
          artistsToUpdate.push({
            id: artistId,
            avatarUrl: row.artistAvatarUrl,
            bio: row.artistBio || matchedArtist.bio,
          });
        }
      } else {
        const randSuffix = Math.random().toString(36).substring(2, 7);
        artistId = `artist-${now}-${i}-${randSuffix}`;

        let candidateEmail = (row.artistEmail || '').trim();
        if (!candidateEmail || existingEmails.has(candidateEmail.toLowerCase())) {
          candidateEmail = `artist.${now}.${i}.${randSuffix}@pohchang.gallery`;
        }
        existingEmails.add(candidateEmail.toLowerCase());

        const newArtistObj = {
          id: artistId,
          name: artistName,
          email: candidateEmail,
          role: 'artist',
          country: artistCountry,
          flagEmoji: getCountryFlagEmoji(artistCountry),
          bio: row.artistBio || (artistName !== 'ศิลปินร่วมแสดง' ? `ศิลปินผู้สร้างสรรค์ผลงานศิลปกรรม ${title}` : null),
          avatarUrl: row.artistAvatarUrl || null,
          socialLinks: null,
        };

        newArtistsToInsert.push(newArtistObj);
        candidateArtists.push(newArtistObj);
      }

      const newArtId = `art-${now}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      const cleanPublicId = `artvara/batch-${newArtId}`;
      const yearCreated = row.yearCreated ? parseInt(String(row.yearCreated), 10) || 2026 : 2026;
      const medium = (row.medium || '').trim() || 'Mixed Media';
      const dimensions = (row.dimensions || '').trim() || '100 x 100 cm.';
      const concept = (row.concept || '').trim() || null;
      const imageUrl = (row.imageUrl || '').trim() || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop';
      const price = row.price ? parseFloat(String(row.price)) || 0 : 0;

      newArtworksToInsert.push({
        id: newArtId,
        artistId,
        title,
        description: concept,
        concept,
        yearCreated,
        medium,
        dimensions,
        cloudinaryPublicId: cleanPublicId,
        imageUrl,
        price,
        status: 'available',
        origIndex: i + 1,
      });

      if (targetExhibitionId) {
        const wallIdx = i % 4;
        newLinksToInsert.push({
          exhibitionId: targetExhibitionId,
          artworkId: newArtId,
          displayOrder: maxOrder + i + 1,
          wallPosition: JSON.stringify({
            x: 0,
            y: 2.0,
            z: -6.85,
            rotationY: 0,
            wallIndex: wallIdx,
            scale: 1,
          }),
        });
      }
    }

    // 4. INSERTS & UPDATES (Guaranteed to stay within D1 limit)
    // 4.1 Insert Artists (with individual fallback)
    const validArtistIds = new Set<string>(candidateArtists.map((a: any) => a.id));

    for (const artist of newArtistsToInsert) {
      try {
        await db.insert(schema.users).values(artist);
        validArtistIds.add(artist.id);
      } catch (err: any) {
        console.warn('Error inserting artist:', artist.name, err);
        // If insert failed due to duplicate email or other reason, look up existing user
        try {
          const found = await db.select().from(schema.users).where(eq(schema.users.name, artist.name)).limit(1);
          if (found && found.length > 0) {
            validArtistIds.add(found[0].id);
          }
        } catch {}
      }
    }

    // Fallback artist ID if any artist is missing
    let fallbackArtistId = allUsers.find((u: any) => u.role === 'artist')?.id || allUsers[0]?.id;
    if (!fallbackArtistId) {
      try {
        const fallbackId = `artist-main-${now}`;
        await db.insert(schema.users).values({
          id: fallbackId,
          name: 'ศิลปินวิทยาลัยเพาะช่าง',
          email: `main.artist.${now}@pohchang.gallery`,
          role: 'artist',
          country: 'Thailand',
        });
        fallbackArtistId = fallbackId;
        validArtistIds.add(fallbackId);
      } catch {}
    }

    // 4.2 Update Existing Artists (if new avatar/bio provided)
    for (const updateObj of artistsToUpdate) {
      try {
        const updateData: any = {};
        if (updateObj.avatarUrl) updateData.avatarUrl = updateObj.avatarUrl;
        if (updateObj.bio) updateData.bio = updateObj.bio;
        if (Object.keys(updateData).length > 0) {
          await db.update(schema.users).set(updateData).where(eq(schema.users.id, updateObj.id));
        }
      } catch {}
    }

    // 4.3 Insert Artworks
    for (const art of newArtworksToInsert) {
      const targetArtistId = validArtistIds.has(art.artistId) ? art.artistId : fallbackArtistId;
      const { origIndex, ...artData } = art;
      artData.artistId = targetArtistId;

      try {
        await db.insert(schema.artworks).values(artData);
        importedArtworks.push({ id: artData.id, title: artData.title });
      } catch (artErr: any) {
        console.error('Error inserting artwork row:', artData.title, artErr);
        failedArtworks.push({
          index: origIndex,
          title: artData.title,
          reason: artErr?.message || String(artErr),
        });
      }
    }

    // 4.4 Insert Exhibition Links for successfully inserted artworks
    const successfullyInsertedArtIds = new Set(importedArtworks.map((a) => a.id));
    for (const link of newLinksToInsert) {
      if (successfullyInsertedArtIds.has(link.artworkId)) {
        try {
          await db.insert(schema.exhibitionArtworks).values(link);
        } catch (linkErr) {
          console.warn('Error linking artwork to exhibition:', link, linkErr);
        }
      }
    }

    invalidateDataCache();

    return NextResponse.json({
      success: true,
      count: importedArtworks.length,
      failedCount: failedArtworks.length,
      failedItems: failedArtworks,
      importedArtworks,
      newArtistsCount: newArtistsToInsert.length,
    });
  } catch (error) {
    console.error('Error batch importing artworks:', error);
    return NextResponse.json({ error: 'Failed to batch import artworks', details: String(error) }, { status: 500 });
  }
}

