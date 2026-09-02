'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';

const CatalogDesignerStudio = dynamic(
  () => import('@/components/admin/catalog-designer/CatalogDesignerStudio').then((mod) => mod.CatalogDesignerStudio),
  {
    ssr: false,
    loading: () => (
      <div className="h-screen w-full bg-[#FAF8F5] flex flex-col items-center justify-center text-[#8B1B1B] text-sm font-serif font-bold">
        <div className="w-8 h-8 border-3 border-[#8B1B1B] border-t-transparent rounded-full animate-spin mb-4" />
        <span>กำลังโหลด ARTVARA Catalog Studio...</span>
      </div>
    ),
  }
);

function CatalogDesignerPageContent() {
  const searchParams = useSearchParams();
  const targetExhibitionId = searchParams?.get('exhibition') || undefined;

  return <CatalogDesignerStudio targetExhibitionId={targetExhibitionId} />;
}

export default function AdminCatalogDesignerPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-full bg-[#1A1918] flex items-center justify-center text-white text-sm">
          กำลังโหลด Catalog Studio...
        </div>
      }
    >
      <CatalogDesignerPageContent />
    </Suspense>
  );
}
