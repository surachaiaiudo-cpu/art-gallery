import { db, schema } from '@/db';
import { eq, desc, asc, or } from 'drizzle-orm';
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

      // Fetch curator (1 query)
      const curator = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, 'curator'))
        .limit(1);

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
        curator: curator[0] ? (curator[0] as User) : null,
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
    const list = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.role, 'artist'))
      .orderBy(asc(schema.users.name));

    if (list && list.length > 0) {
      return list as User[];
    }
  } catch (error) {
    console.error('Error fetching artists from DB:', error);
  }

  return [];
}

export async function getArtistProfile(artistId: string) {
  try {
    const artistRes = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, artistId))
      .limit(1);

    if (artistRes && artistRes.length > 0) {
      const artist = artistRes[0] as User;

      const rawArtworks = await db
        .select()
        .from(schema.artworks)
        .where(eq(schema.artworks.artistId, artistId))
        .orderBy(desc(schema.artworks.createdAt));

      // Fetch all exhibition links in 1 batch query
      const allLinks = await db
        .select({
          link: schema.exhibitionArtworks,
          exhibition: schema.exhibitions,
        })
        .from(schema.exhibitionArtworks)
        .innerJoin(schema.exhibitions, eq(schema.exhibitionArtworks.exhibitionId, schema.exhibitions.id));

      const linksByArtworkId = new Map<string, any[]>();
      const exhibitionMap = new Map<string, any>();

      for (const l of allLinks) {
        const artId = l.link.artworkId;
        if (!linksByArtworkId.has(artId)) {
          linksByArtworkId.set(artId, []);
        }
        const exhInfo = {
          id: l.exhibition.id,
          title: l.exhibition.title,
          slug: l.exhibition.slug,
          status: l.exhibition.status,
          startDate: l.exhibition.startDate,
          endDate: l.exhibition.endDate,
          bannerUrl: l.exhibition.bannerUrl,
        };
        linksByArtworkId.get(artId)!.push(exhInfo);
        exhibitionMap.set(l.exhibition.id, exhInfo);
      }

      const artworksWithExhibitions = rawArtworks.map((art: any) => ({
        ...art,
        artist,
        exhibitions: linksByArtworkId.get(art.id) || [],
      }));

      return {
        artist,
        artworks: artworksWithExhibitions,
        participatingExhibitions: Array.from(exhibitionMap.values()),
      };
    }
  } catch (error) {
    console.error('Error fetching artist profile from DB:', error);
  }

  return null;
}

// BATCH-OPTIMIZED: Fetch all artists with stats in only 3 DB queries total (prevents Worker resource limit 1102)
export async function getAllArtistsWithStats() {
  try {
    // 1. Fetch all artists
    const artists = await getAllArtists();
    if (!artists || artists.length === 0) return [];

    // 2. Fetch all artworks
    const allArtworks = await db
      .select()
      .from(schema.artworks)
      .orderBy(desc(schema.artworks.createdAt));

    // 3. Fetch all exhibition links with exhibition info
    const allLinks = await db
      .select({
        artworkId: schema.exhibitionArtworks.artworkId,
        exhibition: schema.exhibitions,
      })
      .from(schema.exhibitionArtworks)
      .innerJoin(schema.exhibitions, eq(schema.exhibitionArtworks.exhibitionId, schema.exhibitions.id));

    // Index exhibitions by artworkId
    const exhibitionsByArtworkId = new Map<string, any[]>();
    for (const l of allLinks) {
      if (!exhibitionsByArtworkId.has(l.artworkId)) {
        exhibitionsByArtworkId.set(l.artworkId, []);
      }
      exhibitionsByArtworkId.get(l.artworkId)!.push(l.exhibition);
    }

    // Index artworks by artistId
    const artworksByArtistId = new Map<string, any[]>();
    for (const art of allArtworks) {
      if (!artworksByArtistId.has(art.artistId)) {
        artworksByArtistId.set(art.artistId, []);
      }
      const exhibitions = exhibitionsByArtworkId.get(art.id) || [];
      artworksByArtistId.get(art.artistId)!.push({
        ...art,
        exhibitions,
      });
    }

    const result = artists.map((artist) => {
      const artworks = artworksByArtistId.get(artist.id) || [];
      const participatingExhibitionsMap = new Map<string, any>();
      for (const art of artworks) {
        for (const exh of art.exhibitions || []) {
          participatingExhibitionsMap.set(exh.id, {
            id: exh.id,
            title: exh.title,
            slug: exh.slug,
            status: exh.status,
            bannerUrl: exh.bannerUrl,
          });
        }
      }

      const participatingExhibitions = Array.from(participatingExhibitionsMap.values());

      return {
        ...artist,
        artworkCount: artworks.length,
        exhibitionCount: participatingExhibitions.length,
        exhibitions: participatingExhibitions,
        previewArtworks: artworks.slice(0, 3),
      };
    });

    return result;
  } catch (error) {
    console.error('Error fetching artists with stats from DB:', error);
    return [];
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
        eq(schema.exhibitionArtworks.exhibitionId, exhibitionId) &&
        eq(schema.exhibitionArtworks.artworkId, artworkId)
      );
    return true;
  } catch (error) {
    console.error('Error updating wall position in DB:', error);
    return false;
  }
}
