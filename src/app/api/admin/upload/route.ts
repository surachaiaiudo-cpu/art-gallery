import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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
    const extension = path.extname(originalName) || '.jpg';
    const cleanBaseName = (customFileName || path.basename(originalName, extension))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const finalFileName = `${cleanBaseName}-${Date.now()}${extension}`;

    const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    // 1. If ImageKit Private Key is provided in environment variables, upload directly to ImageKit.io
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
          const errorText = await ikRes.text();
          console.warn('ImageKit API returned error, falling back to local storage:', errorText);
        }
      } catch (ikErr) {
        console.warn('ImageKit upload error, using local fallback:', ikErr);
      }
    }

    // 2. Fallback: Save to public/uploads directory
    const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    }

    const targetFilePath = path.join(publicUploadsDir, finalFileName);
    fs.writeFileSync(targetFilePath, buffer);

    const publicUrl = `/uploads/${finalFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: finalFileName,
      provider: 'local',
      note: 'ImageKit private key not configured. Uploaded to public/uploads.',
    });
  } catch (error) {
    console.error('Upload handler error:', error);
    return NextResponse.json({ error: 'Failed to upload image', details: String(error) }, { status: 500 });
  }
}
