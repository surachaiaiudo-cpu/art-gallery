export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq } from 'drizzle-orm';
import { getNameTokens } from '@/lib/artistMatcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  return executePhotoRecovery();
}

export async function POST() {
  return executePhotoRecovery();
}

async function executePhotoRecovery() {
  try {
    const symbol = Symbol.for('__cloudflare-request-context__');
    const ctx = (globalThis as any)[symbol];
    const imageKitPrivateKey =
      ctx?.env?.IMAGEKIT_PRIVATE_KEY ||
      ctx?.env?.IMAGEKIT_KEY ||
      process.env.IMAGEKIT_PRIVATE_KEY ||
      process.env.IMAGEKIT_KEY;

    if (!imageKitPrivateKey) {
      return NextResponse.json({
        error: 'ImageKit private key not configured on server',
        success: false,
      }, { status: 400 });
    }

    const authHeader = `Basic ${Buffer.from(`${imageKitPrivateKey}:`).toString('base64')}`;

    // 1. Fetch files from ImageKit in /artvara-artists folder (and root as fallback)
    let files: any[] = [];

    // Try fetching from /artvara-artists folder
    try {
      const res = await fetch('https://api.imagekit.io/v1/files?path=%2Fartvara-artists&limit=100', {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) files.push(...data);
      }
    } catch (e) {
      console.warn('Error fetching /artvara-artists folder from ImageKit:', e);
    }

    // Also fetch general recent files from ImageKit
    try {
      const res = await fetch('https://api.imagekit.io/v1/files?limit=100&sort=DESC_CREATED', {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const existingIds = new Set(files.map((f: any) => f.fileId));
          for (const item of data) {
            if (!existingIds.has(item.fileId)) {
              files.push(item);
              existingIds.add(item.fileId);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Error fetching all files from ImageKit:', e);
    }

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files found in ImageKit storage',
        recoveredCount: 0,
        recoveredArtists: [],
      });
    }

    // 2. Fetch all artists from DB
    const allUsers = await db.select().from(schema.users);
    const artists = allUsers.filter((u: any) => u.role !== 'curator');

    let recoveredCount = 0;
    const recoveredArtists: Array<{ id: string; name: string; avatarUrl: string; matchedFile: string }> = [];

    const UNSPLASH_PLACEHOLDERS = [
      'unsplash.com/photo-1507003211169',
      'unsplash.com/photo-1534528741775',
    ];

    for (const artist of artists) {
      // Check if artist already has a real custom photo
      const hasRealPhoto =
        artist.avatarUrl &&
        artist.avatarUrl.trim().length > 0 &&
        !UNSPLASH_PLACEHOLDERS.some((p) => artist.avatarUrl.includes(p));

      if (hasRealPhoto) continue;

      const artistTokens = getNameTokens(artist.name);
      if (artistTokens.length === 0) continue;

      // Match against files in ImageKit
      let bestMatch: any = null;
      let highestMatchScore = 0;

      for (const file of files) {
        const cleanFileName = (file.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ');
        const filePath = (file.filePath || '').toLowerCase();

        let score = 0;
        let matchedTokens = 0;

        for (const token of artistTokens) {
          if (cleanFileName.includes(token)) {
            matchedTokens++;
            score += token.length >= 3 ? 2 : 1;
          }
        }

        if (artistTokens.length >= 2 && matchedTokens >= 2) {
          score += 5;
        } else if (artistTokens.length === 1 && matchedTokens === 1 && artistTokens[0].length >= 4) {
          score += 3;
        }

        if (filePath.includes('artvara-artists')) {
          score += 1;
        }

        if (score > highestMatchScore && score >= 3) {
          highestMatchScore = score;
          bestMatch = file;
        }
      }

      if (bestMatch && bestMatch.url) {
        await db
          .update(schema.users)
          .set({ avatarUrl: bestMatch.url })
          .where(eq(schema.users.id, artist.id));

        recoveredCount++;
        recoveredArtists.push({
          id: artist.id,
          name: artist.name,
          avatarUrl: bestMatch.url,
          matchedFile: bestMatch.name,
        });
      }
    }

    return NextResponse.json({
      success: true,
      recoveredCount,
      totalImageKitFilesScanned: files.length,
      recoveredArtists,
    });
  } catch (error) {
    console.error('Error recovering artist photos from ImageKit:', error);
    return NextResponse.json({
      error: 'Failed to recover artist photos',
      details: String(error),
    }, { status: 500 });
  }
}
