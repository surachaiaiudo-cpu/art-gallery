export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { getAllArtistsWithStats } from '@/lib/data';

export const dynamic = 'force-dynamic';

// Helper: Delete file from ImageKit
async function deleteFromImageKit(imageUrl: string, privateKey?: string) {
  if (!privateKey || !imageUrl || !imageUrl.includes('ik.imagekit.io')) return;
  try {
    const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;
    const cleanUrl = imageUrl.split('?')[0];
    const parts = cleanUrl.split('/');
    const filename = parts[parts.length - 1];

    const searchRes = await fetch(`https://api.imagekit.io/v1/files?name=${encodeURIComponent(filename)}`, {
      headers: { Authorization: authHeader },
    });

    if (searchRes.ok) {
      const files = await searchRes.json();
      if (Array.isArray(files) && files.length > 0) {
        const matched = files.find((f: any) => f.name === filename) || files[0];
        const fileId = matched.fileId;
        if (fileId) {
          await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
            method: 'DELETE',
            headers: { Authorization: authHeader },
          });
          console.log('Deleted image from ImageKit:', fileId, filename);
        }
      }
    }
  } catch (err) {
    console.warn('ImageKit delete error for artist:', err);
  }
}

// GET: List all artists with stats
export async function GET() {
  try {
    const list = await getAllArtistsWithStats();
    return NextResponse.json({ artists: list });
  } catch (error) {
    console.error('Error fetching artists:', error);
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }
}

// POST: Create a new artist
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, country, flagEmoji, bio, avatarUrl, socialLinks } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Artist Name and Email are required' }, { status: 400 });
    }

    const newId = `artist-${Date.now()}`;

    // Auto flag emoji detection if not provided
    let flag = flagEmoji;
    if (!flag) {
      const cLower = (country || '').toLowerCase();
      if (cLower.includes('thai')) flag = '🇹🇭';
      else if (cLower.includes('japan')) flag = '🇯🇵';
      else if (cLower.includes('ital')) flag = '🇮🇹';
      else if (cLower.includes('france')) flag = '🇫🇷';
      else if (cLower.includes('austr')) flag = '🇦🇺';
      else if (cLower.includes('us') || cLower.includes('america')) flag = '🇺🇸';
      else if (cLower.includes('uk') || cLower.includes('brit')) flag = '🇬🇧';
      else flag = '🌐';
    }

    await db.insert(schema.users).values({
      id: newId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'artist',
      country: country ? country.trim() : 'Thailand',
      flagEmoji: flag,
      bio: bio ? bio.trim() : '',
      avatarUrl:
        avatarUrl ||
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
      socialLinks: typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks || {}),
    });

    return NextResponse.json({ success: true, id: newId });
  } catch (error) {
    console.error('Error creating artist:', error);
    return NextResponse.json({ error: 'Failed to create artist', details: String(error) }, { status: 500 });
  }
}

// PUT: Update artist details
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, country, flagEmoji, bio, avatarUrl, socialLinks } = body;

    if (!id) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
    }

    const existing = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    // Clean up old avatar image from ImageKit if changed
    if (
      avatarUrl &&
      existing[0].avatarUrl &&
      avatarUrl !== existing[0].avatarUrl &&
      existing[0].avatarUrl.includes('ik.imagekit.io')
    ) {
      const symbol = Symbol.for('__cloudflare-request-context__');
      const ctx = (globalThis as any)[symbol];
      const imageKitPrivateKey =
        ctx?.env?.IMAGEKIT_PRIVATE_KEY ||
        ctx?.env?.IMAGEKIT_KEY ||
        process.env.IMAGEKIT_PRIVATE_KEY ||
        process.env.IMAGEKIT_KEY;
      await deleteFromImageKit(existing[0].avatarUrl, imageKitPrivateKey);
    }

    await db
      .update(schema.users)
      .set({
        name: name !== undefined ? name.trim() : existing[0].name,
        email: email !== undefined ? email.trim().toLowerCase() : existing[0].email,
        country: country !== undefined ? country.trim() : existing[0].country,
        flagEmoji: flagEmoji !== undefined ? flagEmoji : existing[0].flagEmoji,
        bio: bio !== undefined ? bio.trim() : existing[0].bio,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : existing[0].avatarUrl,
        socialLinks:
          socialLinks !== undefined
            ? typeof socialLinks === 'string'
              ? socialLinks
              : JSON.stringify(socialLinks)
            : existing[0].socialLinks,
      })
      .where(eq(schema.users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating artist:', error);
    return NextResponse.json({ error: 'Failed to update artist' }, { status: 500 });
  }
}

// DELETE: Delete artist and clean up ImageKit avatar and artwork photos
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Artist ID is required' }, { status: 400 });
    }

    const symbol = Symbol.for('__cloudflare-request-context__');
    const ctx = (globalThis as any)[symbol];
    const imageKitPrivateKey =
      ctx?.env?.IMAGEKIT_PRIVATE_KEY ||
      ctx?.env?.IMAGEKIT_KEY ||
      process.env.IMAGEKIT_PRIVATE_KEY ||
      process.env.IMAGEKIT_KEY;

    // 1. Fetch artist avatarUrl
    const existing = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (existing.length > 0 && existing[0].avatarUrl) {
      await deleteFromImageKit(existing[0].avatarUrl, imageKitPrivateKey);
    }

    // 2. Fetch all artworks by this artist to delete their images from ImageKit
    const artistArtworks = await db
      .select()
      .from(schema.artworks)
      .where(eq(schema.artworks.artistId, id));

    for (const art of artistArtworks) {
      if (art.imageUrl) {
        await deleteFromImageKit(art.imageUrl, imageKitPrivateKey);
      }
    }

    // 3. Delete artist from database (cascades to artworks)
    await db.delete(schema.users).where(eq(schema.users.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting artist:', error);
    return NextResponse.json({ error: 'Failed to delete artist' }, { status: 500 });
  }
}
