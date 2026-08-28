'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Palette,
  Eye,
  Inbox,
  FileText,
  ArrowLeft,
  Layers,
  Sparkles,
  Users,
  Award,
  Box,
  FileSpreadsheet,
  LogOut,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { lang, setLang, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const isFullCanvas = pathname === '/admin/3d-studio' || pathname === '/admin/catalog-designer';
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    const confirmMsg =
      lang === 'th'
        ? 'คุณต้องการออกจากระบบผู้ดูแล (Admin Logout) ใช่หรือไม่?'
        : 'Are you sure you want to log out of the admin panel?';

    if (!window.confirm(confirmMsg)) return;

    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      window.location.href = '/login';
    } finally {
      setLoggingOut(false);
    }
  };

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
              href="/admin/catalog-designer"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-[#D4AF37] bg-[#8B1B1B]/20 border border-[#8B1B1B]/40 hover:bg-[#8B1B1B]/30 transition-colors font-bold shadow-sm"
            >
              <FileText className="w-4 h-4 text-[#D4AF37]" />
              <span>{lang === 'th' ? 'ออกแบบสูจิบัตร (Catalog)' : 'Catalog Designer'}</span>
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

        {/* Footer Actions: Session & Logout */}
        <div className="pt-5 border-t border-[#33302C] space-y-3">
          {/* Admin Identity Badge */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-semibold text-neutral-200">
                {lang === 'th' ? 'ผู้ดูแลระบบ' : 'Admin'}
              </span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active session" />
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-rose-400 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/30 hover:border-rose-500/60 shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {loggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                <span>{lang === 'th' ? 'กำลังออกจากระบบ...' : 'Logging out...'}</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4 text-rose-400" />
                <span>{lang === 'th' ? 'ออกจากระบบ (Log Out)' : 'Log Out'}</span>
              </>
            )}
          </button>

          {/* Back to Public Gallery */}
          <Link
            href="/"
            className="flex items-center justify-center gap-2 text-xs font-semibold text-[#8C8578] hover:text-white transition-colors pt-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t.admin.returnGallery}</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden ${isFullCanvas ? 'p-0 h-full flex flex-col' : 'p-6 sm:p-10 overflow-y-auto'}`}>
        {children}
      </main>
    </div>
  );
}
