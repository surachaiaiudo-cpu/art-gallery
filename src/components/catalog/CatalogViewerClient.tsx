'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Exhibition,
  getCatalogFooterText,
  getCatalogPlateFooterText,
  getExhibitionPeerReviewers,
  PeerReviewer,
} from '@/types/exhibition';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowLeft,
  BookOpen,
  Printer,
  Edit3,
  GraduationCap,
  LayoutGrid,
  Layers,
  ZoomIn,
  Loader2,
  Sparkles,
  Download,
  FileText,
} from 'lucide-react';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { usePrintEngine } from './usePrintEngine';
import { CatalogCoverPage } from './CatalogCoverPage';
import { CatalogStatementPage } from './CatalogStatementPage';
import { CatalogPlate } from './CatalogPlate';
import { CatalogDynamicPlate } from './CatalogDynamicPlate';
import { getExhibitionCatalogTemplate, getArtworkCatalogTemplate, CatalogTemplateConfig } from '@/types/catalogTemplate';
import { CatalogReaderModal } from './CatalogReaderModal';
import { TooltipBubble } from '@/components/ui/TooltipBubble';
import { FooterEditorModal } from './FooterEditorModal';
import { PeerReviewEditorModal } from './PeerReviewEditorModal';
import { PlateErrorBoundary } from './PlateErrorBoundary';
import './catalog-print.css';

interface CatalogViewerClientProps {
  exhibition: Exhibition;
}

export function CatalogViewerClient({ exhibition }: CatalogViewerClientProps) {
  const searchParams = useSearchParams();
  const isAdmin = searchParams?.get('admin') === 'true' || searchParams?.get('preview') === 'admin';
  const autoPrint = searchParams?.get('print') === '1';
  const customTemplate: CatalogTemplateConfig = getExhibitionCatalogTemplate(exhibition);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPeerReviewModalOpen, setIsPeerReviewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savingReviewers, setSavingReviewers] = useState(false);
  const [savedReviewersSuccess, setSavedReviewersSuccess] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState('');

  // Initial values from themeConfig
  let initialFooterGraphicType: 'wave_gold' | 'wave_mono' | 'line_gold' | 'custom_image' | 'none' = 'wave_gold';
  let initialCustomFooterImageUrl = '';

  if (exhibition.themeConfig) {
    try {
      const parsed = JSON.parse(exhibition.themeConfig);
      if (parsed.footerGraphicType) initialFooterGraphicType = parsed.footerGraphicType;
      if (parsed.customFooterImageUrl) initialCustomFooterImageUrl = parsed.customFooterImageUrl;
    } catch {}
  }

  const [coverFooter, setCoverFooter] = useState(getCatalogFooterText(exhibition));
  const [plateFooter, setPlateFooter] = useState(getCatalogPlateFooterText(exhibition));
  const [footerGraphicType, setFooterGraphicType] = useState(initialFooterGraphicType);
  const [customFooterImageUrl, setCustomFooterImageUrl] = useState(initialCustomFooterImageUrl);
  const [peerReviewersList, setPeerReviewersList] = useState<PeerReviewer[]>(
    getExhibitionPeerReviewers(exhibition)
  );

  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;
  const hasReviewers = peerReviewersList.length > 0;
  const totalPages = 1 + (hasReviewers ? 1 : 0) + artworks.length;

  // Print engine hook
  const { handlePrintSinglePage, handleSaveVectorPDF100Percent } = usePrintEngine(exhibition);

  // Reading Modes: 'grid3' (3-Column Preview Grid - Default) or 'full' (Continuous Full Pages)
  const initialMode = searchParams?.get('mode') === 'full' || searchParams?.get('view') === 'full'
    ? 'full'
    : 'grid3';
  const [activeViewMode, setActiveViewMode] = useState<'grid3' | 'full'>(initialMode);
  const [selectedPageModalIndex, setSelectedPageModalIndex] = useState<number | null>(null);
  
  // Paper size is automatically determined from admin's configured catalog template
  const paperSize: 'a4' | 'square8x8' =
    customTemplate?.paperSize === 'square_8x8' || customTemplate?.paperSize === 'square_10x10'
      ? 'square8x8'
      : 'a4';

  // Progressive streaming batch count for Grid View (Infinite Scroll performance)
  const [visibleCount, setVisibleCount] = useState(24);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeViewMode !== 'grid3') return;
    if (visibleCount >= artworks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 24, artworks.length));
        }
      },
      { rootMargin: '400px' }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
      observer.disconnect();
    };
  }, [activeViewMode, visibleCount, artworks.length]);

  // Save Footer Text & Graphic Presets
  const handleSaveFooterText = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch('/api/admin/exhibitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: exhibition.id,
          catalogFooterText: coverFooter,
          catalogPlateFooterText: plateFooter,
          footerGraphicType,
          customFooterImageUrl,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => {
          setSavedSuccess(false);
          setIsEditModalOpen(false);
        }, 1200);
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกข้อความ Footer');
      }
    } catch (err) {
      console.error('Error saving catalog footer text:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSaving(false);
    }
  };

  // Peer Reviewer handlers
  const handleAddReviewer = () => {
    if (peerReviewersList.length >= 6) {
      alert('สามารถเพิ่มผู้ทรงคุณวุฒิได้สูงสุด 6 ท่าน');
      return;
    }
    setPeerReviewersList([
      ...peerReviewersList,
      {
        name: '',
        academicTitle: '',
        institution: '',
        currentPosition: '',
        country: 'Thailand',
        role: peerReviewersList.length === 0 ? 'ประธานกรรมการผู้ทรงคุณวุฒิ' : 'กรรมการผู้ทรงคุณวุฒิ',
      },
    ]);
  };

  const handleUpdateReviewer = (index: number, field: keyof PeerReviewer, value: string) => {
    const updated = [...peerReviewersList];
    updated[index] = { ...updated[index], [field]: value };
    setPeerReviewersList(updated);
  };

  const handleRemoveReviewer = (index: number) => {
    setPeerReviewersList(peerReviewersList.filter((_, i) => i !== index));
  };

  const handleSavePeerReviewers = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingReviewers(true);
      const res = await fetch('/api/admin/exhibitions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: exhibition.id,
          peerReviewers: peerReviewersList,
        }),
      });

      if (res.ok) {
        setSavedReviewersSuccess(true);
        setTimeout(() => {
          setSavedReviewersSuccess(false);
          setIsPeerReviewModalOpen(false);
        }, 1200);
      } else {
        alert('เกิดข้อผิดพลาดในการบันทึกผู้ทรงคุณวุฒิ');
      }
    } catch (err) {
      console.error('Error saving peer reviewers:', err);
      alert('เกิดข้อผิดพลาดในการบันทึก');
    } finally {
      setSavingReviewers(false);
    }
  };

  // 🅰️ 1-Click Adobe PostScript Cloud PDF Generation (Full Book)
  const handleDownloadFullAdobePDF = async () => {
    try {
      setIsGeneratingPdf(true);
      setPdfProgressText('กำลังเชื่อมต่อ Adobe Cloud เพื่อสร้างสูจิบัตร PDF PostScript แท้ 100%...');

      const targetEl = document.getElementById('catalog-continuous-stream-container') || document.querySelector('.catalog-continuous-view');
      if (!targetEl) {
        throw new Error('ไม่พบข้อมูลหน้าสูจิบัตร');
      }

      const isCustomSize = Boolean(customTemplate?.pageWidthInches && customTemplate?.pageHeightInches);
      const w = isCustomSize ? (customTemplate?.pageWidthInches || 8.0) : (paperSize === 'square8x8' ? 8.0 : 8.27);
      const h = isCustomSize ? (customTemplate?.pageHeightInches || 8.0) : (paperSize === 'square8x8' ? 8.0 : 11.69);

      const parentStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
        .map((el) => el.outerHTML)
        .join('\n');

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${exhibition.title || 'Art Exhibition'}-Catalog-Adobe</title>
  ${parentStyles}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=Maitree:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { size: ${w}in ${h}in; margin: 0; }
    * { box-sizing: border-box; }
    html, body {
      width: ${w}in;
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Maitree', 'Noto Serif Thai', Georgia, serif;
    }
    .catalog-dynamic-page, .catalog-cover-page, .catalog-statement-page {
      position: relative !important;
      width: ${w}in !important;
      height: ${h}in !important;
      max-width: ${w}in !important;
      max-height: ${h}in !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      box-shadow: none !important;
      page-break-after: always !important;
      break-after: page !important;
      overflow: hidden !important;
    }
    .no-print { display: none !important; }
  </style>
</head>
<body class="bg-white">
  ${targetEl.innerHTML}
</body>
</html>`;

      const res = await fetch('/api/catalog/adobe-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          html: fullHtml,
          pageWidthInches: w,
          pageHeightInches: h,
          filename: `${exhibition.slug || 'catalog'}-Full-Adobe.pdf`,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'การประมวลผลของ Adobe Cloud ล้มเหลว');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${exhibition.slug || 'catalog'}-Full-Adobe.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      setIsGeneratingPdf(false);
      setPdfProgressText('');
    } catch (err: any) {
      console.error('Adobe PDF generation error:', err);
      alert(`ไม่สามารถสร้าง Adobe PDF ได้: ${err.message || 'โปรดลองอีกครั้ง'}`);
      setIsGeneratingPdf(false);
      setPdfProgressText('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F0] text-[#1E1D1B]">
      {/* Top Navbar */}
      <div className="no-print sticky top-0 z-40">
        <Navbar />
      </div>

      {/* Hero Control Bar & Breadcrumbs */}
      <div className="no-print bg-[#EFEBE4] border-b border-[#DDD7CC] py-4 px-4 sm:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs text-[#827D72] mb-1">
              <Link
                href={`/exhibitions/${exhibition.slug}`}
                className="hover:text-[#8C6D3F] flex items-center transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                กลับหน้านิทรรศการหลัก
              </Link>
              <span>•</span>
              <span className="font-semibold text-[#1E1D1B]">สูจิบัตรมาตรฐาน A4</span>
              <span>•</span>
              <span className="font-mono text-[#8C6D3F] font-bold">
                รวม {totalPages} หน้า (ผลงาน {artworks.length} ชิ้น)
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#1E1D1B]">
              {exhibition.title} — Official Exhibition Catalog
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Switcher with Tooltip Bubbles */}
            <div className="flex items-center bg-white/80 p-1 rounded-xl border border-[#DDD6C8] shadow-inner text-xs gap-1">

              <TooltipBubble content="มุมมองแบบตารางภาพ (Grid 3 View)" position="bottom">
                <button
                  onClick={() => setActiveViewMode('grid3')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeViewMode === 'grid3'
                      ? 'bg-[#8C6D3F] text-white shadow-sm'
                      : 'text-[#666] hover:text-[#1A1918] hover:bg-[#F2EFE9]'
                  }`}
                  aria-label="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span className="hidden sm:inline">ตารางภาพ</span>
                </button>
              </TooltipBubble>

              <TooltipBubble content="มุมมองหน้าสูจิบัตรต่อเนื่อง (Continuous Full Page View)" position="bottom">
                <button
                  onClick={() => setActiveViewMode('full')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeViewMode === 'full'
                      ? 'bg-[#8C6D3F] text-white shadow-sm'
                      : 'text-[#666] hover:text-[#1A1918] hover:bg-[#F2EFE9]'
                  }`}
                  aria-label="Full Page View"
                >
                  <Layers className="w-4 h-4" />
                  <span className="hidden sm:inline">หน้าเต็ม</span>
                </button>
              </TooltipBubble>
            </div>

            {/* Peer Reviewer & Footer Editor Buttons (Only visible in Curator / Admin Mode) */}
            {isAdmin && (
              <>
                <TooltipBubble content="เปิดสตูดิโอจัดหน้าสูจิบัตร (Catalog Designer Studio)" position="bottom">
                  <Link
                    href={`/admin/catalog-designer?exhibition=${exhibition.id}`}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-[#8B1B1B]/10 hover:bg-[#8B1B1B]/20 text-[#8B1B1B] border border-[#8B1B1B]/30 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    aria-label="Designer Studio"
                  >
                    <Sparkles className="w-4 h-4 text-[#8B1B1B]" />
                    <span className="hidden md:inline">ออกแบบสูจิบัตร</span>
                  </Link>
                </TooltipBubble>

                <TooltipBubble content={`จัดการรายนามคณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (${peerReviewersList.length} ท่าน)`} position="bottom">
                  <button
                    onClick={() => setIsPeerReviewModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                    aria-label="Peer Reviewers"
                  >
                    <GraduationCap className="w-4 h-4 text-amber-700" />
                    <span className="hidden lg:inline">ผู้ทรงคุณวุฒิ ({peerReviewersList.length})</span>
                  </button>
                </TooltipBubble>

                <TooltipBubble content="แก้ไขข้อความ Footer ท้ายหน้าสูจิบัตร" position="bottom">
                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
                    aria-label="Footer Settings"
                  >
                    <Edit3 className="w-4 h-4 text-amber-700" />
                    <span className="hidden lg:inline">ตั้งค่า Footer</span>
                  </button>
                </TooltipBubble>
              </>
            )}

            {/* 🔥 1-Click Adobe PostScript Cloud PDF Generation */}
            <TooltipBubble content="ดาวน์โหลดสูจิบัตรทั้งเล่มเป็น PDF ด้วยเอนจิน Adobe PostScript แท้ 100% จาก Adobe Cloud" position="bottom">
              <button
                onClick={handleDownloadFullAdobePDF}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#ED2224] to-[#B30B00] hover:from-[#FF3333] hover:to-[#C40C00] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer disabled:opacity-50"
                aria-label="Download Adobe PDF"
              >
                <FileText className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'กำลังสร้าง Adobe PDF...' : 'ดาวน์โหลด Adobe PDF (ทั้งเล่ม)'}</span>
              </button>
            </TooltipBubble>

            {/* Save Vector PDF 100% Button with Tooltip Bubble */}
            <TooltipBubble content="บันทึกสูจิบัตรทั้งเล่มผ่านเบราว์เซอร์ (เลือก 'Save as PDF' หรือ 'Adobe PDF')" position="bottom">
              <button
                onClick={() => handleSaveVectorPDF100Percent(customTemplate)}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#8B1B1B] hover:bg-[#721616] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                aria-label="Save Vector PDF"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ / PDF เบราว์เซอร์</span>
              </button>
            </TooltipBubble>
          </div>
        </div>
      </div>


      {/* Grid 3-Column Preview Mode */}
      {activeViewMode === 'grid3' && (
        <div className="no-print max-w-7xl mx-auto px-4 sm:px-8 py-8 flex-1">
          <div className="mb-6 flex items-center justify-between border-b border-[#DDD6C8] pb-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-[#1A1918]">
                สารบัญภาพรวมสูจิบัตร (Catalog Plate Index)
              </h2>
              <p className="text-xs text-[#777]">
                คลิกที่หน้าใดก็ได้เพื่อเปิดอ่านหน้าใหญ่แบบเต็มจอ (Reader Mode) หรือกดปุ่มพิมพ์เฉพาะหน้านั้นๆ
              </p>
            </div>
            <span className="text-xs font-mono text-[#8C6D3F] font-bold bg-[#FAF6EE] px-3 py-1 rounded-lg border border-[#E5DEC3]">
              {totalPages} หน้าทั้งหมด
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* 1. Cover Page Thumbnail Card */}
            <div
              onClick={() => setSelectedPageModalIndex(0)}
              className="bg-white border border-[#DDD7CC] hover:border-[#8C6D3F] rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between p-5 space-y-4"
            >
              {/* Top Row: Page Badge & Rollover Reveal */}
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 bg-[#FAF6EE] text-[#8C6D3F] border border-[#E5D7BF] rounded-full text-[10px] font-mono font-bold tracking-wider uppercase">
                  หน้า 1 • หน้าปก
                </span>
                <span className="text-[11px] text-[#8C6D3F] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>เปิดอ่านหน้าใหญ่</span>
                </span>
              </div>

              {/* Cover Image Container */}
              <div className="aspect-[210/160] bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#EBE6DC] flex items-center justify-center p-3">
                {exhibition.bannerUrl ? (
                  <img
                    src={getOptimizedImageUrl(exhibition.bannerUrl, { width: 380, quality: 75 })}
                    alt={exhibition.title}
                    loading="lazy"
                    decoding="async"
                    className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-center font-serif text-sm font-bold text-[#8C6D3F]">
                    ARTVARA COVER
                  </div>
                )}
              </div>

              {/* Cover Info */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] uppercase tracking-widest text-[#8C6D3F] font-bold block">
                  Official Exhibition Catalog
                </span>
                <h3 className="font-serif text-base font-bold text-[#1A1918] group-hover:text-[#8C6D3F] transition-colors line-clamp-2 leading-snug">
                  {exhibition.title}
                </h3>
                {curator?.name && (
                  <p className="text-xs text-[#6B655A] font-medium">
                    {curator.name}
                  </p>
                )}
              </div>
            </div>

            {/* 2. Peer Reviewers Thumbnail Card (if hasReviewers) */}
            {hasReviewers && (
              <div
                onClick={() => setSelectedPageModalIndex(1)}
                className="bg-white border border-[#DDD7CC] hover:border-[#8C6D3F] rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between p-5 space-y-4"
              >
                {/* Top Row: Page Badge & Rollover Reveal */}
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-[#FAF6EE] text-[#8C6D3F] border border-[#E5D7BF] rounded-full text-[10px] font-mono font-bold tracking-wider uppercase">
                    หน้า 2 • ผู้ทรงคุณวุฒิ
                  </span>
                  <span className="text-[11px] text-[#8C6D3F] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>เปิดอ่านหน้าใหญ่</span>
                  </span>
                </div>

                <div className="aspect-[210/160] bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#EBE6DC] p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-[#8C6D3F] uppercase tracking-wider block">
                      คณะกรรมการผู้ทรงคุณวุฒิ ({peerReviewersList.length} ท่าน)
                    </span>
                    <div className="space-y-1.5">
                      {peerReviewersList.slice(0, 3).map((r, i) => (
                        <div key={i} className="text-[11px] text-[#3A362F] flex items-center gap-2 truncate font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D3F] shrink-0" />
                          <span className="truncate">{[r.academicTitle, r.name].filter(Boolean).join(' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {exhibition.curatorNote && (
                    <p className="text-[10px] text-[#6E685C] italic line-clamp-2 border-t border-[#E8E2D6] pt-2 font-serif">
                      &quot;{exhibition.curatorNote}&quot;
                    </p>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <h3 className="font-serif text-base font-bold text-[#1A1918] group-hover:text-[#8C6D3F] transition-colors line-clamp-1 leading-snug">
                    คณะกรรมการผู้ทรงคุณวุฒิ &amp; คำนำภัณฑารักษ์
                  </h3>
                  <p className="text-xs text-[#7A7468] font-medium">
                    Peer Review Committee &amp; Curatorial Statement
                  </p>
                </div>
              </div>
            )}

            {/* 3. Artwork Thumbnail Cards (Progressive Streaming w-380 + Lazy loading) */}
            {artworks.slice(0, visibleCount).map((art, idx) => {
              const artist = art.artist;
              const pageIdx = hasReviewers ? idx + 2 : idx + 1;
              const pageNum = pageIdx + 1;
              const optimizedThumbUrl = getOptimizedImageUrl(art.imageUrl, { width: 380, quality: 75 });

              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedPageModalIndex(pageIdx)}
                  className="bg-white border border-[#DDD7CC] hover:border-[#8C6D3F] rounded-2xl shadow-sm hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between p-5 space-y-4"
                >
                  {/* Top Row: Page Badge & Rollover Reveal */}
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-[#FAF6EE] text-[#8C6D3F] border border-[#E5D7BF] rounded-full text-[10px] font-mono font-bold">
                      หน้า #{pageNum}
                    </span>
                    <span className="text-[11px] text-[#8C6D3F] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-1 group-hover:translate-x-0">
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>เปิดอ่านหน้าใหญ่</span>
                    </span>
                  </div>

                  {/* Artwork Image Container */}
                  <div className="relative aspect-[210/160] bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#EBE6DC] flex items-center justify-center p-3">
                    <img
                      src={optimizedThumbUrl}
                      alt={art.title}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Artist & Artwork Info */}
                  <div className="space-y-2 pt-1">
                    {/* Artist Row */}
                    <div className="flex items-center gap-2">
                      <div className="relative w-5 h-3.5 rounded-[2px] overflow-hidden border border-[#DDD] shrink-0 bg-[#F5F5F5]">
                        <img
                          src={getFlagImageUrl(artist?.country)}
                          alt={artist?.country || 'Flag'}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-xs font-bold text-[#1A1918] group-hover:text-[#8C6D3F] transition-colors truncate">
                        {artist?.name || 'Artist'}
                      </span>
                    </div>

                    {/* Artwork Title */}
                    <h3 className="font-serif text-base font-bold text-[#1A1918] line-clamp-1 leading-snug">
                      {art.title}
                    </h3>

                    {/* Specs / Dimensions / Medium */}
                    <p className="text-[11px] text-[#6E685C] font-mono line-clamp-1">
                      {[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ')}
                    </p>
                  </div>
                </div>
              );
            })}

            {/* Infinite Scroll Sentinel & Loader */}
            {visibleCount < artworks.length && (
              <div ref={sentinelRef} className="col-span-full py-8 flex justify-center items-center">
                <div className="flex items-center space-x-2 text-xs font-semibold text-[#8C6D3F] bg-white px-4 py-2 rounded-full border border-[#DDD6C8] shadow-sm">
                  <div className="w-3.5 h-3.5 border-2 border-[#8C6D3F] border-t-transparent rounded-full animate-spin" />
                  <span>กำลังโหลดผลงานเพิ่มเติม ({visibleCount} / {artworks.length} ชิ้น)...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reader Modal */}
      {selectedPageModalIndex !== null && (
        <CatalogReaderModal
          exhibition={exhibition}
          curator={curator}
          peerReviewersList={peerReviewersList}
          coverFooter={coverFooter}
          plateFooter={plateFooter}
          footerGraphicType={footerGraphicType}
          customFooterImageUrl={customFooterImageUrl}
          selectedPageModalIndex={selectedPageModalIndex}
          onClose={() => setSelectedPageModalIndex(null)}
          onSelectPageIndex={setSelectedPageModalIndex}
          paperSize={paperSize}
          onPrintSinglePage={handlePrintSinglePage}
        />
      )}



      {/* Main Visual Catalog Viewer (WYSIWYG 100% True-to-Print Vector) */}
      <main
        style={{ maxWidth: customTemplate.pageWidthInches ? `${customTemplate.pageWidthInches}in` : '210mm' }}
        className={`w-full mx-auto py-8 sm:py-12 space-y-12 sm:space-y-16 ${activeViewMode === 'grid3' ? 'hidden print:block' : 'block'}`}
      >
        {/* Cover Page */}
        <PlateErrorBoundary pageNumber={1}>
          <CatalogCoverPage
            exhibition={exhibition}
            curator={curator}
            coverFooter={coverFooter}
          />
        </PlateErrorBoundary>

        {/* Statement & Peer Reviewers Page */}
        {hasReviewers && (
          <PlateErrorBoundary pageNumber={2}>
            <CatalogStatementPage
              exhibition={exhibition}
              curator={curator}
              peerReviewersList={peerReviewersList}
              plateFooter={plateFooter}
            />
          </PlateErrorBoundary>
        )}

        {/* Artwork Plates */}
        {artworks.map((art, idx) => {
          const pageNum = (hasReviewers ? idx + 2 : idx + 1) + 1;
          const artTemplate = getArtworkCatalogTemplate(exhibition, art.id);
          return (
            <PlateErrorBoundary key={art.id} pageNumber={pageNum}>
              {artTemplate && artTemplate.blocks && artTemplate.blocks.length > 0 ? (
                <CatalogDynamicPlate
                  artwork={art}
                  template={artTemplate}
                  pageNumber={pageNum}
                  exhibitionSlug={exhibition.slug}
                />
              ) : (
                <CatalogPlate
                  artwork={art}
                  pageNumber={pageNum}
                  plateFooter={plateFooter}
                  footerGraphicType={footerGraphicType}
                  customFooterImageUrl={customFooterImageUrl}
                  paperSize={paperSize}
                />
              )}
            </PlateErrorBoundary>
          );
        })}
      </main>

      {/* Modals */}
      <FooterEditorModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        coverFooter={coverFooter}
        plateFooter={plateFooter}
        footerGraphicType={footerGraphicType}
        customFooterImageUrl={customFooterImageUrl}
        saving={saving}
        savedSuccess={savedSuccess}
        onChangeCoverFooter={setCoverFooter}
        onChangePlateFooter={setPlateFooter}
        onChangeFooterGraphicType={setFooterGraphicType}
        onChangeCustomFooterImageUrl={setCustomFooterImageUrl}
        onSave={handleSaveFooterText}
      />

      <PeerReviewEditorModal
        isOpen={isPeerReviewModalOpen}
        onClose={() => setIsPeerReviewModalOpen(false)}
        peerReviewersList={peerReviewersList}
        savingReviewers={savingReviewers}
        savedReviewersSuccess={savedReviewersSuccess}
        onAddReviewer={handleAddReviewer}
        onUpdateReviewer={handleUpdateReviewer}
        onRemoveReviewer={handleRemoveReviewer}
        onSave={handleSavePeerReviewers}
      />

      {/* Footer */}
      <div className="no-print mt-auto">
        <Footer />
      </div>
    </div>
  );
}
