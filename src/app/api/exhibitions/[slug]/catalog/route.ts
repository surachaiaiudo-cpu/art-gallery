export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!slug) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  const url = new URL(`/catalog/${slug}`, req.url);
  return NextResponse.redirect(url);
}
