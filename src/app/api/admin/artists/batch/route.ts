export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { cleanEmail, cleanText } from '@/lib/utils';

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

    for (let i = 0; i < artists.length; i++) {
      const item: ArtistImportRow = artists[i];
      const cleanName = cleanText(item.name || '');
      const cleanE = cleanEmail(item.email || '');
      const cleanCountry = cleanText(item.country || 'Thailand');

      if (!cleanName || !cleanE) {
        skipped.push(item.name || `Row #${i + 1}`);
        continue;
      }

      // Check if user with this email already exists
      const existing = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.email, cleanE))
        .limit(1);

      if (existing.length > 0) {
        // Update existing artist info
        await db
          .update(schema.users)
          .set({
            name: cleanName,
            country: cleanCountry,
            role: 'artist',
          })
          .where(eq(schema.users.email, cleanE));
        inserted.push(cleanName);
        continue;
      }

      const newId = `artist-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
      let flag = '🌐';
      const cLower = cleanCountry.toLowerCase();
      if (cLower.includes('thai')) flag = '🇹🇭';
      else if (cLower.includes('japan')) flag = '🇯🇵';
      else if (cLower.includes('ital')) flag = '🇮🇹';
      else if (cLower.includes('france')) flag = '🇫🇷';
      else if (cLower.includes('austr')) flag = '🇦🇺';
      else if (cLower.includes('chin')) flag = '🇨🇳';
      else if (cLower.includes('indones')) flag = '🇮🇩';
      else if (cLower.includes('kurd')) flag = '☀️';
      else if (cLower.includes('malay')) flag = '🇲🇾';
      else if (cLower.includes('mexic')) flag = '🇲🇽';
      else if (cLower.includes('singap')) flag = '🇸🇬';
      else if (cLower.includes('taiwan')) flag = '🇹🇼';
      else if (cLower.includes('unit') || cLower.includes('king') || cLower.includes('uk')) flag = '🇬🇧';
      else if (cLower.includes('viet')) flag = '🇻🇳';
      else if (cLower.includes('us') || cLower.includes('america')) flag = '🇺🇸';

      await db.insert(schema.users).values({
        id: newId,
        name: cleanName,
        email: cleanE,
        role: 'artist',
        country: cleanCountry,
        flagEmoji: flag,
        bio: item.bio || '',
        avatarUrl: item.avatarUrl || '',
        socialLinks: JSON.stringify({}),
      });

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
