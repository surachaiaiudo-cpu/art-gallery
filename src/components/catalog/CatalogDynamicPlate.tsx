'use client';

import React, { useState } from 'react';
import { Artwork } from '@/types/exhibition';
import { CatalogTemplateConfig, CatalogBlockElement } from '@/types/catalogTemplate';
import { formatPrice } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface CatalogDynamicPlateProps {
  artwork: Artwork;
  template: CatalogTemplateConfig;
  pageNumber: number;
  isReaderModal?: boolean;
  isPrintMode?: boolean;
  exhibitionSlug?: string;
  onBlockClick?: (blockId: string) => void;
  selectedBlockId?: string | null;
  onImageNaturalRatio?: (blockId: string, ratio: number) => void;
}

export function CatalogDynamicPlate({
  artwork,
  template,
  pageNumber,
  isReaderModal = false,
  isPrintMode = false,
  exhibitionSlug,
  onBlockClick,
  selectedBlockId,
  onImageNaturalRatio,
}: CatalogDynamicPlateProps) {
  const [photoError, setPhotoError] = useState(false);
  const [artworkImgError, setArtworkImgError] = useState(false);
  const artist = artwork.artist;

  const rawAvatarUrl = artist?.avatarUrl?.trim() || '';
  const UNSPLASH_PLACEHOLDERS = [
    'unsplash.com/photo-1507003211169',
    'unsplash.com/photo-1534528741775',
  ];
  const isRealAvatar =
    rawAvatarUrl.length > 0 &&
    !UNSPLASH_PLACEHOLDERS.some((p) => rawAvatarUrl.includes(p));
  const resolvedPhotoUrl = isRealAvatar ? rawAvatarUrl : (artwork.imageUrl || '');
  const hasRealPhoto = resolvedPhotoUrl.length > 0 && !photoError;

  const rawArtworkUrl = artwork.imageUrl || (artwork as any).image_url || (artwork as any).image || '';

  const optimizedArtworkUrl = artworkImgError
    ? rawArtworkUrl
    : getOptimizedImageUrl(rawArtworkUrl, {
        width: 1200,
        quality: 85,
      });

  const optimizedPhotoUrl = hasRealPhoto
    ? getOptimizedImageUrl(resolvedPhotoUrl, { width: 320, quality: 85 })
    : '';

  const flagUrl = getFlagImageUrl(artist?.country);

  // Dimensions in inches & millimeters
  const widthInches = template.pageWidthInches || 8.0;
  const heightInches = template.pageHeightInches || 8.0;
  const widthMm = (widthInches * 25.4).toFixed(1);
  const heightMm = (heightInches * 25.4).toFixed(1);

  // QR Code URL: Link directly to artwork or exhibition
  const qrTargetUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/exhibitions/${exhibitionSlug || ''}#art-${artwork.id}`
    : `https://art-gallery-4ty.pages.dev/exhibitions/${exhibitionSlug || ''}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrTargetUrl
  )}&bgcolor=ffffff&color=1a1918&margin=0`;

  // Render individual block content
  const renderBlockContent = (block: CatalogBlockElement) => {
    const s = block.style || {};
    const resolveFontFamily = (f?: string) => {
      switch (f) {
        case 'Sarabun':
          return "'Sarabun', -apple-system, BlinkMacSystemFont, 'Noto Sans Thai', sans-serif";
        case 'Cinzel':
          return "'Cinzel', 'Times New Roman', Georgia, serif";
        case 'Inter':
          return "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
        case 'Prompt':
          return "'Prompt', 'Noto Sans Thai', sans-serif";
        case 'Maitree':
        default:
          return "'Maitree', 'Noto Serif Thai', Georgia, serif";
      }
    };

    const resolveFontWeight = (w?: string, fallback = 400) => {
      switch (w) {
        case 'light':
          return 300;
        case 'normal':
          return 400;
        case 'medium':
          return 500;
        case 'semibold':
          return 600;
        case 'bold':
          return 700;
        case 'black':
          return 900;
        default:
          return fallback;
      }
    };

    const resolveBorderRadius = () => {
      if (
        s.borderTopLeftRadius !== undefined ||
        s.borderTopRightRadius !== undefined ||
        s.borderBottomRightRadius !== undefined ||
        s.borderBottomLeftRadius !== undefined
      ) {
        return `${s.borderTopLeftRadius || 0}px ${s.borderTopRightRadius || 0}px ${s.borderBottomRightRadius || 0}px ${s.borderBottomLeftRadius || 0}px`;
      }
      return s.borderRadius !== undefined ? `${s.borderRadius}px` : undefined;
    };

    switch (block.type) {
      case 'artwork_image':
        const imgJustify = s.textAlign === 'left' ? 'justify-start' : s.textAlign === 'right' ? 'justify-end' : 'justify-center';
        return (
          <div className={`w-full h-full flex items-center ${imgJustify} overflow-hidden p-0`}>
            {rawArtworkUrl ? (
              <img
                src={optimizedArtworkUrl || rawArtworkUrl}
                alt={artwork.title || 'Artwork'}
                loading="eager"
                decoding="async"
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight && onImageNaturalRatio) {
                    onImageNaturalRatio(block.id, img.naturalWidth / img.naturalHeight);
                  }
                }}
                onError={() => {
                  if (!artworkImgError) setArtworkImgError(true);
                }}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: s.objectFit || 'contain',
                  borderRadius: resolveBorderRadius(),
                }}
                className="w-full h-full transition-transform duration-300 block select-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5F4F0] border border-[#DDD] text-[#999] rounded p-4 text-center">
                <span className="text-xs font-mono">No Image</span>
              </div>
            )}
          </div>
        );

      case 'artist_photo':
        const photoJustify = s.textAlign === 'left' ? 'justify-start' : s.textAlign === 'right' ? 'justify-end' : 'justify-center';
        return (
          <div className={`w-full h-full flex items-center ${photoJustify} overflow-hidden p-0`}>
            {hasRealPhoto ? (
              <img
                src={optimizedPhotoUrl}
                alt={artist?.name || 'Artist'}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  if (img.naturalWidth && img.naturalHeight && onImageNaturalRatio) {
                    onImageNaturalRatio(block.id, img.naturalWidth / img.naturalHeight);
                  }
                }}
                onError={() => setPhotoError(true)}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: s.objectFit || 'cover',
                  borderRadius: resolveBorderRadius(),
                  borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
                  borderColor: s.borderColor,
                }}
                className="w-full h-full block select-none"
              />
            ) : (
              <div
                style={{
                  borderRadius: resolveBorderRadius(),
                  borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
                  borderColor: s.borderColor || '#D0D0D0',
                }}
                className="w-full h-full bg-[#EFEFEF] flex flex-col items-center justify-center"
              >
                <span className="catalog-heading-th text-lg font-bold text-[#555]">
                  {artist?.name?.trim().charAt(0).toUpperCase() || 'A'}
                </span>
              </div>
            )}
          </div>
        );

      case 'country_flag':
        if (!flagUrl) return null;
        const flagJustify = s.textAlign === 'left' ? 'justify-start' : s.textAlign === 'right' ? 'justify-end' : 'justify-center';
        return (
          <div className={`w-full h-full overflow-hidden flex items-center ${flagJustify}`}>
            <img
              src={flagUrl}
              alt={artist?.country || 'Country'}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth && img.naturalHeight && onImageNaturalRatio) {
                  onImageNaturalRatio(block.id, img.naturalWidth / img.naturalHeight);
                }
              }}
              style={{
                objectFit: s.objectFit || 'cover',
                borderRadius: resolveBorderRadius(),
                borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
                borderColor: s.borderColor || '#D0D0D0',
              }}
              className="w-full h-full shadow-2xs block select-none"
            />
          </div>
        );

      case 'artwork_title':
        return (
          <h3
            className="leading-tight w-full block"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '13pt',
              fontWeight: resolveFontWeight(s.fontWeight, 700),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
              color: s.color || '#8B1B1B',
              textAlign: s.textAlign || 'left',
              letterSpacing: s.letterSpacing,
            }}
          >
            {s.prefixText || ''}{artwork.title || 'Untitled'}{s.suffixText || ''}
          </h3>
        );

      case 'artist_name':
        return (
          <div
            className="leading-tight w-full block"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '14pt',
              fontWeight: resolveFontWeight(s.fontWeight, 600),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
              color: s.color || '#1A1918',
              textAlign: s.textAlign || 'left',
            }}
          >
            {s.prefixText || ''}{artist?.name || 'Artist'}{s.suffixText || ''}
          </div>
        );

      case 'artist_email':
        const emailVal = artist?.email;
        if (!emailVal && s.hideIfEmpty) return null;
        return (
          <div
            className="leading-normal w-full block"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '9pt',
              fontWeight: resolveFontWeight(s.fontWeight, 400),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
              color: s.color || '#666666',
              textAlign: s.textAlign || 'left',
              letterSpacing: s.letterSpacing,
            }}
          >
            {s.prefixText || ''}{emailVal || 'artist@artvara.gallery'}{s.suffixText || ''}
          </div>
        );

      case 'medium':
        if (!artwork.medium && s.hideIfEmpty) return null;
        return (
          <div
            className="leading-normal w-full block"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '10pt',
              fontWeight: resolveFontWeight(s.fontWeight, 400),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
              color: s.color || '#444444',
              textAlign: s.textAlign || 'left',
            }}
          >
            {s.prefixText || ''}{artwork.medium || 'Mixed Media'}{s.suffixText || ''}
          </div>
        );

      case 'dimensions':
        if (!artwork.dimensions && s.hideIfEmpty) return null;
        return (
          <div
            className="leading-normal w-full block"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '10pt',
              fontWeight: resolveFontWeight(s.fontWeight, 400),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
              color: s.color || '#666666',
              textAlign: s.textAlign || 'left',
            }}
          >
            {s.prefixText || ''}{artwork.dimensions || '100 x 100 cm.'}{s.suffixText || ''}
          </div>
        );

      case 'year_created':
        if (!artwork.yearCreated && s.hideIfEmpty) return null;
        return (
          <div
            className="leading-normal w-full block"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '10pt',
              fontWeight: resolveFontWeight(s.fontWeight, 400),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
              color: s.color || '#777777',
              textAlign: s.textAlign || 'left',
            }}
          >
            {s.prefixText || ''}{artwork.yearCreated || '2026'}{s.suffixText || ''}
          </div>
        );

      case 'price':
        if (artwork.price === undefined || artwork.price === null) {
          if (s.hideIfEmpty) return null;
          return null;
        }
        return (
          <div
            className="leading-normal w-full block"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '11pt',
              fontWeight: resolveFontWeight(s.fontWeight, 600),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
              color: s.color || '#8B1B1B',
              textAlign: s.textAlign || 'left',
            }}
          >
            {s.prefixText || '฿'}{formatPrice(artwork.price)}{s.suffixText || ''}
          </div>
        );

      case 'concept':
        const conceptText = artwork.concept || artwork.description;
        if (!conceptText && s.hideIfEmpty) return null;
        return (
          <div
            className="leading-relaxed w-full h-full block overflow-hidden"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '8.5pt',
              fontWeight: resolveFontWeight(s.fontWeight, 400),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
              color: s.color || '#555555',
              textAlign: s.textAlign || 'left',
              lineHeight: s.lineHeight || 1.4,
            }}
          >
            {s.prefixText || ''}{conceptText || ''}{s.suffixText || ''}
          </div>
        );

      case 'qr_code':
        return (
          <div className="w-full h-full flex flex-col items-center justify-center p-1 bg-white">
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="w-full h-full object-contain"
              style={{
                borderRadius: s.borderRadius ? `${s.borderRadius}px` : undefined,
              }}
            />
          </div>
        );

      case 'page_number':
        return (
          <div
            className="w-full block"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '8pt',
              fontWeight: resolveFontWeight(s.fontWeight, 400),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
              color: s.color || '#888888',
              textAlign: s.textAlign || 'center',
            }}
          >
            {s.prefixText || ''}{pageNumber || 1}{s.suffixText || ''}
          </div>
        );

      case 'custom_text':
        return (
          <div
            className="leading-normal w-full block"
            style={{
              fontFamily: resolveFontFamily(s.fontFamily),
              fontSize: s.fontSizePt ? `${s.fontSizePt}pt` : '10pt',
              color: s.color || '#1A1918',
              textAlign: s.textAlign || 'left',
              fontWeight: resolveFontWeight(s.fontWeight, 400),
              fontStyle: s.fontStyle || 'normal',
              textDecoration: s.textDecoration || 'none',
            }}
          >
            {block.customContent || s.prefixText || 'Custom Text'}
          </div>
        );

      case 'custom_box':
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: s.backgroundColor || 'transparent',
              borderWidth: s.borderWidth ? `${s.borderWidth}px` : undefined,
              borderColor: s.borderColor || '#E0E0E0',
              borderStyle: s.borderStyle || 'solid',
              borderRadius: s.borderRadius ? `${s.borderRadius}px` : undefined,
            }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <section
      data-plate-id={artwork.id}
      className={`catalog-dynamic-page relative overflow-hidden transition-all select-none box-border ${
        isPrintMode ? 'print-exact-page' : 'shadow-xl mx-auto border border-[#E0E0E0]'
      }`}
      style={{
        width: isPrintMode ? `${widthMm}mm` : '100%',
        height: isPrintMode ? `${heightMm}mm` : '100%',
        aspectRatio: `${widthInches} / ${heightInches}`,
        maxWidth: `${widthMm}mm`,
        maxHeight: `${heightMm}mm`,
        backgroundColor: template.backgroundColor || '#FFFFFF',
      }}
    >
      {/* Dynamic Blocks Container */}
      <div className="relative w-full h-full overflow-hidden">
        {template.blocks.map((block) => {
          // Convert inch coordinates to percentage relative to page dimensions
          const leftPct = (block.xInches / widthInches) * 100;
          const topPct = (block.yInches / heightInches) * 100;
          const widthPct = (block.widthInches / widthInches) * 100;
          const effectiveHeightInches =
            block.type === 'artist_photo'
              ? Math.min(block.heightInches, 1.5)
              : block.heightInches;
          const heightPct = (effectiveHeightInches / heightInches) * 100;

          const isSelected = selectedBlockId === block.id;
          const s = block.style || {};
          const isConcept = block.type === 'concept';

          return (
            <div
              key={block.id}
              onClick={(e) => {
                if (onBlockClick) {
                  e.stopPropagation();
                  onBlockClick(block.id);
                }
              }}
              className={`absolute overflow-hidden transition-all ${
                isSelected ? 'ring-2 ring-[#8B1B1B] z-50' : ''
              } ${onBlockClick ? 'cursor-pointer hover:ring-1 hover:ring-[#8C6D3F]/60' : ''}`}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                width: `${widthPct}%`,
                height: `${heightPct}%`,
                zIndex: block.zIndex || 1,
                backgroundColor: isConcept ? 'transparent' : s.backgroundColor || 'transparent',
                borderRadius: isConcept ? undefined : s.borderRadius ? `${s.borderRadius}px` : undefined,
                borderWidth: isConcept ? undefined : s.borderWidth ? `${s.borderWidth}px` : undefined,
                borderColor: isConcept ? 'transparent' : s.borderColor || 'transparent',
                borderStyle: isConcept ? 'none' : s.borderStyle || 'solid',
                boxShadow: isConcept
                  ? 'none'
                  : s.boxShadow === 'sm'
                  ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                  : s.boxShadow === 'md'
                  ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  : s.boxShadow === 'lg'
                  ? '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  : undefined,
              }}
            >
              {renderBlockContent(block)}
            </div>
          );
        })}
      </div>
    </section>
  );
}
