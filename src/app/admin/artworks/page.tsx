export const runtime = 'edge';
import React from 'react';
import { getAllArtworks } from '@/lib/data';
import { AdminArtworksClient } from '@/components/admin/AdminArtworksClient';

export const dynamic = 'force-dynamic';

export default async function AdminArtworksPage() {
  const artworks = await getAllArtworks();
  return <AdminArtworksClient artworks={artworks} />;
}

