'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CatalogDesignerStudio } from '@/components/admin/catalog-designer/CatalogDesignerStudio';

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
