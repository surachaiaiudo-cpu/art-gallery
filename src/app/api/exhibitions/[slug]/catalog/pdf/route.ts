export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getExhibitionBySlug } from '@/lib/data';

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

    const standardParam = req.nextUrl.searchParams.get('standard') || 'standard';

    // Redirect to the catalog page with export parameter so the client-side Vector PDF engine executes cleanly on Cloudflare Pages
    const catalogUrl = new URL(`/catalog/${encodeURIComponent(slug)}?export=${standardParam}`, req.url);
    return NextResponse.redirect(catalogUrl);
  } catch (err) {
    console.error('Error in PDF route:', err);
    return NextResponse.json({ error: 'Failed to process PDF request' }, { status: 500 });
  }
}
