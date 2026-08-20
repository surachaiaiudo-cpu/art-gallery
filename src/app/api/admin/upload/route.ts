import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customFileName = (formData.get('fileName') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const originalName = file.name || 'artwork.jpg';
    const extension = originalName.lastIndexOf('.') !== -1 ? originalName.slice(originalName.lastIndexOf('.')) : '.jpg';
    const baseName = originalName.replace(extension, '');
    const cleanBaseName = (customFileName || baseName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const finalFileName = `${cleanBaseName}-${Date.now()}${extension}`;

    // 1. Check Cloudflare R2 Bucket Binding (First Priority)
    const symbol = Symbol.for('__cloudflare-request-context__');
    const ctx = (globalThis as any)[symbol];
    const bucket = ctx?.env?.BUCKET || (globalThis as any).BUCKET || (process.env as any).BUCKET;

    if (bucket && typeof bucket.put === 'function') {
      try {
        await bucket.put(finalFileName, arrayBuffer, {
          httpMetadata: {
            contentType: file.type || 'image/jpeg',
          },
        });

        // If public R2 domain is configured
        const r2PublicDomain = process.env.NEXT_PUBLIC_R2_DOMAIN;
        const imageUrl = r2PublicDomain
          ? `${r2PublicDomain.replace(/\/$/, '')}/${finalFileName}`
          : `/api/images/${finalFileName}`;

        return NextResponse.json({
          success: true,
          url: imageUrl,
          fileName: finalFileName,
          provider: 'cloudflare-r2',
        });
      } catch (r2Err) {
        console.warn('Cloudflare R2 upload error:', r2Err);
      }
    }

    // 2. Check ImageKit.io Upload (Second Priority)
    const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (imageKitPrivateKey) {
      try {
        const buffer = Buffer.from(arrayBuffer);
        const ikFormData = new FormData();
        const base64File = buffer.toString('base64');
        ikFormData.append('file', `data:${file.type || 'image/jpeg'};base64,${base64File}`);
        ikFormData.append('fileName', finalFileName);
        ikFormData.append('folder', '/artvara-artworks');
        ikFormData.append('useUniqueFileName', 'true');

        const authHeader = `Basic ${Buffer.from(`${imageKitPrivateKey}:`).toString('base64')}`;

        const ikRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
          method: 'POST',
          headers: {
            Authorization: authHeader,
          },
          body: ikFormData,
        });

        if (ikRes.ok) {
          const ikData = await ikRes.json();
          return NextResponse.json({
            success: true,
            url: ikData.url,
            fileId: ikData.fileId,
            name: ikData.name,
            provider: 'imagekit',
          });
        }
      } catch (ikErr) {
        console.warn('ImageKit upload error:', ikErr);
      }
    }

    // 3. Fallback: Base64 data URL
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fileName: finalFileName,
      provider: 'base64-inline',
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
