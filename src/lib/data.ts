import { db, schema } from '@/db';
import { eq, desc, asc, or } from 'drizzle-orm';
import { Exhibition, Artwork, User, Inquiry, WallPosition } from '@/types/exhibition';
import { FALLBACK_EXHIBITIONS, FALLBACK_ARTWORKS, FALLBACK_USERS } from './fallbackData';

export async function getExhibitionBySlug(slug: string): Promise<Exhibition | null> {
  try {
    const rawExhibitions = await db
      .select()
      .from(schema.exhibitions)
      .where(eq(schema.exhibitions.slug, slug))
      .limit(1);

    if (rawExhibitions && rawExhibitions.length > 0) {
      const exh = rawExhibitions[0];

      // Fetch curator
      const curator = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.role, 'curator'))
        .limit(1);

      // Fetch artworks associated with this exhibition
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

  // Fallback to static curated exhibition
  const fallback = FALLBACK_EXHIBITIONS.find((e) => e.slug === slug || e.id === slug);
  return fallback || null;
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

  const fallback = FALLBACK_EXHIBITIONS.find((e) => e.id === id || e.slug === id);
  return fallback || null;
}

export async function getAllExhibitions(): Promise<Exhibition[]> {
  try {
    const list = await db
      .select()
      .from(schema.exhibitions)
      .orderBy(desc(schema.exhibitions.createdAt));

    if (list && list.length > 0) {
      const result: Exhibition[] = [];
      for (const exh of list) {
        const exhFull = await getExhibitionBySlug(exh.slug);
        if (exhFull) {
          result.push(exhFull);
        } else {
          result.push(exh as Exhibition);
        }
      }
      return result;
    }
  } catch (error) {
    console.error('Error fetching exhibitions from DB:', error);
  }

  return FALLBACK_EXHIBITIONS;
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

  return FALLBACK_ARTWORKS;
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

  return FALLBACK_USERS.filter((u) => u.role === 'artist');
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

      const artworksWithExhibitions = [];
      const exhibitionMap = new Map<string, any>();

      for (const art of rawArtworks) {
        const links = await db
          .select({
            link: schema.exhibitionArtworks,
            exhibition: schema.exhibitions,
          })
          .from(schema.exhibitionArtworks)
          .innerJoin(schema.exhibitions, eq(schema.exhibitionArtworks.exhibitionId, schema.exhibitions.id))
          .where(eq(schema.exhibitionArtworks.artworkId, art.id));

        const exhibitions = links.map((l: any) => {
          const exhInfo = {
            id: l.exhibition.id,
            title: l.exhibition.title,
            slug: l.exhibition.slug,
            status: l.exhibition.status,
            startDate: l.exhibition.startDate,
            endDate: l.exhibition.endDate,
            bannerUrl: l.exhibition.bannerUrl,
          };
          exhibitionMap.set(l.exhibition.id, exhInfo);
          return exhInfo;
        });

        artworksWithExhibitions.push({
          ...art,
          artist,
          exhibitions,
        });
      }

      return {
        artist,
        artworks: artworksWithExhibitions,
        participatingExhibitions: Array.from(exhibitionMap.values()),
      };
    }
  } catch (error) {
    console.error('Error fetching artist profile from DB:', error);
  }

  // Fallback for artist profile
  const fallbackArtist = FALLBACK_USERS.find((u) => u.id === artistId) || FALLBACK_USERS[1];
  const fallbackArtworks = FALLBACK_ARTWORKS.filter((a) => a.artistId === fallbackArtist.id);
  return {
    artist: fallbackArtist,
    artworks: fallbackArtworks.map((a) => ({
      ...a,
      exhibitions: [
        {
          id: 'exh-01',
          title: 'The Golden Age of Ayutthaya: A Curated Collection',
          slug: 'the-golden-age-of-ayutthaya',
          status: 'active',
          startDate: '2026-08-01',
          endDate: '2026-10-31',
          bannerUrl: 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop',
        },
      ],
    })),
    participatingExhibitions: [FALLBACK_EXHIBITIONS[0]],
  };
}

export async function getAllArtistsWithStats() {
  try {
    const artists = await getAllArtists();
    const result = [];

    for (const artist of artists) {
      const profile = await getArtistProfile(artist.id);
      if (profile) {
        result.push({
          ...artist,
          artworkCount: profile.artworks.length,
          exhibitionCount: profile.participatingExhibitions.length,
          exhibitions: profile.participatingExhibitions,
          previewArtworks: profile.artworks.slice(0, 3),
        });
      }
    }

    if (result.length > 0) return result;
  } catch (error) {
    console.error('Error fetching artists with stats from DB:', error);
  }

  return FALLBACK_USERS.filter((u) => u.role === 'artist').map((artist) => ({
    ...artist,
    artworkCount: 1,
    exhibitionCount: 1,
    exhibitions: [FALLBACK_EXHIBITIONS[0]],
    previewArtworks: FALLBACK_ARTWORKS.filter((a) => a.artistId === artist.id),
  }));
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

  return FALLBACK_USERS.filter((u) => u.role === 'curator');
}

export async function getAllCuratorsWithStats() {
  try {
    const curators = await getAllCurators();
    const result = [];

    for (const curator of curators) {
      const exhList = await db
        .select()
        .from(schema.exhibitions)
        .orderBy(desc(schema.exhibitions.createdAt));

      result.push({
        ...curator,
        exhibitionCount: exhList.length,
        curatedExhibitions: exhList.map((e: any) => ({
          id: e.id,
          title: e.title,
          slug: e.slug,
          status: e.status,
          bannerUrl: e.bannerUrl,
        })),
      });
    }

    if (result.length > 0) return result;
  } catch (error) {
    console.error('Error fetching curators with stats from DB:', error);
  }

  return FALLBACK_USERS.filter((u) => u.role === 'curator').map((c) => ({
    ...c,
    exhibitionCount: 3,
    curatedExhibitions: FALLBACK_EXHIBITIONS.map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      status: e.status,
      bannerUrl: e.bannerUrl,
    })),
  }));
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
