'use client';

import React from 'react';
import { User } from '@/types/exhibition';
import { ChevronRight, Users } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { CountryFlag } from '@/components/ui/CountryFlag';

interface ArtistIndexSidebarProps {
  artists: User[];
  selectedArtistId: string | null;
  onSelectArtist: (artistId: string | null) => void;
  artworksCountByArtist: Record<string, number>;
  totalArtworksCount: number;
}

export function ArtistIndexSidebar({
  artists,
  selectedArtistId,
  onSelectArtist,
  artworksCountByArtist,
  totalArtworksCount,
}: ArtistIndexSidebarProps) {
  const { t } = useLanguage();

  return (
    <aside className="w-full md:w-56 lg:w-64 shrink-0 pr-0 md:pr-6 mb-8 md:mb-0 border-b md:border-b-0 md:border-r border-[#E0DBD0]">
      <div className="sticky top-24 space-y-4 pb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C7149]">
          <Users className="w-3.5 h-3.5" />
          <span>{t.actions.artistIndex}</span>
        </div>

        <nav className="space-y-1 text-xs">
          {/* All Artists Option */}
          <button
            onClick={() => onSelectArtist(null)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left ${
              selectedArtistId === null
                ? 'bg-[#1E1D1A] text-white font-medium shadow-sm'
                : 'text-[#5C564B] hover:bg-[#EBE7DD] hover:text-[#1E1D1A]'
            }`}
          >
            <span>{t.actions.allArtworks}</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                selectedArtistId === null ? 'bg-white/20 text-white' : 'bg-[#E3DFD4] text-[#6E685C]'
              }`}
            >
              {totalArtworksCount}
            </span>
          </button>

          {/* Individual Artists */}
          {artists.map((artist) => {
            const count = artworksCountByArtist[artist.id] || 0;
            const isSelected = selectedArtistId === artist.id;

            return (
              <button
                key={artist.id}
                onClick={() => onSelectArtist(artist.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left group ${
                  isSelected
                    ? 'bg-[#1E1D1A] text-white font-medium shadow-sm'
                    : 'text-[#5C564B] hover:bg-[#EBE7DD] hover:text-[#1E1D1A]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <CountryFlag country={artist.country} size="xs" />
                  <span className="truncate">{artist.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-[#E3DFD4] text-[#6E685C]'
                    }`}
                  >
                    {count}
                  </span>
                  <ChevronRight
                    className={`w-3 h-3 transition-transform ${
                      isSelected ? 'text-white' : 'text-[#A09A8D] group-hover:translate-x-0.5'
                    }`}
                  />
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
