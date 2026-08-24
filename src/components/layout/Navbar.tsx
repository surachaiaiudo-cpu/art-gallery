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

          {/* Explicit Exit to Lobby Button */}
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-[#EAE5DA] hover:bg-[#DDD6C8] text-[#2C2924] border border-[#D5CEC0] transition-colors shadow-sm active:scale-95"
            title={t.actions.returnToLobby}
          >
            <Home className="w-3.5 h-3.5 text-[#8C6D3F]" />
            <span>{t.actions.returnToLobby}</span>
          </Link>
        </div>

        {/* Center: 2D / Carousel / 3D View Switcher */}
        {onModeChange && (
          <div className="flex items-center bg-[#EBE8E0] p-1 rounded-full border border-[#DDD8CD] shadow-inner">
            <button
              onClick={() => onModeChange('2d')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                currentMode === '2d'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'text-[#6B655B] hover:text-[#1A1918]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{t.modes.grid}</span>
            </button>
            <button
              onClick={() => onModeChange('carousel')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                currentMode === 'carousel'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'text-[#6B655B] hover:text-[#1A1918]'
              }`}
            >
              <GalleryHorizontal className="w-3.5 h-3.5" />
              <span>{t.modes.carousel}</span>
            </button>
            {is3DEnabled(exhibition) && (
              <button
                onClick={() => onModeChange('3d')}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all duration-200 ${
                  currentMode === '3d'
                    ? 'bg-[#1A1918] text-white shadow-sm'
                    : 'text-[#6B655B] hover:text-[#1A1918]'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>{t.modes.room3d}</span>
              </button>
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

          {/* Artists Directory Link */}
          <Link
            href="/artists"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#575249] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-md transition-colors"
          >
            <span>👨‍🎨</span>
            <span className="hidden sm:inline">{lang === 'th' ? 'ทำเนียบศิลปิน' : 'Artists'}</span>
          </Link>

          {/* Read Catalog Online */}
          {exhibition?.slug && (
            <>
              <Link
                href={`/catalog/${exhibition.slug}`}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wide text-[#575249] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-md transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span>{t.actions.readCatalog}</span>
              </Link>

              {/* PDF Download Button (A4 Print-Ready with 1.5 cm Margins & White Background) */}
              <DownloadCatalogPDFButton exhibition={exhibition} variant="navbar" />
            </>
          )}

          {/* Curator Admin Portal Link (Only for admins) */}
          <Link
            href="/admin"
            className="p-2 text-[#7A746A] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-full transition-colors"
            title="Curator Admin Portal"
          >
            <Shield className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
