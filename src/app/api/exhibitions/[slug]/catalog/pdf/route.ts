import { NextRequest, NextResponse } from 'next/server';
import { getExhibitionBySlug } from '@/lib/data';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { ExhibitionCatalogPDF } from '@/components/catalog/ExhibitionCatalogPDF';
import { getCatalogFooterText, getCatalogPlateFooterText, getExhibitionPeerReviewers } from '@/types/exhibition';

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
    const isPdfX = standardParam === 'pdfx' || standardParam === 'pdfx1a';
    const standard = isPdfX ? 'pdfx' : 'standard';

    const cleanSlug = exhibition.slug || 'exhibition';
    const fileName = isPdfX
      ? `${cleanSlug}-catalog-PDFX-1a-2001.pdf`
      : `${cleanSlug}-catalog-Standard.pdf`;

    const coverFooter = getCatalogFooterText(exhibition);
    const plateFooter = getCatalogPlateFooterText(exhibition);
    const reviewers = getExhibitionPeerReviewers(exhibition);

    // Render 100% Vector PDF stream using ReactPDF with embedded Sukhumvit & Maitree fonts
    const pdfElement = React.createElement(ExhibitionCatalogPDF, {
      exhibition,
      coverFooterText: coverFooter,
      plateFooterText: plateFooter,
      peerReviewers: reviewers,
      standard,
    });

    const stream = await renderToStream(pdfElement as any);

    const chunks: Buffer[] = [];
    return new Promise<NextResponse>((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(
          new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${fileName}"`,
              'Content-Length': pdfBuffer.length.toString(),
              'Cache-Control': 'no-store, no-cache, must-revalidate',
            },
          })
        );
      });
      stream.on('error', (err) => {
        console.error('Error streaming Vector PDF:', err);
        reject(NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 }));
      });
    });
  } catch (err) {
    console.error('Error in Vector PDF API Route:', err);
    return NextResponse.json({ error: 'Internal server error generating PDF' }, { status: 500 });
  }
}
