'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { User } from '@/types/exhibition';
import { ChevronRight, ChevronDown, Users, Search, Globe, ChevronUp } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { CountryFlag, normalizeCountryName, getCountryDisplayName } from '@/components/ui/CountryFlag';

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
  const { lang, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({});

  // Group artists by normalized canonical country
  const countryGroups = useMemo(() => {
    const map = new Map<string, { displayName: string; canonicalName: string; artists: User[] }>();
    artists.forEach((artist) => {
      const canonical = normalizeCountryName(artist.country);
      const display = getCountryDisplayName(artist.country, lang);
      if (!map.has(canonical)) {
        map.set(canonical, { displayName: display, canonicalName: canonical, artists: [] });
      }
      map.get(canonical)!.artists.push(artist);
    });

    // Sort countries alphabetically
    return Array.from(map.values())
      .map((g) => ({
        country: g.canonicalName,
        displayName: g.displayName,
        artists: g.artists.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'th')),
        totalArtworks: g.artists.reduce((sum, a) => sum + (artworksCountByArtist[a.id] || 0), 0),
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'th'));
  }, [artists, artworksCountByArtist, lang]);

  // Auto-expand the country of selected artist
  useEffect(() => {
    if (selectedArtistId) {
      const selectedArtist = artists.find((a) => a.id === selectedArtistId);
      if (selectedArtist) {
        const canonical = normalizeCountryName(selectedArtist.country);
        setExpandedCountries((prev) => ({ ...prev, [canonical]: true }));
      }
    }
  }, [selectedArtistId, artists]);

  const toggleCountry = (country: string) => {
    setExpandedCountries((prev) => ({
      ...prev,
      [country]: !prev[country],
    }));
  };

  const toggleAll = () => {
    const allExpanded = countryGroups.every((g) => expandedCountries[g.country]);
    const newState: Record<string, boolean> = {};
    countryGroups.forEach((g) => {
      newState[g.country] = !allExpanded;
    });
    setExpandedCountries(newState);
  };

  // Filtered country groups if search query is active
  const filteredGroups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return countryGroups;

    return countryGroups
      .map((g) => ({
        ...g,
        artists: g.artists.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            (a.country || '').toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.artists.length > 0);
  }, [countryGroups, searchQuery]);

  return (
    <aside className="w-full md:w-60 lg:w-72 shrink-0 pr-0 md:pr-6 mb-8 md:mb-0 border-b md:border-b-0 md:border-r border-[#E0DBD0]">
      <div className="sticky top-20 space-y-3.5 pb-6">
        {/* Header Title & Expand/Collapse All Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#8C1B1B]">
            <Users className="w-3.5 h-3.5 text-[#8C1B1B]" />
            <span>{t.actions.artistIndex}</span>
          </div>

          <button
            onClick={toggleAll}
            className="text-[10px] text-[#8C6D3F] hover:text-[#1A1918] font-semibold hover:underline"
          >
            {countryGroups.every((g) => expandedCountries[g.country])
              ? (lang === 'th' ? 'ยุบทั้งหมด' : 'Collapse All')
              : (lang === 'th' ? 'ขยายทั้งหมด' : 'Expand All')}
          </button>
        </div>

        {/* Quick Search within 151 Artists */}
        <div className="relative">
          <Search className="w-3 h-3 text-[#A09A8D] absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'th' ? 'ค้นหาศิลปิน...' : 'Filter artists...'}
            className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-xs text-[#1A1918] placeholder-[#A09A8D] focus:outline-none focus:border-[#8B1B1B]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-[10px] text-neutral-400 hover:text-neutral-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* 1. All Artworks Button */}
        <button
          onClick={() => onSelectArtist(null)}
          className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all text-left shadow-sm ${
            selectedArtistId === null
              ? 'bg-[#1E1D1A] text-white font-bold'
              : 'bg-white hover:bg-[#EBE7DD] text-[#33302C] border border-[#E2DDD3]'
          }`}
        >
          <span className="text-xs font-bold">{t.actions.allArtworks}</span>
          <span
            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
              selectedArtistId === null ? 'bg-white/20 text-white' : 'bg-[#EAE5DA] text-[#6E685C]'
            }`}
          >
            {totalArtworksCount}
          </span>
        </button>

        {/* 2. Multi-Level Country Dropdown Accordions */}
        <nav className="space-y-1.5 text-xs max-h-[calc(100vh-260px)] overflow-y-auto pr-1 scrollbar-thin">
          {filteredGroups.map((group) => {
            const isExpanded = !!expandedCountries[group.country] || !!searchQuery;
            const hasSelectedArtist = group.artists.some((a) => a.id === selectedArtistId);

            return (
              <div
                key={group.country}
                className="bg-white/80 rounded-xl border border-[#E5E0D6] overflow-hidden shadow-xs"
              >
                {/* Level 1: Country Header (Click to toggle accordion dropdown) */}
                <button
                  onClick={() => toggleCountry(group.country)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors ${
                    hasSelectedArtist
                      ? 'bg-[#8B1B1B]/10 text-[#8B1B1B] font-bold'
                      : 'hover:bg-[#F6F3EC] text-[#2C2925]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <CountryFlag country={group.country} size="xs" shape="rounded" />
                    <span className="truncate text-xs font-semibold">{group.displayName || group.country}</span>
                    <span className="text-[10px] text-[#8C8477] font-mono shrink-0">
                      ({group.artists.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#EAE5DA] text-[#6E685C]">
                      {group.totalArtworks}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-[#8C8477]" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-[#8C8477]" />
                    )}
                  </div>
                </button>

                {/* Level 2: Artists List under this Country */}
                {isExpanded && (
                  <div className="bg-[#FAF8F5] border-t border-[#EFEBE3] divide-y divide-[#F0ECE4] animate-in fade-in slide-in-from-top-1">
                    {group.artists.map((artist) => {
                      const count = artworksCountByArtist[artist.id] || 0;
                      const isSelected = selectedArtistId === artist.id;

                      return (
                        <button
                          key={artist.id}
                          onClick={() => onSelectArtist(artist.id)}
                          className={`w-full flex items-center justify-between px-3.5 py-2 transition-colors text-left group ${
                            isSelected
                              ? 'bg-[#8B1B1B] text-white font-bold'
                              : 'text-[#5C564B] hover:bg-[#F2ECE0] hover:text-[#1A1918]'
                          }`}
                        >
                          <span className="truncate text-xs pr-2">{artist.name}</span>

                          <div className="flex items-center gap-1 shrink-0">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                isSelected
                                  ? 'bg-white/25 text-white'
                                  : 'bg-[#E5E0D4] text-[#6E685C]'
                              }`}
                            >
                              {count}
                            </span>
                            <ChevronRight
                              className={`w-3 h-3 opacity-60 transition-transform ${
                                isSelected ? 'text-white' : 'group-hover:translate-x-0.5'
                              }`}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div className="p-4 text-center text-xs text-neutral-400">
              {lang === 'th' ? 'ไม่พบศิลปินที่ค้นหา' : 'No matching artists found'}
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}

