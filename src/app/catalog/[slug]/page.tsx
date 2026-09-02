export const runtime = 'edge';
import React from 'react';
import nextDynamic from 'next/dynamic';
import { notFound } from 'next/navigation';
import { getExhibitionBySlug } from '@/lib/data';
import type { Metadata } from 'next';

const CatalogViewerClient = nextDynamic(
  () => import('@/components/catalog/CatalogViewerClient').then((mod) => mod.CatalogViewerClient),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-8 h-8 border-3 border-[#8B1B1B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif font-bold text-base text-[#1F1C17]">กำลังโหลดสูจิบัตรศิลปกรรม...</p>
        <span className="text-xs text-[#777] mt-1">ARTVARA CATALOG VIEWER</span>
      </div>
    ),
  }
);

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
