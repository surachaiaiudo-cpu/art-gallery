'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Exhibition, is3DEnabled } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  Box,
  Search,
  Sparkles,
  ArrowRight,
  Compass,
  Building,
  Eye,
  Layers,
} from 'lucide-react';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface Exhibition3DSelectorModalProps {
  exhibitions: Exhibition[];
  isOpen: boolean;
  onClose: () => void;
}

export function Exhibition3DSelectorModal({
  exhibitions,
  isOpen,
  onClose,
}: Exhibition3DSelectorModalProps) {
  const { lang } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const available3DExhibitions = useMemo(() => {
    return (exhibitions || []).filter(
      (e) => e.status !== 'archived' && is3DEnabled(e)
    );
  }, [exhibitions]);

  const filteredExhibitions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return available3DExhibitions;
    return available3DExhibitions.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.curator?.name && e.curator.name.toLowerCase().includes(q)) ||
        (e.curatorNote && e.curatorNote.toLowerCase().includes(q))
    );
  }, [available3DExhibitions, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#161514] rounded-3xl border border-[#D9B878]/35 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden text-[#FAF8F5]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#1C1A18] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#8B1B1B] via-[#6B1414] to-[#3B0A0A] border border-[#D4AF37]/50 flex items-center justify-center text-[#FFD98A] shadow-[0_0_15px_rgba(212,175,55,0.3)] shrink-0">
              <Box className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D9B878]">
                  {lang === 'th' ? 'หอศิลป์เสมือนจริง 3D' : '3D Virtual Gallery Pavilion'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#D9B878]/15 border border-[#D9B878]/30 text-[10px] font-mono text-[#FFD98A] font-bold">
                  {available3DExhibitions.length} {lang === 'th' ? 'ห้องจัดแสดง' : 'Exhibitions'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                {lang === 'th' ? 'เลือกห้องนิทรรศการ 3D ที่ต้องการเข้าชม' : 'Select 3D Virtual Exhibition Hall'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Input */}
        <div className="px-6 py-3 bg-[#181615] border-b border-white/5 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#D9B878] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'th' ? 'ค้นหาชื่อนิทรรศการ หรือภัณฑารักษ์...' : 'Search exhibition title or curator...'}
              className="w-full pl-10 pr-8 py-2 bg-white/5 border border-white/10 focus:border-[#D9B878] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="text-xs text-[#D9B878] font-medium hidden sm:flex items-center gap-1.5 shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>สถาปัตยกรรม 3D Spatial Walkthrough</span>
          </div>
        </div>

        {/* Exhibition 3D Cards Grid */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-4 scrollbar-thin">
          {filteredExhibitions.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <Building className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-xs">{lang === 'th' ? 'ไม่พบนิทรรศการ 3D ที่ค้นหา' : 'No 3D exhibitions found matching your query.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredExhibitions.map((exh) => {
                const artworksCount = exh.artworks?.length || 0;
                const curatorName = exh.curator?.name || 'ARTVARA Curatorial Team';
                const bannerThumb = getOptimizedImageUrl(exh.bannerUrl || '', { width: 480, quality: 75 });

                return (
                  <div
                    key={exh.id}
                    className="group bg-[#201D1A] hover:bg-[#25221E] border border-white/10 hover:border-[#D9B878]/60 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-2xl space-y-3.5"
                  >
                    <div className="space-y-3">
                      {/* Banner Poster */}
                      <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-neutral-900 border border-white/10">
                        {exh.bannerUrl ? (
                          <img
                            src={bannerThumb}
                            alt={exh.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600 font-serif text-sm">
                            ARTVARA 3D
                          </div>
                        )}
                        {/* 3D Badge Overlay */}
                        <div className="absolute top-2 left-2 px-2.5 py-1 rounded-md bg-[#8B1B1B]/85 backdrop-blur-md border border-[#D4AF37]/50 text-[10px] font-mono text-[#FFD98A] font-bold flex items-center gap-1 shadow-lg">
                          <Box className="w-3 h-3" />
                          <span>3D VIRTUAL</span>
                        </div>

                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-[#EAD8C0] font-bold">
                          {artworksCount} {lang === 'th' ? 'ผลงาน' : 'Artworks'}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest text-[#D9B878] font-bold block">
                          Curated 3D Exhibition
                        </span>
                        <h4 className="font-serif text-sm sm:text-base font-bold text-white group-hover:text-[#FFD98A] transition-colors line-clamp-1">
                          {exh.title}
                        </h4>
                        <p className="text-[11px] text-neutral-400 line-clamp-1">
                          {lang === 'th' ? `ภัณฑารักษ์: ${curatorName}` : `Curated by: ${curatorName}`}
                        </p>
                      </div>
                    </div>

                    {/* Action Links */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                      <Link
                        href={`/exhibitions/${exh.slug}?mode=3d`}
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-[#C5A880] via-[#D4AF37] to-[#B39366] text-[#121110] text-xs font-extrabold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] hover:brightness-110 active:scale-95 text-center cursor-pointer"
                      >
                        <Box className="w-4 h-4 text-[#121110]" />
                        <span>{lang === 'th' ? 'เข้าชมห้อง 3D' : 'Enter 3D Tour'}</span>
                      </Link>

                      <Link
                        href={`/exhibitions/${exh.slug}?mode=2d`}
                        onClick={onClose}
                        className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition-all border border-white/10 text-center cursor-pointer flex items-center gap-1"
                        title={lang === 'th' ? 'ชมแบบแกลเลอรี 2D' : 'View 2D Gallery'}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">2D</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
