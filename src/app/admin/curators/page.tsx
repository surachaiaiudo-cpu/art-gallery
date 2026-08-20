export const runtime = 'edge';
import React from 'react';
import { getAllCuratorsWithStats } from '@/lib/data';
import { AdminCuratorsManagerClient } from '@/components/admin/AdminCuratorsManagerClient';

export const dynamic = 'force-dynamic';

export default async function AdminCuratorsPage() {
  const curators = await getAllCuratorsWithStats();

  return <AdminCuratorsManagerClient initialCurators={curators} />;
}

