'use client';

import React from 'react';
import Link from 'next/link';
import { Exhibition } from '@/types/exhibition';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, BookOpen, Download, Printer, CheckCircle2 } from 'lucide-react';
import { formatDateRange, formatPrice } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';

interface CatalogViewerClientProps {
  exhibition: Exhibition;
}

export function CatalogViewerClient({ exhibition }: CatalogViewerClientProps) {
  const [downloaded, setDownloaded] = React.useState(false);

  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;

  const handlePrintPDF = () => {
    setDownloaded(true);
    window.print();
    setTimeout(() => setDownloaded(false), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F0] text-[#1E1D1B]">
      {/* Strict A4 Print Stylesheet */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print, header, footer {
            display: none !important;
          }
          .catalog-a4-page {
            page-break-after: always !important;
            break-after: page !important;
            width: 100% !important;
            min-height: 267mm !important;
            max-height: 267mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
            position: relative !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* Navigation Toolbar (Hidden in Print) */}
      <div className="no-print">
        <Navbar exhibition={exhibition} />

        <div className="bg-[#EAE5DC] border-b border-[#D5CEC0] py-4 px-4 sm:px-6 lg:px-8 sticky top-16 z-30 shadow-sm backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B6355] hover:text-[#1A1918] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>โถงกลาง (Grand Lobby)</span>
              </Link>
              <span className="text-[#C4BDB0]">•</span>
              <Link
                href={`/exhibitions/${exhibition.slug}`}
                className="text-xs font-semibold uppercase tracking-wider text-[#6B6355] hover:text-[#1A1918] transition-colors"
              >
                <span>หน้านิทรรศการ</span>
              </Link>
              <span className="text-[#C4BDB0]">•</span>
              <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                สูจิบัตรพิมพ์ A4 (Margins 1.5 cm)
              </span>
            </div>

            {/* Print & Download Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintPDF}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95"
                title="พิมพ์ หรือ บันทึกเป็นไฟล์ PDF ขนาด A4 มาตรฐาน (1.5 cm Margin, ขาวสะอาด)"
              >
                {downloaded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4 text-[#C5A880]" />
                )}
                <span>
                  {downloaded ? 'กำลังเปิดหน้าต่างพิมพ์ PDF...' : 'Download Official PDF (A4 Print-Ready)'}
                </span>
              </button>

              <button
                onClick={handlePrintPDF}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#4A453C] border border-[#D5CEC0] rounded-full text-xs font-semibold tracking-wider shadow-sm transition-all active:scale-95"
                title="พิมพ์ / บันทึกเป็น PDF ผ่านเบราว์เซอร์"
              >
                <Printer className="w-4 h-4 text-[#8C6D3F]" />
                <span>พิมพ์ A4</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main A4 Visual Catalog Viewer */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-16">
        {/* Cover Page */}
        <section className="catalog-a4-page relative bg-white border border-[#D5CEC0] shadow-xl overflow-hidden p-6 sm:p-[15mm] text-center max-w-[210mm] mx-auto rounded-sm min-h-[297mm] flex flex-col justify-between">
          <div>
            <div className="border-b border-[#E8E2D6] pb-4 mb-6">
              <span className="font-serif text-3xl font-bold tracking-[0.2em] text-[#1A1918] block">
                ARTVARA
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#8C8477] mt-1 block">
                International Art Festival & Curated Exhibition
              </span>
            </div>

            {exhibition.bannerUrl && (
              <div className="relative w-full h-[140mm] max-w-[180mm] mx-auto overflow-hidden mb-6 flex items-center justify-center">
                <img
                  src={exhibition.bannerUrl}
                  alt={exhibition.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            <div className="space-y-2 max-w-[160mm] mx-auto">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C6D3F] block">
                Official Exhibition Catalog (สูจิบัตร)
              </span>
              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#1A1918]">
                {exhibition.title}
              </h1>
              {curator?.name && (
                <p className="text-sm text-[#615B50] font-medium pt-2">
                  Curated by: <span className="font-semibold text-[#1A1918]">{curator.name}</span>
                </p>
              )}
              <p className="text-xs text-[#8A8376]">
                {formatDateRange(exhibition.startDate, exhibition.endDate)}
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-[#E8E2D6] text-center">
            <p className="text-[10px] text-[#8A8376] uppercase tracking-widest">
              International Art Festival and Art Exhibition in Thailand • ARTVARA Online Gallery
            </p>
          </div>
        </section>

        {/* 1 Artwork Plate Per Page (A4, 1.5 cm Margin, 8 Inches Boundary, Flag Above Photo) */}
        {artworks.map((art, idx) => {
          const artist = art.artist;
          const pageNum = idx + 2;
          const hasRealPhoto =
            artist?.avatarUrl &&
            !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
            !artist.avatarUrl.includes('unsplash.com/photo-1534528741775');

          return (
            <section
              key={art.id}
              className="catalog-a4-page relative bg-white border border-[#D5CEC0] shadow-xl p-6 sm:p-[15mm] rounded-sm max-w-[210mm] min-h-[297mm] mx-auto flex flex-col justify-between"
            >
              <div>
                {/* 1. Main Large Artwork Image (Positioned from top to 8-inch boundary) */}
                <div className="relative w-full h-[185mm] max-h-[188mm] bg-white overflow-hidden mb-4 flex items-center justify-center">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* 2. Details Section (Starts at 8 inches from top of page) */}
                <div className="relative z-10 flex flex-col sm:flex-row items-start gap-6 pt-1">
                  {/* Left Column: Flag Image ON TOP, Artist Photo DIRECTLY BELOW */}
                  <div className="shrink-0 w-24 sm:w-28 flex flex-col items-start">
                    {/* Flag Badge Image - Above Photo */}
                    <div className="relative w-10 h-6 rounded-[3px] overflow-hidden border border-[#DDD6C8] shadow-sm mb-2.5 bg-neutral-100">
                      <img
                        src={getFlagImageUrl(artist?.country)}
                        alt={artist?.country || 'Flag'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Artist Photo / Avatar (Below Flag) */}
                    {hasRealPhoto ? (
                      <div className="relative w-20 h-24 sm:w-24 sm:h-28 bg-[#2B2824] rounded-lg overflow-hidden shadow">
                        <img
                          src={artist!.avatarUrl!}
                          alt={artist?.name || 'Artist'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-24 sm:w-24 sm:h-28 bg-[#FAF8F5] border border-[#DDD6C8] rounded-lg flex items-center justify-center font-serif text-2xl font-bold text-[#8C6D3F] shadow-sm">
                        {artist?.name?.trim().charAt(0).toUpperCase() || 'A'}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Artist Info & Artwork Specs & Concept */}
                  <div className="flex-1 space-y-2 text-xs text-[#3D3A34]">
                    <div>
                      <h3 className="font-sans text-sm font-bold text-[#1A1918] leading-tight">
                        {artist?.name || 'Artist'}
                      </h3>
                      {artist?.email && (
                        <p className="text-[#7A7468] text-[11px] font-mono leading-tight">{artist.email}</p>
                      )}
                      <p className="text-[#7A7468] text-[11px] leading-tight">{artist?.country || 'International'}</p>
                    </div>

                    <div className="pt-1">
                      <h4 className="font-sans text-sm font-bold text-[#1A1918] leading-tight">
                        {art.title}
                      </h4>
                      <p className="text-[#5E584D] text-[11px] leading-tight">
                        {[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ')}
                      </p>
                    </div>

                    {(art.concept || art.description) && (
                      <div className="pt-1 text-xs leading-relaxed text-[#423E37]">
                        <span className="font-bold text-[#1A1918]">Concept : </span>
                        <span>{art.concept || art.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Subtle Ribbon / Wave Graphic matching reference */}
              <div className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none overflow-hidden z-0 opacity-40">
                <svg viewBox="0 0 600 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id={`webWave1-${art.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#DDD5C7" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#C5A880" stopOpacity="0.2" />
                    </linearGradient>
                    <linearGradient id={`webWave2-${art.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#F5B28B" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#EFA478" stopOpacity="0.15" />
                    </linearGradient>
                  </defs>
                  <path d="M-30,120 C120,40 260,130 380,60 C480,0 560,90 630,30 L630,120 Z" fill={`url(#webWave1-${art.id})`} />
                  <path d="M-30,120 C90,90 220,20 370,80 C490,140 570,60 630,70 L630,120 Z" fill={`url(#webWave2-${art.id})`} />
                </svg>
              </div>

              {/* Bottom Footer Row */}
              <div className="relative z-10 mt-6 pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-[10px] text-[#A69F92]">
                <span>ARTVARA Catalog • Plate #{idx + 1} {art.price ? `• ${formatPrice(art.price)}` : ''}</span>
                <span className="font-mono">{pageNum}</span>
              </div>
            </section>
          );
        })}
      </main>

      <div className="no-print">
        <Footer exhibition={exhibition} />
      </div>
    </div>
  );
}
