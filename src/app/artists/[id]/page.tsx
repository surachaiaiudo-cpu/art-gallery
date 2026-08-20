export const runtime = 'edge';
import { notFound } from 'next/navigation';
import { getArtistProfile } from '@/lib/data';
import { ArtistProfileClient } from '@/components/artists/ArtistProfileClient';

export const dynamic = 'force-dynamic';

export default async function ArtistPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getArtistProfile(params.id);

  if (!profile) {
    notFound();
  }

  return (
    <ArtistProfileClient
      artist={profile.artist}
      artworks={profile.artworks}
      participatingExhibitions={profile.participatingExhibitions}
    />
  );
}
