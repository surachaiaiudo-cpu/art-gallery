export const runtime = 'edge';
import React from 'react';
import { getAllExhibitions } from '@/lib/data';
import { HomeClient } from '@/components/home/HomeClient';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const exhibitions = await getAllExhibitions();
  return <HomeClient exhibitions={exhibitions} />;
}

