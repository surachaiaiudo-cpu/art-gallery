export const runtime = 'edge';
import React from 'react';
import { notFound } from 'next/navigation';
import { getExhibitionBySlug } from '@/lib/data';
import { ExhibitionViewSwitcher } from '@/components/exhibition/ExhibitionViewSwitcher';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const exhibition = await getExhibitionBySlug(params.slug);
  if (!exhibition) {
    return { title: 'Exhibition Not Found | ARTVARA' };
  }
  return {
    title: `${exhibition.title} | ARTVARA Online Gallery`,
    description: exhibition.curatorNote?.slice(0, 160) || 'Curated Art Exhibition at ARTVARA',
  };
}

export default async function ExhibitionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { mode?: '2d' | 'carousel' | '3d' };
}) {
  const slug = params.slug;
  const exhibition = await getExhibitionBySlug(slug);

  if (!exhibition) {
    notFound();
  }

  const initialMode =
    searchParams?.mode === '3d'
      ? '3d'
      : searchParams?.mode === 'carousel'
      ? 'carousel'
      : '2d';

  return (
    <ExhibitionViewSwitcher
      exhibition={exhibition}
      initialMode={initialMode}
    />
  );
}
