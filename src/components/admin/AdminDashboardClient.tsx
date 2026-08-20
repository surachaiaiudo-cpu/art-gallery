'use client';

import React from 'react';
import Link from 'next/link';
import { Exhibition, Artwork, User, Inquiry } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { Eye, Box, FileText, Layers, Inbox, Palette, Users, Sparkles, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';
import { formatDateRange } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface AdminDashboardClientProps {
  exhibitions: Exhibition[];
  artworks: Artwork[];
  artists: User[];
  inquiries: Inquiry[];
}

export function AdminDashboardClient({
  exhibitions,
  artworks,
  artists,
  inquiries,
}: AdminDashboardClientProps) {
  const { lang, t } = useLanguage();
  const router = useRouter();
  const [clearing, setClearing] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);

  const activeExh = exhibitions.find((e) => e.status === 'active') || exhibitions[0];

  const handleClearMockupData = async () => {
    const confirmMsg =
      lang === 'th'
        ? '⚠️ คุณต้องการล้างข้อมูล Mockup ทั้งหมด (นิทรรศการ, ศิลปิน, ผลงาน, ข้อความติดต่อ) ใช่หรือไม่?\n\nการกระทำนี้จะล้างข้อมูลทั้งหมดในฐานข้อมูล'
        : '⚠️ Are you sure you want to clear all mockup data (exhibitions, artists, artworks, inquiries)?';

    if (!window.confirm(confirmMsg)) return;

    setClearing(true);
    try {
      const res = await fetch('/api/admin/clear-mockup', { method: 'POST' });
      if (res.ok) {
        setNotification(lang === 'th' ? 'ล้างข้อมูล Mockup ทั้งหมดเรียบร้อยแล้ว' : 'All mockup data cleared');
        setTimeout(() => {
          router.refresh();
          window.location.reload();
        }, 1200);
      } else {
        alert('Failed to clear database');
      }
    } catch (err) {
      console.error(err);
      alert('Error clearing database');
    } finally {
      setClearing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {notification && (
        <div className="p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-slide-up shadow">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD5C8] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
            {t.admin.overview}
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1918] mt-1">
            {t.admin.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearMockupData}
            disabled={clearing}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50"
            title="Clear all mockup data"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{clearing ? (lang === 'th' ? 'กำลังล้างข้อมูล...' : 'Clearing...') : (lang === 'th' ? 'ล้างข้อมูล Mockup ทั้งหมด' : 'Clear All Mockups')}</span>
          </button>

          {activeExh && (
            <Link
              href={`/exhibitions/${activeExh.slug}`}
              target="_blank"
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#1A1918] border border-[#D5CEC0] rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
            >
              <span>{t.admin.liveExhibition}</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#8C6D3F]" />
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-[#E0D9CD] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8C8477] font-semibold uppercase">
            <span>{t.admin.exhibitionsCount}</span>
            <Layers className="w-4 h-4 text-[#8C6D3F]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#1A1918] mt-2">{exhibitions.length}</p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">{t.admin.activeStatus}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E0D9CD] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8C8477] font-semibold uppercase">
            <span>{t.admin.artworksCount}</span>
            <Palette className="w-4 h-4 text-[#8C6D3F]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#1A1918] mt-2">{artworks.length}</p>
          <p className="text-[11px] text-[#7A7468] mt-1 font-medium">{t.admin.placedCoordinates}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E0D9CD] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8C8477] font-semibold uppercase">
            <span>{t.admin.artistsCount}</span>
            <Users className="w-4 h-4 text-[#8C6D3F]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#1A1918] mt-2">{artists.length}</p>
          <p className="text-[11px] text-[#7A7468] mt-1 font-medium">{t.admin.internationalThai}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-[#E0D9CD] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8C8477] font-semibold uppercase">
            <span>{t.admin.inquiriesCount}</span>
            <Inbox className="w-4 h-4 text-[#8C6D3F]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#1A1918] mt-2">{inquiries.length}</p>
          <p className="text-[11px] text-amber-700 mt-1 font-medium">{t.admin.visitorQuestions}</p>
        </div>
      </div>

      {/* Active Exhibition Highlight & Quick Actions */}
      {activeExh && (
        <div className="bg-[#FAF8F5] border border-[#DDD6C8] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8E2D6] pb-5 mb-6">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
                {t.admin.activeShowcase}
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1A1918] mt-1">
                {activeExh.title}
              </h2>
              <p className="text-xs text-[#6B655B] mt-0.5">
                {formatDateRange(activeExh.startDate, activeExh.endDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/admin/exhibitions/${activeExh.id}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
                <span>{t.admin.openWallBuilder}</span>
              </Link>

              <Link
                href={`/catalog/${activeExh.slug}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#F3EFE9] text-[#2C2925] border border-[#D0CABE] rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
              >
                <FileText className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span>{t.admin.catalogEngine}</span>
              </Link>
            </div>
          </div>

          <div className="text-xs text-[#524D43] leading-relaxed line-clamp-3 font-serif italic">
            "{activeExh.curatorNote}"
          </div>
        </div>
      )}

      {/* Recent Inquiries List */}
      <div className="bg-white rounded-xl border border-[#E0D9CD] shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#EBE6DC] flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#1A1918]">{t.admin.recentInquiries}</h3>
            <p className="text-xs text-[#7D776B]">
              {lang === 'th' ? 'ข้อความที่ผู้ชมส่งมาจากหน้านิทรรศการ 2D / 3D / Carousel' : 'Messages submitted by visitors through 2D, 3D, and Carousel views'}
            </p>
          </div>
          <Link
            href="/admin/inquiries"
            className="text-xs font-semibold text-[#8C6D3F] hover:underline uppercase tracking-wider"
          >
            {t.admin.viewAll}
          </Link>
        </div>

        <div className="divide-y divide-[#F0ECE4]">
          {inquiries.length === 0 ? (
            <div className="p-6 text-center text-[#8C8477] text-xs">{t.admin.noInquiries}</div>
          ) : (
            inquiries.slice(0, 5).map((inq) => (
              <div key={inq.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#1A1918]">{inq.visitorName}</span>
                    <span className="text-xs text-[#8C8477]">({inq.visitorEmail})</span>
                  </div>
                  <p className="text-xs text-[#5C564B] mt-1 font-medium">
                    {t.admin.targetArtwork}: <span className="text-[#1A1918] font-semibold">{inq.artworkTitle}</span>
                  </p>
                  {inq.message && (
                    <p className="text-xs text-[#7A7468] mt-1 italic">"{inq.message}"</p>
                  )}
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 self-start sm:self-auto">
                  {inq.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
