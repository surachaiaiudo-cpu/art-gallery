'use client';

import React from 'react';
import { Exhibition } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';

interface FooterProps {
  exhibition?: Exhibition | null;
}

export function Footer({ exhibition }: FooterProps) {
  const { lang, t } = useLanguage();
  const artists = exhibition?.artists ?? [];

  return (
    <footer className="w-full bg-[#EFECE6] border-t border-[#DFDBD1] mt-auto py-6 px-4 sm:px-6 lg:px-8 text-[#5E5950] text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Participating Artists List */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-center md:text-left">
          <span className="font-semibold text-[#2B2824]">{t.specs.participatingArtists}:</span>
          {artists.length > 0 ? (
            artists.map((artist, idx) => (
              <span key={artist.id} className="text-[#4F4B43]">
                {artist.flagEmoji} {artist.name}
                {idx < artists.length - 1 && <span className="text-[#A8A397] ml-2">,</span>}
              </span>
            ))
          ) : (
            <span>Somchai Jaiyen, Sasithol Arivarat, Luckshal Sailom, Art des, Sarawathudam, Akhil Namwan, MA Families</span>
          )}
        </div>

        {/* Copyright */}
        <div className="text-[#7D786E] tracking-wider text-center md:text-right shrink-0">
          © {new Date().getFullYear()} ARTVARA {lang === 'th' ? 'หอศิลป์ออนไลน์' : 'Online Gallery'}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
