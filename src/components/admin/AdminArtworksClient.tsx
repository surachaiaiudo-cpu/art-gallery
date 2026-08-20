'use client';

import React from 'react';
import Image from 'next/image';
import { Artwork } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { formatDimensionsInCm } from '@/lib/utils';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { Palette } from 'lucide-react';

interface AdminArtworksClientProps {
  artworks: Artwork[];
}

export function AdminArtworksClient({ artworks }: AdminArtworksClientProps) {
  const { lang, t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD5C8] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
            {t.admin.title}
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1A1918] mt-1">
            {t.admin.artworks}
          </h1>
          <p className="text-xs text-[#6E685C] mt-1">
            {lang === 'th'
              ? `มีผลงานศิลปกรรมในคลังทั้งหมด ${artworks.length} ชิ้น พร้อมไฟล์ภาพความละเอียดสูง`
              : `Total ${artworks.length} registered artworks with high-resolution digital assets.`}
          </p>
        </div>
      </div>

      {/* Artworks Table Card */}
      <div className="bg-white rounded-xl border border-[#E0D9CD] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#474239]">
            <thead className="bg-[#FAF8F5] border-b border-[#E8E2D6] text-[#7A7468] uppercase font-semibold">
              <tr>
                <th className="p-4">{t.admin.tableArtwork}</th>
                <th className="p-4">{t.admin.tableArtist}</th>
                <th className="p-4">{t.admin.tableMediumSize}</th>
                <th className="p-4">{t.admin.tableYear}</th>
                <th className="p-4">{t.specs.country}</th>
                <th className="p-4">{t.admin.tableStatus}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {artworks.map((art) => (
                <tr key={art.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-[#FAF8F5] shrink-0 shadow-sm border border-[#E0D9CD]">
                        <Image src={art.imageUrl} alt={art.title} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-serif text-sm font-bold text-[#1A1918]">{art.title}</p>
                        <p className="text-[10px] text-[#8C8477] font-mono">{art.cloudinaryPublicId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium text-[#1A1918]">{art.artist?.name || 'Unknown'}</td>
                  <td className="p-4">
                    <p className="font-medium text-[#2E2A24]">{art.medium}</p>
                    <p className="text-[11px] text-[#8C6D3F] font-semibold">{formatDimensionsInCm(art.dimensions, lang)}</p>
                  </td>
                  <td className="p-4 font-mono text-[#524D43]">{art.yearCreated || '2026'}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 font-medium text-[#2E2A24]">
                      <span>{art.artist?.flagEmoji}</span>
                      <span>{art.artist?.country}</span>
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {t.specs.onDisplay}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
