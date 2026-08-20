'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Exhibition } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import {
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Instagram,
  Globe,
  Mail,
  Award,
  Layers,
  Search,
  Sparkles,
  Phone,
} from 'lucide-react';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';

interface CuratorWithStats extends User {
  exhibitionCount: number;
  curatedExhibitions: Array<{ id: string; title: string; slug: string; status: string; bannerUrl?: string | null }>;
}

interface AdminCuratorsManagerClientProps {
  initialCurators: CuratorWithStats[];
}

export function AdminCuratorsManagerClient({ initialCurators }: AdminCuratorsManagerClientProps) {
  const { lang, t } = useLanguage();
  const [curators, setCurators] = useState<CuratorWithStats[]>(initialCurators);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCurator, setEditingCurator] = useState<CuratorWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    country: 'Thailand',
    flagEmoji: '🇹🇭',
    avatarUrl: '',
    bio: '',
    instagram: '',
    website: '',
  });

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const refreshList = async () => {
    try {
      const res = await fetch('/api/admin/curators');
      const data = await res.json();
      if (data.curators) {
        setCurators(data.curators);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      email: '',
      country: 'Thailand',
      flagEmoji: '🇹🇭',
      avatarUrl: '',
      bio: '',
      instagram: '',
      website: '',
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (curator: CuratorWithStats) => {
    setEditingCurator(curator);
    let social: any = {};
    if (curator.socialLinks) {
      try {
        social = JSON.parse(curator.socialLinks);
      } catch {}
    }

    setFormData({
      name: curator.name,
      email: curator.email,
      country: curator.country || 'Thailand',
      flagEmoji: curator.flagEmoji || '🇹🇭',
      avatarUrl: curator.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
      bio: curator.bio || '',
      instagram: social.instagram || '',
      website: social.website || '',
    });
  };

  const handleCountryChange = (countryName: string) => {
    let flag = '🇹🇭';
    const cLower = countryName.toLowerCase();
    if (cLower.includes('thai')) flag = '🇹🇭';
    else if (cLower.includes('japan')) flag = '🇯🇵';
    else if (cLower.includes('ital')) flag = '🇮🇹';
    else if (cLower.includes('france')) flag = '🇫🇷';
    else if (cLower.includes('austr')) flag = '🇦🇺';
    else if (cLower.includes('us') || cLower.includes('america')) flag = '🇺🇸';
    else if (cLower.includes('uk') || cLower.includes('brit')) flag = '🇬🇧';
    else flag = '🌐';

    setFormData((prev) => ({
      ...prev,
      country: countryName,
      flagEmoji: flag,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      showNotification('error', lang === 'th' ? 'กรุณากรอกชื่อและอีเมลภัณฑารักษ์' : 'Name and Email are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        country: formData.country.trim(),
        flagEmoji: formData.flagEmoji,
        avatarUrl: formData.avatarUrl.trim(),
        bio: formData.bio.trim(),
        socialLinks: {
          instagram: formData.instagram.trim(),
          website: formData.website.trim(),
        },
      };

      if (editingCurator) {
        const res = await fetch('/api/admin/curators', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingCurator.id, ...payload }),
        });
        if (!res.ok) throw new Error('Failed to update curator');
        showNotification('success', lang === 'th' ? 'อัปเดตข้อมูลภัณฑารักษ์สำเร็จ' : 'Curator updated successfully');
        setEditingCurator(null);
      } else {
        const res = await fetch('/api/admin/curators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to create curator');
        showNotification('success', lang === 'th' ? 'เพิ่มภัณฑารักษ์ใหม่สำเร็จ' : 'New curator created successfully');
        setIsCreateModalOpen(false);
      }

      await refreshList();
    } catch (err: any) {
      showNotification('error', err.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (curator: CuratorWithStats) => {
    const confirmMsg =
      lang === 'th'
        ? `คุณแน่ใจหรือไม่ว่าต้องการลบภัณฑารักษ์ "${curator.name}"?`
        : `Are you sure you want to delete curator "${curator.name}"?`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/curators?id=${curator.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete curator');
      showNotification('success', lang === 'th' ? 'ลบภัณฑารักษ์เรียบร้อยแล้ว' : 'Curator deleted');
      await refreshList();
    } catch (err: any) {
      showNotification('error', err.message || 'Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const filteredCurators = curators.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.country || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.bio || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-xl shadow-2xl text-xs font-semibold text-white animate-slide-up border ${
            feedback.type === 'success'
              ? 'bg-emerald-900/95 border-emerald-500/50 text-emerald-100'
              : 'bg-red-900/95 border-red-500/50 text-red-100'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD5C8] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
              {lang === 'th' ? 'ระบบจัดการหลังบ้าน' : 'Admin Control'}
            </span>
            <span className="text-neutral-400">•</span>
            <span className="text-xs text-[#8C8477] font-semibold">
              {curators.length} {lang === 'th' ? 'ท่าน' : 'Curators'}
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1A1918] mt-1 flex items-center gap-3">
            <Award className="w-8 h-8 text-[#C5A880]" />
            <span>{lang === 'th' ? 'จัดการภัณฑารักษ์' : 'Curators Management'}</span>
          </h1>
          <p className="text-xs text-[#6E685C] mt-1">
            {lang === 'th'
              ? 'จัดการรายชื่อ ข้อมูลประวัติ ช่องทางติดต่อหลัก (Email) และนิทรรศการที่ดูแลโดยภัณฑารักษ์'
              : 'Manage curator profiles, primary email contacts, curatorial statements, and associated exhibitions.'}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#C5A880] hover:bg-[#D4BC96] text-[#1A1918] rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm hover:scale-105 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'th' ? 'เพิ่มภัณฑารักษ์ใหม่' : 'Add New Curator'}</span>
        </button>
      </div>

      {/* Stats Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-[#E0D9CD] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8C8477] font-semibold uppercase">
            <span>{lang === 'th' ? 'ภัณฑารักษ์ทั้งหมด' : 'Total Curators'}</span>
            <Award className="w-4 h-4 text-[#8C6D3F]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#1A1918] mt-2">{curators.length}</p>
          <p className="text-[11px] text-emerald-700 mt-1 font-medium">
            {lang === 'th' ? 'พร้อมดูแลนิทรรศการ' : 'Active Curatorial Team'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E0D9CD] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8C8477] font-semibold uppercase">
            <span>{lang === 'th' ? 'ช่องทางติดต่อหลัก' : 'Primary Contact'}</span>
            <Mail className="w-4 h-4 text-[#8C6D3F]" />
          </div>
          <p className="font-serif text-2xl font-bold text-[#1A1918] mt-2">Email</p>
          <p className="text-[11px] text-[#7A7468] mt-1 font-medium">
            {lang === 'th' ? 'รับข้อความสอบถามโดยตรง' : 'Curatorial Inquiries Channel'}
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#E0D9CD] shadow-sm">
          <div className="flex items-center justify-between text-xs text-[#8C8477] font-semibold uppercase">
            <span>{lang === 'th' ? 'สัญชาติ / นานาชาติ' : 'Nationalities'}</span>
            <Globe className="w-4 h-4 text-[#8C6D3F]" />
          </div>
          <p className="font-serif text-3xl font-bold text-[#1A1918] mt-2">
            {new Set(curators.map((c) => c.country || 'Thailand')).size}
          </p>
          <p className="text-[11px] text-[#7A7468] mt-1 font-medium">
            {lang === 'th' ? 'ภูมิภาคและนานาชาติ' : 'International & Regional'}
          </p>
        </div>
      </div>

      {/* Search Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E0D9CD] shadow-sm flex items-center gap-3">
        <Search className="w-4 h-4 text-[#8C6D3F] shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            lang === 'th'
              ? 'ค้นหาภัณฑารักษ์ตามชื่อ, สัญชาติ, อีเมล หรือคำอธิบาย...'
              : 'Search curator by name, country, email, or bio...'
          }
          className="w-full text-xs bg-transparent focus:outline-none placeholder-[#A0988A] text-[#1A1918]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-neutral-400 hover:text-[#1A1918] text-xs font-semibold px-2 py-1"
          >
            ✕
          </button>
        )}
      </div>

      {/* Curators List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredCurators.map((curator) => {
          let social: any = {};
          if (curator.socialLinks) {
            try {
              social = JSON.parse(curator.socialLinks);
            } catch {}
          }

          return (
            <div
              key={curator.id}
              className="bg-white rounded-2xl border border-[#E0D9CD] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Header: Photo + Info */}
                <div className="flex items-start gap-4">
                  <div className="relative w-20 h-20 shrink-0 rounded-2xl overflow-hidden border-2 border-[#C5A880] shadow-md">
                    <Image
                      src={
                        curator.avatarUrl ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop'
                      }
                      alt={curator.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <CountryFlag country={curator.country} size="xs" />
                      <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C6D3F]">
                        {curator.country || 'Thailand'}
                      </span>
                      <span className="text-[10px] bg-[#FAF8F5] text-[#8C6D3F] border border-[#E8E2D6] font-semibold px-2 py-0.5 rounded-full ml-auto">
                        {lang === 'th' ? 'ภัณฑารักษ์' : 'Curator'}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-[#1A1918] group-hover:text-[#8C6D3F] transition-colors truncate">
                      {curator.name}
                    </h3>

                    {/* Primary Contact: Email */}
                    <div className="flex items-center gap-1.5 text-xs text-[#6E685C]">
                      <Mail className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
                      <a
                        href={`mailto:${curator.email}`}
                        className="hover:text-[#8C6D3F] hover:underline truncate font-mono"
                        title={curator.email}
                      >
                        {curator.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Curatorial Statement / Bio */}
                {curator.bio && (
                  <p className="text-xs text-[#5A554A] line-clamp-3 mt-3 pt-3 border-t border-[#F0ECE4] leading-relaxed">
                    {curator.bio}
                  </p>
                )}

                {/* Social Links & Web */}
                {(social.website || social.instagram) && (
                  <div className="flex items-center gap-3 text-xs text-[#8C6D3F] font-semibold pt-2">
                    {social.website && (
                      <a
                        href={social.website.startsWith('http') ? social.website : `https://${social.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Website</span>
                      </a>
                    )}
                    {social.instagram && (
                      <a
                        href={`https://instagram.com/${social.instagram.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 hover:underline"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        <span>@{social.instagram.replace('@', '')}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#F0ECE4] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#8C8477] font-medium">
                  ID: <span className="font-mono text-[#1A1918]">{curator.id}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(curator)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F0ECE4] text-[#1A1918] text-xs font-semibold border border-[#DDD6C8] transition-all hover:scale-105 active:scale-95"
                    title="Edit Curator"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#8C6D3F]" />
                    <span>{lang === 'th' ? 'แก้ไข' : 'Edit'}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(curator)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-all hover:scale-105 active:scale-95"
                    title="Delete Curator"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{lang === 'th' ? 'ลบ' : 'Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCurators.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#E0D9CD] p-12 text-center space-y-3">
          <Award className="w-12 h-12 text-[#C5A880] mx-auto opacity-50" />
          <h3 className="font-serif text-lg font-bold text-[#1A1918]">
            {lang === 'th' ? 'ไม่พบข้อมูลภัณฑารักษ์' : 'No Curators Found'}
          </h3>
          <p className="text-xs text-[#8C8477]">
            {searchQuery
              ? lang === 'th'
                ? 'ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง'
                : 'Try adjusting your search criteria.'
              : lang === 'th'
              ? 'เริ่มต้นด้วยการเพิ่มภัณฑารักษ์คนแรกของหอศิลป์'
              : 'Get started by creating your first curator.'}
          </p>
        </div>
      )}

      {/* Create / Edit Modal */}
      {(isCreateModalOpen || editingCurator) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#D5CEC0] max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-slide-up space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E8E2D6] pb-4">
              <div className="flex items-center gap-2.5">
                <Award className="w-6 h-6 text-[#C5A880]" />
                <h2 className="font-serif text-2xl font-bold text-[#1A1918]">
                  {editingCurator
                    ? lang === 'th'
                      ? 'แก้ไขข้อมูลภัณฑารักษ์'
                      : 'Edit Curator'
                    : lang === 'th'
                    ? 'เพิ่มภัณฑารักษ์ใหม่'
                    : 'Add New Curator'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setEditingCurator(null);
                }}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Name & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1A1918] font-bold mb-1">
                    {lang === 'th' ? 'ชื่อ-นามสกุลภัณฑารักษ์ *' : 'Curator Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Dr. Apinan Poshyananda"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD6C8] focus:border-[#C5A880] focus:outline-none bg-[#FAF8F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1918] font-bold mb-1">
                    {lang === 'th' ? 'สัญชาติ / ประเทศ' : 'Country / Nationality'}
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl flex items-center justify-center shrink-0">
                      <CountryFlag country={formData.country} size="xs" />
                    </div>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      placeholder="e.g. Thailand, Japan, France"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD6C8] focus:border-[#C5A880] focus:outline-none bg-[#FAF8F5]"
                    />
                  </div>
                </div>
              </div>

              {/* Email (Primary Contact Channel) */}
              <div>
                <label className="block text-[#1A1918] font-bold mb-1">
                  {lang === 'th' ? 'ช่องทางติดต่อหลัก (อีเมล / Email) *' : 'Primary Contact (Email) *'}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#8C6D3F] absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. curator@artvara.gallery"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#DDD6C8] focus:border-[#C5A880] focus:outline-none bg-[#FAF8F5] font-mono text-xs"
                  />
                </div>
                <p className="text-[10px] text-[#8C8477] mt-1">
                  {lang === 'th'
                    ? 'อีเมลนี้จะใช้เป็นช่องทางติดต่อหลักสำหรับข้อความสอบถามจากผู้ชมและนักสะสม'
                    : 'This email serves as the primary inbox for inquiries and curatorial contact.'}
                </p>
              </div>

              {/* Avatar Photo Upload / Dropzone */}
              <div>
                <ImageUploadDropzone
                  label={lang === 'th' ? 'รูปภาพโปรไฟล์ภัณฑารักษ์ (Avatar Image)' : 'Curator Profile Photo'}
                  value={formData.avatarUrl}
                  onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
                  titleHint={formData.name || 'curator-avatar'}
                  folder="/artvara-curators"
                  shape="circle"
                  helperText={
                    lang === 'th'
                      ? 'ลากรูปภาพมาวาง หรือคลิกเพื่ออัปโหลดไปยัง ImageKit CDN'
                      : 'Drag & drop curator photo or click to upload to ImageKit CDN'
                  }
                />
              </div>

              {/* Curatorial Bio / Statement */}
              <div>
                <label className="block text-[#1A1918] font-bold mb-1">
                  {lang === 'th' ? 'ประวัติและวิสัยทัศน์ภัณฑารักษ์ (Curatorial Statement / Bio)' : 'Curatorial Statement / Bio'}
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="e.g. Senior curator specializing in Southeast Asian contemporary and classical Siamese art..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD6C8] focus:border-[#C5A880] focus:outline-none bg-[#FAF8F5]"
                />
              </div>

              {/* Social Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#1A1918] font-bold mb-1">
                    {lang === 'th' ? 'เว็บไซต์ / Portfolio' : 'Website / Portfolio'}
                  </label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="e.g. www.curator-portfolio.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD6C8] focus:border-[#C5A880] focus:outline-none bg-[#FAF8F5]"
                  />
                </div>

                <div>
                  <label className="block text-[#1A1918] font-bold mb-1">Instagram</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="e.g. @curator_art"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDD6C8] focus:border-[#C5A880] focus:outline-none bg-[#FAF8F5]"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-[#E8E2D6] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingCurator(null);
                  }}
                  className="px-5 py-2.5 rounded-xl border border-[#DDD6C8] bg-white hover:bg-neutral-50 text-[#1A1918] font-semibold transition-all"
                >
                  {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#C5A880] hover:bg-[#D4BC96] text-[#1A1918] font-bold uppercase tracking-wider shadow transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {loading
                    ? lang === 'th'
                      ? 'กำลังบันทึก...'
                      : 'Saving...'
                    : lang === 'th'
                    ? 'บันทึกข้อมูล'
                    : 'Save Curator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
