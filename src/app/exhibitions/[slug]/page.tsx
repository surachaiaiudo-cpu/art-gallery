import React from 'react';
import { notFound } from 'next/navigation';
import { getExhibitionBySlug } from '@/lib/data';
import { ExhibitionViewSwitcher } from '@/components/exhibition/ExhibitionViewSwitcher';
import type { Metadata } from 'next';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

import Link from 'next/link';

export default async function ExhibitionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { mode?: '2d' | 'carousel' | '3d'; preview?: string };
}) {
  const slug = params.slug;
  const exhibition = await getExhibitionBySlug(slug);

  if (!exhibition) {
    notFound();
  }

  // If exhibition is archived/hidden and not in admin preview mode, hide from general public
  if (exhibition.status === 'archived' && searchParams?.preview !== 'admin') {
    return (
      <div className="min-h-screen bg-[#161412] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#8B1B1B]/40 text-[#D4AF37] border border-[#D4AF37]/30 flex items-center justify-center font-serif text-2xl font-bold mb-6 shadow-xl">
          🔒
        </div>
        <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold mb-2">
          POH-CHANG ACADEMY OF ARTS • ARTVARA
        </span>
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-white max-w-xl mb-4">
          นิทรรศการนี้ปิดการจัดแสดงแล้ว
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mb-8 font-light leading-relaxed">
          นิทรรศการ &quot;{exhibition.title}&quot; ได้สิ้นสุดระยะเวลาจัดแสดงและถูกเก็บเข้าคลังของหอศิลป์เรียบร้อยแล้ว
        </p>
        <Link
          href="/"
          className="px-6 py-3 rounded-full bg-[#C5A880] hover:bg-[#b09268] text-[#1A1918] font-bold text-xs uppercase tracking-wider transition-all shadow-lg"
        >
          ← กลับสู่ห้องโถงหลัก (Grand Lobby)
        </Link>
      </div>
    );
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
