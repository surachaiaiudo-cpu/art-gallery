export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { getCountryFlagEmoji } from '@/lib/countryUtils';

export const dynamic = 'force-dynamic';

interface BatchArtworkRow {
  title: string;
  artistName?: string;
  artistCountry?: string;
  artistEmail?: string;
  medium?: string;
  dimensions?: string;
  yearCreated?: number | string;
  concept?: string;
  imageUrl: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items, exhibitionId }: { items: BatchArtworkRow[]; exhibitionId?: string } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No artwork items provided for import' }, { status: 400 });
    }

    // 1. Fetch all existing users to map artists and check email uniqueness
    const allUsers = await db.select().from(schema.users);
    const artistNameMap = new Map<string, string>();
    const existingEmails = new Set<string>();

    for (const u of allUsers) {
      if (u.name) artistNameMap.set(u.name.toLowerCase().trim(), u.id);
      if (u.email) existingEmails.add(u.email.toLowerCase().trim());
    }

    // 2. Resolve Exhibition ID & current Max Display Order
    let targetExhibitionId: string | undefined = exhibitionId;
    let maxOrder = 0;
    if (exhibitionId) {
      const allExhibitions = await db.select().from(schema.exhibitions);
      const existingExh = allExhibitions.find((e: any) => e.id === exhibitionId);
      if (existingExh) {
        targetExhibitionId = existingExh.id;
      }

      if (targetExhibitionId) {
        const existingArtworks = await db.select().from(schema.exhibitionArtworks);
        const exhArtworks = existingArtworks.filter((ea: any) => ea.exhibitionId === targetExhibitionId);
        for (const row of exhArtworks) {
          if (row.displayOrder && row.displayOrder > maxOrder) {
            maxOrder = row.displayOrder;
          }
        }
      }
    }

    const newArtistsToInsert: any[] = [];
    const newArtworksToInsert: any[] = [];
    const newLinksToInsert: any[] = [];
    const importedArtworks: Array<{ id: string; title: string }> = [];

    const now = Date.now();

    // 3. Process rows and build batch arrays
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.title && !row.artistName && !row.imageUrl && !row.concept) continue;

      const artistName = (row.artistName || '').trim() || 'ศิลปินร่วมแสดง';
      const title = (row.title || '').trim() || (artistName ? `ผลงานของ ${artistName}` : 'ผลงานศิลปกรรม');
      const artistCountry = (row.artistCountry || '').trim() || 'Thailand';

      // Resolve artistId
      let artistId = artistNameMap.get(artistName.toLowerCase());
      if (!artistId) {
        artistId = `artist-${now}-${i}-${Math.random().toString(36).substring(2, 6)}`;

        let candidateEmail = (row.artistEmail || '').trim();
        if (!candidateEmail || existingEmails.has(candidateEmail.toLowerCase())) {
          candidateEmail = `${artistName.toLowerCase().replace(/[^a-z0-9]+/g, '.') || 'artist'}.${now}.${i}@artvara-artists.com`;
        }
        existingEmails.add(candidateEmail.toLowerCase());

        newArtistsToInsert.push({
          id: artistId,
          name: artistName,
          email: candidateEmail,
          role: 'artist',
          country: artistCountry,
          flagEmoji: getCountryFlagEmoji(artistCountry),
          bio: artistName !== 'ศิลปินร่วมแสดง' ? `ศิลปินผู้สร้างสรรค์ผลงานศิลปกรรม` : null,
          avatarUrl: null,
          socialLinks: null,
        });

        artistNameMap.set(artistName.toLowerCase(), artistId);
      }

      const newArtId = `art-${now}-${i}`;
      const cleanPublicId = `artvara/batch-${newArtId}`;
      const yearCreated = row.yearCreated ? parseInt(String(row.yearCreated), 10) || null : 2026;
      const medium = (row.medium || '').trim() || 'Mixed Media';
      const dimensions = (row.dimensions || '').trim() || '100 x 100 cm.';
      const concept = (row.concept || '').trim() || null;
      const imageUrl = (row.imageUrl || '').trim() || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop';

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
        price: 0,
        status: 'available',
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

      importedArtworks.push({ id: newArtId, title });
    }

    // 4. BATCH INSERTS IN CHUNKS OF 50 (Blazing Fast & Stays well below Worker limits)
    const CHUNK_SIZE = 50;

    // 4.1 Insert Artists
    for (let i = 0; i < newArtistsToInsert.length; i += CHUNK_SIZE) {
      const chunk = newArtistsToInsert.slice(i, i + CHUNK_SIZE);
      await db.insert(schema.users).values(chunk);
    }

    // 4.2 Insert Artworks
    for (let i = 0; i < newArtworksToInsert.length; i += CHUNK_SIZE) {
      const chunk = newArtworksToInsert.slice(i, i + CHUNK_SIZE);
      await db.insert(schema.artworks).values(chunk);
    }

    // 4.3 Insert Exhibition Links
    for (let i = 0; i < newLinksToInsert.length; i += CHUNK_SIZE) {
      const chunk = newLinksToInsert.slice(i, i + CHUNK_SIZE);
      await db.insert(schema.exhibitionArtworks).values(chunk);
    }

    return NextResponse.json({
      success: true,
      count: importedArtworks.length,
      importedArtworks,
      newArtistsCount: newArtistsToInsert.length,
    });
  } catch (error) {
    console.error('Error batch importing artworks:', error);
    return NextResponse.json({ error: 'Failed to batch import artworks', details: String(error) }, { status: 500 });
  }
}

