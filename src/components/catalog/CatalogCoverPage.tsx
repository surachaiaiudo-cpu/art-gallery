'use client';

import React from 'react';
import { Exhibition, User } from '@/types/exhibition';
import { formatDateRange } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface CatalogCoverPageProps {
  exhibition: Exhibition;
  curator?: User | null;
  coverFooter: string;
  isReaderModal?: boolean;
}

export function CatalogCoverPage({
  exhibition,
  curator,
  coverFooter,
  isReaderModal = false,
}: CatalogCoverPageProps) {
  const bannerUrl = getOptimizedImageUrl(exhibition.bannerUrl, {
    width: isReaderModal ? 1200 : 1000,
    quality: 85,
  });

  return (
    <section className="catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm] bg-white border border-[#E0E0E0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border text-center">
      <div>
        <div className="border-b border-[#E0E0E0] pb-3 mb-5">
          <span className="catalog-heading-th font-serif text-3xl font-bold tracking-[0.2em] text-[#000000] block leading-normal">
            ARTVARA
          </span>
          <span className="catalog-body-th text-[10px] uppercase tracking-widest text-[#666666] mt-1 block leading-normal">
            International Art Festival &amp; Curated Exhibition
          </span>
        </div>

        {bannerUrl && (
          <div className="relative w-full h-[140mm] max-w-[180mm] mx-auto overflow-hidden mb-5 flex items-center justify-center">
            <img
              src={bannerUrl}
              alt={exhibition.title}
              crossOrigin="anonymous"
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        )}

        <div className="space-y-2.5 max-w-[170mm] mx-auto">
          <span className="catalog-body-th text-xs font-bold uppercase tracking-[0.2em] text-[#333333] block leading-normal">
            Official Exhibition Catalog (สูจิบัตร)
          </span>
          <h1 className="catalog-heading-th font-serif text-2xl sm:text-3xl font-bold text-[#000000] leading-snug">
            {exhibition.title}
          </h1>
          {curator?.name && (
            <p className="catalog-body-th text-sm text-[#444444] font-medium leading-normal">
              Curated by {curator.name}
            </p>
          )}
          <div className="pt-2">
            <span className="catalog-body-th inline-block px-4 py-1 text-xs border border-[#C5A880] text-[#8C6D3F] font-bold tracking-wider rounded-sm uppercase">
              {formatDateRange(exhibition.startDate, exhibition.endDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#E0E0E0] flex items-center justify-between text-[10px] text-[#666666]">
        <span className="catalog-body-th truncate max-w-[170mm]">{coverFooter}</span>
        <span className="font-mono text-[#444444] font-bold">1</span>
      </div>
    </section>
  );
}
