'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Exhibition, Artwork, is3DEnabled } from '@/types/exhibition';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/context/LanguageContext';
import {
  Eye,
  Box,
  Download,
  Sparkles,
  Calendar,
  GalleryHorizontal,
  Layers,
  ArrowRight,
  BookOpen,
  Compass,
  Shield,
  Palette,
  Maximize2,
  Volume2,
  Frame,
} from 'lucide-react';
import { formatDateRange, formatDimensionsInCm } from '@/lib/utils';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { ViewInRoomModal } from '@/components/exhibition/ViewInRoomModal';
import { CatalogSelectorModal } from '@/components/catalog/CatalogSelectorModal';

interface HomeClientProps {
  exhibitions: Exhibition[];
}

export function HomeClient({ exhibitions }: HomeClientProps) {
  const { lang, t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedSpotlightArtwork, setSelectedSpotlightArtwork] = useState<Artwork | null>(null);
  const [isViewInRoomOpen, setIsViewInRoomOpen] = useState(false);
  const [isCatalogSelectorOpen, setIsCatalogSelectorOpen] = useState(false);

  const filteredExhibitions = exhibitions.filter((exh) => {
    if (filter === 'active') return exh.status === 'active';
    if (filter === 'archived') return exh.status === 'archived';
    return true;
  });

  const featuredExhibition = exhibitions.find((e) => e.status === 'active') || exhibitions[0];
  const allArtworks = exhibitions.flatMap((e) => e.artworks || []);
  const spotlightArtwork = allArtworks[0] || null;

  return (
    <div className="min-h-screen flex flex-col bg-[#121110] text-[#FAF8F5] selection:bg-[#C5A880] selection:text-[#121110]">
      {/* Top Header */}
      <Navbar />

      <main className="flex-1">
        {/* ================= 1. GRAND CINEMATIC HERO SECTION ================= */}
        <section className="relative overflow-hidden min-h-[620px] lg:min-h-[720px] flex items-center justify-center border-b border-[#C5A880]/20">
          {/* Parallax Background with Ambient Spotlight */}
          {featuredExhibition && (
            <div className="absolute inset-0 opacity-40 mix-blend-luminosity scale-105">
              <Image
                src={
                  featuredExhibition.bannerUrl ||
                  'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop'
                }
                alt="ARTVARA Grand Lobby"
                fill
                className="object-cover transition-transform duration-1000"
                priority
              />
            </div>
          )}
          {/* Radial Luxury Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121110] via-[#121110]/80 to-black/40" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#C5A880]/20 via-transparent to-transparent pointer-events-none" />

          {/* Main Hero Container */}
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 flex flex-col items-start justify-center z-10">
            {/* Heritage Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/40 text-[#EAD8C0] text-xs font-semibold uppercase tracking-widest mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(197,168,128,0.15)]">
              <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{t.lobby.grandLobby} • POH-CHANG CURATED PAVILION</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.1] mb-6 text-[#FAF8F5]">
              {t.lobby.welcomeTitle}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-neutral-300 max-w-2xl leading-relaxed mb-10 font-light">
              {t.lobby.welcomeSubtitle}
            </p>

            {/* Action Buttons Hub */}
            {featuredExhibition && (
              <div className="flex flex-wrap items-center gap-4 mb-10">
                {is3DEnabled(featuredExhibition) && (
                  <Link
                    href={`/exhibitions/${featuredExhibition.slug}?mode=3d`}
                    className="group inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#C5A880] via-[#D4AF37] to-[#B39366] text-[#121110] text-xs sm:text-sm font-extrabold uppercase tracking-widest shadow-[0_0_30px_rgba(212,175,55,0.4)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <Box className="w-4 h-4 text-[#121110] group-hover:rotate-12 transition-transform" />
                    <span>{lang === 'th' ? 'เข้าชมห้องเสมือนจริง 3D' : 'Enter 3D Virtual Tour'}</span>
                    <span className="w-2 h-2 rounded-full bg-[#8B1B1B] animate-ping" />
                  </Link>
                )}

                <button
                  onClick={() => setIsCatalogSelectorOpen(true)}
                  className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-semibold uppercase tracking-wider backdrop-blur-md border border-white/20 hover:border-[#C5A880]/50 transition-all shadow-lg cursor-pointer active:scale-95"
                >
                  <BookOpen className="w-4 h-4 text-[#C5A880]" />
                  <span>{lang === 'th' ? 'เลือกเปิดอ่านสูจิบัตร' : 'Select E-Catalog'}</span>
                </button>

                <Link
                  href={`/exhibitions/${featuredExhibition.slug}?mode=2d`}
                  className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-black/50 hover:bg-black/80 text-neutral-300 hover:text-white text-xs sm:text-sm font-semibold uppercase tracking-wider border border-white/10 transition-all"
                >
                  <Eye className="w-4 h-4 text-neutral-400" />
                  <span>{lang === 'th' ? 'ชมผลงานทั้งหมด (2D)' : 'Browse Gallery'}</span>
                </Link>
              </div>
            )}

            {/* Quick Filter Navigation */}
            <div className="flex items-center gap-2 bg-[#1A1816]/90 p-1.5 rounded-full border border-[#C5A880]/30 backdrop-blur-md shadow-2xl">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  filter === 'all'
                    ? 'bg-[#C5A880] text-[#121110] font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t.actions.allArtworks} ({exhibitions.length})
              </button>
              <button
                onClick={() => setFilter('active')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  filter === 'active'
                    ? 'bg-[#C5A880] text-[#121110] font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t.lobby.activeStatus}
              </button>
              <button
                onClick={() => setFilter('archived')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  filter === 'archived'
                    ? 'bg-[#C5A880] text-[#121110] font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t.lobby.archivedStatus}
              </button>
            </div>
          </div>
        </section>

        {/* ================= 2. LIVE CURATORIAL STATS RIBBON ================= */}
        <section className="bg-[#181614] border-b border-[#2C2824] py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-x divide-[#2C2824]">
              <div className="px-3">
                <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#FAF8F5] block">
                  {allArtworks.length || 0}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A880]">
                  {lang === 'th' ? 'ผลงานวิจิตรศิลป์ที่จัดแสดง' : 'Curated Masterpieces'}
                </span>
              </div>
              <div className="px-3">
                <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#FAF8F5] block">
                  {exhibitions.length}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A880]">
                  {lang === 'th' ? 'ห้องนิทรรศการเสมือน' : 'Exhibition Pavilions'}
                </span>
              </div>
              <div className="px-3">
                <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#FAF8F5] block">
                  {exhibitions.filter(is3DEnabled).length}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A880]">
                  {lang === 'th' ? 'ทัวร์ 3 มิติเชิงโต้ตอบ' : '3D Spatial Engines'}
                </span>
              </div>
              <div className="px-3">
                <span className="font-serif text-2xl sm:text-3xl font-extrabold text-[#D4AF37] block">
                  1913
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A880]">
                  {lang === 'th' ? 'สืบสานคุณค่าศิลป์เพาะช่าง' : 'Poh-Chang Heritage'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 3. CURATOR'S MASTERPIECE SPOTLIGHT ================= */}
        {spotlightArtwork && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 border-b border-[#2C2824]">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold block">
                  {lang === 'th' ? 'ไฮไลต์ผลงานเด่นประจำสัปดาห์' : "Curator's Spotlight Masterpiece"}
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-bold text-[#FAF8F5]">
                  {lang === 'th' ? 'ผลงานมาสเตอร์พีซที่แนะนำ' : 'Featured Masterpiece'}
                </h2>
              </div>
            </div>

            {/* Spotlight Banner Card */}
            <div className="relative bg-gradient-to-br from-[#1C1A17] to-[#141311] rounded-3xl border border-[#C5A880]/30 shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-10 items-center">
              {/* Artwork Visual with Ambient Glow */}
              <div className="lg:col-span-7 relative aspect-[4/3] rounded-2xl overflow-hidden bg-black/60 border border-white/10 group">
                <Image
                  src={spotlightArtwork.imageUrl}
                  alt={spotlightArtwork.title}
                  fill
                  className="object-contain p-4 group-hover:scale-105 transition-transform duration-700"
                />
                <button
                  onClick={() => {
                    setSelectedSpotlightArtwork(spotlightArtwork);
                    setIsViewInRoomOpen(true);
                  }}
                  className="absolute bottom-4 right-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C5A880] hover:bg-[#B39366] text-[#121110] text-xs font-bold shadow-lg transition-transform active:scale-95"
                >
                  <Frame className="w-3.5 h-3.5" />
                  <span>{lang === 'th' ? '🛋️ จำลองแขวนบนผนัง (View in Room)' : 'View in Room'}</span>
                </button>
              </div>

              {/* Info Column */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B1B1B]/40 border border-[#8B1B1B] text-[#FFD98A] text-[10px] font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                    <span>MASTERPIECE OF THE WEEK</span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5] leading-tight mb-2">
                    {spotlightArtwork.title}
                  </h3>

                  <p className="text-xs text-[#C5A880] font-medium mb-4">
                    {spotlightArtwork.artist?.name} {spotlightArtwork.artist?.country ? `(${spotlightArtwork.artist.country})` : ''}
                  </p>

                  <p className="text-xs text-neutral-300 italic bg-black/30 p-4 rounded-xl border border-white/10 leading-relaxed">
                    "{spotlightArtwork.concept || spotlightArtwork.description || 'ผลงานชิ้นเอกที่สะท้อนคุณค่าความประณีตทางสุนทรียศาสตร์ร่วมสมัย'}"
                  </p>
                </div>

                {/* Specs */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/40 border border-white/10 text-xs">
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">{t.specs.medium}</span>
                    <span className="text-white font-medium">{spotlightArtwork.medium}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 block text-[10px] uppercase">{t.specs.dimensions}</span>
                    <span className="text-white font-medium">
                      {formatDimensionsInCm(spotlightArtwork.dimensions, lang)}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    setSelectedSpotlightArtwork(spotlightArtwork);
                    setIsViewInRoomOpen(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#C5A880] hover:bg-[#B39366] text-[#121110] rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95"
                >
                  <Frame className="w-4 h-4" />
                  <span>{lang === 'th' ? 'เปิดโหมดจำลองแขวนห้องจริง' : 'Launch View in Room'}</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* ================= 4. EXHIBITION PAVILIONS GRID ================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="flex items-center justify-between mb-10 border-b border-[#2C2824] pb-4">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold block">
                {t.lobby.curatedExhibitions}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#FAF8F5]">
                {lang === 'th' ? 'เลือกห้องนิทรรศการที่ต้องการเข้าชม' : 'Select an Exhibition Pavilion'}
              </h2>
            </div>
          </div>

          {filteredExhibitions.length === 0 ? (
            <div className="py-20 text-center bg-[#181614] rounded-3xl border border-[#2C2824] p-8 shadow-sm">
              <Sparkles className="w-12 h-12 text-[#C5A880] mx-auto mb-3" />
              <h3 className="font-serif text-xl font-bold text-white">
                {lang === 'th' ? 'ยังไม่มีนิทรรศการในระบบ' : 'No Exhibitions Available'}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 mb-6">
                {lang === 'th'
                  ? 'คุณสามารถเพิ่มนิทรรศการ ศิลปิน และผลงานใหม่ได้ที่หน้าจัดการหลังบ้าน'
                  : 'You can create new exhibitions and manage artworks via the Admin Studio.'}
              </p>
              <Link
                href="/admin/exhibitions"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C5A880] hover:bg-[#B39366] text-[#121110] rounded-xl text-xs font-bold uppercase tracking-wider shadow transition-all"
              >
                <span>{lang === 'th' ? 'ไปยังหน้าจัดการนิทรรศการ' : 'Go to Exhibition Manager'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {filteredExhibitions.map((exh, idx) => {
                const artworks = exh.artworks || [];
                const artists = exh.artists || [];
                const curator = exh.curator;

                return (
                  <div
                    key={exh.id}
                    className="bg-[#181614] rounded-3xl border border-[#2C2824] hover:border-[#C5A880]/60 shadow-2xl transition-all duration-500 overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Pavilion Banner Image */}
                      <div className="relative aspect-[16/10] bg-black overflow-hidden">
                        <Image
                          src={
                            exh.bannerUrl ||
                            'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop'
                          }
                          alt={exh.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#181614] via-black/30 to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold backdrop-blur shadow-sm ${
                              exh.status === 'active'
                                ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/40'
                                : 'bg-neutral-900/90 text-neutral-300 border border-white/20'
                            }`}
                          >
                            {exh.status === 'active' ? t.lobby.activeStatus : t.lobby.archivedStatus}
                          </span>

                          {is3DEnabled(exh) && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8B1B1B]/90 text-[#FFD98A] text-[10px] font-bold uppercase tracking-wider border border-[#D4AF37]/50 backdrop-blur shadow-md">
                              <Box className="w-3 h-3 text-[#D4AF37]" />
                              <span>3D Virtual Tour</span>
                            </span>
                          )}
                        </div>

                        {/* Bottom Stats */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-neutral-300 font-medium">
                          <span>{artworks.length} {t.lobby.artworksCount}</span>
                          <span>{artists.length} {t.lobby.artistsCount}</span>
                        </div>
                      </div>

                      {/* Content Body */}
                      <div className="p-6 space-y-3">
                        <div className="text-[11px] text-[#C5A880] flex items-center gap-1.5 font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDateRange(exh.startDate, exh.endDate)}</span>
                        </div>

                        <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#FAF8F5] group-hover:text-[#C5A880] transition-colors leading-snug">
                          {exh.title}
                        </h3>

                        <p className="text-xs text-neutral-400">
                          {t.specs.curatedBy}: <span className="font-semibold text-white">{curator?.name || 'Curator'}</span>
                        </p>

                        {/* Thumbnails Preview Strip */}
                        {artworks.length > 0 && (
                          <div className="pt-2">
                            <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-bold block mb-1.5">
                              {lang === 'th' ? 'ตัวอย่างผลงานเด่น' : 'Featured Works'}
                            </span>
                            <div className="flex items-center gap-2 overflow-hidden">
                              {artworks.slice(0, 4).map((art, aIdx) => (
                                <div
                                  key={art.id || aIdx}
                                  className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/15 bg-neutral-900 shadow-sm shrink-0 hover:scale-105 transition-transform"
                                  title={art.title}
                                >
                                  <Image
                                    src={art.imageUrl}
                                    alt={art.title}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                  />
                                </div>
                              ))}
                              {artworks.length > 4 && (
                                <div className="w-12 h-12 rounded-lg border border-dashed border-[#C5A880]/50 bg-white/5 flex items-center justify-center text-[10px] font-bold text-[#C5A880] shrink-0">
                                  +{artworks.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Multi-Mode Entry Portals */}
                    <div className="p-6 pt-0 border-t border-[#2C2824] mt-4 space-y-3">
                      <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold block pt-3">
                        {lang === 'th' ? 'เลือกโหมดการเข้าชม:' : 'Choose Viewing Mode:'}
                      </span>

                      <div className="grid grid-cols-4 gap-2">
                        {/* 1. 2D Gallery */}
                        <Link
                          href={`/exhibitions/${exh.slug}?mode=2d`}
                          className="group/btn relative h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white rounded-2xl border border-white/10 shadow-sm transition-all hover:scale-105 active:scale-95"
                          title={t.modes.grid}
                        >
                          <Eye className="w-4 h-4 text-[#C5A880]" />
                        </Link>

                        {/* 2. Slideshow */}
                        <Link
                          href={`/exhibitions/${exh.slug}?mode=carousel`}
                          className="group/btn relative h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-neutral-200 hover:text-white rounded-2xl border border-white/10 shadow-sm transition-all hover:scale-105 active:scale-95"
                          title={t.modes.carousel}
                        >
                          <GalleryHorizontal className="w-4 h-4 text-[#C5A880]" />
                        </Link>

                        {/* 3. 3D Tour */}
                        {is3DEnabled(exh) ? (
                          <Link
                            href={`/exhibitions/${exh.slug}?mode=3d`}
                            className="group/btn relative h-12 flex items-center justify-center bg-gradient-to-r from-[#8B1B1B] to-[#A82828] text-white rounded-2xl shadow-[0_0_15px_rgba(139,27,27,0.4)] border border-[#D4AF37]/50 transition-all hover:scale-105 active:scale-95"
                            title={t.modes.room3d}
                          >
                            <Box className="w-4 h-4 text-[#D4AF37]" />
                          </Link>
                        ) : (
                          <div className="h-12 flex items-center justify-center bg-white/5 text-neutral-600 rounded-2xl border border-white/5 cursor-not-allowed">
                            <Box className="w-4 h-4 text-neutral-600" />
                          </div>
                        )}

                        {/* 4. E-Catalog */}
                        <Link
                          href={`/catalog/${exh.slug}`}
                          className="group/btn relative h-12 flex items-center justify-center bg-[#C5A880]/15 hover:bg-[#C5A880]/25 text-[#EAD8C0] rounded-2xl border border-[#C5A880]/30 shadow-sm transition-all hover:scale-105 active:scale-95"
                          title={t.lobby.viewCatalog}
                        >
                          <BookOpen className="w-4 h-4 text-[#C5A880]" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <Footer exhibition={featuredExhibition} />

      {/* Global View In Room Modal for Spotlight */}
      {isViewInRoomOpen && selectedSpotlightArtwork && (
        <ViewInRoomModal
          artwork={selectedSpotlightArtwork}
          isOpen={isViewInRoomOpen}
          onClose={() => setIsViewInRoomOpen(false)}
        />
      )}

      {/* Exhibition Catalog Selector Modal */}
      {isCatalogSelectorOpen && (
        <CatalogSelectorModal
          exhibitions={exhibitions}
          isOpen={isCatalogSelectorOpen}
          onClose={() => setIsCatalogSelectorOpen(false)}
        />
      )}
    </div>
  );
}
