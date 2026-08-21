'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Exhibition } from '@/types/exhibition';
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
    setFormData({
      title: '',
      slug: '',
      curatorNote: '',
      bannerUrl: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      status: 'active',
      roomSize: 'medium',
    });
    setIsCreateModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (exh: Exhibition) => {
    setEditingExhibition(exh);
    let rSize: 'small' | 'medium' | 'large' = 'medium';
    if (exh.themeConfig) {
      try {
        const parsed = JSON.parse(exh.themeConfig);
        if (parsed.roomSize) rSize = parsed.roomSize;
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
    });
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

        if (!res.ok) throw new Error('Failed to update');
        showNotification('success', lang === 'th' ? 'บันทึกการแก้ไขนิทรรศการสำเร็จ' : 'Exhibition updated successfully');
        setEditingExhibition(null);
      } else {
        // Create
        const res = await fetch('/api/admin/exhibitions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!res.ok) throw new Error('Failed to create');
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
    try {
      const res = await fetch('/api/admin/exhibitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: exh.id, status: newStatus }),
      });

      if (res.ok) {
        showNotification(
          'success',
          newStatus === 'active'
            ? lang === 'th'
              ? `เปิดแสดงนิทรรศการ "${exh.title}" แล้ว`
              : `Exhibition activated`
            : lang === 'th'
            ? `ปิดและย้ายนิทรรศการไปยังหมวดย้อนหลังแล้ว`
            : `Exhibition archived`
        );
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
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold backdrop-blur shadow transition-all ${
                        isActive
                          ? 'bg-emerald-800/90 text-emerald-100 hover:bg-emerald-700'
                          : 'bg-neutral-800/90 text-neutral-300 hover:bg-neutral-700'
                      }`}
                      title={lang === 'th' ? 'คลิกเพื่อสลับเปิด/ปิดสถานะ' : 'Click to toggle active/archived status'}
                    >
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-400'}`} />
                      <span>{isActive ? (lang === 'th' ? 'กำลังจัดแสดง (ON)' : 'Active (ON)') : (lang === 'th' ? 'นิทรรศการย้อนหลัง (OFF)' : 'Archived (OFF)')}</span>
                    </button>

                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-black/70 text-[#C5A880] uppercase">
                      3D: {rSize}
                    </span>
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
                </div>
              </div>

              {/* Action Buttons Toolbar */}
              <div className="p-5 pt-0 space-y-2 border-t border-[#F0ECE4]">
                <div className="grid grid-cols-2 gap-2 pt-3">
                  {/* Curate Artworks button */}
                  <Link
                    href={`/admin/exhibitions/${exh.id}/artworks`}
                    className="flex items-center justify-center gap-1.5 py-2 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>{lang === 'th' ? 'จัดการผลงาน' : 'Artworks'}</span>
                  </Link>

                  {/* 3D Wall Builder */}
                  <Link
                    href={`/admin/exhibitions/${exh.id}`}
                    className="flex items-center justify-center gap-1.5 py-2 bg-[#C5A880] hover:bg-[#D4BC96] text-[#1A1918] rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>{lang === 'th' ? 'ผัง 3D' : '3D Walls'}</span>
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    {/* Edit button */}
                    <button
                      onClick={() => handleOpenEdit(exh)}
                      className="p-1.5 text-[#6E685C] hover:text-[#1A1918] hover:bg-[#FAF8F5] rounded transition-colors"
                      title="Edit Exhibition Info"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteExhibition(exh.id)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded transition-colors"
                      title="Delete Exhibition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Public link */}
                  <Link
                    href={`/exhibitions/${exh.slug}`}
                    target="_blank"
                    className="text-[11px] font-semibold text-[#8C6D3F] hover:underline flex items-center gap-1"
                  >
                    <span>{lang === 'th' ? 'ชมหน้าเว็บ' : 'View Live'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
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
                    setFormData((prev) => ({
                      ...prev,
                      title,
                      slug: !editingExhibition ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-') : prev.slug,
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
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="active">🟢 {lang === 'th' ? 'กำลังจัดแสดง (Active)' : 'Active (On Display)'}</option>
                    <option value="archived">⚪ {lang === 'th' ? 'นิทรรศการย้อนหลัง (Archived)' : 'Archived'}</option>
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
