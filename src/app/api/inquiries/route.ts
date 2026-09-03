export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { createInquiry } from '@/lib/data';

export const dynamic = 'force-dynamic';

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

