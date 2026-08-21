import { NextRequest, NextResponse } from 'next/server';
import { getExhibitionBySlug } from '@/lib/data';
import React from 'react';
import ReactPDF from '@react-pdf/renderer';
import { ExhibitionCatalogPDF } from '@/components/catalog/ExhibitionCatalogPDF';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const exhibition = await getExhibitionBySlug(slug);
    if (!exhibition) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }

    const standardParam = req.nextUrl.searchParams.get('standard');
    const standard = standardParam === 'pdfx' || standardParam === 'pdfx1a' ? 'pdfx' : 'standard';

    // Render 100% Pure Vector PDF on server with embedded TrueType vector fonts
    const pdfStream = await ReactPDF.renderToStream(
      React.createElement(ExhibitionCatalogPDF, {
        exhibition,
        standard,
      }) as any
    );

    // Convert stream to Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of pdfStream as any) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    const cleanSlug = exhibition.slug || 'exhibition';
    const fileName = standard === 'pdfx'
      ? `${cleanSlug}-catalog-PDFX-1a-2001.pdf`
      : `${cleanSlug}-catalog-Standard.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (err) {
    console.error('Error generating vector PDF on server:', err);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
