import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Helper: Edge-compatible Base64 encoder
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const customFileName = (formData.get('fileName') as string) || '';
    const targetFolder = (formData.get('folder') as string) || '/artvara-artworks';

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

    // 1. ImageKit.io Upload (1st Priority)
    const symbol = Symbol.for('__cloudflare-request-context__');
    const ctx = (globalThis as any)[symbol];
    const imageKitPrivateKey =
      ctx?.env?.IMAGEKIT_PRIVATE_KEY ||
      ctx?.env?.IMAGEKIT_KEY ||
      process.env.IMAGEKIT_PRIVATE_KEY ||
      process.env.IMAGEKIT_KEY;

    if (imageKitPrivateKey) {
      try {
        const ikFormData = new FormData();
        const base64File = arrayBufferToBase64(arrayBuffer);
        ikFormData.append('file', `data:${file.type || 'image/jpeg'};base64,${base64File}`);
        ikFormData.append('fileName', finalFileName);
        ikFormData.append('folder', targetFolder);
        ikFormData.append('useUniqueFileName', 'true');

        const authHeader = `Basic ${btoa(`${imageKitPrivateKey}:`)}`;

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
    const base64Data = arrayBufferToBase64(arrayBuffer);
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUrl,
      fileName: finalFileName,
      provider: 'base64-inline',
    });
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json({ error: 'Upload Failed', details: String(error) }, { status: 500 });
  }
}

// DELETE: Delete image from ImageKit
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');
    const fileId = searchParams.get('fileId');

    const symbol = Symbol.for('__cloudflare-request-context__');
    const ctx = (globalThis as any)[symbol];
    const privateKey =
      ctx?.env?.IMAGEKIT_PRIVATE_KEY ||
      ctx?.env?.IMAGEKIT_KEY ||
      process.env.IMAGEKIT_PRIVATE_KEY ||
      process.env.IMAGEKIT_KEY;

    if (!privateKey) {
      return NextResponse.json({ error: 'ImageKit private key not configured' }, { status: 400 });
    }

    const authHeader = `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`;

    if (fileId) {
      await fetch(`https://api.imagekit.io/v1/files/${fileId}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      });
      return NextResponse.json({ success: true, deletedFileId: fileId });
    }

    if (imageUrl && imageUrl.includes('ik.imagekit.io')) {
      const parts = imageUrl.split('?')[0].split('/');
      const filename = parts[parts.length - 1];

      const searchRes = await fetch(`https://api.imagekit.io/v1/files?name=${encodeURIComponent(filename)}`, {
        headers: { Authorization: authHeader },
      });

      if (searchRes.ok) {
        const files = await searchRes.json();
        if (Array.isArray(files) && files.length > 0) {
          const targetId = files[0].fileId;
          await fetch(`https://api.imagekit.io/v1/files/${targetId}`, {
            method: 'DELETE',
            headers: { Authorization: authHeader },
          });
          return NextResponse.json({ success: true, deletedFileId: targetId });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('ImageKit delete API error:', error);
    return NextResponse.json({ error: 'Failed to delete from ImageKit' }, { status: 500 });
  }
}
