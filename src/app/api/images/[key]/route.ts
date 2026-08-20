import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { key: string } }
) {
  try {
    const key = params.key;
    if (!key) {
      return new NextResponse('Key required', { status: 400 });
    }

    // Retrieve R2 Bucket binding from Cloudflare Request Context
    const symbol = Symbol.for('__cloudflare-request-context__');
    const ctx = (globalThis as any)[symbol];
    const bucket = ctx?.env?.BUCKET || (globalThis as any).BUCKET || (process.env as any).BUCKET;

    if (!bucket || typeof bucket.get !== 'function') {
      return new NextResponse('R2 Bucket not configured', { status: 503 });
    }

    const object = await bucket.get(key);
    if (!object) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');

    return new NextResponse(object.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('R2 retrieval error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
