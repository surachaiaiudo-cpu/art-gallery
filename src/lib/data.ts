import { db, schema } from '@/db';
import { eq, desc, asc, or, and } from 'drizzle-orm';
import { Exhibition, Artwork, User, Inquiry, WallPosition } from '@/types/exhibition';

export async function getExhibitionBySlug(rawSlug: string): Promise<Exhibition | null> {
  try {
    const slug = decodeURIComponent(rawSlug || '').trim();
    const cleanSlug = slug.replace(/-+$/, '');

    let rawExhibitions = await db
      .select()
      .from(schema.exhibitions)
      .where(or(eq(schema.exhibitions.slug, slug), eq(schema.exhibitions.slug, cleanSlug), eq(schema.exhibitions.id, slug)))
      .limit(1);

    if (!rawExhibitions || rawExhibitions.length === 0) {
      const allExhs = await db.select().from(schema.exhibitions);
      const found = allExhs.find(
        (e: any) =>
          e.slug === slug ||
          e.slug === cleanSlug ||
          e.slug.startsWith(cleanSlug) ||
          cleanSlug.startsWith(e.slug)
      );
      if (found) {
        rawExhibitions = [found];
      }
    }

    if (rawExhibitions && rawExhibitions.length > 0) {
      const exh = rawExhibitions[0];

      // Fetch the specific curator linked to this exhibition via curatorId FK
      // Fallback: if curatorId is null, pick the first curator in the system
      let curatorRow: User | null = null;
      if ((exh as any).curatorId) {
        const curatorRes = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.id, (exh as any).curatorId))
          .limit(1);
        curatorRow = curatorRes[0] ? (curatorRes[0] as User) : null;
      }
      if (!curatorRow) {
        const fallbackCurator = await db
          .select()
          .from(schema.users)
          .where(eq(schema.users.role, 'curator'))
          .limit(1);
        curatorRow = fallbackCurator[0] ? (fallbackCurator[0] as User) : null;
      }

      // Fetch artworks associated with this exhibition (1 query)
      const rawLinks = await db
        .select({
          link: schema.exhibitionArtworks,
          art: schema.artworks,
          artist: schema.users,
        })
        .from(schema.exhibitionArtworks)
        .innerJoin(schema.artworks, eq(schema.exhibitionArtworks.artworkId, schema.artworks.id))
        .leftJoin(schema.users, eq(schema.artworks.artistId, schema.users.id))
        .where(eq(schema.exhibitionArtworks.exhibitionId, exh.id))
        .orderBy(asc(schema.exhibitionArtworks.displayOrder));

      const artworks: Artwork[] = rawLinks.map((item: any) => {
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

      // Unique participating artists
      const artistMap = new Map<string, User>();
      for (const art of artworks) {
        if (art.artist) {
          artistMap.set(art.artist.id, art.artist);
        }
      }

      return {
        ...exh,
        artworks,
        curator: curatorRow,
        artists: Array.from(artistMap.values()),
      };
    }
  } catch (error) {
    console.error('Error fetching exhibition by slug from DB:', error);
  }

  return null;
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

// BATCH-OPTIMIZED: Fetch all exhibitions with all artworks and artists in only 3 DB queries
export async function getAllExhibitions(): Promise<Exhibition[]> {
  try {
    const list = await db
      .select()
      .from(schema.exhibitions)
      .orderBy(desc(schema.exhibitions.createdAt));

    if (!list || list.length === 0) return [];

    // Query 2: All curators
    const curators = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'curator'))
      .limit(1);
    const mainCurator = curators[0] ? (curators[0] as User) : null;

    // Query 3: All exhibition artwork links with joined artwork and artist
    const allLinks = await db
      .select({
        link: schema.exhibitionArtworks,
        art: schema.artworks,
        artist: schema.users,
      })
      .from(schema.exhibitionArtworks)
      .innerJoin(schema.artworks, eq(schema.exhibitionArtworks.artworkId, schema.artworks.id))
      .leftJoin(schema.users, eq(schema.artworks.artistId, schema.users.id))
      .orderBy(asc(schema.exhibitionArtworks.displayOrder));

    // Group artworks by exhibitionId in memory
    const exhibitionArtworksMap = new Map<string, Artwork[]>();
    for (const item of allLinks) {
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

    return result;
  } catch (error) {
    console.error('Error fetching exhibitions from DB:', error);
    return [];
  }
}

export async function getAllArtworks(): Promise<Artwork[]> {
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
      return raw.map((r: any) => ({
        ...r.art,
        artist: r.artist ? (r.artist as User) : null,
      }));
    }
  } catch (error) {
    console.error('Error fetching all artworks from DB:', error);
  }

  return [];
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
