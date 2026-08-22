export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

interface BatchArtworkRow {
  title: string;
  artistName?: string;
  artistCountry?: string;
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

    // 1. Fetch existing artists
    const existingArtists = await db.select().from(schema.users).where(eq(schema.users.role, 'artist'));
    const artistNameMap = new Map<string, string>();
    for (const a of existingArtists) {
      artistNameMap.set(a.name.toLowerCase().trim(), a.id);
    }

    const importedArtworks: Array<{ id: string; title: string }> = [];

    // 2. Process each artwork row
    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      if (!row.title && !row.artistName && !row.imageUrl && !row.concept) continue;

      const title = (row.title || '').trim() || (row.artistName ? `ผลงานของ ${(row.artistName).trim()}` : 'ผลงานศิลปกรรม');
      const artistName = (row.artistName || '').trim() || 'ศิลปินร่วมแสดง';
      const artistCountry = (row.artistCountry || '').trim();

      // Find or create artist
      let artistId = artistNameMap.get(artistName.toLowerCase());
      if (!artistId) {
        artistId = `artist-${Date.now()}-${i}`;
        await db.insert(schema.users).values({
          id: artistId,
          name: artistName,
          email: `${artistName.toLowerCase().replace(/[^a-z0-9]+/g, '.') || 'artist'}-${Date.now()}-${i}@artvara-artists.com`,
          role: 'artist',
          country: artistCountry || null,
          flagEmoji: artistCountry.toLowerCase().includes('thai') || artistCountry === 'Thailand' ? '🇹🇭' : (artistCountry ? '🌐' : null),
          bio: artistName !== 'ศิลปินร่วมแสดง' ? `ศิลปินผู้สร้างสรรค์ผลงานศิลปกรรม` : null,
          socialLinks: null,
        });
        artistNameMap.set(artistName.toLowerCase(), artistId);
      }

      const newArtId = `art-${Date.now()}-${i}`;
      const cleanPublicId = `artvara/batch-${newArtId}`;

      const yearCreated = row.yearCreated ? parseInt(String(row.yearCreated), 10) || null : null;
      const medium = (row.medium || '').trim() || null;
      const dimensions = (row.dimensions || '').trim() || null;
      const concept = (row.concept || '').trim() || null;
      const imageUrl = (row.imageUrl || '').trim() || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop';

      // Insert artwork
      await db.insert(schema.artworks).values({
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

      // If exhibitionId provided, link to exhibition with auto-incremented wall index
      if (exhibitionId) {
        const wallIdx = i % 4; // distribute across 4 walls
        await db.insert(schema.exhibitionArtworks).values({
          exhibitionId,
          artworkId: newArtId,
          displayOrder: i + 1,
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

    return NextResponse.json({
      success: true,
      count: importedArtworks.length,
      importedArtworks,
    });
  } catch (error) {
    console.error('Error batch importing artworks:', error);
    return NextResponse.json({ error: 'Failed to batch import artworks', details: String(error) }, { status: 500 });
  }
}

