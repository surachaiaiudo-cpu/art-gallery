'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Shield, ChevronDown, ChevronUp, Sparkles, Compass, Award, ExternalLink } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

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

  const MOBILE_LIMIT = 4;
  const isManyExhibitions = exhibitions.length > MOBILE_LIMIT;

  return (
    <footer className="w-full bg-[#0D0C0B] border-t border-[#C5A880]/20 mt-auto text-[#A59F92]">
      {/* Main Luxury Footer Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex flex-col gap-10">
        
        {/* Top Grid: Brand Statement + Nav Links + Curatorial Mission */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 border-b border-[#24211D] pb-10">
          
          {/* Col 1: Brand & Heritage Crest */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#8B1B1B] via-[#6B1414] to-[#3B0A0A] text-[#D4AF37] border border-[#D4AF37]/50 flex items-center justify-center font-serif font-bold text-sm shadow-[0_0_20px_rgba(212,175,55,0.25)] shrink-0">
                พช
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-[0.15em] text-[#FAF8F5] block leading-none">
                  POH-CHANG
                </span>
                <span className="text-[10px] tracking-[0.2em] text-[#C5A880] uppercase block mt-1 font-semibold">
                  {lang === 'th' ? 'หอศิลป์วิทยาลัยเพาะช่าง • มทร.รัตนโกสินทร์' : 'Academy of Arts Gallery, RMUTR'}
                </span>
              </div>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed font-light max-w-md">
              {lang === 'th'
                ? 'ศูนย์กลางการเผยแพร่ผลงานวิจิตรศิลป์ร่วมสมัยและนิทรรศการเสมือนจริง 3 มิติ เพื่ออนุรักษ์ ต่อยอด และยกระดับสุนทรียศาสตร์สู่สากล'
                : 'A premier virtual sanctuary and curatorial pavilion dedicated to contemporary fine arts, immersive 3D preservation, and cultural heritage.'}
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="md:col-span-3 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C5A880] block">
              {lang === 'th' ? 'การนำทาง (Navigation)' : 'Navigation'}
            </span>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-[#FAF8F5] transition-colors flex items-center gap-2">
                  <Compass className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{lang === 'th' ? 'โถงนิทรรศการกลาง (Grand Lobby)' : 'Grand Lobby'}</span>
                </Link>
              </li>
              <li>
                <Link href="/artists" className="hover:text-[#FAF8F5] transition-colors flex items-center gap-2">
                  <span>👨‍🎨</span>
                  <span>{lang === 'th' ? 'ทำเนียบศิลปิน (Artists Directory)' : 'Artists Directory'}</span>
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="hover:text-[#FAF8F5] transition-colors flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{lang === 'th' ? 'หอสูจิบัตรดิจิทัล (Catalogs Library)' : 'Digital Catalogs'}</span>
                </Link>
              </li>
              <li>
                <Link href="/admin" className="hover:text-[#FAF8F5] transition-colors flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-[#C5A880]" />
                  <span>{lang === 'th' ? 'ระบบผู้ดูแลนิทรรศการ (Curator Portal)' : 'Curator Admin Portal'}</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Curatorial Standards & Heritage */}
          <div className="md:col-span-4 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#C5A880] block">
              {lang === 'th' ? 'มาตรฐานวิชาการ (Curatorial Standards)' : 'Curatorial Standards'}
            </span>
            <div className="bg-[#161412] p-4 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-[#EAD8C0] font-semibold">
                <Award className="w-4 h-4 text-[#D4AF37]" />
                <span>{lang === 'th' ? 'การประเมินโดยผู้ทรงคุณวุฒิ' : 'Peer Review System'}</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-light">
                {lang === 'th'
                  ? 'ทุกผลงานได้รับการกลั่นกรองและรับรองคุณค่าทางวิชาการและสุนทรียศิลป์โดยคณะกรรมการผู้ทรงคุณวุฒิ'
                  : 'Artworks curated and certified through rigorous academic peer-review by fine arts faculty.'}
              </p>
            </div>
          </div>
        </div>

        {/* Exhibition Pavilions Pill Bar */}
        {exhibitions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C5A880] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{lang === 'th' ? `ห้องนิทรรศการทั้งหมด (${exhibitions.length})` : `All Exhibition Pavilions (${exhibitions.length})`}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {exhibitions.map((ex) => (
                <Link
                  key={ex.id}
                  href={`/exhibitions/${ex.slug}`}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-all ${
                    exhibition?.id === ex.id
                      ? 'bg-[#C5A880] border-[#C5A880] text-[#121110] font-bold shadow-md'
                      : 'bg-[#181614] border-white/10 text-neutral-300 hover:border-[#C5A880]/50 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${ex.status === 'active' ? 'bg-emerald-400' : 'bg-neutral-500'}`} />
                  <span className="truncate max-w-[220px]">{ex.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Copyright & RMUTR Credit */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#24211D] text-[11px] text-neutral-500 font-light">
          <div>
            วิทยาลัยเพาะช่าง มหาวิทยาลัยเทคโนโลยีราชมงคลรัตนโกสินทร์ (ก่อตั้ง พ.ศ. ๒๔๕๖)
          </div>
          <div>
            © {new Date().getFullYear()} POH-CHANG ARTVARA. All Rights Reserved.
          </div>
        </div>

      </div>
    </footer>
  );
}
