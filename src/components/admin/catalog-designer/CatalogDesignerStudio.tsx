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
  getArtworkCatalogTemplate,
  getExhibitionPageOverrides,
  PRINT_CMYK_PALETTE,
  cmykToHex,
  hexToCmyk,
  CMYKColor,
} from '@/types/catalogTemplate';
import { CatalogDynamicPlate } from '@/components/catalog/CatalogDynamicPlate';
import { useLanguage } from '@/context/LanguageContext';
import {
  getAdobeMonthlyUsage,
  incrementAdobeUsage,
  AdobeQuotaStatus,
  MAX_MONTHLY_ADOBE_PDF_QUOTA,
} from '@/lib/adobeQuota';
import html2canvas from 'html2canvas';
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
  Printer,
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
  Underline,
  Minus,
  Scissors,
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
  Percent,
  Upload,
  FolderOpen,
  RefreshCw,
  PanelBottom,
  Unlock,
  Lock,
  FileEdit,
  BookmarkPlus,
  Edit3,
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
  { type: 'country_flag', label: 'ธงชาติ', icon: Flag, defaultW: 0.59, defaultH: 0.3937, description: 'ธงชาติประเทศของศิลปิน (สูง 1 cm)' },
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
  { type: 'divider_line', label: 'เส้นคั่น/เส้นประ', icon: Minus, defaultW: 4.0, defaultH: 0.15, description: 'เส้นคั่นหรือเส้นประ สามารถปรับความหนา สี และทำเส้นประได้' },
  { type: 'custom_box', label: 'กล่อง/กรอบลวดลาย', icon: Box, defaultW: 3.0, defaultH: 1.5, description: 'กล่องสี่เหลี่ยม กรอบข้อความ หรือพื้นหลังลวดลาย' },
  { type: 'footer_graphic', label: 'รูป Footer', icon: PanelBottom, defaultW: 7.0, defaultH: 0.85, description: 'ภาพ/กราฟิกท้ายหน้า (รองรับรูปปกติ และไล่น้ำหนักจากเข้มขึ้นไปบางกลืนกระดาษ)' },
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

  // Active Artwork Sample Index
  const [sampleArtworkIndex, setSampleArtworkIndex] = useState<number>(0);
  const activeArtwork: Artwork =
    exhibitionArtworks.length > 0
      ? exhibitionArtworks[sampleArtworkIndex % exhibitionArtworks.length]
      : MOCK_ARTWORK_SAMPLE;

  // Master Template
  const [masterTemplate, setMasterTemplate] = useState<CatalogTemplateConfig>(() =>
    getExhibitionCatalogTemplate(currentExhibition)
  );

  // Page-Level Overrides (Keyed by artworkId)
  const [pageOverrides, setPageOverrides] = useState<Record<string, CatalogTemplateConfig>>(() =>
    getExhibitionPageOverrides(currentExhibition)
  );

  // Is current active artwork using a custom page layout?
  const isCurrentPageCustom = Boolean(activeArtwork?.id && pageOverrides[activeArtwork.id]);

  // Active Template being edited (either Custom for current artwork or Master)
  const [template, setTemplate] = useState<CatalogTemplateConfig>(() => {
    if (activeArtwork?.id && pageOverrides[activeArtwork.id]) {
      return pageOverrides[activeArtwork.id];
    }
    return getExhibitionCatalogTemplate(currentExhibition);
  });

  // Selected Block ID
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  // UI States
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<boolean>(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [customPresets, setCustomPresets] = useState<CatalogTemplateConfig[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('artvara_custom_catalog_presets');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        } catch {}
      }
    }
    return [];
  });
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState<boolean>(false);
  const [savePresetMode, setSavePresetMode] = useState<'new' | 'overwrite'>('new');
  const [selectedOverwritePresetId, setSelectedOverwritePresetId] = useState<string>('');
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [newPresetDesc, setNewPresetDesc] = useState<string>('');
  const [presetModalTab, setPresetModalTab] = useState<'custom' | 'official'>('custom');
  const [editingPreset, setEditingPreset] = useState<{ id: string; name: string; description: string } | null>(null);
  const [isCmykModalOpen, setIsCmykModalOpen] = useState<boolean>(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);
  const [exportStatusText, setExportStatusText] = useState<string>('');
  const [exportProgressPercent, setExportProgressPercent] = useState<number>(0);
  const [exportProgressStep, setExportProgressStep] = useState<string>('');
  const [exportEstimatedSeconds, setExportEstimatedSeconds] = useState<number>(0);
  const [showMarginGuide, setShowMarginGuide] = useState<boolean>(true);
  const [isMarginModalOpen, setIsMarginModalOpen] = useState<boolean>(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState<boolean>(false);
  const [showFullInspector, setShowFullInspector] = useState<boolean>(false);

  // Background Color Picker State
  const [isBgColorOpen, setIsBgColorOpen] = useState<boolean>(false);
  const [adobeQuota, setAdobeQuota] = useState<AdobeQuotaStatus>(() => getAdobeMonthlyUsage());

  // Custom Paper Size State
  const [customWidthInput, setCustomWidthInput] = useState<string>(String(template.pageWidthInches));
  const [customHeightInput, setCustomHeightInput] = useState<string>(String(template.pageHeightInches));

  // Multi-Page Preview Panel State
  const [isPagesPanelOpen, setIsPagesPanelOpen] = useState<boolean>(true);

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

  // Load exhibition and templates on change
  useEffect(() => {
    if (currentExhibition) {
      let loadedTpl = getExhibitionCatalogTemplate(currentExhibition);
      let loadedOverrides = getExhibitionPageOverrides(currentExhibition);

      // Check local storage backup
      if (typeof window !== 'undefined') {
        const localSaved = localStorage.getItem(`artvara_catalog_template_${currentExhibition.id}`);
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
              const serverUpdated = (loadedTpl as any)?.updatedAt || '';
              const localUpdated = (parsed as any)?.updatedAt || '';
              if (!serverUpdated || localUpdated >= serverUpdated) {
                loadedTpl = parsed;
              }
            }
          } catch {}
        }

        const localOverridesSaved = localStorage.getItem(`artvara_catalog_page_overrides_${currentExhibition.id}`);
        if (localOverridesSaved) {
          try {
            const parsed = JSON.parse(localOverridesSaved);
            if (parsed && typeof parsed === 'object') {
              loadedOverrides = { ...loadedOverrides, ...parsed };
            }
          } catch {}
        }
      }

      setMasterTemplate(loadedTpl);
      setPageOverrides(loadedOverrides);

      const art = currentExhibition?.artworks?.[0] || MOCK_ARTWORK_SAMPLE;
      const initialActiveTpl = (art?.id && loadedOverrides[art.id]) ? loadedOverrides[art.id] : loadedTpl;
      setTemplate(initialActiveTpl);
      setSelectedBlockId(null);
      setHistory([initialActiveTpl]);
      setHistoryIndex(0);
    }
  }, [selectedExhibitionId, exhibitions]);

  // Selected Block Object
  const selectedBlock = template.blocks.find((b) => b.id === selectedBlockId) || null;
  const [imageRatios, setImageRatios] = useState<Record<string, number>>({});

  // Snap helper: rounds value to nearest 0.25 inches
  const snap = (val: number, step = template.gridSizeInches || 0.25): number => {
    if (!snapToGrid) return Math.round(val * 100) / 100;
    return Math.round(val / step) * step;
  };

  // Push to undo history and sync active state
  const updateTemplateWithHistory = (newTemplate: CatalogTemplateConfig) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setTemplate(newTemplate);

    if (activeArtwork?.id && pageOverrides[activeArtwork.id]) {
      setPageOverrides((prev) => ({
        ...prev,
        [activeArtwork.id]: newTemplate,
      }));
    } else {
      setMasterTemplate(newTemplate);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      const prevTpl = history[historyIndex - 1];
      setTemplate(prevTpl);
      if (activeArtwork?.id && pageOverrides[activeArtwork.id]) {
        setPageOverrides((prev) => ({ ...prev, [activeArtwork.id]: prevTpl }));
      } else {
        setMasterTemplate(prevTpl);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      const nextTpl = history[historyIndex + 1];
      setTemplate(nextTpl);
      if (activeArtwork?.id && pageOverrides[activeArtwork.id]) {
        setPageOverrides((prev) => ({ ...prev, [activeArtwork.id]: nextTpl }));
      } else {
        setMasterTemplate(nextTpl);
      }
    }
  };

  // Select Artwork Sample
  const handleSelectArtworkIndex = (index: number) => {
    setSampleArtworkIndex(index);
    setSelectedBlockId(null);
    const art = exhibitionArtworks.length > 0 ? exhibitionArtworks[index % exhibitionArtworks.length] : MOCK_ARTWORK_SAMPLE;
    const targetTpl = (art?.id && pageOverrides[art.id]) ? pageOverrides[art.id] : masterTemplate;
    setTemplate(targetTpl);
    setHistory([targetTpl]);
    setHistoryIndex(0);
  };

  // Enable Custom Layout Override for current page
  const handleEnableCustomLayoutForCurrentPage = () => {
    if (!activeArtwork?.id) return;
    const customTpl: CatalogTemplateConfig = {
      ...JSON.parse(JSON.stringify(template)),
      id: `override-${activeArtwork.id}-${Date.now().toString(36)}`,
      name: `${activeArtwork.title} (Custom Page Layout)`,
      updatedAt: new Date().toISOString(),
    };
    const updated = {
      ...pageOverrides,
      [activeArtwork.id]: customTpl,
    };
    setPageOverrides(updated);
    updateTemplateWithHistory(customTpl);
  };

  // Revert / Reset current page override to master template
  const handleResetCurrentPageToMaster = () => {
    if (!activeArtwork?.id) return;
    if (confirm('คุณต้องการรีเซ็ตหน้านี้กลับไปใช้แม่แบบหลัก (Master Template) ใช่หรือไม่? (การปรับแต่งเฉพาะหน้านี้จะถูกยกเลิก)')) {
      const updated = { ...pageOverrides };
      delete updated[activeArtwork.id];
      setPageOverrides(updated);
      updateTemplateWithHistory(masterTemplate);
    }
  };

  // Keyboard Shortcuts (Delete, Arrow Keys, Ctrl+D/Z/Y, Escape)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      if (e.key === 'Escape') {
        setSelectedBlockId(null);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (!selectedBlockId) return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteBlock(selectedBlockId);
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicateBlock(selectedBlockId);
        return;
      }

      const nudge = e.shiftKey ? 0.0625 : 0.25;
      const current = template.blocks.find((b) => b.id === selectedBlockId);
      if (!current) return;

      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') { e.preventDefault(); dx = -nudge; }
      else if (e.key === 'ArrowRight') { e.preventDefault(); dx = nudge; }
      else if (e.key === 'ArrowUp') { e.preventDefault(); dy = -nudge; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); dy = nudge; }

      if (dx !== 0 || dy !== 0) {
        const maxX = template.pageWidthInches - current.widthInches;
        const maxY = template.pageHeightInches - current.heightInches;
        const newX = Math.max(0, Math.min(maxX, Math.round((current.xInches + dx) * 1000) / 1000));
        const newY = Math.max(0, Math.min(maxY, Math.round((current.yInches + dy) * 1000) / 1000));
        handleUpdateBlockPosition(selectedBlockId, newX, newY);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedBlockId, template, historyIndex, history]);

  // Handle Add Module Block
  const handleAddModule = (type: BlockElementType) => {
    const modDef = AVAILABLE_MODULES.find((m) => m.type === type);
    if (!modDef) return;

    let initW = modDef.defaultW;
    let initH = modDef.defaultH;

    if (type === 'artwork_image') {
      const padL = template.paddingInches?.left ?? 0.5;
      const padR = template.paddingInches?.right ?? 0.5;
      const padT = template.paddingInches?.top ?? 0.5;
      initW = Math.max(2.0, snap(template.pageWidthInches - padL - padR));
      initH = Math.max(2.0, snap(template.pageHeightInches * 0.55));
    }

    const padL = template.paddingInches?.left ?? 0.5;
    const padT = template.paddingInches?.top ?? 0.5;
    const newX = Math.min(padL, Math.max(0, template.pageWidthInches - initW));
    const newY = Math.min(padT, Math.max(0, template.pageHeightInches - initH));

    let initialStyle: any = {
      fontFamily: 'Maitree',
      fontSizePt: type === 'artwork_title' ? 14 : type === 'artist_name' ? 12 : 9.5,
      fontWeight: type === 'artwork_title' || type === 'artist_name' ? 'bold' : 'normal',
      color: type === 'artwork_title' ? '#8B1B1B' : type === 'artist_name' ? '#1A1918' : '#444444',
      textAlign: 'left',
      objectFit: 'contain',
      borderRadius: type === 'artist_photo' ? 8 : 0,
      opacity: 1,
    };

    if (type === 'divider_line') {
      initialStyle = {
        borderWidth: 1,
        borderColor: '#C5A880',
        color: '#C5A880',
        borderStyle: 'solid',
        opacity: 1,
      };
      initW = Math.max(2.0, snap(template.pageWidthInches - padL - (template.paddingInches?.right ?? 0.5)));
      initH = 0.15;
    }

    if (type === 'custom_box') {
      initialStyle = {
        borderWidth: 1,
        borderColor: '#D8D2C4',
        color: '#D8D2C4',
        borderStyle: 'solid',
        backgroundColor: 'transparent',
        borderRadius: 4,
        opacity: 1,
      };
      initW = 3.0;
      initH = 1.5;
    }

    if (type === 'footer_graphic') {
      initialStyle = {
        objectFit: 'cover',
        opacity: 1,
        footerEffect: 'solid',
        borderRadius: 0,
      };
      initW = template.pageWidthInches;
      initH = 0.85;
    }

    const newBlock: CatalogBlockElement = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      label: modDef.label,
      xInches: snap(newX),
      yInches: snap(newY),
      widthInches: initW,
      heightInches: initH,
      zIndex: template.blocks.length + 1,
      style: initialStyle,
      customContent: type === 'custom_text' ? 'ข้อความกำหนดเอง' : '',
    };

    const newTemplate = {
      ...template,
      blocks: [...template.blocks, newBlock],
    };

    updateTemplateWithHistory(newTemplate);
    setSelectedBlockId(newBlock.id);
  };

  // Handle Delete Block
  const handleDeleteBlock = (blockId: string) => {
    const newTemplate = {
      ...template,
      blocks: template.blocks.filter((b) => b.id !== blockId),
    };
    updateTemplateWithHistory(newTemplate);
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  // Handle Duplicate Block
  const handleDuplicateBlock = (blockId: string) => {
    const src = template.blocks.find((b) => b.id === blockId);
    if (!src) return;

    const newBlock: CatalogBlockElement = {
      ...JSON.parse(JSON.stringify(src)),
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      xInches: snap(Math.min(template.pageWidthInches - src.widthInches, src.xInches + 0.25)),
      yInches: snap(Math.min(template.pageHeightInches - src.heightInches, src.yInches + 0.25)),
      zIndex: template.blocks.length + 1,
    };

    const newTemplate = {
      ...template,
      blocks: [...template.blocks, newBlock],
    };

    updateTemplateWithHistory(newTemplate);
    setSelectedBlockId(newBlock.id);
  };

  // Handle Update Block Position
  const handleUpdateBlockPosition = (blockId: string, xInches: number, yInches: number) => {
    const updated = template.blocks.map((b) => {
      if (b.id !== blockId) return b;
      return { ...b, xInches, yInches };
    });
    setTemplate({ ...template, blocks: updated });
  };

  // Handle Update Block Dimension
  const handleUpdateBlockDimension = (
    blockId: string,
    xInches: number,
    yInches: number,
    widthInches: number,
    heightInches: number
  ) => {
    const updated = template.blocks.map((b) => {
      if (b.id !== blockId) return b;
      return { ...b, xInches, yInches, widthInches, heightInches };
    });
    setTemplate({ ...template, blocks: updated });
  };

  // Handle Update Block Properties
  const handleUpdateBlockProp = (
    blockId: string,
    patch: Partial<CatalogBlockElement>,
    recordHistory = true
  ) => {
    const updated = template.blocks.map((b) => {
      if (b.id !== blockId) return b;
      return { ...b, ...patch };
    });
    const newTemplate = { ...template, blocks: updated };
    if (recordHistory) {
      updateTemplateWithHistory(newTemplate);
    } else {
      setTemplate(newTemplate);
    }
  };

  // Handle Set Alignment
  const handleSetAlignment = (textAlign: 'left' | 'center' | 'right' | 'justify') => {
    if (!selectedBlockId) return;
    const target = template.blocks.find((b) => b.id === selectedBlockId);
    if (!target) return;
    handleUpdateBlockProp(selectedBlockId, {
      style: {
        ...target.style,
        textAlign,
      },
    });
  };

  // Handle Center Horizontal / Vertical
  const handleCenterBlock = (axis: 'h' | 'v' | 'both') => {
    if (!selectedBlockId) return;
    const target = template.blocks.find((b) => b.id === selectedBlockId);
    if (!target) return;

    let newX = target.xInches;
    let newY = target.yInches;

    if (axis === 'h' || axis === 'both') {
      newX = snap((template.pageWidthInches - target.widthInches) / 2);
    }
    if (axis === 'v' || axis === 'both') {
      newY = snap((template.pageHeightInches - target.heightInches) / 2);
    }

    handleUpdateBlockProp(selectedBlockId, {
      xInches: newX,
      yInches: newY,
    });
  };

  // Handle Bring to Front / Send to Back
  const handleZIndex = (direction: 'front' | 'back') => {
    if (!selectedBlockId) return;
    const target = template.blocks.find((b) => b.id === selectedBlockId);
    if (!target) return;

    const sorted = [...template.blocks].sort((a, b) => a.zIndex - b.zIndex);
    const maxZ = Math.max(...template.blocks.map((b) => b.zIndex), 1);
    const minZ = Math.min(...template.blocks.map((b) => b.zIndex), 1);

    const newZ = direction === 'front' ? maxZ + 1 : Math.max(1, minZ - 1);
    handleUpdateBlockProp(selectedBlockId, { zIndex: newZ });
  };

  // Paper Size Change
  const handlePaperSizeChange = (size: CatalogPaperSize) => {
    let w = 8.0;
    let h = 8.0;
    switch (size) {
      case 'square_8x8':
        w = 8.0;
        h = 8.0;
        break;
      case 'square_10x10':
        w = 10.0;
        h = 10.0;
        break;
      case 'a4_portrait':
        w = 8.27;
        h = 11.69;
        break;
      case 'a4_landscape':
        w = 11.69;
        h = 8.27;
        break;
      case 'custom':
        w = parseFloat(customWidthInput) || template.pageWidthInches || 8.0;
        h = parseFloat(customHeightInput) || template.pageHeightInches || 8.0;
        break;
    }

    updateTemplateWithHistory({
      ...template,
      paperSize: size,
      pageWidthInches: w,
      pageHeightInches: h,
    });
  };

  // Apply custom paper size
  const handleApplyCustomPaperSize = () => {
    const w = parseFloat(customWidthInput);
    const h = parseFloat(customHeightInput);
    if (!w || !h || w <= 0 || h <= 0) return;
    updateTemplateWithHistory({
      ...template,
      paperSize: 'custom',
      pageWidthInches: Math.min(36, Math.max(2, w)),
      pageHeightInches: Math.min(36, Math.max(2, h)),
    });
  };

  // Save as new preset
  const handleSaveAsCustomPreset = () => {
    if (!newPresetName.trim()) return;
    const newPreset: CatalogTemplateConfig = {
      ...template,
      id: `custom-preset-${Date.now().toString(36)}`,
      name: newPresetName.trim(),
      description: newPresetDesc.trim() || 'แม่แบบกำหนดเองของผู้ดูแลระบบ',
      updatedAt: new Date().toISOString(),
    };
    const updated = [newPreset, ...customPresets];
    setCustomPresets(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('artvara_custom_catalog_presets', JSON.stringify(updated));
    }
    setSelectedOverwritePresetId(newPreset.id);
    setNewPresetName('');
    setNewPresetDesc('');
    setIsSavePresetModalOpen(false);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);
  };

  // Overwrite existing preset
  const handleOverwritePreset = (targetId: string) => {
    const target = customPresets.find((p) => p.id === targetId);
    if (!target) return;
    if (confirm(`คุณต้องการบันทึกทับแม่แบบ "${target.name}" ด้วยเลย์เอาต์ปัจจุบันใช่หรือไม่?`)) {
      const updatedPreset: CatalogTemplateConfig = {
        ...template,
        id: target.id,
        name: newPresetName.trim() || target.name,
        description: newPresetDesc.trim() || target.description,
        updatedAt: new Date().toISOString(),
      };
      const updatedList = customPresets.map((p) => (p.id === targetId ? updatedPreset : p));
      setCustomPresets(updatedList);
      if (typeof window !== 'undefined') {
        localStorage.setItem('artvara_custom_catalog_presets', JSON.stringify(updatedList));
      }
      setIsSavePresetModalOpen(false);
      setSaveSuccessToast(true);
      setTimeout(() => setSaveSuccessToast(false), 3000);
    }
  };

  // Rename preset
  const handleSaveRenamePreset = () => {
    if (!editingPreset || !editingPreset.name.trim()) return;
    const updatedList = customPresets.map((p) => {
      if (p.id === editingPreset.id) {
        return { ...p, name: editingPreset.name.trim(), description: editingPreset.description.trim() };
      }
      return p;
    });
    setCustomPresets(updatedList);
    if (typeof window !== 'undefined') {
      localStorage.setItem('artvara_custom_catalog_presets', JSON.stringify(updatedList));
    }
    setEditingPreset(null);
  };

  // Delete custom preset
  const handleDeleteCustomPreset = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const target = customPresets.find((p) => p.id === id);
    if (confirm(`คุณต้องการลบแม่แบบ "${target?.name || ''}" ใช่หรือไม่?`)) {
      const updated = customPresets.filter((p) => p.id !== id);
      setCustomPresets(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem('artvara_custom_catalog_presets', JSON.stringify(updated));
      }
      if (selectedOverwritePresetId === id) {
        setSelectedOverwritePresetId('');
      }
    }
  };

  // Export single preset as JSON
  const handleExportSinglePresetJSON = (preset: CatalogTemplateConfig, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(preset, null, 2));
    const a = document.createElement('a');
    a.setAttribute('href', dataStr);
    a.setAttribute('download', `artvara-template-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
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
      id: preset.id.startsWith('custom-preset-') ? preset.id : `custom-tpl-${Date.now().toString(36)}`,
      name: preset.name,
    });
    if (preset.id.startsWith('custom-preset-')) {
      setSelectedOverwritePresetId(preset.id);
    }
    setIsPresetModalOpen(false);
    setSelectedBlockId(null);
  };

  // Mouse Drag / Resize Handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !canvasRef.current) return;

      const pxPerInch = 96 * (zoomLevel / 100);
      const deltaXInches = (e.clientX - dragState.startX) / pxPerInch;
      const deltaYInches = (e.clientY - dragState.startY) / pxPerInch;

      const bleed = template.bleedInches || 0;
      if (dragState.isDragging) {
        const minX = -bleed;
        const minY = -bleed;
        const maxX = template.pageWidthInches + bleed - dragState.initialBlockW;
        const maxY = template.pageHeightInches + bleed - dragState.initialBlockH;
        const rawX = dragState.initialBlockX + deltaXInches;
        const rawY = dragState.initialBlockY + deltaYInches;
        const clampedX = Math.max(minX, Math.min(maxX, rawX));
        const clampedY = Math.max(minY, Math.min(maxY, rawY));

        handleUpdateBlockPosition(dragState.blockId, snap(clampedX), snap(clampedY));
      } else if (dragState.isResizing && dragState.resizeHandle) {
        const handle = dragState.resizeHandle;
        let newX = dragState.initialBlockX;
        let newY = dragState.initialBlockY;
        let newW = dragState.initialBlockW;
        let newH = dragState.initialBlockH;

        if (handle.includes('e')) newW = Math.max(0.2, dragState.initialBlockW + deltaXInches);
        if (handle.includes('s')) newH = Math.max(0.05, dragState.initialBlockH + deltaYInches);
        if (handle.includes('w')) {
          const maxDelta = dragState.initialBlockW - 0.2;
          const appliedDelta = Math.min(maxDelta, deltaXInches);
          newX = Math.max(-bleed, dragState.initialBlockX + appliedDelta);
          newW = Math.max(0.2, dragState.initialBlockW - appliedDelta);
        }
        if (handle.includes('n')) {
          const maxDelta = dragState.initialBlockH - 0.05;
          const appliedDelta = Math.min(maxDelta, deltaYInches);
          newY = Math.max(-bleed, dragState.initialBlockY + appliedDelta);
          newH = Math.max(0.05, dragState.initialBlockH - appliedDelta);
        }

        handleUpdateBlockDimension(dragState.blockId, snap(newX), snap(newY), snap(newW), snap(newH));
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        updateTemplateWithHistory(template);
        setDragState(null);
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

  // Save template to exhibition themeConfig (DB + LocalStorage + In-Memory State)
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

      const nowIso = new Date().toISOString();
      const masterWithMeta = {
        ...masterTemplate,
        updatedAt: nowIso,
      };

      currentTheme.catalogTemplate = masterWithMeta;
      currentTheme.pageOverrides = pageOverrides;

      // 1. Save to database via API
      const res = await fetch('/api/admin/exhibitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentExhibition.id,
          themeConfig: currentTheme,
        }),
      });

      // 2. Save backup to browser localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `artvara_catalog_template_${currentExhibition.id}`,
          JSON.stringify(masterWithMeta)
        );
        localStorage.setItem(
          `artvara_catalog_page_overrides_${currentExhibition.id}`,
          JSON.stringify(pageOverrides)
        );
      }

      // 3. Update in-memory exhibitions state
      setExhibitions((prev) =>
        prev.map((exh) =>
          exh.id === currentExhibition.id
            ? {
                ...exh,
                themeConfig: JSON.stringify(currentTheme),
              }
            : exh
        )
      );

      if (res.ok) {
        setSaveSuccessToast(true);
        setTimeout(() => setSaveSuccessToast(false), 3500);
      } else {
        alert('บันทึกลงฐานข้อมูลไม่สำเร็จ แต่บันทึกสำรองในเบราว์เซอร์เรียบร้อยแล้ว');
      }
    } catch (err) {
      console.error(err);
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `artvara_catalog_template_${currentExhibition.id}`,
          JSON.stringify({ ...masterTemplate, updatedAt: new Date().toISOString() })
        );
        localStorage.setItem(
          `artvara_catalog_page_overrides_${currentExhibition.id}`,
          JSON.stringify(pageOverrides)
        );
      }
      alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์ (บันทึกสำรองไว้ในเครื่องแล้ว)');
    } finally {
      setIsSaving(false);
    }
  };

  // Reload saved template
  const handleReloadSavedTemplate = () => {
    if (!currentExhibition) return;
    let finalTpl = getExhibitionCatalogTemplate(currentExhibition);
    if (typeof window !== 'undefined') {
      const localSaved = localStorage.getItem(`artvara_catalog_template_${currentExhibition.id}`);
      if (localSaved) {
        try {
          const parsed = JSON.parse(localSaved);
          if (parsed && Array.isArray(parsed.blocks) && parsed.blocks.length > 0) {
            finalTpl = parsed;
          }
        } catch {}
      }
    }
    setTemplate(finalTpl);
    setHistory([finalTpl]);
    setHistoryIndex(0);
    setSelectedBlockId(null);
    setSaveSuccessToast(true);
    setTimeout(() => setSaveSuccessToast(false), 3000);
  };

  // 🖨️ Instant Isolated 1-Page Print / Save PDF
  const handlePrintStudioCurrentPage = () => {
    if (typeof document === 'undefined') return;
    const w = template.pageWidthInches || 8;
    const h = template.pageHeightInches || 8;
    const canvasEl = document.getElementById('catalog-studio-print-target');
    if (!canvasEl) return;

    // Deselect and hide guides
    setSelectedBlockId(null);
    setShowGrid(false);
    setShowMarginGuide(false);

    let printIframe = document.getElementById('catalog-studio-print-iframe') as HTMLIFrameElement | null;
    if (!printIframe) {
      printIframe = document.createElement('iframe');
      printIframe.id = 'catalog-studio-print-iframe';
      printIframe.style.position = 'fixed';
      printIframe.style.right = '0';
      printIframe.style.bottom = '0';
      printIframe.style.width = '0';
      printIframe.style.height = '0';
      printIframe.style.border = '0';
      document.body.appendChild(printIframe);
    }

    const iframeDoc = printIframe.contentDocument || printIframe.contentWindow?.document;
    if (!iframeDoc) return;

    // 1. Get the clean dynamic plate DOM node
    const plateNode = canvasEl.querySelector('.catalog-dynamic-page');
    const plateHtml = plateNode ? plateNode.outerHTML : canvasEl.innerHTML;

    // 2. Clone all parent styles, Tailwind CSS, and stylesheet links
    const parentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map((el) => el.outerHTML)
      .join('\n');

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${currentExhibition?.slug || 'catalog'}-Plate-${w}x${h}-Vector</title>
          ${parentStyles}
          <link rel="preconnect" href="https://fonts.googleapis.com">
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
          <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=Maitree:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            @page {
              size: ${w}in ${h}in !important;
              margin: 0mm !important;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            html, body {
              width: ${w}in !important;
              height: ${h}in !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background: ${template.backgroundColor || '#FFFFFF'} !important;
              font-family: 'Maitree', 'Noto Serif Thai', Georgia, serif;
            }
            .catalog-dynamic-page {
              position: relative !important;
              width: ${w}in !important;
              height: ${h}in !important;
              max-width: ${w}in !important;
              max-height: ${h}in !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background-color: ${template.backgroundColor || '#FFFFFF'} !important;
              overflow: hidden !important;
            }
            /* Clean out all helper outlines and edit guides */
            [class*="Guideline"], [class*="BLEED"], [class*="border-dashed"], [class*="ring-2"], [class*="cursor-"], [class*="resize-handle"] {
              display: none !important;
            }
          </style>
        </head>
        <body class="bg-white">
          ${plateHtml}
        </body>
      </html>
    `);
    iframeDoc.close();

    setTimeout(() => {
      printIframe?.contentWindow?.focus();
      printIframe?.contentWindow?.print();
      setShowGrid(true);
      setShowMarginGuide(true);
    }, 250);
  };

  // 🖼️ DIRECT DOWNLOAD HIGH-RES PNG (300 DPI)
  const handleDirectDownloadPNG = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExportingPDF(true);
      setExportStatusText('กำลังเรนเดอร์รูปภาพ PNG ความละเอียดสูง (300 DPI)...');
      const w = template.pageWidthInches || 8;
      const h = template.pageHeightInches || 8;

      setShowGrid(false);
      setShowMarginGuide(false);
      setSelectedBlockId(null);

      await new Promise((r) => setTimeout(r, 120));

      const targetEl = (canvasRef.current.querySelector('.catalog-dynamic-page') as HTMLElement) || canvasRef.current;

      const canvas = await html2canvas(targetEl, {
        scale: 3.125,
        useCORS: true,
        allowTaint: true,
        backgroundColor: template.backgroundColor || '#FFFFFF',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      const slug = currentExhibition?.slug || 'catalog';
      link.href = imgData;
      link.download = `${slug}-Plate-${w}x${h}.png`;
      link.click();

      setShowGrid(true);
      setShowMarginGuide(true);
      setIsExportingPDF(false);
      setExportStatusText('');
    } catch (err) {
      console.error('Direct PNG export error:', err);
      setIsExportingPDF(false);
      setExportStatusText('');
      setShowGrid(true);
      setShowMarginGuide(true);
    }
  };

  // 🅰️ DIRECT DOWNLOAD ADOBE POSTSCRIPT PDF (1-Click Genuine Adobe Cloud Engine)
  const handleDirectDownloadAdobePDF = async () => {
    const currentQuota = getAdobeMonthlyUsage();
    setAdobeQuota(currentQuota);

    if (currentQuota.isExceeded) {
      alert(
        `⚠️ โควต้า Adobe PDF ฟรีประจำเดือน ${currentQuota.monthName} ถูกใช้งานครบ ${currentQuota.max} ครั้งแล้วครับ\n\n` +
        `ระบบความปลอดภัยจะระงับการเรียก Adobe Cloud ชั่วคราวเพื่อไม่ให้มีค่าใช้จ่ายส่วนเกิน\n\n` +
        `💡 คุณสามารถเลือก "บันทึกเป็น PDF ผ่านเบราว์เซอร์" หรือ "ดาวน์โหลดรูปภาพ PNG 300 DPI" ได้ฟรี 100% ไม่จำกัดจำนวนครั้งครับ`
      );
      return;
    }

    const canvasEl = document.getElementById('catalog-studio-print-target');
    if (!canvasEl) return;

    try {
      setIsExportingPDF(true);
      setExportProgressPercent(15);
      setExportProgressStep('เตรียมข้อมูลหน้าเอกสาร');
      setExportStatusText('กำลังรวบรวมรูปภาพและจัดเตรียมเลย์เอาต์...');
      setExportEstimatedSeconds(6);

      const w = template.pageWidthInches || 8;
      const h = template.pageHeightInches || 8;

      const plateNode = canvasEl.querySelector('.catalog-dynamic-page');
      const plateHtml = plateNode ? plateNode.outerHTML : canvasEl.innerHTML;

      const parentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((el) => el.outerHTML)
        .join('\n');

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${currentExhibition?.slug || 'catalog'}-Plate-${w}x${h}-Adobe</title>
  ${parentStyles}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=Maitree:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${w}in ${h}in; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      width: ${w}in;
      height: ${h}in;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: ${template.backgroundColor || '#FFFFFF'};
      font-family: 'Maitree', 'Noto Serif Thai', Georgia, serif;
    }
    .catalog-dynamic-page {
      position: relative !important;
      width: ${w}in !important;
      height: ${h}in !important;
      max-width: ${w}in !important;
      max-height: ${h}in !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      background-color: ${template.backgroundColor || '#FFFFFF'} !important;
      overflow: hidden !important;
    }
    [class*="Guideline"], [class*="BLEED"], [class*="border-dashed"], [class*="ring-2"], [class*="cursor-"], [class*="resize-handle"] {
      display: none !important;
    }
  </style>
</head>
<body class="bg-white">
  ${plateHtml}
</body>
</html>`;

      setExportProgressPercent(35);
      setExportProgressStep('ส่งข้อมูลสู่ Adobe Document Cloud');
      setExportStatusText('กำลังอัปโหลดข้อมูลไปยังเซิร์ฟเวอร์ Adobe Cloud...');
      setExportEstimatedSeconds(4);

      const res = await fetch('/api/catalog/adobe-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: fullHtml,
          pageWidthInches: w,
          pageHeightInches: h,
          filename: `${currentExhibition?.slug || 'catalog'}-Plate-${w}x${h}-Adobe.pdf`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'ไม่สามารถส่งคำขอไปยัง Adobe Cloud ได้');
      }

      const { pollingLocation, filename: outFilename } = await res.json();

      // Poll status on Adobe Cloud
      let downloadUri = '';
      let attempts = 0;
      const maxAttempts = 30;

      while (!downloadUri && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;

        const simulatedPercent = Math.min(88, Math.round(40 + (attempts / 4) * 48));
        setExportProgressPercent(simulatedPercent);
        setExportProgressStep('Adobe PostScript Engine กำลังประมวลผล');
        setExportStatusText(`กำลังประมวลผลบน Adobe Cloud (${attempts * 2}s)...`);
        setExportEstimatedSeconds(Math.max(1, 5 - attempts));

        const pollRes = await fetch(`/api/catalog/adobe-pdf?location=${encodeURIComponent(pollingLocation)}`);
        if (!pollRes.ok) continue;

        const pollData = await pollRes.json();
        if (pollData.status === 'done' && pollData.downloadUri) {
          downloadUri = pollData.downloadUri;
          break;
        } else if (pollData.status === 'failed') {
          throw new Error(pollData.error || 'Adobe Cloud แจ้งว่าการแปลงไฟล์ล้มเหลว');
        }
      }

      if (!downloadUri) {
        throw new Error('หมดเวลาการรอผลจาก Adobe Cloud โปรดลองใหม่อีกครั้ง');
      }

      setExportProgressPercent(95);
      setExportProgressStep('กำลังดาวน์โหลดไฟล์ PDF');
      setExportStatusText('กำลังดาวน์โหลดไฟล์ PDF คุณภาพสูงลงเครื่อง...');
      setExportEstimatedSeconds(1);

      const pdfRes = await fetch(downloadUri);
      const blob = await pdfRes.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = outFilename || `${currentExhibition?.slug || 'catalog'}-Plate-${w}x${h}-Adobe.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Increment monthly quota count
      const updatedQuota = incrementAdobeUsage(1);
      setAdobeQuota(updatedQuota);

      setExportProgressPercent(100);
      setExportProgressStep('เสร็จสมบูรณ์ 100%');
      setExportStatusText('ดาวน์โหลดไฟล์สำเร็จเรียบร้อย');
      setExportEstimatedSeconds(0);

      setTimeout(() => {
        setIsExportingPDF(false);
        setExportStatusText('');
        setExportProgressPercent(0);
      }, 1000);
    } catch (err: any) {
      console.error('Adobe PDF export error:', err);
      alert(`ไม่สามารถสร้าง Adobe PDF ได้: ${err.message || 'โปรดตรวจสอบการเชื่อมต่อ'}`);
      setIsExportingPDF(false);
      setExportStatusText('');
      setExportProgressPercent(0);
    }
  };

  // Export JSON file
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(template, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `${currentExhibition.slug || 'catalog'}-layout.json`);
    dl.click();
  };

  // Import JSON file
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.blocks)) {
          updateTemplateWithHistory(parsed);
          setSelectedBlockId(null);
          alert('นำเข้าเลย์เอาต์สำเร็จ');
        } else {
          alert('ไฟล์ไม่ถูกต้อง: โครงสร้างข้อมูลไม่ตรงกับ CatalogTemplateConfig');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ JSON');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="relative h-screen w-full bg-[#F8F7F4] text-[#1F1C17] overflow-hidden select-none font-sans"
      style={{
        backgroundImage: `radial-gradient(#D5CEBE 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* ========================================================================= */}
      {/* 🚀 AIRY MODERN TOP BAR */}
      {/* ========================================================================= */}
      <header className="absolute top-3.5 left-4 right-4 z-40 flex items-center justify-between pointer-events-none gap-2">
        {/* Left Pill: Back & Exhibition Selector */}
        <div className="flex items-center gap-1.5 bg-white/92 backdrop-blur-xl border border-[#E6E0D4] rounded-full px-3 py-1.5 shadow-sm pointer-events-auto">
          <Link
            href="/admin/exhibitions"
            className="p-1.5 rounded-full hover:bg-black/5 text-[#666] hover:text-[#1F1C17] transition-colors"
            title="กลับหน้ารายการนิทรรศการ"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="h-4 w-px bg-[#E6E0D4] mx-1" />

          {/* Exhibition Dropdown */}
          <select
            value={selectedExhibitionId}
            onChange={(e) => setSelectedExhibitionId(e.target.value)}
            className="bg-transparent text-xs text-[#1F1C17] font-semibold focus:outline-none max-w-[170px] sm:max-w-[220px] truncate cursor-pointer"
          >
            {exhibitions.map((exh) => (
              <option key={exh.id} value={exh.id} className="bg-white text-[#1F1C17]">
                {exh.title}
              </option>
            ))}
          </select>
        </div>

        {/* Center Pill: Canvas Tools */}
        <div className="hidden lg:flex items-center gap-2 bg-white/92 backdrop-blur-xl border border-[#E6E0D4] rounded-full px-3.5 py-1.5 shadow-sm pointer-events-auto text-xs">
          {/* Paper Size */}
          <select
            value={template.paperSize}
            onChange={(e) => handlePaperSizeChange(e.target.value as CatalogPaperSize)}
            className="bg-transparent text-xs text-[#8B1B1B] font-bold focus:outline-none cursor-pointer"
          >
            <option value="square_8x8">8×8&quot; (203mm)</option>
            <option value="square_10x10">10×10&quot; (254mm)</option>
            <option value="a4_portrait">A4 แนวตั้ง</option>
            <option value="a4_landscape">A4 แนวนอน</option>
            <option value="custom">กำหนดเอง…</option>
          </select>

          {template.paperSize === 'custom' && (
            <div className="flex items-center gap-1 ml-1">
              <input
                type="number"
                min="1" max="36" step="0.5"
                value={customWidthInput}
                onChange={(e) => setCustomWidthInput(e.target.value)}
                onBlur={handleApplyCustomPaperSize}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomPaperSize()}
                className="w-10 bg-white border border-[#E6E0D4] rounded text-[10px] font-mono text-[#1F1C17] text-center focus:outline-none px-1 py-0.5"
                title="ความกว้าง (นิ้ว)"
              />
              <span className="text-[10px] text-[#737067]">×</span>
              <input
                type="number"
                min="1" max="36" step="0.5"
                value={customHeightInput}
                onChange={(e) => setCustomHeightInput(e.target.value)}
                onBlur={handleApplyCustomPaperSize}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomPaperSize()}
                className="w-10 bg-white border border-[#E6E0D4] rounded text-[10px] font-mono text-[#1F1C17] text-center focus:outline-none px-1 py-0.5"
                title="ความสูง (นิ้ว)"
              />
              <span className="text-[9px] text-[#737067]">&quot;</span>
            </div>
          )}

          <div className="h-3.5 w-px bg-[#E6E0D4] mx-0.5" />

          {/* Page Background Color Picker */}
          <div className="relative">
            <button
              onClick={() => setIsBgColorOpen(!isBgColorOpen)}
              className={`px-2 py-1 rounded-full flex items-center gap-1.5 text-[11px] transition-all cursor-pointer ${
                isBgColorOpen ? 'bg-[#8B1B1B]/10 border border-[#8B1B1B]/30 text-[#8B1B1B]' : 'text-[#666] hover:text-[#1F1C17] hover:bg-black/5'
              }`}
              title="เปลี่ยนสีพื้นหลังกระดาษ"
            >
              <div
                className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs"
                style={{ backgroundColor: template.backgroundColor || '#FFFFFF' }}
              />
              <span className="hidden xl:inline text-[11px] font-medium text-[#444]">พื้นหลัง</span>
            </button>

            {/* Background Color Popover */}
            {isBgColorOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 bg-white border border-[#E6E0D4] rounded-2xl p-4 shadow-xl w-60 z-50 text-xs text-[#1F1C17]"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E6E0D4]">
                  <span className="font-bold text-[#8B1B1B] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" />
                    สีพื้นหลังกระดาษ
                  </span>
                  <button onClick={() => setIsBgColorOpen(false)} className="p-1 rounded hover:bg-black/5 text-[#777]">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1.5 mb-3">
                  {[
                    { hex: '#FFFFFF', label: 'ขาวกระดาษ' },
                    { hex: '#F5F4F0', label: 'ครีมหอศิลป์' },
                    { hex: '#F0EDE6', label: 'ครีมอุ่น' },
                    { hex: '#EAE6DE', label: 'ทรายทอง' },
                    { hex: '#1F1C17', label: 'ดำชาร์โคล' },
                    { hex: '#141413', label: 'ดำหอศิลป์' },
                    { hex: '#8B1B1B', label: 'แดงเพาะช่าง' },
                    { hex: '#1A2E40', label: 'ครามสยาม' },
                    { hex: '#2D5A3F', label: 'เขียวพงไพร' },
                    { hex: '#C85227', label: 'ส้มดินเผา' },
                    { hex: '#C5A880', label: 'ทองเฮอริเทจ' },
                    { hex: '#D4AF37', label: 'ทองแท้' },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => {
                        updateTemplateWithHistory({ ...template, backgroundColor: c.hex });
                      }}
                      className={`w-7 h-7 rounded-full border transition-all cursor-pointer hover:scale-110 ${
                        template.backgroundColor === c.hex ? 'border-[#8B1B1B] ring-2 ring-[#8B1B1B]/30 scale-110' : 'border-black/10'
                      }`}
                      style={{ backgroundColor: c.hex }}
                      title={c.label}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl px-2 py-1.5">
                  <div className="w-4 h-4 rounded-full border border-black/20" style={{ backgroundColor: template.backgroundColor || '#FFFFFF' }} />
                  <input
                    type="color"
                    value={template.backgroundColor || '#FFFFFF'}
                    onChange={(e) => updateTemplateWithHistory({ ...template, backgroundColor: e.target.value })}
                    className="w-5 h-5 bg-transparent border-none cursor-pointer"
                    title="เลือกสีกำหนดเอง"
                  />
                  <input
                    type="text"
                    value={template.backgroundColor || '#FFFFFF'}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (/^#[0-9A-Fa-f]{6}$/.test(v)) updateTemplateWithHistory({ ...template, backgroundColor: v });
                    }}
                    className="flex-1 bg-transparent text-[11px] font-mono text-[#1F1C17] focus:outline-none"
                    placeholder="#FFFFFF"
                    maxLength={7}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Grid Toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`px-2 py-1 rounded-full flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
              showGrid ? 'bg-[#8B1B1B] text-white shadow-xs' : 'text-[#666] hover:text-[#1F1C17] hover:bg-black/5'
            }`}
            title="เปิด/ปิดเส้น Grid 0.25 นิ้ว"
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">.25&quot;</span>
          </button>

          {/* Magnet Snap */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-2 py-1 rounded-full flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
              snapToGrid ? 'bg-[#8B1B1B]/10 text-[#8B1B1B] border border-[#8B1B1B]/30' : 'text-[#666] hover:text-[#1F1C17] hover:bg-black/5'
            }`}
            title="ระบบดูดเข้าตาราง (Snap to Grid)"
          >
            <Magnet className="w-3.5 h-3.5" />
          </button>

          {/* Margin Settings & Popover */}
          <div className="relative">
            <button
              onClick={() => setIsMarginModalOpen(!isMarginModalOpen)}
              className={`px-2 py-1 rounded-full flex items-center gap-1 text-[11px] transition-all cursor-pointer ${
                isMarginModalOpen || showMarginGuide
                  ? 'bg-[#8B1B1B]/10 text-[#8B1B1B] border border-[#8B1B1B]/30'
                  : 'text-[#666] hover:text-[#1F1C17] hover:bg-black/5'
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
                className="absolute top-full mt-2.5 left-1/2 -translate-x-1/2 bg-white border border-[#E6E0D4] rounded-2xl p-4 shadow-xl w-64 z-50 text-xs text-[#1F1C17]"
              >
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#E6E0D4]">
                  <div className="flex items-center gap-1.5 font-bold text-[#8B1B1B]">
                    <Frame className="w-3.5 h-3.5" />
                    <span>ระยะขอบกระดาษ (Margins)</span>
                  </div>
                  <button
                    onClick={() => setIsMarginModalOpen(false)}
                    className="p-1 rounded hover:bg-black/5 text-[#777]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between p-2 rounded-xl bg-[#F8F7F4] border border-[#E6E0D4] mb-3">
                  <span className="text-[#333] text-xs">แสดงเส้นนำสายตา Margin</span>
                  <button
                    onClick={() => setShowMarginGuide(!showMarginGuide)}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                      showMarginGuide
                        ? 'bg-[#8B1B1B] text-white'
                        : 'bg-white text-[#777] border border-[#E6E0D4]'
                    }`}
                  >
                    {showMarginGuide ? 'เปิดอยู่' : 'ปิด'}
                  </button>
                </div>

                <div className="mb-3">
                  <div className="text-[10px] uppercase font-bold text-[#777] mb-1.5">
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
                              ? 'bg-[#8B1B1B] text-white font-bold shadow-xs'
                              : 'bg-[#F8F7F4] border border-[#E6E0D4] text-[#555] hover:text-[#111] hover:border-[#8B1B1B]'
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="text-[10px] uppercase font-bold text-[#777] mb-1.5">
                    กำหนดเอง (นิ้ว - Inches)
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center justify-between bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg px-2 py-1">
                      <span className="text-[10px] text-[#777]">บน (T)</span>
                      <input
                        type="number"
                        step="0.125"
                        min="0"
                        max="3"
                        value={template.paddingInches?.top ?? 0.5}
                        onChange={(e) =>
                          handleUpdateMargin({ top: parseFloat(e.target.value) || 0 })
                        }
                        className="w-10 bg-transparent text-xs font-mono text-[#1F1C17] text-right focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg px-2 py-1">
                      <span className="text-[10px] text-[#777]">ล่าง (B)</span>
                      <input
                        type="number"
                        step="0.125"
                        min="0"
                        max="3"
                        value={template.paddingInches?.bottom ?? 0.5}
                        onChange={(e) =>
                          handleUpdateMargin({ bottom: parseFloat(e.target.value) || 0 })
                        }
                        className="w-10 bg-transparent text-xs font-mono text-[#1F1C17] text-right focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg px-2 py-1">
                      <span className="text-[10px] text-[#777]">ซ้าย (L)</span>
                      <input
                        type="number"
                        step="0.125"
                        min="0"
                        max="3"
                        value={template.paddingInches?.left ?? 0.5}
                        onChange={(e) =>
                          handleUpdateMargin({ left: parseFloat(e.target.value) || 0 })
                        }
                        className="w-10 bg-transparent text-xs font-mono text-[#1F1C17] text-right focus:outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg px-2 py-1">
                      <span className="text-[10px] text-[#777]">ขวา (R)</span>
                      <input
                        type="number"
                        step="0.125"
                        min="0"
                        max="3"
                        value={template.paddingInches?.right ?? 0.5}
                        onChange={(e) =>
                          handleUpdateMargin({ right: parseFloat(e.target.value) || 0 })
                        }
                        className="w-10 bg-transparent text-xs font-mono text-[#1F1C17] text-right focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Bleed Settings (ระยะตัดตกสำหรับงานพิมพ์) */}
                <div className="pt-2.5 mt-2.5 border-t border-[#E6E0D4]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#8B1B1B]">
                      <Scissors className="w-3.5 h-3.5" />
                      <span>ระยะตัดตก (Bleed)</span>
                    </div>
                    <span className="text-[10px] text-[#777]">สำหรับโรงพิมพ์</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {[
                      { label: 'ปิด (0")', val: 0 },
                      { label: '0.125" (3mm)', val: 0.125 },
                      { label: '0.25" (6mm)', val: 0.25 },
                    ].map((b) => {
                      const isCurr = (template.bleedInches ?? 0) === b.val;
                      return (
                        <button
                          key={b.label}
                          onClick={() => updateTemplateWithHistory({ ...template, bleedInches: b.val })}
                          className={`py-1 rounded-lg text-[10.5px] font-mono transition-all cursor-pointer ${
                            isCurr
                              ? 'bg-[#8B1B1B] text-white font-bold shadow-xs'
                              : 'bg-[#F8F7F4] border border-[#E6E0D4] text-[#555] hover:text-[#111]'
                          }`}
                        >
                          {b.label}
                        </button>
                      );
                    })}
                  </div>
                  {(template.bleedInches ?? 0) > 0 && (
                    <div className="text-[10px] text-red-800 bg-red-50 p-1.5 rounded-lg border border-red-200 leading-tight">
                      ✂️ เปิดระยะตัดตก {template.bleedInches}&quot; (เส้นประสีแดง) สามารถลากรูปภาพหรือเส้นเลยขอบกระดาษจริงได้
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="h-3.5 w-px bg-[#E6E0D4] mx-0.5" />

          {/* Zoom */}
          <button
            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 15))}
            className="p-1 text-[#666] hover:text-[#111] hover:bg-black/5 rounded cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-[#8B1B1B] font-bold w-9 text-center">{zoomLevel}%</span>
          <button
            onClick={() => setZoomLevel(Math.min(150, zoomLevel + 15))}
            className="p-1 text-[#666] hover:text-[#111] hover:bg-black/5 rounded cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-[#E6E0D4] mx-0.5" />

          {/* Undo + Redo pair */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1 text-[#666] hover:text-[#111] hover:bg-black/5 disabled:opacity-30 cursor-pointer rounded"
              title="เลิกทำ Ctrl+Z (Undo)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1 text-[#666] hover:text-[#111] hover:bg-black/5 disabled:opacity-30 cursor-pointer rounded"
              title="ทำซ้ำ Ctrl+Y (Redo)"
            >
              <RotateCcw className="w-3.5 h-3.5 scale-x-[-1]" />
            </button>
          </div>

          {/* Reload Saved Template */}
          <button
            onClick={handleReloadSavedTemplate}
            className="p-1 text-[#666] hover:text-[#8B1B1B] hover:bg-black/5 rounded cursor-pointer"
            title="โหลดเลย์เอาต์ที่บันทึกไว้ล่าสุด"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Export JSON file */}
          <button
            onClick={handleExportJSON}
            className="p-1 text-[#666] hover:text-[#8B1B1B] hover:bg-black/5 rounded cursor-pointer"
            title="ส่งออกไฟล์เลย์เอาต์ (.json)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Import JSON file */}
          <label
            className="p-1 text-[#666] hover:text-[#8B1B1B] hover:bg-black/5 rounded cursor-pointer flex items-center"
            title="นำเข้าไฟล์เลย์เอาต์ (.json)"
          >
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>

        {/* Right Pill: Page Customization Mode, Presets, Export, Save */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* 🌟 PAGE OVERRIDE TOGGLE (Customize this page vs Master) */}
          {activeArtwork?.id && (
            <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl border border-[#E6E0D4] rounded-full px-3 py-1 shadow-xs text-xs">
              {isCurrentPageCustom ? (
                <>
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full shadow-xs animate-pulse">
                    <span>✨</span>
                    <span>จัดเฉพาะหน้านี้ (Custom Page)</span>
                  </span>
                  <button
                    onClick={handleResetCurrentPageToMaster}
                    className="text-[11px] text-[#666] hover:text-[#8B1B1B] hover:underline font-medium cursor-pointer ml-1"
                    title="ยกเลิกการจัดเฉพาะหน้านี้ และคืนค่ากลับไปใช้แม่แบบหลัก"
                  >
                    คืนค่าแม่แบบหลัก
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEnableCustomLayoutForCurrentPage}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-[#444] hover:text-[#8B1B1B] hover:bg-[#8B1B1B]/5 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="ปลดล็อคเพื่อจัดตำแหน่งรูปภาพหรือข้อความเฉพาะผลงานชิ้นนี้ โดยไม่กระทบหน้าอื่น"
                >
                  <Unlock className="w-3.5 h-3.5 text-[#8B1B1B]" />
                  <span>🔓 ปลดล็อคจัดเฉพาะหน้านี้</span>
                </button>
              )}
            </div>
          )}

          {/* Multi-Page Preview Panel Toggle */}
          <button
            onClick={() => setIsPagesPanelOpen(!isPagesPanelOpen)}
            className={`p-2 rounded-full bg-white/92 backdrop-blur-xl border shadow-sm transition-all cursor-pointer ${
              isPagesPanelOpen ? 'border-[#8B1B1B]/40 text-[#8B1B1B] bg-[#8B1B1B]/5' : 'border-[#E6E0D4] text-[#666] hover:text-[#111]'
            }`}
            title={isPagesPanelOpen ? 'ซ่อนแผงพรีวิวหน้า' : 'แสดงแผงพรีวิวทุกหน้า (Multi-Page Preview)'}
          >
            <Layers className="w-4 h-4" />
          </button>

          {/* Preset Library Button */}
          <button
            onClick={() => {
              setPresetModalTab(customPresets.length > 0 ? 'custom' : 'official');
              setIsPresetModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/92 backdrop-blur-xl border border-[#E6E0D4] text-xs font-semibold text-[#444] hover:text-[#8B1B1B] hover:bg-[#8B1B1B]/5 shadow-sm transition-all cursor-pointer"
            title="เปิดคลังแม่แบบสูจิบัตร (Presets)"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8B1B1B]" />
            <span className="hidden sm:inline">แม่แบบ</span>
            {customPresets.length > 0 && (
              <span className="text-[10px] bg-[#8B1B1B]/10 text-[#8B1B1B] font-bold px-1.5 py-0.2 rounded-full">
                {customPresets.length}
              </span>
            )}
          </button>

          {/* Save as Preset Button */}
          <button
            onClick={() => {
              setNewPresetName(template.name || 'แม่แบบกำหนดเอง');
              setNewPresetDesc(template.description || '');
              if (selectedOverwritePresetId && customPresets.some((p) => p.id === selectedOverwritePresetId)) {
                setSavePresetMode('overwrite');
              } else {
                setSavePresetMode('new');
              }
              setIsSavePresetModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/92 backdrop-blur-xl border border-[#E6E0D4] text-xs font-semibold text-[#444] hover:text-[#8B1B1B] hover:bg-[#8B1B1B]/5 shadow-sm transition-all cursor-pointer"
            title="บันทึกเลย์เอาต์ปัจจุบันเป็นแม่แบบใหม่ หรือบันทึกซ้ำลงแม่แบบเดิม"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-[#8B1B1B]" />
            <span className="hidden md:inline">บันทึกเป็นแม่แบบ</span>
          </button>

          {/* Export / Print Dropdown */}
          <div className="relative pointer-events-auto">
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/92 backdrop-blur-xl border border-[#E6E0D4] text-xs font-semibold text-[#444] hover:text-[#8B1B1B] hover:border-[#8B1B1B]/40 shadow-sm transition-all cursor-pointer"
              title="ส่งออกเอกสาร / บันทึก PDF ขนาดตามจริง"
            >
              <Download className="w-3.5 h-3.5 text-[#8B1B1B]" />
              <span>ส่งออก / พิมพ์ PDF</span>
              <ChevronDown className="w-3 h-3 text-[#777]" />
            </button>

            {isExportMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-2 w-72 bg-white/95 backdrop-blur-2xl border border-[#E6E0D4] rounded-2xl p-2 shadow-2xl z-50 animate-fade-in space-y-1"
              >
                <div className="px-3 py-1.5 border-b border-[#E6E0D4] text-[11px] font-bold text-[#8B1B1B] flex items-center justify-between">
                  <span>ขนาดงานจริง: {template.pageWidthInches}&quot; x {template.pageHeightInches}&quot;</span>
                  <span className="text-[10px] text-gray-500 font-normal">({template.paperSize})</span>
                </div>

                {/* 🔥 1. DIRECT DOWNLOAD ADOBE POSTSCRIPT PDF (1-Click) */}
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleDirectDownloadAdobePDF();
                  }}
                  disabled={isExportingPDF || adobeQuota.isExceeded}
                  className={`w-full p-2.5 rounded-xl flex items-start gap-2.5 text-left transition-all cursor-pointer group ${
                    adobeQuota.isExceeded
                      ? 'bg-neutral-100 opacity-60 cursor-not-allowed border border-neutral-200'
                      : 'hover:bg-gradient-to-r hover:from-[#ED2224] hover:to-[#B30B00] hover:text-white bg-red-50/50 border border-red-200/60'
                  }`}
                >
                  <div className={`p-2 rounded-lg text-white transition-colors shrink-0 shadow-sm ${
                    adobeQuota.isExceeded ? 'bg-neutral-400' : 'bg-[#ED2224] group-hover:bg-white group-hover:text-[#ED2224]'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span className={adobeQuota.isExceeded ? 'text-neutral-500' : 'text-[#ED2224] group-hover:text-white transition-colors'}>
                        ดาวน์โหลด Adobe PDF (1-Click)
                      </span>
                      <span className="text-[9px] bg-[#ED2224] text-white group-hover:bg-white group-hover:text-[#ED2224] px-1.5 py-0.2 rounded-full font-bold">
                        Adobe Engine
                      </span>
                    </div>
                    <div className="text-[10.5px] text-[#666] group-hover:text-white/90 leading-tight mt-0.5">
                      {adobeQuota.isExceeded
                        ? 'โควต้าเดือนนี้ครบ 500 ครั้งแล้ว (ใช้ PDF เบราว์เซอร์แทนได้)'
                        : 'เอนจิน PostScript แท้จาก Adobe Cloud คุณภาพสูงสุด 100%'}
                    </div>
                  </div>
                </button>

                {/* 📊 Adobe Monthly Quota Progress Indicator */}
                <div className="mx-1 my-1 p-2 bg-[#FAF9F6] rounded-xl border border-[#E8E2D5]">
                  <div className="flex items-center justify-between text-[10.5px] mb-1">
                    <span className="font-semibold text-[#555] flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${adobeQuota.isExceeded ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
                      โควต้า Adobe ({adobeQuota.monthName}):
                    </span>
                    <span className="font-mono font-bold text-[#1F1C17]">
                      {adobeQuota.used} / {adobeQuota.max} ครั้ง
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E8E2D5] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        adobeQuota.percentUsed >= 90
                          ? 'bg-red-500'
                          : adobeQuota.percentUsed >= 60
                          ? 'bg-amber-500'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${adobeQuota.percentUsed}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[9px] text-[#888] mt-1 font-mono">
                    <span>คงเหลืออีก {adobeQuota.remaining} ครั้ง</span>
                    <span>รีเซ็ตทุกวันที่ 1</span>
                  </div>
                </div>

                {/* 🖨️ 2. Exact Vector PDF Export (Save as PDF) */}
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handlePrintStudioCurrentPage();
                  }}
                  className="w-full p-2.5 rounded-xl bg-[#8B1B1B]/5 hover:bg-[#8B1B1B] text-left transition-all cursor-pointer group border border-[#8B1B1B]/20 hover:border-[#8B1B1B]"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-2 rounded-lg bg-[#8B1B1B] text-white group-hover:bg-white group-hover:text-[#8B1B1B] transition-colors shrink-0">
                      <Download className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#8B1B1B] group-hover:text-white transition-colors flex items-center gap-1.5">
                        <span>บันทึกเป็น PDF ผ่านเบราว์เซอร์</span>
                        <span className="text-[9.5px] bg-[#8B1B1B] text-white group-hover:bg-white group-hover:text-[#8B1B1B] px-1.5 py-0.2 rounded-full font-mono">
                          {template.pageWidthInches}&quot;x{template.pageHeightInches}&quot;
                        </span>
                      </div>
                      <div className="text-[10.5px] text-[#666] group-hover:text-white/90 leading-tight mt-0.5">
                        ฟอนต์ภาษาไทยและภาพคมชัด (เลือก &apos;Save as PDF&apos; หรือ &apos;Adobe PDF&apos;)
                      </div>
                    </div>
                  </div>
                </button>

                {/* 🖼️ 2. DIRECT DOWNLOAD HIGH-RES PNG */}
                <button
                  onClick={() => {
                    setIsExportMenuOpen(false);
                    handleDirectDownloadPNG();
                  }}
                  disabled={isExportingPDF}
                  className="w-full p-2.5 rounded-xl hover:bg-[#F8F7F4] flex items-start gap-2.5 text-left transition-colors cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-black/5 text-[#444] group-hover:bg-[#8B1B1B] group-hover:text-white transition-colors shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1F1C17] group-hover:text-[#8B1B1B] transition-colors">
                      ดาวน์โหลดเป็นรูปภาพ PNG (300 DPI)
                    </div>
                    <div className="text-[10.5px] text-[#777] leading-tight mt-0.5">
                      ภาพความละเอียดสูงสำหรับส่งโรงพิมพ์หรืองานกราฟิก
                    </div>
                  </div>
                </button>

                {/* 📚 3. Full Catalog Continuous View */}
                {currentExhibition?.slug && (
                  <Link
                    href={`/catalog/${currentExhibition.slug}?mode=full`}
                    target="_blank"
                    onClick={() => setIsExportMenuOpen(false)}
                    className="w-full p-2.5 rounded-xl hover:bg-[#F8F7F4] flex items-start gap-2.5 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-black/5 text-[#444] group-hover:bg-[#8B1B1B] group-hover:text-white transition-colors shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1F1C17] group-hover:text-[#8B1B1B] transition-colors">
                        เปิดสูจิบัตรทั้งเล่ม (ทุกหน้ารวมกัน)
                      </div>
                      <div className="text-[10.5px] text-[#777] leading-tight mt-0.5">
                        เปิดหน้ารวมสูจิบัตรต่อเนื่อง
                      </div>
                    </div>
                  </Link>
                )}

                {/* Online Catalog Preview */}
                {currentExhibition?.slug && (
                  <Link
                    href={`/catalog/${currentExhibition.slug}?preview=admin`}
                    target="_blank"
                    onClick={() => setIsExportMenuOpen(false)}
                    className="w-full p-2.5 rounded-xl hover:bg-[#F8F7F4] flex items-start gap-2.5 text-left transition-colors cursor-pointer group"
                  >
                    <div className="p-2 rounded-lg bg-black/5 text-[#555] group-hover:bg-[#8B1B1B] group-hover:text-white transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1F1C17] group-hover:text-[#8B1B1B] transition-colors">
                        เปิดดูสูจิบัตรออนไลน์จริง (Web Viewer)
                      </div>
                      <div className="text-[10.5px] text-[#777] leading-tight">
                        เปิดดูในมุมมอง E-Book / Reader เต็มจอ
                      </div>
                    </div>
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveTemplate}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#8B1B1B] hover:bg-[#721616] text-white text-xs font-bold shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            title="บันทึกเลย์เอาต์ทั้งหมด"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 🧩 SLIM FLOATING MODULE DOCK (Left Quick Add) */}
      {/* ========================================================================= */}
      <div className="absolute left-4 top-20 bottom-20 z-30 flex flex-col items-start pointer-events-none">
        <div className="bg-white/92 backdrop-blur-xl border border-[#E6E0D4] rounded-2xl p-1.5 shadow-md flex flex-col gap-1 pointer-events-auto max-h-full overflow-y-auto custom-scrollbar">
          {AVAILABLE_MODULES.map((mod) => {
            const IconComp = mod.icon;
            const isUsed = template.blocks.some((b) => b.type === mod.type);

            return (
              <button
                key={mod.type}
                onClick={() => handleAddModule(mod.type)}
                className={`group relative p-2 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                  isUsed
                    ? 'bg-[#8B1B1B]/10 text-[#8B1B1B] border border-[#8B1B1B]/20 hover:bg-[#8B1B1B]/15'
                    : 'text-[#666] hover:text-[#111] hover:bg-black/5'
                }`}
                title={`เพิ่ม ${mod.label}`}
              >
                <IconComp className="w-4 h-4" />

                {/* Floating Tooltip */}
                <div className="absolute left-full ml-3 px-2.5 py-1 bg-[#1F1C17] text-white text-[11px] font-medium rounded-lg shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
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
        {/* Floating Sample Artwork Switcher Pill */}
        <div
          onClick={(e) => e.stopPropagation()}
          className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-white/95 backdrop-blur-xl px-3.5 py-1.5 rounded-full border shadow-md text-xs transition-all hover:shadow-lg ${
            isCurrentPageCustom ? 'border-amber-400 bg-amber-50/90 ring-2 ring-amber-400/40' : 'border-[#E6E0D4]'
          }`}
          title="ตัวอย่างผลงานที่นำมาพรีวิวบนแม่แบบ"
        >
          <button
            onClick={() =>
              handleSelectArtworkIndex(
                (sampleArtworkIndex - 1 + (exhibitionArtworks.length || 1)) % (exhibitionArtworks.length || 1)
              )
            }
            className="p-1 rounded-full hover:bg-black/5 text-[#666] hover:text-[#111] transition-colors cursor-pointer"
            title="ผลงานก่อนหน้า"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-semibold text-[#1F1C17] truncate max-w-[140px] sm:max-w-[180px]" title={activeArtwork.title}>
            {activeArtwork.title}
          </span>
          {isCurrentPageCustom && (
            <span className="text-[9px] font-bold text-amber-900 bg-amber-200/90 px-1.5 py-0.5 rounded-full shrink-0 flex items-center gap-0.5 shadow-xs">
              <span>✨</span>
              <span>เฉพาะหน้า</span>
            </span>
          )}
          <button
            onClick={() =>
              handleSelectArtworkIndex((sampleArtworkIndex + 1) % (exhibitionArtworks.length || 1))
            }
            className="p-1 rounded-full hover:bg-black/5 text-[#666] hover:text-[#111] transition-colors cursor-pointer"
            title="ผลงานถัดไป"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-[#8B1B1B] font-mono font-bold pl-1.5 border-l border-[#E6E0D4]">
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
          <div className="absolute -top-6 left-0 right-0 flex justify-between text-[11px] font-mono text-[#777]">
            <span>{template.pageWidthInches}&quot;</span>
            <span className="text-[#8B1B1B] font-bold">
              {template.paperSize} {isCurrentPageCustom && '• ✨ เฉพาะหน้า'}
            </span>
            <span>{template.pageHeightInches}&quot;</span>
          </div>

          {/* Interactive Page Canvas */}
          <div
            ref={canvasRef}
            id="catalog-studio-print-target"
            onClick={(e) => e.stopPropagation()}
            className="relative select-none rounded-[2px]"
            style={{
              width: `${template.pageWidthInches * 96}px`,
              height: `${template.pageHeightInches * 96}px`,
              backgroundColor: template.backgroundColor || '#FFFFFF',
              boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Bleed Area Guideline Outline (ระยะตัดตกเส้นประสีแดง) */}
            {(template.bleedInches ?? 0) > 0 && (
              <div
                className="absolute border-2 border-dashed border-red-500/80 pointer-events-none z-30"
                style={{
                  top: `-${(template.bleedInches || 0) * 96}px`,
                  left: `-${(template.bleedInches || 0) * 96}px`,
                  right: `-${(template.bleedInches || 0) * 96}px`,
                  bottom: `-${(template.bleedInches || 0) * 96}px`,
                }}
              >
                <span className="absolute -top-5 left-0 text-[8.5px] font-mono font-bold text-red-600 bg-white/95 px-1.5 py-0.5 rounded shadow-xs border border-red-200">
                  ✂️ BLEED {(template.bleedInches || 0)}&quot; (ระยะตัดตกโรงพิมพ์)
                </span>
              </div>
            )}

            {/* 0.25-Inch Grid Lines */}
            {showGrid && (
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(0, 0, 0, 0.04) 1px, transparent 1px),
                    linear-gradient(to right, rgba(139, 27, 27, 0.08) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(139, 27, 27, 0.08) 1px, transparent 1px)
                  `,
                  backgroundSize: `
                    24px 24px, 24px 24px,
                    96px 96px, 96px 96px
                  `,
                }}
              />
            )}

            {/* Dynamic Artwork Plate Renderer */}
            <div className="absolute inset-0 z-10 pointer-events-none">
              <CatalogDynamicPlate
                artwork={activeArtwork}
                template={template}
                pageNumber={sampleArtworkIndex + 1}
                selectedBlockId={selectedBlockId}
                onImageNaturalRatio={(blockId, ratio) => {
                  setImageRatios((prev) => ({ ...prev, [blockId]: ratio }));
                }}
              />
            </div>

            {/* Margin Guide Outlines */}
            {showMarginGuide && template.paddingInches && (
              <div
                className="absolute border border-dashed border-[#8B1B1B]/40 pointer-events-none z-15"
                style={{
                  top: `${(template.paddingInches.top || 0) * 96}px`,
                  bottom: `${(template.paddingInches.bottom || 0) * 96}px`,
                  left: `${(template.paddingInches.left || 0) * 96}px`,
                  right: `${(template.paddingInches.right || 0) * 96}px`,
                }}
              >
                <span className="absolute top-1 left-1 text-[8px] font-mono text-[#8B1B1B]/60 tracking-wider">
                  MARGIN {(template.paddingInches.top || 0.5)}&quot;
                </span>
              </div>
            )}

            {/* Interactive Block Overlays & Resize Handles */}
            <div className="absolute inset-0 z-20">
              {template.blocks.map((block) => {
                const isSelected = block.id === selectedBlockId;
                const blockPxX = block.xInches * 96;
                const blockPxY = block.yInches * 96;
                const blockPxW = block.widthInches * 96;
                const blockPxH = block.heightInches * 96;

                return (
                  <div
                    key={block.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBlockId(block.id);
                    }}
                    onMouseDown={(e) => {
                      if (e.button !== 0) return;
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
                    style={{
                      left: `${blockPxX}px`,
                      top: `${blockPxY}px`,
                      width: `${blockPxW}px`,
                      height: `${blockPxH}px`,
                      zIndex: isSelected ? 50 : block.zIndex,
                    }}
                    className={`absolute group cursor-move transition-shadow ${
                      isSelected
                        ? 'ring-2 ring-[#8B1B1B] ring-offset-1 bg-[#8B1B1B]/5'
                        : 'hover:ring-1 hover:ring-[#8B1B1B]/40 hover:bg-[#8B1B1B]/5'
                    }`}
                  >
                    {/* Badge Label */}
                    <div
                      className={`absolute -top-4 left-0 px-1.5 py-0.2 rounded text-[8.5px] font-medium font-sans whitespace-nowrap transition-opacity pointer-events-none ${
                        isSelected
                          ? 'bg-[#8B1B1B] text-white opacity-100 shadow-xs'
                          : 'bg-[#1F1C17]/80 text-white opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {block.label} ({block.widthInches.toFixed(2)}&quot; × {block.heightInches.toFixed(2)}&quot;)
                    </div>

                    {/* Resize Handles (8 Points) */}
                    {isSelected && (
                      <>
                        {[
                          { handle: 'nw', posStyle: '-top-1 -left-1', cursorStyle: 'cursor-nwse-resize' },
                          { handle: 'ne', posStyle: '-top-1 -right-1', cursorStyle: 'cursor-nesw-resize' },
                          { handle: 'se', posStyle: '-bottom-1 -right-1', cursorStyle: 'cursor-nwse-resize' },
                          { handle: 'sw', posStyle: '-bottom-1 -left-1', cursorStyle: 'cursor-nesw-resize' },
                          { handle: 'n', posStyle: '-top-1 left-1/2 -translate-x-1/2', cursorStyle: 'cursor-ns-resize' },
                          { handle: 's', posStyle: '-bottom-1 left-1/2 -translate-x-1/2', cursorStyle: 'cursor-ns-resize' },
                          { handle: 'w', posStyle: 'top-1/2 -left-1 -translate-y-1/2', cursorStyle: 'cursor-ew-resize' },
                          { handle: 'e', posStyle: 'top-1/2 -right-1 -translate-y-1/2', cursorStyle: 'cursor-ew-resize' },
                        ].map(({ handle, posStyle, cursorStyle }) => {
                          return (
                            <div
                              key={handle}
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setDragState({
                                  blockId: block.id,
                                  isDragging: false,
                                  isResizing: true,
                                  resizeHandle: handle as any,
                                  startX: e.clientX,
                                  startY: e.clientY,
                                  initialBlockX: block.xInches,
                                  initialBlockY: block.yInches,
                                  initialBlockW: block.widthInches,
                                  initialBlockH: block.heightInches,
                                });
                              }}
                              className={`absolute w-2.5 h-2.5 bg-white border border-[#8B1B1B] rounded-full shadow-xs z-30 ${posStyle} ${cursorStyle}`}
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
      {/* 📋 MULTI-PAGE PREVIEW PANEL (Right Sidebar) */}
      {/* ========================================================================= */}
      {isPagesPanelOpen && exhibitionArtworks.length > 0 && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed right-4 top-20 bottom-20 z-30 flex flex-col pointer-events-auto"
        >
          <div className="bg-white/95 backdrop-blur-xl border border-[#E6E0D4] rounded-2xl p-2.5 shadow-lg flex flex-col gap-2 w-36 sm:w-40 max-h-full overflow-y-auto custom-scrollbar">
            {/* Panel Header with summary */}
            <div className="text-center pb-2 border-b border-[#E6E0D4] space-y-1">
              <div className="text-[11px] font-bold text-[#1F1C17] flex items-center justify-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#8B1B1B]" />
                <span>ทุกหน้า ({exhibitionArtworks.length})</span>
              </div>
              {Object.keys(pageOverrides).length > 0 && (
                <div className="text-[9.5px] font-bold text-amber-900 bg-amber-100 border border-amber-300 rounded-full px-2 py-0.5 inline-flex items-center gap-1 shadow-xs">
                  <span>✨</span>
                  <span>จัดเฉพาะ {Object.keys(pageOverrides).length} หน้า</span>
                </div>
              )}
            </div>

            {/* Artwork Thumbnails */}
            {exhibitionArtworks.map((art, idx) => {
              const isActive = idx === sampleArtworkIndex % exhibitionArtworks.length;
              const hasCustomLayout = Boolean(pageOverrides[art.id]);

              return (
                <button
                  key={art.id}
                  onClick={() => handleSelectArtworkIndex(idx)}
                  className={`relative group flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? 'bg-[#8B1B1B]/10 ring-2 ring-[#8B1B1B] shadow-sm'
                      : hasCustomLayout
                      ? 'bg-amber-50/80 border border-amber-300/90 hover:bg-amber-100/70'
                      : 'bg-gray-50/80 hover:bg-black/5 border border-transparent'
                  }`}
                  title={`หน้า ${idx + 1}: ${art.title} ${hasCustomLayout ? '(จัดเลย์เอาต์เฉพาะหน้านี้)' : ''}`}
                >
                  {/* Card Top Row: Page Number + Status Pill */}
                  <div className="w-full flex items-center justify-between gap-1">
                    <span
                      className={`text-[9.5px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isActive ? 'bg-[#8B1B1B] text-white' : 'bg-white text-gray-700 border border-gray-200'
                      }`}
                    >
                      #{idx + 1}
                    </span>

                    {hasCustomLayout ? (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs flex items-center gap-0.5">
                        <span>✨</span>
                        <span>เฉพาะหน้า</span>
                      </span>
                    ) : (
                      <span className="text-[8.5px] text-gray-400 group-hover:text-gray-600">
                        แม่แบบหลัก
                      </span>
                    )}
                  </div>

                  {/* Miniature Canvas Preview */}
                  <div
                    className="relative w-full overflow-hidden rounded shadow-xs"
                    style={{
                      aspectRatio: `${template.pageWidthInches} / ${template.pageHeightInches}`,
                      backgroundColor:
                        (hasCustomLayout ? pageOverrides[art.id]?.backgroundColor : masterTemplate.backgroundColor) ||
                        '#FFFFFF',
                      border: isActive
                        ? '1.5px solid #8B1B1B'
                        : hasCustomLayout
                        ? '1.5px solid #F59E0B'
                        : '1px solid rgba(0,0,0,0.1)',
                    }}
                  >
                    {art.imageUrl ? (
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-contain p-1"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-400">
                        ไม่มีรูป
                      </div>
                    )}
                  </div>

                  {/* Artwork Title */}
                  <span
                    className={`text-[9.5px] leading-tight text-center line-clamp-2 w-full ${
                      isActive
                        ? 'text-[#8B1B1B] font-bold'
                        : hasCustomLayout
                        ? 'text-amber-950 font-bold'
                        : 'text-[#555]'
                    }`}
                  >
                    {art.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🎛️ AIRY CONTEXTUAL INSPECTOR PILL (Selected Block) */}
      {/* ========================================================================= */}
      {selectedBlock && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-2xl border border-[#E6E0D4] rounded-2xl p-2 px-4 shadow-xl flex flex-wrap items-center gap-3 text-xs text-[#1F1C17] max-w-[95vw] overflow-x-auto"
        >
          {/* Block Label & Quick Actions */}
          <div className="flex items-center gap-2 pr-2 border-r border-[#E6E0D4]">
            <span className="font-bold text-[#8B1B1B]">{selectedBlock.label}</span>
            <button
              onClick={() => handleDuplicateBlock(selectedBlock.id)}
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#666] hover:text-[#111]"
              title="ทำสำเนา"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteBlock(selectedBlock.id)}
              className="p-1.5 rounded-lg hover:bg-red-50 text-[#666] hover:text-red-600"
              title="ลบ"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 bg-[#F8F7F4] p-0.5 rounded-xl border border-[#E6E0D4]">
            <button
              onClick={() => handleSetAlignment('left')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedBlock.style.textAlign === 'left' || !selectedBlock.style.textAlign
                  ? 'bg-[#8B1B1B] text-white shadow-xs'
                  : 'text-[#666] hover:text-[#111]'
              }`}
              title="จัดชิดซ้าย"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSetAlignment('center')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedBlock.style.textAlign === 'center'
                  ? 'bg-[#8B1B1B] text-white shadow-xs'
                  : 'text-[#666] hover:text-[#111]'
              }`}
              title="จัดกึ่งกลาง"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSetAlignment('right')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedBlock.style.textAlign === 'right'
                  ? 'bg-[#8B1B1B] text-white shadow-xs'
                  : 'text-[#666] hover:text-[#111]'
              }`}
              title="จัดชิดขวา"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleSetAlignment('justify')}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                selectedBlock.style.textAlign === 'justify'
                  ? 'bg-[#8B1B1B] text-white shadow-xs'
                  : 'text-[#666] hover:text-[#111]'
              }`}
              title="จัดเต็มบรรทัด (Justify)"
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Center Page */}
          <div className="flex items-center gap-1 border-r border-[#E6E0D4] pr-2">
            <button
              onClick={() => handleCenterBlock('h')}
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#666] hover:text-[#111]"
              title="จัดกึ่งกลางแนวนอนของหน้า"
            >
              <AlignCenterHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleCenterBlock('v')}
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#666] hover:text-[#111]"
              title="จัดกึ่งกลางแนวตั้งของหน้า"
            >
              <AlignCenterVertical className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Layer Order */}
          <div className="flex items-center gap-1 border-r border-[#E6E0D4] pr-2">
            <button
              onClick={() => handleZIndex('front')}
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#666] hover:text-[#111]"
              title="นำมาไว้หน้าสุด (Bring to Front)"
            >
              <BringToFront className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZIndex('back')}
              className="p-1.5 rounded-lg hover:bg-black/5 text-[#666] hover:text-[#111]"
              title="ส่งไปไว้หลังสุด (Send to Back)"
            >
              <SendToBack className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Dimensions & Positions */}
          <div className="flex items-center gap-1.5 bg-[#F8F7F4] px-2 py-1 rounded-xl border border-[#E6E0D4] text-[11px] font-mono">
            <span className="text-[#777]">X:</span>
            <input
              type="number"
              step="0.125"
              value={selectedBlock.xInches}
              onChange={(e) =>
                handleUpdateBlockProp(selectedBlock.id, { xInches: parseFloat(e.target.value) || 0 })
              }
              className="w-10 bg-transparent text-[#1F1C17] text-right focus:outline-none"
            />
            <span className="text-[#777]">Y:</span>
            <input
              type="number"
              step="0.125"
              value={selectedBlock.yInches}
              onChange={(e) =>
                handleUpdateBlockProp(selectedBlock.id, { yInches: parseFloat(e.target.value) || 0 })
              }
              className="w-10 bg-transparent text-[#1F1C17] text-right focus:outline-none"
            />
            <span className="text-[#777] ml-1">W:</span>
            <input
              type="number"
              step="0.125"
              value={selectedBlock.widthInches}
              onChange={(e) =>
                handleUpdateBlockProp(selectedBlock.id, { widthInches: parseFloat(e.target.value) || 0.5 })
              }
              className="w-10 bg-transparent text-[#1F1C17] text-right focus:outline-none"
            />
            <span className="text-[#777]">H:</span>
            <input
              type="number"
              step="0.125"
              value={selectedBlock.heightInches}
              onChange={(e) =>
                handleUpdateBlockProp(selectedBlock.id, { heightInches: parseFloat(e.target.value) || 0.2 })
              }
              className="w-10 bg-transparent text-[#1F1C17] text-right focus:outline-none"
            />
          </div>

          {/* Typography Controls */}
          {['artwork_title', 'artist_name', 'artist_email', 'medium', 'dimensions', 'year_created', 'price', 'concept', 'page_number', 'custom_text'].includes(
            selectedBlock.type
          ) && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E6E0D4]">
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
                className="bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg px-2 py-1 text-xs text-[#1F1C17] focus:outline-none"
              >
                <option value="Maitree">Maitree (เพาะช่าง)</option>
                <option value="Sarabun">Sarabun (ทางการ)</option>
                <option value="Cinzel">Cinzel (คลาสสิก)</option>
                <option value="Inter">Inter (มินิมอล)</option>
                <option value="Prompt">Prompt (ร่วมสมัย)</option>
              </select>

              {/* Font Size */}
              <div className="flex items-center bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg px-2 py-1">
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
                  className="w-8 bg-transparent text-xs font-mono text-[#1F1C17] text-center focus:outline-none"
                />
                <span className="text-[10px] text-[#777]">pt</span>
              </div>

              {/* Font Weight */}
              <div className="flex items-center bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg p-0.5 text-xs">
                <button
                  onClick={() =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, fontWeight: 'light' } },
                      true
                    )
                  }
                  className={`px-2 py-0.5 rounded text-[11px] font-light transition-all cursor-pointer ${
                    selectedBlock.style.fontWeight === 'light'
                      ? 'bg-[#8B1B1B] text-white font-bold shadow-xs'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                  title="ตัวบาง"
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
                  className={`px-2 py-0.5 rounded text-[11px] font-normal transition-all cursor-pointer ${
                    !selectedBlock.style.fontWeight || selectedBlock.style.fontWeight === 'normal'
                      ? 'bg-[#8B1B1B] text-white font-bold shadow-xs'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                  title="ตัวปกติ"
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
                  className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    selectedBlock.style.fontWeight === 'bold' || selectedBlock.style.fontWeight === 'semibold' || selectedBlock.style.fontWeight === 'black'
                      ? 'bg-[#8B1B1B] text-white shadow-xs'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                  title="ตัวหนา"
                >
                  หนา
                </button>
              </div>

              {/* Font Style (Italic & Underline) */}
              <div className="flex items-center gap-0.5 bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg p-0.5">
                <button
                  onClick={() => {
                    const isItalic = selectedBlock.style.fontStyle === 'italic';
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, fontStyle: isItalic ? 'normal' : 'italic' } },
                      true
                    );
                  }}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    selectedBlock.style.fontStyle === 'italic'
                      ? 'bg-[#8B1B1B] text-white shadow-xs'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                  title="ตัวเอียง (Italic)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    const isUnderline = selectedBlock.style.textDecoration === 'underline';
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, textDecoration: isUnderline ? 'none' : 'underline' } },
                      true
                    );
                  }}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    selectedBlock.style.textDecoration === 'underline'
                      ? 'bg-[#8B1B1B] text-white shadow-xs'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                  title="ขีดเส้นใต้ (Underline)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Color Picker */}
              <div className="flex items-center gap-1 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl px-2 py-1">
                <input
                  type="color"
                  value={selectedBlock.style.color || '#1A1918'}
                  onChange={(e) =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, color: e.target.value } },
                      true
                    )
                  }
                  className="w-4 h-4 bg-transparent border-none cursor-pointer"
                  title="เลือกสีข้อความ"
                />
                <input
                  type="text"
                  value={selectedBlock.style.color || '#1A1918'}
                  onChange={(e) =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, color: e.target.value } },
                      true
                    )
                  }
                  className="w-16 bg-transparent text-[11px] font-mono text-[#1F1C17] focus:outline-none uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          )}

          {/* 📏 LINE / BOX STYLING CONTROLS (Divider Line & Custom Box) */}
          {['divider_line', 'custom_box'].includes(selectedBlock.type) && (
            <div className="flex items-center gap-2 pl-2 border-l border-[#E6E0D4]">
              {/* Line / Border Thickness */}
              <div className="flex items-center gap-1 bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg px-2 py-1">
                <span className="text-[10px] text-[#777]">ความหนา:</span>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={selectedBlock.style.borderWidth || 1}
                  onChange={(e) =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, borderWidth: parseInt(e.target.value) || 1 } },
                      true
                    )
                  }
                  className="w-7 bg-transparent text-xs font-mono text-[#1F1C17] text-center focus:outline-none font-bold"
                />
                <span className="text-[10px] text-[#777]">px</span>
              </div>

              {/* Quick Thickness Presets */}
              <div className="flex items-center gap-0.5 bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg p-0.5 text-xs">
                {[1, 2, 3, 5, 8].map((w) => (
                  <button
                    key={w}
                    onClick={() =>
                      handleUpdateBlockProp(
                        selectedBlock.id,
                        { style: { ...selectedBlock.style, borderWidth: w } },
                        true
                      )
                    }
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-all cursor-pointer ${
                      (selectedBlock.style.borderWidth || 1) === w
                        ? 'bg-[#8B1B1B] text-white font-bold shadow-xs'
                        : 'text-[#666] hover:text-[#111]'
                    }`}
                  >
                    {w}px
                  </button>
                ))}
              </div>

              {/* Line Style (ทึบ, ประ, จุดไข่ปลา) */}
              <div className="flex items-center bg-[#F8F7F4] border border-[#E6E0D4] rounded-lg p-0.5 text-xs">
                <button
                  onClick={() =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, borderStyle: 'solid' } },
                      true
                    )
                  }
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    !selectedBlock.style.borderStyle || selectedBlock.style.borderStyle === 'solid'
                      ? 'bg-[#8B1B1B] text-white font-bold shadow-xs'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                  title="เส้นทึบ (Solid)"
                >
                  — ทึบ
                </button>
                <button
                  onClick={() =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, borderStyle: 'dashed' } },
                      true
                    )
                  }
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    selectedBlock.style.borderStyle === 'dashed'
                      ? 'bg-[#8B1B1B] text-white font-bold shadow-xs'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                  title="เส้นประ (Dashed)"
                >
                  - - ประ
                </button>
                <button
                  onClick={() =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, borderStyle: 'dotted' } },
                      true
                    )
                  }
                  className={`px-2 py-1 rounded text-[11px] font-medium transition-all cursor-pointer ${
                    selectedBlock.style.borderStyle === 'dotted'
                      ? 'bg-[#8B1B1B] text-white font-bold shadow-xs'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                  title="เส้นจุดไข่ปลา (Dotted)"
                >
                  ··· จุด
                </button>
              </div>

              {/* Line / Border Color */}
              <div className="flex items-center gap-1.5 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl px-2 py-1">
                <span className="text-[10px] text-[#777]">สีเส้น:</span>
                <input
                  type="color"
                  value={selectedBlock.style.borderColor || selectedBlock.style.color || '#C5A880'}
                  onChange={(e) =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, borderColor: e.target.value, color: e.target.value } },
                      true
                    )
                  }
                  className="w-4 h-4 bg-transparent border-none cursor-pointer"
                  title="เลือกสีเส้น"
                />
                <input
                  type="text"
                  value={selectedBlock.style.borderColor || selectedBlock.style.color || '#C5A880'}
                  onChange={(e) =>
                    handleUpdateBlockProp(
                      selectedBlock.id,
                      { style: { ...selectedBlock.style, borderColor: e.target.value, color: e.target.value } },
                      true
                    )
                  }
                  className="w-16 bg-transparent text-[11px] font-mono text-[#1F1C17] focus:outline-none uppercase"
                  maxLength={7}
                />
              </div>

              {/* Quick Palette Colors for Line */}
              <div className="flex items-center gap-1">
                {[
                  { hex: '#C5A880', title: 'ทองเฮอริเทจ' },
                  { hex: '#8B1B1B', title: 'แดงเพาะช่าง' },
                  { hex: '#1F1C17', title: 'ชาร์โคลดำ' },
                  { hex: '#E2DFD7', title: 'เทาอ่อน' },
                  { hex: '#1A2E40', title: 'ครามสยาม' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() =>
                      handleUpdateBlockProp(
                        selectedBlock.id,
                        { style: { ...selectedBlock.style, borderColor: c.hex, color: c.hex } },
                        true
                      )
                    }
                    className="w-4 h-4 rounded-full border border-black/20 hover:scale-125 transition-transform"
                    style={{ backgroundColor: c.hex }}
                    title={c.title}
                  />
                ))}
              </div>

              {/* If custom_box, allow background fill */}
              {selectedBlock.type === 'custom_box' && (
                <div className="flex items-center gap-1.5 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl px-2 py-1">
                  <span className="text-[10px] text-[#777]">สีพื้น:</span>
                  <input
                    type="color"
                    value={selectedBlock.style.backgroundColor || '#FAF8F5'}
                    onChange={(e) =>
                      handleUpdateBlockProp(
                        selectedBlock.id,
                        { style: { ...selectedBlock.style, backgroundColor: e.target.value } },
                        true
                      )
                    }
                    className="w-4 h-4 bg-transparent border-none cursor-pointer"
                    title="เลือกสีพื้นหลังกล่อง"
                  />
                  <button
                    onClick={() =>
                      handleUpdateBlockProp(
                        selectedBlock.id,
                        { style: { ...selectedBlock.style, backgroundColor: 'transparent' } },
                        true
                      )
                    }
                    className="text-[9.5px] text-[#8B1B1B] hover:underline"
                    title="ทำให้พื้นหลังโปร่งใส"
                  >
                    โปร่งใส
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Opacity Control */}
          <div className="flex items-center gap-1.5 bg-[#F8F7F4] px-2 py-1 rounded-xl border border-[#E6E0D4] text-xs">
            <Eye className="w-3 h-3 text-[#777]" />
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={Math.round((selectedBlock.style.opacity ?? 1) * 100)}
              onChange={(e) => {
                const op = parseInt(e.target.value) / 100;
                handleUpdateBlockProp(selectedBlock.id, { style: { ...selectedBlock.style, opacity: op } }, true);
              }}
              className="w-16 accent-[#8B1B1B] h-1 bg-black/10 rounded cursor-pointer"
              title="ปรับความโปร่งแสง (Opacity)"
            />
            <span className="text-[10px] font-mono text-[#1F1C17] w-6 text-right">
              {Math.round((selectedBlock.style.opacity ?? 1) * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 📐 PRESET TEMPLATES LIBRARY MODAL */}
      {/* ========================================================================= */}
      {isPresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E6E0D4] rounded-2xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E6E0D4] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#8B1B1B]/10 text-[#8B1B1B]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#1F1C17]">
                    คลังแม่แบบสูจิบัตร (Catalog Layout Templates)
                  </h3>
                  <p className="text-xs text-[#777]">
                    เลือกใช้แม่แบบ บันทึกแม่แบบของคุณ หรือส่งออกไฟล์ไปใช้งานต่อ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setNewPresetName(template.name || 'แม่แบบกำหนดเอง');
                    setNewPresetDesc(template.description || '');
                    setSavePresetMode('new');
                    setIsPresetModalOpen(false);
                    setIsSavePresetModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#8B1B1B] hover:bg-[#721616] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>บันทึกเลย์เอาต์ปัจจุบัน</span>
                </button>
                <button
                  onClick={() => setIsPresetModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-black/5 text-[#777]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#E6E0D4] bg-[#FAF8F5]/50">
              <button
                onClick={() => setPresetModalTab('custom')}
                className={`flex items-center gap-2 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  presetModalTab === 'custom'
                    ? 'border-[#8B1B1B] text-[#8B1B1B]'
                    : 'border-transparent text-[#777] hover:text-[#111]'
                }`}
              >
                <span>แม่แบบของฉัน (My Templates)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  presetModalTab === 'custom' ? 'bg-[#8B1B1B]/10 text-[#8B1B1B]' : 'bg-black/5 text-[#777]'
                }`}>
                  {customPresets.length}
                </span>
              </button>
              <button
                onClick={() => setPresetModalTab('official')}
                className={`flex items-center gap-2 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  presetModalTab === 'official'
                    ? 'border-[#8B1B1B] text-[#8B1B1B]'
                    : 'border-transparent text-[#777] hover:text-[#111]'
                }`}
              >
                <span>แม่แบบมาตรฐานหอศิลป์ (Official Presets)</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  presetModalTab === 'official' ? 'bg-[#8B1B1B]/10 text-[#8B1B1B]' : 'bg-black/5 text-[#777]'
                }`}>
                  {BUILTIN_CATALOG_PRESETS.length}
                </span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {presetModalTab === 'custom' ? (
                <div>
                  {customPresets.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <div className="p-4 rounded-2xl bg-[#F8F7F4] border border-[#E6E0D4] text-[#8B1B1B] mb-3">
                        <BookmarkPlus className="w-8 h-8 opacity-60" />
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#1F1C17] mb-1">
                        ยังไม่มีแม่แบบที่คุณบันทึกไว้
                      </h4>
                      <p className="text-xs text-[#777] max-w-sm mb-4">
                        คุณสามารถจัดหน้าสูจิบัตรให้สวยงาม แล้วกดบันทึกเป็นแม่แบบเพื่อนำมาใช้ซ้ำกับนิทรรศการอื่นๆ ได้ตลอดเวลา
                      </p>
                      <button
                        onClick={() => {
                          setNewPresetName(template.name || 'แม่แบบกำหนดเองของฉัน');
                          setNewPresetDesc(template.description || '');
                          setSavePresetMode('new');
                          setIsPresetModalOpen(false);
                          setIsSavePresetModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B1B1B] hover:bg-[#721616] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>บันทึกเลย์เอาต์ปัจจุบันเป็นแม่แบบแรก</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customPresets.map((preset) => (
                        <div
                          key={preset.id}
                          className="group bg-[#F8F7F4] hover:bg-white border border-[#E6E0D4] hover:border-[#8B1B1B] p-4 rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Badges */}
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-mono font-bold text-[#8B1B1B] uppercase bg-[#8B1B1B]/10 px-2 py-0.5 rounded-full">
                                {preset.paperSize}
                              </span>
                              <span className="text-[10px] font-mono text-[#777]">
                                {preset.blocks.length} องค์ประกอบ
                              </span>
                            </div>

                            {/* Preset Title & Desc */}
                            <h5 className="font-serif font-bold text-sm text-[#1F1C17] group-hover:text-[#8B1B1B] transition-colors mb-1">
                              {preset.name}
                            </h5>
                            <p className="text-[11px] text-[#666] line-clamp-2 mb-3">
                              {preset.description || 'แม่แบบกำหนดเองของผู้ดูแลระบบ'}
                            </p>
                          </div>

                          {/* Card Action Buttons */}
                          <div className="pt-3 border-t border-[#E6E0D4] space-y-2">
                            <button
                              onClick={() => handleSelectPreset(preset)}
                              className="w-full py-1.5 rounded-lg bg-[#8B1B1B] hover:bg-[#721616] text-white text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
                            >
                              <span>ใช้แม่แบบนี้</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>

                            <div className="flex items-center justify-between text-[11px] text-[#666] pt-1">
                              {/* Overwrite with current canvas */}
                              <button
                                onClick={() => handleOverwritePreset(preset.id)}
                                className="hover:text-[#8B1B1B] hover:underline flex items-center gap-1 cursor-pointer"
                                title="บันทึกทับแม่แบบนี้ด้วยเลย์เอาต์ที่กำลังเปิดอยู่บนหน้าจอ"
                              >
                                <Save className="w-3 h-3" />
                                <span>บันทึกทับ</span>
                              </button>

                              {/* Rename */}
                              <button
                                onClick={() => {
                                  setEditingPreset({
                                    id: preset.id,
                                    name: preset.name,
                                    description: preset.description || '',
                                  });
                                }}
                                className="hover:text-[#8B1B1B] hover:underline flex items-center gap-1 cursor-pointer"
                                title="เปลี่ยนชื่อแม่แบบ"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>เปลี่ยนชื่อ</span>
                              </button>

                              {/* Export JSON */}
                              <button
                                onClick={(e) => handleExportSinglePresetJSON(preset, e)}
                                className="hover:text-[#8B1B1B] hover:underline flex items-center gap-1 cursor-pointer"
                                title="ดาวน์โหลดไฟล์ JSON"
                              >
                                <Download className="w-3 h-3" />
                                <span>JSON</span>
                              </button>

                              {/* Delete */}
                              <button
                                onClick={(e) => handleDeleteCustomPreset(preset.id, e)}
                                className="hover:text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                                title="ลบแม่แบบนี้"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>ลบ</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {BUILTIN_CATALOG_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset)}
                      className="group bg-[#F8F7F4] hover:bg-white border border-[#E6E0D4] hover:border-[#8B1B1B] p-4 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold text-[#8B1B1B] uppercase bg-[#8B1B1B]/10 px-2 py-0.5 rounded-full">
                            {preset.paperSize}
                          </span>
                          <span className="text-[10px] font-mono text-[#777]">
                            {preset.blocks.length} องค์ประกอบ
                          </span>
                        </div>
                        <h5 className="font-serif font-bold text-sm text-[#1F1C17] group-hover:text-[#8B1B1B] transition-colors mb-1">
                          {preset.name}
                        </h5>
                        <p className="text-[11px] text-[#666] line-clamp-2">
                          {preset.description || 'แม่แบบจัดหน้าสูจิบัตรศิลปกรรมระดับพรีเมียม'}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-[#E6E0D4] flex items-center justify-between text-xs text-[#8B1B1B] font-semibold">
                        <span>เลือกใช้แม่แบบนี้</span>
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💾 SAVE AS PRESET MODAL (Save New or Overwrite) */}
      {/* ========================================================================= */}
      {isSavePresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E6E0D4] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#E6E0D4] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <BookmarkPlus className="w-4 h-4 text-[#8B1B1B]" />
                <h3 className="font-serif text-base font-bold text-[#1F1C17]">
                  บันทึกแม่แบบสูจิบัตร (Save Template)
                </h3>
              </div>
              <button
                onClick={() => setIsSavePresetModalOpen(false)}
                className="p-1 rounded-full hover:bg-black/5 text-[#777]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher */}
            {customPresets.length > 0 && (
              <div className="grid grid-cols-2 gap-1 p-2 bg-[#F8F7F4] border-b border-[#E6E0D4]">
                <button
                  onClick={() => setSavePresetMode('new')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    savePresetMode === 'new'
                      ? 'bg-white text-[#8B1B1B] shadow-xs font-bold'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                >
                  + บันทึกเป็นแม่แบบใหม่
                </button>
                <button
                  onClick={() => setSavePresetMode('overwrite')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                    savePresetMode === 'overwrite'
                      ? 'bg-white text-[#8B1B1B] shadow-xs font-bold'
                      : 'text-[#666] hover:text-[#111]'
                  }`}
                >
                  💾 บันทึกซ้ำลงแม่แบบเดิม
                </button>
              </div>
            )}

            {/* Modal Form Body */}
            <div className="p-5 space-y-4">
              {savePresetMode === 'new' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#1F1C17] mb-1">
                      ชื่อแม่แบบใหม่ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น แม่แบบ Square Modern ฉบับปรับปรุง"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl text-xs text-[#1F1C17] focus:outline-none focus:border-[#8B1B1B]"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F1C17] mb-1">
                      คำอธิบายแม่แบบ (ทางเลือก)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="รายละเอียดเพิ่มเติม เช่น เหมาะสำหรับรูปทรงสี่เหลี่ยมจัตุรัส..."
                      value={newPresetDesc}
                      onChange={(e) => setNewPresetDesc(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl text-xs text-[#1F1C17] focus:outline-none focus:border-[#8B1B1B]"
                    />
                  </div>

                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E6E0D4] text-[11px] text-[#666] space-y-1">
                    <div className="flex justify-between font-mono">
                      <span>ขนาดกระดาษ:</span>
                      <span className="font-bold text-[#1F1C17]">{template.pageWidthInches}&quot; x {template.pageHeightInches}&quot; ({template.paperSize})</span>
                    </div>
                    <div className="flex justify-between font-mono">
                      <span>จำนวนองค์ประกอบ:</span>
                      <span className="font-bold text-[#8B1B1B]">{template.blocks.length} บล็อก</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E0D4]">
                    <button
                      onClick={() => setIsSavePresetModalOpen(false)}
                      className="px-4 py-2 rounded-full text-xs text-[#666] hover:bg-black/5 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSaveAsCustomPreset}
                      disabled={!newPresetName.trim()}
                      className="px-5 py-2 rounded-full bg-[#8B1B1B] hover:bg-[#721616] text-white text-xs font-bold shadow-md transition-all cursor-pointer disabled:opacity-50"
                    >
                      บันทึกแม่แบบใหม่
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-[#1F1C17] mb-1">
                      เลือกแม่แบบที่ต้องการบันทึกทับ <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedOverwritePresetId || customPresets[0]?.id || ''}
                      onChange={(e) => {
                        setSelectedOverwritePresetId(e.target.value);
                        const sel = customPresets.find((p) => p.id === e.target.value);
                        if (sel) {
                          setNewPresetName(sel.name);
                          setNewPresetDesc(sel.description || '');
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl text-xs text-[#1F1C17] focus:outline-none focus:border-[#8B1B1B]"
                    >
                      {customPresets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.paperSize} - {p.blocks.length} องค์ประกอบ)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1F1C17] mb-1">
                      แก้ไขชื่อแม่แบบ
                    </label>
                    <input
                      type="text"
                      value={newPresetName}
                      onChange={(e) => setNewPresetName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl text-xs text-[#1F1C17] focus:outline-none focus:border-[#8B1B1B]"
                    />
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                    ⚠️ <strong>คำเตือน:</strong> เลย์เอาต์บนหน้าจอปัจจุบันจะถูกนำไปบันทึกแทนที่ข้อมูลแม่แบบเดิมทันที
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E0D4]">
                    <button
                      onClick={() => setIsSavePresetModalOpen(false)}
                      className="px-4 py-2 rounded-full text-xs text-[#666] hover:bg-black/5 cursor-pointer"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={() =>
                        handleOverwritePreset(selectedOverwritePresetId || customPresets[0]?.id)
                      }
                      className="px-5 py-2 rounded-full bg-[#8B1B1B] hover:bg-[#721616] text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      ยืนยันบันทึกทับ
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ✏️ RENAME PRESET MODAL */}
      {/* ========================================================================= */}
      {editingPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white border border-[#E6E0D4] rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E6E0D4] pb-2">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#8B1B1B]" />
                <h4 className="font-serif font-bold text-sm text-[#1F1C17]">
                  เปลี่ยนชื่อแม่แบบ
                </h4>
              </div>
              <button
                onClick={() => setEditingPreset(null)}
                className="p-1 rounded-full hover:bg-black/5 text-[#777]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F1C17] mb-1">
                ชื่อแม่แบบ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={editingPreset.name}
                onChange={(e) => setEditingPreset({ ...editingPreset, name: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl text-xs text-[#1F1C17] focus:outline-none focus:border-[#8B1B1B]"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#1F1C17] mb-1">
                คำอธิบายแม่แบบ
              </label>
              <textarea
                rows={2}
                value={editingPreset.description}
                onChange={(e) => setEditingPreset({ ...editingPreset, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#F8F7F4] border border-[#E6E0D4] rounded-xl text-xs text-[#1F1C17] focus:outline-none focus:border-[#8B1B1B]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E6E0D4]">
              <button
                onClick={() => setEditingPreset(null)}
                className="px-3.5 py-1.5 rounded-full text-xs text-[#666] hover:bg-black/5 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveRenamePreset}
                disabled={!editingPreset.name.trim()}
                className="px-4 py-1.5 rounded-full bg-[#8B1B1B] hover:bg-[#721616] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                บันทึกชื่อใหม่
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🚀 Modern Adobe & High-Res PDF/Image Exporting Progress Modal */}
      {isExportingPDF && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-[#DDD7CC] text-center space-y-5 relative overflow-hidden">
            {/* Background ambient glow */}
            <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header with Adobe Logo / Icon */}
            <div className="flex flex-col items-center gap-2.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#ED2224] to-[#B30B00] flex items-center justify-center text-white shadow-lg shadow-red-500/20">
                <FileText className="w-7 h-7 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  กำลังสร้างสูจิบัตรคุณภาพสูง
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  ประมวลผลความละเอียดสูงผ่าน Adobe Document Cloud
                </p>
              </div>
            </div>

            {/* Big Percentage & Progress Bar */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between px-1">
                <span className="text-xs font-semibold text-neutral-700 truncate pr-2">
                  {exportProgressStep || 'กำลังประมวลผล...'}
                </span>
                <span className="text-2xl font-black font-mono text-[#ED2224] shrink-0">
                  {exportProgressPercent || 5}%
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
                <div
                  className="h-full bg-gradient-to-r from-[#ED2224] via-[#FF5E4D] to-[#ED2224] rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${Math.max(5, exportProgressPercent)}%` }}
                />
              </div>

              {/* Estimated Time Remaining */}
              <div className="flex items-center justify-between text-[10.5px] text-neutral-500 px-1 font-mono">
                <span className="truncate pr-2">{exportStatusText || 'กำลังประมวลผล...'}</span>
                {exportEstimatedSeconds > 0 && (
                  <span className="shrink-0 text-[#8C6D3F] font-semibold">เหลือ ~{exportEstimatedSeconds} วิ</span>
                )}
              </div>
            </div>

            {/* Steps Checklist */}
            <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/80 text-left space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${exportProgressPercent >= 20 ? 'text-emerald-700 font-semibold' : 'text-neutral-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${exportProgressPercent >= 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'}`}>
                  {exportProgressPercent >= 20 ? '✓' : '1'}
                </div>
                <span className="truncate">รวบรวมเลย์เอาต์และรูปภาพผลงาน</span>
              </div>
              <div className={`flex items-center gap-2 ${exportProgressPercent >= 40 ? 'text-emerald-700 font-semibold' : exportProgressPercent >= 20 ? 'text-[#ED2224] font-semibold' : 'text-neutral-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${exportProgressPercent >= 40 ? 'bg-emerald-100 text-emerald-700' : exportProgressPercent >= 20 ? 'bg-red-100 text-[#ED2224]' : 'bg-neutral-200 text-neutral-500'}`}>
                  {exportProgressPercent >= 40 ? '✓' : '2'}
                </div>
                <span className="truncate">อัปโหลดสู่ Adobe Cloud Engine</span>
              </div>
              <div className={`flex items-center gap-2 ${exportProgressPercent >= 90 ? 'text-emerald-700 font-semibold' : exportProgressPercent >= 40 ? 'text-[#ED2224] font-semibold' : 'text-neutral-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${exportProgressPercent >= 90 ? 'bg-emerald-100 text-emerald-700' : exportProgressPercent >= 40 ? 'bg-red-100 text-[#ED2224]' : 'bg-neutral-200 text-neutral-500'}`}>
                  {exportProgressPercent >= 90 ? '✓' : '3'}
                </div>
                <span className="truncate">เรนเดอร์ PostScript คุณภาพสูง 100%</span>
              </div>
              <div className={`flex items-center gap-2 ${exportProgressPercent >= 100 ? 'text-emerald-700 font-semibold' : exportProgressPercent >= 90 ? 'text-[#ED2224] font-semibold' : 'text-neutral-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${exportProgressPercent >= 100 ? 'bg-emerald-100 text-emerald-700' : exportProgressPercent >= 90 ? 'bg-red-100 text-[#ED2224]' : 'bg-neutral-200 text-neutral-500'}`}>
                  {exportProgressPercent >= 100 ? '✓' : '4'}
                </div>
                <span className="truncate">ดาวน์โหลดไฟล์ PDF ลงเครื่อง</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Toast */}
      {saveSuccessToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 bg-[#8B1B1B] text-white px-4 py-2.5 rounded-full shadow-xl text-xs font-semibold animate-slide-down">
          <Check className="w-4 h-4" />
          <span>บันทึกการจัดหน้าสูจิบัตรเรียบร้อยแล้ว</span>
        </div>
      )}
    </div>
  );
}
