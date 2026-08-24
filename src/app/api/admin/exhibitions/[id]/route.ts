import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, or } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

// GET: Fetch a single exhibition by id or slug
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const rows = await db
      .select()
      .from(schema.exhibitions)
      .where(or(eq(schema.exhibitions.id, id), eq(schema.exhibitions.slug, id)))
      .limit(1);

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }

    return NextResponse.json({ exhibition: rows[0] });
  } catch (error: any) {
    console.error('Error fetching exhibition:', error);
    return NextResponse.json({ error: 'Failed to fetch exhibition', details: error?.message }, { status: 500 });
  }
}

// PUT: Update exhibition details, themeConfig, roomShapes, etc.
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;
    const body = await req.json();

    const existing = await db
      .select()
      .from(schema.exhibitions)
      .where(or(eq(schema.exhibitions.id, targetId), eq(schema.exhibitions.slug, targetId)))
      .limit(1);

    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: 'Exhibition not found' }, { status: 404 });
    }

    const currentExh = existing[0];

    let mergedTheme: any = {};
    try {
      mergedTheme = currentExh.themeConfig ? JSON.parse(currentExh.themeConfig) : {};
    } catch {}

    // If body contains direct themeConfig string or object
    if (body.themeConfig) {
      try {
        const parsedIncoming = typeof body.themeConfig === 'string' ? JSON.parse(body.themeConfig) : body.themeConfig;
        mergedTheme = { ...mergedTheme, ...parsedIncoming };
      } catch (e) {
        console.warn('Could not parse incoming themeConfig:', e);
      }
    }

    // Direct roomShapes or lightPreset overrides
    if (body.roomShapes && Array.isArray(body.roomShapes)) {
      mergedTheme.roomShapes = body.roomShapes;
    }
    if (body.lightPreset) {
      mergedTheme.lightPreset = body.lightPreset;
    }
    if (body.ceilingHeight) {
      mergedTheme.ceilingHeight = body.ceilingHeight;
    }
    if (body.spotlightIntensity) {
      mergedTheme.spotlightIntensity = body.spotlightIntensity;
    }
    if (body.enable3D !== undefined) {
      mergedTheme.enable3D = Boolean(body.enable3D);
    }

    const finalThemeConfigStr = JSON.stringify(mergedTheme);

    await db
      .update(schema.exhibitions)
      .set({
        title: body.title !== undefined ? body.title : currentExh.title,
        curatorNote: body.curatorNote !== undefined ? body.curatorNote : currentExh.curatorNote,
        bannerUrl: body.bannerUrl !== undefined ? body.bannerUrl : currentExh.bannerUrl,
        startDate: body.startDate !== undefined ? body.startDate : currentExh.startDate,
        endDate: body.endDate !== undefined ? body.endDate : currentExh.endDate,
        status: body.status !== undefined ? body.status : currentExh.status,
        themeConfig: finalThemeConfigStr,
      })
      .where(eq(schema.exhibitions.id, currentExh.id));

    return NextResponse.json({
      success: true,
      id: currentExh.id,
      themeConfig: mergedTheme,
    });
  } catch (error: any) {
    console.error('Error updating exhibition:', error);
    return NextResponse.json(
      { error: 'Failed to update exhibition', details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
