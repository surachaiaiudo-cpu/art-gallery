export const runtime = 'edge';
import React from 'react';
import { getAllArtworks, getAllExhibitions } from '@/lib/data';
import { AdminArtworksClient } from '@/components/admin/AdminArtworksClient';

export const dynamic = 'force-dynamic';

export default async function AdminArtworksPage() {
  const [artworks, exhibitions] = await Promise.all([
    getAllArtworks(),
    getAllExhibitions(),
  ]);

  return <AdminArtworksClient initialArtworks={artworks} exhibitions={exhibitions} />;
}
