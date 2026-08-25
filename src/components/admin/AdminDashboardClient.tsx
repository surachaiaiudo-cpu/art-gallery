'use client';

import React from 'react';
import Link from 'next/link';
import { Exhibition, Artwork, User, Inquiry } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { Eye, Box, FileText, Layers, Inbox, Palette, Users, Sparkles, ExternalLink, Trash2, CheckCircle2, LogOut, Loader2 } from 'lucide-react';
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
  const [loggingOut, setLoggingOut] = React.useState(false);
  const [notification, setNotification] = React.useState<string | null>(null);

  const activeExh = exhibitions.find((e) => e.status === 'active') || exhibitions[0];

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

  const handleCleanupOrphans = async () => {
    const confirmMsg =
      lang === 'th'
        ? '🧹 คุณต้องการลบผลงานส่วนเกินที่ไม่ได้อยู่ในนิทรรศการปัจจุบัน (ที่สะสมจากการทดสอบนำเข้าหลายครั้ง) ใช่หรือไม่?\n\nผลงาน 176 ชิ้นในนิทรรศการปัจจุบันจะยังคงอยู่ครบ 100%'
        : '🧹 Do you want to remove duplicate/orphan artworks that are not linked to active exhibitions? (Your 176 active artworks will remain 100% safe).';

    if (!window.confirm(confirmMsg)) return;

    setClearing(true);
    try {
      const res = await fetch('/api/admin/artworks/cleanup-orphans', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setNotification(
          lang === 'th'
            ? `ล้างผลงานส่วนเกินสำเร็จ (${data.deletedCount} รายการ) ผลงานในนิทรรศการคงเหลือครบ ${data.remainingArtworksCount} ชิ้น`
            : `Cleaned up ${data.deletedCount} orphan artworks! Remaining: ${data.remainingArtworksCount}`
        );
        setTimeout(() => {
          router.refresh();
          window.location.reload();
        }, 1500);
      } else {
        alert(data.error || 'Failed to cleanup orphan artworks');
      }
    } catch (err) {
      console.error(err);
      alert('Error cleaning orphan artworks');
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

        <div className="flex items-center gap-3 flex-wrap">
          {artworks.length > 200 && (
            <button
              onClick={handleCleanupOrphans}
              disabled={clearing}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50"
              title="ลบผลงานที่ซ้ำซ้อน/ค้างจากการทดสอบ และเก็บเฉพาะ 176 ชิ้นในนิทรรศการ"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-700" />
              <span>{clearing ? (lang === 'th' ? 'กำลังจัดระเบียบ...' : 'Cleaning...') : (lang === 'th' ? '🧹 ล้างผลงานส่วนเกิน (เก็บเฉพาะในนิทรรศการ)' : '🧹 Clean Orphan Artworks')}</span>
            </button>
          )}

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

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-rose-900 text-neutral-200 hover:text-white border border-neutral-700 hover:border-rose-500/50 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer shadow-sm active:scale-95"
            title={lang === 'th' ? 'ออกจากระบบผู้ดูแล' : 'Log out of admin'}
          >
            {loggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
            ) : (
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>{loggingOut ? (lang === 'th' ? 'กำลังออก...' : 'Logging out...') : (lang === 'th' ? 'ออกจากระบบ' : 'Log Out')}</span>
          </button>
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

      {/* All Exhibitions Showcase & Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
              {lang === 'th' ? 'รายการนิทรรศการในระบบ' : 'Exhibitions Showcase'} ({exhibitions.length})
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#1A1918]">
              {lang === 'th' ? 'นิทรรศการทั้งหมด' : 'All Exhibitions'}
            </h2>
          </div>
          <Link
            href="/admin/exhibitions"
            className="text-xs font-semibold text-[#8C6D3F] hover:text-[#5c4627] hover:underline uppercase tracking-wider flex items-center gap-1"
          >
            <span>{lang === 'th' ? 'จัดการนิทรรศการทั้งหมด' : 'Manage All Exhibitions'}</span>
            <span>&rarr;</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exhibitions.map((exh) => {
            const artworksCount = exh.artworks?.length || 0;
            const artistsCount = new Set(exh.artworks?.map((a) => a.artistId).filter(Boolean)).size || 0;

            return (
              <div
                key={exh.id}
                className="bg-[#FAF8F5] border border-[#DDD6C8] hover:border-[#8C6D3F]/50 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col justify-between transition-all duration-200"
              >
                <div>
                  {/* Banner Preview if available */}
                  {exh.bannerUrl && (
                    <div className="relative w-full h-36 rounded-xl overflow-hidden mb-4 border border-[#DDD6C8] bg-black/5">
                      <img
                        src={exh.bannerUrl}
                        alt={exh.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                            exh.status === 'active'
                              ? 'bg-emerald-600/90 text-white backdrop-blur-md'
                              : exh.status === 'upcoming'
                              ? 'bg-blue-600/90 text-white backdrop-blur-md'
                              : 'bg-neutral-600/90 text-white backdrop-blur-md'
                          }`}
                        >
                          {exh.status === 'active'
                            ? lang === 'th' ? '● เปิดแสดง' : 'Active'
                            : exh.status === 'upcoming'
                            ? lang === 'th' ? 'เร็วๆ นี้' : 'Upcoming'
                            : lang === 'th' ? 'จัดแสดงแล้ว' : 'Archived'}
                        </span>
                      </div>
                      <div className="absolute bottom-2 left-2 flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white font-medium">
                          🎨 {artworksCount} ผลงาน
                        </span>
                        {artistsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-[#FFD98A] font-medium">
                            👥 {artistsCount} ศิลปิน
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-[#1A1918] line-clamp-1">
                        {exh.title}
                      </h3>
                      <p className="text-xs text-[#6B655B] mt-0.5 flex items-center gap-1">
                        <span>📅</span>
                        <span>{formatDateRange(exh.startDate, exh.endDate)}</span>
                      </p>
                    </div>

                    {!exh.bannerUrl && (
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          exh.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-neutral-200 text-neutral-800'
                        }`}
                      >
                        {exh.status === 'active'
                          ? lang === 'th' ? 'กำลังจัดแสดง' : 'Active'
                          : exh.status}
                      </span>
                    )}
                  </div>

                  {exh.curatorNote && (
                    <p className="text-xs text-[#524D43] leading-relaxed line-clamp-2 font-serif italic mt-3">
                      "{exh.curatorNote}"
                    </p>
                  )}
                </div>

                {/* Action Buttons Grid */}
                <div className="mt-5 pt-4 border-t border-[#E8E2D6] flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/exhibitions/${exh.id}`}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    <Layers className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{t.admin.openWallBuilder}</span>
                  </Link>

                  <Link
                    href={`/admin/3d-studio?exhibitionId=${exh.id}`}
                    className="flex-1 min-w-[110px] flex items-center justify-center gap-1.5 px-3 py-2 bg-[#8C6D3F] hover:bg-[#735832] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>3D Studio</span>
                  </Link>

                  <Link
                    href={`/catalog/${exh.slug}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-[#F3EFE9] text-[#2C2925] border border-[#D0CABE] rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                    title="เปิดสูจิบัตร PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#8C6D3F]" />
                    <span>PDF</span>
                  </Link>

                  <Link
                    href={`/exhibitions/${exh.slug}?mode=3d`}
                    target="_blank"
                    className="flex items-center justify-center gap-1 px-3 py-2 bg-white hover:bg-[#F3EFE9] text-[#2C2925] border border-[#D0CABE] rounded-lg text-xs font-semibold uppercase tracking-wider transition-all"
                    title="ชมห้อง 3D เสมือนจริง"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>3D</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

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
