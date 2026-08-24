'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Exhibition, is3DEnabled, PeerReviewer, getExhibitionPeerReviewers } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { formatDateRange } from '@/lib/utils';
import {
  Plus,
  Layers,
  Box,
  Eye,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Palette,
  BookOpen,
  Users,
  GraduationCap,
  Award,
  ShieldCheck,
  Camera,
  UploadCloud,
  Loader2,
} from 'lucide-react';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';

interface AdminExhibitionsManagerClientProps {
  initialExhibitions: Exhibition[];
}

export function AdminExhibitionsManagerClient({
  initialExhibitions,
}: AdminExhibitionsManagerClientProps) {
  const { lang, t } = useLanguage();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>(initialExhibitions);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingExhibition, setEditingExhibition] = useState<Exhibition | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    curatorNote: '',
    bannerUrl: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    status: 'active' as 'active' | 'archived' | 'upcoming',
    roomSize: 'medium' as 'small' | 'medium' | 'large',
    enable3D: true,
    catalogFooterText: '',
    catalogPlateFooterText: '',
    peerReviewers: [] as PeerReviewer[],
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const refreshList = async () => {
    try {
      const res = await fetch('/api/admin/exhibitions');
      const data = await res.json();
      if (data.exhibitions) {
        setExhibitions(data.exhibitions);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    const autoSlug = `exhibition-${Date.now().toString(36)}`;
    setFormData({
      title: '',
      slug: autoSlug,
      curatorNote: '',
      bannerUrl: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      status: 'active',
      roomSize: 'medium',
      enable3D: true,
      catalogFooterText: 'International Art Festival and Art Exhibition in Thailand • ARTVARA Online Gallery',
      catalogPlateFooterText: 'ARTVARA Catalog',
      peerReviewers: [],
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exh: Exhibition) => {
    setEditingExhibition(exh);
    let rSize: 'small' | 'medium' | 'large' = 'medium';
    let e3D = true;
    let footerText = '';
    let plateFooter = '';
    let reviewers: PeerReviewer[] = [];
    if (exh.themeConfig) {
      try {
        const parsed = JSON.parse(exh.themeConfig);
        if (parsed.roomSize) rSize = parsed.roomSize;
        if (typeof parsed.enable3D === 'boolean') e3D = parsed.enable3D;
        if (parsed.catalogFooterText) footerText = parsed.catalogFooterText;
        if (parsed.catalogPlateFooterText) plateFooter = parsed.catalogPlateFooterText;
        if (Array.isArray(parsed.peerReviewers)) reviewers = parsed.peerReviewers;
      } catch {}
    }

    setFormData({
      title: exh.title,
      slug: exh.slug,
      curatorNote: exh.curatorNote || '',
      bannerUrl: exh.bannerUrl || '',
      startDate: exh.startDate ? exh.startDate.split('T')[0] : '',
      endDate: exh.endDate ? exh.endDate.split('T')[0] : '',
      status: exh.status as any,
      roomSize: rSize,
      enable3D: e3D,
      catalogFooterText: footerText,
      catalogPlateFooterText: plateFooter,
      peerReviewers: reviewers,
    });
  };

  const handleAddReviewer = () => {
    if (formData.peerReviewers.length >= 6) {
      alert('สามารถเพิ่มคณะกรรมการผู้ทรงคุณวุฒิได้สูงสุด 6 ท่าน');
      return;
    }
    setFormData({
      ...formData,
      peerReviewers: [
        ...formData.peerReviewers,
        {
          name: '',
          academicTitle: '',
          institution: '',
          currentPosition: '',
          country: 'Thailand',
          role: formData.peerReviewers.length === 0 ? 'ประธานกรรมการผู้ทรงคุณวุฒิ' : 'กรรมการผู้ทรงคุณวุฒิ',
        },
      ],
    });
  };

  const handleUpdateReviewer = (index: number, field: keyof PeerReviewer, value: string) => {
    const updated = [...formData.peerReviewers];
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, peerReviewers: updated });
  };

  const handleRemoveReviewer = (index: number) => {
    const updated = formData.peerReviewers.filter((_, i) => i !== index);
    setFormData({ ...formData, peerReviewers: updated });
  };

  // Toggle 3D Mode Directly
  const handleToggle3D = async (exh: Exhibition) => {
    const current3D = is3DEnabled(exh);
    const next3D = !current3D;
    try {
      const res = await fetch('/api/admin/exhibitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exh.id, enable3D: next3D }),
      });
      if (res.ok) {
        showNotification(
          'success',
          next3D
            ? lang === 'th'
              ? `เปิดแสดงโหมด 3D สำหรับ "${exh.title}" แล้ว`
              : `3D mode enabled for "${exh.title}"`
            : lang === 'th'
            ? `ปิดแสดงโหมด 3D สำหรับ "${exh.title}" แล้ว`
            : `3D mode disabled for "${exh.title}"`
        );
        await refreshList();
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error updating 3D mode');
    }
  };

  // Submit Create or Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingExhibition) {
        // Update
        const res = await fetch('/api/admin/exhibitions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingExhibition.id,
            ...formData,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.details || errData.error || 'Failed to update exhibition');
        }
        showNotification('success', lang === 'th' ? 'บันทึกการแก้ไขนิทรรศการสำเร็จ' : 'Exhibition updated successfully');
        setEditingExhibition(null);
      } else {
        // Create
        const res = await fetch('/api/admin/exhibitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.details || errData.error || 'Failed to create exhibition');
        }
        showNotification('success', lang === 'th' ? 'เพิ่มนิทรรศการใหม่เรียบร้อยแล้ว' : 'Exhibition created successfully');
        setIsCreateModalOpen(false);
      }

      await refreshList();
    } catch (err: any) {
      showNotification('error', err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Active / Archived Status
  const handleToggleStatus = async (exh: Exhibition) => {
    const newStatus = exh.status === 'active' ? 'archived' : 'active';
    await handleStatusChange(exh, newStatus);
  };

  // Change Status directly from Dropdown or Switch
  const handleStatusChange = async (exh: Exhibition, newStatus: 'active' | 'archived' | 'upcoming') => {
    try {
      const res = await fetch('/api/admin/exhibitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exh.id, status: newStatus }),
      });

      if (res.ok) {
        let msg = '';
        if (newStatus === 'active') {
          msg = lang === 'th'
            ? `🟢 เปิดแสดงนิทรรศการ "${exh.title}" แล้ว (ผู้ชมสามารถเข้าชมได้ปกติ)`
            : `Exhibition "${exh.title}" is now Active & visible to visitors`;
        } else if (newStatus === 'archived') {
          msg = lang === 'th'
            ? `🔒 ปิดและเก็บนิทรรศการ "${exh.title}" เข้าคลังแล้ว (ซ่อนจากผู้ชมทั่วไป)`
            : `Exhibition "${exh.title}" is now Closed & hidden in archives`;
        } else {
          msg = lang === 'th'
            ? `⏳ ตั้งสถานะนิทรรศการ "${exh.title}" เป็น "เร็วๆ นี้"`
            : `Exhibition "${exh.title}" set to Upcoming`;
        }
        showNotification('success', msg);
        await refreshList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Exhibition
  const handleDeleteExhibition = async (id: string) => {
    if (!confirm(lang === 'th' ? 'คุณแน่ใจหรือไม่ว่าต้องการลบนิทรรศการนี้?' : 'Are you sure you want to delete this exhibition?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/exhibitions?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showNotification('success', lang === 'th' ? 'ลบนิทรรศการสำเร็จ' : 'Exhibition deleted');
        await refreshList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD5C8] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
            {t.admin.title}
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1A1918] mt-1">
            {lang === 'th' ? 'จัดการนิทรรศการ (เพิ่ม / ลด / เปิด-ปิด)' : 'Exhibitions Management Studio'}
          </h1>
          <p className="text-xs text-[#6E685C] mt-1">
            {lang === 'th'
              ? 'สร้างนิทรรศการใหม่ สลับสถานะเปิดแสดง/ย้อนหลัง จัดการผลงานศิลปะ และสเกลห้อง 3D'
              : 'Create new exhibitions, toggle display status, curate artworks, and configure 3D room scales.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-[#C5A880]" />
            <span>{lang === 'th' ? 'เพิ่มนิทรรศการใหม่' : 'Create Exhibition'}</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-slide-up shadow ${
            feedback.type === 'success' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Exhibitions Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exhibitions.map((exh) => {
          const artworks = exh.artworks || [];
          const artists = exh.artists || [];
          const isActive = exh.status === 'active';

          let rSize = 'medium';
          if (exh.themeConfig) {
            try {
              const parsed = JSON.parse(exh.themeConfig);
              if (parsed.roomSize) rSize = parsed.roomSize;
            } catch {}
          }

          return (
            <div
              key={exh.id}
              className="bg-white rounded-2xl border border-[#DDD6C8] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Banner with status */}
                <div className="relative aspect-[16/10] bg-[#1A1918] overflow-hidden">
                  <Image
                    src={exh.bannerUrl || 'https://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1600&auto=format&fit=crop'}
                    alt={exh.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                    {/* Status Badge & Toggle */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <button
                        onClick={() => handleToggleStatus(exh)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold backdrop-blur-md shadow-md transition-all active:scale-95 ${
                          isActive
                            ? 'bg-emerald-900/95 text-emerald-100 border border-emerald-400/50 hover:bg-emerald-800'
                            : 'bg-neutral-900/95 text-neutral-300 border border-neutral-600 hover:bg-neutral-800'
                        }`}
                        title={lang === 'th' ? 'คลิกเพื่อสลับเปิดแสดง / ปิดเก็บเข้าคลัง' : 'Click to toggle open/closed exhibition status'}
                      >
                        <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-400'}`} />
                        <span>
                          {isActive
                            ? lang === 'th'
                              ? '🟢 เปิดแสดง (ผู้ชมเข้าชมได้)'
                              : '🟢 Active (Visible)'
                            : lang === 'th'
                            ? '🔒 ปิดการแสดง (ซ่อนเข้าคลัง)'
                            : '🔒 Archived (Hidden)'}
                        </span>
                      </button>

                    <button
                      type="button"
                      onClick={() => handleToggle3D(exh)}
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase transition-all flex items-center gap-1 shadow-sm ${
                        is3DEnabled(exh)
                          ? 'bg-amber-900/90 text-amber-200 border border-amber-500/40 hover:bg-amber-800'
                          : 'bg-neutral-800/90 text-neutral-400 border border-neutral-600 hover:text-white'
                      }`}
                      title={lang === 'th' ? 'คลิกเพื่อเปิด/ปิดการแสดงผล 3D' : 'Click to toggle 3D display mode'}
                    >
                      <Box className="w-2.5 h-2.5 text-[#C5A880]" />
                      <span>3D: {is3DEnabled(exh) ? (lang === 'th' ? 'เปิด (ON)' : 'ON') : (lang === 'th' ? 'ปิด (OFF)' : 'OFF')}</span>
                    </button>
                  </div>

                  {/* Banner bottom info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] text-white/90 font-mono">
                    <span>{artworks.length} {t.lobby.artworksCount}</span>
                    <span>{artists.length} {t.lobby.artistsCount}</span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-5 space-y-3">
                  <div className="text-[11px] text-[#8C8477] flex items-center gap-1.5 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-[#8C6D3F]" />
                    <span>{formatDateRange(exh.startDate, exh.endDate)}</span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#1A1918] leading-snug line-clamp-2">
                    {exh.title}
                  </h3>

                  <p className="text-xs text-[#6E685C] line-clamp-2 italic font-serif">
                    "{exh.curatorNote || 'Curated Exhibition Collection'}"
                  </p>

                  {/* Status & Visibility Quick Control Box */}
                  <div className="pt-2">
                    <div className="p-2.5 bg-[#FAF8F5] border border-[#E5DFD3] rounded-xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#5A554A]">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#8C6D3F]" />
                          <span>{lang === 'th' ? 'การแสดงผลต่อผู้ชม:' : 'Public Visibility:'}</span>
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-200 text-neutral-700'
                        }`}>
                          {isActive ? (lang === 'th' ? '🟢 เปิดให้เข้าชม' : '🟢 Visible') : (lang === 'th' ? '🔒 ซ่อนเข้าคลัง' : '🔒 Hidden')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* 1-Click Toggle Switch Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(exh)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs shrink-0 ${
                            isActive
                              ? 'bg-emerald-800 hover:bg-emerald-700 text-white'
                              : 'bg-neutral-700 hover:bg-neutral-800 text-white'
                          }`}
                          title={lang === 'th' ? 'คลิกเพื่อสลับ เปิด/ปิด นิทรรศการ' : 'Toggle Open/Closed'}
                        >
                          {isActive ? (
                            <>
                              <ToggleRight className="w-4 h-4 text-emerald-300 shrink-0" />
                              <span>{lang === 'th' ? 'เปิด (ON)' : 'ON'}</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-4 h-4 text-neutral-400 shrink-0" />
                              <span>{lang === 'th' ? 'ปิด (OFF)' : 'OFF'}</span>
                            </>
                          )}
                        </button>

                        {/* Dropdown Status Selector */}
                        <select
                          value={exh.status}
                          onChange={(e) => handleStatusChange(exh, e.target.value as any)}
                          className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-[#8C6D3F] shadow-xs cursor-pointer ${
                            exh.status === 'active'
                              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                              : exh.status === 'upcoming'
                              ? 'bg-blue-50 text-blue-900 border-blue-300'
                              : 'bg-neutral-100 text-neutral-800 border-neutral-300'
                          }`}
                        >
                          <option value="active">🟢 {lang === 'th' ? 'กำลังจัดแสดง' : 'Active (Current)'}</option>
                          <option value="archived">🏛️ {lang === 'th' ? 'นิทรรศการย้อนหลัง' : 'Archived (Past)'}</option>
                          <option value="upcoming">⏳ {lang === 'th' ? 'นิทรรศการเร็วๆ นี้' : 'Upcoming'}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="p-5 pt-0 space-y-2.5 border-t border-[#F0ECE4]">
                <div className="grid grid-cols-2 gap-2 pt-3">
                  {/* Curate Artworks button */}
                  <Link
                    href={`/admin/exhibitions/${exh.id}/artworks`}
                    className="flex items-center justify-center gap-1.5 py-2 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{lang === 'th' ? 'จัดการผลงาน' : 'Artworks'}</span>
                  </Link>

                  {/* 3D Studio Link */}
                  <Link
                    href={`/admin/3d-studio?exhibition=${exh.id}`}
                    className="flex items-center justify-center gap-1.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 border border-amber-500/40 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Box className="w-3.5 h-3.5 text-amber-700" />
                    <span>{lang === 'th' ? 'สตูดิโอ 3D' : '3D Studio'}</span>
                  </Link>
                </div>

                {/* Edit Exhibition & Peer Reviewers Button */}
                <button
                  onClick={() => handleOpenEdit(exh)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-[#FAF8F5] hover:bg-[#F2ECE0] text-[#1A1918] border border-[#DDD6C8] hover:border-[#8C6D3F] rounded-lg text-xs font-bold transition-all shadow-xs"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-[#8C6D3F]" />
                  <span>{lang === 'th' ? 'แก้ไขข้อมูล & คณะกรรมการผู้ทรงคุณวุฒิ' : 'Edit Info & Peer Reviewers'}</span>
                </button>

                <div className="flex items-center justify-between pt-1 border-t border-[#F4EFE6] text-xs">
                  <div className="flex items-center gap-3">
                    {/* Catalog link */}
                    <Link
                      href={`/catalog/${exh.slug}`}
                      target="_blank"
                      className="text-[11px] font-semibold text-[#8C6D3F] hover:underline flex items-center gap-1"
                    >
                      <BookOpen className="w-3 h-3" />
                      <span>{lang === 'th' ? 'สูจิบัตร PDF' : 'Catalog'}</span>
                    </Link>

                    {/* Public link */}
                    <Link
                      href={`/exhibitions/${exh.slug}`}
                      target="_blank"
                      className="text-[11px] font-semibold text-[#6E685C] hover:text-[#1A1918] hover:underline flex items-center gap-1"
                    >
                      <span>{lang === 'th' ? 'ชมหน้าเว็บ' : 'View Live'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteExhibition(exh.id)}
                    className="p-1 text-[#A8A295] hover:text-rose-600 rounded transition-colors"
                    title="Delete Exhibition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Exhibition Modal */}
      {(isCreateModalOpen || editingExhibition) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingExhibition(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E3DED4] pb-4 mb-6">
              <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
                {editingExhibition ? (lang === 'th' ? 'แก้ไขข้อมูลนิทรรศการ' : 'Edit Exhibition') : (lang === 'th' ? 'สร้างนิทรรศการใหม่' : 'Create New Exhibition')}
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1A1918] mt-1">
                {editingExhibition ? editingExhibition.title : (lang === 'th' ? 'กรอกรายละเอียดนิทรรศการ' : 'Exhibition Details')}
              </h2>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {lang === 'th' ? 'ชื่องานนิทรรศการ' : 'Exhibition Title'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const clean = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                    setFormData((prev) => ({
                      ...prev,
                      title,
                      slug: !editingExhibition ? (clean || prev.slug || `exhibition-${Date.now().toString(36)}`) : prev.slug,
                    }));
                  }}
                  placeholder={lang === 'th' ? 'เช่น สยามศิลป์ร่วมสมัย ครั้งที่ 2' : 'e.g. Siam Contemporary Art Festival'}
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-sm font-serif font-bold text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                />
              </div>

              {!editingExhibition && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    URL Slug <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g. siam-contemporary-art-festival"
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg font-mono text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'วันที่เริ่มจัดแสดง' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'วันที่สิ้นสุด' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'สถานะการจัดแสดง' : 'Status'}
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value="active">🟢 {lang === 'th' ? 'กำลังจัดแสดง (Active - เปิดให้ผู้ชมเข้าชม)' : 'Active (On Display)'}</option>
                    <option value="archived">🏛️ {lang === 'th' ? 'นิทรรศการย้อนหลัง (Archived - เก็บเข้าคลัง/ซ่อนจากผู้ชม)' : 'Archived (Stored in Gallery)'}</option>
                    <option value="upcoming">⏳ {lang === 'th' ? 'นิทรรศการเร็วๆ นี้ (Upcoming)' : 'Upcoming'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'ขนาดห้อง 3D เริ่มต้น' : 'Default 3D Room Scale'}
                  </label>
                  <select
                    value={formData.roomSize}
                    onChange={(e) => setFormData({ ...formData, roomSize: e.target.value as any })}
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="small">🟢 เล็ก (Small 10m × 10m)</option>
                    <option value="medium">🟡 กลาง (Medium 14m × 14m)</option>
                    <option value="large">🟣 ใหญ่ (Large 22m × 22m)</option>
                  </select>
                </div>
              </div>

              {/* 3D Mode Toggle Switch */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#DDD6C8] flex items-center justify-between shadow-sm">
                <div>
                  <span className="font-bold text-xs text-[#1A1918] block flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5 text-[#8C6D3F]" />
                    {lang === 'th' ? 'โหมดเข้าชมแบบ 3D Virtual Walk' : '3D Virtual Walk Mode'}
                  </span>
                  <span className="text-[11px] text-[#7A7468] block mt-0.5">
                    {formData.enable3D
                      ? lang === 'th'
                        ? '🟢 เปิดให้ผู้ชมเดินชมห้อง 3D เสมือนจริง'
                        : '🟢 3D Virtual Walk is enabled for visitors'
                      : lang === 'th'
                      ? '🔴 ปิดการแสดง 3D (ผู้ชมจะเข้าชมในโหมด 2D & Carousel เท่านั้น)'
                      : '🔴 3D mode is disabled for visitors'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, enable3D: !formData.enable3D })}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    formData.enable3D ? 'bg-[#8C6D3F]' : 'bg-neutral-300'
                  }`}
                  title="Toggle 3D"
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      formData.enable3D ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div>
                <ImageUploadDropzone
                  label={lang === 'th' ? 'ภาพแบนเนอร์ปกนิทรรศการ (Exhibition Banner Cover)' : 'Exhibition Banner Cover'}
                  value={formData.bannerUrl}
                  onChange={(url) => setFormData({ ...formData, bannerUrl: url })}
                  titleHint={formData.slug || 'exhibition-banner'}
                  folder="/artvara-exhibitions"
                  shape="rounded"
                  helperText={
                    lang === 'th'
                      ? 'ลากภาพปกนิทรรศการมาวาง หรือคลิกเพื่ออัปโหลดไปยัง ImageKit CDN'
                      : 'Drag & drop exhibition cover banner or click to upload to ImageKit CDN'
                  }
                />
              </div>

              {/* Catalog Footer Text Settings */}
              <div className="p-4 rounded-xl bg-[#F4EFE6] border border-[#DDD6C8] space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1A1918]">
                  <BookOpen className="w-3.5 h-3.5 text-[#8C6D3F]" />
                  <span>{lang === 'th' ? 'ข้อความ Footer ในสูจิบัตร / E-Catalog' : 'Catalog Footer Text Settings'}</span>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5A554A] mb-1">
                    {lang === 'th' ? 'ข้อความ Footer ท้ายหน้าปกสูจิบัตร (Cover Page Footer)' : 'Cover Page Footer Text'}
                  </label>
                  <input
                    type="text"
                    value={formData.catalogFooterText}
                    onChange={(e) => setFormData({ ...formData, catalogFooterText: e.target.value })}
                    placeholder="International Art Festival and Art Exhibition in Thailand • ARTVARA Online Gallery"
                    className="w-full px-3 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs text-[#1A1918] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#5A554A] mb-1">
                    {lang === 'th' ? 'ข้อความ Footer ท้ายหน้ารูปผลงาน (Artwork Page Footer - ไม่บังคับ)' : 'Artwork Page Footer Text (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={formData.catalogPlateFooterText}
                    onChange={(e) => setFormData({ ...formData, catalogPlateFooterText: e.target.value })}
                    placeholder={lang === 'th' ? 'เช่น 18th Poh-Chang Art Festival 2026 หรือเว้นว่างไว้' : 'e.g. 18th Poh-Chang Art Festival 2026'}
                    className="w-full px-3 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs text-[#1A1918] focus:outline-none"
                  />
                </div>
              </div>

              {/* Peer Reviewers (คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน 3 - 5 ท่าน) */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#DDD6C8] space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[#8C6D3F]/10 rounded-md text-[#8C6D3F]">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#1A1918] block">
                        {lang === 'th'
                          ? 'คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Reviewers)'
                          : 'Peer Review Committee (3 - 5 Reviewers)'}
                      </span>
                      <span className="text-[10px] text-[#7A7468]">
                        {lang === 'th'
                          ? 'ใส่รายชื่อผู้ทรงคุณวุฒิ 3 - 5 ท่าน เพื่อแสดงในหน้านิทรรศการและเล่มสูจิบัตร'
                          : 'Add 3 - 5 peer reviewers for exhibition page & catalog accreditation'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddReviewer}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#FAF6EE] text-[#8C6D3F] border border-[#D5CEC0] rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{lang === 'th' ? 'เพิ่มผู้ทรงคุณวุฒิ' : 'Add Reviewer'}</span>
                  </button>
                </div>

                {formData.peerReviewers.length === 0 ? (
                  <div className="py-4 text-center text-xs text-[#8C8477] border border-dashed border-[#D5CEC0] rounded-lg bg-white/50">
                    {lang === 'th'
                      ? 'ยังไม่มีรายชื่อผู้ทรงคุณวุฒิ (เว้นว่างไว้ได้ หากไม่มีการประเมิน)'
                      : 'No peer reviewers added (Optional).'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.peerReviewers.map((reviewer, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white border border-[#DDD6C8] rounded-xl space-y-2.5 shadow-sm relative group"
                      >
                        <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-2">
                          <span className="text-[11px] font-bold text-[#8C6D3F] flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" />
                            {reviewer.role || `ผู้ทรงคุณวุฒิท่านที่ ${idx + 1}`}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveReviewer(idx)}
                            className="p-1 text-[#A8A295] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            title="ลบรายชื่อ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start gap-3.5">
                          {/* Avatar Upload / Preview */}
                          <div className="shrink-0 flex flex-col items-center">
                            <label className="block text-[10px] font-semibold text-[#5A554A] mb-1">
                              {lang === 'th' ? 'รูปถ่าย' : 'Photo'}
                            </label>
                            {reviewer.avatarUrl ? (
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D5CEC0] shadow-sm group/photo bg-[#1A1918]">
                                <img
                                  src={reviewer.avatarUrl}
                                  alt={reviewer.name || 'Reviewer'}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleUpdateReviewer(idx, 'avatarUrl', '')}
                                  className="absolute inset-0 bg-black/70 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity text-[10px] font-bold"
                                  title="ลบรูปภาพ"
                                >
                                  ลบรูป
                                </button>
                              </div>
                            ) : (
                              <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#D5CEC0] hover:border-[#8C6D3F] bg-[#FAF8F5] hover:bg-[#FAF6EE] flex flex-col items-center justify-center cursor-pointer transition-all text-[#8C8477] hover:text-[#8C6D3F] shadow-xs">
                                <Camera className="w-5 h-5" />
                                <span className="text-[9px] mt-0.5 font-semibold">อัปโหลด</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={async (e) => {
                                    if (e.target.files && e.target.files[0]) {
                                      const file = e.target.files[0];
                                      const fd = new FormData();
                                      fd.append('file', file);
                                      fd.append('folder', '/artvara-reviewers');
                                      fd.append('fileName', reviewer.name || `reviewer-${idx}`);
                                      try {
                                        const res = await fetch('/api/admin/upload', {
                                          method: 'POST',
                                          body: fd,
                                        });
                                        const data = await res.json();
                                        if (data.url) {
                                          handleUpdateReviewer(idx, 'avatarUrl', data.url);
                                        }
                                      } catch (err) {
                                        console.error(err);
                                        alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
                                      }
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>

                          {/* Reviewer Details */}
                          <div className="flex-1 w-full space-y-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-[#5A554A] mb-0.5">
                                  {lang === 'th' ? 'คำนำหน้า / ตำแหน่งวิชาการ' : 'Title (Prof. / Dr.)'}
                                </label>
                                <input
                                  type="text"
                                  value={reviewer.academicTitle || ''}
                                  onChange={(e) => handleUpdateReviewer(idx, 'academicTitle', e.target.value)}
                                  placeholder="เช่น ศ.เกียรติคุณ / รศ.ดร. / ผศ."
                                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded-lg text-xs text-[#1A1918] focus:outline-none"
                                />
                              </div>

                              <div className="sm:col-span-2">
                                <label className="block text-[10px] font-semibold text-[#5A554A] mb-0.5">
                                  {lang === 'th' ? 'ชื่อ - นามสกุล' : 'Full Name'} <span className="text-rose-600">*</span>
                                </label>
                                <input
                                  type="text"
                                  required
                                  value={reviewer.name}
                                  onChange={(e) => handleUpdateReviewer(idx, 'name', e.target.value)}
                                  placeholder="เช่น ปรีชา เถาทอง หรือ Prof. John Doe"
                                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded-lg text-xs font-semibold text-[#1A1918] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-[#5A554A] mb-0.5">
                                  {lang === 'th' ? 'สังกัด / สถาบัน / มหาวิทยาลัย' : 'Institution / University'}
                                </label>
                                <input
                                  type="text"
                                  value={reviewer.institution || ''}
                                  onChange={(e) => handleUpdateReviewer(idx, 'institution', e.target.value)}
                                  placeholder="เช่น มหาวิทยาลัยศิลปากร / Poh-Chang"
                                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded-lg text-xs text-[#1A1918] focus:outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-[#5A554A] mb-0.5">
                                  {lang === 'th' ? 'บทบาท / ตำแหน่งในคณะกรรมการ' : 'Role in Committee'}
                                </label>
                                <input
                                  type="text"
                                  value={reviewer.role || ''}
                                  onChange={(e) => handleUpdateReviewer(idx, 'role', e.target.value)}
                                  placeholder="เช่น ประธานกรรมการผู้ทรงคุณวุฒิ"
                                  className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded-lg text-xs text-[#1A1918] focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Current Position / Work */}
                            <div>
                              <label className="block text-[10px] font-semibold text-[#5A554A] mb-0.5 flex items-center gap-1">
                                <span className="text-[#8C6D3F]">📌</span>
                                {lang === 'th' ? 'การทำงาน / ตำแหน่งงานในปัจจุบัน' : 'Current Position / Work'}
                              </label>
                              <input
                                type="text"
                                value={reviewer.currentPosition || ''}
                                onChange={(e) => handleUpdateReviewer(idx, 'currentPosition', e.target.value)}
                                placeholder={lang === 'th' ? 'เช่น อาจารย์ประจำคณะจิตรกรรมฯ / ผู้อำนวยการหอศิลป์' : 'e.g. Associate Professor, Faculty of Painting / Gallery Director'}
                                className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded-lg text-xs text-[#1A1918] focus:outline-none focus:ring-1 focus:ring-[#8C6D3F]"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {lang === 'th' ? 'บทความคำนำภัณฑารักษ์ (Curator Statement)' : 'Curator Statement'}
                </label>
                <textarea
                  rows={4}
                  value={formData.curatorNote}
                  onChange={(e) => setFormData({ ...formData, curatorNote: e.target.value })}
                  placeholder={lang === 'th' ? 'เขียนคำนำและแนวความคิดของนิทรรศการนี้...' : 'Write curatorial foreword...'}
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-serif leading-relaxed focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingExhibition(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-[#6E685C] hover:text-[#1A1918]"
                >
                  {t.inquiryModal.cancel}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all disabled:opacity-50"
                >
                  {loading ? (lang === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (lang === 'th' ? 'บันทึกนิทรรศการ' : 'Save Exhibition')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
