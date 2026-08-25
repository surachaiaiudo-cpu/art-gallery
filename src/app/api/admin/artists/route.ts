export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, inArray } from 'drizzle-orm';
import { getAllArtistsWithStats } from '@/lib/data';

export const dynamic = 'force-dynamic';

// Helper: Delete file from ImageKit
async function deleteFromImageKit(imageUrl: string, privateKey?: string) {
  if (!privateKey || !imageUrl || !imageUrl.includes('ik.imagekit.io')) return;
  try {
    const authHeader = `Basic ${btoa(`${privateKey}:`)}`;
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

// POST: Create a new artist (or update if email exists)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, country, flagEmoji, bio, avatarUrl, socialLinks } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Artist Name is required' }, { status: 400 });
    }

    let cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || `artist${Date.now()}`;
      cleanEmail = `${slug}@artvara.gallery`;
    }

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

    // Check if artist with this email already exists
    const existing = await db.select().from(schema.users).where(eq(schema.users.email, cleanEmail)).limit(1);
    if (existing.length > 0) {
      const targetId = existing[0].id;
      await db
        .update(schema.users)
        .set({
          name: name.trim(),
          country: country ? country.trim() : existing[0].country,
          flagEmoji: flag || existing[0].flagEmoji,
          bio: bio !== undefined ? bio.trim() : existing[0].bio,
          avatarUrl: avatarUrl || existing[0].avatarUrl,
          socialLinks: typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks || {}),
        })
        .where(eq(schema.users.id, targetId));
      return NextResponse.json({ success: true, id: targetId, updated: true });
    }

    const newId = `artist-${Date.now()}`;

    await db.insert(schema.users).values({
      id: newId,
      name: name.trim(),
      email: cleanEmail,
      role: 'artist',
      country: country ? country.trim() : 'Thailand',
      flagEmoji: flag,
      bio: bio ? bio.trim() : '',
      avatarUrl: avatarUrl || '',
      socialLinks: typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks || {}),
    });

    return NextResponse.json({ success: true, id: newId });
  } catch (error) {
    console.error('Error creating artist:', error);
    return NextResponse.json({ error: 'Failed to create artist', details: String(error) }, { status: 500 });
  }
}

// PUT: Update artist details (with seamless auto-merge on email collision)
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

    let finalEmail = email !== undefined ? email.trim().toLowerCase() : existing[0].email;
    if (!finalEmail || !finalEmail.includes('@')) {
      finalEmail = existing[0].email || `${(name || existing[0].name).toLowerCase().replace(/[^a-z0-9]/g, '')}@artvara.gallery`;
    }

    // Check if the new email belongs to ANOTHER existing artist -> Auto Merge!
    if (finalEmail !== existing[0].email) {
      const emailConflict = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, finalEmail))
        .limit(1);

      if (emailConflict.length > 0 && emailConflict[0].id !== id) {
        const targetArtist = emailConflict[0];

        // 1. Re-link all artworks from current artist to target artist
        await db
          .update(schema.artworks)
          .set({ artistId: targetArtist.id })
          .where(eq(schema.artworks.artistId, id));

        // 2. Update target artist with any new information provided
        const targetUpdate: any = {};
        if (name && (!targetArtist.name || targetArtist.name.length < name.length)) targetUpdate.name = name.trim();
        if (country) targetUpdate.country = country.trim();
        if (flagEmoji) targetUpdate.flagEmoji = flagEmoji;
        if (bio) targetUpdate.bio = bio.trim();
        if (avatarUrl) targetUpdate.avatarUrl = avatarUrl;
        if (socialLinks) targetUpdate.socialLinks = typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks);

        if (Object.keys(targetUpdate).length > 0) {
          await db
            .update(schema.users)
            .set(targetUpdate)
            .where(eq(schema.users.id, targetArtist.id));
        }

        // 3. Delete the duplicate artist record cleanly
        await db.delete(schema.users).where(eq(schema.users.id, id));

        return NextResponse.json({
          success: true,
          merged: true,
          message: 'อีเมลซ้ำกับศิลปินที่มีอยู่ ระบบได้ทำการผสานรวมผลงานและข้อมูลเข้าด้วยกันเรียบร้อยแล้ว',
        });
      }
    }

    // Normal update
    await db
      .update(schema.users)
      .set({
        name: name !== undefined ? name.trim() : existing[0].name,
        email: finalEmail,
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
    return NextResponse.json({ error: 'Failed to update artist', details: String(error) }, { status: 500 });
  }
}

// DELETE: Delete artist(s) only (keep artworks intact independently)
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryId = searchParams.get('id');
    const queryIds = searchParams.get('ids');

    let targetIds: string[] = [];

    if (queryId) {
      targetIds.push(queryId);
    } else if (queryIds) {
      targetIds = queryIds.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      try {
        const body = await req.json();
        if (body.ids && Array.isArray(body.ids)) {
          targetIds = body.ids;
        } else if (body.id) {
          targetIds = [body.id];
        }
      } catch {}
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'Artist ID or IDs are required' }, { status: 400 });
    }

    // Delete artist profiles from users table only (do not delete artworks)
    const CHUNK_SIZE = 50;
    for (let i = 0; i < targetIds.length; i += CHUNK_SIZE) {
      const chunk = targetIds.slice(i, i + CHUNK_SIZE);
      await db.delete(schema.users).where(inArray(schema.users.id, chunk));
    }

    return NextResponse.json({
      success: true,
      deletedArtistsCount: targetIds.length,
    });
  } catch (error) {
    console.error('Error deleting artist(s):', error);
    return NextResponse.json({ error: 'Failed to delete artist(s)', details: String(error) }, { status: 500 });
  }
}
