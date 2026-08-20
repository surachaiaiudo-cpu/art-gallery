import React from 'react';
import { getAllExhibitions, getAllArtworks, getAllArtists, getAllInquiries } from '@/lib/data';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const exhibitions = await getAllExhibitions();
  const artworks = await getAllArtworks();
  const artists = await getAllArtists();
  const inquiries = await getAllInquiries();

  return (
    <AdminDashboardClient
      exhibitions={exhibitions}
      artworks={artworks}
      artists={artists}
      inquiries={inquiries}
    />
  );
}
