export const runtime = 'edge';
import { getAllArtistsWithStats } from '@/lib/data';
import { AdminArtistsManagerClient } from '@/components/admin/AdminArtistsManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminArtistsPage() {
  const artists = await getAllArtistsWithStats();

  return <AdminArtistsManagerClient initialArtists={artists} />;
}

