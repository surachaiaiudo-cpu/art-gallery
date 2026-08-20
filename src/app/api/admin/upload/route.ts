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
    const buffer = Buffer.from(arrayBuffer);
    const originalName = file.name || 'artwork.jpg';
    const extension = originalName.lastIndexOf('.') !== -1 ? originalName.slice(originalName.lastIndexOf('.')) : '.jpg';
    const baseName = originalName.replace(extension, '');
    const cleanBaseName = (customFileName || baseName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const finalFileName = `${cleanBaseName}-${Date.now()}${extension}`;

    // 1. ImageKit.io Upload (1st Priority)
    const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_KEY;
    if (imageKitPrivateKey) {
      try {
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
        } else {
          const errText = await ikRes.text();
          console.warn('ImageKit upload response not ok:', errText);
        }
      } catch (ikErr) {
        console.warn('ImageKit upload error:', ikErr);
      }
    }

    // 2. Fallback: Base64 data URL
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
