export const runtime = 'edge';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getExhibitionBySlug } from '@/lib/data';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Download, ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import { formatDateRange, formatPrice } from '@/lib/utils';

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
    <div className="min-h-screen flex flex-col bg-[#EFECE6] text-[#1E1D1B]">
      <Navbar exhibition={exhibition} />

      {/* Top Banner Toolbar */}
      <div className="bg-[#E4DFD5] border-b border-[#D5CEC0] py-4 px-4 sm:px-6 lg:px-8 sticky top-16 z-30 shadow-sm backdrop-blur-md">
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
              E-Catalog Preview (สูจิบัตรพิมพ์ A4)
            </span>
          </div>

          <a
            href={`/api/exhibitions/${exhibition.slug}/catalog`}
            download={`${exhibition.slug}-catalog.pdf`}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Download Official PDF (A4 Print Ready)</span>
          </a>
        </div>
      </div>

      {/* Book-Style A4 Single-Page Visual Catalog Viewer */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-16">
        {/* Cover Page */}
        <section className="relative bg-white border border-[#D5CEC0] shadow-2xl overflow-hidden p-8 sm:p-14 text-center max-w-3xl mx-auto rounded-sm">
          <div className="border-b border-[#E8E2D6] pb-6 mb-8">
            <span className="font-serif text-3xl font-bold tracking-[0.2em] text-[#1A1918] block">
              ARTVARA
            </span>
            <span className="text-[10px] uppercase tracking-widest text-[#8C8477] mt-1 block">
              International Art Festival & Curated Exhibition
            </span>
          </div>

          <div className="relative aspect-[16/9] w-full max-w-2xl mx-auto rounded overflow-hidden shadow mb-8">
            <Image
              src={
                exhibition.bannerUrl ||
                'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop'
              }
              alt={exhibition.title}
              fill
              className="object-cover"
              priority
            />
          </div>

          <div className="space-y-2">
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
        </section>

        {/* 1 Artwork Plate Per Page (Matching user specification & reference layout) */}
        {artworks.map((art, idx) => {
          const artist = art.artist;
          const pageNum = idx + 2;

          return (
            <section
              key={art.id}
              className="relative bg-white border border-[#D5CEC0] shadow-2xl p-6 sm:p-12 sm:pl-16 rounded-sm min-h-[880px] flex flex-col justify-between"
            >
              {/* Left Margin Vertical Running Header (Rotated) */}
              <div className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 -rotate-90 origin-center w-96 text-[9px] uppercase tracking-[0.2em] text-[#A09A8F] font-sans font-medium whitespace-nowrap pointer-events-none select-none">
                ARTVARA International Art Festival & Curated Exhibition in Thailand
              </div>

              {/* Top Row: Page Number */}
              <div>
                <span className="font-sans text-sm text-[#736E64] font-medium block mb-4">
                  {pageNum}
                </span>

                {/* Main Large Artwork Image */}
                <div className="relative aspect-[4/3] w-full max-h-[460px] bg-[#F7F6F2] rounded-sm overflow-hidden mb-5 flex items-center justify-center p-2 shadow-inner">
                  <div className="relative w-full h-full">
                    <Image
                      src={art.imageUrl}
                      alt={art.title}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>

                {/* Country Flag / Nationality Row */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-2xl">{artist?.flagEmoji || '🎨'}</span>
                  <span className="text-xs uppercase font-bold tracking-wider text-[#4A453C]">
                    {artist?.country || 'International'}
                  </span>
                </div>

                {/* Bottom Section: Artist Avatar on Left, Specs & Concept on Right */}
                <div className="flex flex-col sm:flex-row items-start gap-6 pt-2">
                  {/* Artist Photo / Avatar */}
                  {artist?.avatarUrl && !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') ? (
                    <div className="relative w-24 h-28 sm:w-28 sm:h-32 bg-[#2B2824] rounded-sm overflow-hidden shrink-0 shadow">
                      <Image
                        src={artist.avatarUrl}
                        alt={artist?.name || 'Artist'}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#2B2824] rounded-xl flex items-center justify-center font-serif text-2xl font-bold text-[#E8DAC5] border border-[#C5A880]/30 shrink-0 shadow">
                      {artist?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}

                  {/* Details Column */}
                  <div className="flex-1 space-y-2 text-xs text-[#3D3A34]">
                    <div>
                      <h3 className="font-sans text-sm font-bold text-[#1A1918]">
                        {artist?.name || 'Artist'}
                      </h3>
                      <p className="text-[#7A7468] text-[11px] font-mono">{artist?.email}</p>
                      <p className="text-[#7A7468] text-[11px]">{artist?.country}</p>
                    </div>

                    <div className="pt-1">
                      <h4 className="font-sans text-sm font-bold text-[#1A1918]">
                        {art.title}
                      </h4>
                      <p className="text-[#5E584D] text-[11px]">
                        {art.medium} {art.dimensions}
                      </p>
                    </div>

                    {(art.concept || art.description) && (
                      <div className="pt-2 text-xs leading-relaxed text-[#423E37]">
                        <span className="font-bold text-[#1A1918]">Concept : </span>
                        <span>{art.concept || art.description}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Subtle Artistic Curve Gradient Accent */}
              <div className="mt-8 pt-4 border-t border-[#F0ECE4] flex items-center justify-between text-[10px] text-[#A69F92]">
                <span>ARTVARA E-Catalog • Plate #{idx + 1}</span>
                <span>{formatPrice(art.price)}</span>
              </div>
            </section>
          );
        })}
      </main>

      <Footer exhibition={exhibition} />
    </div>
  );
}
