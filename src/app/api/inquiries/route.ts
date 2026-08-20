export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { createInquiry, getAllInquiries } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await getAllInquiries();
    return NextResponse.json({ inquiries: list });
  } catch (error) {
    console.error('Failed to get inquiries:', error);
    return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { artworkId, visitorName, visitorEmail, message } = body;

    if (!artworkId || !visitorName || !visitorEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: artworkId, visitorName, visitorEmail' },
        { status: 400 }
      );
    }

    const inquiry = await createInquiry({
      artworkId,
      visitorName,
      visitorEmail,
      message: message || '',
    });

    return NextResponse.json({ success: true, inquiry }, { status: 201 });
  } catch (error) {
    console.error('Failed to create inquiry:', error);
    return NextResponse.json({ error: 'Failed to create inquiry' }, { status: 500 });
  }
}

