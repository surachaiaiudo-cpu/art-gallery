export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Delete in reverse foreign key order
    await db.delete(schema.inquiries);
    await db.delete(schema.exhibitionArtworks);
    await db.delete(schema.artworks);
    await db.delete(schema.exhibitions);
    await db.delete(schema.users);

    return NextResponse.json({
      success: true,
      message: 'All mockup data and records have been completely cleared from the database.',
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
