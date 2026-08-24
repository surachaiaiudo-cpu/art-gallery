import React from 'react';
import { getPublicExhibitions } from '@/lib/data';
import { HomeClient } from '@/components/home/HomeClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const exhibitions = await getPublicExhibitions();
  return <HomeClient exhibitions={exhibitions} />;
}

