'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, Eye, Box, BookOpen, Shield, GalleryHorizontal, Home, ArrowLeft, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';
import { Exhibition, is3DEnabled } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { DownloadCatalogPDFButton } from '@/components/catalog/DownloadCatalogPDFButton';
import { CountryFlag } from '@/components/ui/CountryFlag';

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
  const [groupedArtists, setGroupedArtists] = useState<Array<{ country: string; count: number; artists: any[] }>>([]);
  const [isArtistsMenuOpen, setIsArtistsMenuOpen] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/artists')
      .then((res) => res.json())
      .then((data) => {
        if (data?.groupedByCountry) {
          setGroupedArtists(data.groupedByCountry);
        }
      })
      .catch((err) => console.warn('Fetch artists for navbar failed:', err));
  }, []);

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

          {/* Artists Directory Multi-Level Dropdown (Grouped by Country) */}
          <div
            className="relative"
            onMouseEnter={() => setIsArtistsMenuOpen(true)}
            onMouseLeave={() => {
              setIsArtistsMenuOpen(false);
              setHoveredCountry(null);
            }}
          >
            <Link
              href="/artists"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide text-[#575249] hover:text-[#1A1918] hover:bg-[#EBE8E0] rounded-full transition-colors"
            >
              <span>👨‍🎨</span>
              <span className="hidden sm:inline">{lang === 'th' ? 'ทำเนียบศิลปิน' : 'Artists'}</span>
              <ChevronDown className="w-3 h-3 text-[#8C6D3F]" />
            </Link>

            {/* Level 1: Country List Dropdown */}
            {isArtistsMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-60 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#E5E0D6] py-2 z-50 animate-in fade-in zoom-in-95">
                {/* Top: View All Artists */}
                <Link
                  href="/artists"
                  onClick={() => setIsArtistsMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2 hover:bg-[#F6F3EC] text-xs font-bold text-[#8B1B1B] border-b border-[#F0ECE1] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <span>🌟</span>
                    <span>{lang === 'th' ? 'สารบัญศิลปินทั้งหมด' : 'All Artists Directory'}</span>
                  </span>
                  <ArrowRight className="w-3 h-3 text-[#8B1B1B]" />
                </Link>

                {/* Sub-header */}
                <div className="px-4 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#8C8477] font-bold">
                  {lang === 'th' ? 'แยกตามประเทศ (By Country)' : 'By Country'}
                </div>

                {/* Country List */}
                <div className="max-h-[300px] overflow-y-auto">
                  {groupedArtists.length > 0 ? (
                    groupedArtists.map((group) => {
                      const isSelected = hoveredCountry === group.country;
                      return (
                        <div
                          key={group.country}
                          className="relative"
                          onMouseEnter={() => setHoveredCountry(group.country)}
                        >
                          <Link
                            href={`/artists?country=${encodeURIComponent(group.country)}`}
                            onClick={() => setIsArtistsMenuOpen(false)}
                            className={`flex items-center justify-between px-4 py-2 text-xs transition-colors ${
                              isSelected ? 'bg-[#8B1B1B] text-white font-bold' : 'text-[#33302C] hover:bg-[#FAF8F5]'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <CountryFlag country={group.country} size="badge" shape="circle" />
                              <span className="truncate max-w-[120px]">{group.country}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                  isSelected ? 'bg-white/25 text-white' : 'bg-[#EAE5DA] text-[#6E685C]'
                                }`}
                              >
                                {group.count}
                              </span>
                              <ChevronRight className="w-3 h-3 opacity-60" />
                            </div>
                          </Link>

                          {/* Level 2: Submenu Flyout (Artists within this country) */}
                          {isSelected && group.artists.length > 0 && (
                            <div className="absolute top-0 right-full mr-1.5 w-64 bg-white/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-[#E5E0D6] py-2 z-50 animate-in fade-in slide-in-from-right-2 max-h-[360px] overflow-y-auto hidden md:block">
                              <div className="px-3.5 py-1.5 text-[11px] font-bold text-[#8B1B1B] border-b border-[#F0ECE1] flex items-center gap-2">
                                <CountryFlag country={group.country} size="badge" shape="circle" />
                                <span>{group.country} ({group.count} ท่าน)</span>
                              </div>
                              {group.artists.map((artist) => (
                                <Link
                                  key={artist.id}
                                  href={`/artists/${artist.id}`}
                                  onClick={() => setIsArtistsMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-[#FAF6F0] text-xs transition-colors border-b border-[#FAF6F0] last:border-0"
                                >
                                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 border border-[#DDD6C8] bg-white">
                                    <img
                                      src={artist.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'}
                                      alt={artist.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-[#1A1918] truncate text-xs">{artist.name}</span>
                                    <span className="text-[10px] text-[#8C6D3F] truncate">{artist.artworkCount || 0} ผลงาน</span>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-4 py-2 text-xs text-neutral-400">กำลังโหลด...</div>
                  )}
                </div>
              </div>
            )}
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
