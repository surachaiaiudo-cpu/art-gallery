'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Exhibition, Artwork } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { parseArtworkDimensions, formatDimensionsInCm } from '@/lib/utils';
import {
  Plus,
  ArrowLeft,
  Box,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  Palette,
  Layers,
  Sparkles,
  ExternalLink,
  BookOpen,
  FileSpreadsheet,
  Download,
  Upload,
  Table as TableIcon,
  LayoutGrid,
  Search,
  Check,
  Wand2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUpToLine,
  ArrowDownToLine,
  Save,
  Info,
  CheckSquare,
  Square,
} from 'lucide-react';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { ImageUploadDropzone } from '@/components/ui/ImageUploadDropzone';
import { smartDetectArtwork, parseTabularText } from '@/lib/smartParser';
import { BatchImportManager } from '@/components/admin/BatchImportManager';

interface AdminExhibitionArtworksClientProps {
  exhibition: Exhibition;
  allArtworksLibrary: Artwork[];
}

interface ParsedBatchRow {
  title: string;
  artistName: string;
  artistCountry: string;
  artistEmail?: string;
  medium: string;
  dimensions: string;
  yearCreated: string | number;
  concept: string;
  imageUrl: string;
}

export function AdminExhibitionArtworksClient({
  exhibition: initialExhibition,
  allArtworksLibrary: initialLibrary,
}: AdminExhibitionArtworksClientProps) {
  const { lang, t } = useLanguage();
  const [exhibition, setExhibition] = useState<Exhibition>(initialExhibition);
  const [libraryArtworks, setLibraryArtworks] = useState<Artwork[]>(initialLibrary);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreateNewModalOpen, setIsCreateNewModalOpen] = useState(false);
  const [isBatchImportModalOpen, setIsBatchImportModalOpen] = useState(false);
  const [editingArtwork, setEditingArtwork] = useState<Artwork | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Artwork display order state
  const [artworksList, setArtworksList] = useState<Artwork[]>(initialExhibition.artworks || []);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Multi-selection state for batch delete
  const [selectedArtworkIds, setSelectedArtworkIds] = useState<string[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Sync artworksList and prune selectedArtworkIds when exhibition changes
  useEffect(() => {
    if (exhibition.artworks) {
      const sorted = [...exhibition.artworks]
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
        .map((art, idx) => ({
          ...art,
          displayOrder: idx + 1,
        }));
      setArtworksList(sorted);
      setHasChanges(false);
      const existingIds = new Set(exhibition.artworks.map((a) => a.id));
      setSelectedArtworkIds((prev) => prev.filter((id) => existingIds.has(id)));
    }
  }, [exhibition]);

  // Batch Import States
  const [rawPastedText, setRawPastedText] = useState('');
  const [smartPasteInput, setSmartPasteInput] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedBatchRow[]>([]);
  const [allArtists, setAllArtists] = useState<any[]>(exhibition.artists || []);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch all artists from database
  useEffect(() => {
    fetch('/api/admin/artists')
      .then((res) => res.json())
      .then((data) => {
        if (data.artists && data.artists.length > 0) {
          setAllArtists(data.artists);
        }
      })
      .catch(console.error);
  }, []);

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

    const resequenced = updated.map((item, idx) => ({
      ...item,
      displayOrder: idx + 1,
    }));

    setArtworksList(resequenced);
    setHasChanges(true);
  };

  // Handle direct numeric input change
  const handleOrderInputChange = (artId: string, newOrderVal: number) => {
    if (isNaN(newOrderVal) || newOrderVal < 1) return;
    const targetOrder = Math.min(newOrderVal, artworksList.length);
    const currentIndex = artworksList.findIndex((a) => a.id === artId);
    if (currentIndex === -1) return;

    moveItem(currentIndex, targetOrder - 1);
  };

  // Move 1 step up
  const handleMoveUp = (index: number) => {
    if (index > 0) moveItem(index, index - 1);
  };

  // Move 1 step down
  const handleMoveDown = (index: number) => {
    if (index < artworksList.length - 1) moveItem(index, index + 1);
  };

  // Jump to Top
  const handleJumpToTop = (index: number) => {
    if (index > 0) moveItem(index, 0);
  };

  // Jump to Bottom
  const handleJumpToBottom = (index: number) => {
    if (index < artworksList.length - 1) moveItem(index, artworksList.length - 1);
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

  // Auto-Sort Presets
  const handleAutoSort = (sortType: 'import' | 'title' | 'artist' | 'country' | 'year' | 'reverse') => {
    const updated = [...artworksList];

    if (sortType === 'import') {
      // Sort by creation timestamp or original database display order
      updated.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return a.createdAt.localeCompare(b.createdAt);
        }
        return (a.displayOrder || 0) - (b.displayOrder || 0);
      });
    } else if (sortType === 'title') {
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
      lang === 'th' ? 'จัดเรียงลำดับใหม่เรียบร้อยแล้ว (อย่าลืมกดบันทึก)' : 'Order re-sorted (Remember to save)'
    );
  };

  // Save new display order to database
  const handleSaveOrder = async () => {
    try {
      setIsSavingOrder(true);
      const orderedArtworkIds = artworksList.map((a) => a.id);
      const res = await fetch('/api/admin/artworks/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exhibitionId: exhibition.id,
          orderedArtworkIds,
        }),
      });

      if (!res.ok) throw new Error('Failed to save order');

      setHasChanges(false);
      showNotification(
        'success',
        lang === 'th'
          ? `บันทึกลำดับผลงานในนิทรรศการ ${artworksList.length} ชิ้น เรียบร้อยแล้ว`
          : `Saved exhibition display order for ${artworksList.length} artworks!`
      );
    } catch (err: any) {
      console.error('Error saving order:', err);
      showNotification('error', err.message || 'Error saving display order');
    } finally {
      setIsSavingOrder(false);
    }
  };

  // Handle single-row Smart Paste and Auto-Detection
  const handleSmartPaste = (text: string) => {
    setSmartPasteInput(text);
    if (!text.trim()) return;

    const detected = smartDetectArtwork(text);
    setArtworkForm((prev) => ({
      ...prev,
      title: detected.title || prev.title,
      artistName: detected.artistName || prev.artistName,
      medium: detected.medium || prev.medium,
      dimensions: detected.dimensions || prev.dimensions,
      yearCreated: detected.yearCreated
        ? parseInt(String(detected.yearCreated), 10) || prev.yearCreated
        : prev.yearCreated,
      concept: detected.concept || prev.concept,
      imageUrl: detected.imageUrl || prev.imageUrl,
    }));

    showNotification('success', lang === 'th' ? '✨ ระบบตรวจจับและแยกข้อมูลลงช่องให้อัตโนมัติแล้ว!' : '✨ Fields auto-detected & populated!');
  };

  // Form for New / Edit Artwork
  const [artworkForm, setArtworkForm] = useState({
    title: '',
    artistId: '',
    artistName: '',
    medium: '',
    dimensions: '',
    yearCreated: 2026,
    concept: '',
    description: '',
    imageUrl: '',
  });

  const refreshExhibition = async () => {
    try {
      const res = await fetch(`/api/exhibitions/${exhibition.slug}?_t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.exhibition) {
        setExhibition(data.exhibition);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Link existing artwork to exhibition
  const handleLinkArtwork = async (artId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/exhibitions/${exhibition.id}/artworks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId: artId }),
      });

      if (!res.ok) throw new Error('Failed to add artwork');
      showNotification('success', lang === 'th' ? 'เพิ่มผลงานเข้านิทรรศการแล้ว' : 'Artwork added to exhibition');
      setIsAddModalOpen(false);
      await refreshExhibition();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle selection for single artwork
  const toggleSelectArtwork = (artId: string) => {
    setSelectedArtworkIds((prev) =>
      prev.includes(artId) ? prev.filter((id) => id !== artId) : [...prev, artId]
    );
  };

  // Toggle select all filtered artworks
  const toggleSelectAllFiltered = () => {
    const visibleIds = filteredCurrentArtworks.map((a) => a.id);
    if (visibleIds.length === 0) return;
    const allSelected = visibleIds.every((id) => selectedArtworkIds.includes(id));

    if (allSelected) {
      // Deselect all visible
      setSelectedArtworkIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      // Add all visible to selection
      setSelectedArtworkIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  };

  // Clear all selections
  const handleClearSelection = () => {
    setSelectedArtworkIds([]);
  };

  // Remove single artwork from exhibition
  const handleRemoveArtwork = async (artId: string, artTitle: string) => {
    if (!confirm(lang === 'th' ? `นำ "${artTitle}" ออกจากนิทรรศการนี้หรือไม่?` : `Remove "${artTitle}" from this exhibition?`)) {
      return;
    }

    // Immediately re-sequence client-side state
    setArtworksList((prev) =>
      prev
        .filter((a) => a.id !== artId)
        .map((item, idx) => ({ ...item, displayOrder: idx + 1 }))
    );

    try {
      const res = await fetch(`/api/admin/exhibitions/${exhibition.id}/artworks?artworkId=${artId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showNotification('success', lang === 'th' ? 'นำผลงานออกและไล่เรียงลำดับใหม่สำเร็จ' : 'Artwork removed & re-sequenced');
        setSelectedArtworkIds((prev) => prev.filter((id) => id !== artId));
        await refreshExhibition();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove multiple selected artworks from exhibition (Batch Delete)
  const handleBatchRemoveArtworks = async () => {
    const count = selectedArtworkIds.length;
    if (count === 0) return;

    const confirmMsg =
      lang === 'th'
        ? `⚠️ คุณแน่ใจหรือไม่ว่าต้องการนำผลงานที่เลือกทั้งหมด ${count} รายการ ออกจากนิทรรศการนี้?`
        : `⚠️ Are you sure you want to remove all ${count} selected artworks from this exhibition?`;

    if (!confirm(confirmMsg)) {
      return;
    }

    const removedIds = [...selectedArtworkIds];

    // Immediately re-sequence client-side state
    setArtworksList((prev) =>
      prev
        .filter((a) => !removedIds.includes(a.id))
        .map((item, idx) => ({ ...item, displayOrder: idx + 1 }))
    );

    setIsBulkDeleting(true);
    try {
      const idsParam = encodeURIComponent(removedIds.join(','));
      const res = await fetch(`/api/admin/exhibitions/${exhibition.id}/artworks?artworkIds=${idsParam}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkIds: removedIds }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove selected artworks');
      }

      showNotification(
        'success',
        lang === 'th'
          ? `นำผลงาน ${count} รายการออกและไล่เรียงลำดับใหม่เรียบร้อยแล้ว`
          : `Successfully removed ${count} artworks and re-sequenced order!`
      );
      setSelectedArtworkIds([]);
      await refreshExhibition();
    } catch (err: any) {
      console.error(err);
      showNotification('error', err.message || 'Error removing artworks');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (art: Artwork) => {
    setEditingArtwork(art);
    setArtworkForm({
      title: art.title,
      artistId: art.artistId || '',
      artistName: art.artist?.name || '',
      medium: art.medium || '',
      dimensions: art.dimensions || '120 x 180 cm.',
      yearCreated: art.yearCreated || 2026,
      concept: art.concept || art.description || '',
      description: art.description || '',
      imageUrl: art.imageUrl || '',
    });
  };

  // Submit Artwork Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArtwork) return;

    // Optimistic UI update
    setArtworksList((prev) =>
      prev.map((art) =>
        art.id === editingArtwork.id
          ? {
              ...art,
              title: artworkForm.title,
              medium: artworkForm.medium,
              dimensions: artworkForm.dimensions,
              yearCreated: artworkForm.yearCreated,
              imageUrl: artworkForm.imageUrl,
              concept: artworkForm.concept,
            }
          : art
      )
    );

    setLoading(true);

    try {
      const res = await fetch('/api/admin/artworks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingArtwork.id,
          ...artworkForm,
        }),
      });

      if (!res.ok) throw new Error('Failed to update artwork');
      showNotification('success', lang === 'th' ? 'บันทึกรายละเอียดผลงานสำเร็จ' : 'Artwork details updated');
      setEditingArtwork(null);
      await refreshExhibition();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create brand new artwork and link directly to exhibition
  const handleCreateAndLinkNewArtwork = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/artworks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...artworkForm,
          exhibitionId: exhibition.id,
        }),
      });

      if (!res.ok) throw new Error('Failed to create artwork');
      showNotification('success', lang === 'th' ? 'สร้างผลงานใหม่และเพิ่มเข้านิทรรศการแล้ว' : 'Artwork created & added');
      setIsCreateNewModalOpen(false);
      await refreshExhibition();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Parse Raw Excel Paste (TSV / CSV)
  const parseExcelText = (text: string) => {
    setRawPastedText(text);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const detected = parseTabularText(text);
    setParsedRows(
      detected.map((d) => ({
        title: d.title,
        artistName: d.artistName,
        artistCountry: d.artistCountry,
        artistEmail: d.artistEmail,
        medium: d.medium,
        dimensions: d.dimensions,
        yearCreated: d.yearCreated,
        concept: d.concept,
        imageUrl: d.imageUrl,
      }))
    );
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        parseExcelText(text);
      }
    };
    reader.readAsText(file);
  };

  // Download Sample Excel Template (CSV)
  const handleDownloadSampleTemplate = () => {
    const headers = 'ชื่อศิลปิน (Artist)\tประเทศ (Country)\temail\tชื่อผลงาน (Title)\tเทคนิค (Medium)\tขนาด (Dimensions)\tหน่วยวัด (Unit)\tconcept\tURL รูปภาพ (Image URL)\n';
    const sampleData = [
      'สมชาย ใจเย็น\tThailand\tsomchai@gmail.com\tแสงอรุณเหนือวิหารหลวง\tOil on Canvas\t140 x 200\tcm.\tแสงแรกแห่งวันสะท้อนองค์พระปรางค์โบราณ สัญลักษณ์แห่งการเกิดใหม่ทางจิตวิญญาณ\thttps://images.unsplash.com/photo-1528181304800-259b08848526?q=80&w=1200&auto=format&fit=crop',
      'Elena Rossi\tItaly\telena.rossi@art.it\tเสียงสะท้อนแห่งความเงียบ\tTempera & Gold Leaf on Linen\t110 x 160\tcm.\tการตีความมิติทางประวัติศาสตร์การค้าทางทะเลผ่านศิลปะยุคฟื้นฟูศิลปวิทยา\thttps://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
      'Kenji Takahashi\tJapan\tkenji@kyoto-art.jp\tสัจธรรมแห่งสายน้ำ\tInk and Acrylic on Washi Paper\t100 x 150\tcm.\tความสงบนิ่งและจิตวิญญาณแห่งความเรียบง่ายตามปรัชญาเซนริมแม่น้ำเจ้าพระยา\thttps://images.unsplash.com/photo-1552465011-b4e21bf6e79a?q=80&w=1200&auto=format&fit=crop',
    ].join('\n');

    const blob = new Blob(['\uFEFF' + headers + sampleData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'artvara_artworks_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Execute Batch Import
  const handleExecuteBatchImport = async () => {
    if (parsedRows.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch('/api/admin/artworks/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: parsedRows,
          exhibitionId: exhibition.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Batch import failed');

      showNotification(
        'success',
        lang === 'th'
          ? `นำเข้าผลงานสำเร็จทั้งหมด ${data.count} ชิ้นเรียบร้อยแล้ว!`
          : `Successfully batch imported ${data.count} artworks!`
      );
      setIsBatchImportModalOpen(false);
      setParsedRows([]);
      setRawPastedText('');
      await refreshExhibition();
    } catch (err: any) {
      showNotification('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentArtworks = artworksList;
  const currentArtIds = new Set(currentArtworks.map((a) => a.id));
  const availableLibrary = libraryArtworks.filter((a) => !currentArtIds.has(a.id));

  const filteredCurrentArtworks = currentArtworks.filter((art) => {
    const q = searchQuery.toLowerCase();
    return (
      art.title.toLowerCase().includes(q) ||
      (art.artist?.name || '').toLowerCase().includes(q) ||
      (art.artist?.country || '').toLowerCase().includes(q) ||
      (art.medium || '').toLowerCase().includes(q) ||
      (art.dimensions || '').toLowerCase().includes(q) ||
      (art.concept || '').toLowerCase().includes(q)
    );
  });

  const visibleIds = filteredCurrentArtworks.map((a) => a.id);
  const isAllFilteredSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedArtworkIds.includes(id));
  const isPartiallySelected =
    visibleIds.some((id) => selectedArtworkIds.includes(id)) && !isAllFilteredSelected;

  return (
    <div className="max-w-6xl mx-auto space-y-6 select-none pb-20">
      {/* Top Header Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DCD5C8] pb-6">
        <div>
          <Link
            href="/admin/exhibitions"
            className="inline-flex items-center gap-1.5 text-xs text-[#8C6D3F] hover:underline font-semibold mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'กลับหน้ารายการนิทรรศการ' : 'Back to Exhibitions'}</span>
          </Link>
          <h1 className="font-serif text-3xl font-bold text-[#1A1918]">
            {lang === 'th' ? 'จัดการผลงานในนิทรรศการ' : 'Exhibition Artworks Curator'}
          </h1>
          <p className="text-xs text-[#6E685C] mt-1">
            {lang === 'th' ? 'นิทรรศการ' : 'Exhibition'}:{' '}
            <span className="font-semibold text-[#1A1918]">{exhibition.title}</span> (
            {currentArtworks.length} {t.lobby.artworksCount})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Save Display Order Button */}
          {hasChanges && (
            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full animate-pulse flex items-center gap-1 border border-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{lang === 'th' ? 'มีลำดับเปลี่ยนแปลง' : 'Unsaved Order'}</span>
            </span>
          )}

          <button
            onClick={handleSaveOrder}
            disabled={isSavingOrder || !hasChanges}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95 ${
              hasChanges
                ? 'bg-[#1A1918] hover:bg-[#33302C] text-white ring-2 ring-[#8C6D3F]'
                : 'bg-neutral-200 text-neutral-400 cursor-not-allowed opacity-60'
            }`}
          >
            {isSavingOrder ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Save className="w-4 h-4 text-[#C5A880]" />
            )}
            <span>
              {isSavingOrder
                ? lang === 'th'
                  ? 'กำลังบันทึก...'
                  : 'Saving Order...'
                : lang === 'th'
                ? 'บันทึกลำดับการแสดงผล'
                : 'Save Display Order'}
            </span>
          </button>

          {/* Batch Excel Import Button */}
          <button
            onClick={() => setIsBatchImportModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95"
            title="Import multiple artworks directly from Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
            <span>{lang === 'th' ? 'นำเข้าจาก Excel' : 'Excel Import'}</span>
          </button>

          <Link
            href={`/admin/exhibitions/${exhibition.id}`}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#C5A880] hover:bg-[#D4BC96] text-[#1A1918] rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all"
          >
            <Box className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'จัดผัง 3D' : '3D Walls'}</span>
          </Link>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all"
          >
            <Plus className="w-4 h-4 text-[#C5A880]" />
            <span>{lang === 'th' ? 'เพิ่มผลงาน' : 'Add Artwork'}</span>
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

      {/* Toolbar: Search + Multi-select Controls + Auto-Sort + View Mode Switcher */}
      <div className="bg-[#FAF8F5] border border-[#E0D9CD] p-4 rounded-2xl shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#8C6D3F] absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'th' ? 'ค้นหาชื่อผลงาน, ศิลปิน, สัญชาติ, เทคนิค...' : 'Search artwork title, artist, medium...'}
              className="w-full pl-10 pr-8 py-2 bg-white border border-[#DDD6C8] rounded-xl text-xs text-[#1A1918] placeholder-[#A0988A] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F] shadow-sm"
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

          {/* Multi-Select Quick Action Bar & View Mode Toggle Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap justify-between md:justify-end">
            {/* Select All Button */}
            <button
              onClick={toggleSelectAllFiltered}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm active:scale-95 ${
                isAllFilteredSelected
                  ? 'bg-[#1A1918] text-[#E5D2B8] border-[#1A1918]'
                  : isPartiallySelected
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white hover:bg-[#F2ECE0] text-[#4A453C] border-[#DDD6C8]'
              }`}
              title="เลือกผลงานทั้งหมดที่แสดงอยู่เพื่อลบหรือจัดการพร้อมกัน"
            >
              <CheckSquare className="w-3.5 h-3.5 text-[#8C6D3F]" />
              <span>
                {isAllFilteredSelected
                  ? lang === 'th'
                    ? 'ยกเลิกเลือกทั้งหมด'
                    : 'Deselect All'
                  : lang === 'th'
                  ? `เลือกทั้งหมด (${filteredCurrentArtworks.length})`
                  : `Select All (${filteredCurrentArtworks.length})`}
              </span>
            </button>

            {/* Batch Delete Trigger Button in Toolbar (Visible when items selected) */}
            {selectedArtworkIds.length > 0 && (
              <button
                onClick={handleBatchRemoveArtworks}
                disabled={isBulkDeleting}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow border border-rose-500 animate-fade-in"
                title="ลบผลงานที่เลือกทั้งหมดออกจากนิทรรศการนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {isBulkDeleting
                    ? lang === 'th'
                      ? 'กำลังลบ...'
                      : 'Deleting...'
                    : lang === 'th'
                    ? `ลบที่เลือก (${selectedArtworkIds.length})`
                    : `Delete (${selectedArtworkIds.length})`}
                </span>
              </button>
            )}

            <span className="text-xs text-[#7A7468] font-medium hidden lg:inline border-l border-[#DCD5C8] pl-2.5">
              {lang === 'th' ? `ผลงาน ${filteredCurrentArtworks.length} ชิ้น` : `${filteredCurrentArtworks.length} Artworks`}
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

        {/* Quick Auto-Sort Presets */}
        <div className="pt-2.5 border-t border-[#E8E2D6] flex items-center gap-2 flex-wrap text-xs">
          <span className="text-[11px] font-bold text-[#7A7468] mr-1 flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3 text-[#8C6D3F]" />
            <span>{lang === 'th' ? 'จัดเรียง:' : 'Sort:'}</span>
          </span>

          <button
            onClick={() => handleAutoSort('import')}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[11px] font-bold transition-colors shadow-sm flex items-center gap-1"
            title="เรียงตามลำดับที่นำเข้าจริงจากตาราง Excel"
          >
            📥 {lang === 'th' ? 'ลำดับการนำเข้า (Import Order)' : 'Import Order'}
          </button>

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
            ? '💡 คำแนะนำ: คุณสามารถคลิกเลือกหลายรายการเพื่อลบพร้อมกัน หรือพิมพ์เลขลำดับ [ 1, 2, 3... ] และลากวางสลับตำแหน่งผลงานได้ทันที'
            : '💡 Tip: You can select multiple artworks to delete in bulk, or reorder by dragging ⠿ handles.'}
        </span>
      </div>

      {/* MODE 1: GRID CARDS VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCurrentArtworks.map((art, idx) => {
            const isDragged = draggedIndex === idx;
            const isDragOver = dragOverIndex === idx;
            const isSelected = selectedArtworkIds.includes(art.id);

            const actualIndex = artworksList.findIndex((a) => a.id === art.id);
            const currentDisplayNumber = actualIndex !== -1 ? actualIndex + 1 : idx + 1;

            return (
              <div
                key={art.id}
                draggable={true}
                onDragStart={() => handleDragStart(actualIndex !== -1 ? actualIndex : idx)}
                onDragOver={(e) => handleDragOver(e, actualIndex !== -1 ? actualIndex : idx)}
                onDrop={() => handleDrop(actualIndex !== -1 ? actualIndex : idx)}
                onDragEnd={handleDragEnd}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between select-none ${
                  isDragged
                    ? 'opacity-40 border-dashed border-[#8C6D3F] bg-[#FAF4EB]'
                    : isDragOver
                    ? 'border-2 border-[#8C6D3F] ring-4 ring-[#8C6D3F]/20'
                    : isSelected
                    ? 'border-rose-400 ring-2 ring-rose-500 bg-rose-50/20'
                    : 'border-[#DDD6C8]'
                }`}
              >
                <div>
                  {/* Artwork Thumbnail with Sequence Reorder Controls & Multi-Select Checkbox */}
                  <div className="relative aspect-[4/3] bg-[#FAF8F5] overflow-hidden">
                    <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover" />

                    {/* Top Overlay: Checkbox + Sequence Number Input + Drag Grip Handle */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-auto">
                      <div className="flex items-center gap-1.5">
                        {/* Multi-Select Checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectArtwork(art.id);
                          }}
                          className={`flex items-center justify-center w-7 h-7 rounded-lg transition-all shadow border ${
                            isSelected
                              ? 'bg-rose-600 border-rose-400 text-white ring-2 ring-rose-400/50'
                              : 'bg-black/75 hover:bg-black/90 border-white/30 text-white/70 hover:text-white'
                          }`}
                          title={
                            isSelected
                              ? lang === 'th'
                                ? 'ยกเลิกเลือก'
                                : 'Deselect'
                              : lang === 'th'
                              ? 'เลือกผลงานนี้เพื่อลบหลายรายการ'
                              : 'Select artwork for bulk delete'
                          }
                        >
                          {isSelected ? (
                            <Check className="w-4 h-4 stroke-[3]" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded border border-white/60" />
                          )}
                        </button>

                        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 shadow">
                          <span className="text-[10px] text-[#C5A880] font-bold">#</span>
                          <input
                            type="number"
                            min={1}
                            max={artworksList.length}
                            value={currentDisplayNumber}
                            onChange={(e) =>
                              handleOrderInputChange(art.id, parseInt(e.target.value, 10))
                            }
                            className="w-10 h-6 text-center font-mono text-xs font-bold text-white bg-white/20 rounded border border-white/30 focus:outline-none focus:ring-1 focus:ring-[#C5A880]"
                            title="พิมพ์เพื่อเปลี่ยนลำดับทันที"
                          />
                        </div>
                      </div>

                      {/* Grip Drag Handle */}
                      <div
                        className="p-1.5 bg-black/80 backdrop-blur-md rounded-lg border border-white/20 text-white hover:text-[#C5A880] cursor-grab active:cursor-grabbing shadow"
                        title="คลิกค้างเพื่อลากวางสลับตำแหน่ง"
                      >
                        <GripVertical className="w-4 h-4" />
                      </div>
                    </div>

                    <span className="absolute bottom-2.5 right-2.5 px-2.5 py-1 bg-black/80 text-white text-[10px] font-mono rounded shadow border border-white/10">
                      {formatDimensionsInCm(art.dimensions, lang)}
                    </span>
                  </div>

                  {/* Content info */}
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full overflow-hidden border border-[#C5A880] shadow-sm flex items-center justify-center bg-white"
                        title={art.artist?.country || 'Country'}
                      >
                        <CountryFlag country={art.artist?.country} size="badge" shape="circle" />
                      </div>
                      <p className="text-xs text-[#5A554A] font-bold truncate">{art.artist?.name || 'Artist'}</p>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-[#1A1918] leading-snug">
                      {art.title}
                    </h3>

                    <p className="text-[11px] text-[#7A7468]">
                      {art.medium} • {formatDimensionsInCm(art.dimensions, lang)} • {art.yearCreated}
                    </p>

                    {art.concept && (
                      <p className="text-xs text-[#6E685C] italic line-clamp-3 bg-[#FAF8F5] p-3 rounded-lg border border-[#EAE4D8] font-serif">
                        "{art.concept}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions & Up/Down Buttons */}
                <div className="p-5 pt-0 border-t border-[#F0ECE4] flex items-center justify-between pt-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(art)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#EFEBE2] text-[#1A1918] border border-[#D5CEC0] rounded-lg text-xs font-semibold transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#8C6D3F]" />
                      <span>{lang === 'th' ? 'แก้ไข' : 'Edit'}</span>
                    </button>

                    <button
                      onClick={() => handleRemoveArtwork(art.id, art.title)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                      title="นำออกจากนิทรรศการนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Move Up / Down Buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUp(idx)}
                      disabled={idx === 0}
                      className="p-1 rounded bg-[#FAF8F5] text-[#7A7468] hover:text-[#1A1918] border border-[#DDD6C8] disabled:opacity-30 transition-colors"
                      title="เลื่อนขึ้น 1 ลำดับ"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(idx)}
                      disabled={idx === artworksList.length - 1}
                      className="p-1 rounded bg-[#FAF8F5] text-[#7A7468] hover:text-[#1A1918] border border-[#DDD6C8] disabled:opacity-30 transition-colors"
                      title="เลื่อนลง 1 ลำดับ"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCurrentArtworks.length === 0 && (
            <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-dashed border-[#DDD6C8] space-y-4">
              <Palette className="w-10 h-10 text-[#8C6D3F] mx-auto opacity-50" />
              <h3 className="font-serif text-lg font-bold text-[#1A1918]">
                {lang === 'th' ? 'ไม่พบผลงานที่ตรงกับการค้นหา' : 'No artworks found'}
              </h3>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: TABLE VIEW (ตารางจัดการผลงานในนิทรรศการ) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-[#E0D9CD] shadow-sm overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1A1918] text-[#E5D2B8] text-xs font-bold uppercase tracking-wider border-b border-[#33302C]">
                  {/* Select All Checkbox Header */}
                  <th className="py-4 px-3 w-10 text-center">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center cursor-pointer"
                      title={lang === 'th' ? 'เลือกทั้งหมด / ยกเลิก' : 'Select / Deselect All'}
                    >
                      <input
                        type="checkbox"
                        checked={isAllFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        className="w-4 h-4 rounded border-[#D5CEC0] text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                      />
                    </label>
                  </th>
                  <th className="py-4 px-3 w-20 text-center">{lang === 'th' ? 'ลำดับ' : 'Order #'}</th>
                  <th className="py-4 px-2 w-8 text-center"></th>
                  <th className="py-4 px-4">{lang === 'th' ? 'ผลงานศิลปะ' : 'Artwork'}</th>
                  <th className="py-4 px-4">{lang === 'th' ? 'ศิลปินผู้สร้างสรรค์' : 'Artist'}</th>
                  <th className="py-4 px-3 text-center w-16">{lang === 'th' ? 'สัญชาติ' : 'Country'}</th>
                  <th className="py-4 px-4">{lang === 'th' ? 'เทคนิค / วัสดุ' : 'Medium'}</th>
                  <th className="py-4 px-4">{lang === 'th' ? 'ขนาดผลงาน' : 'Dimensions'}</th>
                  <th className="py-4 px-3 text-center">{lang === 'th' ? 'ปี' : 'Year'}</th>
                  <th className="py-4 px-4 text-right">{lang === 'th' ? 'การจัดการ' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0ECE4] text-xs text-[#2C2925]">
                {filteredCurrentArtworks.map((art, idx) => {
                  const actualIndex = artworksList.findIndex((a) => a.id === art.id);
                  const currentDisplayNumber = actualIndex !== -1 ? actualIndex + 1 : idx + 1;
                  const isDragged = draggedIndex === (actualIndex !== -1 ? actualIndex : idx);
                  const isDragOver = dragOverIndex === (actualIndex !== -1 ? actualIndex : idx);
                  const isSelected = selectedArtworkIds.includes(art.id);

                  return (
                    <tr
                      key={art.id}
                      draggable={true}
                      onDragStart={() => handleDragStart(actualIndex !== -1 ? actualIndex : idx)}
                      onDragOver={(e) => handleDragOver(e, actualIndex !== -1 ? actualIndex : idx)}
                      onDrop={() => handleDrop(actualIndex !== -1 ? actualIndex : idx)}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors group select-none ${
                        isDragged
                          ? 'opacity-40 bg-[#FAF4EB]'
                          : isDragOver
                          ? 'bg-[#EAE2D2] border-t-2 border-b-2 border-[#8C6D3F]'
                          : isSelected
                          ? 'bg-rose-50/60 hover:bg-rose-50/80'
                          : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {/* Checkbox Column */}
                      <td className="py-3.5 px-3 text-center">
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectArtwork(art.id)}
                            className="w-4 h-4 rounded border-[#D5CEC0] text-rose-600 focus:ring-rose-500 accent-rose-600 cursor-pointer"
                          />
                        </label>
                      </td>

                      {/* # Numeric Order Input */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          max={artworksList.length}
                          value={currentDisplayNumber}
                          onChange={(e) =>
                            handleOrderInputChange(art.id, parseInt(e.target.value, 10))
                          }
                          className="w-14 h-8 px-1.5 text-center font-mono text-xs font-bold text-[#1A1918] bg-white border-2 border-[#D5CEC0] rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-[#8C6D3F] focus:border-[#8C6D3F]"
                          title="พิมพ์เพื่อเปลี่ยนลำดับทันที"
                        />
                      </td>

                      {/* Drag Grip Handle */}
                      <td className="py-3.5 px-2 text-center cursor-grab active:cursor-grabbing text-[#A8A295] group-hover:text-[#8C6D3F] transition-colors">
                        <div className="p-1 rounded hover:bg-[#EAE5DC] inline-block" title="คลิกค้างเพื่อลากวาง">
                          <GripVertical className="w-4 h-4" />
                        </div>
                      </td>

                      {/* Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-[#D5CEC0] bg-[#FAF8F5] shadow-sm shrink-0">
                            <img
                              src={art.imageUrl}
                              alt={art.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-serif text-sm font-bold text-[#1A1918] block leading-snug">
                              {art.title}
                            </span>
                            {art.concept && (
                              <span className="text-[11px] text-[#7A7468] line-clamp-1 max-w-[220px] italic">
                                "{art.concept}"
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Artist Name */}
                      <td className="py-3.5 px-4 font-semibold text-[#1A1918]">
                        {art.artist?.name || 'Unknown Artist'}
                      </td>

                      {/* Country Flag Bubble */}
                      <td className="py-3.5 px-3 text-center">
                        <div
                          className="inline-flex w-7 h-7 rounded-full overflow-hidden border border-[#C5A880] shadow-sm items-center justify-center bg-white"
                          title={art.artist?.country || 'Country'}
                        >
                          <CountryFlag country={art.artist?.country} size="badge" shape="circle" />
                        </div>
                      </td>

                      {/* Medium */}
                      <td className="py-3.5 px-4 text-[#4A453C]">
                        {art.medium || 'Oil on Canvas'}
                      </td>

                      {/* Real Dimensions in Centimeters */}
                      <td className="py-3.5 px-4 font-mono font-medium text-[#1A1918]">
                        <span className="inline-block bg-[#FAF8F5] text-[#8C6D3F] border border-[#DDD6C8] px-2.5 py-1 rounded-md shadow-sm font-semibold">
                          {formatDimensionsInCm(art.dimensions, lang)}
                        </span>
                      </td>

                      {/* Year */}
                      <td className="py-3.5 px-3 text-center font-mono text-[#7A7468]">
                        {art.yearCreated || '2026'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Jump to Top */}
                          <button
                            onClick={() => handleJumpToTop(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded text-[#7A7468] hover:text-[#1A1918] hover:bg-[#EAE5DC] disabled:opacity-30 transition-colors"
                            title="ย้ายไปบนสุด"
                          >
                            <ArrowUpToLine className="w-3.5 h-3.5" />
                          </button>

                          {/* Move Up */}
                          <button
                            onClick={() => handleMoveUp(idx)}
                            disabled={idx === 0}
                            className="p-1 rounded text-[#7A7468] hover:text-[#1A1918] hover:bg-[#EAE5DC] disabled:opacity-30 transition-colors"
                            title="เลื่อนขึ้น 1 ลำดับ"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>

                          {/* Move Down */}
                          <button
                            onClick={() => handleMoveDown(idx)}
                            disabled={idx === artworksList.length - 1}
                            className="p-1 rounded text-[#7A7468] hover:text-[#1A1918] hover:bg-[#EAE5DC] disabled:opacity-30 transition-colors"
                            title="เลื่อนลง 1 ลำดับ"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>

                          {/* Jump to Bottom */}
                          <button
                            onClick={() => handleJumpToBottom(idx)}
                            disabled={idx === artworksList.length - 1}
                            className="p-1 rounded text-[#7A7468] hover:text-[#1A1918] hover:bg-[#EAE5DC] disabled:opacity-30 transition-colors"
                            title="ย้ายไปล่างสุด"
                          >
                            <ArrowDownToLine className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Artwork */}
                          <button
                            onClick={() => handleOpenEdit(art)}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EFEBE2] text-[#1A1918] border border-[#D5CEC0] rounded-lg text-xs font-semibold transition-all shadow-sm ml-1"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#8C6D3F]" />
                            <span>{lang === 'th' ? 'แก้ไข' : 'Edit'}</span>
                          </button>

                          {/* Remove Artwork */}
                          <button
                            onClick={() => handleRemoveArtwork(art.id, art.title)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors"
                            title="นำออกจากนิทรรศการนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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

      {/* Floating Batch Action Bar for Multiple Deletions */}
      {selectedArtworkIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-[94%] sm:w-auto bg-[#1A1918]/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-[#C5A880]/50 flex flex-wrap items-center justify-between sm:justify-start gap-3.5 animate-slide-up">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-600 text-white font-mono text-xs font-bold shadow">
              {selectedArtworkIds.length}
            </span>
            <div className="text-xs">
              <p className="font-bold text-[#E5D2B8]">
                {lang === 'th'
                  ? `เลือกอยู่ ${selectedArtworkIds.length} รายการ`
                  : `${selectedArtworkIds.length} items selected`}
              </p>
              <p className="text-[11px] text-[#A8A295] hidden sm:block">
                {lang === 'th'
                  ? `จากผลงานในนิทรรศการทั้งหมด ${artworksList.length} รายการ`
                  : `Out of ${artworksList.length} total artworks`}
              </p>
            </div>
          </div>

          <div className="h-6 w-[1px] bg-white/15 hidden sm:block" />

          <div className="flex items-center gap-2 flex-wrap ml-auto sm:ml-0">
            <button
              onClick={toggleSelectAllFiltered}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 text-[#E5D2B8] border border-white/15 transition-all"
            >
              {isAllFilteredSelected
                ? lang === 'th'
                  ? 'ยกเลิกเลือกทั้งหมด'
                  : 'Deselect All'
                : lang === 'th'
                ? `เลือกทั้งหมด (${filteredCurrentArtworks.length})`
                : `Select All (${filteredCurrentArtworks.length})`}
            </button>

            <button
              onClick={handleClearSelection}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 transition-all"
            >
              {lang === 'th' ? 'ล้างที่เลือก' : 'Clear'}
            </button>

            <button
              onClick={handleBatchRemoveArtworks}
              disabled={isBulkDeleting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 text-white rounded-lg text-xs font-bold tracking-wide shadow-lg transition-all border border-rose-400/30"
            >
              {isBulkDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{lang === 'th' ? 'กำลังนำออก...' : 'Removing...'}</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {lang === 'th'
                      ? `นำออกจากนิทรรศการ (${selectedArtworkIds.length})`
                      : `Remove (${selectedArtworkIds.length})`}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Batch Import Excel / CSV Modal */}
      {isBatchImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-6xl bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B] max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E3DED4] pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shadow-sm">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
                    {lang === 'th' ? 'ระบบนำเข้าข้อมูลแบบกลุ่ม' : 'Bulk Batch Import'}
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1918]">
                    {lang === 'th' ? `นำเข้าผลงานเข้านิทรรศการ: ${exhibition.title}` : `Import Artworks into: ${exhibition.title}`}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => setIsBatchImportModalOpen(false)}
                className="p-2 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Batch Importer Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
              <BatchImportManager
                initialExhibitionId={exhibition.id}
                isModalMode={true}
                onSuccess={() => {
                  showNotification(
                    'success',
                    lang === 'th'
                      ? 'นำเข้าข้อมูลผลงานและศิลปินเข้านิทรรศการสำเร็จเรียบร้อยแล้ว'
                      : 'Imported artworks and artists successfully!'
                  );
                  setTimeout(() => {
                    setIsBatchImportModalOpen(false);
                    window.location.reload();
                  }, 1200);
                }}
                onClose={() => setIsBatchImportModalOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Artwork Modal (Choose from Library or Create New) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 text-[#1E1D1B] max-h-[85vh] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#E3DED4] pb-4 mb-4">
                <div>
                  <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
                    {lang === 'th' ? 'เพิ่มผลงานเข้านิทรรศการ' : 'Add Artwork to Exhibition'}
                  </span>
                  <h2 className="font-serif text-xl font-bold text-[#1A1918]">
                    {lang === 'th' ? 'เลือกผลงานจากคลังศิลปกรรม' : 'Select from Artworks Library'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Create brand new or excel import buttons */}
              <div className="mb-4 p-3.5 bg-white border border-[#E0D9CD] rounded-xl flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-[#5A554A]">
                  <span className="font-bold text-[#1A1918] block">{lang === 'th' ? 'ต้องการนำเข้าผลงานชุดใหม่?' : 'Want to add new artworks?'}</span>
                  {lang === 'th' ? 'สร้างผลงานใหม่ หรือนำเข้าจากตาราง Excel' : 'Create single artwork or import Excel table.'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setIsBatchImportModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                  >
                    📊 {lang === 'th' ? 'Excel Import' : 'Excel Import'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddModalOpen(false);
                      setArtworkForm({
                        title: '',
                        artistId: '',
                        artistName: '',
                        medium: '',
                        dimensions: '',
                        yearCreated: 2026,
                        concept: '',
                        description: '',
                        imageUrl: '',
                      });
                      setIsCreateNewModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-[#8C6D3F] hover:bg-[#A3804C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                  >
                    ➕ {lang === 'th' ? 'สร้างใหม่' : 'Create New'}
                  </button>
                </div>
              </div>

              {/* Available Library Artworks */}
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {availableLibrary.map((art) => (
                  <div
                    key={art.id}
                    className="p-3 bg-white border border-[#E8E2D6] rounded-xl flex items-center justify-between gap-3 hover:border-[#8C6D3F] transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative w-12 h-12 rounded-lg bg-[#1A1918] overflow-hidden shrink-0">
                        <Image src={art.imageUrl} alt={art.title} fill className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-serif text-xs font-bold text-[#1A1918] truncate">
                          {art.title}
                        </h4>
                        <p className="text-[11px] text-[#6E685C] truncate">{art.artist?.name}</p>
                        <p className="text-[10px] text-[#8C8477] font-mono">{art.dimensions}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleLinkArtwork(art.id)}
                      disabled={loading}
                      className="px-3.5 py-1.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shrink-0 transition-all"
                    >
                      {lang === 'th' ? 'เพิ่มเข้างาน' : 'Select'}
                    </button>
                  </div>
                ))}

                {availableLibrary.length === 0 && (
                  <div className="p-6 text-center text-xs text-[#7A7468]">
                    {lang === 'th' ? 'ผลงานในคลังทั้งหมดถูกเพิ่มเข้านิทรรศการนี้แล้ว' : 'All library artworks are already added to this exhibition.'}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E3DED4] text-right mt-4">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-[#6E685C] hover:text-[#1A1918]"
              >
                {t.inquiryModal.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Artwork Details / Create Brand New Modal */}
      {(editingArtwork || isCreateNewModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setEditingArtwork(null);
                setIsCreateNewModalOpen(false);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E3DED4] pb-4 mb-6">
              <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
                {editingArtwork ? (lang === 'th' ? 'แก้ไขรายละเอียดผลงาน' : 'Edit Artwork Details') : (lang === 'th' ? 'สร้างผลงานศิลปกรรมใหม่' : 'Create New Artwork')}
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1A1918] mt-1">
                {editingArtwork ? editingArtwork.title : (lang === 'th' ? 'กรอกข้อมูลผลงาน' : 'Artwork Information')}
              </h2>
            </div>

            {/* Smart Auto-Detect Paste Bar */}
            <div className="mb-5 p-3.5 bg-[#FAF3E8] border border-[#E5D7C2] rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8C6D3F] flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-[#8C6D3F]" />
                  <span>{lang === 'th' ? '🪄 วางข้อมูลแยกช่องอัตโนมัติ (Smart Auto-Detect Paste)' : 'Smart Auto-Detect Paste'}</span>
                </span>
                <span className="text-[10px] text-[#7A7468]">
                  {lang === 'th' ? 'คัดลอกจาก Excel หรือแถวข้อความแล้ววางที่นี่' : 'Paste text row from Excel'}
                </span>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={smartPasteInput}
                  onChange={(e) => handleSmartPaste(e.target.value)}
                  placeholder={lang === 'th' ? 'วางแถวข้อมูลจาก Excel เช่น Fassih Keiso	Australia	fassihkeiso@yahoo.com	03.04.2017	Mixed Media	120 x 100	cm.	This Work Deals...' : 'Paste row from Excel...'}
                  className="flex-1 px-3 py-1.5 bg-white border border-[#D5CFC3] rounded-lg text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F] placeholder-[#A0988A]"
                />
                {smartPasteInput && (
                  <button
                    type="button"
                    onClick={() => setSmartPasteInput('')}
                    className="px-2.5 py-1 text-xs text-[#7A7468] hover:text-[#1A1918] bg-white border border-[#D5CFC3] rounded-lg"
                  >
                    {lang === 'th' ? 'ล้าง' : 'Clear'}
                  </button>
                )}
              </div>
            </div>

            <form onSubmit={editingArtwork ? handleSubmitEdit : handleCreateAndLinkNewArtwork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {lang === 'th' ? 'ชื่อผลงานศิลปะ' : 'Artwork Title'} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={artworkForm.title}
                  onChange={(e) => setArtworkForm({ ...artworkForm, title: e.target.value })}
                  placeholder={lang === 'th' ? 'เช่น แสงเงาแห่งกรุงเก่า' : 'e.g. Echoes of Ayutthaya'}
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-sm font-serif font-bold text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                />
              </div>

              {/* Artist Name & Creator Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {lang === 'th' ? 'ชื่อศิลปินผู้สร้างสรรค์ (Artist / Creator)' : 'Artist / Creator'} <span className="text-rose-600">*</span>
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={artworkForm.artistId || (allArtists.find((a) => a.name === artworkForm.artistName)?.id || '')}
                    onChange={(e) => {
                      const selected = allArtists.find((a) => a.id === e.target.value);
                      if (selected) {
                        setArtworkForm({ ...artworkForm, artistId: selected.id, artistName: selected.name });
                      } else {
                        setArtworkForm({ ...artworkForm, artistId: '' });
                      }
                    }}
                    className="sm:w-1/2 px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-medium text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                  >
                    <option value="">{lang === 'th' ? '-- เลือกศิลปินจากฐานข้อมูล --' : '-- Select Existing Artist --'}</option>
                    {allArtists.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({a.country || 'Thailand'})
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    required
                    value={artworkForm.artistName}
                    onChange={(e) => setArtworkForm({ ...artworkForm, artistName: e.target.value, artistId: '' })}
                    placeholder={lang === 'th' ? 'หรือพิมพ์ระบุชื่อศิลปิน...' : 'Or enter custom artist name...'}
                    className="flex-1 px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-semibold text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'เทคนิค / วัสดุ (Medium)' : 'Medium'}
                  </label>
                  <input
                    type="text"
                    required
                    value={artworkForm.medium}
                    onChange={(e) => setArtworkForm({ ...artworkForm, medium: e.target.value })}
                    placeholder="Oil on Canvas"
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'ขนาดผลงานจริง (Dimensions: W x H)' : 'Real Dimensions'} <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={artworkForm.dimensions}
                    onChange={(e) => setArtworkForm({ ...artworkForm, dimensions: e.target.value })}
                    placeholder="120 x 180 cm."
                    className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {lang === 'th' ? 'ปีที่สร้างสรรค์ (Year Created)' : 'Year Created'}
                </label>
                <input
                  type="number"
                  value={artworkForm.yearCreated}
                  onChange={(e) => setArtworkForm({ ...artworkForm, yearCreated: parseInt(e.target.value) || 2026 })}
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Drag & Drop / File Picker / ImageKit Upload */}
              <ImageUploadDropzone
                label={lang === 'th' ? 'รูปภาพผลงานศิลปกรรม (Artwork High-Res Image)' : 'Artwork Image (High-Res)'}
                value={artworkForm.imageUrl}
                onChange={(url) => setArtworkForm({ ...artworkForm, imageUrl: url })}
                titleHint={artworkForm.title || 'artwork-image'}
                folder="/artvara-artworks"
                shape="rounded"
                required={true}
                helperText={
                  lang === 'th'
                    ? 'ลากรูปผลงานศิลปกรรมมาวาง หรือคลิกเพื่ออัปโหลดไปยัง ImageKit CDN'
                    : 'Drag & drop artwork image or click to upload to ImageKit CDN'
                }
              />

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {lang === 'th' ? 'แนวความคิดผลงาน (Artwork Concept & Statement)' : 'Concept Narrative'}
                </label>
                <textarea
                  rows={4}
                  value={artworkForm.concept}
                  onChange={(e) => setArtworkForm({ ...artworkForm, concept: e.target.value })}
                  placeholder={lang === 'th' ? 'อธิบายแนวคิด แรงบันดาลใจ และสุนทรียศาสตร์ของผลงานชิ้นนี้...' : 'Describe artistic inspiration and concept...'}
                  className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-lg text-xs font-serif leading-relaxed focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingArtwork(null);
                    setIsCreateNewModalOpen(false);
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
                  {loading ? (lang === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (lang === 'th' ? 'บันทึกข้อมูล' : 'Save Details')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
