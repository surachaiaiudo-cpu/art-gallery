'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Exhibition } from '@/types/exhibition';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import { Eye, Box, Download, Sparkles, Calendar, GalleryHorizontal, Layers, ArrowRight, BookOpen, Compass, Shield } from 'lucide-react';
import { formatDateRange } from '@/lib/utils';
import { CountryFlag } from '@/components/ui/CountryFlag';

interface HomeClientProps {
  exhibitions: Exhibition[];
}

export function HomeClient({ exhibitions }: HomeClientProps) {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  const filteredExhibitions = exhibitions.filter((exh) => {
    if (filter === 'active') return exh.status === 'active';
    if (filter === 'archived') return exh.status === 'archived';
    return true;
  });

  const featuredExhibition = exhibitions.find((e) => e.status === 'active') || exhibitions[0];

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4EE] text-[#1E1D1B]">
      {/* Top Header */}
      <Navbar exhibition={featuredExhibition} />

      <main className="flex-1">
        {/* Grand Lobby Welcome Hero Banner */}
        <section className="relative overflow-hidden bg-[#161412] text-white border-b border-[#3D3830]">
          {/* Subtle Parallax Background */}
          {featuredExhibition && (
            <div className="absolute inset-0 opacity-35 mix-blend-luminosity">
              <Image
                src={
                  featuredExhibition.bannerUrl ||
                  'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop'
                }
                alt="ARTVARA Grand Lobby"
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#161412] via-[#161412]/75 to-transparent" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 flex flex-col items-start justify-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/40 text-[#E2CEB5] text-xs font-semibold uppercase tracking-widest mb-6">
              <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{t.lobby.grandLobby}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl leading-[1.15] mb-4">
              {t.lobby.welcomeTitle}
            </h1>

            <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl leading-relaxed mb-8 font-light">
              {t.lobby.welcomeSubtitle}
            </p>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-2 bg-black/50 p-1.5 rounded-full border border-white/20 backdrop-blur">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  filter === 'all'
                    ? 'bg-[#C5A880] text-[#1A1918] shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {t.actions.allArtworks} ({exhibitions.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  filter === 'active'
                    ? 'bg-[#C5A880] text-[#1A1918] shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {t.lobby.activeStatus}
              </button>
              <button
                onClick={() => setFilter('archived')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  filter === 'archived'
                    ? 'bg-[#C5A880] text-[#1A1918] shadow'
                    : 'text-neutral-300 hover:text-white'
                }`}
              >
                {t.lobby.archivedStatus}
              </button>
            </div>
          </div>
        </section>

        {/* Exhibition Halls Grid in Lobby */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-18">
          <div className="flex items-center justify-between mb-8 border-b border-[#DFD8CC] pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block">
                {t.lobby.curatedExhibitions}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1918]">
                {lang === 'th' ? 'เลือกห้องนิทรรศการที่ต้องการเข้าชม' : 'Select an Exhibition Hall to Visit'}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {filteredExhibitions.map((exh, idx) => {
              const artworks = exh.artworks || [];
              const artists = exh.artists || [];
              const curator = exh.curator;

              return (
                <div
                  key={exh.id}
                  className="bg-white rounded-2xl border border-[#DDD6C8] shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Exhibition Banner Image */}
                    <div className="relative aspect-[16/10] bg-[#1A1918] overflow-hidden">
                      <Image
                        src={
                          exh.bannerUrl ||
                          'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop'
                        }
                        alt={exh.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                      {/* Status Tag */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold backdrop-blur shadow-sm ${
                            exh.status === 'active'
                              ? 'bg-emerald-800/90 text-emerald-100'
                              : 'bg-neutral-800/90 text-neutral-200'
                          }`}
                        >
                          {exh.status === 'active' ? t.lobby.activeStatus : t.lobby.archivedStatus}
                        </span>
                      </div>

                      {/* Bottom Banner Stats */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90">
                        <span>{artworks.length} {t.lobby.artworksCount}</span>
                        <span>{artists.length} {t.lobby.artistsCount}</span>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 space-y-3">
                      <div className="text-[11px] text-[#8C8477] flex items-center gap-1.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-[#8C6D3F]" />
                        <span>{formatDateRange(exh.startDate, exh.endDate)}</span>
                      </div>

                      <h3 className="font-serif text-xl font-bold text-[#1A1918] group-hover:text-[#8C6D3F] transition-colors leading-snug">
                        {exh.title}
                      </h3>

                      <p className="text-xs text-[#6E685C]">
                        {t.specs.curatedBy}: <span className="font-semibold text-[#1A1918]">{curator?.name || 'Curator'}</span>
                      </p>

                      {/* Participating Artists Flag List */}
                      {artists.length > 0 && (
                        <div className="pt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#5A554A]">
                          {artists.slice(0, 4).map((art) => (
                            <span
                              key={art.id}
                              className="bg-[#FAF8F5] px-2 py-1 rounded border border-[#E8E2D6] flex items-center gap-1.5 shadow-sm"
                            >
                              <CountryFlag country={art.country} size="xs" />
                              <span className="truncate max-w-[170px]">{art.name}</span>
                            </span>
                          ))}
                          {artists.length > 4 && (
                            <span className="text-[10px] text-[#8C6D3F] font-bold px-1.5 py-0.5 bg-[#FAF8F5] rounded border border-[#E8E2D6]">
                              +{artists.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4 Multi-Mode Entry Portals - Pure Luxury Icon Buttons */}
                  <div className="p-6 pt-0 border-t border-[#F0ECE4] mt-4 space-y-2.5">
                    <span className="text-[10px] uppercase tracking-widest text-[#8C6D3F] font-bold block pt-3">
                      {lang === 'th' ? 'เลือกโหมดการรับชม:' : 'Choose Viewing Mode:'}
                    </span>

                    <div className="grid grid-cols-4 gap-2.5">
                      {/* 1. 2D Gallery */}
                      <Link
                        href={`/exhibitions/${exh.slug}?mode=2d`}
                        className="group/btn relative h-12 flex items-center justify-center bg-[#FAF8F5] hover:bg-[#EFEAE1] text-[#3D3A34] rounded-xl border border-[#DDD6C8] shadow-sm transition-all hover:scale-105 active:scale-95"
                        title={t.modes.grid}
                      >
                        <Eye className="w-5 h-5 text-[#8C6D3F] group-hover/btn:scale-110 transition-transform" />
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/95 text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-all scale-95 group-hover/btn:scale-100 pointer-events-none border border-white/15 shadow-2xl z-30">
                          {t.modes.grid}
                        </span>
                      </Link>

                      {/* 2. Slideshow / Carousel */}
                      <Link
                        href={`/exhibitions/${exh.slug}?mode=carousel`}
                        className="group/btn relative h-12 flex items-center justify-center bg-[#1A1918] hover:bg-[#33302C] text-white rounded-xl shadow-sm transition-all hover:scale-105 active:scale-95"
                        title={t.modes.carousel}
                      >
                        <GalleryHorizontal className="w-5 h-5 text-[#C5A880] group-hover/btn:scale-110 transition-transform" />
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/95 text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-all scale-95 group-hover/btn:scale-100 pointer-events-none border border-white/15 shadow-2xl z-30">
                          {t.modes.carousel}
                        </span>
                      </Link>

                      {/* 3. 3D Virtual Walk */}
                      <Link
                        href={`/exhibitions/${exh.slug}?mode=3d`}
                        className="group/btn relative h-12 flex items-center justify-center bg-gradient-to-br from-[#C5A880] to-[#B39366] hover:brightness-110 text-[#1A1918] rounded-xl shadow-[0_3px_12px_rgba(197,168,128,0.35)] transition-all hover:scale-105 active:scale-95"
                        title={t.modes.room3d}
                      >
                        <Box className="w-5 h-5 text-[#1A1918] group-hover/btn:scale-110 transition-transform" />
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/95 text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-all scale-95 group-hover/btn:scale-100 pointer-events-none border border-white/15 shadow-2xl z-30">
                          {t.modes.room3d}
                        </span>
                      </Link>

                      {/* 4. E-Catalog */}
                      <Link
                        href={`/catalog/${exh.slug}`}
                        className="group/btn relative h-12 flex items-center justify-center bg-[#FAF8F5] hover:bg-[#EFEAE1] text-[#3D3A34] rounded-xl border border-[#DDD6C8] shadow-sm transition-all hover:scale-105 active:scale-95"
                        title={t.lobby.viewCatalog}
                      >
                        <BookOpen className="w-5 h-5 text-[#8C6D3F] group-hover/btn:scale-110 transition-transform" />
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-black/95 text-white text-[10px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-all scale-95 group-hover/btn:scale-100 pointer-events-none border border-white/15 shadow-2xl z-30">
                          {t.lobby.viewCatalog}
                        </span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer exhibition={featuredExhibition} />
    </div>
  );
}
