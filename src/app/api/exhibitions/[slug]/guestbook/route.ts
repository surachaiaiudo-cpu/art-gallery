export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, and, desc, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET: Fetch approved guestbook entries for this exhibition
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    let targetExhibitionId = params.slug;
    const exhRow = await db
      .select({ id: schema.exhibitions.id })
      .from(schema.exhibitions)
      .where(or(eq(schema.exhibitions.id, params.slug), eq(schema.exhibitions.slug, params.slug)))
      .limit(1);

    if (exhRow && exhRow.length > 0) {
      targetExhibitionId = exhRow[0].id;
    }

    const entries = await db
      .select()
      .from(schema.guestbookEntries)
      .where(
        and(
          eq(schema.guestbookEntries.exhibitionId, targetExhibitionId),
          eq(schema.guestbookEntries.isApproved, true)
        )
      )
      .orderBy(desc(schema.guestbookEntries.createdAt))
      .limit(50);

    return NextResponse.json({ entries }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Error fetching guestbook:', error);
    return NextResponse.json({ error: 'Failed to fetch guestbook', entries: [] }, { status: 500 });
  }
}

// POST: Add new guestbook entry
export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await req.json();
    const { visitorName, visitorEmail, visitorCountry, message, rating = 5 } = body;

    if (!visitorName || !message) {
      return NextResponse.json({ error: 'Name and message are required' }, { status: 400 });
    }

    let targetExhibitionId = params.slug;
    const exhRow = await db
      .select({ id: schema.exhibitions.id })
      .from(schema.exhibitions)
      .where(or(eq(schema.exhibitions.id, params.slug), eq(schema.exhibitions.slug, params.slug)))
      .limit(1);

    if (exhRow && exhRow.length > 0) {
      targetExhibitionId = exhRow[0].id;
    }

    const newId = `gb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    await db.insert(schema.guestbookEntries).values({
      id: newId,
      exhibitionId: targetExhibitionId,
      visitorName: visitorName.trim(),
      visitorEmail: visitorEmail ? visitorEmail.trim() : null,
      visitorCountry: visitorCountry ? visitorCountry.trim() : 'Thailand',
      message: message.trim(),
      rating: rating ? Math.min(Math.max(parseInt(String(rating)), 1), 5) : 5,
      isApproved: true,
    });

    return NextResponse.json({ success: true, id: newId });
  } catch (error: any) {
    console.error('Error saving guestbook entry:', error);
    return NextResponse.json({ error: 'Failed to save entry', details: error?.message }, { status: 500 });
  }
}
