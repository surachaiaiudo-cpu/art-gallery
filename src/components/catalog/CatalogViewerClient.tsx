'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Exhibition, getCatalogFooterText, getCatalogPlateFooterText } from '@/types/exhibition';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, BookOpen, Download, Printer, CheckCircle2, Edit3, X, Save, Sparkles } from 'lucide-react';
import { formatDateRange, formatPrice } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';

interface CatalogViewerClientProps {
  exhibition: Exhibition;
}

export function CatalogViewerClient({ exhibition }: CatalogViewerClientProps) {
  const searchParams = useSearchParams();
  const [downloaded, setDownloaded] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [coverFooter, setCoverFooter] = useState(getCatalogFooterText(exhibition));
  const [plateFooter, setPlateFooter] = useState(getCatalogPlateFooterText(exhibition));

  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;

  // Trigger print dialog
  const handlePrintPDF = () => {
    setDownloaded(true);
    window.print();
    setTimeout(() => setDownloaded(false), 4000);
  };

  // Auto-print if navigated with ?autoPrint=true
  useEffect(() => {
    if (searchParams.get('autoPrint') === 'true') {
      const timer = setTimeout(() => {
        handlePrintPDF();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const handleSaveFooterText = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/admin/exhibitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: exhibition.id,
          catalogFooterText: coverFooter,
          catalogPlateFooterText: plateFooter,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          setIsEditModalOpen(false);
        }, 1200);
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อความ Footer');
      }
    } catch (err) {
      console.error('Error saving catalog footer text:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F0] text-[#1E1D1B]">
      {/* 100% WYSIWYG A4 Print Stylesheet (Exact 210mm x 297mm, 15mm Inner Margins, No Scaling/Cutoff) */}
      <style jsx global>{`
        @media print {
          @page {
            size: 210mm 297mm;
            margin: 0mm !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, footer, nav {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 210mm !important;
            width: 210mm !important;
            background: #ffffff !important;
          }
          .catalog-a4-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-sizing: border-box !important;
            page-break-before: auto !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: none !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
            position: relative !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
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
                สูจิบัตรพิมพ์ A4 เต็มหน้า (WYSIWYG 1.5 cm)
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Edit Footer Text Button */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#5C5548] hover:text-[#1A1918] border border-[#D5CEC0] rounded-full text-xs font-semibold tracking-wider shadow-sm transition-all active:scale-95"
                title="แก้ไขข้อความ Footer ท้ายหน้าสูจิบัตร"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span>แก้ไขข้อความ Footer</span>
              </button>

              {/* Print & Download Full Page PDF Buttons */}
              <button
                onClick={handlePrintPDF}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95"
                title="พิมพ์ หรือ บันทึกเป็นไฟล์ PDF ขนาด A4 เต็มหน้า (WYSIWYG 1.5 cm Margin, ขาวสะอาด ไม่ย่อตัด)"
              >
                {downloaded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4 text-[#C5A880]" />
                )}
                <span>
                  {downloaded ? 'กำลังเปิดหน้าต่างพิมพ์ PDF...' : 'Download Official PDF (A4 เต็มหน้า)'}
                </span>
              </button>

              <button
                onClick={handlePrintPDF}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#4A453C] border border-[#D5CEC0] rounded-full text-xs font-semibold tracking-wider shadow-sm transition-all active:scale-95"
                title="พิมพ์ A4 เต็มหน้า ผ่านเบราว์เซอร์"
              >
                <Printer className="w-4 h-4 text-[#8C6D3F]" />
                <span>พิมพ์ A4 เต็มหน้า</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Footer Modal */}
      {isEditModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B]">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E3DED4] pb-3.5 mb-5 flex items-center gap-2">
              <div className="p-2 bg-[#8C6D3F]/10 rounded-lg text-[#8C6D3F]">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1918]">
                  แก้ไขข้อความ Footer ของสูจิบัตร
                </h3>
                <p className="text-[11px] text-[#7A7468]">
                  ปรับแต่งข้อความท้ายหน้าปก และข้อความท้ายหน้ารูปผลงานแต่ละหน้า
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveFooterText} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A443A] mb-1">
                  1. ข้อความ Footer ท้ายหน้าปกสูจิบัตร (Cover Footer)
                </label>
                <input
                  type="text"
                  required
                  value={coverFooter}
                  onChange={(e) => setCoverFooter(e.target.value)}
                  placeholder="เช่น International Art Festival and Art Exhibition in Thailand • 18th Poh-Chang Art Festival"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CEC0] rounded-xl text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                />
                <span className="text-[10px] text-[#8C8477] mt-1 block">
                  จะแสดงที่แถบท้ายสุดของหน้าปกสูจิบัตร
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A443A] mb-1">
                  2. ข้อความ Footer ท้ายหน้ารูปผลงานแต่ละหน้า (Artwork Page Footer - ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={plateFooter}
                  onChange={(e) => setPlateFooter(e.target.value)}
                  placeholder="เช่น 18th Poh-Chang Art Festival 2026 หรือเว้นว่างไว้"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CEC0] rounded-xl text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                />
                <span className="text-[10px] text-[#8C8477] mt-1 block">
                  จะแสดงที่แถบท้ายสุดของหน้ารูปผลงานแต่ละหน้า (หากไม่ต้องการให้แสดงข้อความสามารถเว้นว่างไว้ได้)
                </span>
              </div>

              <div className="pt-3 border-t border-[#E8E2D6] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6E685C] hover:text-[#1A1918]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-xl text-xs font-semibold tracking-wider uppercase shadow transition-all active:scale-95 disabled:opacity-50"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>บันทึกสำเร็จ!</span>
                    </>
                  ) : saving ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#C5A880]" />
                      <span>บันทึกข้อความ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main A4 Visual Catalog Viewer (WYSIWYG 100% True-to-Print A4) */}
      <main className="w-full max-w-[210mm] mx-auto py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* Cover Page (A4, 210mm x 297mm, 15mm Padding) */}
        <section className="catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm] bg-white border border-[#D5CEC0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border text-center">
          <div>
            <div className="border-b border-[#E8E2D6] pb-3 mb-5">
              <span className="font-serif text-3xl font-bold tracking-[0.2em] text-[#1A1918] block">
                ARTVARA
              </span>
              <span className="text-[10px] uppercase tracking-widest text-[#8C8477] mt-1 block">
                International Art Festival & Curated Exhibition
              </span>
            </div>

            {exhibition.bannerUrl && (
              <div className="relative w-full h-[140mm] max-w-[180mm] mx-auto overflow-hidden mb-5 flex items-center justify-center">
                <img
                  src={exhibition.bannerUrl}
                  alt={exhibition.title}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            <div className="space-y-2 max-w-[170mm] mx-auto">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8C6D3F] block">
                Official Exhibition Catalog (สูจิบัตร)
              </span>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1918] leading-snug">
                {exhibition.title}
              </h1>
              {curator?.name && (
                <p className="text-xs text-[#615B50] font-medium pt-1">
                  Curated by: <span className="font-semibold text-[#1A1918]">{curator.name}</span>
                </p>
              )}
              <p className="text-[11px] text-[#8A8376]">
                {formatDateRange(exhibition.startDate, exhibition.endDate)}
              </p>
            </div>
          </div>

          {/* Dynamic Cover Footer Text */}
          <div className="pt-4 border-t border-[#E8E2D6] text-center">
            <p className="text-[10px] text-[#8A8376] uppercase tracking-widest leading-relaxed">
              {coverFooter}
            </p>
          </div>
        </section>

        {/* 1 Artwork Plate Per Page (A4, 210mm x 297mm, 15mm Margins, 8 Inches Boundary, Flag Above Photo) */}
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
              className="catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm] bg-white border border-[#D5CEC0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border"
            >
              <div>
                {/* 1. Main Large Artwork Image (Positioned from top to 8-inch boundary, exactly 175mm tall) */}
                <div className="relative w-full h-[175mm] max-h-[175mm] bg-white overflow-hidden mb-3 flex items-center justify-center">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* 2. Details Section (Starts at 8 inches from top of page) */}
                <div className="relative z-10 flex flex-row items-start gap-5 pt-0.5">
                  {/* Left Column: Flag Image ON TOP, Artist Photo DIRECTLY BELOW */}
                  <div className="shrink-0 w-20 flex flex-col items-start">
                    {/* Flag Badge Image - Above Photo */}
                    <div className="relative w-9 h-5 rounded-[2px] overflow-hidden border border-[#DDD6C8] shadow-sm mb-2 bg-neutral-100">
                      <img
                        src={getFlagImageUrl(artist?.country)}
                        alt={artist?.country || 'Flag'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Artist Photo / Avatar (Below Flag) */}
                    {hasRealPhoto ? (
                      <div className="relative w-20 h-24 bg-[#2B2824] rounded-lg overflow-hidden shadow">
                        <img
                          src={artist!.avatarUrl!}
                          alt={artist?.name || 'Artist'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-24 bg-[#FAF8F5] border border-[#DDD6C8] rounded-lg flex items-center justify-center font-serif text-2xl font-bold text-[#8C6D3F] shadow-sm">
                        {artist?.name?.trim().charAt(0).toUpperCase() || 'A'}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Artist Info & Artwork Specs & Concept */}
                  <div className="flex-1 space-y-1 text-xs text-[#3D3A34] min-w-0">
                    <div>
                      <h3 className="font-sans text-sm font-bold text-[#1A1918] leading-tight truncate">
                        {artist?.name || 'Artist'}
                      </h3>
                      {artist?.email && (
                        <p className="text-[#7A7468] text-[10px] font-mono leading-tight">{artist.email}</p>
                      )}
                      <p className="text-[#7A7468] text-[10px] leading-tight">{artist?.country || 'International'}</p>
                    </div>

                    <div className="pt-0.5">
                      <h4 className="font-sans text-xs sm:text-sm font-bold text-[#1A1918] leading-tight truncate">
                        {art.title}
                      </h4>
                      <p className="text-[#5E584D] text-[10px] leading-tight">
                        {[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ')}
                      </p>
                    </div>

                    {(art.concept || art.description) && (
                      <div className="pt-0.5 text-[10px] sm:text-[11px] leading-relaxed text-[#423E37] line-clamp-3">
                        <span className="font-bold text-[#1A1918]">Concept : </span>
                        <span>{art.concept || art.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Subtle Ribbon / Wave Graphic matching reference */}
              <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden z-0 opacity-40">
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

              {/* Bottom Footer Row: Custom Plate Footer & Page Number */}
              <div className="relative z-10 mt-3 pt-2 border-t border-[#F0ECE4] flex items-center justify-between text-[10px] text-[#A69F92]">
                <span>
                  {plateFooter ? plateFooter : ''}
                  {art.price ? (plateFooter ? ` • ${formatPrice(art.price)}` : formatPrice(art.price)) : ''}
                </span>
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
