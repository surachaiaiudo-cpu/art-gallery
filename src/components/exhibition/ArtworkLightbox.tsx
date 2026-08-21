'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Artwork } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Move,
  Maximize2,
  Minimize2,
  Sliders,
} from 'lucide-react';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { ArtistAvatar } from '@/components/ui/ArtistAvatar';
import { formatDimensionsInCm } from '@/lib/utils';

interface ArtworkLightboxProps {
  artwork: Artwork | null;
  artworksList: Artwork[];
  isOpen: boolean;
  onClose: () => void;
  onSelectArtwork: (art: Artwork) => void;
  onOpenInquiry: (art: Artwork) => void;
}

export function ArtworkLightbox({
  artwork,
  artworksList,
  isOpen,
  onClose,
  onSelectArtwork,
  onOpenInquiry,
}: ArtworkLightboxProps) {
  const { lang, t } = useLanguage();
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset zoom & pan when artwork changes or opens
  useEffect(() => {
    setZoomLevel(1);
    setPan({ x: 0, y: 0 });
  }, [artwork?.id, isOpen]);

  // Handle Zoom In / Out with limits (1x to 8x)
  const handleZoom = useCallback((newZoom: number) => {
    const clamped = Math.min(Math.max(newZoom, 1), 8);
    setZoomLevel(clamped);
    if (clamped === 1) {
      setPan({ x: 0, y: 0 });
    }
  }, []);

  // Mouse Wheel Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.005;
    const newZoom = zoomLevel + delta;
    handleZoom(newZoom);
  };

  // Mouse Drag to Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const maxPanX = (zoomLevel - 1) * 350;
    const maxPanY = (zoomLevel - 1) * 250;

    const nextX = e.clientX - dragStart.x;
    const nextY = e.clientY - dragStart.y;

    setPan({
      x: Math.min(Math.max(nextX, -maxPanX), maxPanX),
      y: Math.min(Math.max(nextY, -maxPanY), maxPanY),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Double Click Zoom
  const handleDoubleClick = () => {
    if (zoomLevel > 1.5) {
      handleZoom(1);
    } else {
      handleZoom(4);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') handleZoom(zoomLevel + 1);
      if (e.key === '-' || e.key === '_') handleZoom(zoomLevel - 1);
      if (e.key === '0') handleZoom(1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, zoomLevel, handleZoom, onClose]);

  if (!isOpen || !artwork) return null;

  const currentIndex = artworksList.findIndex((a) => a.id === artwork.id);
  const prevArtwork = currentIndex > 0 ? artworksList[currentIndex - 1] : null;
  const nextArtwork = currentIndex < artworksList.length - 1 ? artworksList[currentIndex + 1] : null;
  const artist = artwork.artist;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-lg animate-fade-in select-none">
      {/* Top right close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 p-2.5 rounded-full bg-black/70 text-white/90 hover:text-white hover:bg-black transition-all shadow-lg border border-white/20"
        title={t.actions.close}
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev / Next Buttons */}
      {prevArtwork && zoomLevel === 1 && (
        <button
          onClick={() => onSelectArtwork(prevArtwork)}
          className="hidden md:flex absolute left-4 sm:left-6 z-40 p-3 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all items-center justify-center border border-white/20 shadow-lg"
          title={t.actions.prev}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {nextArtwork && zoomLevel === 1 && (
        <button
          onClick={() => onSelectArtwork(nextArtwork)}
          className="hidden md:flex absolute right-4 sm:right-6 z-40 p-3 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition-all items-center justify-center border border-white/20 shadow-lg"
          title={t.actions.next}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Modal Container */}
      <div
        className={`relative w-full ${
          isFullscreen ? 'max-w-none h-screen rounded-none' : 'max-w-6xl max-h-[92vh] rounded-2xl'
        } bg-[#FAF8F5] border border-[#DDD6C8] shadow-2xl overflow-hidden flex flex-col lg:flex-row transition-all duration-200`}
      >
        {/* Left: High-Res Interactive Deep-Zoom Canvas */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          className={`relative flex-1 bg-[#100F0E] min-h-[350px] sm:min-h-[480px] lg:min-h-[620px] flex items-center justify-center p-4 sm:p-8 overflow-hidden ${
            zoomLevel > 1
              ? isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
              : 'cursor-zoom-in'
          }`}
        >
          {/* Main Zoomed Artwork Container */}
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            }}
            className="relative w-full h-full max-h-[78vh] flex items-center justify-center pointer-events-none"
          >
            <Image
              src={artwork.imageUrl}
              alt={artwork.title}
              width={1600}
              height={1200}
              className="object-contain max-h-[75vh] rounded shadow-2xl"
              priority
              quality={100}
            />
          </div>

          {/* Deep Zoom Level Controller HUD (Top Left inside canvas) */}
          <div className="absolute top-4 left-4 z-30 flex items-center gap-2 bg-black/80 backdrop-blur-md p-1.5 rounded-full border border-white/20 text-white shadow-xl">
            <button
              onClick={() => handleZoom(zoomLevel - 0.75)}
              disabled={zoomLevel <= 1}
              className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <span className="font-mono text-xs font-bold px-2 text-[#E2CEB5] min-w-[58px] text-center">
              {(zoomLevel * 100).toFixed(0)}% ({zoomLevel.toFixed(1)}x)
            </span>

            <button
              onClick={() => handleZoom(zoomLevel + 0.75)}
              disabled={zoomLevel >= 8}
              className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-30 transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-white/30 mx-0.5" />

            {/* Quick Preset Buttons (1x, 2x, 4x, 8x) */}
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
              <button
                onClick={() => handleZoom(1)}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  zoomLevel === 1 ? 'bg-[#C5A880] text-[#1A1918]' : 'hover:bg-white/20 text-neutral-300'
                }`}
              >
                1x
              </button>
              <button
                onClick={() => handleZoom(2)}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  zoomLevel === 2 ? 'bg-[#C5A880] text-[#1A1918]' : 'hover:bg-white/20 text-neutral-300'
                }`}
              >
                2x
              </button>
              <button
                onClick={() => handleZoom(4)}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  zoomLevel === 4 ? 'bg-[#C5A880] text-[#1A1918]' : 'hover:bg-white/20 text-neutral-300'
                }`}
              >
                4x
              </button>
              <button
                onClick={() => handleZoom(8)}
                className={`px-2 py-0.5 rounded-full transition-all ${
                  zoomLevel === 8 ? 'bg-[#C5A880] text-[#1A1918]' : 'hover:bg-white/20 text-neutral-300'
                }`}
                title="Ultra High-Res 8x Detail"
              >
                8x
              </button>
            </div>

            {zoomLevel > 1 && (
              <button
                onClick={() => handleZoom(1)}
                className="p-1.5 rounded-full hover:bg-white/20 text-neutral-300 hover:text-white transition-colors ml-1"
                title={lang === 'th' ? 'รีเซ็ตกลับเป็น 1x' : 'Reset Zoom'}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Minimap / Radar Viewport (Bottom Left inside canvas when zoomed) */}
          {zoomLevel > 1 && (
            <div className="absolute bottom-4 left-4 z-20 w-28 aspect-[4/3] bg-black/80 rounded-lg border border-white/30 overflow-hidden shadow-2xl p-1 pointer-events-none hidden sm:block">
              <div className="relative w-full h-full opacity-60">
                <Image src={artwork.imageUrl} alt={artwork.title} fill className="object-cover rounded" />
                {/* Viewport Frame Box */}
                <div
                  style={{
                    width: `${100 / zoomLevel}%`,
                    height: `${100 / zoomLevel}%`,
                    transform: `translate(${-pan.x / (zoomLevel * 3)}px, ${-pan.y / (zoomLevel * 3)}px)`,
                  }}
                  className="absolute inset-0 m-auto border-2 border-[#C5A880] bg-[#C5A880]/20 rounded-sm"
                />
              </div>
            </div>
          )}

          {/* Zoom Help Prompt (Bottom Right inside canvas) */}
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 bg-black/75 backdrop-blur px-3 py-1.5 rounded-full text-[11px] text-neutral-300 border border-white/15">
            <Move className="w-3 h-3 text-[#C5A880]" />
            <span>
              {zoomLevel > 1
                ? lang === 'th'
                  ? 'คลิกลากเมาส์เพื่อเลื่อนดูรายละเอียด (สูงสุด 8x)'
                  : 'Drag to pan around artwork (up to 8x)'
                : lang === 'th'
                ? 'หมุนลูกกลิ้งเมาส์ หรือ ดับเบิ้ลคลิก เพื่อซูมขยาย'
                : 'Double-click or scroll wheel to zoom'}
            </span>
          </div>
        </div>

        {/* Right: Curatorial Information & Concept */}
        <div className="w-full lg:w-[380px] xl:w-[420px] bg-[#FAF8F5] p-6 sm:p-8 flex flex-col justify-between overflow-y-auto border-t lg:border-t-0 lg:border-l border-[#E2DDD2]">
          <div>
            {/* Index tag & Flag Bubble */}
            <div className="flex items-center justify-between mb-3 text-xs">
              <span className="uppercase tracking-widest text-[#8C6D3F] font-bold">
                {t.actions.plate} #{currentIndex + 1} / {artworksList.length}
              </span>
              <div
                className="w-7 h-7 rounded-full overflow-hidden border border-[#C5A880] shadow-sm flex items-center justify-center bg-white"
                title={artist?.country || 'Country'}
              >
                <CountryFlag country={artist?.country} size="badge" shape="circle" />
              </div>
            </div>

            {/* Title & Artist Profile */}
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F1D1A] leading-tight mb-1">
              {artwork.title}
            </h2>

            <div className="flex items-center justify-between gap-3 my-4 p-3 bg-white rounded-xl border border-[#EAE4D8] shadow-sm">
              <div className="flex items-center gap-3 min-w-0">
                <div className="border border-[#C5A880] rounded-full shadow shrink-0">
                  <ArtistAvatar name={artist?.name} avatarUrl={artist?.avatarUrl} size="md" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-[#1A1918] truncate">{artist?.name || 'Featured Artist'}</p>
                  {artist?.email && (
                    <p className="text-[11px] text-[#8C6D3F] font-mono truncate">{artist.email}</p>
                  )}
                </div>
              </div>

              <div
                className="w-7 h-7 rounded-full overflow-hidden border border-[#C5A880] shadow-sm flex items-center justify-center bg-white shrink-0"
                title={artist?.country || 'Country'}
              >
                <CountryFlag country={artist?.country} size="badge" shape="circle" />
              </div>
            </div>

            {/* Spec Table */}
            <div className="bg-white/90 rounded-xl p-4 border border-[#E8E3D8] space-y-2 text-xs mb-5 shadow-sm">
              <div className="flex justify-between py-1 border-b border-[#F0EBE0]">
                <span className="text-[#878073]">{t.specs.medium}</span>
                <span className="font-medium text-[#2C2924]">{artwork.medium}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE0]">
                <span className="text-[#878073]">{t.specs.dimensions}</span>
                <span className="font-medium text-[#2C2924]">{formatDimensionsInCm(artwork.dimensions, lang)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#F0EBE0]">
                <span className="text-[#878073]">{t.specs.year}</span>
                <span className="font-medium text-[#2C2924]">{artwork.yearCreated || '2026'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#878073]">{t.specs.status}</span>
                <span className="font-bold text-emerald-800">{t.specs.onDisplay}</span>
              </div>
            </div>

            {/* Concept / Statement */}
            <div className="text-xs text-[#5C564B] leading-relaxed mb-6 space-y-1.5">
              <span className="font-bold text-[#1A1918] block">{t.specs.concept}:</span>
              <p className="italic bg-[#F4F1EA] p-3.5 rounded-lg border border-[#EAE4D8] max-h-44 overflow-y-auto leading-relaxed">
                "{artwork.concept || artwork.description || 'This work investigates sacred cultural heritage and contemporary memory.'}"
              </p>
            </div>
          </div>

          {/* Action button */}
          <div className="pt-4 border-t border-[#E8E3D8]">
            <button
              onClick={() => onOpenInquiry(artwork)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow active:scale-[0.99]"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.actions.inquireCurator}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
