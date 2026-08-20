import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToStream } from '@react-pdf/renderer';
import { getExhibitionBySlug } from '@/lib/data';
import { ExhibitionCatalogPDF } from '@/components/catalog/ExhibitionCatalogPDF';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug || 'the-golden-age-of-ayutthaya';
    const exhibition = await getExhibitionBySlug(slug);

    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }

    // Render React-PDF stream
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfStream = await renderToStream(
      React.createElement(ExhibitionCatalogPDF, { exhibition }) as any
    );

    // Convert stream to Buffer for Next.js response
    const chunks: Buffer[] = [];
    return new Promise<NextResponse>((resolve, reject) => {
      pdfStream.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfStream.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        const response = new NextResponse(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${slug}-catalog.pdf"`,
            'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
          },
        });
        resolve(response);
      });
      pdfStream.on('error', (err) => {
        console.error('PDF Generation stream error:', err);
        reject(NextResponse.json({ error: 'Failed to render PDF' }, { status: 500 }));
      });
    });
  } catch (error) {
    console.error('PDF API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
