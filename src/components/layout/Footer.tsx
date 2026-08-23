'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ExhibitionPill {
  id: string;
  title: string;
  slug: string;
  status: string;
}

interface FooterProps {
  exhibition?: { id?: string } | null;
}

export function Footer({ exhibition }: FooterProps) {
  const { lang } = useLanguage();
  const [exhibitions, setExhibitions] = useState<ExhibitionPill[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetch('/api/admin/exhibitions')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.exhibitions)) {
          setExhibitions(
            data.exhibitions.map((e: any) => ({
              id: e.id,
              title: e.title,
              slug: e.slug,
              status: e.status,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // On mobile: show max 3 pills collapsed, rest on expand
  const MOBILE_LIMIT = 3;
  const isManyExhibitions = exhibitions.length > MOBILE_LIMIT;

  return (
    <footer className="w-full bg-[#EFECE6] border-t border-[#DFDBD1] mt-auto text-[#5E5950]">

      {/* Main Footer Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex flex-col gap-5">

        {/* Top Row: Brand + Nav Links */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Brand */}
          <div className="flex flex-col gap-0.5">
            <span className="font-serif text-xl sm:text-2xl font-bold tracking-[0.15em] text-[#1A1918]">
              ARTVARA
            </span>
            <span className="text-[10px] tracking-widest text-[#8C8477] uppercase">
              {lang === 'th' ? 'หอศิลป์ออนไลน์' : 'Fine Arts & Contemporary Heritage Gallery'}
            </span>
          </div>

          {/* Quick Nav Links — hidden on smallest screens, shown sm+ */}
          <nav className="hidden sm:flex items-center gap-1 flex-wrap">
            <Link
              href="/"
              className="px-3 py-1.5 text-xs font-semibold text-[#5C5548] hover:text-[#1A1918] hover:bg-[#E4DFD6] rounded-full transition-colors"
            >
              {lang === 'th' ? '🏛️ โถงกลาง' : '🏛️ Grand Lobby'}
            </Link>
            <Link
              href="/artists"
              className="px-3 py-1.5 text-xs font-semibold text-[#5C5548] hover:text-[#1A1918] hover:bg-[#E4DFD6] rounded-full transition-colors"
            >
              {lang === 'th' ? '👨‍🎨 ทำเนียบศิลปิน' : '👨‍🎨 Artists'}
            </Link>
            <Link
              href="/admin"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#5C5548] hover:text-[#1A1918] hover:bg-[#E4DFD6] rounded-full transition-colors"
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </Link>
          </nav>
        </div>

        {/* Exhibition Pills Section */}
        {exhibitions.length > 0 && (
          <div className="flex flex-col gap-2.5">

            {/* Section Label + mobile expand toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D3F] flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                {lang === 'th'
                  ? `นิทรรศการทั้งหมด (${exhibitions.length})`
                  : `All Exhibitions (${exhibitions.length})`}
              </span>

              {/* Collapse toggle — only on mobile when many pills */}
              {isManyExhibitions && (
                <button
                  onClick={() => setIsExpanded((v) => !v)}
                  className="sm:hidden flex items-center gap-1 text-[10px] text-[#8C6D3F] font-semibold"
                  aria-label={isExpanded ? 'Show less' : 'Show all'}
                >
                  {isExpanded ? (
                    <>ย่อ <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>ดูทั้งหมด <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>

            {/* Pills Grid — responsive */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {exhibitions
                .filter((_, idx) => {
                  // On mobile: limit unless expanded
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                  if (isMobile && isManyExhibitions && !isExpanded && idx >= MOBILE_LIMIT) {
                    return false;
                  }
                  return true;
                })
                .map((ex) => (
                  <Link
                    key={ex.id}
                    href={`/catalog/${ex.slug}`}
                    className={`
                      inline-flex items-center gap-1.5
                      px-2.5 sm:px-3 py-1 sm:py-1
                      rounded-full border
                      text-[10px] sm:text-[11px] font-semibold
                      transition-all active:scale-95 hover:shadow-sm
                      max-w-[160px] sm:max-w-[220px] lg:max-w-[280px]
                      ${
                        exhibition?.id === ex.id
                          ? 'bg-[#8C6D3F] border-[#8C6D3F] text-white shadow-sm'
                          : ex.status === 'published'
                          ? 'bg-white border-[#D5CEC0] text-[#4A443A] hover:border-[#8C6D3F] hover:text-[#8C6D3F]'
                          : 'bg-[#F5F2ED] border-[#E0DAD0] text-[#8C8477] hover:border-[#C5BDAF]'
                      }
                    `}
                    title={ex.title}
                  >
                    {/* Status dot */}
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        exhibition?.id === ex.id
                          ? 'bg-white/70'
                          : ex.status === 'published'
                          ? 'bg-emerald-500'
                          : 'bg-amber-400'
                      }`}
                    />
                    <span className="truncate">{ex.title}</span>
                  </Link>
                ))}

              {/* "Show all" pill on mobile when collapsed */}
              {isManyExhibitions && !isExpanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="sm:hidden inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-dashed border-[#C5BDAF] text-[10px] text-[#8C8477] font-semibold hover:border-[#8C6D3F] hover:text-[#8C6D3F] transition-colors"
                >
                  +{exhibitions.length - MOBILE_LIMIT} อีก
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mobile Quick Nav — shown only on small screens */}
        <nav className="sm:hidden flex items-center gap-2 flex-wrap pt-1">
          <Link
            href="/"
            className="px-3 py-1.5 text-[11px] font-semibold text-[#5C5548] hover:text-[#1A1918] bg-[#E8E3DA] hover:bg-[#DDD6CC] rounded-full transition-colors active:scale-95"
          >
            🏛️ {lang === 'th' ? 'โถงกลาง' : 'Grand Lobby'}
          </Link>
          <Link
            href="/artists"
            className="px-3 py-1.5 text-[11px] font-semibold text-[#5C5548] hover:text-[#1A1918] bg-[#E8E3DA] hover:bg-[#DDD6CC] rounded-full transition-colors active:scale-95"
          >
            👨‍🎨 {lang === 'th' ? 'ทำเนียบศิลปิน' : 'Artists'}
          </Link>
        </nav>

        {/* Bottom Copyright Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-1.5 pt-4 border-t border-[#E3DDD3]">
          <span className="text-[10px] sm:text-[11px] text-[#7A756B] text-center sm:text-left">
            ARTVARA Fine Arts &amp; Contemporary Heritage Gallery
          </span>
          <span className="text-[10px] sm:text-[11px] text-[#8C8477] tracking-wide text-center sm:text-right shrink-0">
            © {new Date().getFullYear()} ARTVARA. All rights reserved.
          </span>
        </div>

      </div>
    </footer>
  );
}
