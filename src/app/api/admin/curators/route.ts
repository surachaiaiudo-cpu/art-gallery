import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { getAllCuratorsWithStats } from '@/lib/data';

export const dynamic = 'force-dynamic';

// GET: List all curators with stats
export async function GET() {
  try {
    const list = await getAllCuratorsWithStats();
    return NextResponse.json({ curators: list });
  } catch (error) {
    console.error('Error fetching curators:', error);
    return NextResponse.json({ error: 'Failed to fetch curators' }, { status: 500 });
  }
}

// POST: Create a new curator
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, country, flagEmoji, bio, avatarUrl, socialLinks } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Curator Name and Email are required' }, { status: 400 });
    }

    const newId = `curator-${Date.now()}`;

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
      role: 'curator',
      country: country ? country.trim() : 'Thailand',
      flagEmoji: flag,
      bio: bio ? bio.trim() : '',
      avatarUrl:
        avatarUrl ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
      socialLinks: typeof socialLinks === 'string' ? socialLinks : JSON.stringify(socialLinks || {}),
    });

    return NextResponse.json({ success: true, id: newId });
  } catch (error) {
    console.error('Error creating curator:', error);
    return NextResponse.json({ error: 'Failed to create curator', details: String(error) }, { status: 500 });
  }
}

// PUT: Update curator details
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, email, country, flagEmoji, bio, avatarUrl, socialLinks } = body;

    if (!id) {
      return NextResponse.json({ error: 'Curator ID is required' }, { status: 400 });
    }

    const existing = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Curator not found' }, { status: 404 });
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
    console.error('Error updating curator:', error);
    return NextResponse.json({ error: 'Failed to update curator', details: String(error) }, { status: 500 });
  }
}

// DELETE: Remove curator
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Curator ID is required' }, { status: 400 });
    }

    await db.delete(schema.users).where(eq(schema.users.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting curator:', error);
    return NextResponse.json({ error: 'Failed to delete curator' }, { status: 500 });
  }
}
