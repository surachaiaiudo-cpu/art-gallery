export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET: Fetch all guestbook entries for admin moderation
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let targetExhibitionId = params.id;
    const exhRow = await db
      .select({ id: schema.exhibitions.id })
      .from(schema.exhibitions)
      .where(or(eq(schema.exhibitions.id, params.id), eq(schema.exhibitions.slug, params.id)))
      .limit(1);

    if (exhRow && exhRow.length > 0) {
      targetExhibitionId = exhRow[0].id;
    }

    const entries = await db
      .select()
      .from(schema.guestbookEntries)
      .where(eq(schema.guestbookEntries.exhibitionId, targetExhibitionId))
      .orderBy(desc(schema.guestbookEntries.createdAt));

    return NextResponse.json({ entries });
  } catch (error: any) {
    console.error('Error fetching admin guestbook:', error);
    return NextResponse.json({ error: 'Failed to fetch entries', entries: [] }, { status: 500 });
  }
}

// DELETE: Delete a guestbook entry
export async function DELETE(
  req: NextRequest
) {
  try {
    const { searchParams } = new URL(req.url);
    const entryId = searchParams.get('id');

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    await db.delete(schema.guestbookEntries).where(eq(schema.guestbookEntries.id, entryId));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting guestbook entry:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}

// PUT: Toggle approve status
export async function PUT(
  req: NextRequest
) {
  try {
    const body = await req.json();
    const { id, isApproved } = body;

    if (!id) {
      return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
    }

    await db
      .update(schema.guestbookEntries)
      .set({ isApproved: !!isApproved })
      .where(eq(schema.guestbookEntries.id, id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating guestbook entry:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}
