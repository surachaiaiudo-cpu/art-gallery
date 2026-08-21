export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { getAllArtworks } from '@/lib/data';

export const dynamic = 'force-dynamic';

// GET: List all artworks
export async function GET() {
  try {
    const list = await getAllArtworks();
    return NextResponse.json({ artworks: list });
  } catch (error) {
    console.error('Error fetching artworks:', error);
    return NextResponse.json({ error: 'Failed to fetch artworks' }, { status: 500 });
  }
}

// POST: Create a new artwork
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      artistId,
      artistName,
      medium,
      dimensions,
      yearCreated,
      concept,
      description,
      imageUrl,
      price = 0,
      status = 'available',
      exhibitionId, // optional: link directly to an exhibition
    } = body;

    if (!title || !imageUrl) {
      return NextResponse.json({ error: 'Artwork title and Image URL are required' }, { status: 400 });
    }

    let finalArtistId = artistId;
    if (!finalArtistId && artistName) {
      const existingArtist = await db.select().from(schema.users).where(eq(schema.users.name, artistName)).limit(1);
      if (existingArtist.length > 0) {
        finalArtistId = existingArtist[0].id;
      } else {
        const newArtistId = `artist-${Date.now()}`;
        await db.insert(schema.users).values({
          id: newArtistId,
          name: artistName,
          email: `${artistName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@artvara.gallery`,
          role: 'artist',
          country: 'Thailand',
          flagEmoji: '🇹🇭',
          avatarUrl: '',
          bio: 'Featured artist in ARTVARA Gallery collection.',
        });
        finalArtistId = newArtistId;
      }
    }
    if (!finalArtistId) finalArtistId = 'artist-1';

    const newArtId = `art-${Date.now()}`;
    const cleanPublicId = `artvara/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    await db.insert(schema.artworks).values({
      id: newArtId,
      artistId: finalArtistId,
      title,
      description: description || concept || '',
      concept: concept || description || '',
      yearCreated: yearCreated ? parseInt(String(yearCreated)) : 2026,
      medium: medium || 'Oil on Canvas',
      dimensions: dimensions || '120 x 100 cm.',
      cloudinaryPublicId: cleanPublicId,
      imageUrl,
      price: price ? parseFloat(String(price)) : 0,
      status: status || 'available',
    });

    // If exhibitionId provided, link it to the exhibition
    if (exhibitionId) {
      await db.insert(schema.exhibitionArtworks).values({
        exhibitionId,
        artworkId: newArtId,
        displayOrder: 99,
        wallPosition: JSON.stringify({
          x: 0,
          y: 2.0,
          z: -6.85,
          rotationY: 0,
          wallIndex: 0,
          scale: 1,
        }),
      });
    }

    return NextResponse.json({ success: true, id: newArtId });
  } catch (error) {
    console.error('Error creating artwork:', error);
    return NextResponse.json({ error: 'Failed to create artwork', details: String(error) }, { status: 500 });
  }
}

// PUT: Update artwork details
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, artistId, artistName, medium, dimensions, yearCreated, concept, description, imageUrl, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Artwork ID is required' }, { status: 400 });
    }

    const existing = await db.select().from(schema.artworks).where(eq(schema.artworks.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Artwork not found' }, { status: 404 });
    }

    let finalArtistId = artistId;
    if (!finalArtistId && artistName) {
      const existingArtist = await db.select().from(schema.users).where(eq(schema.users.name, artistName)).limit(1);
      if (existingArtist.length > 0) {
        finalArtistId = existingArtist[0].id;
      }
    }

    const updateFields: any = {
      title,
      medium,
      dimensions,
      yearCreated: yearCreated ? parseInt(String(yearCreated)) : undefined,
      concept: concept || description,
      description: description || concept,
      imageUrl,
      status,
    };

    if (finalArtistId) {
      updateFields.artistId = finalArtistId;
    }

    await db
      .update(schema.artworks)
      .set(updateFields)
      .where(eq(schema.artworks.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating artwork:', error);
    return NextResponse.json({ error: 'Failed to update artwork' }, { status: 500 });
  }
}

// Helper: Delete file from ImageKit
async function deleteFromImageKit(imageUrl: string, privateKey?: string) {
  if (!privateKey || !imageUrl || !imageUrl.includes('ik.imagekit.io')) return;
  try {
    const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;
    const parts = imageUrl.split('?')[0].split('/');
    const filename = parts[parts.length - 1];

    const searchRes = await fetch(`https://api.imagekit.io/v1/files?name=${encodeURIComponent(filename)}`, {
      headers: { Authorization: authHeader },
    });

    if (searchRes.ok) {
      const files = await searchRes.json();
      if (Array.isArray(files) && files.length > 0) {
        const fileId = files[0].fileId;
        await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
          method: 'DELETE',
          headers: { Authorization: authHeader },
        });
        console.log('Deleted from ImageKit:', fileId, filename);
      }
    }
  } catch (err) {
    console.warn('ImageKit delete error:', err);
  }
}

// DELETE: Delete artwork
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Artwork ID is required' }, { status: 400 });
    }

    // 1. Fetch artwork details to get imageUrl
    const existing = await db
      .select()
      .from(schema.artworks)
      .where(eq(schema.artworks.id, id))
      .limit(1);

    if (existing.length > 0 && existing[0].imageUrl) {
      const symbol = Symbol.for('__cloudflare-request-context__');
      const ctx = (globalThis as any)[symbol];
      const imageKitPrivateKey =
        ctx?.env?.IMAGEKIT_PRIVATE_KEY ||
        ctx?.env?.IMAGEKIT_KEY ||
        process.env.IMAGEKIT_PRIVATE_KEY ||
        process.env.IMAGEKIT_KEY;

      await deleteFromImageKit(existing[0].imageUrl, imageKitPrivateKey);
    }

    // 2. Delete artwork from D1 database
    await db.delete(schema.artworks).where(eq(schema.artworks.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting artwork:', error);
    return NextResponse.json({ error: 'Failed to delete artwork' }, { status: 500 });
  }
}

