export const runtime = 'edge';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getAllExhibitions } from '@/lib/data';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { DownloadCatalogPDFButton } from '@/components/catalog/DownloadCatalogPDFButton';
import {
  BookOpen,
  Calendar,
  Palette,
  Users,
  ArrowRight,
  Sparkles,
  Layers,
  FileText,
} from 'lucide-react';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'หอสูจิบัตรนิทรรศการศิลปกรรม (Exhibition Catalogs Library) | ARTVARA',
  description: 'รวบรวมสูจิบัตรดิจิทัลมาตรฐานสากลและเอกสารสิ่งพิมพ์ศิลปกรรมประจำทุกนิทรรศการของหอศิลป์ ARTVARA',
};

export default async function CatalogLibraryPage() {
  const exhibitions = await getAllExhibitions();
  const publishedExhibitions = exhibitions.filter((e) => e.status !== 'archived');

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-[#1E1D1B]">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 w-full">
        {/* 1. Header Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1C1A] via-[#151413] to-[#0A0908] text-white p-8 sm:p-12 shadow-2xl border border-white/10">
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FFD98A]">
                📚 ARTVARA PUBLICATIONS & E-CATALOGS
              </span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#FAF8F5] leading-tight">
              หอสูจิบัตรนิทรรศการศิลปกรรม
            </h1>

            <p className="text-xs sm:text-sm text-[#D5CEC0] font-light leading-relaxed">
              เลือกชมนิทรรศการที่ท่านสนใจเพื่อเปิดอ่านสูจิบัตรดิจิทัลฉบับสมบูรณ์ (Digital Exhibition Catalog)
              พร้อมดาวน์โหลดเอกสาร PDF ความละเอียดสูงสำหรับพิมพ์สูจิบัตรมาตรฐานสากล
            </p>
          </div>
        </div>

        {/* 2. Exhibition Catalogs Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-[#E5DFD5] pb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#8B1B1B]" />
              <h2 className="font-serif text-xl font-bold text-[#1A1918]">
                รายการสูจิบัตรทั้งหมด ({publishedExhibitions.length} นิทรรศการ)
              </h2>
            </div>
            <span className="text-xs font-mono text-[#8C6D3F] bg-[#FAF8F5] px-3 py-1 rounded-lg border border-[#DDD6C8]">
              Standard A4 Publications
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {publishedExhibitions.map((exh) => {
              const artworksCount = exh.artworks?.length || 0;
              const curatorName = exh.curator?.name || 'ARTVARA Curatorial Team';

              return (
                <div
                  key={exh.id}
                  className="bg-white rounded-3xl border-2 border-[#E5DFD5] hover:border-[#C5A880] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                >
                  <div>
                    {/* Catalog Cover Poster Preview */}
                    <div className="relative aspect-[16/10] w-full bg-[#1A1918] overflow-hidden">
                      {exh.bannerUrl ? (
                        <Image
                          src={exh.bannerUrl}
                          alt={exh.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 768px) 100vw, 400px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/30 font-serif">
                          ARTVARA
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-mono font-bold text-[#FFD98A] border border-white/20">
                        📖 {artworksCount} ผลงาน
                      </span>
                    </div>

                    {/* Content Details */}
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#8C6D3F] font-bold">
                        <Users className="w-3.5 h-3.5" />
                        <span>Curated by: {curatorName}</span>
                      </div>

                      <h3 className="font-serif text-lg font-bold text-[#1A1918] group-hover:text-[#8B1B1B] transition-colors line-clamp-2 leading-snug">
                        {exh.title}
                      </h3>

                      <p className="text-xs text-[#6E685C] line-clamp-3 leading-relaxed font-light">
                        {exh.curatorNote || 'สูจิบัตรประมวลผลงานศิลปกรรมร่วมสมัย รวบรวมแนวคิด บทความวิจารณ์ศิลป์ และภาพผลงานคุณภาพสูง'}
                      </p>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-6 pt-0 border-t border-[#F4EFE6] mt-4 pt-4 flex items-center justify-between gap-2">
                    <Link
                      href={`/catalog/${exh.slug}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8B1B1B] hover:bg-[#701515] text-white rounded-xl text-xs font-bold shadow transition-all active:scale-95 flex-1 justify-center"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>เปิดอ่านสูจิบัตร</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    <DownloadCatalogPDFButton exhibition={exh} variant="secondary" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
