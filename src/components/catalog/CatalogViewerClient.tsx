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
} from 'lucide-react';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import { usePrintEngine } from './usePrintEngine';
import { CatalogCoverPage } from './CatalogCoverPage';
import { CatalogStatementPage } from './CatalogStatementPage';
import { CatalogPlate } from './CatalogPlate';
import { CatalogReaderModal } from './CatalogReaderModal';
import { FooterEditorModal } from './FooterEditorModal';
import { PeerReviewEditorModal } from './PeerReviewEditorModal';
import { PlateErrorBoundary } from './PlateErrorBoundary';
import './catalog-print.css';

interface CatalogViewerClientProps {
  exhibition: Exhibition;
}

export function CatalogViewerClient({ exhibition }: CatalogViewerClientProps) {
  const searchParams = useSearchParams();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPeerReviewModalOpen, setIsPeerReviewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savingReviewers, setSavingReviewers] = useState(false);
  const [savedReviewersSuccess, setSavedReviewersSuccess] = useState(false);

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

  // Reading Modes: 'grid3' (3-Column Preview Grid - Default) or 'full' (Continuous Full A4 Pages)
  const [activeViewMode, setActiveViewMode] = useState<'grid3' | 'full'>('grid3');
  const [selectedPageModalIndex, setSelectedPageModalIndex] = useState<number | null>(null);

  // Print engine hook
  const { handlePrintSinglePage, handleSaveVectorPDF100Percent } = usePrintEngine(exhibition);

  // Auto-export trigger if URL param ?export=pdf is present
  useEffect(() => {
    const exportParam = searchParams.get('export');
    if (exportParam === 'pdf') {
      const timer = setTimeout(() => {
        handleSaveVectorPDF100Percent();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [searchParams, handleSaveVectorPDF100Percent]);

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

          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-white/80 p-1 rounded-xl border border-[#DDD6C8] shadow-inner text-xs">
              <button
                onClick={() => setActiveViewMode('grid3')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeViewMode === 'grid3'
                    ? 'bg-[#8C6D3F] text-white shadow-sm'
                    : 'text-[#666] hover:text-[#1A1918] hover:bg-[#F2EFE9]'
                }`}
                title="มุมมองแบบตาราง 3 คอลัมน์ (Grid 3 View)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>มุมมองตาราง</span>
              </button>

              <button
                onClick={() => setActiveViewMode('full')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  activeViewMode === 'full'
                    ? 'bg-[#8C6D3F] text-white shadow-sm'
                    : 'text-[#666] hover:text-[#1A1918] hover:bg-[#F2EFE9]'
                }`}
                title="มุมมองหน้า A4 ต่อเนื่อง (Continuous Full A4 View)"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>มุมมองหน้าเต็ม</span>
              </button>
            </div>

            {/* Peer Reviewer Editor Button */}
            <button
              onClick={() => setIsPeerReviewModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF8F5] text-[#555] hover:text-[#1E1D1B] border border-[#DDD6C8] rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="จัดการรายนามคณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน"
            >
              <GraduationCap className="w-4 h-4 text-[#8C6D3F]" />
              <span>ผู้ทรงคุณวุฒิ ({peerReviewersList.length})</span>
            </button>

            {/* Edit Footer Button */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-[#FAF8F5] text-[#555] hover:text-[#1E1D1B] border border-[#DDD6C8] rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer"
              title="แก้ไขข้อความ Footer ท้ายหน้าสูจิบัตร"
            >
              <Edit3 className="w-4 h-4 text-[#8C6D3F]" />
              <span>ตั้งค่า Footer</span>
            </button>

            {/* Save Vector PDF 100% Button */}
            <button
              onClick={handleSaveVectorPDF100Percent}
              className="flex items-center space-x-2 px-4 py-2 bg-[#8C6D3F] hover:bg-[#735831] text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              title="บันทึกสูจิบัตรทั้งเล่มเป็นไฟล์ PDF Vector A4 คมชัด 100%"
            >
              <Printer className="w-4 h-4" />
              <span>บันทึกเป็น PDF (ทั้งเล่ม)</span>
            </button>
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Cover Page Thumbnail Card */}
            <div
              onClick={() => setSelectedPageModalIndex(0)}
              className="bg-white border-2 border-[#DDD6C8] hover:border-[#8C6D3F] rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between"
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 bg-[#8C6D3F] text-white rounded text-[10px] font-mono font-bold uppercase">
                    หน้า 1 • หน้าปก
                  </span>
                  <span className="text-[10px] text-[#8C6D3F] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="w-3.5 h-3.5" />
                    เปิดอ่านหน้าใหญ่
                  </span>
                </div>

                <div className="aspect-[210/160] bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#EBE6DC] flex items-center justify-center p-2">
                  {exhibition.bannerUrl ? (
                    <img
                      src={getOptimizedImageUrl(exhibition.bannerUrl, { width: 380, quality: 75 })}
                      alt={exhibition.title}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center font-serif text-sm font-bold text-[#8C6D3F]">
                      ARTVARA COVER
                    </div>
                  )}
                </div>

                <div className="space-y-1 pt-1">
                  <span className="catalog-heading-th text-[10px] uppercase tracking-wider text-[#8C6D3F] font-bold block">
                    ARTVARA Official Catalog
                  </span>
                  <h3 className="catalog-heading-th font-serif text-sm font-bold text-[#1A1918] line-clamp-2 leading-snug">
                    {exhibition.title}
                  </h3>
                  {curator?.name && (
                    <p className="catalog-body-th text-[11px] text-[#666]">
                      Curated by: {curator.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-[#FAF8F5] px-4 py-2.5 border-t border-[#EFEBE3] flex items-center justify-between text-xs text-[#8C6D3F] font-semibold">
                <span>🔍 คลิกเพื่อเปิดอ่านหน้าปก</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>

            {/* 2. Peer Reviewers Thumbnail Card (if hasReviewers) */}
            {hasReviewers && (
              <div
                onClick={() => setSelectedPageModalIndex(1)}
                className="bg-white border-2 border-[#DDD6C8] hover:border-[#8C6D3F] rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-[#8C6D3F] text-white rounded text-[10px] font-mono font-bold uppercase">
                      หน้า 2 • ผู้ทรงคุณวุฒิ
                    </span>
                    <span className="text-[10px] text-[#8C6D3F] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ZoomIn className="w-3.5 h-3.5" />
                      เปิดอ่านหน้าใหญ่
                    </span>
                  </div>

                  <div className="aspect-[210/160] bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#EBE6DC] p-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <span className="catalog-heading-th text-[9px] font-bold text-[#555] uppercase block">
                        คณะกรรมการผู้ทรงคุณวุฒิ ({peerReviewersList.length} ท่าน)
                      </span>
                      <div className="space-y-1">
                        {peerReviewersList.slice(0, 3).map((r, i) => (
                          <div key={i} className="text-[10px] text-[#333] flex items-center gap-1.5 truncate">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D3F] shrink-0" />
                            <span className="font-semibold truncate">{[r.academicTitle, r.name].filter(Boolean).join(' ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {exhibition.curatorNote && (
                      <p className="text-[9px] text-[#777] italic line-clamp-2 border-t border-[#E8E2D6] pt-1">
                        &quot;{exhibition.curatorNote}&quot;
                      </p>
                    )}
                  </div>

                  <div className="space-y-0.5 pt-1">
                    <span className="catalog-heading-th text-xs font-bold text-[#1A1918] block">
                      คณะกรรมการผู้ทรงคุณวุฒิ &amp; คำนำภัณฑารักษ์
                    </span>
                    <p className="catalog-body-th text-[10px] text-[#777]">
                      Peer Review Committee &amp; Curatorial Statement
                    </p>
                  </div>
                </div>

                <div className="bg-[#FAF8F5] px-4 py-2.5 border-t border-[#EFEBE3] flex items-center justify-between text-xs text-[#8C6D3F] font-semibold">
                  <span>🔍 คลิกเพื่อเปิดอ่านหน้านี้</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </div>
            )}

            {/* 3. Artwork Thumbnail Cards (Optimized w-380 Images + Lazy loading) */}
            {artworks.map((art, idx) => {
              const artist = art.artist;
              const pageIdx = hasReviewers ? idx + 2 : idx + 1;
              const pageNum = pageIdx + 1;
              const optimizedThumbUrl = getOptimizedImageUrl(art.imageUrl, { width: 380, quality: 75 });

              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedPageModalIndex(pageIdx)}
                  className="bg-white border-2 border-[#DDD6C8] hover:border-[#8C6D3F] rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden group flex flex-col justify-between"
                >
                  <div className="p-4 space-y-3">
                    {/* Top Row: Page Badge & Hover hint */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 bg-[#FAF3E8] text-[#8C6D3F] border border-[#E0D5C1] rounded text-[10px] font-mono font-bold">
                        หน้า #{pageNum}
                      </span>
                      <span className="text-[10px] text-[#8C6D3F] font-bold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-3.5 h-3.5" />
                        เปิดอ่านหน้าใหญ่
                      </span>
                    </div>

                    {/* Artwork Image Container */}
                    <div className="relative aspect-[210/160] bg-[#FAF8F5] rounded-xl overflow-hidden border border-[#EBE6DC] flex items-center justify-center p-2">
                      <img
                        src={optimizedThumbUrl}
                        alt={art.title}
                        loading="lazy"
                        decoding="async"
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Artist & Artwork Info */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        {/* Flag */}
                        <div className="relative w-6 h-3.5 rounded-[2px] overflow-hidden border border-[#DDD] shrink-0 bg-[#F5F5F5]">
                          <img
                            src={getFlagImageUrl(artist?.country)}
                            alt={artist?.country || 'Flag'}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {/* Artist Name */}
                        <h4 className="catalog-heading-th text-xs font-bold text-[#1A1918] truncate">
                          {artist?.name || 'Artist'}
                        </h4>
                      </div>

                      {/* Artwork Title */}
                      <h5 className="catalog-heading-th text-xs font-bold text-[#333] line-clamp-1">
                        {art.title}
                      </h5>

                      <p className="catalog-body-th text-[10px] text-[#777] line-clamp-1">
                        {[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ')}
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#FAF8F5] px-4 py-2.5 border-t border-[#EFEBE3] flex items-center justify-between text-xs text-[#8C6D3F] font-semibold">
                    <span>🔍 คลิกเพื่อเปิดอ่านหน้าใหญ่</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
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
          onPrintSinglePage={handlePrintSinglePage}
        />
      )}

      {/* Main A4 Visual Catalog Viewer (WYSIWYG 100% True-to-Print A4) */}
      <main className={`w-full max-w-[210mm] mx-auto py-8 sm:py-12 space-y-12 sm:space-y-16 ${activeViewMode === 'grid3' ? 'hidden print:block' : 'block'}`}>
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
          return (
            <PlateErrorBoundary key={art.id} pageNumber={pageNum}>
              <CatalogPlate
                artwork={art}
                pageNumber={pageNum}
                plateFooter={plateFooter}
                footerGraphicType={footerGraphicType}
                customFooterImageUrl={customFooterImageUrl}
              />
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
