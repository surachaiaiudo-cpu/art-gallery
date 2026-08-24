export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { getAllArtistsWithStats } from '@/lib/data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await getAllArtistsWithStats();
    
    const countryMap = new Map<string, any[]>();
    list.forEach((artist: any) => {
      const country = (artist.country || 'Thailand').trim();
      if (!countryMap.has(country)) {
        countryMap.set(country, []);
      }
      countryMap.get(country)!.push(artist);
    });

    const grouped = Array.from(countryMap.entries())
      .map(([country, items]) => ({
        country,
        count: items.length,
        artists: items,
      }))
      .sort((a, b) => b.count - a.count || a.country.localeCompare(b.country, 'th'));

    return NextResponse.json({
      artists: list,
      groupedByCountry: grouped,
    });
  } catch (error) {
    console.error('Error in /api/artists:', error);
    return NextResponse.json({ error: 'Failed to fetch artists' }, { status: 500 });
  }
}
