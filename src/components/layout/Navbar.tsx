'use client';

import React from 'react';
import Link from 'next/link';
import { Download, Eye, Box, BookOpen, Shield, GalleryHorizontal, Home, ArrowLeft } from 'lucide-react';
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
  isDownloadingPdf = false,
}: NavbarProps) {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F9F8F6]/95 backdrop-blur-md border-b border-[#E5E2DC] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Left: Brand Logo & Exit to Grand Lobby */}
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/" className="group flex items-center gap-2" title={t.actions.returnToLobby}>
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-[0.18em] text-[#1A1918] group-hover:text-[#8C6D3F] transition-colors">
              ARTVARA
            </span>
          </Link>

          {/* Explicit Exit to Lobby Button with Bubble Tooltip */}
          <div className="relative group">
            <Link
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#EAE5DA] hover:bg-[#DDD6C8] text-[#2C2924] border border-[#D5CEC0] transition-all shadow-sm active:scale-95 shrink-0"
            >
              <Home className="w-3.5 h-3.5 text-[#8C6D3F]" />
              <span className="hidden md:inline">{t.actions.returnToLobby}</span>
            </Link>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {t.actions.returnToLobby}
            </span>
          </div>
        </div>

        {/* Center: 2D / Carousel / 3D View Switcher with Bubble Tooltips */}
        {onModeChange && (
          <div className="flex items-center bg-[#EBE8E0] p-0.5 sm:p-1 rounded-full border border-[#DDD8CD] shadow-inner shrink-0">
            {/* 2D Grid Mode */}
            <div className="relative group">
              <button
                onClick={() => onModeChange('2d')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider transition-all duration-200 ${
                  currentMode === '2d'
                    ? 'bg-[#1A1918] text-white shadow-sm'
                    : 'text-[#6B655B] hover:text-[#1A1918]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">{t.modes.grid}</span>
              </button>
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                {lang === 'th' ? 'มุมมองแคตตาล็อก 2D' : '2D Grid Mode'}
              </span>
            </div>

            {/* Carousel Mode */}
            <div className="relative group">
              <button
                onClick={() => onModeChange('carousel')}
                className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider transition-all duration-200 ${
                  currentMode === 'carousel'
                    ? 'bg-[#1A1918] text-white shadow-sm'
                    : 'text-[#6B655B] hover:text-[#1A1918]'
                }`}
              >
                <GalleryHorizontal className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.modes.carousel}</span>
              </button>
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                {lang === 'th' ? 'มุมมองสไลด์ผลงาน' : 'Carousel Slideshow'}
              </span>
            </div>

            {/* 3D Virtual Room Mode */}
            {is3DEnabled(exhibition) && (
              <div className="relative group">
                <button
                  onClick={() => onModeChange('3d')}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-semibold tracking-wider transition-all duration-200 ${
                    currentMode === '3d'
                      ? 'bg-[#1A1918] text-white shadow-sm'
                      : 'text-[#6B655B] hover:text-[#1A1918]'
                  }`}
                >
                  <Box className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{t.modes.room3d}</span>
                </button>
                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                  {lang === 'th' ? 'เดินชมห้องเสมือนจริง 3D' : '3D Virtual Room'}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Right: Language Switcher & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher [ TH | EN ] */}
          <div className="flex items-center bg-[#EBE7DF] rounded-full p-0.5 border border-[#D8D2C4] text-xs font-bold font-sans">
            <button
              onClick={() => setLang('th')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                lang === 'th'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'text-[#696356] hover:text-[#1A1918]'
              }`}
            >
              TH
            </button>
            <button
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 rounded-full transition-all ${
                lang === 'en'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'text-[#696356] hover:text-[#1A1918]'
              }`}
            >
              EN
            </button>
          </div>

          {/* Artists Directory Link with Bubble Tooltip */}
          <div className="relative group">
            <Link
              href="/artists"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#575249] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-full transition-colors"
            >
              <span>👨‍🎨</span>
              <span className="hidden sm:inline">{lang === 'th' ? 'ทำเนียบศิลปิน' : 'Artists'}</span>
            </Link>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {lang === 'th' ? 'ทำเนียบศิลปินทั้งหมด' : 'Artists Directory'}
            </span>
          </div>

          {/* Read Catalog Online with Bubble Tooltip */}
          {exhibition?.slug && (
            <>
              <div className="relative group hidden md:block">
                <Link
                  href={`/catalog/${exhibition.slug}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide text-[#575249] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-full transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#8C6D3F]" />
                  <span>{t.actions.readCatalog}</span>
                </Link>
                <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                  {lang === 'th' ? 'อ่านสูจิบัตรดิจิทัลออนไลน์' : 'Read Digital E-Catalog'}
                </span>
              </div>

              {/* PDF Download Button */}
              <DownloadCatalogPDFButton exhibition={exhibition} variant="navbar" />
            </>
          )}

          {/* Curator Admin Portal Link with Bubble Tooltip */}
          <div className="relative group">
            <Link
              href="/admin"
              className="p-2 text-[#7A746A] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-full transition-colors flex items-center justify-center"
              aria-label="Curator Admin Portal"
            >
              <Shield className="w-4 h-4" />
            </Link>
            <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {lang === 'th' ? 'ระบบผู้ดูแลนิทรรศการ (Admin Portal)' : 'Curator Admin Portal'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
