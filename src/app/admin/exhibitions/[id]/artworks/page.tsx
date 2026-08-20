export const runtime = 'edge';
import { notFound } from 'next/navigation';
import { getExhibitionById, getAllArtworks } from '@/lib/data';
import { AdminExhibitionArtworksClient } from '@/components/admin/AdminExhibitionArtworksClient';

export const dynamic = 'force-dynamic';

export default async function AdminExhibitionArtworksPage({
  params,
}: {
  params: { id: string };
}) {
  const [exhibition, allArtworks] = await Promise.all([
    getExhibitionById(params.id),
    getAllArtworks(),
  ]);

  if (!exhibition) {
    notFound();
  }

  return (
    <AdminExhibitionArtworksClient
      exhibition={exhibition}
      allArtworksLibrary={allArtworks}
    />
  );
}
