export const runtime = 'edge';
import React from 'react';
import { notFound } from 'next/navigation';
import { getExhibitionBySlug } from '@/lib/data';
import { CatalogViewerClient } from '@/components/catalog/CatalogViewerClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const exhibition = await getExhibitionBySlug(params.slug);
  if (!exhibition) {
    return { title: 'Catalog Not Found | ARTVARA' };
  }
  return {
    title: `${exhibition.title} - Official Exhibition Catalog (A4) | ARTVARA`,
    description: `Official Curated Art Exhibition Catalog for ${exhibition.title}`,
  };
}

export default async function CatalogViewerPage({
  params,
}: {
  params: { slug: string };
}) {
  const exhibition = await getExhibitionBySlug(params.slug);

  if (!exhibition) {
    notFound();
  }

  return <CatalogViewerClient exhibition={exhibition} />;
}
