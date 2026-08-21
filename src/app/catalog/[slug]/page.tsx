export const runtime = 'edge';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
 import { getExhibitionBySlug } from '@/lib/data';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { formatDateRange, formatPrice } from '@/lib/utils';
import { DownloadCatalogPDFButton } from '@/components/catalog/DownloadCatalogPDFButton';

export const dynamic = 'force-dynamic';

export default async function CatalogViewerPage({
  params,
}: {
  params: { slug: string };
}) {
  const exhibition = await getExhibitionBySlug(params.slug);

  if (!exhibition) {
    notFound();
  }

  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F0] text-[#1E1D1B]">
      {/* Print CSS Stylesheet for strict A4 with 1.5cm margins and pure white background */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm;
          }
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .catalog-a4-page {
            page-break-after: always;
            break-after: page;
            width: 100% !important;
            min-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
          }
        }
      `}</style>

      <div className="no-print">
        <Navbar exhibition={exhibition} />

        {/* Top Banner Toolbar */}
        <div className="bg-[#EAE5DC] border-b border-[#D5CEC0] py-4 px-4 sm:px-6 lg:px-8 sticky top-16 z-30 shadow-sm backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
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
                สูจิบัตรพิมพ์ A4 (1.5 cm Margins)
              </span>
            </div>

            {/* A4 PDF Download & Print Button */}
            <DownloadCatalogPDFButton exhibition={exhibition} />
          </div>
        </div>
      </div>

      {/* Book-Style A4 Single-Page Visual Catalog Viewer (A4 210mm x 297mm, 15mm margins, pure white background) */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-16">
        {/* Cover Page (Strict A4 Layout, 1.5 cm Margin, Pure White Background) */}
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
              <div className="relative aspect-[16/10] w-full max-w-[180mm] mx-auto overflow-hidden mb-6">
                <Image
                  src={exhibition.bannerUrl}
                  alt={exhibition.title}
                  fill
                  className="object-contain"
                  priority
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

        {/* 1 Artwork Plate Per Page (A4, 1.5 cm Margin, White Background, Image at the top) */}
        {artworks.map((art, idx) => {
          const artist = art.artist;
          const pageNum = idx + 2;

          return (
            <section
              key={art.id}
              className="catalog-a4-page relative bg-white border border-[#D5CEC0] shadow-xl p-6 sm:p-[15mm] rounded-sm max-w-[210mm] min-h-[297mm] mx-auto flex flex-col justify-between"
            >
              <div>
                {/* Main Large Artwork Image (Positioned directly at the top) */}
                <div className="relative w-full aspect-[4/3] max-h-[500px] bg-white overflow-hidden mb-4 flex items-center justify-center">
                  <Image
                    src={art.imageUrl}
                    alt={art.title}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Country Flag / Nationality Row */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">{artist?.flagEmoji || '🎨'}</span>
                  <span className="text-xs uppercase font-bold tracking-wider text-[#4A453C]">
                    {artist?.country || 'International'}
                  </span>
                </div>

                {/* Bottom Section: Artist Photo on Left, Specs & Concept on Right */}
                <div className="flex flex-col sm:flex-row items-start gap-5 pt-1">
                  {/* Artist Photo / Avatar (Only if real photo, no mockup) */}
                  {artist?.avatarUrl &&
                  !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
                  !artist.avatarUrl.includes('unsplash.com/photo-1534528741775') && (
                    <div className="relative w-20 h-24 sm:w-24 sm:h-28 bg-[#2B2824] rounded-sm overflow-hidden shrink-0 shadow">
                      <Image
                        src={artist.avatarUrl}
                        alt={artist?.name || 'Artist'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Details Column */}
                  <div className="flex-1 space-y-1.5 text-xs text-[#3D3A34]">
                    <div>
                      <h3 className="font-sans text-sm font-bold text-[#1A1918]">
                        {artist?.name || 'Artist'}
                      </h3>
                      {artist?.email && (
                        <p className="text-[#7A7468] text-[11px] font-mono">{artist.email}</p>
                      )}
                    </div>

                    <div className="pt-1">
                      <h4 className="font-sans text-sm font-bold text-[#1A1918]">
                        {art.title}
                      </h4>
                      <p className="text-[#5E584D] text-[11px]">
                        {[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' • ')}
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

              {/* Bottom Footer Row: Plate number & Page count */}
              <div className="mt-6 pt-3 border-t border-[#F0ECE4] flex items-center justify-between text-[10px] text-[#A69F92]">
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
