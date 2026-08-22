export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db, schema } from '@/db';
import { eq, or, isNull } from 'drizzle-orm';
import { getCountryFlagEmoji } from '@/components/ui/CountryFlag';
import { getAllArtistsWithStats } from '@/lib/data';

export const dynamic = 'force-dynamic';

const DEFAULT_ARTISTS = [
  {
    id: 'artist-1',
    name: 'Fassih Keiso',
    email: 'fassihkeiso@yahoo.com',
    role: 'artist' as const,
    country: 'Australia',
    flagEmoji: '🇦🇺',
    bio: 'Australian-Syrian interdisciplinary artist examining cultural heritage and contemporary conflicts.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    socialLinks: JSON.stringify({ instagram: '@fassih_keiso_art' }),
  },
  {
    id: 'artist-2',
    name: 'Somchai Jaiyen (สมชาย ใจเย็น)',
    email: 'somchai.jaiyen@artsiam.com',
    role: 'artist' as const,
    country: 'Thailand',
    flagEmoji: '🇹🇭',
    bio: 'Master of atmospheric landscape oil paintings of historical landmarks.',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800&auto=format&fit=crop',
    socialLinks: JSON.stringify({ instagram: '@somchai_oilart' }),
  },
  {
    id: 'artist-3',
    name: 'Sasithol Arivarat (ศศิธร อารีวรัตน์)',
    email: 'sasithol.a@studio.th',
    role: 'artist' as const,
    country: 'Thailand',
    flagEmoji: '🇹🇭',
    bio: 'Contemporary impressionist blending gold leaf with European impasto.',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
    socialLinks: JSON.stringify({ instagram: '@sasithol_art' }),
  },
  {
    id: 'artist-4',
    name: 'Arunee Thammarat (อรุณี ธรรมรัตน์)',
    email: 'artdes@ayutthayarevival.org',
    role: 'artist' as const,
    country: 'France',
    flagEmoji: '🇫🇷',
    bio: 'Portrait artist known for royal court attires with chiaroscuro lighting.',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=800&auto=format&fit=crop',
    socialLinks: JSON.stringify({ instagram: '@artdes_siamelegance' }),
  },
  {
    id: 'artist-5',
    name: 'Sarawathudam (สราวุธ อุดมศิลป์)',
    email: 'sarawathudam@templeart.th',
    role: 'artist' as const,
    country: 'Thailand',
    flagEmoji: '🇹🇭',
    bio: 'Sculptor and mixed-media painter exploring Buddhist philosophy.',
    avatarUrl: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=800&auto=format&fit=crop',
    socialLinks: JSON.stringify({ instagram: '@sarawathudam' }),
  },
  {
    id: 'artist-6',
    name: 'Akhil Namwan (อคิล น้ำหวาน)',
    email: 'akhil.namwan@gallery.th',
    role: 'artist' as const,
    country: 'Thailand',
    flagEmoji: '🇹🇭',
    bio: 'Captures tranquil morning mists shrouding historic stupas.',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=800&auto=format&fit=crop',
    socialLinks: JSON.stringify({ instagram: '@akhil_namwan' }),
  },
  {
    id: 'artist-7',
    name: 'Elena Rossi (เอเลนา รอสซี)',
    email: 'elena.rossi@firenzeart.it',
    role: 'artist' as const,
    country: 'Italy',
    flagEmoji: '🇮🇹',
    bio: 'Italian classical preservation painter exploring ancient stupas.',
    avatarUrl: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?q=80&w=800&auto=format&fit=crop',
    socialLinks: JSON.stringify({ instagram: '@elena_rossi_studio' }),
  },
  {
    id: 'artist-8',
    name: 'Kenji Takahashi (เคนจิ ทาคานาชิ)',
    email: 'kenji.t@tokyoart.jp',
    role: 'artist' as const,
    country: 'Japan',
    flagEmoji: '🇯🇵',
    bio: 'Contemporary Japanese minimalist sculptor and ink painter.',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop',
    socialLinks: JSON.stringify({ instagram: '@kenji_zen_art' }),
  },
];

export async function POST() {
  try {
    let syncedCount = 0;

    // 1. Fetch existing users
    const existingUsers = await db.select().from(schema.users);
    const existingIdSet = new Set(existingUsers.map((u: any) => u.id));
    const existingEmailSet = new Set(existingUsers.map((u: any) => (u.email || '').toLowerCase()));

    // 2. If users table has 0 artists, seed default artists
    const artistCount = existingUsers.filter((u: any) => u.role === 'artist').length;
    if (artistCount === 0) {
      for (const artist of DEFAULT_ARTISTS) {
        if (!existingIdSet.has(artist.id) && !existingEmailSet.has(artist.email.toLowerCase())) {
          await db.insert(schema.users).values({
            ...artist,
            flagEmoji: getCountryFlagEmoji(artist.country),
          });
          existingIdSet.add(artist.id);
          existingEmailSet.add(artist.email.toLowerCase());
          syncedCount++;
        }
      }
    }

    // 3. Scan artworks for any missing artistId
    const allArtworks = await db.select().from(schema.artworks);
    for (let i = 0; i < allArtworks.length; i++) {
      const art = allArtworks[i];
      if (art.artistId && !existingIdSet.has(art.artistId)) {
        const fallbackEmail = `artist-${art.artistId.replace(/[^a-z0-9]+/gi, '.')}-${Date.now()}-${i}@artvara-artists.com`.toLowerCase();
        if (!existingEmailSet.has(fallbackEmail)) {
          await db.insert(schema.users).values({
            id: art.artistId,
            name: art.artistId.startsWith('artist-') ? `ศิลปินเจ้าของผลงาน (${art.title})` : art.artistId,
            email: fallbackEmail,
            role: 'artist',
            country: 'Thailand',
            flagEmoji: '🇹🇭',
            bio: `ศิลปินผู้สร้างสรรค์ผลงาน ${art.title}`,
            avatarUrl: null,
            socialLinks: null,
          });
          existingIdSet.add(art.artistId);
          existingEmailSet.add(fallbackEmail);
          syncedCount++;
        }
      }
    }

    const updatedList = await getAllArtistsWithStats();

    return NextResponse.json({
      success: true,
      syncedCount,
      totalArtists: updatedList.length,
      artists: updatedList,
    });
  } catch (error) {
    console.error('Error syncing artists:', error);
    return NextResponse.json({ error: 'Failed to sync artists', details: String(error) }, { status: 500 });
  }
}
