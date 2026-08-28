'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Exhibition } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  BookOpen,
  Search,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  Printer,
  Compass,
  Check,
} from 'lucide-react';
import { formatDateRange } from '@/lib/utils';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface CatalogSelectorModalProps {
  exhibitions: Exhibition[];
  isOpen: boolean;
  onClose: () => void;
}

export function CatalogSelectorModal({
  exhibitions,
  isOpen,
  onClose,
}: CatalogSelectorModalProps) {
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');

  const publishedExhibitions = useMemo(() => {
    return (exhibitions || []).filter((e) => e.status !== 'archived');
  }, [exhibitions]);

  const filteredExhibitions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return publishedExhibitions;
    return publishedExhibitions.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        (e.curator?.name && e.curator.name.toLowerCase().includes(q)) ||
        (e.curatorNote && e.curatorNote.toLowerCase().includes(q))
    );
  }, [publishedExhibitions, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#161514] rounded-3xl border border-[#C5A880]/30 shadow-floating flex flex-col overflow-hidden text-[#FAF8F5]">
        
        {/* Header */}
        <div className="px-6 py-5 bg-[#1C1A18] border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A880]/20 border border-[#C5A880]/50 flex items-center justify-center text-[#C5A880] shadow-sm">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A880]">
                  {lang === 'th' ? 'หอสูจิบัตรดิจิทัล' : 'E-Catalog Library'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-[#EAD8C0]">
                  {publishedExhibitions.length} {lang === 'th' ? 'นิทรรศการ' : 'Exhibitions'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-serif font-bold text-white">
                {lang === 'th' ? 'เลือกสูจิบัตรนิทรรศการที่ต้องการเปิดอ่าน' : 'Select Exhibition Catalog to View'}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Input */}
        <div className="px-6 py-3 bg-[#181615] border-b border-white/5 flex items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#C5A880] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'th' ? 'ค้นหาชื่อนิทรรศการ หรือภัณฑารักษ์...' : 'Search exhibition title or curator...'}
              className="w-full pl-10 pr-8 py-2 bg-white/5 border border-white/10 focus:border-[#C5A880] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none transition-all"
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

          <Link
            href="/catalog"
            onClick={onClose}
            className="text-xs text-[#C5A880] hover:text-[#EAD8C0] underline font-semibold flex items-center gap-1 shrink-0"
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'th' ? 'ดูคลังสูจิบัตรเต็มรูปแบบ' : 'Full Library Page'}</span>
          </Link>
        </div>

        {/* Exhibition Catalog Cards Grid */}
        <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-160px)] space-y-4 scrollbar-thin">
          {filteredExhibitions.length === 0 ? (
            <div className="py-16 text-center text-neutral-400 space-y-2">
              <BookOpen className="w-8 h-8 mx-auto text-neutral-600" />
              <p className="text-xs">{lang === 'th' ? 'ไม่พบนิทรรศการที่ค้นหา' : 'No exhibitions found matching your query.'}</p>
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
                    className="group bg-[#201D1A] hover:bg-[#25221E] border border-white/10 hover:border-[#C5A880]/60 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-xl space-y-3.5"
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
                            ARTVARA
                          </div>
                        )}
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/20 text-[10px] font-mono text-[#EAD8C0] font-bold">
                          {artworksCount} {lang === 'th' ? 'ผลงาน' : 'Artworks'}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase tracking-widest text-[#C5A880] font-bold block">
                          Official Exhibition Catalog
                        </span>
                        <h4 className="font-serif text-sm sm:text-base font-bold text-white group-hover:text-[#C5A880] transition-colors line-clamp-1">
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
                        href={`/catalog/${exh.slug}`}
                        onClick={onClose}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#8C6D3F] hover:bg-[#A3814C] text-white text-xs font-bold transition-all shadow-md active:scale-95 text-center cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#EAD8B8]" />
                        <span>{lang === 'th' ? 'เปิดอ่านสูจิบัตร' : 'Read Catalog'}</span>
                      </Link>

                      <Link
                        href={`/exhibitions/${exh.slug}`}
                        onClick={onClose}
                        className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold transition-all border border-white/10 text-center cursor-pointer"
                        title={lang === 'th' ? 'เข้าชมนิทรรศการ' : 'Visit Exhibition'}
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
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
