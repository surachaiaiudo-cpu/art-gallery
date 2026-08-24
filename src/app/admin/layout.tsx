'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Palette, Eye, Inbox, FileText, ArrowLeft, Layers, Sparkles, Users, Award, Box, FileSpreadsheet } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang, setLang, t } = useLanguage();
  const pathname = usePathname();
  const is3DStudio = pathname === '/admin/3d-studio';

  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#F3EFE9] text-[#1E1D1B] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#1A1918] text-[#D8D2C6] p-6 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand & Language Switcher */}
          <div className="border-b border-[#33302C] pb-6 mb-6">
            <div className="flex items-center justify-between">
              <Link href="/" className="group flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#8B1B1B] text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center font-serif font-bold text-xs shadow-sm">
                  พช
                </div>
                <span className="font-serif text-xl font-bold tracking-[0.12em] text-white group-hover:text-[#D4AF37] transition-colors">
                  POH-CHANG
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
              href="/admin/3d-studio"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-amber-400 bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/25 transition-colors font-bold shadow-sm"
            >
              <Box className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>{lang === 'th' ? 'สตูดิโอ 3D Gallery' : '3D Gallery Studio'}</span>
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
              href="/admin/import"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 hover:bg-emerald-900/30 transition-colors font-medium"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{lang === 'th' ? 'นำเข้าข้อมูล (Batch)' : 'Batch Import'}</span>
            </Link>

            <Link
              href="/admin/inquiries"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition-colors"
            >
              <Inbox className="w-4 h-4 text-[#C5A880]" />
              <span>{t.admin.inquiries}</span>
            </Link>
          </nav>
        </div>

        {/* Back to Public Gallery */}
        <div className="pt-6 border-t border-[#33302C]">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-semibold text-[#8C8578] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.admin.returnGallery}</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden ${is3DStudio ? 'p-0 h-full flex flex-col' : 'p-6 sm:p-10 overflow-y-auto'}`}>
        {children}
      </main>
    </div>
  );
}
