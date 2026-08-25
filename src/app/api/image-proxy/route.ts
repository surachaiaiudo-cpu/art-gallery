export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_IMAGE_DOMAINS = [
  'ik.imagekit.io',
  'res.cloudinary.com',
  'images.unsplash.com',
  'upload.wikimedia.org',
  'flagcdn.com',
];

function isAllowedDomain(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    return ALLOWED_IMAGE_DOMAINS.some(
      (domain) => parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  if (!isAllowedDomain(imageUrl)) {
    return NextResponse.json(
      { error: 'Domain not allowed (โดเมนไม่อยู่ในรายการที่อนุญาต)' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!res.ok) {
      // Return a fallback SVG image if remote image 404s
      const fallbackSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
          <rect width="800" height="600" fill="#2C241E"/>
          <rect x="20" y="20" width="760" height="560" fill="none" stroke="#C5A880" stroke-width="8"/>
          <text x="400" y="280" font-family="serif" font-size="32" font-weight="bold" fill="#C5A880" text-anchor="middle">ARTVARA GALLERY</text>
          <text x="400" y="330" font-family="serif" font-size="20" font-style="italic" fill="#E5E0D5" text-anchor="middle">Fine Art Collection</text>
        </svg>
      `;
      return new NextResponse(fallbackSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    const fallbackSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
        <rect width="800" height="600" fill="#2C241E"/>
        <rect x="20" y="20" width="760" height="560" fill="none" stroke="#C5A880" stroke-width="8"/>
        <text x="400" y="280" font-family="serif" font-size="32" font-weight="bold" fill="#C5A880" text-anchor="middle">ARTVARA GALLERY</text>
        <text x="400" y="330" font-family="serif" font-size="20" font-style="italic" fill="#E5E0D5" text-anchor="middle">Fine Art Collection</text>
      </svg>
    `;
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

