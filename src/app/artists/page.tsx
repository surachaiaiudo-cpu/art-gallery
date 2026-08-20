import { getAllArtistsWithStats } from '@/lib/data';
import { ArtistsDirectoryClient } from '@/components/artists/ArtistsDirectoryClient';

export const dynamic = 'force-dynamic';

export default async function ArtistsDirectoryPage() {
  const artists = await getAllArtistsWithStats();

  return <ArtistsDirectoryClient artists={artists} />;
}
