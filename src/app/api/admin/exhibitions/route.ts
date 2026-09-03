export const runtime = 'edge';
import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, desc } from 'drizzle-orm';
import { getAllExhibitions, invalidateDataCache } from '@/lib/data';

export const dynamic = 'force-dynamic';

async function deleteFromImageKit(imageUrl: string, privateKey?: string) {
  if (!privateKey || !imageUrl || !imageUrl.includes('ik.imagekit.io')) return;
  try {
    const cleanUrl = imageUrl.split('?')[0];
    const parts = cleanUrl.split('/');
    const fileName = parts[parts.length - 1];
    if (!fileName) return;

    const listRes = await fetch(
      `https://api.imagekit.io/v1/files?name=${encodeURIComponent(fileName)}&limit=1`,
      {
        headers: {
          Authorization: `Basic ${btoa(privateKey + ':')}`,
        },
      }
    );

    if (listRes.ok) {
      const files: any = await listRes.json();
      if (Array.isArray(files) && files.length > 0 && files[0].fileId) {
        await fetch(`https://api.imagekit.io/v1/files/${files[0].fileId}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Basic ${btoa(privateKey + ':')}`,
          },
        });
      }
    }
  } catch (err) {
    console.error('Error deleting exhibition banner from ImageKit:', err);
  }
}

// GET: List all exhibitions with full relations
export async function GET() {
  try {
    const list = await getAllExhibitions();
    return NextResponse.json({ exhibitions: list });
  } catch (error) {
    console.error('Error fetching exhibitions:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibitions' }, { status: 500 });
  }
}

// POST: Create a new exhibition
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      slug,
      curatorNote,
      bannerUrl,
      startDate,
      endDate,
      status,
      roomSize,
      enable3D,
      catalogFooterText,
      catalogPlateFooterText,
      peerReviewers,
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Exhibition title is required' }, { status: 400 });
    }

    const newId = `exh-${Date.now()}`;
    let cleanSlug = (slug || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!cleanSlug) {
      const titleAscii = (title || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      cleanSlug = titleAscii || `exhibition-${Date.now().toString(36)}`;
    }

    // Ensure unique slug in database
    const existing = await db
      .select()
      .from(schema.exhibitions)
      .where(eq(schema.exhibitions.slug, cleanSlug))
      .limit(1);

    if (existing.length > 0) {
      cleanSlug = `${cleanSlug}-${Date.now().toString(36)}`;
    }

    const themeConfig = JSON.stringify({
      roomSize: roomSize || 'medium',
      enable3D: enable3D !== undefined ? Boolean(enable3D) : true,
      catalogFooterText: catalogFooterText || '',
      catalogPlateFooterText: catalogPlateFooterText || '',
      peerReviewers: Array.isArray(peerReviewers) ? peerReviewers : [],
      wallTexture: 'concrete-smooth',
      wallColor: '#2B1E16',
      floorColor: '#E6E0D4',
      spotlightIntensity: 1.8,
    });

    await db.insert(schema.exhibitions).values({
      id: newId,
      title: title.trim(),
      slug: cleanSlug,
      curatorNote: curatorNote || '',
      bannerUrl: bannerUrl || '',
      catalogPdfUrl: `/api/exhibitions/${cleanSlug}/catalog`,
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate: endDate || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      status: (status === 'active' || status === 'archived' || status === 'upcoming') ? status : 'active',
      themeConfig,
    });

    invalidateDataCache();
    return NextResponse.json({ success: true, id: newId, slug: cleanSlug });
  } catch (error) {
    console.error('Error creating exhibition:', error);
    return NextResponse.json({ error: 'Failed to create exhibition', details: String(error) }, { status: 500 });
  }
}

// PUT: Update exhibition details or toggle status
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, curatorNote, bannerUrl, startDate, endDate, status, roomSize, enable3D, catalogFooterText, catalogPlateFooterText, peerReviewers } = body;

    if (!id) {
      return NextResponse.json({ error: 'Exhibition ID is required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(schema.exhibitions)
      .where(eq(schema.exhibitions.id, id))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }

    let updatedTheme: any = {};
    try {
      updatedTheme = existing[0].themeConfig ? JSON.parse(existing[0].themeConfig) : {};
    } catch {}

    if (body.themeConfig) {
      try {
        const parsedIncoming = typeof body.themeConfig === 'string' ? JSON.parse(body.themeConfig) : body.themeConfig;
        updatedTheme = { ...updatedTheme, ...parsedIncoming };
      } catch {}
    }

    if (body.roomShapes && Array.isArray(body.roomShapes)) {
      updatedTheme.roomShapes = body.roomShapes;
    }
    if (body.lightPreset) {
      updatedTheme.lightPreset = body.lightPreset;
    }
    if (roomSize) {
      updatedTheme.roomSize = roomSize;
    }
    if (enable3D !== undefined) {
      updatedTheme.enable3D = Boolean(enable3D);
    }
    if (catalogFooterText !== undefined) {
      updatedTheme.catalogFooterText = catalogFooterText;
    }
    if (catalogPlateFooterText !== undefined) {
      updatedTheme.catalogPlateFooterText = catalogPlateFooterText;
    }
    if (body.footerGraphicType !== undefined) {
      updatedTheme.footerGraphicType = body.footerGraphicType;
    }
    if (body.customFooterImageUrl !== undefined) {
      updatedTheme.customFooterImageUrl = body.customFooterImageUrl;
    }
    if (peerReviewers !== undefined) {
      updatedTheme.peerReviewers = Array.isArray(peerReviewers) ? peerReviewers : [];
    }

    const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (
      bannerUrl !== undefined &&
      existing[0].bannerUrl &&
      existing[0].bannerUrl !== bannerUrl &&
      imageKitPrivateKey
    ) {
      await deleteFromImageKit(existing[0].bannerUrl, imageKitPrivateKey);
    }

    await db
      .update(schema.exhibitions)
      .set({
        title: title !== undefined ? title : existing[0].title,
        curatorNote: curatorNote !== undefined ? curatorNote : existing[0].curatorNote,
        bannerUrl: bannerUrl !== undefined ? bannerUrl : existing[0].bannerUrl,
        startDate: startDate !== undefined ? startDate : existing[0].startDate,
        endDate: endDate !== undefined ? endDate : existing[0].endDate,
        status: status !== undefined ? status : existing[0].status,
        themeConfig: JSON.stringify(updatedTheme),
      })
      .where(eq(schema.exhibitions.id, id));

    invalidateDataCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating exhibition:', error);
    return NextResponse.json({ error: 'Failed to update exhibition' }, { status: 500 });
  }
}

// DELETE: Delete an exhibition
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Exhibition ID is required' }, { status: 400 });
    }

    const existing = await db
      .select()
      .from(schema.exhibitions)
      .where(eq(schema.exhibitions.id, id))
      .limit(1);

    const imageKitPrivateKey = process.env.IMAGEKIT_PRIVATE_KEY;
    if (existing.length > 0 && existing[0].bannerUrl && imageKitPrivateKey) {
      await deleteFromImageKit(existing[0].bannerUrl, imageKitPrivateKey);
    }

    // Explicitly delete dependent records to prevent orphaned records in D1/SQLite
    await db.delete(schema.guestbookEntries).where(eq(schema.guestbookEntries.exhibitionId, id));
    await db.delete(schema.exhibitionArtworks).where(eq(schema.exhibitionArtworks.exhibitionId, id));
    await db.delete(schema.exhibitions).where(eq(schema.exhibitions.id, id));

    invalidateDataCache();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting exhibition:', error);
    return NextResponse.json({ error: 'Failed to delete exhibition' }, { status: 500 });
  }
}
