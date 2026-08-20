'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Artwork } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { ArtworkLightbox } from '@/components/exhibition/ArtworkLightbox';
import { ArtworkInquiryModal } from '@/components/exhibition/ArtworkInquiryModal';
import { formatDateRange, parseArtworkDimensions, formatDimensionsInCm } from '@/lib/utils';
import { CountryFlag } from '@/components/ui/CountryFlag';
import {
  ArrowLeft,
  Calendar,
  Layers,
  ZoomIn,
  Mail,
  Instagram,
  Globe,
  Building2,
  Sparkles,
  Home,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

interface ArtistExhibitionInfo {
  id: string;
  title: string;
  slug: string;
  status: string;
  startDate: string;
  endDate: string;
  bannerUrl?: string | null;
}

interface ArtistArtworkWithExhibitions extends Artwork {
  exhibitions: ArtistExhibitionInfo[];
}

interface ArtistProfileClientProps {
  artist: User;
  artworks: ArtistArtworkWithExhibitions[];
  participatingExhibitions: ArtistExhibitionInfo[];
}

export function ArtistProfileClient({
  artist,
  artworks,
  participatingExhibitions,
}: ArtistProfileClientProps) {
  const { lang, t } = useLanguage();
  const [selectedExhibitionFilter, setSelectedExhibitionFilter] = useState<string>('all');
  const [selectedLightboxArtwork, setSelectedLightboxArtwork] = useState<Artwork | null>(null);
  const [selectedInquiryArtwork, setSelectedInquiryArtwork] = useState<Artwork | null>(null);

  // Filter artworks by exhibition
  const filteredArtworks =
    selectedExhibitionFilter === 'all'
      ? artworks
      : artworks.filter((art) =>
          art.exhibitions.some((exh) => exh.id === selectedExhibitionFilter)
        );

  let socialLinks: Record<string, string> = {};
  if (artist.socialLinks) {
    try {
      socialLinks = JSON.parse(artist.socialLinks);
    } catch {}
  }

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

        <Link
          href="/artists"
          className="inline-flex items-center gap-1.5 text-xs text-[#6E685C] hover:text-[#1A1918] font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{lang === 'th' ? 'ทำเนียบศิลปินทั้งหมด' : 'All Artists'}</span>
        </Link>
      </div>

      {/* Artist Hero Profile Banner */}
      <section className="relative bg-[#1A1918] text-white py-16 px-4 sm:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#C5A880_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar with Floating Real Flag Badge */}
          <div className="relative shrink-0">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-4 border-[#C5A880] overflow-hidden shadow-2xl">
              <Image
                src={artist.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop'}
                alt={artist.name}
                fill
                className="object-cover"
              />
            </div>
            {/* Real Flag Badge */}
            <div
              className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-11 h-11 rounded-full bg-[#1A1918] border-2 border-[#C5A880] overflow-hidden flex items-center justify-center shadow-xl"
              title={artist.country || 'Country'}
            >
              <CountryFlag country={artist.country} size="badge" shape="circle" />
            </div>
          </div>

          {/* Bio & Details */}
          <div className="flex-1 text-center md:text-left space-y-3">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
              <div
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-[#C5A880] shadow-md flex items-center justify-center bg-[#1A1918]"
                title={artist.country || 'Country'}
              >
                <CountryFlag country={artist.country} size="badge" shape="circle" />
              </div>
              <span className="text-xs uppercase tracking-widest text-[#C5A880] font-bold">
                • {lang === 'th' ? 'ศิลปินผู้สร้างสรรค์' : 'Featured Artist'}
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              {artist.name}
            </h1>

            <p className="text-sm text-[#D8D2C6] leading-relaxed font-serif max-w-2xl">
              {artist.bio || (lang === 'th' ? 'ศิลปินผู้สร้างสรรค์ผลงานศิลปกรรมอันทรงคุณค่า' : 'Master artist exploring cultural aesthetics.')}
            </p>

            {/* Primary Contact: Email */}
            {artist.email && (
              <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <a
                  href={`mailto:${artist.email}?subject=${encodeURIComponent(
                    `สอบถามข้อมูลผลงานศิลปกรรมของ ${artist.name} - ARTVARA Gallery`
                  )}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#C5A880] hover:bg-[#D4BC96] text-[#1A1918] rounded-full text-xs font-bold tracking-wider transition-all shadow-md active:scale-95 font-mono"
                  title={lang === 'th' ? `ส่งอีเมลติดต่อ ${artist.name}` : `Send email to ${artist.name}`}
                >
                  <Mail className="w-4 h-4 text-[#1A1918] shrink-0" />
                  <span>{artist.email}</span>
                </a>
              </div>
            )}

            {/* Accolades / Stats pill */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-1">
              <div className="px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono">
                <span className="text-[#C5A880] font-bold">{artworks.length}</span>{' '}
                {lang === 'th' ? 'ผลงานในหอศิลป์' : 'Artworks Curated'}
              </div>
              <div className="px-3.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono">
                <span className="text-[#C5A880] font-bold">{participatingExhibitions.length}</span>{' '}
                {lang === 'th' ? 'นิทรรศการที่ร่วมแสดง' : 'Exhibitions Participated'}
              </div>

              {socialLinks.instagram && (
                <span className="text-xs text-neutral-300 flex items-center gap-1.5 font-mono">
                  <Instagram className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{socialLinks.instagram}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Exhibitions Filter Navigation */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-10 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E3DED4] pb-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
              {lang === 'th' ? 'ผลงานของศิลปินข้ามทุกนิทรรศการ' : 'Curated Works across Exhibitions'}
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#1A1918] mt-0.5">
              {lang === 'th' ? `ผลงานจัดแสดง (${filteredArtworks.length} ชิ้น)` : `Artworks on Display (${filteredArtworks.length})`}
            </h2>
          </div>

          {/* Exhibition Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedExhibitionFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                selectedExhibitionFilter === 'all'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'bg-white text-[#6E685C] border border-[#DDD6C8] hover:border-[#B38F56]'
              }`}
            >
              {lang === 'th' ? 'ทุกนิทรรศการ' : 'All Exhibitions'} ({artworks.length})
            </button>

            {participatingExhibitions.map((exh) => (
              <button
                key={exh.id}
                onClick={() => setSelectedExhibitionFilter(exh.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedExhibitionFilter === exh.id
                    ? 'bg-[#1A1918] text-white shadow-sm'
                    : 'bg-white text-[#6E685C] border border-[#DDD6C8] hover:border-[#B38F56]'
                }`}
              >
                {exh.status === 'active' ? '🟢 ' : '⚪ '}
                {exh.title.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Artworks List (1-Column Museum Placards) */}
        <div className="space-y-12">
          {filteredArtworks.map((art, idx) => {
            const dims = parseArtworkDimensions(art.dimensions);

            return (
              <article
                key={art.id}
                className="bg-white rounded-2xl border border-[#DDD6C8] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-stretch"
              >
                {/* Artwork High-Res Frame with Deep Zoom Click */}
                <div
                  onClick={() => setSelectedLightboxArtwork(art)}
                  className="group/img relative md:w-1/2 aspect-[4/3] md:aspect-auto bg-[#1A1918] cursor-zoom-in overflow-hidden shrink-0 flex items-center justify-center"
                >
                  <Image
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    className="object-contain p-4 group-hover/img:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover/img:opacity-100 px-4 py-2 bg-black/80 text-white rounded-full text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5 transition-opacity shadow-lg backdrop-blur-sm">
                      <ZoomIn className="w-4 h-4 text-[#C5A880]" />
                      <span>{lang === 'th' ? '🔍 ซูมดูรายละเอียด 8x' : '🔍 Ultra Zoom 8x'}</span>
                    </span>
                  </div>

                  <span className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/80 text-white text-[10px] font-mono rounded">
                    {formatDimensionsInCm(art.dimensions, lang)}
                  </span>
                </div>

                {/* Museum Placard & Exhibition Context */}
                <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-4">
                    {/* Exhibitions Tag List */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase tracking-widest text-[#8C6D3F] font-bold block">
                        {lang === 'th' ? 'จัดแสดงในนิทรรศการ:' : 'Exhibited in:'}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {art.exhibitions.map((exh) => (
                          <Link
                            key={exh.id}
                            href={`/exhibitions/${exh.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FAF8F5] hover:bg-[#EFEBE2] border border-[#DDD6C8] rounded-lg text-xs font-semibold text-[#1A1918] transition-colors"
                          >
                            <Building2 className="w-3 h-3 text-[#8C6D3F]" />
                            <span className="truncate max-w-[220px]">{exh.title}</span>
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                exh.status === 'active' ? 'bg-emerald-500' : 'bg-neutral-400'
                              }`}
                            />
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Artwork Details */}
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-[#1A1918] leading-tight">
                        {art.title}
                      </h3>
                      <p className="text-xs text-[#7A7468] mt-1 font-mono">
                        {art.medium} • {formatDimensionsInCm(art.dimensions, lang)} • {art.yearCreated}
                      </p>
                    </div>

                    {/* Concept Statement */}
                    {art.concept && (
                      <div className="p-4 bg-[#FAF8F5] rounded-xl border border-[#EAE4D8]">
                        <span className="text-[10px] uppercase font-bold text-[#8C6D3F] block mb-1">
                          {lang === 'th' ? 'แนวคิดและแรงบันดาลใจ' : 'Concept Statement'}
                        </span>
                        <p className="text-xs text-[#5A554A] font-serif leading-relaxed italic">
                          "{art.concept}"
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-4 border-t border-[#F0ECE4] flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setSelectedLightboxArtwork(art)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-[#C5A880]" />
                      <span>{lang === 'th' ? 'ซูมภาพ 8x' : 'Zoom 8x'}</span>
                    </button>

                    {art.exhibitions[0] && (
                      <Link
                        href={`/exhibitions/${art.exhibitions[0].slug}?mode=3d`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#C5A880] hover:bg-[#D4BC96] text-[#1A1918] rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{lang === 'th' ? 'เข้าชมห้อง 3D' : 'Enter 3D Room'}</span>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* 8x Ultra High-Res Lightbox Modal */}
      {selectedLightboxArtwork && (
        <ArtworkLightbox
          isOpen={true}
          artwork={selectedLightboxArtwork}
          artworksList={filteredArtworks}
          onSelectArtwork={(art) => setSelectedLightboxArtwork(art)}
          onClose={() => setSelectedLightboxArtwork(null)}
          onOpenInquiry={(art) => setSelectedInquiryArtwork(art)}
        />
      )}

      {/* Inquiry Modal */}
      {selectedInquiryArtwork && (
        <ArtworkInquiryModal
          isOpen={true}
          artwork={selectedInquiryArtwork}
          onClose={() => setSelectedInquiryArtwork(null)}
        />
      )}
    </div>
  );
}
