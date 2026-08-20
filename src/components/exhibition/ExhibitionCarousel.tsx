'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Exhibition, Artwork } from '@/types/exhibition';
import { ArtworkLightbox } from './ArtworkLightbox';
import { ArtworkInquiryModal } from './ArtworkInquiryModal';
import { useLanguage } from '@/context/LanguageContext';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  MessageSquare,
  Play,
  Pause,
  Layers,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { formatDimensionsInCm } from '@/lib/utils';

interface ExhibitionCarouselProps {
  exhibition: Exhibition;
}

export function ExhibitionCarousel({ exhibition }: ExhibitionCarouselProps) {
  const { lang, t } = useLanguage();
  const artworks = exhibition.artworks || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [inquiryArtwork, setInquiryArtwork] = useState<Artwork | null>(null);

  const currentArtwork = artworks[currentIndex] || null;

  const nextSlide = useCallback(() => {
    if (artworks.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % artworks.length);
  }, [artworks.length]);

  const prevSlide = useCallback(() => {
    if (artworks.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + artworks.length) % artworks.length);
  }, [artworks.length]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedArtwork || inquiryArtwork) return;
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, selectedArtwork, inquiryArtwork]);

  // Autoplay Timer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, nextSlide]);

  if (!currentArtwork) {
    return <div className="p-12 text-center text-[#8A8376]">{lang === 'th' ? 'ไม่มีผลงานสำหรับแสดง' : 'No artworks to display.'}</div>;
  }

  const artist = currentArtwork.artist;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col items-center">
      {/* Top Header & Counter Bar */}
      <div className="w-full flex items-center justify-between border-b border-[#E2DDD2] pb-4 mb-6">
        <div>
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#8C6D3F] font-bold block">
            {lang === 'th' ? 'นิทรรศการภาพสไลด์โชว์' : 'Carousel Showcase'}
          </span>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1918]">
            {exhibition.title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Autoplay Toggle */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all border ${
              isPlaying
                ? 'bg-[#1A1918] text-white border-[#1A1918]'
                : 'bg-white text-[#575249] border-[#D5CEC0] hover:bg-[#FAF8F5]'
            }`}
            title="Toggle Autoplay (Space)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isPlaying ? t.actions.pause : t.actions.autoplay}</span>
          </button>

          {/* Counter Badge */}
          <div className="px-3.5 py-1.5 bg-[#EBE7DF] rounded-full text-xs font-mono font-bold text-[#2A2824]">
            {String(currentIndex + 1).padStart(2, '0')} / {String(artworks.length).padStart(2, '0')}
          </div>
        </div>
      </div>

      {/* Main Spotlight Slide */}
      <div className="relative w-full bg-white border border-[#DCD5C8] rounded-2xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Left: Prominent Artwork Display (7 Cols) */}
        <div className="relative lg:col-span-7 bg-[#141312] p-6 sm:p-10 flex items-center justify-center min-h-[380px] sm:min-h-[480px] overflow-hidden group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentArtwork.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.4 }}
              className="relative w-full h-full max-h-[520px] flex items-center justify-center cursor-pointer"
              onClick={() => setSelectedArtwork(currentArtwork)}
            >
              <Image
                src={currentArtwork.imageUrl}
                alt={currentArtwork.title}
                width={1200}
                height={900}
                className="object-contain max-h-[480px] rounded shadow-2xl transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </motion.div>
          </AnimatePresence>

          {/* Quick Zoom Pill Button */}
          <button
            onClick={() => setSelectedArtwork(currentArtwork)}
            className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3.5 py-2 bg-black/75 hover:bg-black text-white text-xs rounded-full backdrop-blur border border-white/20 transition-all shadow-lg"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>{t.actions.zoomInspect}</span>
          </button>

          {/* Slide Arrow Navigation Overlay */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/90 transition-all shadow-lg"
            title={t.actions.prev}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 rounded-full bg-black/60 text-white/90 hover:text-white hover:bg-black/90 transition-all shadow-lg"
            title={t.actions.next}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Curatorial Information & Concept (5 Cols) */}
        <div className="lg:col-span-5 bg-[#FAF8F5] p-6 sm:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#E2DDD2]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentArtwork.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-5"
            >
              {/* Country Flag Bubble & Index */}
              <div className="flex items-center justify-between">
                <div
                  className="w-8 h-8 rounded-full overflow-hidden border border-[#C5A880] shadow-sm flex items-center justify-center bg-white"
                  title={artist?.country || 'Country'}
                >
                  <CountryFlag country={artist?.country} size="badge" shape="circle" />
                </div>
                <span className="text-xs font-mono font-bold text-[#8C6D3F]">
                  {t.actions.plate} #{currentIndex + 1}
                </span>
              </div>

              {/* Title & Artist Profile Card */}
              <div>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1918] leading-tight">
                  {currentArtwork.title}
                </h3>

                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-[#EAE4D8]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative w-11 h-11 bg-[#2C2925] rounded-full border border-[#C5A880] overflow-hidden shrink-0 shadow">
                      <Image
                        src={
                          artist?.avatarUrl ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop'
                        }
                        alt={artist?.name || 'Artist'}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-sans text-sm font-bold text-[#1A1918] truncate">
                        {artist?.name || 'Artist'}
                      </h4>
                      {artist?.email && (
                        <p className="text-[11px] text-[#8C6D3F] font-mono truncate">{artist.email}</p>
                      )}
                    </div>
                  </div>

                  <div
                    className="w-7 h-7 rounded-full overflow-hidden border border-[#C5A880] shadow-sm flex items-center justify-center bg-white shrink-0"
                    title={artist?.country || 'Country'}
                  >
                    <CountryFlag country={artist?.country} size="badge" shape="circle" />
                  </div>
                </div>
              </div>

              {/* Specs Badge Table (Art Focus) */}
              <div className="bg-white rounded-lg p-3.5 border border-[#E8E2D6] space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8A8377]">{t.specs.medium}</span>
                  <span className="font-medium text-[#2B2824]">{currentArtwork.medium}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8377]">{t.specs.dimensions}</span>
                  <span className="font-medium text-[#2B2824]">{formatDimensionsInCm(currentArtwork.dimensions, lang)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A8377]">{t.specs.year}</span>
                  <span className="font-medium text-[#2B2824]">{currentArtwork.yearCreated || '2026'}</span>
                </div>
              </div>

              {/* Concept Narrative */}
              <div className="text-xs text-[#474239] leading-relaxed">
                <span className="font-bold text-[#1A1918] block mb-1">
                  {t.specs.concept}:
                </span>
                <p className="italic bg-[#F4F1EA] p-3 rounded-lg border border-[#EAE5DC] max-h-36 overflow-y-auto">
                  "{currentArtwork.concept || currentArtwork.description || 'This work deals with cultural heritage and historical preservation.'}"
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action Trigger */}
          <div className="pt-4 mt-6 border-t border-[#E8E2D6] flex items-center gap-3">
            <button
              onClick={() => setInquiryArtwork(currentArtwork)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1A1918] hover:bg-[#33302B] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow active:scale-98"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t.actions.inquireCurator}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Filmstrip Thumbnail Scrubber */}
      <div className="w-full mt-8 pt-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-4 px-1 no-scrollbar">
          {artworks.map((art, idx) => {
            const isSelected = idx === currentIndex;
            return (
              <button
                key={art.id}
                onClick={() => setCurrentIndex(idx)}
                className={`relative flex-shrink-0 w-24 sm:w-28 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-[#8C6D3F] ring-2 ring-[#8C6D3F]/40 scale-105 shadow-md'
                    : 'border-white/80 opacity-60 hover:opacity-100 hover:scale-100'
                }`}
                title={art.title}
              >
                <Image
                  src={art.imageUrl}
                  alt={art.title}
                  fill
                  className="object-cover"
                />
                <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 text-white text-[9px] font-mono rounded">
                  #{idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      <ArtworkLightbox
        artwork={selectedArtwork}
        artworksList={artworks}
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
    </div>
  );
}
