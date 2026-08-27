'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Layers,
  ZoomIn,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { Exhibition, PeerReviewer } from '@/types/exhibition';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { formatDimensionsInCm } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface Catalog3DFlipbookProps {
  exhibition: Exhibition;
  peerReviewers: PeerReviewer[];
  coverFooter: string;
  plateFooter: string;
  onOpenZoomModal: (artworkIndex: number) => void;
  onBackToGrid: () => void;
}

// Procedural Web Audio Page Turn Sound Synthesizer (Zero asset download needed!)
function playProceduralPageTurnSound(isMuted: boolean) {
  if (isMuted || typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // White noise buffer for paper swoosh
    const bufferSize = ctx.sampleRate * 0.18; // 180ms
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    // Filter to simulate paper friction
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(900, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.16);
    filter.Q.setValueAtTime(2.0, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.18);
  } catch (err) {
    // Audio context may be restricted by autoplay policy
  }
}

export function Catalog3DFlipbook({
  exhibition,
  peerReviewers,
  coverFooter,
  plateFooter,
  onOpenZoomModal,
  onBackToGrid,
}: Catalog3DFlipbookProps) {
  const { lang } = useLanguage();
  const artworks = exhibition.artworks || [];
  const hasReviewers = peerReviewers.length > 0;

  // Pages structure:
  // Page 0: Cover (Single right-side in open book)
  // Page 1: Curator Statement & Peer Reviewers
  // Page 2..N: Artworks (1 artwork per page)
  // Page N+1: Colophon / Back Cover
  const totalPages = 1 + (hasReviewers ? 1 : 0) + artworks.length + 1;

  // Current open spread (0 = cover, 1 = pages 1-2, 2 = pages 3-4, etc.)
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Turn to next page
  const handleNext = useCallback(() => {
    if (isFlipping || currentPage >= totalPages - 1) return;
    setIsFlipping(true);
    playProceduralPageTurnSound(isMuted);

    setTimeout(() => {
      setCurrentPage((prev) => Math.min(prev + 2, totalPages - 1));
      setIsFlipping(false);
    }, 400);
  }, [isFlipping, currentPage, totalPages, isMuted]);

  // Turn to previous page
  const handlePrev = useCallback(() => {
    if (isFlipping || currentPage <= 0) return;
    setIsFlipping(true);
    playProceduralPageTurnSound(isMuted);

    setTimeout(() => {
      setCurrentPage((prev) => Math.max(prev - 2, 0));
      setIsFlipping(false);
    }, 400);
  }, [isFlipping, currentPage, isMuted]);

  // Keyboard arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Helper to render individual page content
  const renderPageContent = (pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= totalPages) {
      return (
        <div className="w-full h-full bg-[#1A1918] flex items-center justify-center text-white/20 font-serif">
          ARTVARA
        </div>
      );
    }

    // 1. Cover Page
    if (pageIndex === 0) {
      return (
        <div className="w-full h-full bg-gradient-to-br from-[#1E1C1A] via-[#141312] to-[#0A0908] text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden border-l border-white/10 shadow-2xl">
          {/* Gold border accent */}
          <div className="absolute inset-4 border border-[#C5A880]/30 pointer-events-none" />
          <div className="absolute inset-5 border border-[#C5A880]/15 pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 text-center pt-4">
            <div className="font-serif tracking-[0.3em] text-[#C5A880] text-xs font-bold uppercase">
              ARTVARA VIRTUAL MUSEUM
            </div>
            <div className="text-[10px] text-white/50 tracking-widest mt-1 uppercase">
              Official Exhibition Publication
            </div>
          </div>

          {/* Exhibition Title & Hero Banner */}
          <div className="relative z-10 text-center space-y-4 my-auto">
            {exhibition.bannerUrl && (
              <div className="relative w-36 h-36 mx-auto rounded-full overflow-hidden border-2 border-[#C5A880]/50 shadow-2xl">
                <Image
                  src={exhibition.bannerUrl}
                  alt={exhibition.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#FAF8F5] max-w-sm mx-auto leading-snug">
              {exhibition.title}
            </h1>
            <div className="w-12 h-0.5 bg-[#C5A880] mx-auto opacity-70" />
            <p className="text-xs text-[#D5CEC0] font-light max-w-xs mx-auto">
              Curated by {exhibition.curator?.name || 'ARTVARA Curatorial Team'}
            </p>
          </div>

          {/* Bottom Publication Bar */}
          <div className="relative z-10 text-center border-t border-white/10 pt-4">
            <p className="text-[10px] font-mono text-[#C5A880]">
              {artworks.length} Masterworks • First Edition
            </p>
            <p className="text-[9px] text-white/40 mt-1">{coverFooter}</p>
          </div>
        </div>
      );
    }

    // 2. Statement / Curatorial Page
    if (pageIndex === 1 && hasReviewers) {
      return (
        <div className="w-full h-full bg-[#FAF8F5] text-[#1A1918] p-8 sm:p-10 flex flex-col justify-between border-r border-[#EAE5DC] overflow-y-auto">
          <div className="space-y-4">
            <div className="border-b border-[#D5CEC0] pb-3">
              <span className="text-[10px] uppercase tracking-widest text-[#8C6D3F] font-bold">
                Curatorial Statement
              </span>
              <h2 className="font-serif text-xl font-bold text-[#1A1918] mt-1">
                บทนำและแนวความคิด
              </h2>
            </div>

            <p className="text-xs text-[#4A453C] leading-relaxed font-serif text-justify line-clamp-10">
              {exhibition.curatorNote ||
                'นิทรรศการศิลปกรรมร่วมสมัย รวบรวมผลงานอันทรงคุณค่าที่สะท้อนถึงสุนทรียศาสตร์และอัตลักษณ์ทางวัฒนธรรม โดยคัดสรรผลงานจากศิลปินผู้ทรงคุณวุฒิ'}
            </p>

            {peerReviewers.length > 0 && (
              <div className="pt-3 border-t border-[#EAE5DC] space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-[#8C6D3F] font-bold">
                  Peer Review Committee
                </span>
                <div className="space-y-1.5">
                  {peerReviewers.slice(0, 3).map((r, i) => (
                    <div key={i} className="text-[11px] text-[#2C2822]">
                      <span className="font-semibold">{r.name}</span>
                      {r.institution && (
                        <span className="text-[#7A7468] text-[10px] block">
                          {r.institution} • {r.country}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="text-[9px] font-mono text-[#A0988A] pt-4 border-t border-[#EAE5DC] flex justify-between">
            <span>Page {pageIndex}</span>
            <span>ARTVARA CATALOG</span>
          </div>
        </div>
      );
    }

    // 3. Artwork Plate Page
    const artOffset = hasReviewers ? 2 : 1;
    const artIndex = pageIndex - artOffset;
    const art = artworks[artIndex];

    if (art) {
      return (
        <div className="w-full h-full bg-[#FAF8F5] text-[#1A1918] p-6 sm:p-8 flex flex-col justify-between relative group">
          {/* Top Plate Index */}
          <div className="flex items-center justify-between border-b border-[#EAE5DC] pb-2 text-[10px] text-[#7A7468]">
            <span className="font-mono font-bold text-[#8C6D3F]">
              PLATE #{art.displayOrder || artIndex + 1}
            </span>
            <button
              onClick={() => onOpenZoomModal(artIndex)}
              className="inline-flex items-center gap-1 text-[10px] text-[#8C6D3F] hover:text-[#1A1918] transition-colors"
            >
              <ZoomIn className="w-3 h-3" />
              <span>{lang === 'th' ? 'ซูม 4K' : 'Inspect 4K'}</span>
            </button>
          </div>

          {/* Artwork Image */}
          <div className="relative flex-1 w-full my-3 rounded-lg overflow-hidden bg-neutral-200 shadow-inner flex items-center justify-center p-2">
            {art.imageUrl ? (
              <div className="relative w-full h-full">
                <Image
                  src={art.imageUrl}
                  alt={art.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="text-xs text-neutral-400">No Image</div>
            )}
          </div>

          {/* Artwork Details Caption */}
          <div className="space-y-1.5 pt-2 border-t border-[#EAE5DC]">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold text-[#1A1918] truncate" title={art.title}>
                {art.title}
              </h3>
              <span className="text-[10px] font-mono text-[#7A7468]">
                {art.yearCreated || 2026}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#5A554A] font-medium">
              {art.artist?.country && (
                <CountryFlag country={art.artist.country} className="w-3.5 h-2.5 shrink-0" />
              )}
              <span className="truncate">{art.artist?.name || 'Artist'}</span>
            </div>

            <div className="text-[10px] text-[#7A7468] truncate">
              {art.medium} • {formatDimensionsInCm(art.dimensions, lang)}
            </div>
          </div>

          {/* Page Number Footer */}
          <div className="text-[9px] font-mono text-[#A0988A] pt-2 flex justify-between items-center">
            <span>{plateFooter}</span>
            <span>Page {pageIndex}</span>
          </div>
        </div>
      );
    }

    // 4. Back Cover / Colophon
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#141312] to-[#0A0908] text-white p-8 sm:p-12 flex flex-col justify-between text-center border-r border-white/10 shadow-2xl relative">
        <div className="absolute inset-4 border border-[#C5A880]/20 pointer-events-none" />

        <div className="my-auto space-y-4 relative z-10">
          <div className="font-serif tracking-[0.3em] text-[#C5A880] text-sm font-bold uppercase">
            ARTVARA
          </div>
          <p className="text-xs text-[#D5CEC0] max-w-xs mx-auto font-light">
            International Virtual Museum & Contemporary Art Gallery Publication
          </p>
          <div className="w-8 h-0.5 bg-[#C5A880] mx-auto opacity-50" />
          <p className="text-[10px] text-white/40 font-mono">
            ISBN: 978-616-000-000-0 • Bangkok, Thailand
          </p>
        </div>

        <div className="text-[10px] text-[#C5A880]/70 font-mono border-t border-white/10 pt-4 relative z-10">
          © 2026 ARTVARA. All rights reserved.
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#141312] text-white select-none flex flex-col justify-between ${
        isFullscreen ? 'fixed inset-0 z-50 p-4' : 'min-h-[750px] rounded-3xl p-4 sm:p-8 shadow-2xl border border-white/10 my-6'
      }`}
    >
      {/* 1. Top Control Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToGrid}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-[#FAF8F5] transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'กลับมุมมอง Grid' : 'Grid View'}</span>
          </button>

          <span className="hidden sm:inline-block text-xs font-serif text-[#C5A880]">
            📖 3D Flipbook Reader
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-xl border transition-all ${
              isMuted
                ? 'bg-white/5 border-white/10 text-white/40'
                : 'bg-[#C5A880]/20 border-[#C5A880]/40 text-[#C5A880]'
            }`}
            title={isMuted ? 'เปิดเสียงเปิดหน้ากระดาษ' : 'ปิดเสียง'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Thumbnails Drawer Toggle */}
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              showThumbnails
                ? 'bg-[#C5A880] text-[#1A1918] border-[#C5A880]'
                : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {lang === 'th' ? 'สารบัญภาพ' : 'Pages'}
            </span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white transition-all"
            title={isFullscreen ? 'ออกจากเต็มจอ' : 'เต็มจอ'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. 3D Book Container with Realistic Spread and Shadow */}
      <div className="relative flex-1 flex items-center justify-center my-6 perspective-1000">
        {/* Previous Button (Floating Left) */}
        <button
          onClick={handlePrev}
          disabled={currentPage <= 0 || isFlipping}
          className="absolute left-2 sm:left-4 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-[#C5A880] hover:text-[#1A1918] text-white border border-white/20 flex items-center justify-center shadow-2xl transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-95"
          title="หน้าก่อนหน้า (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* 3D Book Spine & Two-Page Spread */}
        <div className="relative w-full max-w-4xl aspect-[1.42/1] bg-[#0E0D0C] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] border border-white/10 flex overflow-hidden">
          {/* Left Page */}
          <div className="w-1/2 h-full border-r border-black/30 shadow-[inset_-25px_0_30px_rgba(0,0,0,0.15)] relative">
            {renderPageContent(currentPage === 0 ? -1 : currentPage)}
          </div>

          {/* Book Center Spine Shadow */}
          <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-gradient-to-r from-black/40 via-transparent to-black/40 pointer-events-none z-20" />

          {/* Right Page */}
          <div className="w-1/2 h-full shadow-[inset_25px_0_30px_rgba(0,0,0,0.15)] relative">
            {renderPageContent(currentPage === 0 ? 0 : currentPage + 1)}
          </div>
        </div>

        {/* Next Button (Floating Right) */}
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages - 1 || isFlipping}
          className="absolute right-2 sm:right-4 z-30 w-11 h-11 rounded-full bg-black/70 hover:bg-[#C5A880] hover:text-[#1A1918] text-white border border-white/20 flex items-center justify-center shadow-2xl transition-all disabled:opacity-20 disabled:pointer-events-none active:scale-95"
          title="หน้าถัดไป (Right Arrow / Space)"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* 3. Thumbnails Drawer (When toggled) */}
      {showThumbnails && (
        <div className="mb-4 p-3 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto flex items-center gap-3">
          <button
            onClick={() => {
              setCurrentPage(0);
              playProceduralPageTurnSound(isMuted);
            }}
            className={`shrink-0 w-20 h-28 rounded-lg border-2 overflow-hidden relative flex flex-col justify-center items-center text-[10px] font-serif transition-all ${
              currentPage === 0
                ? 'border-[#C5A880] ring-2 ring-[#C5A880]/50 bg-[#1A1918]'
                : 'border-white/20 bg-neutral-900 opacity-60 hover:opacity-100'
            }`}
          >
            <BookOpen className="w-5 h-5 text-[#C5A880] mb-1" />
            <span>Cover</span>
          </button>

          {artworks.map((art, idx) => {
            const pageNum = (hasReviewers ? 2 : 1) + idx;
            const isCurrentSpread =
              currentPage === pageNum || currentPage + 1 === pageNum;

            return (
              <button
                key={art.id}
                onClick={() => {
                  setCurrentPage(pageNum % 2 === 1 ? pageNum : pageNum - 1);
                  playProceduralPageTurnSound(isMuted);
                }}
                className={`shrink-0 w-20 h-28 rounded-lg border-2 overflow-hidden relative transition-all group ${
                  isCurrentSpread
                    ? 'border-[#C5A880] ring-2 ring-[#C5A880]/50'
                    : 'border-white/20 opacity-60 hover:opacity-100'
                }`}
              >
                {art.imageUrl ? (
                  <Image
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-[10px]">
                    #{idx + 1}
                  </div>
                )}
                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-white text-[9px] font-mono text-center py-0.5">
                  #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Bottom Navigation & Progress Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-white/10 text-xs text-[#D5CEC0]">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[#C5A880] font-bold">
            {currentPage === 0
              ? 'Cover Page'
              : `Pages ${currentPage}-${Math.min(currentPage + 1, totalPages)} of ${totalPages}`}
          </span>
          <span className="text-[11px] text-white/40 hidden md:inline">
            (ใช้ปุ่มลูกศร ◀ ▶ หรือคลิกเพื่อพลิกหน้า)
          </span>
        </div>

        {/* Page Jump Slider */}
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <input
            type="range"
            min={0}
            max={totalPages - 1}
            step={2}
            value={currentPage}
            onChange={(e) => {
              setCurrentPage(parseInt(e.target.value));
              playProceduralPageTurnSound(isMuted);
            }}
            className="w-full accent-[#C5A880] bg-white/20 h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
