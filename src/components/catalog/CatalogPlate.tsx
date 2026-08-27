'use client';

import React, { useState } from 'react';
import { Artwork } from '@/types/exhibition';
import { formatPrice } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface CatalogPlateProps {
  artwork: Artwork;
  pageNumber: number;
  plateFooter: string;
  footerGraphicType: 'wave_gold' | 'wave_mono' | 'line_gold' | 'custom_image' | 'none';
  customFooterImageUrl?: string;
  isReaderModal?: boolean;
  paperSize?: 'a4' | 'square8x8';
}

export function CatalogPlate({
  artwork,
  pageNumber,
  plateFooter,
  footerGraphicType,
  customFooterImageUrl,
  isReaderModal = false,
  paperSize = 'a4',
}: CatalogPlateProps) {
  const [photoError, setPhotoError] = useState(false);
  const artist = artwork.artist;
  const UNSPLASH_PLACEHOLDERS = [
    'unsplash.com/photo-1507003211169',
    'unsplash.com/photo-1534528741775',
  ];
  const rawAvatarUrl = artist?.avatarUrl?.trim() || '';
  const isRealAvatar =
    rawAvatarUrl.length > 0 &&
    !UNSPLASH_PLACEHOLDERS.some((p) => rawAvatarUrl.includes(p));
  const resolvedPhotoUrl = isRealAvatar ? rawAvatarUrl : (artwork.imageUrl || '');
  const hasRealPhoto = resolvedPhotoUrl.length > 0 && !photoError;
  const isAvatarFallback = hasRealPhoto && !isRealAvatar;

  const optimizedArtworkUrl = getOptimizedImageUrl(artwork.imageUrl, {
    width: isReaderModal ? 1200 : 800,
    quality: isReaderModal ? 85 : 75,
  });

  const optimizedPhotoUrl = hasRealPhoto
    ? getOptimizedImageUrl(resolvedPhotoUrl, { width: 160, quality: 75 })
    : '';

  const flagUrl = getFlagImageUrl(artist?.country);

  // ==========================================
  // 🔲 FORMAT 2: SQUARE 8x8 INCHES (203.2 x 203.2 mm)
  // - Top Margin: 1 inch (25.4 mm)
  // - Left, Right, Bottom Margin: 0.25 inch (6.35 mm)
  // - Left 2/3: Artwork Image ALWAYS CENTERED (no table/borders)
  // - Right 1/3: Artist Photo at Top Right -> Artist Details -> Artwork Details -> Concept (Contiguous, No gap, All Right-Aligned, No tables)
  // ==========================================
  if (paperSize === 'square8x8') {
    return (
      <section className="catalog-square8-page w-[203.2mm] h-[203.2mm] min-h-[203.2mm] max-h-[203.2mm] pt-[25.4mm] px-[6.35mm] pb-[6.35mm] bg-white border border-[#E0E0E0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border">
        {/* Main 2-Column Area: Left 2/3 and Right 1/3 */}
        <div className="flex flex-row gap-6 flex-1 w-full overflow-hidden">
          
          {/* Left Column (2/3 of Page): Artwork Image ALWAYS ALIGNED TOP-CENTER (ชิดบน กลาง) */}
          <div className="w-2/3 h-full flex items-start justify-center overflow-hidden p-1">
            <img
              src={optimizedArtworkUrl}
              alt={artwork.title}
              loading={isReaderModal ? 'eager' : 'lazy'}
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
          </div>

          {/* Right Column (1/3 of Page): Continuous Right-Aligned Information (Fonts +25%) */}
          <div className="w-1/3 h-full flex flex-col items-end text-right justify-start space-y-2 overflow-hidden pl-1 pr-1">
            
            {/* 1. Artist Photo & Flag (Top Right) */}
            <div className="flex items-center gap-2.5 justify-end mb-1">
              {flagUrl && (
                <div className="relative w-7 h-4.5 rounded-[2px] overflow-hidden border border-[#D0D0D0] shadow-xs bg-[#F5F5F5]">
                  <img src={flagUrl} alt={artist?.country || 'Flag'} className="w-full h-full object-cover" />
                </div>
              )}
              {hasRealPhoto ? (
                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-[#1A1A1A] border border-[#DDD] shadow-xs">
                  <img
                    src={optimizedPhotoUrl}
                    alt={artist?.name || 'Artist'}
                    onError={() => setPhotoError(true)}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-20 bg-[#EFEFEF] border border-[#D0D0D0] rounded-lg flex flex-col items-center justify-center shadow-xs">
                  <span className="catalog-heading-th text-xl font-bold text-[#555]">
                    {artist?.name?.trim().charAt(0).toUpperCase() || 'A'}
                  </span>
                </div>
              )}
            </div>

            {/* 2. Artist Details (ชื่อ & ข้อมูลศิลปิน จัดชิดขวา - ตัวอักษรใหญ่ขึ้น 25%) */}
            <div className="text-right w-full space-y-0.5">
              <h3 className="catalog-heading-th text-sm sm:text-base font-bold text-[#111111] leading-snug">
                {artist?.name || 'Artist'}
              </h3>
              {artist?.country && (
                <p className="catalog-body-th text-[11px] text-[#555555] leading-tight">
                  {artist.country}
                </p>
              )}
              {artist?.email && (
                <p className="catalog-body-th text-[10.5px] text-[#777777] leading-tight truncate">
                  {artist.email}
                </p>
              )}
            </div>

            {/* 3. Artwork Details (รายละเอียดผลงาน ต่อเนื่องกัน ไม่เว้นช่องว่าง จัดชิดขวา - ตัวอักษรใหญ่ขึ้น 25%) */}
            <div className="text-right w-full space-y-0.5 pt-1">
              <h2 className="catalog-heading-th font-serif text-sm sm:text-base font-bold text-[#1A1918] leading-tight line-clamp-2">
                {artwork.title}
              </h2>
              {artwork.medium && (
                <p className="catalog-body-th text-[11px] text-[#333333] leading-snug">
                  เทคนิค: <span className="text-[#000] font-medium">{artwork.medium}</span>
                </p>
              )}
              {artwork.dimensions && (
                <p className="catalog-body-th text-[11px] text-[#333333] leading-snug">
                  ขนาด: <span className="text-[#000] font-medium">{artwork.dimensions}</span>
                </p>
              )}
              {artwork.yearCreated && (
                <p className="catalog-body-th text-[11px] text-[#666666] leading-snug">
                  ปี: <span>{artwork.yearCreated}</span>
                </p>
              )}
              {Boolean(artwork.price && Number(artwork.price) > 0) && (
                <p className="catalog-body-th text-[11.5px] font-bold text-[#8C6D3F] leading-snug">
                  {formatPrice(artwork.price)}
                </p>
              )}
            </div>

            {/* 4. Concept / Curatorial Note (ต่อเนื่องกัน ไม่เว้นช่องว่าง จัดชิดขวา - ตัวอักษรใหญ่ขึ้น 25%) */}
            {artwork.description && (
              <div className="text-right w-full pt-1">
                <p className="catalog-body-th text-[10.5px] text-[#333333] leading-relaxed italic text-right line-clamp-8">
                  {artwork.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Footer & Page Number */}
        <div className="pt-2 border-t border-[#EAE5DC] flex items-center justify-between text-[9.5px] text-[#666666] mt-2">
          <span className="catalog-body-th truncate max-w-[150mm]">{plateFooter}</span>
          <span className="font-mono text-[#333333] font-bold text-[10px]">{pageNumber}</span>
        </div>
      </section>
    );
  }

  // ==========================================
  // 📄 FORMAT 1: STANDARD A4 (210 x 297 mm)
  // ==========================================
  return (
    <section className="catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm] bg-white border border-[#E0E0E0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border">
      <div>
        {/* Artwork Image Container */}
        <div className="relative w-full h-[175mm] max-h-[175mm] bg-white overflow-hidden mb-3 flex items-center justify-center">
          <img
            src={optimizedArtworkUrl}
            alt={artwork.title}
            loading={isReaderModal ? 'eager' : 'lazy'}
            decoding="async"
            className="max-h-full max-w-full object-contain"
          />
        </div>

        {/* Artist & Artwork Metadata */}
        <div className="relative z-10 flex flex-row items-start gap-5 pt-1">
          <div className="shrink-0 w-20 flex flex-col items-start">
            {/* Flag */}
            {flagUrl && (
              <div className="relative w-9 h-5 rounded-[2px] overflow-hidden border border-[#D0D0D0] shadow-sm mb-2 bg-[#F5F5F5]">
                <img
                  src={flagUrl}
                  alt={artist?.country || 'Flag'}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Artist Photo */}
            {hasRealPhoto ? (
              <div className="relative w-20 h-24 rounded-lg overflow-hidden shadow bg-[#1A1A1A]">
                <img
                  src={optimizedPhotoUrl}
                  alt={artist?.name || 'Artist'}
                  loading="lazy"
                  decoding="async"
                  onError={() => setPhotoError(true)}
                  className={`w-full h-full ${isAvatarFallback ? 'object-cover opacity-80' : 'object-cover'}`}
                />
                {isAvatarFallback && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-center py-0.5">
                    <span className="catalog-body-th text-[7px] text-white/80 font-medium leading-none">Artwork</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-20 h-24 bg-[#EFEFEF] border border-[#D0D0D0] rounded-lg flex flex-col items-center justify-center shadow-sm overflow-hidden">
                <span className="catalog-heading-th text-2xl font-bold text-[#444444] leading-none select-none">
                  {artist?.name?.trim().charAt(0).toUpperCase() || 'A'}
                </span>
                <span className="catalog-body-th text-[8px] text-[#999999] mt-1 font-medium leading-none">No Photo</span>
              </div>
            )}
          </div>

          <div className="flex-1 text-[#222222] min-w-0 space-y-2">
            <div className="space-y-0.5">
              <h3 className="catalog-heading-th text-sm font-bold text-[#000000] leading-snug">
                {artist?.name || 'Artist'}
              </h3>
              {artist?.email && (
                <p className="catalog-body-th text-[#666666] text-[10px] leading-normal">
                  {artist.email}
                </p>
              )}
              <p className="catalog-body-th text-[#666666] text-[10px] leading-normal">
                {artist?.country || 'International'}
              </p>
            </div>

            <div className="border-t border-[#E8E8E8] pt-2 space-y-0.5">
              <h4 className="catalog-heading-th font-serif text-sm font-bold text-[#111111] leading-snug">
                {artwork.title}
              </h4>
              <div className="text-[10px] text-[#555555] space-y-0.5">
                {artwork.medium && (
                  <p className="catalog-body-th leading-normal">
                    <span className="text-[#888888]">เทคนิค: </span>
                    <span className="text-[#222222]">{artwork.medium}</span>
                  </p>
                )}
                {artwork.dimensions && (
                  <p className="catalog-body-th leading-normal">
                    <span className="text-[#888888]">ขนาด: </span>
                    <span className="text-[#222222]">{artwork.dimensions}</span>
                  </p>
                )}
                {artwork.yearCreated && (
                  <p className="catalog-body-th leading-normal">
                    <span className="text-[#888888]">ปีที่สร้างสรรค์: </span>
                    <span className="text-[#222222]">{artwork.yearCreated}</span>
                  </p>
                )}
                {Boolean(artwork.price && Number(artwork.price) > 0) && (
                  <p className="catalog-body-th font-bold text-[#8C6D3F] pt-0.5 leading-normal">
                    {formatPrice(artwork.price)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#E0E0E0] flex items-center justify-between text-[10px] text-[#666666]">
        <span className="catalog-body-th truncate max-w-[170mm]">{plateFooter}</span>
        <span className="font-mono text-[#444444] font-bold">{pageNumber}</span>
      </div>
    </section>
  );
}
