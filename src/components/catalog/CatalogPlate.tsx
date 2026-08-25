'use client';

import React from 'react';
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
}

export function CatalogPlate({
  artwork,
  pageNumber,
  plateFooter,
  footerGraphicType,
  customFooterImageUrl,
  isReaderModal = false,
}: CatalogPlateProps) {
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
  const hasRealPhoto = resolvedPhotoUrl.length > 0;
  const isAvatarFallback = hasRealPhoto && !isRealAvatar;

  const optimizedArtworkUrl = getOptimizedImageUrl(artwork.imageUrl, {
    width: isReaderModal ? 1200 : 800,
    quality: isReaderModal ? 85 : 75,
  });

  const optimizedPhotoUrl = hasRealPhoto
    ? getOptimizedImageUrl(resolvedPhotoUrl, { width: 160, quality: 75 })
    : '';

  const flagUrl = getFlagImageUrl(artist?.country);

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

            <div className="space-y-0.5">
              <h4 className="catalog-heading-th text-xs sm:text-sm font-bold text-[#000000] leading-snug">
                {artwork.title}
              </h4>
              <p className="catalog-body-th text-[#444444] text-[10px] leading-normal font-medium">
                {[artwork.medium, artwork.dimensions, artwork.yearCreated ? `(${artwork.yearCreated})` : ''].filter(Boolean).join(' ')}
              </p>
            </div>

            {(artwork.concept?.trim() || artwork.description?.trim()) && (
              <div className="catalog-body-th pt-0.5 pb-1 text-[10px] sm:text-[11px] leading-relaxed text-[#333333] break-words">
                <span className="font-bold text-[#000000]">Concept : </span>
                <span>{artwork.concept?.trim() || artwork.description?.trim()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Graphic Preset */}
      {footerGraphicType === 'custom_image' && customFooterImageUrl ? (
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden z-0 flex items-end justify-center px-4 pb-2">
          <img src={customFooterImageUrl} alt="Footer Banner" loading="lazy" className="max-h-full max-w-full object-contain" />
        </div>
      ) : footerGraphicType === 'wave_mono' ? (
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden z-0 opacity-40">
          <svg viewBox="0 0 600 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`plateWaveMono-${artwork.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#444444" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#111111" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path d="M-30,120 C120,40 260,130 380,60 C480,0 560,90 630,30 L630,120 Z" fill={`url(#plateWaveMono-${artwork.id})`} />
          </svg>
        </div>
      ) : footerGraphicType === 'line_gold' ? (
        <div className="absolute bottom-10 left-8 right-8 border-b border-[#C5A880]/50 pointer-events-none z-0" />
      ) : footerGraphicType !== 'none' ? (
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden z-0 opacity-40">
          <svg viewBox="0 0 600 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
            <defs>
              <linearGradient id={`plateWave1-${artwork.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D0D0D0" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#B0B0B0" stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id={`plateWave2-${artwork.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F5B28B" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#EFA478" stopOpacity="0.15" />
              </linearGradient>
            </defs>
            <path d="M-30,120 C120,40 260,130 380,60 C480,0 560,90 630,30 L630,120 Z" fill={`url(#plateWave1-${artwork.id})`} />
            <path d="M-30,120 C90,90 220,20 370,80 C490,140 570,60 630,70 L630,120 Z" fill={`url(#plateWave2-${artwork.id})`} />
          </svg>
        </div>
      ) : null}

      {/* Footer Text Bar */}
      <div className="relative z-10 mt-3 pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[10px] text-[#777777]">
        <span>
          {plateFooter ? plateFooter : ''}
          {artwork.price ? (plateFooter ? ` • ${formatPrice(artwork.price)}` : formatPrice(artwork.price)) : ''}
        </span>
        <span className="font-mono text-[#555555] font-semibold">{pageNumber}</span>
      </div>
    </section>
  );
}
