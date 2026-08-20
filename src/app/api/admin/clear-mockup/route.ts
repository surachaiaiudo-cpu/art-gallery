export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema, getD1Binding } from '@/db';

export const dynamic = 'force-dynamic';

async function performClear() {
  const binding = getD1Binding();

  if (binding && typeof binding.prepare === 'function') {
    // Direct Cloudflare D1 batch deletion
    await binding.prepare('DELETE FROM inquiries').run();
    await binding.prepare('DELETE FROM exhibition_artworks').run();
    await binding.prepare('DELETE FROM artworks').run();
    await binding.prepare('DELETE FROM exhibitions').run();
    await binding.prepare('DELETE FROM users').run();
  } else {
    // Drizzle proxy deletion
    await db.delete(schema.inquiries);
    await db.delete(schema.exhibitionArtworks);
    await db.delete(schema.artworks);
    await db.delete(schema.exhibitions);
    await db.delete(schema.users);
  }
}

export async function POST(req: NextRequest) {
  try {
    await performClear();

    return NextResponse.json({
      success: true,
      message: 'All mockup data and database records have been completely wiped.',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error clearing database mockup data:', error);
    return NextResponse.json(
      { error: 'Failed to clear database', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
