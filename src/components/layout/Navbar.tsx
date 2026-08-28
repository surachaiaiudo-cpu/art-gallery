'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Download, Eye, Box, BookOpen, Shield, GalleryHorizontal, Home, Sparkles, Compass } from 'lucide-react';
import { Exhibition, is3DEnabled } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { DownloadCatalogPDFButton } from '@/components/catalog/DownloadCatalogPDFButton';
import { TooltipBubble } from '@/components/ui/TooltipBubble';

interface NavbarProps {
  exhibition?: Exhibition | null;
  currentMode?: '2d' | 'carousel' | '3d';
  onModeChange?: (mode: '2d' | 'carousel' | '3d') => void;
  isDownloadingPdf?: boolean;
}

export function Navbar({
  exhibition,
  currentMode = '2d',
  onModeChange,
}: NavbarProps) {
  const pathname = usePathname();
  const { lang, setLang, t } = useLanguage();
  const isInsideSpecificExhibition = pathname?.startsWith('/exhibitions/');
  const catalogTargetUrl = isInsideSpecificExhibition && exhibition?.slug ? `/catalog/${exhibition.slug}` : '/catalog';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#121110]/85 backdrop-blur-xl border-b border-[#C5A880]/20 text-[#FAF8F5] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand Logo & Heritage Title */}
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-3" title={t.actions.returnToLobby}>
            {/* Crest */}
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B1B1B] via-[#6B1414] to-[#3B0A0A] text-[#D4AF37] border border-[#D4AF37]/50 flex items-center justify-center font-serif font-bold text-sm shadow-[0_0_15px_rgba(212,175,55,0.2)] shrink-0 group-hover:scale-105 transition-all">
              พช
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.15em] text-[#FAF8F5] group-hover:text-[#D4AF37] transition-colors leading-none">
                  POH-CHANG
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/30 text-[9px] font-mono text-[#E6D7B8]">
                  ARTVARA
                </span>
              </div>
              <span className="text-[9px] font-sans font-semibold tracking-[0.2em] text-[#C5A880] uppercase leading-tight mt-1">
                {lang === 'th' ? 'หอศิลป์วิทยาลัยเพาะช่าง' : 'Academy of Arts Gallery'}
              </span>
            </div>
          </Link>

          {/* Grand Lobby Quick Jump */}
          <Link
            href="/"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-neutral-300 hover:text-white transition-all shadow-sm"
          >
            <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
            <span>{t.lobby.grandLobby}</span>
          </Link>
        </div>

        {/* Center: 2D / Carousel / 3D Mode Capsule Switcher */}
        {onModeChange && (
          <div className="flex items-center bg-[#1E1C1A]/90 p-1.5 rounded-full border border-[#C5A880]/30 shadow-2xl gap-1.5 backdrop-blur-md">
            {/* 2D Mode */}
            <TooltipBubble content={t.modes.grid} position="bottom">
              <button
                onClick={() => onModeChange('2d')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  currentMode === '2d'
                    ? 'bg-[#C5A880] text-[#141210] shadow-md font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                }`}
                aria-label={t.modes.grid}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.modes.grid}</span>
              </button>
            </TooltipBubble>

            {/* Carousel Mode */}
            <TooltipBubble content={t.modes.carousel} position="bottom">
              <button
                onClick={() => onModeChange('carousel')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  currentMode === 'carousel'
                    ? 'bg-[#C5A880] text-[#141210] shadow-md font-bold'
                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                }`}
                aria-label={t.modes.carousel}
              >
                <GalleryHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.modes.carousel}</span>
              </button>
            </TooltipBubble>

            {/* 3D Mode */}
            {is3DEnabled(exhibition) && (
              <TooltipBubble content={t.modes.room3d} position="bottom">
                <button
                  onClick={() => onModeChange('3d')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                    currentMode === '3d'
                      ? 'bg-gradient-to-r from-[#8B1B1B] to-[#A82828] text-white shadow-[0_0_12px_rgba(139,27,27,0.5)] font-bold border border-[#D4AF37]/50'
                      : 'text-[#E6D7B8] hover:text-white hover:bg-white/10'
                  }`}
                  aria-label={t.modes.room3d}
                >
                  <Box className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span className="hidden sm:inline">{t.modes.room3d}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                </button>
              </TooltipBubble>
            )}
          </div>
        )}

        {/* Right: Actions, Catalog, Language & Admin */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher [ TH | EN ] */}
          <div className="flex items-center bg-black/40 rounded-full p-0.5 border border-white/15 text-xs font-bold font-sans">
            <button
              onClick={() => setLang('th')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                lang === 'th'
                  ? 'bg-[#C5A880] text-[#141210] shadow-sm font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              TH
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#C5A880] text-[#141210] shadow-sm font-extrabold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              EN
            </button>
          </div>

          {/* Artists Directory Button with Tooltip */}
          <TooltipBubble content={lang === 'th' ? 'ทำเนียบศิลปิน' : 'Artists Directory'} position="bottom">
            <Link
              href="/artists"
              className="p-2 text-neutral-300 hover:text-white hover:bg-white/10 rounded-full transition-all flex items-center justify-center border border-transparent hover:border-white/10"
              aria-label={lang === 'th' ? 'ทำเนียบศิลปิน' : 'Artists Directory'}
            >
              <span className="text-sm">👨‍🎨</span>
            </Link>
          </TooltipBubble>

          {/* Read Catalog Button with Tooltip */}
          <TooltipBubble
            content={isInsideSpecificExhibition ? t.actions.readCatalog : (lang === 'th' ? 'หอสูจิบัตรดิจิทัล' : 'Digital Catalogs Library')}
            position="bottom"
          >
            <Link
              href={catalogTargetUrl}
              className="p-2 text-[#C5A880] hover:text-white hover:bg-[#C5A880]/20 rounded-full transition-all flex items-center justify-center border border-[#C5A880]/30"
              aria-label={t.actions.readCatalog}
            >
              <BookOpen className="w-4 h-4" />
            </Link>
          </TooltipBubble>

          {/* PDF Download Button if exhibition active */}
          {exhibition?.slug && (
            <DownloadCatalogPDFButton exhibition={exhibition} variant="navbar" />
          )}

          {/* Curator Admin Portal with Tooltip */}
          <TooltipBubble content={lang === 'th' ? 'สตูดิโอผู้ดูแลระบบ (Curator Admin)' : 'Curator Admin Studio'} position="bottom">
            <Link
              href="/admin"
              className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
              aria-label="Curator Admin"
            >
              <Shield className="w-4 h-4 text-[#C5A880]" />
            </Link>
          </TooltipBubble>
        </div>
      </div>
    </header>
  );
}
