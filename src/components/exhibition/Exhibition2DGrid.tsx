'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Exhibition, Artwork, getExhibitionPeerReviewers } from '@/types/exhibition';
import { ArtistIndexSidebar } from './ArtistIndexSidebar';
import { ArtworkLightbox } from './ArtworkLightbox';
import { ArtworkInquiryModal } from './ArtworkInquiryModal';
import { DigitalGuestbook } from './DigitalGuestbook';
import { ViewInRoomModal } from './ViewInRoomModal';
import { useLanguage } from '@/context/LanguageContext';
import { Info, Sparkles, Maximize2, MessageSquare, LayoutList, LayoutGrid, Eye, Award, Calendar, Palette, GraduationCap, Users, ShieldCheck, Frame, Search, X, BookOpen, Box, SlidersHorizontal, ArrowUpDown, Check, RotateCcw } from 'lucide-react';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { ArtistAvatar } from '@/components/ui/ArtistAvatar';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
import { formatDateRange, formatDimensionsInCm } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface Exhibition2DGridProps {
  exhibition: Exhibition;
}

export function Exhibition2DGrid({ exhibition }: Exhibition2DGridProps) {
  const { lang, t } = useLanguage();
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMedium, setSelectedMedium] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('default');
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [roomModalArtwork, setRoomModalArtwork] = useState<Artwork | null>(null);
  const [inquiryArtwork, setInquiryArtwork] = useState<Artwork | null>(null);
  const [showCuratorNote, setShowCuratorNote] = useState(false);
  const [columnMode, setColumnMode] = useState<'single' | 'grid'>('single');

  const artworks = exhibition.artworks || [];
  const artists = exhibition.artists || [];
  const peerReviewers = getExhibitionPeerReviewers(exhibition);

  // Artworks count by artist
  const artworksCountByArtist = useMemo(() => {
    const map: Record<string, number> = {};
    for (const art of artworks) {
      if (art.artistId) {
        map[art.artistId] = (map[art.artistId] || 0) + 1;
      }
    }
    return map;
  }, [artworks]);

  // Unique mediums available in this exhibition
  const availableMediums = useMemo(() => {
    const set = new Set<string>();
    for (const art of artworks) {
      if (art.medium?.trim()) {
        set.add(art.medium.trim());
      }
    }
    return Array.from(set);
  }, [artworks]);

  // Unique countries available in this exhibition
  const availableCountries = useMemo(() => {
    const set = new Set<string>();
    for (const art of artworks) {
      if (art.artist?.country?.trim()) {
        set.add(art.artist.country.trim());
      }
    }
    return Array.from(set);
  }, [artworks]);

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedArtistId) count++;
    if (selectedMedium !== 'all') count++;
    if (selectedSize !== 'all') count++;
    if (selectedCountry !== 'all') count++;
    if (sortBy !== 'default') count++;
    if (searchQuery.trim()) count++;
    return count;
  }, [selectedArtistId, selectedMedium, selectedSize, selectedCountry, sortBy, searchQuery]);

  // Clear all filters
  const handleClearAllFilters = () => {
    setSelectedArtistId(null);
    setSearchQuery('');
    setSelectedMedium('all');
    setSelectedSize('all');
    setSelectedCountry('all');
    setSortBy('default');
  };

  // Helper to parse dimensions string and check size
  function checkSizeMatch(dimensions: string | undefined, sizeFilter: string) {
    if (sizeFilter === 'all' || !dimensions) return true;
    const matches = dimensions.match(/\d+(\.\d+)?/g);
    if (!matches || matches.length === 0) return true;
    const nums = matches.map(Number);
    const maxDim = Math.max(...nums);
    if (sizeFilter === 'small') return maxDim < 50;
    if (sizeFilter === 'medium') return maxDim >= 50 && maxDim <= 120;
    if (sizeFilter === 'large') return maxDim > 120;
    return true;
  }

  // Filter artworks by all facets and sorting
  const filteredArtworks = useMemo(() => {
    let list = [...artworks];
    if (selectedArtistId) {
      list = list.filter((art) => art.artistId === selectedArtistId);
    }
    if (selectedMedium !== 'all') {
      list = list.filter((art) => art.medium?.trim() === selectedMedium);
    }
    if (selectedCountry !== 'all') {
      list = list.filter((art) => art.artist?.country?.trim() === selectedCountry);
    }
    if (selectedSize !== 'all') {
      list = list.filter((art) => checkSizeMatch(art.dimensions ?? undefined, selectedSize));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (art) =>
          (art.title && art.title.toLowerCase().includes(q)) ||
          (art.artist?.name && art.artist.name.toLowerCase().includes(q)) ||
          (art.medium && art.medium.toLowerCase().includes(q)) ||
          (art.artist?.country && art.artist.country.toLowerCase().includes(q))
      );
    }
    // Sorting
    if (sortBy === 'title_asc') {
      list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'artist_asc') {
      list.sort((a, b) => (a.artist?.name || '').localeCompare(b.artist?.name || ''));
    } else if (sortBy === 'year_desc') {
      list.sort((a, b) => (parseInt(String(b.yearCreated || '0'), 10) || 0) - (parseInt(String(a.yearCreated || '0'), 10) || 0));
    }
    return list;
  }, [artworks, selectedArtistId, selectedMedium, selectedCountry, selectedSize, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Exhibition Header - Luxury Museum Layout */}
      <div className="mb-10 sm:mb-12 border-b border-[#E2DDD3] pb-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-4xl">
            {/* Top Category Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFEBE2] border border-[#DDD6C8] text-[11px] uppercase tracking-widest text-[#8C6D3F] font-bold shadow-sm">
                <Sparkles className="w-3 h-3 text-[#8C6D3F]" />
                <span>{lang === 'th' ? 'นิทรรศการศิลปกรรมร่วมสมัย' : 'Current Curated Exhibition'}</span>
              </span>
            </div>

            {/* Main Exhibition Title */}
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1A1918] tracking-tight leading-[1.2]">
              {exhibition.title}
            </h1>

            {/* Meta Row: Curator + Dates + Stats */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#6B655A] font-medium pt-1">
              {exhibition.curator?.name && (
                <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-[#E2DDD3] shadow-sm">
                  <Award className="w-3.5 h-3.5 text-[#8C6D3F] shrink-0" />
                  <span>{t.specs.curatedBy}:</span>
                  <strong className="text-[#1A1918]">{exhibition.curator.name}</strong>
                </div>
              )}

              {exhibition.startDate && (
                <div className="flex items-center gap-1.5 text-[#7A7468]">
                  <Calendar className="w-3.5 h-3.5 text-[#8C6D3F]" />
                  <span>{formatDateRange(exhibition.startDate, exhibition.endDate)}</span>
                </div>
              )}

              <div className="flex items-center gap-1.5 text-[#7A7468]">
                <Palette className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span>{artworks.length} {lang === 'th' ? 'ผลงานศิลปะ' : 'Artworks'}</span>
              </div>

              {peerReviewers.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[#FAF6EE] text-[#8C6D3F] font-bold px-3 py-1 rounded-lg border border-[#E5D7BF] shadow-sm">
                  <GraduationCap className="w-3.5 h-3.5 text-[#8C6D3F] shrink-0" />
                  <span>{peerReviewers.length} {lang === 'th' ? 'ผู้ทรงคุณวุฒิประเมิน (Peer Reviewers)' : 'Peer Reviewers'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Curator Statement Toggle Button with Tooltip Bubble */}
          {exhibition.curatorNote && (
            <TooltipBubble
              content={showCuratorNote ? (lang === 'th' ? 'ซ่อนคำนำภัณฑารักษ์' : 'Hide Curatorial Statement') : (lang === 'th' ? 'อ่านคำนำภัณฑารักษ์ (Curator Statement)' : 'Read Curatorial Statement')}
              position="left"
            >
              <button
                onClick={() => setShowCuratorNote(!showCuratorNote)}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-all cursor-pointer active:scale-95 ${
                  showCuratorNote
                    ? 'bg-[#8C6D3F] text-white border border-[#8C6D3F] shadow-md'
                    : 'bg-white hover:bg-[#FAF8F5] text-[#1A1918] border border-[#C5A880]'
                }`}
                aria-label="Curator Statement"
              >
                <Info className={`w-4 h-4 ${showCuratorNote ? 'text-white' : 'text-[#8C6D3F]'}`} />
                <span className="hidden sm:inline">{showCuratorNote ? (lang === 'th' ? 'ซ่อนคำนำ' : 'Hide') : (lang === 'th' ? 'คำนำภัณฑารักษ์' : 'Curator Note')}</span>
              </button>
            </TooltipBubble>
          )}
        </div>

        {/* Collapsible Curator Statement Box */}
        {showCuratorNote && exhibition.curatorNote && (
          <div className="p-6 sm:p-8 bg-gradient-to-br from-[#FAF8F5] to-[#F5EFEB] border border-[#C5A880]/40 rounded-2xl shadow-sm animate-slide-up space-y-3">
            <div className="flex items-center justify-between border-b border-[#EAE4D8] pb-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8C7149] font-bold">
                <Award className="w-4 h-4 text-[#C5A880]" />
                <span>{lang === 'th' ? 'บทความภัณฑารักษ์ (Curatorial Statement)' : 'Curatorial Statement'}</span>
              </div>
              <span className="text-xs text-[#8C8477] font-semibold">
                {exhibition.curator?.name || 'Curatorial Board'}
              </span>
            </div>
            <div className="text-xs sm:text-sm text-[#474239] leading-relaxed whitespace-pre-line font-serif italic max-w-4xl pt-1">
              "{exhibition.curatorNote}"
            </div>
          </div>
        )}

        {/* Peer Reviewers Panel (คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน 3 - 5 ท่าน) */}
        {peerReviewers.length > 0 && (
          <div className="p-5 sm:p-6 bg-gradient-to-b from-[#FAF8F5] to-white border border-[#E5D7BF] rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#EAE4D8] pb-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
                <GraduationCap className="w-4 h-4 text-[#8C6D3F]" />
                <span>{lang === 'th' ? 'คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)' : 'Academic Peer Review Committee'}</span>
              </div>
              <span className="text-[11px] text-[#8C8477] font-mono">
                {peerReviewers.length} {lang === 'th' ? 'ท่าน' : 'Members'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
              {peerReviewers.map((reviewer, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-[#EAE4D8] hover:border-[#8C6D3F] transition-all shadow-xs space-y-2.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#8C6D3F] bg-[#FAF6EE] px-2 py-0.5 rounded">
                        {reviewer.role || (idx === 0 ? 'ประธานกรรมการ' : 'กรรมการผู้ทรงคุณวุฒิ')}
                      </span>
                      {reviewer.country && <CountryFlag country={reviewer.country} size="xs" />}
                    </div>

                    <div className="flex items-center gap-3">
                      {reviewer.avatarUrl ? (
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#D5CEC0] shrink-0 shadow-sm bg-[#1A1918]">
                          <img
                            src={getOptimizedImageUrl(reviewer.avatarUrl, { width: 160, quality: 75 })}
                            alt={reviewer.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[#FAF6EE] border border-[#E5D7BF] flex items-center justify-center font-serif text-sm font-bold text-[#8C6D3F] shrink-0">
                          {reviewer.name?.trim().charAt(0).toUpperCase() || 'R'}
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-serif text-xs font-bold text-[#1A1918] leading-snug">
                          {[reviewer.academicTitle, reviewer.name].filter(Boolean).join(' ')}
                        </h4>
                      </div>
                    </div>
                  </div>

                  {reviewer.institution && (
                    <p className="text-[10px] text-[#6E685C] leading-tight pt-1.5 border-t border-[#F4F0E8]">
                      {reviewer.institution}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Layout: Sidebar + Artworks */}
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Left: Artist Index Sidebar */}
        <ArtistIndexSidebar
          artists={artists}
          selectedArtistId={selectedArtistId}
          onSelectArtist={setSelectedArtistId}
          artworksCountByArtist={artworksCountByArtist}
          totalArtworksCount={artworks.length}
        />

        {/* Right: Artwork Presentation (1-Column by Default for Full Immersive View) */}
        <div className="flex-1">
          {/* Top Bar: Search, Faceted Filter Button, Count & Column Mode Switcher */}
          <div className="space-y-3 mb-8 border-b border-[#E8E2D6] pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                {/* Quick Search Input */}
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#8C6D3F] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={lang === 'th' ? 'ค้นหาผลงาน / ศิลปิน...' : 'Search artworks / artists...'}
                    className="pl-8 pr-7 py-1.5 bg-white border border-[#D5CEC0] focus:border-[#8C6D3F] rounded-full text-xs text-[#1A1918] placeholder-[#9C9588] focus:outline-none shadow-xs w-44 sm:w-56 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 p-0.5 rounded-full text-neutral-400 hover:text-neutral-700 cursor-pointer"
                      title="ล้างคำค้นหา"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Faceted Filter Toggle Button */}
                <TooltipBubble content={lang === 'th' ? 'ตัวกรองเชิงลึก (เทคนิค, ขนาด, สัญชาติ, เรียงลำดับ)' : 'Faceted Filters (Medium, Size, Country, Sort)'}>
                  <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95 border ${
                      isFilterOpen || activeFiltersCount > 0
                        ? 'bg-[#1A1918] text-white border-[#1A1918]'
                        : 'bg-white hover:bg-[#FAF8F5] text-[#4A453C] border-[#D5CEC0]'
                    }`}
                    aria-label="Toggle Filters"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{lang === 'th' ? 'ตัวกรอง' : 'Filters'}</span>
                    {activeFiltersCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-[#C5A880] text-[#1A1918] text-[10px] font-bold flex items-center justify-center font-mono">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </TooltipBubble>

                <div className="text-xs text-[#7A746A] tracking-wider uppercase font-medium">
                  {t.actions.showing} <span className="font-bold text-[#1A1918]">{filteredArtworks.length}</span> {t.actions.items}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {/* E-Catalog Link with Tooltip Bubble */}
                <TooltipBubble content={lang === 'th' ? 'เปิดอ่านสูจิบัตรออนไลน์ (E-Catalog)' : 'Open E-Catalog'}>
                  <Link
                    href={`/catalog/${exhibition.slug}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF6EE] hover:bg-[#F2ECE0] text-[#8C6D3F] border border-[#E5D7BF] rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <BookOpen className="w-4 h-4" />
                    <span className="hidden sm:inline">{lang === 'th' ? 'สูจิบัตร' : 'Catalog'}</span>
                  </Link>
                </TooltipBubble>

                {/* Layout Toggle (1 Column Large vs Multi-grid) with Tooltip Bubbles */}
                <div className="flex items-center bg-[#EAE5DA] p-1 rounded-lg border border-[#D5CEC0] text-xs font-semibold gap-1">
                  <TooltipBubble content={lang === 'th' ? 'แสดงภาพขนาดใหญ่เต็มตา 1 คอลัมน์' : '1-Column Full Size View'}>
                    <button
                      onClick={() => setColumnMode('single')}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        columnMode === 'single'
                          ? 'bg-[#1A1918] text-white shadow-sm'
                          : 'text-[#696356] hover:text-[#1A1918]'
                      }`}
                      aria-label="1 Column View"
                    >
                      <LayoutList className="w-4 h-4" />
                    </button>
                  </TooltipBubble>
                  <TooltipBubble content={lang === 'th' ? 'แสดงแบบตารางภาพ (Grid)' : 'Grid View'}>
                    <button
                      onClick={() => setColumnMode('grid')}
                      className={`p-1.5 rounded-md transition-all cursor-pointer ${
                        columnMode === 'grid'
                          ? 'bg-[#1A1918] text-white shadow-sm'
                          : 'text-[#696356] hover:text-[#1A1918]'
                      }`}
                      aria-label="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                  </TooltipBubble>
                </div>
              </div>
            </div>

            {/* Active Filter Pills Bar (Clean & Dismissable) */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-[#8C8477] font-semibold">
                  {lang === 'th' ? 'ตัวกรองที่เลือก:' : 'Active:'}
                </span>

                {selectedMedium !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#C5A880] text-xs text-[#1A1918] font-medium shadow-xs">
                    <span>{selectedMedium}</span>
                    <button onClick={() => setSelectedMedium('all')} className="text-neutral-400 hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedSize !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#C5A880] text-xs text-[#1A1918] font-medium shadow-xs">
                    <span>
                      {selectedSize === 'small' ? (lang === 'th' ? 'ขนาดเล็ก (< 50 ซม.)' : 'Small (< 50cm)') :
                       selectedSize === 'medium' ? (lang === 'th' ? 'ขนาดกลาง (50 - 120 ซม.)' : 'Medium (50 - 120cm)') :
                       (lang === 'th' ? 'ขนาดใหญ่ (> 120 ซม.)' : 'Large (> 120cm)')}
                    </span>
                    <button onClick={() => setSelectedSize('all')} className="text-neutral-400 hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCountry !== 'all' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#C5A880] text-xs text-[#1A1918] font-medium shadow-xs">
                    <CountryFlag country={selectedCountry} size="xs" />
                    <span>{selectedCountry}</span>
                    <button onClick={() => setSelectedCountry('all')} className="text-neutral-400 hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {sortBy !== 'default' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#C5A880] text-xs text-[#1A1918] font-medium shadow-xs">
                    <ArrowUpDown className="w-3 h-3 text-[#8C6D3F]" />
                    <span>
                      {sortBy === 'title_asc' ? (lang === 'th' ? 'เรียงตามชื่อผลงาน (A-Z)' : 'Title A-Z') :
                       sortBy === 'artist_asc' ? (lang === 'th' ? 'เรียงตามชื่อศิลปิน (A-Z)' : 'Artist A-Z') :
                       (lang === 'th' ? 'เรียงตามปีที่สร้าง (ใหม่สุด)' : 'Newest Year')}
                    </span>
                    <button onClick={() => setSortBy('default')} className="text-neutral-400 hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedArtistId && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-[#C5A880] text-xs text-[#1A1918] font-medium shadow-xs">
                    <span>{artists.find(a => a.id === selectedArtistId)?.name || 'Artist'}</span>
                    <button onClick={() => setSelectedArtistId(null)} className="text-neutral-400 hover:text-red-500 cursor-pointer">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  onClick={handleClearAllFilters}
                  className="text-xs text-[#8C6D3F] hover:text-[#5C4524] underline font-bold ml-1 cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === 'th' ? 'ล้างทั้งหมด' : 'Clear all'}</span>
                </button>
              </div>
            )}

            {/* Collapsible Faceted Filter Drawer (Minimalist Swiss Grid) */}
            {isFilterOpen && (
              <div className="p-4 sm:p-6 bg-gradient-to-br from-[#FAF8F5] to-[#F5EFEB] border border-[#DDD7CC] rounded-2xl shadow-sm space-y-4 animate-slide-up mt-2">
                {/* 1. Medium / Technique Row */}
                {availableMediums.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D3F] block">
                      {lang === 'th' ? '🎨 เทคนิค / วัสดุ (Medium)' : '🎨 Medium / Technique'}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setSelectedMedium('all')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          selectedMedium === 'all'
                            ? 'bg-[#1A1918] text-white shadow-xs'
                            : 'bg-white hover:bg-[#FAF6EE] text-[#4A453C] border border-[#E5DFD3]'
                        }`}
                      >
                        {lang === 'th' ? 'ทั้งหมด' : 'All'}
                      </button>
                      {availableMediums.map((m) => (
                        <button
                          key={m}
                          onClick={() => setSelectedMedium(m)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            selectedMedium === m
                              ? 'bg-[#8C6D3F] text-white shadow-xs'
                              : 'bg-white hover:bg-[#FAF6EE] text-[#4A453C] border border-[#E5DFD3]'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Dimensions / Size Row */}
                <div className="space-y-1.5 pt-1 border-t border-[#EAE4D8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D3F] block">
                    {lang === 'th' ? '📐 ขนาดผลงาน (Artwork Scale)' : '📐 Artwork Scale'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'all', labelTh: 'ทุกขนาด', labelEn: 'All Sizes' },
                      { id: 'small', labelTh: 'ขนาดเล็ก (< 50 ซม.)', labelEn: 'Small (< 50cm)' },
                      { id: 'medium', labelTh: 'ขนาดกลาง (50 - 120 ซม.)', labelEn: 'Medium (50 - 120cm)' },
                      { id: 'large', labelTh: 'ขนาดใหญ่ (> 120 ซม.)', labelEn: 'Large (> 120cm)' },
                    ].map((sz) => (
                      <button
                        key={sz.id}
                        onClick={() => setSelectedSize(sz.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          selectedSize === sz.id
                            ? 'bg-[#8C6D3F] text-white shadow-xs'
                            : 'bg-white hover:bg-[#FAF6EE] text-[#4A453C] border border-[#E5DFD3]'
                        }`}
                      >
                        {lang === 'th' ? sz.labelTh : sz.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Country / Nationality Row */}
                {availableCountries.length > 1 && (
                  <div className="space-y-1.5 pt-1 border-t border-[#EAE4D8]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D3F] block">
                      {lang === 'th' ? '🌍 สัญชาติศิลปิน (Nationality)' : '🌍 Nationality'}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => setSelectedCountry('all')}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          selectedCountry === 'all'
                            ? 'bg-[#1A1918] text-white shadow-xs'
                            : 'bg-white hover:bg-[#FAF6EE] text-[#4A453C] border border-[#E5DFD3]'
                        }`}
                      >
                        {lang === 'th' ? 'ทุกสัญชาติ' : 'All Countries'}
                      </button>
                      {availableCountries.map((c) => (
                        <button
                          key={c}
                          onClick={() => setSelectedCountry(c)}
                          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                            selectedCountry === c
                              ? 'bg-[#8C6D3F] text-white shadow-xs'
                              : 'bg-white hover:bg-[#FAF6EE] text-[#4A453C] border border-[#E5DFD3]'
                          }`}
                        >
                          <CountryFlag country={c} size="xs" />
                          <span>{c}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Sorting Row */}
                <div className="space-y-1.5 pt-1 border-t border-[#EAE4D8]">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D3F] block">
                    {lang === 'th' ? '⚡ เรียงลำดับการแสดงผล (Sort By)' : '⚡ Sort By'}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'default', labelTh: 'ลำดับสูจิบัตร (Default Plate)', labelEn: 'Default Plate Order' },
                      { id: 'title_asc', labelTh: 'ชื่อผลงาน (A-Z / ก-ฮ)', labelEn: 'Title (A-Z)' },
                      { id: 'artist_asc', labelTh: 'ชื่อศิลปิน (A-Z / ก-ฮ)', labelEn: 'Artist (A-Z)' },
                      { id: 'year_desc', labelTh: 'ปีที่สร้าง (ใหม่สุด)', labelEn: 'Year Created (Newest)' },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setSortBy(st.id)}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          sortBy === st.id
                            ? 'bg-[#1A1918] text-white shadow-xs'
                            : 'bg-white hover:bg-[#FAF6EE] text-[#4A453C] border border-[#E5DFD3]'
                        }`}
                      >
                        {sortBy === st.id && <Check className="w-3 h-3 text-[#C5A880]" />}
                        <span>{lang === 'th' ? st.labelTh : st.labelEn}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {filteredArtworks.length === 0 ? (
            <div className="py-20 text-center text-[#8C867B] border border-dashed border-[#DDD7CC] rounded-xl">
              {lang === 'th' ? 'ไม่พบผลงานสำหรับตัวกรองนี้' : 'No artworks found for this filter.'}
            </div>
          ) : columnMode === 'single' ? (
            /* 1-COLUMN LARGE IMMERSIVE CARDS (เน้นแสดงภาพเต็มตา) */
            <div className="space-y-16">
              {filteredArtworks.map((artwork, idx) => {
                const artist = artwork.artist;

                return (
                  <article
                    key={artwork.id}
                    className="bg-white rounded-2xl border border-[#DCD5C8] shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                  >
                    {/* Header Bar: Plate Number & Nationality */}
                    <div className="bg-[#FAF8F5] px-6 py-4 border-b border-[#EAE4D8] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-[#8C6D3F] uppercase tracking-widest bg-[#EFEBE2] px-3 py-1 rounded-full">
                          {t.actions.plate} #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2 text-xs font-semibold text-[#4A453C]">
                          <CountryFlag country={artist?.country} size="xs" />
                          <span>{artist?.country || 'International'}</span>
                        </div>
                      </div>

                      <span className="text-xs font-medium text-[#7D776B]">
                        {artwork.yearCreated || '2026'}
                      </span>
                    </div>

                    {/* Prominent Large Artwork Frame (ภาพขนาดใหญ่เต็มตา) */}
                    <div
                      onClick={() => setSelectedArtwork(artwork)}
                      className="relative w-full aspect-[16/10] sm:aspect-[16/9] max-h-[640px] bg-[#FAF8F5] cursor-pointer overflow-hidden group"
                    >
                      <Image
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        fill
                        sizes="(max-width: 1200px) 100vw, 1200px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        priority={idx < 2}
                      />

                      {/* Zoom Prompt & View in Room Floating Overlays with Tooltip Bubbles */}
                      <div className="absolute bottom-4 right-4 z-10 flex items-center gap-2">
                        <TooltipBubble content={lang === 'th' ? 'จำลองแขวนบนผนังห้อง (View in Room)' : 'View in Room'} position="top">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoomModalArtwork(artwork);
                            }}
                            className="w-10 h-10 flex items-center justify-center bg-[#C5A880] hover:bg-[#B39366] text-[#121110] rounded-full transition-all shadow-lg active:scale-95 cursor-pointer"
                            aria-label="View in Room"
                          >
                            <Frame className="w-4 h-4" />
                          </button>
                        </TooltipBubble>

                        <TooltipBubble content={t.actions.zoomInspect} position="top">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedArtwork(artwork);
                            }}
                            className="w-10 h-10 flex items-center justify-center bg-black/80 hover:bg-black text-[#C5A880] rounded-full backdrop-blur border border-white/20 transition-all shadow-lg active:scale-95 cursor-pointer"
                            aria-label="Zoom In"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </TooltipBubble>
                      </div>
                    </div>

                    {/* Curatorial Details & Concept Placard */}
                    <div className="p-6 sm:p-10 bg-white space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-[#F0ECE4] pb-6">
                        {/* Title & Specs */}
                        <div className="space-y-2">
                          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1918] leading-tight">
                            {artwork.title}
                          </h2>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6B655A] font-medium pt-1">
                            <span>{t.specs.medium}: <strong className="text-[#2C2924]">{artwork.medium}</strong></span>
                            <span>•</span>
                            <span>{t.specs.dimensions}: <strong className="text-[#2C2924]">{formatDimensionsInCm(artwork.dimensions, lang)}</strong></span>
                          </div>
                        </div>

                        {/* Artist Profile Card (Clickable) */}
                        {artist ? (
                          <Link
                            href={`/artists/${artist.id}`}
                            className="group/artist flex items-center gap-3 bg-[#FAF8F5] hover:bg-[#EFEBE2] p-3.5 rounded-xl border border-[#EBE5DA] hover:border-[#8C6D3F] shrink-0 sm:min-w-[260px] transition-all shadow-sm"
                            title={lang === 'th' ? `คลิกเพื่อดูผลงานทั้งหมดของ ${artist.name}` : `View all works by ${artist.name}`}
                          >
                            <div className="relative shrink-0">
                              <div className="border border-[#C5A880]/50 rounded-full shadow group-hover/artist:scale-105 transition-transform">
                                <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size="md" />
                              </div>
                              {/* Real Flag Badge */}
                              <div
                                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#1A1918] border border-[#C5A880] overflow-hidden flex items-center justify-center shadow"
                                title={artist.country || 'Country'}
                              >
                                <CountryFlag country={artist.country} size="badge" shape="circle" />
                              </div>
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-sans text-sm font-bold text-[#1A1918] group-hover/artist:text-[#8C6D3F] transition-colors truncate">
                                {artist.name}
                              </h3>
                              {artist.email && (
                                <p className="text-[10px] text-[#8C6D3F] font-mono truncate">
                                  ✉️ {artist.email}
                                </p>
                              )}
                              <p className="text-[11px] text-[#5A554A] font-semibold flex items-center gap-1.5 mt-0.5">
                                <CountryFlag country={artist.country} size="xs" />
                                <span>{artist.country || 'International'}</span>
                              </p>
                              <span className="text-[10px] text-[#7A7468] underline group-hover/artist:text-[#1A1918] mt-1 block">
                                {lang === 'th' ? '👨‍🎨 ชมผลงานทั้งหมด ➔' : 'View portfolio ➔'}
                              </span>
                            </div>
                          </Link>
                        ) : null}
                      </div>

                      {/* Concept Narrative Block (Optional) */}
                      {(artwork.concept?.trim() || artwork.description?.trim()) && (
                        <div className="bg-[#FAF8F5] p-5 rounded-xl border border-[#EAE4D8] space-y-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D3F] block">
                            {t.specs.concept} / Curatorial Statement:
                          </span>
                          <p className="text-xs sm:text-sm text-[#474239] leading-relaxed font-serif italic">
                            &quot;{artwork.concept?.trim() || artwork.description?.trim()}&quot;
                          </p>
                        </div>
                      )}

                      {/* Footer Actions: HD Zoom & Inquire with Tooltip Bubbles */}
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <TooltipBubble content={t.actions.zoomInspect} position="top">
                          <button
                            onClick={() => setSelectedArtwork(artwork)}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#FAF8F5] hover:bg-[#EFEBE2] text-[#2C2925] border border-[#D5CEC0] rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                          >
                            <Maximize2 className="w-4 h-4 text-[#8C6D3F]" />
                            <span>{t.actions.zoomInspect}</span>
                          </button>
                        </TooltipBubble>

                        <TooltipBubble content={lang === 'th' ? 'สอบถามข้อมูล / สนใจซื้อผลงานชิ้นนี้' : 'Inquire / Purchase Artwork'} position="top">
                          <button
                            onClick={() => setInquiryArtwork(artwork)}
                            className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1918] hover:bg-[#8B1B1B] text-[#D4AF37] hover:text-white border border-[#D4AF37]/30 rounded-xl text-xs font-semibold uppercase tracking-wider shadow-md transition-all active:scale-98 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" />
                            <span>{t.actions.inquireCurator}</span>
                          </button>
                        </TooltipBubble>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            /* MULTI-GRID OPTION */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {filteredArtworks.map((artwork, idx) => {
                const artist = artwork.artist;

                return (
                  <div
                    key={artwork.id}
                    onClick={() => setSelectedArtwork(artwork)}
                    className="group cursor-pointer bg-white rounded-xl border border-[#E2DDD3] hover:border-[#C4BCAD] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                  >
                    <div className="relative aspect-[4/3] bg-[#FAF8F5] overflow-hidden">
                      <Image
                        src={artwork.imageUrl}
                        alt={artwork.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Country Flag Badge */}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold bg-black/75 text-white backdrop-blur flex items-center gap-1.5 shadow border border-white/20">
                        <CountryFlag country={artist?.country} size="xs" shape="circle" />
                        <span className="text-[10px] text-[#E2CEB5]">{artist?.country || 'Artist'}</span>
                      </span>
                    </div>

                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1B19] group-hover:text-[#8C7149] transition-colors line-clamp-1">
                          {artwork.title}
                        </h3>
                        <p className="text-xs text-[#524E46] mt-0.5 font-medium flex items-center gap-1.5">
                          <span>{artist?.name || 'Artist'}</span>
                          <span className="text-[#A8A295]">•</span>
                          <span className="text-[#8C6D3F]">{artist?.country}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#F0ECE4] text-[11px] text-[#7A746A] space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[#968F83]">{t.specs.medium}:</span>
                          <span className="font-medium text-[#2C2924] truncate pl-2">{artwork.medium}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#968F83]">{t.specs.dimensions}:</span>
                          <span className="font-medium text-[#2C2924]">{formatDimensionsInCm(artwork.dimensions, lang)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Digital Guestbook & Signature Wall */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12">
        <DigitalGuestbook
          exhibitionSlug={exhibition.slug}
          exhibitionTitle={exhibition.title}
        />
      </div>

      {/* Lightbox Modal */}
      <ArtworkLightbox
        artwork={selectedArtwork}
        artworksList={filteredArtworks}
        isOpen={Boolean(selectedArtwork)}
        onClose={() => setSelectedArtwork(null)}
        onSelectArtwork={(art) => setSelectedArtwork(art)}
        onOpenInquiry={(art) => {
          setSelectedArtwork(null);
          setInquiryArtwork(art);
        }}
      />

      {/* Inquiry Modal */}
      <ArtworkInquiryModal
        artwork={inquiryArtwork}
        isOpen={Boolean(inquiryArtwork)}
        onClose={() => setInquiryArtwork(null)}
      />

      {/* View In Room Modal */}
      {roomModalArtwork && (
        <ViewInRoomModal
          artwork={roomModalArtwork}
          isOpen={Boolean(roomModalArtwork)}
          onClose={() => setRoomModalArtwork(null)}
          onOpenInquiry={(art) => {
            setRoomModalArtwork(null);
            setInquiryArtwork(art);
          }}
        />
      )}
    </div>
  );
}
