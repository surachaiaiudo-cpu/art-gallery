'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
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

  return (
    <footer className="w-full bg-[#EFECE6] border-t border-[#DFDBD1] mt-auto py-6 px-4 sm:px-6 lg:px-8 text-[#5E5950] text-xs">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">

        {/* Exhibition Pills */}
        {exhibitions.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C6D3F]">
              {lang === 'th' ? 'นิทรรศการทั้งหมด' : 'All Exhibitions'}
            </span>
            <div className="flex flex-wrap gap-2">
              {exhibitions.map((ex) => (
                <Link
                  key={ex.id}
                  href={`/catalog/${ex.slug}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold transition-all hover:shadow-sm ${
                    exhibition?.id === ex.id
                      ? 'bg-[#8C6D3F] border-[#8C6D3F] text-white shadow-sm'
                      : ex.status === 'published'
                      ? 'bg-white border-[#D5CEC0] text-[#4A443A] hover:border-[#8C6D3F] hover:text-[#8C6D3F]'
                      : 'bg-[#F5F2ED] border-[#E0DAD0] text-[#8C8477] hover:border-[#C5BDAF]'
                  }`}
                  title={ex.status === 'draft' ? 'Draft' : ex.title}
                >
                  {ex.status === 'draft' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  )}
                  {ex.status === 'published' && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  )}
                  <span className="line-clamp-1 max-w-[220px]">{ex.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Copyright Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-3 border-t border-[#E3DDD3]">
          <span className="text-[#7A756B] text-[11px]">
            ARTVARA Fine Arts &amp; Contemporary Heritage Gallery
          </span>
          <span className="text-[#7D786E] tracking-wider text-[11px] text-center sm:text-right shrink-0">
            © {new Date().getFullYear()} ARTVARA {lang === 'th' ? 'หอศิลป์ออนไลน์' : 'Online Gallery'}. All rights reserved.
          </span>
        </div>

      </div>
    </footer>
  );
}
