'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  FileText,
  UploadCloud,
  Users,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from 'lucide-react';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { ArtistAvatar } from '@/components/ui/ArtistAvatar';
import { cleanEmail, cleanText } from '@/lib/utils';

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
  const [artists, setArtists] = useState<ArtistWithStats[]>(Array.isArray(initialArtists) ? initialArtists : []);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'country-asc' | 'country-desc' | 'artworks-desc' | 'default'>('name-asc');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedArtistIds, setSelectedArtistIds] = useState<Set<string>>(new Set());
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<ArtistWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state if initialArtists changes, or auto-fetch if empty
  useEffect(() => {
    if (initialArtists && initialArtists.length > 0) {
      setArtists(initialArtists);
    } else {
      refreshList();
    }
  }, [initialArtists]);

  // Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedArtistIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedArtistIds.size === filteredArtists.length) {
      setSelectedArtistIds(new Set());
    } else {
      setSelectedArtistIds(new Set(filteredArtists.map((a) => a.id)));
    }
  };

  const handleDeselectAll = () => {
    setSelectedArtistIds(new Set());
  };

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

  // Batch Excel Import State
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchRawText, setBatchRawText] = useState('');
  const [parsedBatch, setParsedBatch] = useState<Array<{ name: string; country: string; email: string; flagEmoji: string }>>([]);
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);

  const parseMultiLineArtists = (text: string) => {
    if (!text || !text.trim()) return [];
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const results: Array<{ name: string; country: string; email: string; flagEmoji: string }> = [];
    const seenEmails = new Set<string>();

    for (const line of lines) {
      if (!line) continue;

      const lowerLine = line.toLowerCase();
      if (
        lowerLine.startsWith('name\t') ||
        lowerLine.startsWith('ชื่อ\t') ||
        lowerLine.startsWith('artist\t') ||
        lowerLine.includes('xxx\txxx')
      ) {
        continue;
      }

      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t').map((s) => s.trim()).filter(Boolean);
      } else if (line.includes('|')) {
        parts = line.split('|').map((s) => s.trim()).filter(Boolean);
      } else if (line.includes(',')) {
        parts = line.split(',').map((s) => s.trim()).filter(Boolean);
      } else {
        const emailMatch = line.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
          const email = emailMatch[1];
          const withoutEmail = line.replace(email, '').trim();
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

        if (name.toLowerCase() === 'xxx' || email.toLowerCase() === 'xxx') continue;

        if (name && email) {
          const sanitizedEmail = cleanEmail(email);
          const sanitizedName = cleanText(name);
          const sanitizedCountry = cleanText(country);

          if (sanitizedEmail && !seenEmails.has(sanitizedEmail)) {
            seenEmails.add(sanitizedEmail);

            let flag = '🌐';
            const cLower = sanitizedCountry.toLowerCase();
            if (cLower.includes('thai')) flag = '🇹🇭';
            else if (cLower.includes('japan')) flag = '🇯🇵';
            else if (cLower.includes('ital')) flag = '🇮🇹';
            else if (cLower.includes('france')) flag = '🇫🇷';
            else if (cLower.includes('austr')) flag = '🇦🇺';
            else if (cLower.includes('chin')) flag = '🇨🇳';
            else if (cLower.includes('indones')) flag = '🇮🇩';
            else if (cLower.includes('kurd')) flag = '☀️';
            else if (cLower.includes('malay')) flag = '🇲🇾';
            else if (cLower.includes('mexic')) flag = '🇲🇽';
            else if (cLower.includes('singap')) flag = '🇸🇬';
            else if (cLower.includes('taiwan')) flag = '🇹🇼';
            else if (cLower.includes('unit') || cLower.includes('king') || cLower.includes('uk')) flag = '🇬🇧';
            else if (cLower.includes('viet')) flag = '🇻🇳';
            else if (cLower.includes('us') || cLower.includes('america')) flag = '🇺🇸';

            results.push({
              name: sanitizedName,
              country: sanitizedCountry || 'International',
              email: sanitizedEmail,
              flagEmoji: flag,
            });
          }
        }
      }
    }

    return results;
  };

  const handleBatchTextChange = (text: string) => {
    setBatchRawText(text);
    const parsed = parseMultiLineArtists(text);
    setParsedBatch(parsed);
  };

  const handleBatchSubmit = async () => {
    if (parsedBatch.length === 0) return;
    setIsBatchSubmitting(true);
    try {
      const res = await fetch('/api/admin/artists/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artists: parsedBatch }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to import');
      }

      showNotification(
        'success',
        lang === 'th'
          ? `🎉 นำเข้าศิลปินทั้งหมด ${data.count} ท่านเรียบร้อยแล้ว!`
          : `🎉 Successfully imported ${data.count} artists!`
      );
      setIsBatchModalOpen(false);
      setBatchRawText('');
      setParsedBatch([]);
      await refreshList();
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.message || 'Error importing artists');
    } finally {
      setIsBatchSubmitting(false);
    }
  };

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

      const sName = cleanText(name);
      const sCountry = cleanText(country);
      const sEmail = cleanEmail(email);

      if (sName || sCountry || sEmail) {
        setFormData((prev) => ({
          ...prev,
          name: sName || prev.name,
          country: sCountry || prev.country,
          email: sEmail || prev.email,
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

    const cleanE = cleanEmail(formData.email);
    const cleanN = cleanText(formData.name);

    if (!cleanN) {
      showNotification('error', lang === 'th' ? 'กรุณากรอกชื่อ-นามสกุลศิลปิน' : 'Artist name is required');
      return;
    }

    if (!cleanE || !cleanE.includes('@') || !cleanE.includes('.')) {
      showNotification(
        'error',
        lang === 'th'
          ? 'กรุณากรอกอีเมลติดต่อที่ถูกต้อง (เช่น name@example.com)'
          : 'Please enter a valid email address (e.g. name@example.com)'
      );
      return;
    }

    setLoading(true);

    const payload = {
      name: cleanN,
      email: cleanE,
      country: cleanText(formData.country) || 'Thailand',
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
        setSelectedArtistIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        await refreshList();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedArtistIds.size === 0) return;
    const count = selectedArtistIds.size;
    const confirmMsg =
      lang === 'th'
        ? `⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบศิลปินที่เลือกทั้งหมด ${count} ท่าน?\n\n(ผลงานศิลปะของศิลปินเหล่านี้จะถูกลบออกจากระบบด้วย)`
        : `⚠️ Are you sure you want to delete ${count} selected artist(s)? (Their artworks will also be removed).`;

    if (!window.confirm(confirmMsg)) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/artists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedArtistIds) }),
      });

      if (!res.ok) throw new Error('Failed to delete selected artists');

      showNotification(
        'success',
        lang === 'th' ? `ลบศิลปินที่เลือก ${count} ท่านเรียบร้อยแล้ว` : `Deleted ${count} artist(s) successfully`
      );
      setSelectedArtistIds(new Set());
      await refreshList();
    } catch (err: any) {
      showNotification('error', err.message || 'Error deleting artists');
    } finally {
      setLoading(false);
    }
  };

  const countries = useMemo(() => {
    const set = new Set<string>();
    (artists || []).forEach((a) => {
      if (a?.country && a.country.trim()) set.add(a.country.trim());
    });
    return Array.from(set).sort((a, b) => (a || '').localeCompare(b || '', 'th'));
  }, [artists]);

  const filteredArtists = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = (artists || []).filter((artist) => {
      if (!artist) return false;
      const name = (artist.name || '').toLowerCase();
      const country = (artist.country || '').toLowerCase();
      const email = (artist.email || '').toLowerCase();
      const bio = (artist.bio || '').toLowerCase();

      const matchesQuery = !q || name.includes(q) || country.includes(q) || email.includes(q) || bio.includes(q);
      const matchesCountry =
        selectedCountry === 'all' || (artist.country || '').trim().toLowerCase() === selectedCountry.trim().toLowerCase();

      return matchesQuery && matchesCountry;
    });

    return [...filtered].sort((a, b) => {
      const nameA = a?.name || '';
      const nameB = b?.name || '';
      if (sortBy === 'name-asc') {
        return nameA.localeCompare(nameB, 'th');
      }
      if (sortBy === 'name-desc') {
        return nameB.localeCompare(nameA, 'th');
      }
      if (sortBy === 'country-asc') {
        const cA = (a?.country || '').trim();
        const cB = (b?.country || '').trim();
        const cComp = cA.localeCompare(cB, 'th');
        if (cComp !== 0) return cComp;
        return nameA.localeCompare(nameB, 'th');
      }
      if (sortBy === 'country-desc') {
        const cA = (a?.country || '').trim();
        const cB = (b?.country || '').trim();
        const cComp = cB.localeCompare(cA, 'th');
        if (cComp !== 0) return cComp;
        return nameA.localeCompare(nameB, 'th');
      }
      if (sortBy === 'artworks-desc') {
        return (b?.artworkCount || 0) - (a?.artworkCount || 0);
      }
      return 0;
    });
  }, [artists, searchQuery, selectedCountry, sortBy]);

  const handleSyncArtists = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/artists/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to sync artists');

      showNotification(
        'success',
        lang === 'th'
          ? `กู้คืนและซิงค์ข้อมูลศิลปินสำเร็จ (พบทั้งหมด ${data.totalArtists} ท่าน)`
          : `Successfully synced & restored ${data.totalArtists} artists!`
      );
      if (data.artists) {
        setArtists(data.artists);
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error syncing artists');
    } finally {
      setLoading(false);
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
            {lang === 'th' ? 'จัดการฐานข้อมูลศิลปิน (Artists Management)' : 'Artists Management Studio'}
          </h1>
          <p className="text-xs text-[#6E685C] mt-1">
            {lang === 'th'
              ? 'เพิ่ม ลบ แก้ไขประวัติ รูปถ่าย สัญชาติ และข้อมูลการติดต่อของศิลปิน'
              : 'Add, edit, and curate master artist profiles, biographies, and portfolios.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleSyncArtists}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0"
            title="ซิงค์และกู้คืนรายชื่อศิลปินจากผลงานทั้งหมดและระบบตั้งต้น"
          >
            <Sparkles className="w-4 h-4 text-amber-700" />
            <span>{loading ? (lang === 'th' ? 'กำลังซิงค์...' : 'Syncing...') : (lang === 'th' ? '🔄 ซิงค์/กู้คืนศิลปิน' : '🔄 Sync Artists')}</span>
          </button>

          <button
            onClick={() => {
              setBatchRawText('');
              setParsedBatch([]);
              setIsBatchModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FAF8F5] hover:bg-[#EAE5DA] text-[#1A1918] border border-[#D5CFC3] rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all active:scale-95 shrink-0"
            title="Batch Import Artists from Excel / CSV"
          >
            <FileText className="w-4 h-4 text-[#8C6D3F]" />
            <span>{lang === 'th' ? '📊 นำเข้าจาก Excel' : '📊 Excel Import'}</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-[#C5A880]" />
            <span>{lang === 'th' ? 'เพิ่มศิลปินใหม่' : 'Add New Artist'}</span>
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

      {/* Floating Bulk Actions Bar */}
      {selectedArtistIds.size > 0 && (
        <div className="sticky top-4 z-30 p-3.5 bg-[#1A1918] text-white rounded-2xl shadow-2xl flex items-center justify-between gap-4 border border-[#C5A880]/40 animate-slide-up">
          <div className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-[#C5A880] text-[#1A1918] text-xs font-bold flex items-center justify-center">
              {selectedArtistIds.size}
            </span>
            <span className="text-xs font-semibold">
              {lang === 'th'
                ? `เลือกศิลปินแล้ว ${selectedArtistIds.size} จาก ${filteredArtists.length} ท่าน`
                : `Selected ${selectedArtistIds.size} of ${filteredArtists.length} artists`}
            </span>
            <button
              onClick={handleSelectAll}
              className="text-xs text-[#C5A880] hover:underline underline-offset-2 ml-2 font-medium"
            >
              {selectedArtistIds.size === filteredArtists.length
                ? (lang === 'th' ? 'ยกเลิกการเลือกทั้งหมด' : 'Deselect All')
                : (lang === 'th' ? 'เลือกทั้งหมด' : 'Select All')}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDeleteSelected}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow active:scale-95 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{loading ? (lang === 'th' ? 'กำลังลบ...' : 'Deleting...') : (lang === 'th' ? `ลบศิลปินที่เลือก (${selectedArtistIds.size})` : `Delete Selected (${selectedArtistIds.size})`)}</span>
            </button>
            <button
              onClick={handleDeselectAll}
              className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors"
              title="Cancel Selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toolbar: Search + Country Filter + Sort Selector + View Mode Switcher */}
      <div className="bg-white p-4 rounded-2xl border border-[#E0D9CD] shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
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

        {/* Controls: Country Filter + Sort Selector + View Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Country Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#DDD6C8] px-3 py-2 rounded-xl text-xs">
            <Globe className="w-3.5 h-3.5 text-[#8C6D3F] shrink-0" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-transparent text-xs text-[#1A1918] focus:outline-none cursor-pointer font-medium max-w-[130px] sm:max-w-none"
            >
              <option value="all">{lang === 'th' ? 'ทุกสัญชาติ (All Countries)' : 'All Countries'}</option>
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#DDD6C8] px-3 py-2 rounded-xl text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#8C6D3F] shrink-0" />
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-xs text-[#1A1918] focus:outline-none cursor-pointer font-medium max-w-[160px] sm:max-w-none"
            >
              <option value="name-asc">{lang === 'th' ? '🔤 ชื่อศิลปิน (A → Z / ก → ฮ)' : '🔤 Name (A → Z)'}</option>
              <option value="name-desc">{lang === 'th' ? '🔤 ชื่อศิลปิน (Z → A / ฮ → ก)' : '🔤 Name (Z → A)'}</option>
              <option value="country-asc">{lang === 'th' ? '🌐 เรียงตามประเทศ (Country A → Z)' : '🌐 Country (A → Z)'}</option>
              <option value="country-desc">{lang === 'th' ? '🌐 เรียงตามประเทศ (Country Z → A)' : '🌐 Country (Z → A)'}</option>
              <option value="artworks-desc">{lang === 'th' ? '🎨 จำนวนผลงาน (มาก → น้อย)' : '🎨 Most Artworks'}</option>
              <option value="default">{lang === 'th' ? '🕒 ลำดับเดิม (Default)' : '🕒 Default'}</option>
            </select>
          </div>

          {/* Total Count Badge */}
          <span className="text-xs text-[#7A7468] font-medium hidden sm:inline px-1">
            {lang === 'th' ? `ศิลปิน ${filteredArtists.length} ท่าน` : `${filteredArtists.length} Artists`}
          </span>

          {/* View Mode Toggle Buttons */}
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
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  selectedArtistIds.has(artist.id) ? 'border-[#C5A880] ring-2 ring-[#C5A880]/50' : 'border-[#DDD6C8]'
                }`}
              >
                <div>
                  {/* Header Banner */}
                  <div className="relative bg-[#26201B] p-5 text-white flex items-center gap-4">
                    {/* Multi-Select Checkbox */}
                    <div className="shrink-0 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedArtistIds.has(artist.id)}
                        onChange={() => handleToggleSelect(artist.id)}
                        className="w-4 h-4 rounded border-[#C5A880] text-[#8C6D3F] focus:ring-[#C5A880] cursor-pointer accent-[#C5A880]"
                        title={lang === 'th' ? 'เลือกศิลปินนี้' : 'Select Artist'}
                      />
                    </div>

                    {/* Avatar with Floating Real Flag Badge */}
                    <div className="relative shrink-0">
                      <div className="border-2 border-[#C5A880] rounded-full shadow-lg">
                        <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size="xl" />
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
                  {/* Select All Checkbox */}
                  <th className="py-4 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredArtists.length > 0 && selectedArtistIds.size === filteredArtists.length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-[#C5A880] text-[#8C6D3F] focus:ring-[#C5A880] cursor-pointer accent-[#C5A880]"
                      title={selectedArtistIds.size === filteredArtists.length ? (lang === 'th' ? 'ยกเลิกการเลือกทั้งหมด' : 'Deselect All') : (lang === 'th' ? 'เลือกทั้งหมด' : 'Select All')}
                    />
                  </th>
                  <th
                    className="py-4 px-3 w-12 text-center cursor-pointer select-none hover:text-white transition-colors"
                    onClick={() => setSortBy('default')}
                    title={lang === 'th' ? 'เรียงตามลำดับเริ่มต้น' : 'Default Order'}
                  >
                    #
                  </th>
                  <th
                    className="py-4 px-4 cursor-pointer select-none hover:text-white transition-colors"
                    onClick={() => setSortBy(sortBy === 'name-asc' ? 'name-desc' : 'name-asc')}
                    title={lang === 'th' ? 'คลิกเพื่อเรียงตามชื่อ ก-ฮ / A-Z' : 'Click to sort by Name'}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{lang === 'th' ? 'ศิลปิน' : 'Artist'}</span>
                      {sortBy === 'name-asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-[#C5A880]" />
                      ) : sortBy === 'name-desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-[#C5A880]" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#6E685C] hover:text-[#C5A880]" />
                      )}
                    </div>
                  </th>
                  <th
                    className="py-4 px-3 text-center w-24 cursor-pointer select-none hover:text-white transition-colors"
                    onClick={() => setSortBy(sortBy === 'country-asc' ? 'country-desc' : 'country-asc')}
                    title={lang === 'th' ? 'คลิกเพื่อเรียงตามประเทศ' : 'Click to sort by Country'}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{lang === 'th' ? 'สัญชาติ' : 'Country'}</span>
                      {sortBy === 'country-asc' ? (
                        <ArrowUp className="w-3.5 h-3.5 text-[#C5A880]" />
                      ) : sortBy === 'country-desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-[#C5A880]" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#6E685C] hover:text-[#C5A880]" />
                      )}
                    </div>
                  </th>
                  <th className="py-4 px-4">{lang === 'th' ? 'อีเมลติดต่อ' : 'Primary Email'}</th>
                  <th
                    className="py-4 px-3 text-center cursor-pointer select-none hover:text-white transition-colors"
                    onClick={() => setSortBy(sortBy === 'artworks-desc' ? 'default' : 'artworks-desc')}
                    title={lang === 'th' ? 'คลิกเพื่อเรียงตามจำนวนผลงาน' : 'Click to sort by Artworks count'}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{lang === 'th' ? 'ผลงาน' : 'Artworks'}</span>
                      {sortBy === 'artworks-desc' ? (
                        <ArrowDown className="w-3.5 h-3.5 text-[#C5A880]" />
                      ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-[#6E685C] hover:text-[#C5A880]" />
                      )}
                    </div>
                  </th>
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
                      className={`transition-colors group ${
                        selectedArtistIds.has(artist.id) ? 'bg-[#FAF2E6]' : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedArtistIds.has(artist.id)}
                          onChange={() => handleToggleSelect(artist.id)}
                          className="w-4 h-4 rounded border-[#C5A880] text-[#8C6D3F] focus:ring-[#C5A880] cursor-pointer accent-[#C5A880]"
                        />
                      </td>

                      {/* # Index */}
                      <td className="py-4 px-3 text-center font-mono text-[#8C8477] font-semibold">
                        {idx + 1}
                      </td>

                      {/* Artist Avatar & Name */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="border-2 border-[#C5A880] rounded-full shadow shrink-0">
                            <ArtistAvatar name={artist.name} avatarUrl={artist.avatarUrl} size="md" />
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

      {/* Empty State */}
      {filteredArtists.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#DDD6C8] p-12 text-center space-y-4 shadow-sm">
          <Users className="w-12 h-12 text-[#8C6D3F] mx-auto opacity-50" />
          <h3 className="font-serif text-xl font-bold text-[#1A1918]">
            {lang === 'th' ? 'ไม่พบข้อมูลศิลปิน' : 'No Artists Found'}
          </h3>
          <p className="text-xs text-[#7A7468] max-w-md mx-auto leading-relaxed">
            {lang === 'th'
              ? 'ฐานข้อมูลศิลปินอาจยังว่างอยู่ หรือยังไม่ได้ซิงค์จากผลงานศิลปะ สามารถกดปุ่มด้านล่างเพื่อกู้คืนและซิงค์รายชื่อศิลปินทั้งหมดได้ทันที'
              : 'Artist records may not be loaded yet. Click below to sync and restore all artists from artworks and defaults.'}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleSyncArtists}
              disabled={loading}
              className="px-6 py-2.5 bg-[#8C6D3F] hover:bg-[#A3804C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{lang === 'th' ? 'กู้คืนและซิงค์รายชื่อศิลปินทันที' : 'Sync & Restore Artists Now'}</span>
            </button>
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

            <form noValidate onSubmit={handleSubmitForm} className="space-y-4">
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
                    onChange={(e) => setFormData({ ...formData, name: cleanText(e.target.value) })}
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
                    type="text"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: cleanEmail(e.target.value) })}
                    onPaste={(e) => {
                      const paste = e.clipboardData.getData('text');
                      if (paste && !paste.includes('\t') && !paste.includes('\n')) {
                        e.preventDefault();
                        setFormData((prev) => ({ ...prev, email: cleanEmail(paste) }));
                      }
                    }}
                    placeholder="artist@artvara.gallery"
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-mono text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
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

      {/* BATCH IMPORT FROM EXCEL MODAL */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FAF8F5] border border-[#DDD6C8] rounded-2xl w-full max-w-3xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto relative">
            <button
              onClick={() => setIsBatchModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E3DED4] pb-4 mb-6">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8C6D3F]" />
                <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
                  {lang === 'th' ? 'นำเข้าข้อมูลศิลปินจำนวนมากจาก Excel / CSV' : 'Batch Import Artists from Excel / CSV'}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-bold text-[#1A1918] mt-1">
                {lang === 'th' ? 'คัดลอกตารางจาก Excel แล้ววางที่นี่' : 'Copy Table from Excel & Paste Here'}
              </h2>
              <p className="text-xs text-[#7A7468] mt-1">
                {lang === 'th'
                  ? 'ระบบจะตรวจจับชื่อ-นามสกุล, ประเทศ/สัญชาติ, ธงชาติ, และอีเมลของศิลปินแต่ละท่านให้อัตโนมัติทันที'
                  : 'System will automatically detect artist name, country, flag, and email.'}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1.5">
                  {lang === 'th' ? 'วางแถวข้อมูลจาก Excel ที่นี่ (Copy & Paste):' : 'Paste Excel Table Rows Here:'}
                </label>
                <textarea
                  rows={8}
                  value={batchRawText}
                  onChange={(e) => handleBatchTextChange(e.target.value)}
                  placeholder={`Fassih Keiso\tAustralia\tfassihkeiso@yahoo.com\nPimpisa Tinpalit\tAustralia\ttinpalit@gmail.com\nLiang Hongxia\tChina\tranfangge@163.com\nMen Longpeng\tChina\tmlpmenlongpeng@126.com\nEric Madeleine\tFrance\tmie@madeineric.com`}
                  className="w-full p-3.5 bg-white border border-[#D5CFC3] rounded-xl text-xs font-mono leading-relaxed text-[#1A1918] placeholder:text-[#AAA396] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                />
              </div>

              {/* Live Preview of Parsed Artists */}
              {parsedBatch.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1A1918] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#8C6D3F]" />
                      <span>{lang === 'th' ? `ตรวจพบศิลปินทั้งหมด ${parsedBatch.length} ท่าน:` : `Detected ${parsedBatch.length} Artists:`}</span>
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                      ✓ พร้อมนำเข้า
                    </span>
                  </div>

                  <div className="border border-[#E0D9CD] rounded-xl bg-white overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#FAF8F5] border-b border-[#E8E2D6] text-[#7A7468] uppercase font-semibold text-[10px]">
                        <tr>
                          <th className="p-2.5">#</th>
                          <th className="p-2.5">{lang === 'th' ? 'ชื่อ-นามสกุล ศิลปิน' : 'Artist Name'}</th>
                          <th className="p-2.5">{lang === 'th' ? 'ประเทศ' : 'Country'}</th>
                          <th className="p-2.5">{lang === 'th' ? 'อีเมล' : 'Email'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F0ECE4]">
                        {parsedBatch.map((art, idx) => (
                          <tr key={idx} className="hover:bg-[#FAF8F5]">
                            <td className="p-2.5 text-[#8C8477] font-mono text-[11px]">{idx + 1}</td>
                            <td className="p-2.5 font-bold text-[#1A1918]">{art.name}</td>
                            <td className="p-2.5">
                              <span className="inline-flex items-center gap-1.5">
                                <CountryFlag country={art.country} size="xs" />
                                <span>{art.country}</span>
                              </span>
                            </td>
                            <td className="p-2.5 font-mono text-[11px] text-[#8C6D3F]">{art.email}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-between">
                <span className="text-xs text-[#7A7468]">
                  {parsedBatch.length > 0
                    ? lang === 'th'
                      ? `พร้อมนำเข้าศิลปิน ${parsedBatch.length} ท่าน`
                      : `${parsedBatch.length} artists ready`
                    : lang === 'th'
                    ? 'กรุณาวางข้อมูลจาก Excel เพื่อดูตัวอย่าง'
                    : 'Paste data above to preview'}
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBatchModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#6E685C] hover:text-[#1A1918]"
                  >
                    {t.inquiryModal.cancel}
                  </button>
                  <button
                    type="button"
                    disabled={parsedBatch.length === 0 || isBatchSubmitting}
                    onClick={handleBatchSubmit}
                    className="flex items-center gap-2 px-6 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all disabled:opacity-50 active:scale-95"
                  >
                    <UploadCloud className="w-4 h-4 text-[#C5A880]" />
                    <span>
                      {isBatchSubmitting
                        ? lang === 'th'
                          ? 'กำลังนำเข้าข้อมูล...'
                          : 'Importing...'
                        : lang === 'th'
                        ? `🚀 นำเข้าศิลปินทั้ง ${parsedBatch.length} ท่าน`
                        : `🚀 Import ${parsedBatch.length} Artists`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
