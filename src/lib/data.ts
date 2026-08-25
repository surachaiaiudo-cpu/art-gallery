import { db, schema, hasD1Binding } from '@/db';
import { eq, desc, asc, or, and } from 'drizzle-orm';
import { Exhibition, Artwork, User, Inquiry, WallPosition } from '@/types/exhibition';

// In-Memory Cache with 10s TTL to prevent Worker CPU limit exhaustion
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 10000; // 10 seconds

function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (item && Date.now() < item.expiry) {
    return item.data as T;
  }
  return null;
}

function setCached<T>(key: string, data: T, ttl = CACHE_TTL) {
  cache.set(key, { data, expiry: Date.now() + ttl });
}

export function invalidateDataCache() {
  cache.clear();
}

export async function getExhibitionBySlug(rawSlug: string): Promise<Exhibition | null> {
  const slug = decodeURIComponent(rawSlug || '').trim();
  const cleanSlug = slug.replace(/-+$/, '');
  const cacheKey = `exh_slug_${slug}`;

  const cached = getCached<Exhibition>(cacheKey);
  if (cached) return cached;

  try {
    let rawExhibitions = await db
      .select()
      .from(schema.exhibitions)
      .where(or(eq(schema.exhibitions.slug, slug), eq(schema.exhibitions.slug, cleanSlug), eq(schema.exhibitions.id, slug)))
      .limit(1);

    if ((!rawExhibitions || rawExhibitions.length === 0) && (slug === 'test' || slug === 'default' || slug === 'demo')) {
      rawExhibitions = await db
        .select()
        .from(schema.exhibitions)
        .orderBy(desc(schema.exhibitions.createdAt))
        .limit(1);
    }

    if (!rawExhibitions || rawExhibitions.length === 0) {
      if (slug === 'test' || slug === 'default' || slug === 'demo' || !hasD1Binding()) {
        const mock = generateMockExhibition(slug);
        setCached(cacheKey, mock);
        return mock;
      }
      return null;
    }

    const exh = rawExhibitions[0];

    // Parallel concurrent fetch for artworks and curator
    const [rawLinks, curators] = await Promise.all([
      db
        .select({
          link: schema.exhibitionArtworks,
          art: schema.artworks,
          artist: schema.users,
        })
        .from(schema.exhibitionArtworks)
        .innerJoin(schema.artworks, eq(schema.exhibitionArtworks.artworkId, schema.artworks.id))
        .leftJoin(schema.users, eq(schema.artworks.artistId, schema.users.id))
        .where(eq(schema.exhibitionArtworks.exhibitionId, exh.id))
        .orderBy(asc(schema.exhibitionArtworks.displayOrder)),
      db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, 'curator'))
        .limit(1),
    ]);

    const mainCurator = curators[0] ? (curators[0] as User) : null;

    const artworks: Artwork[] = (rawLinks || []).map((item: any) => {
      let wallPos: WallPosition | null = null;
      if (item.link.wallPosition) {
        try {
          wallPos = JSON.parse(item.link.wallPosition);
        } catch {
          wallPos = null;
        }
      }

      return {
        ...item.art,
        displayOrder: item.link.displayOrder ?? 0,
        wallPosition: wallPos,
        artist: item.artist ? (item.artist as User) : null,
      };
    });

    const artistMap = new Map<string, User>();
    for (const art of artworks) {
      if (art.artist) {
        artistMap.set(art.artist.id, art.artist);
      }
    }

    const result: Exhibition = {
      ...exh,
      artworks,
      curator: mainCurator,
      artists: Array.from(artistMap.values()),
    };

    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching exhibition by slug from DB:', error);
    const mock = generateMockExhibition(slug);
    setCached(cacheKey, mock);
    return mock;
  }
}

function generateMockExhibition(slug: string): Exhibition {
  const titles = [
    'Silent River', 'The Stag', 'Canyon Light', 'Ridge at Dawn', 'Falling Water',
    'Alpine Silence', 'Drifting', 'Ember Field', 'Northern Line', 'Still Morning',
    'Umber Portrait', 'Tide Study No.4', 'Night Bloom', 'Long Shadow', 'Paper Sky',
    'Quiet Machine', 'Salt & Stone', 'Amber Hour', 'Low Tide', 'The Visitor'
  ];
  const artists = [
    { id: 'art-1', name: 'Aruna Devi', email: 'aruna@artvara.th', role: 'artist' as const, country: 'India', flagEmoji: '🇮🇳' },
    { id: 'art-2', name: 'Somchai W.', email: 'somchai@artvara.th', role: 'artist' as const, country: 'Thailand', flagEmoji: '🇹🇭' },
    { id: 'art-3', name: 'Mina Kato', email: 'mina@artvara.th', role: 'artist' as const, country: 'Japan', flagEmoji: '🇯🇵' },
    { id: 'art-4', name: 'Nattapong R.', email: 'nat@artvara.th', role: 'artist' as const, country: 'Thailand', flagEmoji: '🇹🇭' },
    { id: 'art-5', name: 'Elena Voss', email: 'elena@artvara.th', role: 'artist' as const, country: 'Italy', flagEmoji: '🇮🇹' },
    { id: 'art-6', name: 'Kritsana P.', email: 'kritsana@artvara.th', role: 'artist' as const, country: 'Thailand', flagEmoji: '🇹🇭' },
  ];
  const mediums = ['Oil on canvas', 'Acrylic on linen', 'Giclée print', 'Watercolor', 'Mixed media'];

  const artworks: Artwork[] = Array.from({ length: 45 }).map((_, i) => {
    const artist = artists[i % artists.length];
    const title = titles[i % titles.length] + (i >= 20 ? ` Vol.${Math.floor(i / 20) + 1}` : '');
    return {
      id: `art-mock-${i + 1}`,
      artistId: artist.id,
      title,
      description: `ผลงานชิ้นที่ ${i + 1} จากนิทรรศการนี้ «${title}» สำรวจความสัมพันธ์ระหว่างแสงและพื้นที่ว่าง ผ่านมุมมองส่วนตัวของศิลปิน ${artist.name}`,
      concept: 'ความเงียบสงบภายในและการเคลื่อนไหวของธรรมชาติ',
      yearCreated: 2020 + (i % 5),
      medium: mediums[i % mediums.length],
      dimensions: '120 x 80 cm',
      cloudinaryPublicId: `mock_${i + 1}`,
      imageUrl: `https://picsum.photos/seed/gallery${i}/1100/750`,
      price: 25000 + i * 2000,
      status: 'available',
      displayOrder: i,
      artist,
      createdAt: new Date().toISOString(),
    };
  });

  return {
    id: 'exh-test',
    title: 'The Golden Age of Ayutthaya (นิทรรศการเสมือนจริง 3 มิติ)',
    slug: slug || 'test',
    curatorNote: 'นิทรรศการศิลปกรรมเสมือนจริง 3D จำลองสถาปัตยกรรมหอศิลป์ระดับมาตรฐานสากล',
    bannerUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop',
    catalogPdfUrl: '/api/exhibitions/test/catalog',
    startDate: '2026-08-01',
    endDate: '2026-12-31',
    status: 'active',
    themeConfig: JSON.stringify({
      roomShapes: ['RECTANGLE', 'RECTANGLE', 'RECTANGLE'],
      lightPreset: 'warm',
      spotlightIntensity: 1.0,
    }),
    createdAt: new Date().toISOString(),
    artworks,
    artists,
    curator: {
      id: 'curator-1',
      name: 'Ms. Anchalee S. (อัญชลี ศรีกาญจน์)',
      email: 'anchalee.s@artvara.gallery',
      role: 'curator',
      country: 'Thailand',
      flagEmoji: '🇹🇭',
    },
  };
}

export async function getExhibitionById(id: string): Promise<Exhibition | null> {
  try {
    const rawExhibitions = await db
      .select()
      .from(schema.exhibitions)
      .where(or(eq(schema.exhibitions.id, id), eq(schema.exhibitions.slug, id)))
      .limit(1);

    if (rawExhibitions && rawExhibitions.length > 0) {
      return getExhibitionBySlug(rawExhibitions[0].slug);
    }
  } catch (error) {
    console.error('Error fetching exhibition by ID from DB:', error);
  }

  return null;
}

// BATCH-OPTIMIZED: Fetch all exhibitions with all artworks and artists concurrently with caching
export async function getAllExhibitions(): Promise<Exhibition[]> {
  const cacheKey = 'all_exhibitions';
  const cached = getCached<Exhibition[]>(cacheKey);
  if (cached) return cached;

  try {
    const [list, curators, allLinks] = await Promise.all([
      db
        .select()
        .from(schema.exhibitions)
        .orderBy(desc(schema.exhibitions.createdAt)),
      db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, 'curator'))
        .limit(1),
      db
        .select({
          link: schema.exhibitionArtworks,
          art: schema.artworks,
          artist: schema.users,
        })
        .from(schema.exhibitionArtworks)
        .innerJoin(schema.artworks, eq(schema.exhibitionArtworks.artworkId, schema.artworks.id))
        .leftJoin(schema.users, eq(schema.artworks.artistId, schema.users.id))
        .orderBy(asc(schema.exhibitionArtworks.displayOrder)),
    ]);

    if (!list || list.length === 0) return [];

    const mainCurator = curators[0] ? (curators[0] as User) : null;

    // Group artworks by exhibitionId in memory
    const exhibitionArtworksMap = new Map<string, Artwork[]>();
    for (const item of allLinks || []) {
      const exhId = item.link.exhibitionId;
      if (!exhibitionArtworksMap.has(exhId)) {
        exhibitionArtworksMap.set(exhId, []);
      }

      let wallPos: WallPosition | null = null;
      if (item.link.wallPosition) {
        try {
          wallPos = JSON.parse(item.link.wallPosition);
        } catch {
          wallPos = null;
        }
      }

      exhibitionArtworksMap.get(exhId)!.push({
        ...item.art,
        displayOrder: item.link.displayOrder ?? 0,
        wallPosition: wallPos,
        artist: item.artist ? (item.artist as User) : null,
      });
    }

    const result: Exhibition[] = list.map((exh: any) => {
      const artworks = exhibitionArtworksMap.get(exh.id) || [];
      const artistMap = new Map<string, User>();
      for (const art of artworks) {
        if (art.artist) {
          artistMap.set(art.artist.id, art.artist);
        }
      }

      return {
        ...exh,
        artworks,
        curator: mainCurator,
        artists: Array.from(artistMap.values()),
      };
    });

    setCached(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching exhibitions from DB:', error);
    return [];
  }
}

// Fetch only active / visible exhibitions for public visitors (hides 'archived')
export async function getPublicExhibitions(): Promise<Exhibition[]> {
  const all = await getAllExhibitions();
  return all.filter((e) => e.status === 'active' || e.status === 'upcoming');
}

export async function getAllArtworks(): Promise<Artwork[]> {
  const cacheKey = 'all_artworks';
  const cached = getCached<Artwork[]>(cacheKey);
  if (cached) return cached;

  try {
    const raw = await db
      .select({
        art: schema.artworks,
        artist: schema.users,
      })
      .from(schema.artworks)
      .leftJoin(schema.users, eq(schema.artworks.artistId, schema.users.id))
      .orderBy(desc(schema.artworks.createdAt));

    if (raw && raw.length > 0) {
      const res = raw.map((r: any) => ({
        ...r.art,
        artist: r.artist as User,
      }));
      setCached(cacheKey, res);
      return res;
    }
    return [];
  } catch (error) {
    console.error('Error fetching artworks from DB:', error);
    return [];
  }
}

export async function getAllArtists(): Promise<User[]> {
  try {
    const list = await db.select().from(schema.users);
    if (list && Array.isArray(list) && list.length > 0) {
      const filtered = list.filter((u: any) => u.role !== 'curator');
      return filtered.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'th')) as User[];
    }
  } catch (error) {
    console.error('Error fetching artists from DB:', error);
  }

  return [];
}

export async function getArtistProfile(artistId: string) {
  try {
    const allUsers = await db.select().from(schema.users);
    const artist = allUsers.find((u: any) => u.id === artistId);

    if (artist) {
      const rawArtworks = await db
        .select()
        .from(schema.artworks)
        .where(eq(schema.artworks.artistId, artistId));

      const allLinks = await db
        .select({
          artworkId: schema.exhibitionArtworks.artworkId,
          exhibitionId: schema.exhibitionArtworks.exhibitionId,
        })
        .from(schema.exhibitionArtworks);

      const allExhibitions = await db.select().from(schema.exhibitions);
      const exhMap = new Map(allExhibitions.map((e: any) => [e.id, e]));

      const linksByArtworkId = new Map<string, any[]>();
      for (const l of allLinks) {
        if (l.artworkId) {
          if (!linksByArtworkId.has(l.artworkId)) {
            linksByArtworkId.set(l.artworkId, []);
          }
          const exhObj = exhMap.get(l.exhibitionId);
          if (exhObj) {
            linksByArtworkId.get(l.artworkId)!.push(exhObj);
          }
        }
      }

      // Deduplicate artworks by title
      const seenTitles = new Set<string>();
      const uniqueArtworks = rawArtworks.filter((art: any) => {
        const titleKey = (art.title || '').trim().toLowerCase();
        if (seenTitles.has(titleKey)) return false;
        seenTitles.add(titleKey);
        return true;
      });

      const artworksWithExhibitions = uniqueArtworks.map((art: any) => ({
        ...art,
        artist,
        exhibitions: linksByArtworkId.get(art.id) || [],
      }));

      const participatingMap = new Map<string, any>();
      for (const art of artworksWithExhibitions) {
        for (const exh of art.exhibitions || []) {
          participatingMap.set(exh.id, exh);
        }
      }

      return {
        artist: artist as User,
        artworks: artworksWithExhibitions,
        participatingExhibitions: Array.from(participatingMap.values()),
      };
    }
  } catch (error) {
    console.error('Error fetching artist profile from DB:', error);
  }

  return null;
}

// BATCH-OPTIMIZED: Fetch all artists with stats safely without fragile joins
export async function getAllArtistsWithStats() {
  try {
    // 1. Fetch all users directly
    const allUsers = await db.select().from(schema.users);
    if (!allUsers || !Array.isArray(allUsers) || allUsers.length === 0) return [];

    const artists = allUsers.filter((u: any) => u.role !== 'curator');
    if (artists.length === 0) return [];

    // 2. Fetch basic artwork counts per artist
    let allArtworks: any[] = [];
    try {
      allArtworks = await db.select().from(schema.artworks);
    } catch (artErr) {
      console.warn('Error fetching artworks for stats:', artErr);
    }

    // 3. Fetch basic exhibition links
    let allLinks: any[] = [];
    try {
      allLinks = await db.select().from(schema.exhibitionArtworks);
    } catch (linkErr) {
      console.warn('Error fetching links for stats:', linkErr);
    }

    const linksByArtworkId = new Map<string, string[]>();
    for (const l of allLinks) {
      if (l && l.artworkId) {
        if (!linksByArtworkId.has(l.artworkId)) {
          linksByArtworkId.set(l.artworkId, []);
        }
        if (l.exhibitionId) {
          linksByArtworkId.get(l.artworkId)!.push(l.exhibitionId);
        }
      }
    }

    const linkedArtworkIdSet = new Set(allLinks.map((l: any) => l.artworkId));

    // Deduplicate artworks per artist by title
    const artworksByArtistId = new Map<string, any[]>();
    const seenArtKeys = new Set<string>();

    for (const art of allArtworks) {
      if (art && art.artistId) {
        const isLinked = linkedArtworkIdSet.has(art.id);
        const artKey = `${art.artistId}:::${(art.title || '').trim().toLowerCase()}`;

        if (!seenArtKeys.has(artKey) && (isLinked || linkedArtworkIdSet.size === 0)) {
          seenArtKeys.add(artKey);
          if (!artworksByArtistId.has(art.artistId)) {
            artworksByArtistId.set(art.artistId, []);
          }
          artworksByArtistId.get(art.artistId)!.push(art);
        }
      }
    }

    const sortedArtists = artists.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'th'));

    return sortedArtists.map((artist: any) => {
      const artList = artworksByArtistId.get(artist.id) || [];
      const exhSet = new Set<string>();
      for (const art of artList) {
        const linkedExhs = linksByArtworkId.get(art.id) || [];
        for (const exhId of linkedExhs) exhSet.add(exhId);
      }

      return {
        ...artist,
        artworkCount: artList.length,
        exhibitionCount: exhSet.size,
        exhibitions: Array.from(exhSet).map((id) => ({ id, title: 'Exhibition', slug: id, status: 'active' })),
        previewArtworks: artList.slice(0, 3),
      };
    });
  } catch (error) {
    console.error('Error fetching artists with stats from DB:', error);
    try {
      const allUsers = await db.select().from(schema.users);
      return allUsers
        .filter((u: any) => u.role !== 'curator')
        .map((a: any) => ({
          ...a,
          artworkCount: 0,
          exhibitionCount: 0,
          exhibitions: [],
          previewArtworks: [],
        }));
    } catch {
      return [];
    }
  }
}

export async function getAllCurators(): Promise<User[]> {
  try {
    const list = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'curator'))
      .orderBy(asc(schema.users.name));

    if (list && list.length > 0) return list as User[];
  } catch (error) {
    console.error('Error fetching curators from DB:', error);
  }

  return [];
}

// BATCH-OPTIMIZED: Fetch all curators with stats in only 2 DB queries
export async function getAllCuratorsWithStats() {
  try {
    const curators = await getAllCurators();
    if (!curators || curators.length === 0) return [];

    const exhList = await db
      .select()
      .from(schema.exhibitions)
      .orderBy(desc(schema.exhibitions.createdAt));

    const result = curators.map((curator) => ({
      ...curator,
      exhibitionCount: exhList.length,
      curatedExhibitions: exhList.map((e: any) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        status: e.status,
        bannerUrl: e.bannerUrl,
      })),
    }));

    return result;
  } catch (error) {
    console.error('Error fetching curators with stats from DB:', error);
    return [];
  }
}

export async function getAllInquiries(): Promise<Inquiry[]> {
  try {
    const list = await db
      .select({
        inquiry: schema.inquiries,
        artTitle: schema.artworks.title,
      })
      .from(schema.inquiries)
      .leftJoin(schema.artworks, eq(schema.inquiries.artworkId, schema.artworks.id))
      .orderBy(desc(schema.inquiries.createdAt));

    if (list) {
      return list.map((item: any) => ({
        ...item.inquiry,
        artworkTitle: item.artTitle ?? 'Unknown Artwork',
      })) as Inquiry[];
    }
  } catch (error) {
    console.error('Error fetching inquiries from DB:', error);
  }

  return [];
}

export async function createInquiry(data: {
  artworkId: string;
  visitorName: string;
  visitorEmail: string;
  message: string;
}): Promise<Inquiry | null> {
  try {
    const id = `inq-${Date.now()}`;
    const newInq = {
      id,
      artworkId: data.artworkId,
      visitorName: data.visitorName,
      visitorEmail: data.visitorEmail,
      message: data.message,
      status: 'pending' as const,
    };
    await db.insert(schema.inquiries).values(newInq);
    return newInq as Inquiry;
  } catch (error) {
    console.error('Error creating inquiry in DB:', error);
    return null;
  }
}

export async function updateArtworkWallPosition(
  exhibitionId: string,
  artworkId: string,
  wallPosition: WallPosition
) {
  try {
    await db
      .update(schema.exhibitionArtworks)
      .set({ wallPosition: JSON.stringify(wallPosition) })
      .where(
        and(
          eq(schema.exhibitionArtworks.exhibitionId, exhibitionId),
          eq(schema.exhibitionArtworks.artworkId, artworkId)
        )
      );
    return true;
  } catch (error) {
    console.error('Error updating wall position in DB:', error);
    return false;
  }
}
