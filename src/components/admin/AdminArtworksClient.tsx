'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Artwork, Exhibition } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { formatDimensionsInCm, formatPrice } from '@/lib/utils';
import { CountryFlag } from '@/components/ui/CountryFlag';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  Save,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  Layers,
  ArrowUpToLine,
  ArrowDownToLine,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Info,
} from 'lucide-react';

interface AdminArtworksClientProps {
  initialArtworks: Artwork[];
  exhibitions?: Exhibition[];
}

export function AdminArtworksClient({
  initialArtworks = [],
  exhibitions = [],
}: AdminArtworksClientProps) {
  const { lang, t } = useLanguage();

  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string>('all');
  const [artworksList, setArtworksList] = useState<Artwork[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Initialize artworks list based on exhibition filter
  useEffect(() => {
    if (selectedExhibitionId === 'all') {
      const sorted = [...initialArtworks].map((art, idx) => ({
        ...art,
        displayOrder: art.displayOrder || idx + 1,
      }));
      setArtworksList(sorted);
    } else {
      const exh = exhibitions.find((e) => e.id === selectedExhibitionId);
      if (exh && exh.artworks) {
        const exhArts = [...exh.artworks].map((art, idx) => ({
          ...art,
          displayOrder: art.displayOrder || idx + 1,
        }));
        setArtworksList(exhArts);
      } else {
        setArtworksList([]);
      }
    }
    setHasChanges(false);
  }, [selectedExhibitionId, initialArtworks, exhibitions]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Reorder items by moving an item from oldIndex to newIndex
  const moveItem = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || toIndex < 0 || toIndex >= artworksList.length) return;

    const updated = [...artworksList];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);

    // Recalculate 1-based displayOrder sequence
    const resequenced = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setArtworksList(resequenced);
    setHasChanges(true);
  };

  // Handle direct numeric input change (e.g. typing #1 to jump to first)
  const handleOrderInputChange = (artId: string, newOrderVal: number) => {
    if (isNaN(newOrderVal) || newOrderVal < 1) return;
    const targetOrder = Math.min(newOrderVal, artworksList.length);
    const currentIndex = artworksList.findIndex((a) => a.id === artId);
    if (currentIndex === -1) return;

    const targetIndex = targetOrder - 1;
    moveItem(currentIndex, targetIndex);
  };

  // Move 1 step up
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      moveItem(index, index - 1);
    }
  };

  // Move 1 step down
  const handleMoveDown = (index: number) => {
    if (index < artworksList.length - 1) {
      moveItem(index, index + 1);
    }
  };

  // Jump to Top
  const handleJumpToTop = (index: number) => {
    if (index > 0) {
      moveItem(index, 0);
    }
  };

  // Jump to Bottom
  const handleJumpToBottom = (index: number) => {
    if (index < artworksList.length - 1) {
      moveItem(index, artworksList.length - 1);
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (index: number) => {
    if (draggedIndex !== null && draggedIndex !== index) {
      moveItem(draggedIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Quick Auto-Sort Presets
  const handleAutoSort = (sortType: 'title' | 'artist' | 'country' | 'year' | 'reverse') => {
    const updated = [...artworksList];

    if (sortType === 'title') {
      updated.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'th'));
    } else if (sortType === 'artist') {
      updated.sort((a, b) => (a.artist?.name || '').localeCompare(b.artist?.name || '', 'th'));
    } else if (sortType === 'country') {
      updated.sort((a, b) => (a.artist?.country || '').localeCompare(b.artist?.country || '', 'th'));
    } else if (sortType === 'year') {
      updated.sort((a, b) => (b.yearCreated || 0) - (a.yearCreated || 0));
    } else if (sortType === 'reverse') {
      updated.reverse();
    }

    const resequenced = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setArtworksList(resequenced);
    setHasChanges(true);
    showNotification(
      'success',
      lang === 'th' ? `จัดเรียงลำดับใหม่เรียบร้อยแล้ว (อย่าลืมกดบันทึก)` : `Artworks re-sorted (Remember to save)`
    );
  };

  // Save new display orders to server
  const handleSaveOrder = async () => {
    try {
      setSaving(true);

      const orderedArtworkIds = artworksList.map((a) => a.id);
      const res = await fetch('/api/admin/artworks/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exhibitionId: selectedExhibitionId !== 'all' ? selectedExhibitionId : undefined,
          orderedArtworkIds,
        }),
      });

      if (!res.ok) throw new Error('Failed to save artwork display order');

      setHasChanges(false);
      showNotification(
        'success',
        lang === 'th'
          ? `บันทึกลำดับการแสดงผลงาน ${artworksList.length} ชิ้น สำเร็จเรียบร้อยแล้ว`
          : `Saved display order for ${artworksList.length} artworks successfully!`
      );
    } catch (err: any) {
      console.error('Error saving order:', err);
      showNotification('error', err.message || 'Error saving display order');
    } finally {
      setSaving(false);
    }
  };

  // Filter for search
  const filteredArtworks = artworksList.filter((art) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      art.title?.toLowerCase().includes(query) ||
      art.artist?.name?.toLowerCase().includes(query) ||
      art.artist?.country?.toLowerCase().includes(query) ||
      art.medium?.toLowerCase().includes(query) ||
      art.yearCreated?.toString().includes(query)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 select-none">
      {/* Toast Notification */}
      {feedback && (
        <div
          className={`fixed top-20 right-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-fade-in border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/95 text-emerald-200 border-emerald-700/50'
              : 'bg-rose-950/95 text-rose-200 border-rose-700/50'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Top Header & Save Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCD5C8] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
            {t.admin.title}
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1A1918] mt-1 flex items-center gap-2.5">
            <span>{lang === 'th' ? 'จัดการและเรียงลำดับผลงานศิลปะ' : 'Artworks Display Order Studio'}</span>
          </h1>
          <p className="text-xs text-[#6E685C] mt-1">
            {lang === 'th'
              ? 'สามารถปรับลำดับการแสดงผลงานได้โดยการ "ลากและวาง" หรือ "เปลี่ยนตัวเลขลำดับ" ได้ทันที'
              : 'Reorder artworks by Drag & Drop or by editing numeric order sequence.'}
          </p>
        </div>

        {/* Save Changes Button */}
        <div className="flex items-center gap-3">
          {hasChanges && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1 border border-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'th' ? 'มีลำดับเปลี่ยนแปลง' : 'Unsaved Order'}</span>
            </span>
          )}

          <button
            onClick={handleSaveOrder}
            disabled={saving || !hasChanges}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider shadow-lg transition-all active:scale-95 ${
              hasChanges
                ? 'bg-[#1A1918] hover:bg-[#33302C] text-white ring-2 ring-[#8C6D3F]'
                : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Save className="w-4 h-4 text-[#C5A880]" />
            )}
            <span>
              {saving
                ? lang === 'th'
                  ? 'กำลังบันทึกลำดับ...'
                  : 'Saving Order...'
                : lang === 'th'
                ? 'บันทึกลำดับการแสดงผล'
                : 'Save Display Order'}
            </span>
          </button>
        </div>
      </div>

      {/* Control Bar: Exhibition Selector, Search & Quick Auto-Sort */}
      <div className="bg-[#FAF8F5] border border-[#E0D9CD] p-4 rounded-2xl shadow-sm space-y-3.5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Exhibition Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#5C5548] shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-[#8C6D3F]" />
              <span>{lang === 'th' ? 'นิทรรศการ:' : 'Exhibition:'}</span>
            </span>
            <select
              value={selectedExhibitionId}
              onChange={(e) => setSelectedExhibitionId(e.target.value)}
              className="px-3.5 py-1.5 bg-white border border-[#D5CEC0] rounded-xl text-xs font-semibold text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F] shadow-sm"
            >
              <option value="all">
                🌟 {lang === 'th' ? `ผลงานทั้งหมดในระบบ (${initialArtworks.length} ชิ้น)` : `All Artworks (${initialArtworks.length})`}
              </option>
              {exhibitions.map((exh) => (
                <option key={exh.id} value={exh.id}>
                  🏛️ {exh.title} ({exh.artworks?.length || 0} ชิ้น)
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8C8477]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'th' ? 'ค้นหาชื่อผลงาน, ศิลปิน, ประเทศ...' : 'Search artwork, artist, country...'}
              className="w-full pl-9 pr-3.5 py-1.5 bg-white border border-[#D5CEC0] rounded-xl text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F] shadow-sm"
            />
          </div>
        </div>

        {/* Quick Auto-Sort Buttons */}
        <div className="pt-2 border-t border-[#E8E2D6] flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-[#7A7468] mr-1 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-[#8C6D3F]" />
            <span>{lang === 'th' ? 'จัดเรียงอัตโนมัติ:' : 'Auto-Sort:'}</span>
          </span>

          <button
            onClick={() => handleAutoSort('title')}
            className="px-2.5 py-1 bg-white hover:bg-[#F2ECE0] text-[#4A453C] border border-[#D5CEC0] rounded-lg text-[11px] font-medium transition-colors shadow-sm"
            title="เรียงตามชื่อผลงาน (A-Z / ก-ฮ)"
          >
            🔤 {lang === 'th' ? 'ชื่อผลงาน A-Z' : 'Title A-Z'}
          </button>

          <button
            onClick={() => handleAutoSort('artist')}
            className="px-2.5 py-1 bg-white hover:bg-[#F2ECE0] text-[#4A453C] border border-[#D5CEC0] rounded-lg text-[11px] font-medium transition-colors shadow-sm"
            title="เรียงตามชื่อศิลปิน (A-Z / ก-ฮ)"
          >
            👤 {lang === 'th' ? 'ชื่อศิลปิน A-Z' : 'Artist A-Z'}
          </button>

          <button
            onClick={() => handleAutoSort('country')}
            className="px-2.5 py-1 bg-white hover:bg-[#F2ECE0] text-[#4A453C] border border-[#D5CEC0] rounded-lg text-[11px] font-medium transition-colors shadow-sm"
            title="เรียงตามประเทศศิลปิน"
          >
            🌐 {lang === 'th' ? 'เรียงตามประเทศ' : 'Country'}
          </button>

          <button
            onClick={() => handleAutoSort('year')}
            className="px-2.5 py-1 bg-white hover:bg-[#F2ECE0] text-[#4A453C] border border-[#D5CEC0] rounded-lg text-[11px] font-medium transition-colors shadow-sm"
            title="เรียงตามปีที่สร้าง (ใหม่สุดก่อน)"
          >
            📅 {lang === 'th' ? 'ปีที่สร้าง (ใหม่สุด)' : 'Year (Newest)'}
          </button>

          <button
            onClick={() => handleAutoSort('reverse')}
            className="px-2.5 py-1 bg-white hover:bg-[#F2ECE0] text-[#4A453C] border border-[#D5CEC0] rounded-lg text-[11px] font-medium transition-colors shadow-sm"
            title="สลับลำดับย้อนกลับ"
          >
            🔄 {lang === 'th' ? 'สลับย้อนกลับ' : 'Reverse'}
          </button>
        </div>
      </div>

      {/* Instruction Tip */}
      <div className="flex items-center gap-2 p-3 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 shadow-sm">
        <Info className="w-4 h-4 text-amber-700 shrink-0" />
        <span>
          {lang === 'th'
            ? '💡 คำแนะนำ: คุณสามารถคลิกที่ปุ่มตัวเลขลำดับเพื่อพิมพ์เปลี่ยนเลขได้ทันที หรือคลิกค้างที่ไอคอน ⠿ เพื่อลากวางสลับตำแหน่ง'
            : '💡 Tip: You can type a new number into the sequence box to jump directly, or hold ⠿ to drag and drop rows.'}
        </span>
      </div>

      {/* Artworks Reorderable Table */}
      <div className="bg-white rounded-2xl border border-[#E0D9CD] shadow-sm overflow-hidden animate-fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-[#2C2925]">
            <thead>
              <tr className="bg-[#1A1918] text-[#E5D2B8] text-xs font-bold uppercase tracking-wider border-b border-[#33302C]">
                <th className="py-4 px-3 w-28 text-center">{lang === 'th' ? 'ลำดับแสดง' : 'Order #'}</th>
                <th className="py-4 px-3 w-10 text-center"></th>
                <th className="py-4 px-4">{lang === 'th' ? 'ผลงานศิลปะ' : 'Artwork Title'}</th>
                <th className="py-4 px-4">{lang === 'th' ? 'ศิลปินผู้สร้างสรรค์' : 'Artist'}</th>
                <th className="py-4 px-3 text-center">{lang === 'th' ? 'สัญชาติ' : 'Country'}</th>
                <th className="py-4 px-4">{lang === 'th' ? 'เทคนิค & ขนาด' : 'Medium & Size'}</th>
                <th className="py-4 px-3 text-center">{lang === 'th' ? 'ปีที่สร้าง' : 'Year'}</th>
                <th className="py-4 px-4 text-right">{lang === 'th' ? 'ย้ายตำแหน่ง' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0ECE4]">
              {filteredArtworks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8C8477]">
                    {lang === 'th' ? 'ไม่พบผลงานศิลปะตามเงื่อนไขที่เลือก' : 'No artworks found matching filter'}
                  </td>
                </tr>
              ) : (
                filteredArtworks.map((art, idx) => {
                  const isDragged = draggedIndex === idx;
                  const isDragOver = dragOverIndex === idx;

                  return (
                    <tr
                      key={art.id}
                      draggable={true}
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDrop={() => handleDrop(idx)}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors group select-none ${
                        isDragged
                          ? 'opacity-40 bg-[#FAF4EB]'
                          : isDragOver
                          ? 'bg-[#EAE2D2] border-t-2 border-b-2 border-[#8C6D3F]'
                          : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {/* Numeric Order Input & Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="number"
                            min={1}
                            max={artworksList.length}
                            value={art.displayOrder ?? idx + 1}
                            onChange={(e) =>
                              handleOrderInputChange(art.id, parseInt(e.target.value, 10))
                            }
                            className="w-14 h-8 px-1.5 text-center font-mono text-xs font-bold text-[#1A1918] bg-white border-2 border-[#D5CEC0] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8C6D3F] focus:border-[#8C6D3F]"
                            title={lang === 'th' ? 'พิมพ์เลขเพื่อเปลี่ยนลำดับทันที' : 'Edit number to jump sequence'}
                          />
                        </div>
                      </td>

                      {/* Drag Handle Grip Icon */}
                      <td className="py-3.5 px-2 text-center cursor-grab active:cursor-grabbing text-[#A8A295] group-hover:text-[#8C6D3F] transition-colors">
                        <div className="p-1.5 rounded hover:bg-[#EAE5DC] inline-block" title="คลิกค้างเพื่อลากวาง">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      </td>

                      {/* Artwork Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 shrink-0 shadow-sm border border-[#E0D9CD]">
                            <img
                              src={art.imageUrl}
                              alt={art.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-serif text-sm font-bold text-[#1A1918] block leading-tight">
                              {art.title}
                            </span>
                            {art.price ? (
                              <span className="text-[11px] font-semibold text-[#8C6D3F] mt-0.5 block">
                                {formatPrice(art.price)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      {/* Artist */}
                      <td className="py-3.5 px-4 font-semibold text-[#1A1918]">
                        {art.artist?.name || 'Artist'}
                      </td>

                      {/* Country */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <CountryFlag country={art.artist?.country} size="xs" shape="circle" />
                          <span className="text-[11px] text-[#4A453C] font-medium">
                            {art.artist?.country || 'International'}
                          </span>
                        </div>
                      </td>

                      {/* Medium & Dimensions */}
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-[#2E2A24] block">{art.medium || '-'}</span>
                        <span className="text-[11px] text-[#7A7468] block">
                          {formatDimensionsInCm(art.dimensions, lang)}
                        </span>
                      </td>

                      {/* Year */}
                      <td className="py-3.5 px-3 text-center font-mono text-[#524D43] font-semibold">
                        {art.yearCreated || '2026'}
                      </td>

                      {/* Move Up / Down Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Jump to Top */}
                          <button
                            onClick={() => handleJumpToTop(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded-lg text-[#7A7468] hover:text-[#1A1918] hover:bg-[#EAE5DC] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title={lang === 'th' ? 'ย้ายไปบนสุด' : 'Jump to Top'}
                          >
                            <ArrowUpToLine className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Up 1 step */}
                          <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded-lg text-[#7A7468] hover:text-[#1A1918] hover:bg-[#EAE5DC] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title={lang === 'th' ? 'เลื่อนขึ้น 1 ลำดับ' : 'Move Up'}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          {/* Move Down 1 step */}
                          <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === artworksList.length - 1}
                            className="p-1 rounded-lg text-[#7A7468] hover:text-[#1A1918] hover:bg-[#EAE5DC] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title={lang === 'th' ? 'เลื่อนลง 1 ลำดับ' : 'Move Down'}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {/* Jump to Bottom */}
                          <button
                            onClick={() => handleJumpToBottom(idx)}
                            disabled={idx === artworksList.length - 1}
                            className="p-1 rounded-lg text-[#7A7468] hover:text-[#1A1918] hover:bg-[#EAE5DC] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title={lang === 'th' ? 'ย้ายไปล่างสุด' : 'Jump to Bottom'}
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
