'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Exhibition, Artwork } from '@/types/exhibition';
import {
  CatalogTemplateConfig,
  CatalogBlockElement,
  CatalogPaperSize,
  BlockElementType,
  BUILTIN_CATALOG_PRESETS,
  getExhibitionCatalogTemplate,
  PRINT_CMYK_PALETTE,
  cmykToHex,
  hexToCmyk,
  CMYKColor,
} from '@/types/catalogTemplate';
import { CatalogDynamicPlate } from '@/components/catalog/CatalogDynamicPlate';
import { useLanguage } from '@/context/LanguageContext';
import {
  Layout,
  Plus,
  Trash2,
  Copy,
  Move,
  Layers,
  Save,
  RotateCcw,
  Sparkles,
  Grid,
  Magnet,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Eye,
  ChevronLeft,
  ChevronRight,
  Check,
  Palette,
  Type,
  Sliders,
  Image as ImageIcon,
  User,
  Flag,
  FileText,
  DollarSign,
  QrCode,
  Box,
  Hash,
  Download,
  ExternalLink,
  ArrowLeft,
  Settings,
  HelpCircle,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Bold,
  Italic,
  BringToFront,
  SendToBack,
  AlignCenterHorizontal,
  AlignCenterVertical,
  X,
  ChevronDown,
  Mail,
  Pipette,
  Square,
  Frame,
} from 'lucide-react';

interface CatalogDesignerStudioProps {
  initialExhibitions?: Exhibition[];
  targetExhibitionId?: string;
}

const AVAILABLE_MODULES: {
  type: BlockElementType;
  label: string;
  icon: any;
  defaultW: number;
  defaultH: number;
  description: string;
}[] = [
  { type: 'artwork_image', label: 'ภาพผลงาน', icon: ImageIcon, defaultW: 5.0, defaultH: 5.0, description: 'ภาพถ่ายผลงานศิลปะความละเอียดสูง' },
  { type: 'artist_photo', label: 'ภาพศิลปิน', icon: User, defaultW: 1.25, defaultH: 1.5, description: 'รูปโปรไฟล์ศิลปิน (สูงไม่เกิน 1.5 นิ้ว)' },
  { type: 'country_flag', label: 'ธงชาติ', icon: Flag, defaultW: 0.75, defaultH: 0.5, description: 'ธงชาติประเทศของศิลปิน' },
  { type: 'artwork_title', label: 'ชื่องานศิลปะ', icon: Type, defaultW: 3.5, defaultH: 0.5, description: 'ชื่อผลงานศิลปกรรม' },
  { type: 'artist_name', label: 'ชื่อศิลปิน', icon: User, defaultW: 3.5, defaultH: 0.5, description: 'ชื่อ-นามสกุล ศิลปิน' },
  { type: 'artist_email', label: 'อีเมลศิลปิน', icon: Mail, defaultW: 3.5, defaultH: 0.35, description: 'ที่อยู่อีเมลสำหรับติดต่อศิลปิน' },
  { type: 'medium', label: 'เทคนิค/วัสดุ', icon: Palette, defaultW: 3.5, defaultH: 0.35, description: 'เช่น สีน้ำมันบนผ้าใบ, สื่อผสม' },
  { type: 'dimensions', label: 'ขนาดผลงาน', icon: Box, defaultW: 3.5, defaultH: 0.35, description: 'เช่น 100 x 120 cm.' },
  { type: 'year_created', label: 'ปีที่สร้าง', icon: Hash, defaultW: 2.0, defaultH: 0.35, description: 'เช่น 2026' },
  { type: 'price', label: 'ราคาผลงาน', icon: DollarSign, defaultW: 2.5, defaultH: 0.35, description: 'แสดงราคาจำหน่าย (ถ้ามี)' },
  { type: 'concept', label: 'แนวคิด/คำบรรยาย', icon: FileText, defaultW: 4.0, defaultH: 1.5, description: 'บทความแนวคิดแรงบันดาลใจ' },
  { type: 'qr_code', label: 'QR Code 3D', icon: QrCode, defaultW: 1.25, defaultH: 1.25, description: 'สแกนเพื่อชม 3D Gallery' },
  { type: 'page_number', label: 'เลขหน้า', icon: Hash, defaultW: 1.0, defaultH: 0.35, description: 'หมายเลขหน้าผลงาน' },
  { type: 'custom_text', label: 'ข้อความอิสระ', icon: Type, defaultW: 3.0, defaultH: 0.5, description: 'ข้อความคงที่' },
  { type: 'custom_box', label: 'กล่อง/เส้นคั่น', icon: Box, defaultW: 3.0, defaultH: 0.1, description: 'เส้นคั่นหรือกรอบลวดลาย' },
];

const MOCK_ARTWORK_SAMPLE: Artwork = {
  id: 'art-sample-preview-1',
  artistId: 'artist-sample-1',
  title: 'แสงสะท้อนแห่งศรัทธา (Reflection of Faith)',
  medium: 'Oil and Gold Leaf on Canvas',
  dimensions: '120 x 150 cm.',
  yearCreated: 2026,
  price: 45000,
  concept:
    'แรงบันดาลใจจากสถาปัตยกรรมและจิตวิญญาณแห่งศิลปกรรมไทย ถ่ายทอดผ่านการผสานแสงเงาและแผ่นทองคำเปลว สะท้อนถึงความสงบนิ่งและความหวังในยุคสมัยใหม่',
  cloudinaryPublicId: '',
  imageUrl:
    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop',
  status: 'available',
  artist: {
    id: 'artist-sample-1',
    name: 'อาจารย์ สุรชัย ใจอารีย์',
    email: 'surachai@pohchang.ac.th',
    role: 'artist',
    country: 'Thailand',
    avatarUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
  },
};

export function CatalogDesignerStudio({
  initialExhibitions = [],
  targetExhibitionId,
}: CatalogDesignerStudioProps) {
  const { lang, t } = useLanguage();
  const [exhibitions, setExhibitions] = useState<Exhibition[]>(initialExhibitions);

  // Selected Exhibition
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string>(
    targetExhibitionId || (initialExhibitions[0]?.id || '')
  );

  useEffect(() => {
    fetch('/api/admin/exhibitions')
      .then((res) => res.json())
      .then((data) => {
        if (data.exhibitions && data.exhibitions.length > 0) {
          setExhibitions(data.exhibitions);
          if (!selectedExhibitionId) {
            setSelectedExhibitionId(targetExhibitionId || data.exhibitions[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);

  const currentExhibition = exhibitions.find((e) => e.id === selectedExhibitionId) || exhibitions[0];
  const exhibitionArtworks = currentExhibition?.artworks || [];

  // Active Template
  const [template, setTemplate] = useState<CatalogTemplateConfig>(() =>
    getExhibitionCatalogTemplate(currentExhibition)
  );

  // Selected Block ID
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // UI States
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [sampleArtworkIndex, setSampleArtworkIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<boolean>(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [isCmykModalOpen, setIsCmykModalOpen] = useState<boolean>(false);
  const [showMarginGuide, setShowMarginGuide] = useState<boolean>(true);
  const [isMarginModalOpen, setIsMarginModalOpen] = useState<boolean>(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [showFullInspector, setShowFullInspector] = useState<boolean>(false);

  // History for Undo/Redo
  const [history, setHistory] = useState<CatalogTemplateConfig[]>([template]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Canvas Reference
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging / Resizing State
  const [dragState, setDragState] = useState<{
    blockId: string;
    isDragging: boolean;
    isResizing: boolean;
    resizeHandle?: 'nw' | 'ne' | 'se' | 'sw' | 'n' | 'e' | 's' | 'w';
    startX: number;
    startY: number;
    initialBlockX: number;
    initialBlockY: number;
    initialBlockW: number;
    initialBlockH: number;
  } | null>(null);

  // Update template when switching exhibition
  useEffect(() => {
    if (currentExhibition) {
      const loadedTpl = getExhibitionCatalogTemplate(currentExhibition);
      setTemplate(loadedTpl);
      setSelectedBlockId(null);
      setHistory([loadedTpl]);
      setHistoryIndex(0);
    }
  }, [selectedExhibitionId]);

  // Selected Block Object
  const selectedBlock = template.blocks.find((b) => b.id === selectedBlockId) || null;

  // Active Artwork for Live Preview
  const activeArtwork: Artwork =
    exhibitionArtworks.length > 0
      ? exhibitionArtworks[sampleArtworkIndex % exhibitionArtworks.length]
      : MOCK_ARTWORK_SAMPLE;

  // Snap helper: rounds value to nearest 0.25 inches
  const snap = (val: number, step = template.gridSizeInches || 0.25): number => {
    if (!snapToGrid) return Math.round(val * 100) / 100;
    return Math.round(val / step) * step;
  };

  // Push to undo history
  const updateTemplateWithHistory = (newTemplate: CatalogTemplateConfig) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setTemplate(newTemplate);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setTemplate(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setTemplate(history[historyIndex + 1]);
    }
  };

  // Change Paper Size
  const handlePaperSizeChange = (size: CatalogPaperSize) => {
    let width = 8.0;
    let height = 8.0;

    switch (size) {
      case 'square_8x8':
        width = 8.0;
        height = 8.0;
        break;
      case 'square_10x10':
        width = 10.0;
        height = 10.0;
        break;
      case 'a4_portrait':
        width = 8.27;
        height = 11.69;
        break;
      case 'a4_landscape':
        width = 11.69;
        height = 8.27;
        break;
      case 'custom':
        width = template.pageWidthInches;
        height = template.pageHeightInches;
        break;
    }

    const updated: CatalogTemplateConfig = {
      ...template,
      paperSize: size,
      pageWidthInches: width,
      pageHeightInches: height,
    };
    updateTemplateWithHistory(updated);
  };

  // Add a new module block
  const handleAddModule = (modType: BlockElementType) => {
    const modDef = AVAILABLE_MODULES.find((m) => m.type === modType);
    if (!modDef) return;

    const newId = `blk-${modType}-${Date.now().toString(36)}`;
    const newBlock: CatalogBlockElement = {
      id: newId,
      type: modType,
      label: modDef.label,
      xInches: snap(template.pageWidthInches / 2 - modDef.defaultW / 2),
      yInches: snap(template.pageHeightInches / 2 - modDef.defaultH / 2),
      widthInches: modDef.defaultW,
      heightInches: modDef.defaultH,
      zIndex: template.blocks.length + 1,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: modType === 'artwork_title' ? 14 : modType === 'artist_name' ? 13 : 10,
        fontWeight: modType === 'artwork_title' || modType === 'artist_name' ? 'bold' : 'normal',
        color: modType === 'artwork_title' ? '#8B1B1B' : '#1A1918',
        textAlign: 'left',
        objectFit: 'contain',
      },
    };

    const updated: CatalogTemplateConfig = {
      ...template,
      blocks: [...template.blocks, newBlock],
    };
    updateTemplateWithHistory(updated);
    setSelectedBlockId(newId);
    setIsAddMenuOpen(false);
  };

  // Delete selected block
  const handleDeleteBlock = (blockId: string) => {
    const updated: CatalogTemplateConfig = {
      ...template,
      blocks: template.blocks.filter((b) => b.id !== blockId),
    };
    updateTemplateWithHistory(updated);
    if (selectedBlockId === blockId) setSelectedBlockId(null);
  };

  // Duplicate selected block
  const handleDuplicateBlock = (blockId: string) => {
    const orig = template.blocks.find((b) => b.id === blockId);
    if (!orig) return;

    const dupId = `blk-${orig.type}-${Date.now().toString(36)}`;
    const dupBlock: CatalogBlockElement = {
      ...orig,
      id: dupId,
      xInches: snap(Math.min(orig.xInches + 0.25, template.pageWidthInches - orig.widthInches)),
      yInches: snap(Math.min(orig.yInches + 0.25, template.pageHeightInches - orig.heightInches)),
      zIndex: template.blocks.length + 1,
    };

    const updated: CatalogTemplateConfig = {
      ...template,
      blocks: [...template.blocks, dupBlock],
    };
    updateTemplateWithHistory(updated);
    setSelectedBlockId(dupId);
  };

  // Update single property with instant reactive state update
  const handleUpdateBlockProp = (
    blockId: string,
    updates: Partial<CatalogBlockElement>,
    commitHistory = false
  ) => {
    const targetBlock = template.blocks.find((b) => b.id === blockId);
    const sanitizedUpdates = { ...updates };
    if (targetBlock?.type === 'artist_photo' && typeof sanitizedUpdates.heightInches === 'number') {
      sanitizedUpdates.heightInches = Math.min(sanitizedUpdates.heightInches, 1.5);
    }

    const updatedBlocks = template.blocks.map((b) => {
      if (b.id === blockId) {
        return {
          ...b,
          ...sanitizedUpdates,
          style: {
            ...b.style,
            ...(sanitizedUpdates.style || {}),
          },
        };
      }
      return b;
    });

    const updatedTemplate: CatalogTemplateConfig = {
      ...template,
      blocks: updatedBlocks,
    };

    if (commitHistory) {
      updateTemplateWithHistory(updatedTemplate);
    } else {
      setTemplate(updatedTemplate);
    }
  };

  // Quick Alignment Actions for Selected Block
  const handleSetAlignment = (align: 'left' | 'center' | 'right' | 'justify') => {
    if (!selectedBlockId) return;
    const current = template.blocks.find((b) => b.id === selectedBlockId);
    if (!current) return;

    const updatedBlocks = template.blocks.map((b) => {
      if (b.id === selectedBlockId) {
        return {
          ...b,
          style: {
            ...b.style,
            textAlign: align,
          },
        };
      }
      return b;
    });

    updateTemplateWithHistory({
      ...template,
      blocks: updatedBlocks,
    });
  };

  // Snap Block to Page Center Horizontally
  const handleSnapCenterHorizontal = () => {
    if (!selectedBlockId) return;
    const current = template.blocks.find((b) => b.id === selectedBlockId);
    if (!current) return;

    const centeredX = snap((template.pageWidthInches - current.widthInches) / 2);
    handleUpdateBlockProp(selectedBlockId, { xInches: centeredX }, true);
  };

  // Snap Block to Page Center Vertically
  const handleSnapCenterVertical = () => {
    if (!selectedBlockId) return;
    const current = template.blocks.find((b) => b.id === selectedBlockId);
    if (!current) return;

    const centeredY = snap((template.pageHeightInches - current.heightInches) / 2);
    handleUpdateBlockProp(selectedBlockId, { yInches: centeredY }, true);
  };

  // Layer order
  const handleBringToFront = () => {
    if (!selectedBlockId) return;
    const maxZ = Math.max(...template.blocks.map((b) => b.zIndex || 1), 1);
    handleUpdateBlockProp(selectedBlockId, { zIndex: maxZ + 1 }, true);
  };

  const handleSendToBack = () => {
    if (!selectedBlockId) return;
    const minZ = Math.min(...template.blocks.map((b) => b.zIndex || 1), 1);
    handleUpdateBlockProp(selectedBlockId, { zIndex: Math.max(0, minZ - 1) }, true);
  };

  // Mouse Move & Up handlers for Canvas Drag & Resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = template.pageWidthInches / rect.width;
      const scaleY = template.pageHeightInches / rect.height;

      const deltaXInches = (e.clientX - dragState.startX) * scaleX;
      const deltaYInches = (e.clientY - dragState.startY) * scaleY;

      if (dragState.isDragging) {
        const rawNewX = dragState.initialBlockX + deltaXInches;
        const rawNewY = dragState.initialBlockY + deltaYInches;

        const newX = snap(
          Math.max(0, Math.min(rawNewX, template.pageWidthInches - dragState.initialBlockW))
        );
        const newY = snap(
          Math.max(0, Math.min(rawNewY, template.pageHeightInches - dragState.initialBlockH))
        );

        handleUpdateBlockProp(dragState.blockId, { xInches: newX, yInches: newY });
      } else if (dragState.isResizing && dragState.resizeHandle) {
        let newX = dragState.initialBlockX;
        let newY = dragState.initialBlockY;
        let newW = dragState.initialBlockW;
        let newH = dragState.initialBlockH;

        if (dragState.resizeHandle.includes('e')) {
          newW = snap(Math.max(0.5, dragState.initialBlockW + deltaXInches));
        }
        if (dragState.resizeHandle.includes('s')) {
          newH = snap(Math.max(0.25, dragState.initialBlockH + deltaYInches));
        }
        if (dragState.resizeHandle.includes('w')) {
          const possibleW = snap(dragState.initialBlockW - deltaXInches);
          if (possibleW >= 0.5) {
            newW = possibleW;
            newX = snap(dragState.initialBlockX + deltaXInches);
          }
        }
        if (dragState.resizeHandle.includes('n')) {
          const possibleH = snap(dragState.initialBlockH - deltaYInches);
          if (possibleH >= 0.25) {
            newH = possibleH;
            newY = snap(dragState.initialBlockY + deltaYInches);
          }
        }

        handleUpdateBlockProp(dragState.blockId, {
          xInches: newX,
          yInches: newY,
          widthInches: newW,
          heightInches: newH,
        });
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        setDragState(null);
        updateTemplateWithHistory(template);
      }
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, template]);

  // Save template to exhibition themeConfig
  const handleSaveTemplate = async () => {
    if (!currentExhibition) return;
    setIsSaving(true);

    try {
      let currentTheme: any = {};
      if (currentExhibition.themeConfig) {
        try {
          currentTheme =
            typeof currentExhibition.themeConfig === 'string'
              ? JSON.parse(currentExhibition.themeConfig)
              : currentExhibition.themeConfig;
        } catch {}
      }

      currentTheme.catalogTemplate = {
        ...template,
        updatedAt: new Date().toISOString(),
      };

      const res = await fetch('/api/admin/exhibitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentExhibition.id,
          themeConfig: currentTheme,
        }),
      });

      if (res.ok) {
        setSaveSuccessToast(true);
        setTimeout(() => setSaveSuccessToast(false), 3500);
      } else {
        alert('บันทึกเทมเพลตไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการบันทึก: ' + String(err));
    } finally {
      setIsSaving(false);
    }
  };

  // Update Margins (paddingInches)
  const handleUpdateMargin = (newMargins: Partial<{ top: number; bottom: number; left: number; right: number }>) => {
    const current = template.paddingInches || { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 };
    const updated = {
      ...current,
      ...newMargins,
    };
    updateTemplateWithHistory({
      ...template,
      paddingInches: updated,
    });
  };

  // Load Preset
  const handleSelectPreset = (preset: CatalogTemplateConfig) => {
    updateTemplateWithHistory({
      ...preset,
      id: `custom-tpl-${Date.now().toString(36)}`,
      name: `${preset.name} (Customized)`,
    });
    setIsPresetModalOpen(false);
    setSelectedBlockId(null);
  };

  return (
    <div className="relative h-screen w-full bg-[#EAE6DE] text-[#1F1C17] overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* 🚀 FLOATING TOP PILL BAR (Compact Navigation & Main Controls) */}
      {/* ========================================================================= */}
      <header className="absolute top-4 left-4 right-4 z-40 flex items-center justify-between pointer-events-none">
        {/* Left Pill: Back & Exhibition Selector */}
        <div className="flex items-center gap-1.5 bg-[#141413]/95 backdrop-blur-xl border border-[#C5A880]/30 rounded-full px-3 py-1.5 shadow-2xl pointer-events-auto">
          <Link
            href="/admin/exhibitions"
            className="p-1.5 rounded-full hover:bg-white/10 text-[#A59F92] hover:text-[#FAF9F6] transition-colors"
            title="กลับหน้ารายการนิทรรศการ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="h-4 w-px bg-white/10 mx-1" />

          {/* Exhibition Dropdown */}
          <select
            value={selectedExhibitionId}
            onChange={(e) => setSelectedExhibitionId(e.target.value)}
            className="bg-transparent text-xs text-[#FAF9F6] font-medium focus:outline-none max-w-[180px] sm:max-w-[220px] truncate cursor-pointer"
          >
            {exhibitions.map((exh) => (
              <option key={exh.id} value={exh.id} className="bg-[#1F1C17] text-[#FAF9F6]">
                {exh.title}
              </option>
            ))}
          </select>
        </div>

        {/* Center Pill: Canvas Tools (Paper Size, Grid, Snap, Zoom, Undo) */}
        <div className="hidden md:flex items-center gap-1.5 bg-[#141413]/95 backdrop-blur-xl border border-[#C5A880]/30 rounded-full px-3 py-1.5 shadow-2xl pointer-events-auto text-xs">
          {/* Paper Size */}
          <select
            value={template.paperSize}
            onChange={(e) => handlePaperSizeChange(e.target.value as CatalogPaperSize)}
            className="bg-transparent text-xs text-[#C5A880] font-semibold focus:outline-none cursor-pointer"
          >
            <option value="square_8x8" className="bg-[#1F1C17] text-[#FAF9F6]">8×8&quot; (203mm)</option>
            <option value="square_10x10" className="bg-[#1F1C17] text-[#FAF9F6]">10×10&quot; (254mm)</option>
            <option value="a4_portrait" className="bg-[#1F1C17] text-[#FAF9F6]">A4 แนวตั้ง</option>
            <option value="a4_landscape" className="bg-[#1F1C17] text-[#FAF9F6]">A4 แนวนอน</option>
          </select>

          <div className="h-3.5 w-px bg-white/10 mx-1" />

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-full flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
              showGrid ? 'bg-[#8B1B1B] text-white shadow-sm' : 'text-[#A59F92] hover:text-[#FAF9F6] hover:bg-white/5'
            }`}
            title="เปิด/ปิดเส้น Grid 0.25 นิ้ว"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">.25&quot;</span>
          </button>

          {/* Magnet Snap */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-1.5 rounded-full flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
              snapToGrid ? 'bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40' : 'text-[#A59F92] hover:text-[#FAF9F6] hover:bg-white/5'
            }`}
            title="ระบบดูดเข้าตาราง (Snap to Grid)"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>

          {/* Margin Settings & Popover */}
          <div className="relative">
            <button
              onClick={() => setIsMarginModalOpen(!isMarginModalOpen)}
              className={`p-1.5 rounded-full flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
                isMarginModalOpen || showMarginGuide
                  ? 'bg-[#C5A880]/20 text-[#C5A880] border border-[#C5A880]/40'
                  : 'text-[#A59F92] hover:text-[#FAF9F6] hover:bg-white/5'
              }`}
              title="ตั้งค่าและแสดงระยะขอบกระดาษ (Margins)"
            >
              <Frame className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">
                Margin {template.paddingInches?.top ?? 0.5}&quot;
              </span>
            </button>

            {/* Margin Settings Popover */}
            {isMarginModalOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 bg-[#141413] border border-[#C5A880]/40 rounded-2xl p-4 shadow-2xl w-64 z-50 text-xs animate-slide-up"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5 font-bold text-[#C5A880]">
                    <Frame className="w-3.5 h-3.5" />
                    <span>ระยะขอบกระดาษ (Margins)</span>
                  </div>
                  <button
                    onClick={() => setIsMarginModalOpen(false)}
                    className="p-1 rounded hover:bg-white/10 text-[#A59F92] hover:text-[#FAF9F6]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Show Margin Guide Toggle */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#1F1C17] border border-white/10 mb-3">
                  <span className="text-[#FAF9F6] text-xs">แสดงเส้นนำสายตา Margin</span>
                  <button
                    onClick={() => setShowMarginGuide(!showMarginGuide)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      showMarginGuide
                        ? 'bg-[#8B1B1B] text-white'
                        : 'bg-[#141413] text-[#A59F92] border border-white/10'
                    }`}
                  >
                    {showMarginGuide ? 'เปิดอยู่' : 'ปิด'}
                  </button>
                </div>

                {/* Margin Presets */}
                <div className="mb-3">
                  <div className="text-[10px] uppercase font-bold text-[#A59F92] mb-1.5">
                    ระยะสำเร็จรูป (Presets)
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: '0.25"', val: 0.25 },
                      { label: '0.50"', val: 0.5 },
                      { label: '0.75"', val: 0.75 },
                      { label: '1.00"', val: 1.0 },
                    ].map((p) => {
                      const isCurr =
                        template.paddingInches?.top === p.val &&
                        template.paddingInches?.bottom === p.val &&
                        template.paddingInches?.left === p.val &&
                        template.paddingInches?.right === p.val;
                      return (
                        <button
                          key={p.label}
                          onClick={() =>
                            handleUpdateMargin({
                              top: p.val,
                              bottom: p.val,
                              left: p.val,
                              right: p.val,
                            })
                          }
                          className={`py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                            isCurr
                              ? 'bg-[#8B1B1B] text-white font-bold shadow'
                              : 'bg-[#1F1C17] border border-[#C5A880]/20 text-[#A59F92] hover:text-[#FAF9F6] hover:border-[#C5A880]'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Top / Bottom / Left / Right Inputs */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#A59F92] mb-1.5">
                    กำหนดเอง (นิ้ว - Inches)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between bg-[#1F1C17] border border-[#C5A880]/30 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-[#A59F92]">บน (T)</span>
                      <input
                        type="number"
                        step="0.125"
                        min="0"
                        max="3"
                        value={template.paddingInches?.top ?? 0.5}
                        onChange={(e) =>
                          handleUpdateMargin({ top: parseFloat(e.target.value) || 0 })
                        }
                        className="w-10 bg-transparent text-xs font-mono text-[#FAF9F6] text-right focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between bg-[#1F1C17] border border-[#C5A880]/30 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-[#A59F92]">ล่าง (B)</span>
                      <input
                        type="number"
                        step="0.125"
                        min="0"
                        max="3"
                        value={template.paddingInches?.bottom ?? 0.5}
                        onChange={(e) =>
                          handleUpdateMargin({ bottom: parseFloat(e.target.value) || 0 })
                        }
                        className="w-10 bg-transparent text-xs font-mono text-[#FAF9F6] text-right focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between bg-[#1F1C17] border border-[#C5A880]/30 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-[#A59F92]">ซ้าย (L)</span>
                      <input
                        type="number"
                        step="0.125"
                        min="0"
                        max="3"
                        value={template.paddingInches?.left ?? 0.5}
                        onChange={(e) =>
                          handleUpdateMargin({ left: parseFloat(e.target.value) || 0 })
                        }
                        className="w-10 bg-transparent text-xs font-mono text-[#FAF9F6] text-right focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between bg-[#1F1C17] border border-[#C5A880]/30 rounded-lg px-2 py-1">
                      <span className="text-[10px] text-[#A59F92]">ขวา (R)</span>
                      <input
                        type="number"
                        step="0.125"
                        min="0"
                        max="3"
                        value={template.paddingInches?.right ?? 0.5}
                        onChange={(e) =>
                          handleUpdateMargin({ right: parseFloat(e.target.value) || 0 })
                        }
                        className="w-10 bg-transparent text-xs font-mono text-[#FAF9F6] text-right focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-3.5 w-px bg-white/10 mx-1" />

          {/* Zoom */}
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))}
            className="p-1 text-[#A59F92] hover:text-[#FAF9F6]"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-[#C5A880] w-8 text-center">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
            className="p-1 text-[#A59F92] hover:text-[#FAF9F6]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-white/10 mx-1" />

          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="p-1 text-[#A59F92] hover:text-[#FAF9F6] disabled:opacity-30 cursor-pointer"
            title="เลิกทำ (Undo)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right Pill: Presets, Live Link, Save Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Preset Button */}
          <button
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#141413]/95 backdrop-blur-xl border border-[#C5A880]/40 text-xs text-[#C5A880] hover:bg-[#C5A880]/15 shadow-xl transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">แม่แบบ</span>
          </button>

          {/* View Catalog */}
          {currentExhibition?.slug && (
            <Link
              href={`/catalog/${currentExhibition.slug}?preview=admin`}
              target="_blank"
              className="p-2 rounded-full bg-[#141413]/95 backdrop-blur-xl border border-[#C5A880]/30 text-[#A59F92] hover:text-[#FAF9F6] shadow-xl transition-all"
              title="เปิดดูสูจิบัตรออนไลน์จริง"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          {/* Save Button */}
          <button
            onClick={handleSaveTemplate}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#8B1B1B] hover:bg-[#721616] text-white text-xs font-bold shadow-2xl transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'บันทึก...' : 'บันทึก'}</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 🧩 LEFT FLOATING MODULE DOCK (Quick Add Elements) */}
      {/* ========================================================================= */}
      <div className="absolute left-4 top-20 bottom-20 z-30 flex flex-col items-start pointer-events-none">
        <div className="bg-[#141413]/95 backdrop-blur-xl border border-[#C5A880]/30 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 pointer-events-auto max-h-full overflow-y-auto custom-scrollbar">
          {AVAILABLE_MODULES.map((mod) => {
            const IconComp = mod.icon;
            const isUsed = template.blocks.some((b) => b.type === mod.type);

            return (
              <button
                key={mod.type}
                onClick={() => handleAddModule(mod.type)}
                className={`group relative p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isUsed
                    ? 'bg-[#8B1B1B]/20 text-[#C5A880] border border-[#8B1B1B]/40 hover:bg-[#8B1B1B]/30'
                    : 'text-[#A59F92] hover:text-[#FAF9F6] hover:bg-white/10'
                }`}
                title={`เพิ่ม ${mod.label}`}
              >
                <IconComp className="w-4 h-4" />

                {/* Floating Tooltip on Hover */}
                <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-[#141413] text-[#FAF9F6] text-[11px] font-medium rounded-lg shadow-xl border border-[#C5A880]/30 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  + {mod.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🎨 CENTER CANVAS WORKSPACE */}
      {/* ========================================================================= */}
      <main
        onClick={() => setSelectedBlockId(null)}
        className="w-full h-full overflow-auto p-12 flex flex-col items-center justify-center relative custom-scrollbar cursor-default"
      >
        {/* Sample Artwork Switcher Pill (Floating Bottom-Right Corner) */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#141413]/90 backdrop-blur-xl px-3 py-1.5 rounded-full border border-[#C5A880]/40 shadow-floating text-xs transition-all hover:bg-[#141413] hover:border-[#C5A880]"
          title="ตัวอย่างผลงานที่นำมาพรีวิวบนแม่แบบ (Sample Artwork)"
        >
          <button
            onClick={() =>
              setSampleArtworkIndex(
                (prev) => (prev - 1 + (exhibitionArtworks.length || 1)) % (exhibitionArtworks.length || 1)
              )
            }
            className="p-1 rounded-full hover:bg-white/10 text-[#A59F92] hover:text-[#FAF9F6] transition-colors"
            title="ผลงานก่อนหน้า"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-medium text-[#FAF9F6] truncate max-w-[140px] sm:max-w-[200px]" title={activeArtwork.title}>
            {activeArtwork.title}
          </span>
          <button
            onClick={() =>
              setSampleArtworkIndex((prev) => (prev + 1) % (exhibitionArtworks.length || 1))
            }
            className="p-1 rounded-full hover:bg-white/10 text-[#A59F92] hover:text-[#FAF9F6] transition-colors"
            title="ผลงานถัดไป"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-[#C5A880] font-mono font-bold pl-1 border-l border-white/10">
            ({exhibitionArtworks.length > 0 ? sampleArtworkIndex + 1 : 1}/{exhibitionArtworks.length || 1})
          </span>
        </div>

        {/* THE CANVAS CONTAINER */}
        <div
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center center',
            transition: 'transform 0.15s ease-out',
          }}
          className="relative mt-8"
        >
          {/* Page Dimensions Header */}
          <div className="absolute -top-5 left-0 right-0 flex justify-between text-[10px] font-mono text-[#6E685C]">
            <span>{template.pageWidthInches}&quot;</span>
            <span className="text-[#8B1B1B] font-bold">{template.paperSize}</span>
            <span>{template.pageHeightInches}&quot;</span>
          </div>

          {/* Interactive Page Canvas */}
          <div
            ref={canvasRef}
            onClick={(e) => e.stopPropagation()}
            className="relative shadow-2xl select-none overflow-hidden rounded-[2px]"
            style={{
              width: `${template.pageWidthInches * 96}px`, // 96 CSS px per inch
              height: `${template.pageHeightInches * 96}px`,
              backgroundColor: template.backgroundColor || '#FFFFFF',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px #333',
            }}
          >
            {/* 0.25-Inch Grid Lines */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px),
                    linear-gradient(to right, rgba(139, 27, 27, 0.12) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(139, 27, 27, 0.12) 1px, transparent 1px)
                  `,
                  backgroundSize: `
                    24px 24px, 24px 24px,
                    96px 96px, 96px 96px
                  `, // 24px = 0.25", 96px = 1.0"
                }}
              />
            )}

            {/* Dynamic Artwork Plate Renderer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <CatalogDynamicPlate
                artwork={activeArtwork}
                template={template}
                pageNumber={1}
                selectedBlockId={selectedBlockId}
              />
            </div>

            {/* 📏 SUBTLE THIN GRAY MARGIN GUIDELINE (Minimalist Drafting Guide) */}
            {showMarginGuide && (() => {
              const padTop = template.paddingInches?.top ?? 0.5;
              const padBottom = template.paddingInches?.bottom ?? 0.5;
              const padLeft = template.paddingInches?.left ?? 0.5;
              const padRight = template.paddingInches?.right ?? 0.5;

              const topPx = padTop * 96;
              const leftPx = padLeft * 96;
              const widthPx = Math.max(0, (template.pageWidthInches - padLeft - padRight) * 96);
              const heightPx = Math.max(0, (template.pageHeightInches - padTop - padBottom) * 96);

              return (
                <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden select-none">
                  {/* Thin Dashed Gray Margin Box */}
                  <div
                    style={{
                      top: `${topPx}px`,
                      left: `${leftPx}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
                    }}
                    className="absolute border border-dashed border-[#8A867E]/70 flex flex-col justify-between p-1.5 pointer-events-none"
                  >
                    {/* Subtle Top-Left Margin Badge */}
                    <div className="flex justify-between items-start">
                      <span className="text-[8.5px] font-mono text-[#737067] tracking-wider select-none">
                        margin: {padTop}&quot; ({padLeft}&quot;, {padRight}&quot;, {padBottom}&quot;)
                      </span>
                    </div>

                    {/* Subtle Bottom-Right Dimension */}
                    <div className="flex justify-end items-end">
                      <span className="text-[8px] font-mono text-[#999] select-none">
                        {(template.pageWidthInches - padLeft - padRight).toFixed(2)}&quot; × {(template.pageHeightInches - padTop - padBottom).toFixed(2)}&quot;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Interactive Layer: Block Drag / Resize Bounding Boxes */}
            <div className="absolute inset-0 z-20">
              {template.blocks.map((block) => {
                const isSelected = selectedBlockId === block.id;

                const leftPx = block.xInches * 96;
                const topPx = block.yInches * 96;
                const widthPx = block.widthInches * 96;
                const heightPx = block.heightInches * 96;

                return (
                  <div
                    key={block.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBlockId(block.id);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setSelectedBlockId(block.id);
                      setDragState({
                        blockId: block.id,
                        isDragging: true,
                        isResizing: false,
                        startX: e.clientX,
                        startY: e.clientY,
                        initialBlockX: block.xInches,
                        initialBlockY: block.yInches,
                        initialBlockW: block.widthInches,
                        initialBlockH: block.heightInches,
                      });
                    }}
                    className={`absolute group cursor-move transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-[#8B1B1B] bg-[#8B1B1B]/5'
                        : 'hover:ring-1 hover:ring-[#8C6D3F]/60'
                    }`}
                    style={{
                      left: `${leftPx}px`,
                      top: `${topPx}px`,
                      width: `${widthPx}px`,
                      height: `${heightPx}px`,
                      zIndex: isSelected ? 50 : block.zIndex || 1,
                    }}
                  >
                    {/* Block Label Tag */}
                    {(isSelected || dragState?.blockId === block.id) && (
                      <div className="absolute -top-5 left-0 bg-[#8B1B1B] text-white text-[10px] px-1.5 py-0.5 rounded-t font-mono flex items-center gap-1 shadow">
                        <span>{block.label}</span>
                        <span className="opacity-75 font-sans">
                          ({block.widthInches}&quot;×{block.heightInches}&quot;)
                        </span>
                      </div>
                    )}

                    {/* Resize Handles on Selection */}
                    {isSelected && (
                      <>
                        {(['nw', 'ne', 'se', 'sw', 'n', 'e', 's', 'w'] as const).map((handle) => {
                          let posStyle = '';
                          let cursorStyle = '';

                          switch (handle) {
                            case 'nw':
                              posStyle = '-top-1.5 -left-1.5';
                              cursorStyle = 'cursor-nwse-resize';
                              break;
                            case 'ne':
                              posStyle = '-top-1.5 -right-1.5';
                              cursorStyle = 'cursor-nesw-resize';
                              break;
                            case 'se':
                              posStyle = '-bottom-1.5 -right-1.5';
                              cursorStyle = 'cursor-nwse-resize';
                              break;
                            case 'sw':
                              posStyle = '-bottom-1.5 -left-1.5';
                              cursorStyle = 'cursor-nesw-resize';
                              break;
                            case 'n':
                              posStyle = '-top-1.5 left-1/2 -translate-x-1/2';
                              cursorStyle = 'cursor-ns-resize';
                              break;
                            case 's':
                              posStyle = '-bottom-1.5 left-1/2 -translate-x-1/2';
                              cursorStyle = 'cursor-ns-resize';
                              break;
                            case 'w':
                              posStyle = 'top-1/2 -left-1.5 -translate-y-1/2';
                              cursorStyle = 'cursor-ew-resize';
                              break;
                            case 'e':
                              posStyle = 'top-1/2 -right-1.5 -translate-y-1/2';
                              cursorStyle = 'cursor-ew-resize';
                              break;
                          }

                          return (
                            <div
                              key={handle}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDragState({
                                  blockId: block.id,
                                  isDragging: false,
                                  isResizing: true,
                                  resizeHandle: handle,
                                  startX: e.clientX,
                                  startY: e.clientY,
                                  initialBlockX: block.xInches,
                                  initialBlockY: block.yInches,
                                  initialBlockW: block.widthInches,
                                  initialBlockH: block.heightInches,
                                });
                              }}
                              className={`absolute w-2.5 h-2.5 bg-white border border-[#8B1B1B] rounded-full shadow-sm z-30 ${posStyle} ${cursorStyle}`}
                            />
                          );
                        })}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      {/* ========================================================================= */}
      {/* 🎛️ SLEEK CONTEXTUAL INSPECTOR PILL (Appears on Selected Block) */}
      {/* ========================================================================= */}
      {selectedBlock && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#141413]/95 backdrop-blur-2xl border border-[#C5A880]/40 rounded-2xl p-2 px-4 shadow-2xl flex flex-wrap items-center gap-3 animate-slide-up text-xs"
        >
          {/* Block Label & Quick Actions */}
          <div className="flex items-center gap-2 pr-2 border-r border-white/10">
            <span className="font-bold text-[#C5A880]">{selectedBlock.label}</span>
            <button
              onClick={() => handleDuplicateBlock(selectedBlock.id)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-[#A59F92] hover:text-[#FAF9F6]"
              title="ทำสำเนา"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteBlock(selectedBlock.id)}
              className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#A59F92] hover:text-red-400"
              title="ลบ"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ACTIVE ALIGNMENT BUTTONS (Left, Center, Right, Justify) */}
          <div className="flex items-center gap-0.5 bg-[#1F1C17] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => handleSetAlignment('left')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                (selectedBlock.style.textAlign || 'left') === 'left'
                  ? 'bg-[#8B1B1B] text-white shadow'
                  : 'text-[#A59F92] hover:text-[#FAF9F6]'
              }`}
              title="จัดชิดซ้าย (Align Left)"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSetAlignment('center')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedBlock.style.textAlign === 'center'
                  ? 'bg-[#8B1B1B] text-white shadow'
                  : 'text-[#A59F92] hover:text-[#FAF9F6]'
              }`}
              title="จัดกึ่งกลาง (Align Center)"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSetAlignment('right')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedBlock.style.textAlign === 'right'
                  ? 'bg-[#8B1B1B] text-white shadow'
                  : 'text-[#A59F92] hover:text-[#FAF9F6]'
              }`}
              title="จัดชิดขวา (Align Right)"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSetAlignment('justify')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedBlock.style.textAlign === 'justify'
                  ? 'bg-[#8B1B1B] text-white shadow'
                  : 'text-[#A59F92] hover:text-[#FAF9F6]'
              }`}
              title="จัดเต็มบรรทัด (Align Justify)"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Page Center Shortcut */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleSnapCenterHorizontal}
              className="p-1.5 rounded-lg bg-[#1F1C17] border border-white/10 text-[#A59F92] hover:text-[#FAF9F6] hover:border-[#C5A880]"
              title="จัดกึ่งกลางหน้ากระดาษ (Center on Page)"
            >
              <AlignCenterHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSnapCenterVertical}
              className="p-1.5 rounded-lg bg-[#1F1C17] border border-white/10 text-[#A59F92] hover:text-[#FAF9F6] hover:border-[#C5A880]"
              title="จัดกึ่งกลางแนวตั้งบนหน้ากระดาษ"
            >
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Typography (For text blocks) */}
          {['artwork_title', 'artist_name', 'artist_email', 'medium', 'dimensions', 'year_created', 'price', 'concept', 'page_number', 'custom_text'].includes(
            selectedBlock.type
          ) && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {/* Font Family */}
              <select
                value={selectedBlock.style.fontFamily || 'Maitree'}
                onChange={(e) =>
                  handleUpdateBlockProp(
                    selectedBlock.id,
                    { style: { ...selectedBlock.style, fontFamily: e.target.value as any } },
                    true
                  )
                }
                className="bg-[#1F1C17] border border-[#C5A880]/30 rounded-lg px-2 py-1 text-xs text-[#FAF9F6] focus:outline-none"
              >
                <option value="Maitree">Maitree (เพาะช่าง)</option>
                <option value="Sarabun">Sarabun (ทางการ)</option>
                <option value="Cinzel">Cinzel (คลาสสิก)</option>
                <option value="Inter">Inter (มินิมอล)</option>
                <option value="Prompt">Prompt (ร่วมสมัย)</option>
              </select>

              {/* Font Size */}
              <div className="flex items-center bg-[#1F1C17] border border-[#C5A880]/30 rounded-lg px-2 py-1">
                <input
                  type="number"
                  min="6"
                  max="64"
                  value={selectedBlock.style.fontSizePt || 12}
                  onChange={(e) =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, fontSizePt: parseFloat(e.target.value) || 12 } },
                      true
                    )
                  }
                  className="w-8 bg-transparent text-xs font-mono text-[#FAF9F6] text-center focus:outline-none"
                />
                <span className="text-[10px] text-[#A59F92]">pt</span>
              </div>

              {/* Font Weight: บาง (Light) / ปกติ (Regular) / หนา (Bold) */}
              <div className="flex items-center bg-[#1F1C17] border border-[#C5A880]/30 rounded-lg p-0.5 text-xs">
                <button
                  onClick={() =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, fontWeight: 'light' } },
                      true
                    )
                  }
                  className={`px-2 py-1 rounded text-[11px] font-light transition-all cursor-pointer ${
                    selectedBlock.style.fontWeight === 'light'
                      ? 'bg-[#8B1B1B] text-white font-bold shadow'
                      : 'text-[#A59F92] hover:text-[#FAF9F6]'
                  }`}
                  title="ตัวบาง (Light - 300)"
                >
                  บาง
                </button>
                <button
                  onClick={() =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, fontWeight: 'normal' } },
                      true
                    )
                  }
                  className={`px-2 py-1 rounded text-[11px] font-normal transition-all cursor-pointer ${
                    !selectedBlock.style.fontWeight || selectedBlock.style.fontWeight === 'normal'
                      ? 'bg-[#8B1B1B] text-white font-bold shadow'
                      : 'text-[#A59F92] hover:text-[#FAF9F6]'
                  }`}
                  title="ตัวปกติ (Regular - 400)"
                >
                  ปกติ
                </button>
                <button
                  onClick={() =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, fontWeight: 'bold' } },
                      true
                    )
                  }
                  className={`px-2 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    selectedBlock.style.fontWeight === 'bold' || selectedBlock.style.fontWeight === 'semibold' || selectedBlock.style.fontWeight === 'black'
                      ? 'bg-[#8B1B1B] text-white shadow'
                      : 'text-[#A59F92] hover:text-[#FAF9F6]'
                  }`}
                  title="ตัวหนา (Bold - 700)"
                >
                  หนา
                </button>
              </div>

              {/* Italic Toggle (ตัวเอียง) */}
              <button
                onClick={() => {
                  const isItalic = selectedBlock.style.fontStyle === 'italic';
                  handleUpdateBlockProp(
                    selectedBlock.id,
                    { style: { ...selectedBlock.style, fontStyle: isItalic ? 'normal' : 'italic' } },
                    true
                  );
                }}
                className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                  selectedBlock.style.fontStyle === 'italic'
                    ? 'bg-[#8B1B1B] text-white border-[#8B1B1B] shadow'
                    : 'bg-[#1F1C17] border-[#C5A880]/30 text-[#A59F92] hover:text-[#FAF9F6]'
                }`}
                title="ตัวเอียง (Italic)"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>

              {/* CMYK Color Studio Swatch Button */}
              {(() => {
                const cmyk = selectedBlock.style.cmyk || hexToCmyk(selectedBlock.style.color || '#1F1C17');
                const hexColor = cmykToHex(cmyk.c, cmyk.m, cmyk.y, cmyk.k);

                return (
                  <div className="relative">
                    <button
                      onClick={() => setIsCmykModalOpen(!isCmykModalOpen)}
                      className="flex items-center gap-1.5 px-2 py-1 bg-[#1F1C17] border border-[#C5A880]/40 hover:border-[#C5A880] rounded-lg transition-all cursor-pointer text-xs"
                      title="เลือกและปรับแต่งค่าสี CMYK สำหรับสิ่งพิมพ์"
                    >
                      <div
                        className="w-4 h-4 rounded border border-white/30 shadow-xs"
                        style={{ backgroundColor: hexColor }}
                      />
                      <span className="font-mono text-[10px] text-[#C5A880] font-semibold">
                        C{cmyk.c} M{cmyk.m} Y{cmyk.y} K{cmyk.k}
                      </span>
                    </button>

                    {/* CMYK Color Studio Floating Popover */}
                    {isCmykModalOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-[#141413] border border-[#C5A880]/40 rounded-2xl p-4 shadow-2xl w-72 z-50 text-xs animate-slide-up"
                      >
                        <div className="flex items-center justify-between pb-2 mb-3 border-b border-white/10">
                          <div className="flex items-center gap-1.5 font-bold text-[#C5A880]">
                            <Pipette className="w-3.5 h-3.5" />
                            <span>CMYK Color Studio</span>
                          </div>
                          <button
                            onClick={() => setIsCmykModalOpen(false)}
                            className="p-1 rounded hover:bg-white/10 text-[#A59F92] hover:text-[#FAF9F6]"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Live Color Preview Banner */}
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#1F1C17] border border-white/10 mb-3">
                          <div
                            className="w-10 h-10 rounded-lg border border-white/30 shadow-inner shrink-0"
                            style={{ backgroundColor: hexColor }}
                          />
                          <div className="flex-1 font-mono text-[11px] leading-tight">
                            <div className="text-[#FAF9F6] font-bold">
                              C:{cmyk.c}% M:{cmyk.m}% Y:{cmyk.y}% K:{cmyk.k}%
                            </div>
                            <div className="text-[#A59F92] text-[10px]">
                              RGB Preview: {hexColor.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        {/* CMYK Sliders */}
                        <div className="space-y-2.5 mb-4">
                          {/* Cyan */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-cyan-400 font-bold">Cyan (C)</span>
                              <span className="font-mono text-[#FAF9F6]">{cmyk.c}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={cmyk.c}
                              onChange={(e) => {
                                const newC = parseInt(e.target.value) || 0;
                                const newHex = cmykToHex(newC, cmyk.m, cmyk.y, cmyk.k);
                                handleUpdateBlockProp(
                                  selectedBlock.id,
                                  { style: { ...selectedBlock.style, color: newHex, cmyk: { c: newC, m: cmyk.m, y: cmyk.y, k: cmyk.k } } },
                                  true
                                );
                              }}
                              className="w-full accent-cyan-400 h-1.5 bg-[#1F1C17] rounded-lg cursor-pointer"
                            />
                          </div>

                          {/* Magenta */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-pink-400 font-bold">Magenta (M)</span>
                              <span className="font-mono text-[#FAF9F6]">{cmyk.m}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={cmyk.m}
                              onChange={(e) => {
                                const newM = parseInt(e.target.value) || 0;
                                const newHex = cmykToHex(cmyk.c, newM, cmyk.y, cmyk.k);
                                handleUpdateBlockProp(
                                  selectedBlock.id,
                                  { style: { ...selectedBlock.style, color: newHex, cmyk: { c: cmyk.c, m: newM, y: cmyk.y, k: cmyk.k } } },
                                  true
                                );
                              }}
                              className="w-full accent-pink-400 h-1.5 bg-[#1F1C17] rounded-lg cursor-pointer"
                            />
                          </div>

                          {/* Yellow */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-yellow-400 font-bold">Yellow (Y)</span>
                              <span className="font-mono text-[#FAF9F6]">{cmyk.y}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={cmyk.y}
                              onChange={(e) => {
                                const newY = parseInt(e.target.value) || 0;
                                const newHex = cmykToHex(cmyk.c, cmyk.m, newY, cmyk.k);
                                handleUpdateBlockProp(
                                  selectedBlock.id,
                                  { style: { ...selectedBlock.style, color: newHex, cmyk: { c: cmyk.c, m: cmyk.m, y: newY, k: cmyk.k } } },
                                  true
                                );
                              }}
                              className="w-full accent-yellow-400 h-1.5 bg-[#1F1C17] rounded-lg cursor-pointer"
                            />
                          </div>

                          {/* Key (Black) */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between text-[10px]">
                              <span className="text-neutral-300 font-bold">Key / Black (K)</span>
                              <span className="font-mono text-[#FAF9F6]">{cmyk.k}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={cmyk.k}
                              onChange={(e) => {
                                const newK = parseInt(e.target.value) || 0;
                                const newHex = cmykToHex(cmyk.c, cmyk.m, cmyk.y, newK);
                                handleUpdateBlockProp(
                                  selectedBlock.id,
                                  { style: { ...selectedBlock.style, color: newHex, cmyk: { c: cmyk.c, m: cmyk.m, y: cmyk.y, k: newK } } },
                                  true
                                );
                              }}
                              className="w-full accent-neutral-300 h-1.5 bg-[#1F1C17] rounded-lg cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Poh-Chang & Museum Standard Print Swatches */}
                        <div>
                          <div className="text-[10px] uppercase font-bold text-[#A59F92] mb-1.5">
                            แม่สีสิ่งพิมพ์เพาะช่าง (Print Inks)
                          </div>
                          <div className="grid grid-cols-6 gap-1.5">
                            {PRINT_CMYK_PALETTE.map((pal) => (
                              <button
                                key={pal.label}
                                onClick={() => {
                                  handleUpdateBlockProp(
                                    selectedBlock.id,
                                    { style: { ...selectedBlock.style, color: pal.hex, cmyk: { c: pal.c, m: pal.m, y: pal.y, k: pal.k } } },
                                    true
                                  );
                                }}
                                className="w-8 h-8 rounded-lg border border-white/20 hover:scale-110 hover:border-[#C5A880] transition-all relative group cursor-pointer"
                                style={{ backgroundColor: pal.hex }}
                                title={`${pal.label} (C:${pal.c} M:${pal.m} Y:${pal.y} K:${pal.k})`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Layer Order */}
          <div className="flex items-center gap-1 pl-2 border-l border-white/10">
            <button
              onClick={handleBringToFront}
              className="p-1.5 rounded-lg bg-[#1F1C17] border border-white/10 text-[#A59F92] hover:text-[#FAF9F6]"
              title="นำมาไว้หน้าสุด (Bring to Front)"
            >
              <BringToFront className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleSendToBack}
              className="p-1.5 rounded-lg bg-[#1F1C17] border border-white/10 text-[#A59F92] hover:text-[#FAF9F6]"
              title="ส่งไปไว้หลังสุด (Send to Back)"
            >
              <SendToBack className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Close Pill */}
          <button
            onClick={() => setSelectedBlockId(null)}
            className="p-1 rounded-full hover:bg-white/10 text-[#A59F92] hover:text-[#FAF9F6] ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 PRESET TEMPLATES MODAL */}
      {/* ========================================================================= */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#141413] border border-[#C5A880]/30 rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C5A880]" />
                <h3 className="text-sm font-bold text-[#FAF9F6]">เลือกแม่แบบสำเร็จรูป (Built-in Presets)</h3>
              </div>
              <button
                onClick={() => setIsPresetModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/10 text-[#A59F92] hover:text-[#FAF9F6]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
              {BUILTIN_CATALOG_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className="group p-4 rounded-2xl bg-[#1F1C17] hover:bg-[#2A2722] border border-[#C5A880]/20 hover:border-[#8B1B1B] cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-[#FAF9F6] group-hover:text-[#C5A880] transition-colors mb-1">
                      {preset.name}
                    </div>
                    <div className="text-xs text-[#A59F92] mb-3 font-mono">
                      {preset.pageWidthInches}&quot; × {preset.pageHeightInches}&quot; ({preset.paperSize})
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#C5A880] font-semibold">
                    <span>{preset.blocks.length} องค์ประกอบ</span>
                    <span className="group-hover:translate-x-1 transition-transform">เลือกแม่แบบนี้ →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🍞 SAVE SUCCESS TOAST */}
      {/* ========================================================================= */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#8B1B1B] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#D4AF37]/50 animate-slide-up">
          <Check className="w-4 h-4 text-[#D4AF37]" />
          <div>
            <div className="text-xs font-bold">บันทึกเทมเพลตสำเร็จ!</div>
            <div className="text-[11px] text-white/80">สูจิบัตรของนิทรรศการนี้จะใช้รูปแบบใหม่ทันที</div>
          </div>
        </div>
      )}
    </div>
  );
}
