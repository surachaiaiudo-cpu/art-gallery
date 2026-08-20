'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Palette, Eye, Inbox, FileText, ArrowLeft, Layers, Sparkles, Users, Award } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F3EFE9] text-[#1E1D1B]">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1A1918] text-[#D8D2C6] p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand & Language Switcher */}
          <div className="border-b border-[#33302C] pb-6 mb-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="group flex items-center gap-2">
                <span className="font-serif text-2xl font-bold tracking-[0.18em] text-white group-hover:text-[#C5A880] transition-colors">
                  ARTVARA
                </span>
              </Link>

              {/* Language Switcher [ TH | EN ] */}
              <div className="flex items-center bg-[#2C2925] rounded-full p-0.5 border border-[#44403B] text-[11px] font-bold font-sans">
                <button
                  onClick={() => setLang('th')}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    lang === 'th'
                      ? 'bg-[#C5A880] text-[#1A1918] shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  TH
                </button>
                <button
                  onClick={() => setLang('en')}
                  className={`px-2 py-0.5 rounded-full transition-all ${
                    lang === 'en'
                      ? 'bg-[#C5A880] text-[#1A1918] shadow'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            <span className="text-[10px] uppercase tracking-widest text-[#8C6D3F] font-bold block mt-2">
              {t.admin.title}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 text-xs font-semibold uppercase tracking-wider">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-[#C5A880]" />
              <span>{t.admin.dashboard}</span>
            </Link>

            <Link
              href="/admin/exhibitions"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-[#C5A880]" />
              <span>{lang === 'th' ? 'จัดการนิทรรศการ' : 'Exhibitions'}</span>
            </Link>

            <Link
              href="/admin/exhibitions/exh-01"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Layers className="w-4 h-4 text-[#C5A880]" />
              <span>{t.admin.wallBuilder}</span>
            </Link>

            <Link
              href="/admin/artists"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Users className="w-4 h-4 text-[#C5A880]" />
              <span>{lang === 'th' ? 'จัดการศิลปิน' : 'Artists'}</span>
            </Link>

            <Link
              href="/admin/curators"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Award className="w-4 h-4 text-[#C5A880]" />
              <span>{lang === 'th' ? 'จัดการภัณฑารักษ์' : 'Curators'}</span>
            </Link>

            <Link
              href="/admin/artworks"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Palette className="w-4 h-4 text-[#C5A880]" />
              <span>{t.admin.artworks}</span>
            </Link>

            <Link
              href="/admin/inquiries"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Inbox className="w-4 h-4 text-[#C5A880]" />
              <span>{t.admin.inquiries}</span>
            </Link>

            <Link
              href="/catalog/the-golden-age-of-ayutthaya"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FileText className="w-4 h-4 text-[#C5A880]" />
              <span>{t.admin.catalogPreview}</span>
            </Link>
          </nav>
        </div>

        {/* Back to Public Gallery */}
        <div className="pt-6 border-t border-[#33302C]">
          <Link
            href="/exhibitions/the-golden-age-of-ayutthaya"
            className="flex items-center gap-2 text-xs font-semibold text-[#8C8578] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.admin.returnGallery}</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 sm:p-10 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
