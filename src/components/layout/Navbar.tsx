'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Download, Eye, Box, BookOpen, Shield, GalleryHorizontal, Home } from 'lucide-react';
import { Exhibition, is3DEnabled } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { DownloadCatalogPDFButton } from '@/components/catalog/DownloadCatalogPDFButton';

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
    <header className="sticky top-0 z-40 w-full bg-[#F9F8F6]/95 backdrop-blur-md border-b border-[#E5E2DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Exit to Grand Lobby */}
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/" className="group flex items-center gap-2.5" title={t.actions.returnToLobby}>
            <div className="w-8 h-8 rounded-xl bg-[#8B1B1B] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center font-serif font-bold text-xs shadow-sm shrink-0 group-hover:scale-105 transition-transform">
              พช
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg sm:text-xl font-bold tracking-[0.12em] text-[#8B1B1B] group-hover:text-[#5E1212] transition-colors leading-none">
                POH-CHANG
              </span>
              <span className="text-[9px] font-sans font-semibold tracking-[0.16em] text-[#8C6D3F] uppercase leading-tight mt-0.5">
                {lang === 'th' ? 'หอศิลป์เพาะช่าง' : 'Academy of Arts'}
              </span>
            </div>
          </Link>

          {/* Grand Lobby Icon Button with Bubble Tooltip */}
          <div className="relative group">
            <Link
              href="/"
              className="p-2 rounded-full bg-[#EAE5DA] hover:bg-[#DDD6C8] text-[#2C2924] border border-[#D5CEC0] transition-all shadow-sm active:scale-95 flex items-center justify-center"
              aria-label={t.actions.returnToLobby}
            >
              <Home className="w-4 h-4 text-[#8C6D3F]" />
            </Link>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {t.actions.returnToLobby}
            </span>
          </div>
        </div>

        {/* Center: 2D / Carousel / 3D Mode Icons with Bubble Tooltips */}
        {onModeChange && (
          <div className="flex items-center bg-[#EBE8E0] p-1 rounded-full border border-[#DDD8CD] shadow-inner gap-1">
            {/* 2D Mode */}
            <div className="relative group">
              <button
                onClick={() => onModeChange('2d')}
                className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                  currentMode === '2d'
                    ? 'bg-[#1A1918] text-white shadow-sm'
                    : 'text-[#6B655B] hover:text-[#1A1918] hover:bg-black/5'
                }`}
                aria-label={t.modes.grid}
              >
                <Eye className="w-4 h-4" />
              </button>
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                {t.modes.grid}
              </span>
            </div>

            {/* Carousel Mode */}
            <div className="relative group">
              <button
                onClick={() => onModeChange('carousel')}
                className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                  currentMode === 'carousel'
                    ? 'bg-[#1A1918] text-white shadow-sm'
                    : 'text-[#6B655B] hover:text-[#1A1918] hover:bg-black/5'
                }`}
                aria-label={t.modes.carousel}
              >
                <GalleryHorizontal className="w-4 h-4" />
              </button>
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                {t.modes.carousel}
              </span>
            </div>

            {/* 3D Mode */}
            {is3DEnabled(exhibition) && (
              <div className="relative group">
                <button
                  onClick={() => onModeChange('3d')}
                  className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${
                    currentMode === '3d'
                      ? 'bg-[#8B1B1B] text-white shadow-sm'
                      : 'text-[#6B655B] hover:text-[#1A1918] hover:bg-black/5'
                  }`}
                  aria-label={t.modes.room3d}
                >
                  <Box className="w-4 h-4 text-[#D4AF37]" />
                </button>
                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                  {t.modes.room3d}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Right: Language Switcher & Icon Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Language Switcher [ TH | EN ] */}
          <div className="flex items-center bg-[#EBE7DF] rounded-full p-0.5 border border-[#D8D2C4] text-xs font-bold font-sans">
            <button
              onClick={() => setLang('th')}
              className={`px-2 py-0.5 rounded-full transition-all ${
                lang === 'th'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'text-[#696356] hover:text-[#1A1918]'
              }`}
            >
              TH
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded-full transition-all ${
                lang === 'en'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'text-[#696356] hover:text-[#1A1918]'
              }`}
            >
              EN
            </button>
          </div>

          {/* Direct Artists Directory Icon Button with Bubble Tooltip (No Dropdown) */}
          <div className="relative group">
            <Link
              href="/artists"
              className="p-2 text-[#575249] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-full transition-colors flex items-center justify-center text-sm"
              aria-label={lang === 'th' ? 'ทำเนียบศิลปิน' : 'Artists Directory'}
            >
              <span>👨‍🎨</span>
            </Link>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {lang === 'th' ? 'ทำเนียบศิลปิน' : 'Artists Directory'}
            </span>
          </div>

          {/* Read Catalog Icon Button with Bubble Tooltip */}
          <div className="relative group">
            <Link
              href={catalogTargetUrl}
              className="p-2 text-[#575249] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-full transition-colors flex items-center justify-center"
              aria-label={isInsideSpecificExhibition ? t.actions.readCatalog : (lang === 'th' ? 'หอสูจิบัตร' : 'Catalogs Library')}
            >
              <BookOpen className="w-4 h-4 text-[#8C6D3F]" />
            </Link>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {isInsideSpecificExhibition ? t.actions.readCatalog : (lang === 'th' ? 'หอสูจิบัตร' : 'Catalogs Library')}
            </span>
          </div>

          {/* PDF Download Icon Button with Tooltip (when exhibition is active) */}
          {exhibition?.slug && (
            <DownloadCatalogPDFButton exhibition={exhibition} variant="navbar" />
          )}

          {/* Curator Admin Portal Icon with Bubble Tooltip */}
          <div className="relative group">
            <Link
              href="/admin"
              className="p-2 text-[#7A746A] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-full transition-colors flex items-center justify-center"
              aria-label="Curator Admin Portal"
            >
              <Shield className="w-4 h-4 text-[#8C6D3F]" />
            </Link>
            <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {lang === 'th' ? 'ระบบผู้ดูแลนิทรรศการ' : 'Curator Admin Portal'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

