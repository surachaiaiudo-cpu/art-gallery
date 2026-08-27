'use client';

export const runtime = 'edge';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Exhibition, Artwork, is3DEnabled } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { DownloadCatalogPDFButton } from '@/components/catalog/DownloadCatalogPDFButton';
import {
  Layers,
  Box,
  Eye,
  CheckCircle2,
  ArrowRight,
  Building2,
  BookOpen,
  Calendar,
  Users,
  Palette,
  Settings,
  Save,
  ExternalLink,
  ChevronRight,
  Plus,
  ArrowLeft,
  Globe,
  AlertCircle,
  MessageSquareHeart,
  Trash2,
  EyeOff,
  Star,
} from 'lucide-react';

interface GuestbookEntryAdmin {
  id: string;
  visitorName: string;
  visitorEmail: string | null;
  visitorCountry: string | null;
  message: string;
  rating: number | null;
  isApproved: boolean | null;
  createdAt: string | null;
}

export default function AdminExhibitionHubPage({
  params,
}: {
  params: { id: string };
}) {
  const { lang } = useLanguage();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [guestbookEntries, setGuestbookEntries] = useState<GuestbookEntryAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit form state
  const [title, setTitle] = useState('');
  const [curatorNote, setCuratorNote] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [enable3D, setEnable3D] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchExhibition = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/exhibitions/${params.id}`);
      const data = await res.json();
      if (data.exhibition) {
        setExhibition(data.exhibition);
        setTitle(data.exhibition.title || '');
        setCuratorNote(data.exhibition.curatorNote || '');
        setBannerUrl(data.exhibition.bannerUrl || '');
        setStartDate(data.exhibition.startDate ? data.exhibition.startDate.split('T')[0] : '');
        setEndDate(data.exhibition.endDate ? data.exhibition.endDate.split('T')[0] : '');
        setStatus(data.exhibition.status || 'published');
        setEnable3D(is3DEnabled(data.exhibition));

        // Fetch artworks for this exhibition
        const artRes = await fetch(`/api/admin/exhibitions/${data.exhibition.id}/artworks`);
        if (artRes.ok) {
          const artData = await artRes.json();
          if (artData.artworks) {
            setArtworks(artData.artworks);
          }
        }

        // Fetch guestbook entries
        const gbRes = await fetch(`/api/admin/exhibitions/${data.exhibition.id}/guestbook`);
        if (gbRes.ok) {
          const gbData = await gbRes.json();
          if (gbData.entries) {
            setGuestbookEntries(gbData.entries);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load exhibition hub data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExhibition();
  }, [params.id]);

  // Statistics calculation
  const stats = useMemo(() => {
    const totalArtworks = artworks.length;
    const uniqueArtists = new Set(artworks.map((a) => a.artist?.name || a.artistId).filter(Boolean));
    const uniqueCountries = new Set(artworks.map((a) => a.artist?.country).filter(Boolean));
    const roomCount = Math.max(1, Math.ceil(totalArtworks / 30));

    return {
      totalArtworks,
      artistsCount: uniqueArtists.size,
      countriesCount: uniqueCountries.size,
      roomCount,
    };
  }, [artworks]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exhibition) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const payload = {
        title,
        curatorNote,
        bannerUrl,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        status,
        enable3D,
      };

      const res = await fetch(`/api/admin/exhibitions/${exhibition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setFeedback({
          type: 'success',
          message: lang === 'th' ? 'บันทึกข้อมูลนิทรรศการเรียบร้อยแล้ว' : 'Exhibition details saved successfully',
        });
        setTimeout(() => setFeedback(null), 4000);
      } else {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || (lang === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก' : 'Error saving exhibition'),
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGuestbookEntry = async (id: string) => {
    if (!confirm(lang === 'th' ? 'ต้องการลบข้อความนี้ใช่หรือไม่?' : 'Delete this message?')) return;
    setGuestbookEntries((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/admin/exhibitions/${params.id}/guestbook?id=${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting guestbook entry:', err);
    }
  };

  const handleToggleGuestbookApproval = async (id: string, currentApproved: boolean | null) => {
    const nextApproved = !currentApproved;
    setGuestbookEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isApproved: nextApproved } : item))
    );
    try {
      await fetch(`/api/admin/exhibitions/${params.id}/guestbook`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isApproved: nextApproved }),
      });
    } catch (err) {
      console.error('Error toggling guestbook approval:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center">
        <div className="inline-block w-8 h-8 border-4 border-[#8B1B1B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-[#7A7468]">
          {lang === 'th' ? 'กำลังโหลดข้อมูลศูนย์ควบคุมนิทรรศการ...' : 'Loading Exhibition Hub...'}
        </p>
      </div>
    );
  }

  if (!exhibition) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-neutral-800">
          {lang === 'th' ? 'ไม่พบนิทรรศการนี้ในระบบ' : 'Exhibition Not Found'}
        </h2>
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-[#1A1918] text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'th' ? 'กลับสู่หน้าแดชบอร์ด' : 'Back to Dashboard'}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      {/* 1. Breadcrumb & Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E5E0D8] pb-5">
        <div className="flex items-center gap-2 text-xs text-[#7A7468]">
          <Link href="/admin" className="hover:text-[#1A1918] transition-colors">
            {lang === 'th' ? 'แดชบอร์ดหลัก' : 'Dashboard'}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-[#8B1B1B]">
            {lang === 'th' ? 'ศูนย์ควบคุมนิทรรศการ' : 'Exhibition Hub'}
          </span>
        </div>

        {/* Action Link Pills */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href={`/exhibitions/${exhibition.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#D5CEC0] text-xs font-semibold text-[#1A1918] hover:bg-[#FAF8F5] shadow-sm transition-all"
          >
            <Eye className="w-3.5 h-3.5 text-[#8C6D3F]" />
            <span>{lang === 'th' ? 'ดูหน้าเว็บจริง' : 'Live Exhibition'}</span>
            <ExternalLink className="w-3 h-3 text-[#A0988A]" />
          </Link>

          <Link
            href={`/exhibitions/${exhibition.slug}?mode=3d`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B1B1B] text-white text-xs font-semibold hover:bg-[#701515] shadow-sm transition-all"
          >
            <Box className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>{lang === 'th' ? 'เข้าชม 3D' : 'Enter 3D'}</span>
          </Link>
        </div>
      </div>

      {/* 2. Hero Card with Exhibition Header & Summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#1E1C1A] to-[#121110] text-white p-6 sm:p-8 shadow-xl border border-white/10">
        {bannerUrl && (
          <div className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none">
            <Image src={bannerUrl} alt={exhibition.title} fill className="object-cover" />
          </div>
        )}

        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FFD98A]">
              🏛️ {lang === 'th' ? 'ศูนย์จัดการนิทรรศการ' : 'Exhibition Management Hub'}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                status === 'published'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : status === 'draft'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-neutral-500/20 text-neutral-300 border border-neutral-500/30'
              }`}
            >
              ● {status === 'published' ? 'เผยแพร่อยู่ (Live)' : status === 'draft' ? 'ฉบับร่าง (Draft)' : 'ปิดจัดแสดง (Archived)'}
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-4xl font-bold tracking-tight text-[#FBF9F5] max-w-3xl">
            {exhibition.title}
          </h1>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-[#D5CEC0] font-light">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-[#D4AF37]" />
              <span>
                {startDate ? new Date(startDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'} —{' '}
                {endDate ? new Date(endDate).toLocaleDateString('th-TH') : 'ไม่ระบุ'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#D4AF37]" />
              <span>{stats.totalArtworks} ผลงานในนิทรรศการ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#D4AF37]" />
              <span>{stats.artistsCount} ศิลปิน ({stats.countriesCount} ประเทศ)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Key Statistics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1A1918]">{stats.totalArtworks}</div>
            <div className="text-[11px] text-[#7A7468] font-medium">{lang === 'th' ? 'ผลงานศิลปะทั้งหมด' : 'Total Artworks'}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1A1918]">{stats.artistsCount}</div>
            <div className="text-[11px] text-[#7A7468] font-medium">{lang === 'th' ? 'ศิลปินที่เข้าร่วม' : 'Participating Artists'}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1A1918]">{stats.roomCount} ห้อง</div>
            <div className="text-[11px] text-[#7A7468] font-medium">{lang === 'th' ? 'โถงจัดแสดง 3D มัลติรูม' : '3D Exhibition Halls'}</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E5E0D8] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-serif font-bold text-[#1A1918]">{stats.countriesCount}</div>
            <div className="text-[11px] text-[#7A7468] font-medium">{lang === 'th' ? 'ประเทศที่ร่วมจัดแสดง' : 'Countries Represented'}</div>
          </div>
        </div>
      </div>

      {/* 4. The 4 Core Control Modules */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-[#8B1B1B]" />
          <h2 className="font-serif text-lg font-bold text-[#1A1918]">
            {lang === 'th' ? 'โมดูลควบคุมหลัก 4 ฝ่าย' : 'Core Management Modules'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: 3D Multi-Room Studio */}
          <div className="bg-white rounded-2xl border-2 border-amber-500/30 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md">
                  <Box className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 uppercase">
                  ✨ แนะนำ (Recommended)
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1A1918] group-hover:text-amber-700 transition-colors">
                {lang === 'th' ? 'สตูดิโอจัดผังห้อง 3D (3D Multi-Room Studio)' : '3D Multi-Room Curation Studio'}
              </h3>

              <p className="text-xs text-[#6E685C] leading-relaxed">
                {lang === 'th'
                  ? 'จัดผังนิทรรศการ 3D เสมือนจริง, สลับสับเปลี่ยนผลงานข้ามห้อง (Drag-and-Drop / Swap Slot), เลือกลำดับภาพ, ปรับรูปทรงห้อง 4 รูปแบบ และปรับระบบแสงไฟสปอตไลท์'
                  : 'Curate the multi-room 3D gallery, swap artwork slots across interconnected halls, customize room geometries and lighting presets.'}
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-[#F0EBE0] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-amber-800">
                {stats.roomCount} โถงจัดแสดง • ซุ้มประตูโค้ง
              </span>
              <Link
                href={`/admin/3d-studio?exhibition=${exhibition.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow transition-all active:scale-95"
              >
                <span>{lang === 'th' ? 'เข้าสู่ 3D Studio' : 'Open 3D Studio'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Artworks & Inventory Manager */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8B1B1B] to-[#5E1212] text-white flex items-center justify-center shadow-md">
                  <Palette className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#FAF8F5] text-[#8B1B1B] border border-[#E5E0D8]">
                  {artworks.length} ผลงาน
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1A1918] group-hover:text-[#8B1B1B] transition-colors">
                {lang === 'th' ? 'จัดการคลังผลงานศิลปะ (Artworks Manager)' : 'Artworks & Inventory Manager'}
              </h3>

              <p className="text-xs text-[#6E685C] leading-relaxed">
                {lang === 'th'
                  ? 'เพิ่มผลงานใหม่, แก้ไขข้อมูลชื่อภาพ/ศิลปิน/ราคา/ขนาด/เทคนิค, ลบผลงาน, จัดเรียงลำดับหมายเลข (Display Order) และระบบนำเข้าข้อมูลแบบกลุ่ม (Batch Import)'
                  : 'Manage artwork records, edit dimensions and techniques, re-order display sequence, and batch import metadata.'}
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-[#F0EBE0] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#7A7468]">
                {stats.artistsCount} ศิลปินในระบบ
              </span>
              <Link
                href={`/admin/exhibitions/${exhibition.id}/artworks`}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A1918] hover:bg-[#2C2924] text-white rounded-xl text-xs font-bold shadow transition-all active:scale-95"
              >
                <span>{lang === 'th' ? 'จัดการผลงาน' : 'Manage Artworks'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Exhibition Catalog & PDF */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2C4A26] to-[#1E331A] text-white flex items-center justify-center shadow-md">
                  <BookOpen className="w-6 h-6 text-emerald-300" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Digital 3D Flipbook & PDF
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1A1918] group-hover:text-[#2C4A26] transition-colors">
                {lang === 'th' ? 'สมุดแคตตาล็อก & เอกสาร PDF' : 'Catalog & PDF Export'}
              </h3>

              <p className="text-xs text-[#6E685C] leading-relaxed">
                {lang === 'th'
                  ? 'เปิดอ่านสมุดรวมภาพผลงานนิทรรศการฉบับสมบูรณ์ (3D Flipbook Reader พร้อมเสียงเปิดหน้ากระดาษ) และดาวน์โหลดเอกสารไฟล์ PDF ความละเอียดสูงสำหรับพิมพ์สูจิบัตร'
                  : 'Read the interactive 3D Flipbook publication and export print-ready high-resolution exhibition PDF catalog.'}
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-[#F0EBE0] flex items-center justify-between gap-2">
              <Link
                href={`/catalog/${exhibition.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#F3EFE9] hover:bg-[#EAE5DC] text-[#1A1918] rounded-xl text-xs font-semibold transition-all"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span>{lang === 'th' ? 'เปิดอ่าน 3D Flipbook' : 'Open 3D Catalog'}</span>
              </Link>

              <DownloadCatalogPDFButton exhibition={exhibition} variant="secondary" />
            </div>
          </div>

          {/* Card 4: Quick 3D Live Test */}
          <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white flex items-center justify-center shadow-md">
                  <Eye className="w-6 h-6 text-sky-300" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
                  Interactive 60 FPS
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-[#1A1918] group-hover:text-sky-700 transition-colors">
                {lang === 'th' ? 'ทดสอบเดินชม 3D (Live 3D Test)' : 'Test 3D Walkthrough'}
              </h3>

              <p className="text-xs text-[#6E685C] leading-relaxed">
                {lang === 'th'
                  ? 'เข้าชมหอศิลป์เสมือนจริงในมุมมองผู้ชม (First-Person & Drone Flight), ทดสอบระบบแสงไฟ, ซุ้มประตูโค้ง, ดนตรีบรรยากาศ, และการซูมส่องภาพความละเอียด 4K'
                  : 'Experience the 3D exhibition as a visitor with drone flight, ambient audio, and 4K ultra-deep zoom inspect mode.'}
              </p>
            </div>

            <div className="pt-6 mt-4 border-t border-[#F0EBE0] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#7A7468]">
                โหมดมุมมองเสมือนจริง
              </span>
              <Link
                href={`/exhibitions/${exhibition.slug}?mode=3d`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B1B1B] hover:bg-[#701515] text-white rounded-xl text-xs font-bold shadow transition-all active:scale-95"
              >
                <span>{lang === 'th' ? 'ทดสอบเดินชม' : 'Start 3D Walk'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Exhibition Info & Settings Form */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#F0EBE0] pb-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#8B1B1B]" />
            <h2 className="font-serif text-lg font-bold text-[#1A1918]">
              {lang === 'th' ? 'แก้ไขข้อมูลและสถานะนิทรรศการ' : 'Exhibition Details & Settings'}
            </h2>
          </div>
          <span className="text-xs text-[#8A8376]">
            Slug: <code className="bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#E5E0D8] font-mono text-[11px]">{exhibition.slug}</code>
          </span>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-rose-50 text-rose-900 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleSaveDetails} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A7468]">
                {lang === 'th' ? 'ชื่อนิทรรศการ (Exhibition Title) *' : 'Exhibition Title *'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5CEC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1B1B]/30 text-sm font-semibold text-[#1A1918]"
              />
            </div>

            {/* Banner URL */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A7468]">
                {lang === 'th' ? 'ลิงก์รูปภาพโปสเตอร์ / แบนเนอร์ (Poster URL)' : 'Banner Image URL'}
              </label>
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://ik.imagekit.io/..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5CEC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1B1B]/30 text-xs font-mono text-[#1A1918]"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A7468]">
                {lang === 'th' ? 'วันที่เริ่มจัดแสดง (Start Date)' : 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5CEC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1B1B]/30 text-xs font-medium text-[#1A1918]"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A7468]">
                {lang === 'th' ? 'วันที่สิ้นสุดจัดแสดง (End Date)' : 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5CEC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1B1B]/30 text-xs font-medium text-[#1A1918]"
              />
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A7468]">
                {lang === 'th' ? 'สถานะการเผยแพร่ (Publication Status)' : 'Publication Status'}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-xl border border-[#D5CEC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1B1B]/30 text-xs font-semibold text-[#1A1918] cursor-pointer"
              >
                <option value="published">🟢 เผยแพร่อยู่ (Published - Public)</option>
                <option value="draft">🟡 ฉบับร่าง (Draft - Private)</option>
                <option value="archived">🔒 ปิดการจัดแสดงแล้ว (Archived - Vault)</option>
              </select>
            </div>

            {/* 3D Engine Toggle */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A7468]">
                {lang === 'th' ? 'เปิดใช้งาน 3D Virtual Gallery' : '3D Virtual Gallery Mode'}
              </label>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setEnable3D(!enable3D)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    enable3D ? 'bg-[#8B1B1B]' : 'bg-neutral-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      enable3D ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className="text-xs font-semibold text-[#1A1918]">
                  {enable3D ? '✅ เปิดให้เข้าชม 3D' : '❌ ปิดโหมด 3D (แสดงเฉพาะ 2D)'}
                </span>
              </div>
            </div>

            {/* Curator's Note */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#7A7468]">
                {lang === 'th' ? 'คำนิยมภัณฑารักษ์ / บทนำนิทรรศการ (Curator Note)' : 'Curator Note / Statement'}
              </label>
              <textarea
                value={curatorNote}
                onChange={(e) => setCuratorNote(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-[#D5CEC0] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B1B1B]/30 text-xs text-[#1A1918] leading-relaxed"
                placeholder="เขียนบทนำ แนวคิด หรือคำนิยมประจำนิทรรศการ..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#F0EBE0]">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#8B1B1B] hover:bg-[#701515] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-[#D4AF37]" />
              )}
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลนิทรรศการ'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 6. Artwork Roster Preview */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#F0EBE0] pb-4">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#8B1B1B]" />
            <h2 className="font-serif text-lg font-bold text-[#1A1918]">
              {lang === 'th' ? `ตัวอย่างผลงานในนิทรรศการ (${artworks.length} ชิ้น)` : `Artwork Roster (${artworks.length})`}
            </h2>
          </div>

          <Link
            href={`/admin/exhibitions/${exhibition.id}/artworks`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B1B1B] hover:underline"
          >
            <span>{lang === 'th' ? 'จัดการผลงานทั้งหมด' : 'Manage All'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {artworks.length === 0 ? (
          <div className="py-12 text-center text-[#7A7468]">
            <Palette className="w-8 h-8 mx-auto mb-2 text-[#A0988A]" />
            <p className="text-xs font-medium">ยังไม่มีผลงานในนิทรรศการนี้</p>
            <Link
              href={`/admin/exhibitions/${exhibition.id}/artworks`}
              className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 bg-[#8B1B1B] text-white rounded-xl text-xs font-semibold shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>เพิ่มผลงานศิลปะ</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {artworks.slice(0, 12).map((art, idx) => (
              <div
                key={art.id}
                className="group relative rounded-xl border border-[#E5E0D8] bg-[#FAF8F5] p-2 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-neutral-200 mb-2">
                  {art.imageUrl ? (
                    <Image
                      src={art.imageUrl}
                      alt={art.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 50vw, 150px"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                      No Image
                    </div>
                  )}
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/75 text-[10px] font-mono font-bold text-white shadow">
                    #{art.displayOrder || idx + 1}
                  </span>
                </div>

                <div className="space-y-0.5 text-left">
                  <div className="text-xs font-bold text-[#1A1918] truncate" title={art.title}>
                    {art.title}
                  </div>
                  <div className="text-[11px] text-[#7A7468] truncate flex items-center gap-1">
                    {art.artist?.country && <CountryFlag country={art.artist.country} className="w-3.5 h-2.5 shrink-0" />}
                    <span>{art.artist?.name || 'Artist'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {artworks.length > 12 && (
          <div className="pt-2 text-center">
            <Link
              href={`/admin/exhibitions/${exhibition.id}/artworks`}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EFEBE2] border border-[#DDD6C8] text-xs font-semibold text-[#8B1B1B] shadow-sm transition-all"
            >
              <span>{lang === 'th' ? `ดูและจัดเรียงผลงานอีก ${artworks.length - 12} ชิ้นที่เหลือ` : `View remaining ${artworks.length - 12} artworks`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* 7. Guestbook Moderation Section */}
      <div className="bg-white rounded-2xl border border-[#E5E0D8] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#F0EBE0] pb-4">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-[#8B1B1B]" />
            <h2 className="font-serif text-lg font-bold text-[#1A1918]">
              {lang === 'th' ? `จัดการสมุดเยี่ยมชมนิทรรศการ (${guestbookEntries.length} ข้อความ)` : `Guestbook Moderation (${guestbookEntries.length})`}
            </h2>
          </div>

          <Link
            href={`/exhibitions/${exhibition.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C6D3F] hover:underline"
          >
            <span>{lang === 'th' ? 'ดูสมุดเยี่ยมชมหน้าเว็บ' : 'View Public Guestbook'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {guestbookEntries.length === 0 ? (
          <div className="py-10 text-center text-[#7A7468] text-xs">
            <MessageSquareHeart className="w-8 h-8 text-[#C5A880] mx-auto mb-2 opacity-50" />
            <p>ยังไม่มีข้อความลงชื่อในสมุดเยี่ยมชมของนิทรรศการนี้</p>
          </div>
        ) : (
          <div className="space-y-3">
            {guestbookEntries.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  item.isApproved !== false
                    ? 'bg-[#FAF8F5] border-[#E5DFD5]'
                    : 'bg-neutral-100 border-neutral-300 opacity-60'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1A1918]">{item.visitorName}</span>
                    {item.visitorCountry && (
                      <CountryFlag country={item.visitorCountry} className="w-3.5 h-2.5 shrink-0" />
                    )}
                    {item.rating && (
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400" />
                        ))}
                      </div>
                    )}
                    <span className="text-[10px] text-[#8A8376]">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString('th-TH') : ''}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A453C] italic font-serif">"{item.message}"</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleGuestbookApproval(item.id, item.isApproved)}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      item.isApproved !== false
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                        : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
                    }`}
                  >
                    {item.isApproved !== false ? (
                      <>
                        <EyeOff className="w-3 h-3" />
                        <span>ซ่อน</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        <span>แสดง</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDeleteGuestbookEntry(item.id)}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 hover:text-rose-800 transition-colors"
                    title="ลบข้อความนี้"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
