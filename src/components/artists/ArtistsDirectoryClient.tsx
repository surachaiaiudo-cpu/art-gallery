'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Artwork } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import {
  Home,
  Sparkles,
  Building2,
  Palette,
  ArrowRight,
  Mail,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Globe,
  ExternalLink,
  Layers,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { ArtistAvatar } from '@/components/ui/ArtistAvatar';

interface ArtistWithStats extends User {
  artworkCount: number;
  exhibitionCount: number;
  exhibitions: Array<{ id: string; title: string; slug: string; status: string }>;
  previewArtworks: Artwork[];
}

interface ArtistsDirectoryClientProps {
  artists: ArtistWithStats[];
}

export function ArtistsDirectoryClient({ artists }: ArtistsDirectoryClientProps) {
  const { lang, t } = useLanguage();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'country-asc' | 'country-desc' | 'artworks-desc' | 'default'>('name-asc');

  const countries = useMemo(() => {
    const set = new Set<string>();
    artists.forEach((a) => {
      if (a.country && a.country.trim()) set.add(a.country.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'th'));
  }, [artists]);

  const filteredArtists = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = artists.filter((artist) => {
      const matchesQuery =
        !q ||
        artist.name.toLowerCase().includes(q) ||
        (artist.country || '').toLowerCase().includes(q) ||
        (artist.email || '').toLowerCase().includes(q) ||
        (artist.bio || '').toLowerCase().includes(q) ||
        artist.previewArtworks.some((art) => art.title.toLowerCase().includes(q));

      const matchesCountry =
        selectedCountry === 'all' || (artist.country || 'Thailand').trim() === selectedCountry;

      return matchesQuery && matchesCountry;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'name-asc') {
        return a.name.localeCompare(b.name, 'th');
      }
      if (sortBy === 'name-desc') {
        return b.name.localeCompare(a.name, 'th');
      }
      if (sortBy === 'country-asc') {
        const cA = (a.country || 'Thailand').trim();
        const cB = (b.country || 'Thailand').trim();
        const cComp = cA.localeCompare(cB, 'th');
        if (cComp !== 0) return cComp;
        return a.name.localeCompare(b.name, 'th');
      }
      if (sortBy === 'country-desc') {
        const cA = (a.country || 'Thailand').trim();
        const cB = (b.country || 'Thailand').trim();
        const cComp = cB.localeCompare(cA, 'th');
        if (cComp !== 0) return cComp;
        return a.name.localeCompare(b.name, 'th');
      }
      if (sortBy === 'artworks-desc') {
        return (b.artworkCount || 0) - (a.artworkCount || 0);
      }
      return 0;
    });
  }, [artists, searchQuery, selectedCountry, sortBy]);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E1D1B] pb-24">
      {/* Top Header Navigation */}
      <div className="sticky top-0 z-30 bg-[#FAF8F5]/90 backdrop-blur border-b border-[#E3DED4] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8C6D3F] hover:text-[#1A1918] transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>{t.actions.returnToLobby}</span>
        </Link>

        {/* View Mode Switcher in Navbar */}
        <div className="flex items-center bg-[#ECE6DC] p-1 rounded-xl border border-[#DDD6C8] shadow-sm text-xs font-semibold">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-[#1A1918] text-white shadow'
                : 'text-[#6E685C] hover:text-[#1A1918]'
            }`}
            title="Grid Cards View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'การ์ด' : 'Cards'}</span>
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
              viewMode === 'table'
                ? 'bg-[#1A1918] text-white shadow'
                : 'text-[#6E685C] hover:text-[#1A1918]'
            }`}
            title="Table Spreadsheet View"
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'ตาราง' : 'Table'}</span>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <section className="relative bg-[#1A1918] text-white py-16 px-4 sm:px-8 overflow-hidden text-center">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="max-w-3xl mx-auto relative z-10 space-y-3">
          <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">
            {lang === 'th' ? 'ทำเนียบศิลปินแห่งหอศิลป์' : 'Museum Artists Directory'}
          </span>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight">
            {lang === 'th' ? 'ทำเนียบศิลปินและผลงานสร้างสรรค์' : 'Featured Masters & Artists'}
          </h1>
          <p className="text-xs sm:text-sm text-[#D8D2C6] leading-relaxed font-serif">
            {lang === 'th'
              ? 'รวบรวมประวัติและผลงานศิลปกรรมของศิลปินชั้นครูและศิลปินร่วมสมัยนานาชาติ สามารถเลือกชมได้ทั้งแบบการ์ดและแบบตารางข้อมูลสรุป'
              : 'Explore master portfolios, creative artwork collections, and exhibition history in Card or Table format.'}
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-8 space-y-6">
        {/* Controls Toolbar: Search + Country Filter + View Mode Toggle */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E0D9CD] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#8C6D3F] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'th'
                  ? 'ค้นหาชื่อศิลปิน, ผลงาน, สัญชาติ, อีเมล...'
                  : 'Search artist, artwork title, country, email...'
              }
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-xs text-[#1A1918] placeholder-[#A0988A] focus:outline-none focus:border-[#C5A880]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-neutral-700"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Country Filter */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#DDD6C8] px-3 py-2 rounded-xl text-xs">
              <Globe className="w-3.5 h-3.5 text-[#8C6D3F] shrink-0" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-transparent text-xs text-[#1A1918] focus:outline-none cursor-pointer font-medium max-w-[130px] sm:max-w-none"
              >
                <option value="all">{lang === 'th' ? 'ทุกสัญชาติ (All Countries)' : 'All Countries'}</option>
                {countries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#DDD6C8] px-3 py-2 rounded-xl text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#8C6D3F] shrink-0" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent text-xs text-[#1A1918] focus:outline-none cursor-pointer font-medium max-w-[160px] sm:max-w-none"
              >
                <option value="name-asc">{lang === 'th' ? '🔤 ชื่อศิลปิน (A → Z / ก → ฮ)' : '🔤 Name (A → Z)'}</option>
                <option value="name-desc">{lang === 'th' ? '🔤 ชื่อศิลปิน (Z → A / ฮ → ก)' : '🔤 Name (Z → A)'}</option>
                <option value="country-asc">{lang === 'th' ? '🌐 เรียงตามประเทศ (Country A → Z)' : '🌐 Country (A → Z)'}</option>
                <option value="country-desc">{lang === 'th' ? '🌐 เรียงตามประเทศ (Country Z → A)' : '🌐 Country (Z → A)'}</option>
                <option value="artworks-desc">{lang === 'th' ? '🎨 จำนวนผลงาน (มาก → น้อย)' : '🎨 Most Artworks'}</option>
                <option value="default">{lang === 'th' ? '🕒 ลำดับเดิม (Default)' : '🕒 Default'}</option>
              </select>
            </div>

            {/* Total Count Badge */}
            <span className="text-xs text-[#7A7468] font-medium hidden sm:inline px-1">
              {lang === 'th' ? `ศิลปิน ${filteredArtists.length} ท่าน` : `${filteredArtists.length} Artists`}
            </span>

            {/* View Mode Toggle Buttons */}
            <div className="flex items-center bg-[#ECE6DC] p-1 rounded-xl border border-[#DDD6C8] text-xs font-semibold">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#1A1918] text-white shadow'
                    : 'text-[#6E685C] hover:text-[#1A1918]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'th' ? 'การ์ด' : 'Cards'}</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'table'
                    ? 'bg-[#1A1918] text-white shadow'
                    : 'text-[#6E685C] hover:text-[#1A1918]'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{lang === 'th' ? 'ตาราง' : 'Table'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Counter Info */}
        <div className="flex items-center justify-between text-xs text-[#7A7468] px-1 font-medium">
          <span>
            {lang === 'th'
              ? `พบศิลปิน ${filteredArtists.length} ท่าน`
              : `Showing ${filteredArtists.length} Artists`}
          </span>
          <span className="font-mono text-[#8C6D3F] uppercase tracking-wider text-[11px]">
            {viewMode === 'grid' ? (lang === 'th' ? 'มุมมองการ์ด' : 'Grid View') : (lang === 'th' ? 'มุมมองตาราง' : 'Table View')}
          </span>
        </div>

        {/* MODE 1: GRID VIEW (การ์ดศิลปิน) */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArtists.map((artist) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="group bg-white rounded-2xl border border-[#DDD6C8] shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Header Banner with Avatar and Flag Bubble */}
                  <div className="relative bg-[#2A231C] p-6 text-white flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="border-2 border-[#C5A880] rounded-full shadow-lg group-hover:scale-105 transition-transform shrink-0">
                        <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size="xl" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-serif text-lg font-bold truncate group-hover:text-[#C5A880] transition-colors leading-snug">
                          {artist.name}
                        </h3>
                        {artist.email && (
                          <p className="text-[11px] text-[#C5A880] font-mono truncate">
                            {artist.email}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Country Flag Bubble (Image Only) */}
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden border-2 border-[#C5A880] shadow-md flex items-center justify-center bg-[#1A1918] shrink-0 group-hover:scale-110 transition-transform"
                      title={artist.country || 'Country'}
                    >
                      <CountryFlag country={artist.country} size="badge" shape="circle" />
                    </div>
                  </div>

                  {/* Preview Thumbnails */}
                  {artist.previewArtworks.length > 0 && (
                    <div className="grid grid-cols-3 gap-1 p-2 bg-[#F3EFE9]">
                      {artist.previewArtworks.map((art) => (
                        <div key={art.id} className="relative aspect-square bg-[#1A1918] rounded overflow-hidden group/art">
                          <Image src={art.imageUrl} alt={art.title} fill className="object-cover group-hover/art:scale-110 transition-transform" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Content */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-[#6E685C] line-clamp-3 font-serif italic">
                      "{artist.bio || (lang === 'th' ? 'ศิลปินผู้ร่วมจัดแสดงผลงานในหอศิลป์' : 'Featured artist.')}"
                    </p>

                    {/* Exhibitions Tag List */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#8C6D3F] block">
                        {lang === 'th' ? 'นิทรรศการที่ร่วมแสดง:' : 'Exhibitions:'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {artist.exhibitions.map((exh) => (
                          <span
                            key={exh.id}
                            className="text-[10px] px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#DDD6C8] text-[#5A554A] truncate max-w-[180px]"
                          >
                            🏛️ {exh.title.split(':')[0]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Stats & Link */}
                <div className="p-5 pt-0 border-t border-[#F0ECE4] flex items-center justify-between pt-3">
                  <span className="text-xs font-mono font-bold text-[#8C6D3F]">
                    {artist.artworkCount} {t.lobby.artworksCount}
                  </span>

                  <span className="text-xs font-semibold text-[#1A1918] group-hover:text-[#8C6D3F] flex items-center gap-1 transition-colors">
                    <span>{lang === 'th' ? 'ชมผลงานทั้งหมด' : 'View Works'}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* MODE 2: TABLE VIEW (ตารางทำเนียบศิลปินและผลงานสร้างสรรค์) */}
        {viewMode === 'table' && (
          <div className="bg-white rounded-2xl border border-[#E0D9CD] shadow-sm overflow-hidden animate-fade-in">
            <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A1918] text-[#E5D2B8] text-xs font-bold uppercase tracking-wider border-b border-[#33302C]">
                    <th
                      className="py-4 px-3 w-12 text-center cursor-pointer select-none hover:text-white transition-colors"
                      onClick={() => setSortBy('default')}
                      title={lang === 'th' ? 'เรียงตามลำดับเริ่มต้น' : 'Default Order'}
                    >
                      #
                    </th>
                    <th
                      className="py-4 px-4 cursor-pointer select-none hover:text-white transition-colors"
                      onClick={() => setSortBy(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')}
                      title={lang === 'th' ? 'คลิกเพื่อเรียงตามชื่อ ก-ฮ / A-Z' : 'Click to sort by Name'}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>{lang === 'th' ? 'ศิลปิน' : 'Artist'}</span>
                        {sortBy === 'name-asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#C5A880]" />
                        ) : sortBy === 'name-desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#C5A880]" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#6E685C] hover:text-[#C5A880]" />
                        )}
                      </div>
                    </th>
                    <th
                      className="py-4 px-3 text-center w-24 cursor-pointer select-none hover:text-white transition-colors"
                      onClick={() => setSortBy(sortBy === 'country-asc' ? 'country-desc' : 'country-asc')}
                      title={lang === 'th' ? 'คลิกเพื่อเรียงตามประเทศ' : 'Click to sort by Country'}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{lang === 'th' ? 'สัญชาติ' : 'Country'}</span>
                        {sortBy === 'country-asc' ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#C5A880]" />
                        ) : sortBy === 'country-desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#C5A880]" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#6E685C] hover:text-[#C5A880]" />
                        )}
                      </div>
                    </th>
                    <th className="py-4 px-4">{lang === 'th' ? 'ช่องทางติดต่อ (Email)' : 'Primary Contact'}</th>
                    <th className="py-4 px-4">{lang === 'th' ? 'ผลงานสร้างสรรค์' : 'Creative Works'}</th>
                    <th
                      className="py-4 px-3 text-center cursor-pointer select-none hover:text-white transition-colors"
                      onClick={() => setSortBy(sortBy === 'artworks-desc' ? 'default' : 'artworks-desc')}
                      title={lang === 'th' ? 'คลิกเพื่อเรียงตามจำนวนผลงาน' : 'Click to sort by Artworks count'}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{lang === 'th' ? 'จำนวนผลงาน' : 'Artworks'}</span>
                        {sortBy === 'artworks-desc' ? (
                          <ArrowDown className="w-3.5 h-3.5 text-[#C5A880]" />
                        ) : (
                          <ArrowUpDown className="w-3.5 h-3.5 text-[#6E685C] hover:text-[#C5A880]" />
                        )}
                      </div>
                    </th>
                    <th className="py-4 px-4">{lang === 'th' ? 'นิทรรศการ' : 'Exhibitions'}</th>
                    <th className="py-4 px-4 text-right">{lang === 'th' ? 'ดูโปรไฟล์' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0ECE4] text-xs text-[#2C2925]">
                  {filteredArtists.map((artist, idx) => (
                    <tr
                      key={artist.id}
                      className="hover:bg-[#FAF8F5] transition-colors group"
                    >
                      {/* # Index */}
                      <td className="py-4 px-3 text-center font-mono text-[#8C8477] font-semibold">
                        {idx + 1}
                      </td>

                      {/* Artist Avatar & Name */}
                      <td className="py-4 px-4">
                        <Link
                          href={`/artists/${artist.id}`}
                          className="flex items-center gap-3 group-hover:text-[#8C6D3F] transition-colors"
                        >
                          <div className="border-2 border-[#C5A880] rounded-full shadow shrink-0">
                            <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size="md" />
                          </div>
                          <div>
                            <span className="font-serif text-sm font-bold text-[#1A1918] group-hover:text-[#8C6D3F] block leading-snug">
                              {artist.name}
                            </span>
                            <span className="text-[11px] text-[#7A7468] line-clamp-1 max-w-[200px]">
                              {artist.bio || (lang === 'th' ? 'ศิลปินผู้ร่วมจัดแสดง' : 'Featured Artist')}
                            </span>
                          </div>
                        </Link>
                      </td>

                      {/* Country Flag Bubble (Image Only) */}
                      <td className="py-4 px-3 text-center">
                        <div
                          className="inline-flex w-8 h-8 rounded-full overflow-hidden border border-[#C5A880] shadow-sm items-center justify-center bg-white hover:scale-110 transition-transform"
                          title={artist.country || 'Country'}
                        >
                          <CountryFlag country={artist.country} size="badge" shape="circle" />
                        </div>
                      </td>

                      {/* Primary Contact: Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-[#8C6D3F]">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <a
                            href={`mailto:${artist.email}`}
                            className="hover:underline truncate max-w-[180px]"
                            title={artist.email}
                          >
                            {artist.email}
                          </a>
                        </div>
                      </td>

                      {/* Creative Works Miniature Previews */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {artist.previewArtworks.slice(0, 3).map((art) => (
                            <Link
                              key={art.id}
                              href={`/artists/${artist.id}`}
                              className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#D5CEC0] shadow-sm hover:scale-110 transition-transform shrink-0"
                              title={art.title}
                            >
                              <Image src={art.imageUrl} alt={art.title} fill className="object-cover" />
                            </Link>
                          ))}
                          {artist.previewArtworks.length > 3 && (
                            <span className="text-[10px] font-bold text-[#8C6D3F] bg-[#FAF8F5] px-1.5 py-1 rounded border border-[#DDD6C8]">
                              +{artist.previewArtworks.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Artworks Count */}
                      <td className="py-4 px-3 text-center">
                        <span className="inline-block font-mono font-bold text-xs bg-[#FAF8F5] text-[#8C6D3F] border border-[#DDD6C8] px-2.5 py-1 rounded-full shadow-sm">
                          {artist.artworkCount} {lang === 'th' ? 'ชิ้น' : 'works'}
                        </span>
                      </td>

                      {/* Exhibitions */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {artist.exhibitions.map((exh) => (
                            <span
                              key={exh.id}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#DDD6C8] text-[#5A554A] truncate max-w-[160px]"
                              title={exh.title}
                            >
                              {exh.title.split(':')[0]}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Action Link Button */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/artists/${artist.id}`}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-[#1A1918] hover:bg-[#33302C] text-white text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
                        >
                          <span>{lang === 'th' ? 'ชมผลงาน' : 'View Works'}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[#C5A880]" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredArtists.length === 0 && (
          <div className="bg-white rounded-2xl border border-[#E0D9CD] p-12 text-center space-y-3 shadow-sm">
            <Palette className="w-12 h-12 text-[#C5A880] mx-auto opacity-50" />
            <h3 className="font-serif text-lg font-bold text-[#1A1918]">
              {lang === 'th' ? 'ไม่พบข้อมูลศิลปิน' : 'No Artists Found'}
            </h3>
            <p className="text-xs text-[#8C8477]">
              {lang === 'th' ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรองใหม่อีกครั้ง' : 'Try adjusting your search criteria.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
