'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { User, Artwork } from '@/types/exhibition';
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
  Palette,
  Layers,
  ArrowRight,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Sparkles,
} from 'lucide-react';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';

interface ArtistWithStats extends User {
  artworkCount: number;
  exhibitionCount: number;
  exhibitions: Array<{ id: string; title: string; slug: string; status: string }>;
  previewArtworks: Artwork[];
}

interface AdminArtistsManagerClientProps {
  initialArtists: ArtistWithStats[];
}

export function AdminArtistsManagerClient({ initialArtists }: AdminArtistsManagerClientProps) {
  const { lang, t } = useLanguage();
  const [artists, setArtists] = useState<ArtistWithStats[]>(initialArtists);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<ArtistWithStats | null>(null);
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

  const [smartPasteText, setSmartPasteText] = useState('');
  const [smartDetected, setSmartDetected] = useState(false);

  const applyParsedArtistData = (text: string) => {
    if (!text || !text.trim()) return false;
    const raw = text.trim();

    let parts: string[] = [];
    if (raw.includes('\t')) {
      parts = raw.split('\t').map((s) => s.trim()).filter(Boolean);
    } else if (raw.includes('|')) {
      parts = raw.split('|').map((s) => s.trim()).filter(Boolean);
    } else if (raw.includes(',')) {
      parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    } else {
      const emailMatch = raw.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        const email = emailMatch[1];
        const withoutEmail = raw.replace(email, '').trim();
        const rest = withoutEmail.split(/\s{2,}|\s-\s|\//).map((s) => s.trim()).filter(Boolean);
        if (rest.length >= 2) {
          parts = [rest[0], rest[1], email];
        } else if (rest.length === 1) {
          parts = [rest[0], '', email];
        }
      }
    }

    if (parts.length >= 2) {
      let name = '';
      let country = '';
      let email = '';

      const emailIndex = parts.findIndex((p) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p));
      if (emailIndex !== -1) {
        email = parts[emailIndex];
        parts.splice(emailIndex, 1);
      }

      if (parts.length >= 2) {
        name = parts[0];
        country = parts[1];
      } else if (parts.length === 1) {
        name = parts[0];
      }

      if (name || country || email) {
        setFormData((prev) => ({
          ...prev,
          name: name || prev.name,
          country: country || prev.country,
          email: email || prev.email,
        }));
        setSmartDetected(true);
        setTimeout(() => setSmartDetected(false), 4000);
        showNotification(
          'success',
          lang === 'th'
            ? `⚡ ตรวจพบข้อมูลอัตโนมัติ: ${name} (${country}) [${email}]`
            : `⚡ Auto-detected: ${name} (${country}) [${email}]`
        );
        return true;
      }
    }
    return false;
  };

  const handleSmartPasteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSmartPasteText(val);
    if (val) {
      const success = applyParsedArtistData(val);
      if (success) {
        setSmartPasteText('');
      }
    }
  };

  const handleNamePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && (pasted.includes('\t') || pasted.includes('@') || pasted.includes('|') || pasted.includes(','))) {
      const success = applyParsedArtistData(pasted);
      if (success) {
        e.preventDefault();
      }
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  const refreshList = async () => {
    try {
      const res = await fetch('/api/admin/artists');
      const data = await res.json();
      if (data.artists) {
        setArtists(data.artists);
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

  const handleOpenEdit = (artist: ArtistWithStats) => {
    setEditingArtist(artist);
    let social: any = {};
    if (artist.socialLinks) {
      try {
        social = JSON.parse(artist.socialLinks);
      } catch {}
    }

    setFormData({
      name: artist.name,
      email: artist.email,
      country: artist.country || 'Thailand',
      flagEmoji: artist.flagEmoji || '🇹🇭',
      avatarUrl: artist.avatarUrl || '',
      bio: artist.bio || '',
      instagram: social.instagram || '',
      website: social.website || '',
    });
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      name: formData.name,
      email: formData.email,
      country: formData.country,
      flagEmoji: formData.flagEmoji,
      avatarUrl: formData.avatarUrl,
      bio: formData.bio,
      socialLinks: {
        instagram: formData.instagram,
        website: formData.website,
      },
    };

    try {
      if (editingArtist) {
        const res = await fetch('/api/admin/artists', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingArtist.id,
            ...payload,
          }),
        });

        if (!res.ok) throw new Error('Failed to update artist');
        showNotification('success', lang === 'th' ? 'บันทึกข้อมูลศิลปินสำเร็จ' : 'Artist updated successfully');
        setEditingArtist(null);
      } else {
        const res = await fetch('/api/admin/artists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to create artist');
        showNotification('success', lang === 'th' ? 'เพิ่มศิลปินใหม่เรียบร้อยแล้ว' : 'Artist created successfully');
        setIsCreateModalOpen(false);
      }

      await refreshList();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArtist = async (id: string, name: string) => {
    if (!confirm(lang === 'th' ? `คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์ของ "${name}"?` : `Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/artists?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showNotification('success', lang === 'th' ? 'ลบศิลปินสำเร็จ' : 'Artist deleted');
        await refreshList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredArtists = artists.filter((artist) => {
    const q = searchQuery.toLowerCase();
    return (
      artist.name.toLowerCase().includes(q) ||
      (artist.country || '').toLowerCase().includes(q) ||
      (artist.email || '').toLowerCase().includes(q) ||
      (artist.bio || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD5C8] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
            {t.admin.title}
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1A1918] mt-1">
            {lang === 'th' ? 'จัดการฐานข้อมูลศิลปิน (Artists Management)' : 'Artists Management Studio'}
          </h1>
          <p className="text-xs text-[#6E685C] mt-1">
            {lang === 'th'
              ? 'เพิ่ม ลบ แก้ไขประวัติ รูปถ่าย สัญชาติ และข้อมูลการติดต่อของศิลปิน'
              : 'Add, edit, and curate master artist profiles, biographies, and portfolios.'}
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#C5A880]" />
          <span>{lang === 'th' ? 'เพิ่มศิลปินใหม่' : 'Add New Artist'}</span>
        </button>
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

      {/* Toolbar: Search + View Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-[#E0D9CD] shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#8C6D3F] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={lang === 'th' ? 'ค้นหาชื่อศิลปิน, สัญชาติ, อีเมล...' : 'Search artist name, country, email...'}
            className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-xs text-[#1A1918] placeholder-[#A0988A] focus:outline-none focus:border-[#C5A880]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-neutral-700"
            >
              ✕
            </button>
          )}
        </div>

        {/* View Mode Toggle Buttons */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-[#7A7468] font-medium hidden sm:inline">
            {lang === 'th' ? `ศิลปิน ${filteredArtists.length} ท่าน` : `${filteredArtists.length} Artists`}
          </span>

          <div className="flex items-center bg-[#ECE6DC] p-1 rounded-xl border border-[#DDD6C8] text-xs font-semibold">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#1A1918] text-white shadow'
                  : 'text-[#6E685C] hover:text-[#1A1918]'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>{lang === 'th' ? 'การ์ด' : 'Cards'}</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-[#1A1918] text-white shadow'
                  : 'text-[#6E685C] hover:text-[#1A1918]'
              }`}
              title="Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>{lang === 'th' ? 'ตาราง' : 'Table'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODE 1: GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtists.map((artist) => {
            let social: any = {};
            if (artist.socialLinks) {
              try {
                social = JSON.parse(artist.socialLinks);
              } catch {}
            }

            return (
              <div
                key={artist.id}
                className="bg-white rounded-2xl border border-[#DDD6C8] shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Header Banner */}
                  <div className="relative bg-[#26201B] p-5 text-white flex items-center gap-4">
                    {/* Avatar with Floating Real Flag Badge */}
                    <div className="relative shrink-0">
                      <div className="relative w-16 h-16 rounded-full border-2 border-[#C5A880] overflow-hidden shadow-lg">
                        <Image
                          src={artist.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop'}
                          alt={artist.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      {/* Real Flag Badge */}
                      <div
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#1A1918] border-2 border-[#C5A880] overflow-hidden flex items-center justify-center shadow-md"
                        title={artist.country || 'Country'}
                      >
                        <CountryFlag country={artist.country} size="badge" shape="circle" />
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-serif text-base font-bold truncate">
                          {artist.name}
                        </h3>
                        <div
                          className="w-7 h-7 rounded-full overflow-hidden border border-[#C5A880] shadow-sm flex items-center justify-center bg-white shrink-0"
                          title={artist.country || 'Country'}
                        >
                          <CountryFlag country={artist.country} size="badge" shape="circle" />
                        </div>
                      </div>
                      <p className="text-[11px] text-[#C5A880] font-mono truncate">{artist.email}</p>
                    </div>
                  </div>

                  {/* Content body */}
                  <div className="p-5 space-y-3">
                    <p className="text-xs text-[#6E685C] line-clamp-3 font-serif italic">
                      "{artist.bio || (lang === 'th' ? 'ศิลปินผู้สร้างสรรค์ผลงานในหอศิลป์' : 'Curated artist.')}"
                    </p>

                    <div className="flex items-center gap-4 text-xs font-mono text-[#7A7468] pt-1">
                      <span>
                        🎨 <strong className="text-[#1A1918]">{artist.artworkCount}</strong> {lang === 'th' ? 'ผลงาน' : 'Artworks'}
                      </span>
                      <span>
                        🏛️ <strong className="text-[#1A1918]">{artist.exhibitionCount}</strong> {lang === 'th' ? 'นิทรรศการ' : 'Exhibitions'}
                      </span>
                    </div>

                    {social.instagram && (
                      <div className="text-[11px] text-[#8C6D3F] flex items-center gap-1 font-mono truncate">
                        <Instagram className="w-3.5 h-3.5" />
                        <span>{social.instagram}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-5 pt-0 border-t border-[#F0ECE4] flex items-center justify-between pt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(artist)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EFEBE2] text-[#1A1918] border border-[#D5CEC0] rounded-lg text-xs font-semibold transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#8C6D3F]" />
                      <span>{lang === 'th' ? 'แก้ไข' : 'Edit'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteArtist(artist.id, artist.name)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Artist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <Link
                    href={`/artists/${artist.id}`}
                    target="_blank"
                    className="text-xs font-semibold text-[#8C6D3F] hover:underline flex items-center gap-1"
                  >
                    <span>{lang === 'th' ? 'ชมพอร์ตโฟลิโอ' : 'View Profile'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODE 2: TABLE SPREADSHEET VIEW */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-[#E0D9CD] shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A1918] text-[#E5D2B8] text-xs font-bold uppercase tracking-wider border-b border-[#33302C]">
                  <th className="py-4 px-3 w-10 text-center">#</th>
                  <th className="py-4 px-4">{lang === 'th' ? 'ศิลปิน' : 'Artist'}</th>
                  <th className="py-4 px-3 text-center w-16">{lang === 'th' ? 'สัญชาติ' : 'Country'}</th>
                  <th className="py-4 px-4">{lang === 'th' ? 'อีเมลติดต่อ' : 'Primary Email'}</th>
                  <th className="py-4 px-3 text-center">{lang === 'th' ? 'ผลงาน' : 'Artworks'}</th>
                  <th className="py-4 px-4">{lang === 'th' ? 'นิทรรศการ' : 'Exhibitions'}</th>
                  <th className="py-4 px-4 text-center">{lang === 'th' ? 'โซเชียล' : 'Social'}</th>
                  <th className="py-4 px-4 text-right">{lang === 'th' ? 'การจัดการ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] text-xs text-[#2C2925]">
                {filteredArtists.map((artist, idx) => {
                  let social: any = {};
                  if (artist.socialLinks) {
                    try {
                      social = JSON.parse(artist.socialLinks);
                    } catch {}
                  }

                  return (
                    <tr
                      key={artist.id}
                      className="hover:bg-[#FAF8F5] transition-colors group"
                    >
                      {/* # Index */}
                      <td className="py-4 px-3 text-center font-mono text-[#8C8477] font-semibold">
                        {idx + 1}
                      </td>

                      {/* Artist Avatar & Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-[#C5A880] shadow shrink-0">
                            <Image
                              src={artist.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=800&auto=format&fit=crop'}
                              alt={artist.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-serif text-sm font-bold text-[#1A1918] block leading-snug">
                              {artist.name}
                            </span>
                            <span className="text-[11px] text-[#7A7468] line-clamp-1 max-w-[200px]">
                              {artist.bio || (lang === 'th' ? 'ศิลปินผู้ร่วมจัดแสดง' : 'Curated Artist')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Country Flag Bubble (Image Only) */}
                      <td className="py-4 px-3 text-center">
                        <div
                          className="inline-flex w-8 h-8 rounded-full overflow-hidden border border-[#C5A880] shadow-sm items-center justify-center bg-white hover:scale-110 transition-transform"
                          title={artist.country || 'Country'}
                        >
                          <CountryFlag country={artist.country} size="badge" shape="circle" />
                        </div>
                      </td>

                      {/* Primary Contact: Email */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-[#8C6D3F]">
                          <Mail className="w-3.5 h-3.5 shrink-0" />
                          <a
                            href={`mailto:${artist.email}`}
                            className="hover:underline truncate max-w-[180px]"
                            title={artist.email}
                          >
                            {artist.email}
                          </a>
                        </div>
                      </td>

                      {/* Artworks Count */}
                      <td className="py-4 px-3 text-center">
                        <span className="inline-block font-mono font-bold text-xs bg-[#FAF8F5] text-[#8C6D3F] border border-[#DDD6C8] px-2.5 py-1 rounded-full shadow-sm">
                          {artist.artworkCount} {lang === 'th' ? 'ผลงาน' : 'works'}
                        </span>
                      </td>

                      {/* Exhibitions */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {artist.exhibitions.map((exh) => (
                            <span
                              key={exh.id}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#DDD6C8] text-[#5A554A] truncate max-w-[160px]"
                              title={exh.title}
                            >
                              {exh.title.split(':')[0]}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Social Links */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2 text-[#8C6D3F]">
                          {social.instagram && (
                            <a
                              href={`https://instagram.com/${social.instagram.replace('@', '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 hover:bg-[#FAF8F5] rounded transition-colors"
                              title={social.instagram}
                            >
                              <Instagram className="w-3.5 h-3.5" />
                            </a>
                          )}
                          {social.website && (
                            <a
                              href={social.website}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 hover:bg-[#FAF8F5] rounded transition-colors"
                              title={social.website}
                            >
                              <Globe className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(artist)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EFEBE2] text-[#1A1918] border border-[#D5CEC0] rounded-lg text-xs font-semibold transition-all shadow-sm"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#8C6D3F]" />
                            <span>{lang === 'th' ? 'แก้ไข' : 'Edit'}</span>
                          </button>

                          <button
                            onClick={() => handleDeleteArtist(artist.id, artist.name)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Artist"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <Link
                            href={`/artists/${artist.id}`}
                            target="_blank"
                            className="p-1.5 text-[#8C6D3F] hover:text-[#1A1918] hover:bg-[#FAF8F5] rounded-lg transition-colors"
                            title="View Public Profile"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Artist Modal */}
      {(isCreateModalOpen || editingArtist) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingArtist(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E3DED4] pb-4 mb-6">
              <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
                {editingArtist ? (lang === 'th' ? 'แก้ไขข้อมูลศิลปิน' : 'Edit Artist Profile') : (lang === 'th' ? 'เพิ่มศิลปินใหม่' : 'Add New Artist')}
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1A1918] mt-1">
                {editingArtist ? editingArtist.name : (lang === 'th' ? 'กรอกประวัติและข้อมูลศิลปิน' : 'Artist Information')}
              </h2>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Smart Paste Excel/Text Bar */}
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#DCD6C8] shadow-sm">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D3F] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {lang === 'th' ? '⚡ วางข้อมูลแบบเร็วจาก Excel / ข้อความ (Smart Paste)' : '⚡ Quick Smart Paste from Excel / Text'}
                  </span>
                  {smartDetected && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {lang === 'th' ? '✓ ตรวจจับข้อมูลสำเร็จ' : '✓ Detected successfully'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={smartPasteText}
                  onChange={handleSmartPasteChange}
                  placeholder={
                    lang === 'th'
                      ? 'วางแถวข้อมูลจาก Excel เช่น Fassih Keiso\tAustralia\tfassihkeiso@yahoo.com'
                      : 'Paste row e.g. Fassih Keiso\tAustralia\tfassihkeiso@yahoo.com'
                  }
                  className="w-full px-3 py-1.5 bg-white border border-[#DDD6C8] rounded-lg text-xs font-mono text-[#1A1918] placeholder:text-[#9E978B] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                />
                <p className="text-[10px] text-[#7A7468] mt-1">
                  {lang === 'th'
                    ? '💡 วางแถวจาก Excel ระบบจะแยก ชื่อ, ประเทศ/สัญชาติ, และอีเมล แล้วกรอกลงฟอร์มให้อัตโนมัติทันที'
                    : '💡 Automatically parses Name, Country, and Email into the form fields.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'ชื่อ-นามสกุล ศิลปิน' : 'Artist Full Name'} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    onPaste={handleNamePaste}
                    placeholder={lang === 'th' ? 'เช่น สมชาย ใจเย็น' : 'e.g. Somchai Jaiyen'}
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-sm font-serif font-bold text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'อีเมลติดต่อ' : 'Email'} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="artist@artvara.gallery"
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-mono text-[#1A1918] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {lang === 'th' ? 'ประเทศ / สัญชาติ (Country)' : 'Country'}
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3 flex items-center pointer-events-none">
                    <CountryFlag country={formData.country} size="sm" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Thailand / Italy / Japan / France"
                    className="w-full pl-11 pr-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                  />
                </div>
                <span className="text-[10px] text-[#8C6D3F] mt-1 block font-mono">
                  {lang === 'th' ? '⚡ ระบบจะตรวจจับและเลือกรูปธงชาติให้อัตโนมัติ' : '⚡ Flag image is detected automatically.'}
                </span>
              </div>

              <div>
                <ImageUploadDropzone
                  label={lang === 'th' ? 'รูปถ่ายโปรไฟล์ศิลปิน (Artist Portrait / Photo)' : 'Artist Profile Photo'}
                  value={formData.avatarUrl}
                  onChange={(url) => setFormData({ ...formData, avatarUrl: url })}
                  titleHint={formData.name || 'artist-avatar'}
                  folder="/artvara-artists"
                  shape="circle"
                  helperText={
                    lang === 'th'
                      ? 'ลากรูปถ่ายศิลปินมาวาง หรือคลิกเพื่ออัปโหลดไปยัง ImageKit CDN'
                      : 'Drag & drop artist photo or click to upload to ImageKit CDN'
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    Instagram Account
                  </label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                    placeholder="@artist_studio"
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://artistportfolio.com"
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {lang === 'th' ? 'ประวัติย่อและเกียรติประวัติ (Biography & Accolades)' : 'Biography Statement'}
                </label>
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={lang === 'th' ? 'เขียนประวัติ แรงบันดาลใจ ประสบการณ์ และรางวัลทางศิลปกรรม...' : 'Write artist background, inspiration, and accolades...'}
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-serif leading-relaxed focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setEditingArtist(null);
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
                  {loading ? (lang === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (lang === 'th' ? 'บันทึกข้อมูลศิลปิน' : 'Save Artist')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
