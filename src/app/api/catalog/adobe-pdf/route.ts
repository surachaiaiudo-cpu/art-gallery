import { NextRequest, NextResponse } from 'next/server';
import { generateAdobePDF } from '@/lib/adobePdfService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      html,
      pageWidthInches = 8.0,
      pageHeightInches = 8.0,
      filename = 'artvara-catalog-adobe.pdf',
    } = body;

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'Valid HTML content is required' },
        { status: 400 }
      );
    }

    // Call Adobe Document Cloud PDF Services Engine
    const pdfBuffer = await generateAdobePDF({
      html,
      pageWidthInches: Number(pageWidthInches) || 8.0,
      pageHeightInches: Number(pageHeightInches) || 8.0,
    });

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Adobe PDF API route error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate Adobe PDF' },
      { status: 500 }
    );
  }
}