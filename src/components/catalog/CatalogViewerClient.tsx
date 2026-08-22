'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Exhibition, getCatalogFooterText, getCatalogPlateFooterText, getExhibitionPeerReviewers, PeerReviewer } from '@/types/exhibition';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  ArrowLeft,
  BookOpen,
  Download,
  Printer,
  CheckCircle2,
  Edit3,
  X,
  Save,
  GraduationCap,
  Award,
  Plus,
  Trash2,
  Camera,
  ShieldCheck,
  FileText,
  Loader2,
  Upload,
} from 'lucide-react';
import { formatDateRange, formatPrice } from '@/lib/utils';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';

interface CatalogViewerClientProps {
  exhibition: Exhibition;
}

export type PDFStandard = 'standard' | 'pdfx';

export function CatalogViewerClient({ exhibition }: CatalogViewerClientProps) {
  const searchParams = useSearchParams();
  const [isStandardModalOpen, setIsStandardModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfStandardType, setPdfStandardType] = useState<PDFStandard>('standard');
  const [pdfProgress, setPdfProgress] = useState({ current: 0, total: 0 });
  const [downloaded, setDownloaded] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPeerReviewModalOpen, setIsPeerReviewModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [savingReviewers, setSavingReviewers] = useState(false);
  const [savedReviewersSuccess, setSavedReviewersSuccess] = useState(false);

  const [coverFooter, setCoverFooter] = useState(getCatalogFooterText(exhibition));
  const [plateFooter, setPlateFooter] = useState(getCatalogPlateFooterText(exhibition));
  const [footerGraphicType, setFooterGraphicType] = useState<
    'wave_gold' | 'wave_mono' | 'line_gold' | 'custom_image' | 'none'
  >('wave_gold');
  const [customFooterImageUrl, setCustomFooterImageUrl] = useState<string>('');
  const [peerReviewersList, setPeerReviewersList] = useState<PeerReviewer[]>(
    getExhibitionPeerReviewers(exhibition)
  );

  const artworks = exhibition.artworks || [];
  const curator = exhibition.curator;
  const hasReviewers = peerReviewersList.length > 0;

  const handleFooterImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setCustomFooterImageUrl(event.target.result as string);
        setFooterGraphicType('custom_image');
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct File Download — html2canvas + jsPDF
  // Captures the LIVE rendered pages from the DOM → 100% correct Thai text, fonts, colors, layout
  const handleDirectDownloadPDF = async (standard: PDFStandard = 'standard') => {
    try {
      setIsStandardModalOpen(false);
      setIsGeneratingPdf(true);
      setPdfStandardType(standard);
      setDownloaded(false);

      const cleanSlug = exhibition.slug || 'exhibition';
      const isPdfX = standard === 'pdfx';
      const fileName = isPdfX
        ? `${cleanSlug}-catalog-PDFX-1a-2001.pdf`
        : `${cleanSlug}-catalog-Standard.pdf`;

      // Dynamically import html2canvas and jsPDF (client-side only)
      const [html2canvas, { jsPDF }] = await Promise.all([
        import('html2canvas').then(m => m.default),
        import('jspdf'),
      ]);

      // A4 in pt: 595.28 x 841.89 pt (72 DPI)
      const A4_W = 595.28;
      const A4_H = 841.89;

      // Get all A4 page sections from the DOM
      const pages = Array.from(
        document.querySelectorAll<HTMLElement>('.catalog-a4-page')
      );

      if (pages.length === 0) {
        throw new Error('No catalog pages found in DOM');
      }

      setPdfProgress({ current: 0, total: pages.length });

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true,
      });

      // Add PDF/X metadata if needed
      if (isPdfX) {
        doc.setProperties({
          title: `${exhibition.title} - Official Exhibition Catalog`,
          author: exhibition.curator?.name || 'ARTVARA Curatorial Team',
          subject: 'PDF/X-1a:2001 ISO 15930-1 Prepress Commercial Print-Ready Catalog',
          keywords: 'ARTVARA, Exhibition Catalog, Poh-Chang, ISO 15930-1',
          creator: 'ARTVARA Catalog Generator',
        });
      }

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];

        // Temporarily force the page to be fully visible (even if scrolled out of view)
        const prevVisibility = page.style.visibility;
        page.style.visibility = 'visible';

        const canvas = await html2canvas(page, {
          scale: 2.5,          // 2.5× → ~212 DPI, sharp and crisp on print
          useCORS: true,        // Allow cross-origin images (artwork photos, flags, etc.)
          allowTaint: false,
          backgroundColor: '#FFFFFF',
          logging: false,
          imageTimeout: 15000,
          windowWidth: page.scrollWidth,
          windowHeight: page.scrollHeight,
          onclone: (clonedDoc) => {
            // In the clone, hide the floating download button and any tooltips
            clonedDoc.querySelectorAll('.no-print').forEach((el) => {
              (el as HTMLElement).style.display = 'none';
            });
          },
        });

        page.style.visibility = prevVisibility;

        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        if (i > 0) doc.addPage();

        doc.addImage(
          imgData,
          'JPEG',
          0,
          0,
          A4_W,
          A4_H,
          undefined,
          'FAST'
        );

        setPdfProgress({ current: i + 1, total: pages.length });
      }

      doc.save(fileName);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 5000);
    } catch (err) {
      console.error('Error generating PDF via html2canvas:', err);
      // Fallback: open browser print dialog
      handleSaveVectorPDF100Percent();
    } finally {
      setIsGeneratingPdf(false);
      setPdfProgress({ current: 0, total: 0 });
    }
  };

  // Auto-trigger direct download if navigated with ?export parameter
  useEffect(() => {
    const exportParam = searchParams.get('export');
    if (exportParam === 'pdfx' || exportParam === 'pdfx1a') {
      const timer = setTimeout(() => {
        handleDirectDownloadPDF('pdfx');
      }, 700);
      return () => clearTimeout(timer);
    } else if (exportParam === 'standard' || exportParam === 'pdf') {
      const timer = setTimeout(() => {
        handleDirectDownloadPDF('standard');
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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

  // Add / Edit / Remove Peer Reviewers
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

  // 100% WYSIWYG Pure Vector PDF Export (Direct Browser Engine)
  const handleSaveVectorPDF100Percent = () => {
    if (typeof document !== 'undefined') {
      const originalTitle = document.title;
      const cleanSlug = exhibition.slug || 'catalog';
      document.title = `${cleanSlug}-Official-A4-Vector-Catalog`;
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1500);
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F4F0] text-[#1E1D1B]">
      {/* 100% WYSIWYG A4 Layout Stylesheet */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@300;400;600;700&family=Maitree:wght@300;400;500;600;700&display=swap');

        @font-face {
          font-family: 'CatalogHeading';
          src: local('Sukhumvit Set'), local('SukhumvitSet'), local('Sukhumvit Set Bold');
          font-weight: 300 700;
          font-style: normal;
          font-display: swap;
        }

        .catalog-a4-page,
        .catalog-a4-page * {
          font-kerning: none !important;
          -webkit-font-feature-settings: "kern" 0 !important;
          font-feature-settings: "kern" 0, "liga" 0, "clig" 0 !important;
          text-rendering: optimizeSpeed !important;
        }

        .catalog-heading-th {
          font-family: 'CatalogHeading', 'Noto Sans Thai', 'Helvetica Neue', sans-serif !important;
          letter-spacing: 0em !important;
        }

        .catalog-body-th {
          font-family: 'Maitree', 'Noto Sans Thai', Georgia, serif !important;
          letter-spacing: 0em !important;
        }

        @media print {
          @page {
            size: 210mm 297mm;
            margin: 0mm !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
          }
          html, body {
            width: 210mm !important;
            min-width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print, header, footer, nav {
            display: none !important;
          }
          main {
            margin: 0 !important;
            padding: 0 !important;
            max-width: 210mm !important;
            width: 210mm !important;
            background: #ffffff !important;
          }
          .catalog-a4-page {
            width: 210mm !important;
            height: 297mm !important;
            min-height: 297mm !important;
            max-height: 297mm !important;
            margin: 0 !important;
            padding: 15mm !important;
            box-sizing: border-box !important;
            page-break-before: auto !important;
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            border: none !important;
            box-shadow: none !important;
            background-color: #ffffff !important;
            position: relative !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
          }
        }
      `}</style>

      {/* Generating PDF Direct Download Progress Toast Overlay */}
      {isGeneratingPdf && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl p-8 max-w-md w-full text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center bg-[#8C6D3F]/15 rounded-full text-[#8C6D3F]">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#1A1918] text-[#E5D2B8] inline-block mb-1">
                {pdfStandardType === 'pdfx' ? 'มาตรฐาน PDF/X-1a:2001 (ISO Prepress)' : 'มาตรฐาน Standard E-Catalog'}
              </span>
              <h3 className="font-serif text-lg font-bold text-[#1A1918] mt-1">
                {pdfStandardType === 'pdfx'
                  ? 'กำลังสร้างไฟล์ PDF สำหรับแท่นพิมพ์ (Prepress 300+ DPI)...'
                  : 'กำลังสร้างไฟล์ PDF ขนาด A4 เต็มหน้า...'}
              </h3>
              <p className="text-xs text-[#6E685C] mt-1">
                กำลังเรนเดอร์หน้า {pdfProgress.current} จาก {pdfProgress.total} หน้า
              </p>
            </div>
            <div className="w-full bg-[#EAE4D8] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#8C6D3F] h-full transition-all duration-300"
                style={{
                  width: `${pdfProgress.total > 0 ? (pdfProgress.current / pdfProgress.total) * 100 : 10}%`,
                }}
              />
            </div>
            <p className="text-[11px] text-[#8C8477]">
              ไฟล์ .pdf จะดาวน์โหลดลงเครื่องของคุณโดยตรงทันทีเมื่อสร้างเสร็จ
            </p>
          </div>
        </div>
      )}

      {/* 2 Print Standards Direct Download Modal (Standard vs PDF/X) */}
      {isStandardModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#FAF8F5] border border-[#DDD7CC] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B]">
            <button
              onClick={() => setIsStandardModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E3DED4] pb-4 mb-6">
              <span className="text-[10px] uppercase tracking-widest text-[#8C6D3F] font-bold block mb-1">
                Direct PDF Download
              </span>
              <h3 className="font-serif text-xl font-bold text-[#1A1918]">
                เลือกระดับมาตรฐานการดาวน์โหลด PDF
              </h3>
              <p className="text-xs text-[#7A7468] mt-0.5">
                เลือกรูปแบบเพื่อดาวน์โหลดไฟล์ .pdf ลงเครื่องของคุณโดยตรงทันที
              </p>
            </div>

            {/* 3 Download & Save Options Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Option 1: Standard Direct Download */}
              <div
                onClick={() => handleDirectDownloadPDF('standard')}
                className="p-4 sm:p-5 rounded-2xl border-2 border-[#D5CEC0] bg-white hover:border-[#8C6D3F] hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-neutral-100 text-neutral-800 border border-neutral-200">
                      แบบที่ 1 : Standard
                    </span>
                    <FileText className="w-5 h-5 text-[#8C6D3F] group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#1A1918]">
                    Standard E-Catalog
                  </h4>
                  <p className="text-[11px] text-[#6E685C] leading-relaxed">
                    มาตรฐาน A4 ดิจิทัลทั่วไป ดาวน์โหลดไฟล์ .pdf สำเร็จรูปตรงลงเครื่องทันที เหมาะสำหรับ iPad และมือถือ
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#F0ECE4] text-[11px] text-[#8C6D3F] font-semibold flex items-center justify-between">
                  <span>📥 โหลดไฟล์ Standard (.pdf)</span>
                  <span>→</span>
                </div>
              </div>

              {/* Option 2: PDF/X Direct Download */}
              <div
                onClick={() => handleDirectDownloadPDF('pdfx')}
                className="p-4 sm:p-5 rounded-2xl border-2 border-[#C5A880] bg-gradient-to-b from-[#FAF6EE] to-white hover:border-[#8C6D3F] hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-[#1A1918] text-[#E5D2B8]">
                      แบบที่ 2 : PDF/X
                    </span>
                    <ShieldCheck className="w-5 h-5 text-amber-700 group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#1A1918] flex items-center gap-1">
                    <span>PDF/X (PDF/X-1a)</span>
                    <span className="text-[9px] text-amber-700 bg-amber-100 px-1 rounded font-mono font-bold">ISO</span>
                  </h4>
                  <p className="text-[11px] text-[#6E685C] leading-relaxed">
                    มาตรฐานแท่นพิมพ์สากล (ISO 15930-1) ความละเอียดสูงสุด 300+ DPI ดาวน์โหลดไฟล์ .pdf ตรงลงเครื่อง
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#F0ECE4] text-[11px] text-amber-900 font-bold flex items-center justify-between">
                  <span>📥 โหลดไฟล์ PDF/X (.pdf)</span>
                  <span>→</span>
                </div>
              </div>

              {/* Option 3: Method 2 - Native Save as PDF (Direct Browser Engine) */}
              <div
                onClick={() => {
                  setIsStandardModalOpen(false);
                  handleSaveVectorPDF100Percent();
                }}
                className="p-4 sm:p-5 rounded-2xl border-2 border-[#8C6D3F] bg-gradient-to-b from-[#FAF6EE] to-white hover:border-[#6B5028] hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group space-y-4 ring-2 ring-[#8C6D3F]/30"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase bg-[#8C6D3F] text-white">
                      แบบที่ 3 : บันทึกผ่านเบราว์เซอร์
                    </span>
                    <Printer className="w-5 h-5 text-[#8C6D3F] group-hover:scale-110 transition-transform" />
                  </div>
                  <h4 className="font-serif text-sm sm:text-base font-bold text-[#1A1918] flex items-center gap-1">
                    <span>Native Save as PDF</span>
                    <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1 rounded font-mono font-bold">100%</span>
                  </h4>
                  <p className="text-[11px] text-[#6E685C] leading-relaxed">
                    เปิดหน้าต่างพิมพ์ของเบราว์เซอร์เพื่อบันทึกเป็น PDF ตรงตามหน้าเว็บ 100% ตัวอักษรเป็น Vector แท้ ไม่แตก
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#F0ECE4] text-[11px] text-[#8C6D3F] font-bold flex items-center justify-between">
                  <span>🖨️ สั่งบันทึกเป็น PDF (Save as PDF)</span>
                  <span>→</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#E8E2D6] flex items-center justify-between text-xs text-[#7A7468]">
              <span>💡 เลือกรูปแบบที่ต้องการเพื่อดาวน์โหลดหรือบันทึกไฟล์ PDF ขนาด A4</span>
              <button
                onClick={() => setIsStandardModalOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold text-[#6E685C] hover:text-[#1A1918]"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Toolbar (Hidden in Print) */}
      <div className="no-print">
        <Navbar exhibition={exhibition} />

        <div className="bg-[#EAE5DC] border-b border-[#D5CEC0] py-4 px-4 sm:px-6 lg:px-8 sticky top-16 z-30 shadow-sm backdrop-blur-md">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                href="/"
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#6B6355] hover:text-[#1A1918] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>โถงกลาง (Grand Lobby)</span>
              </Link>
              <span className="text-[#C4BDB0]">•</span>
              <Link
                href={`/exhibitions/${exhibition.slug}`}
                className="text-xs font-semibold uppercase tracking-wider text-[#6B6355] hover:text-[#1A1918] transition-colors"
              >
                <span>หน้านิทรรศการ</span>
              </Link>
              <span className="text-[#C4BDB0]">•</span>
              <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                สูจิบัตร A4 (Vector PDF แท้ 100%)
              </span>
            </div>

            {/* Action Buttons Toolbar */}
            <div className="flex items-center gap-2.5 flex-wrap">
              {/* Direct Peer Reviewers Editor Button */}
              <button
                onClick={() => setIsPeerReviewModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#5C5548] hover:text-[#1A1918] border border-[#D5CEC0] rounded-full text-xs font-bold tracking-wider shadow-sm transition-all active:scale-95"
                title="จัดการรายชื่อคณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Reviewers)"
              >
                <GraduationCap className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span>ผู้ทรงคุณวุฒิ ({peerReviewersList.length})</span>
              </button>

              {/* Edit Footer Text Button */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#5C5548] hover:text-[#1A1918] border border-[#D5CEC0] rounded-full text-xs font-semibold tracking-wider shadow-sm transition-all active:scale-95"
                title="แก้ไขข้อความ Footer ท้ายหน้าสูจิบัตร"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span>แก้ไข Footer</span>
              </button>

              {/* PRIMARY ACTION BUTTON: 1-Click Native Save as PDF (Method 2) */}
              <button
                onClick={handleSaveVectorPDF100Percent}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#8C6D3F] hover:bg-[#735831] text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95"
                title="บันทึกผ่านเบราว์เซอร์เป็นไฟล์ Vector PDF ตรงตามหน้าเว็บ 100% (วิธีที่ 2)"
              >
                <Printer className="w-4 h-4 text-[#FFFDF9]" />
                <span>🖨️ บันทึกผ่านเบราว์เซอร์ (Save as PDF)</span>
              </button>

              {/* MAIN DOWNLOAD BUTTON: Opens the 3-Option Selection Modal */}
              <button
                onClick={() => setIsStandardModalOpen(true)}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-full text-xs font-bold uppercase tracking-wider shadow-md transition-all active:scale-95 disabled:opacity-50"
                title="เลือกระดับมาตรฐานการดาวน์โหลดสูจิบัตร (Standard / PDF/X / บันทึกผ่านเบราว์เซอร์)"
              >
                {downloaded ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isGeneratingPdf ? (
                  <Loader2 className="w-4 h-4 text-[#C5A880] animate-spin" />
                ) : (
                  <Download className="w-4 h-4 text-[#C5A880]" />
                )}
                <span>
                  {downloaded
                    ? 'ดาวน์โหลดไฟล์สำเร็จแล้ว!'
                    : isGeneratingPdf
                    ? 'กำลังสร้างและดาวน์โหลด PDF...'
                    : 'ดาวน์โหลดสูจิบัตร PDF'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Peer Reviewers Modal */}
      {isPeerReviewModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl bg-[#FAF8F5] border border-[#DDD7CC] rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPeerReviewModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E3DED4] pb-3.5 mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#8C6D3F]/10 rounded-xl text-[#8C6D3F]">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1A1918]">
                    จัดการคณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Reviewers)
                  </h3>
                  <p className="text-[11px] text-[#7A7468]">
                    กำหนดรายชื่อ 3 - 5 ท่าน เพื่อแสดงบนหน้าเว็บและแทรกในเล่มสูจิบัตรพิมพ์ A4 (Page 2)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddReviewer}
                className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-[#FAF6EE] text-[#8C6D3F] border border-[#D5CEC0] rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มผู้ทรงคุณวุฒิ</span>
              </button>
            </div>

            <form onSubmit={handleSavePeerReviewers} className="space-y-4">
              {peerReviewersList.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8C8477] border border-dashed border-[#D5CEC0] rounded-xl bg-white/60 space-y-2">
                  <p>ยังไม่มีรายชื่อคณะกรรมการผู้ทรงคุณวุฒิในนิทรรศการนี้</p>
                  <button
                    type="button"
                    onClick={handleAddReviewer}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A1918] text-white rounded-lg text-xs font-semibold shadow-sm hover:bg-[#33302C] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C5A880]" />
                    <span>คลิกเพื่อเพิ่มผู้ทรงคุณวุฒิท่านแรก</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                  {peerReviewersList.map((reviewer, idx) => (
                    <div
                      key={idx}
                      className="p-4 bg-white border border-[#DDD6C8] rounded-2xl space-y-3 shadow-sm relative group"
                    >
                      <div className="flex items-center justify-between border-b border-[#F0ECE4] pb-2">
                        <span className="text-xs font-bold text-[#8C6D3F] flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5" />
                          {reviewer.role || `ผู้ทรงคุณวุฒิท่านที่ ${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveReviewer(idx)}
                          className="p-1 text-[#A8A295] hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="ลบรายชื่อ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-start gap-3.5">
                        {/* Avatar Upload / Preview */}
                        <div className="shrink-0 flex flex-col items-center">
                          <label className="block text-[10px] font-semibold text-[#5A554A] mb-1">
                            รูปถ่าย (Photo)
                          </label>
                          {reviewer.avatarUrl ? (
                            <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#D5CEC0] shadow-sm group/photo bg-[#1A1918]">
                              <img
                                src={reviewer.avatarUrl}
                                alt={reviewer.name || 'Reviewer'}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateReviewer(idx, 'avatarUrl', '')}
                                className="absolute inset-0 bg-black/70 text-white flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity text-[10px] font-bold"
                                title="ลบรูปภาพ"
                              >
                                ลบรูป
                              </button>
                            </div>
                          ) : (
                            <label className="w-16 h-16 rounded-xl border-2 border-dashed border-[#D5CEC0] hover:border-[#8C6D3F] bg-[#FAF8F5] hover:bg-[#FAF6EE] flex flex-col items-center justify-center cursor-pointer transition-all text-[#8C8477] hover:text-[#8C6D3F] shadow-xs">
                              <Camera className="w-5 h-5" />
                              <span className="text-[9px] mt-0.5 font-semibold">อัปโหลด</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    const fd = new FormData();
                                    fd.append('file', file);
                                    fd.append('folder', '/artvara-reviewers');
                                    fd.append('fileName', reviewer.name || `reviewer-${idx}`);
                                    try {
                                      const res = await fetch('/api/admin/upload', {
                                        method: 'POST',
                                        body: fd,
                                      });
                                      const data = await res.json();
                                      if (data.url) {
                                        handleUpdateReviewer(idx, 'avatarUrl', data.url);
                                      }
                                    } catch (err) {
                                      console.error(err);
                                      alert('เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ');
                                    }
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>

                        {/* Reviewer Details */}
                        <div className="flex-1 w-full space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-semibold text-[#5A554A] mb-1">
                                คำนำหน้า / ตำแหน่งวิชาการ
                              </label>
                              <input
                                type="text"
                                value={reviewer.academicTitle || ''}
                                onChange={(e) => handleUpdateReviewer(idx, 'academicTitle', e.target.value)}
                                placeholder="เช่น ศ.เกียรติคุณ / รศ.ดร. / ผศ."
                                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-xs text-[#1A1918] focus:outline-none"
                              />
                            </div>

                            <div className="sm:col-span-2">
                              <label className="block text-[10px] font-semibold text-[#5A554A] mb-1">
                                ชื่อ - นามสกุล <span className="text-rose-600">*</span>
                              </label>
                              <input
                                type="text"
                                required
                                value={reviewer.name}
                                onChange={(e) => handleUpdateReviewer(idx, 'name', e.target.value)}
                                placeholder="เช่น ปรีชา เถาทอง หรือ Prof. John Doe"
                                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-xs font-semibold text-[#1A1918] focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[10px] font-semibold text-[#5A554A] mb-1">
                                สังกัด / สถาบัน / มหาวิทยาลัย
                              </label>
                              <input
                                type="text"
                                value={reviewer.institution || ''}
                                onChange={(e) => handleUpdateReviewer(idx, 'institution', e.target.value)}
                                placeholder="เช่น มหาวิทยาลัยศิลปากร / Poh-Chang"
                                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-xs text-[#1A1918] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-semibold text-[#5A554A] mb-1">
                                บทบาทในคณะกรรมการ
                              </label>
                              <input
                                type="text"
                                value={reviewer.role || ''}
                                onChange={(e) => handleUpdateReviewer(idx, 'role', e.target.value)}
                                placeholder="เช่น ประธานกรรมการผู้ทรงคุณวุฒิ"
                                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl text-xs text-[#1A1918] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-3 border-t border-[#E8E2D6] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPeerReviewModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6E685C] hover:text-[#1A1918]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={savingReviewers}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-xl text-xs font-semibold tracking-wider uppercase shadow transition-all active:scale-95 disabled:opacity-50"
                >
                  {savedReviewersSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>บันทึกสำเร็จ!</span>
                    </>
                  ) : savingReviewers ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#C5A880]" />
                      <span>บันทึกรายชื่อผู้ทรงคุณวุฒิ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Footer Modal */}
      {isEditModalOpen && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B]">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E3DED4] pb-3.5 mb-5 flex items-center gap-2">
              <div className="p-2 bg-[#8C6D3F]/10 rounded-lg text-[#8C6D3F]">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1A1918]">
                  แก้ไขข้อความ Footer ของสูจิบัตร
                </h3>
                <p className="text-[11px] text-[#7A7468]">
                  ปรับแต่งข้อความท้ายหน้าปก และข้อความท้ายหน้ารูปผลงานแต่ละหน้า
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveFooterText} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#4A443A] mb-1">
                  1. ข้อความ Footer ท้ายหน้าปกสูจิบัตร (Cover Footer)
                </label>
                <input
                  type="text"
                  required
                  value={coverFooter}
                  onChange={(e) => setCoverFooter(e.target.value)}
                  placeholder="เช่น International Art Festival and Art Exhibition in Thailand • 18th Poh-Chang Art Festival"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CEC0] rounded-xl text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                />
                <span className="text-[10px] text-[#8C8477] mt-1 block">
                  จะแสดงที่แถบท้ายสุดของหน้าปกสูจิบัตร
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#4A443A] mb-1">
                  2. ข้อความ Footer ท้ายหน้ารูปผลงานแต่ละหน้า (Artwork Page Footer - ไม่บังคับ)
                </label>
                <input
                  type="text"
                  value={plateFooter}
                  onChange={(e) => setPlateFooter(e.target.value)}
                  placeholder="เช่น 18th Poh-Chang Art Festival 2026 หรือเว้นว่างไว้"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CEC0] rounded-xl text-xs text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                />
                <span className="text-[10px] text-[#8C8477] mt-1 block">
                  จะแสดงที่แถบท้ายสุดของหน้ารูปผลงานแต่ละหน้า (หากไม่ต้องการให้แสดงข้อความสามารถเว้นว่างไว้ได้)
                </span>
              </div>

              {/* 3. Footer Graphic / Image Customizer */}
              <div className="pt-2 border-t border-[#E8E2D6] space-y-2.5">
                <label className="block text-xs font-bold text-[#4A443A]">
                  3. ภาพ / กราฟิกลายเส้น Footer ด้านล่างของสูจิบัตร
                </label>

                {/* Presets Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setFooterGraphicType('wave_gold')}
                    className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                      footerGraphicType === 'wave_gold'
                        ? 'border-[#8C6D3F] bg-[#FAF6EE] text-[#8C6D3F] shadow-sm ring-1 ring-[#8C6D3F]'
                        : 'border-[#DDD6C8] bg-white text-[#555] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="block text-sm mb-0.5">🌊</span>
                    <span>คลื่นทอง-เงิน</span>
                    <span className="block text-[9px] text-[#888] font-normal">ค่าเริ่มต้น</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFooterGraphicType('wave_mono')}
                    className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                      footerGraphicType === 'wave_mono'
                        ? 'border-[#8C6D3F] bg-[#FAF6EE] text-[#8C6D3F] shadow-sm ring-1 ring-[#8C6D3F]'
                        : 'border-[#DDD6C8] bg-white text-[#555] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="block text-sm mb-0.5">🖤</span>
                    <span>คลื่นโมโนโครม</span>
                    <span className="block text-[9px] text-[#888] font-normal">เทา-ดำ</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFooterGraphicType('line_gold')}
                    className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                      footerGraphicType === 'line_gold'
                        ? 'border-[#8C6D3F] bg-[#FAF6EE] text-[#8C6D3F] shadow-sm ring-1 ring-[#8C6D3F]'
                        : 'border-[#DDD6C8] bg-white text-[#555] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="block text-sm mb-0.5">✨</span>
                    <span>เส้นทองมินิมอล</span>
                    <span className="block text-[9px] text-[#888] font-normal">เรียบหรู</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFooterGraphicType('none')}
                    className={`p-2 rounded-xl text-left border text-xs font-semibold transition-all ${
                      footerGraphicType === 'none'
                        ? 'border-[#8C6D3F] bg-[#FAF6EE] text-[#8C6D3F] shadow-sm ring-1 ring-[#8C6D3F]'
                        : 'border-[#DDD6C8] bg-white text-[#555] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="block text-sm mb-0.5">🚫</span>
                    <span>ไม่มีลวดลาย</span>
                    <span className="block text-[9px] text-[#888] font-normal">พื้นขาวล้วน</span>
                  </button>
                </div>

                {/* Custom Image Upload Option */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-bold text-[#4A443A]">
                      หรือ อัปโหลดภาพ / แบนเนอร์ Footer ของท่านเอง:
                    </span>
                    {customFooterImageUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomFooterImageUrl('');
                          setFooterGraphicType('wave_gold');
                        }}
                        className="text-[10px] text-red-600 hover:underline"
                      >
                        ลบภาพ / ใช้ลายมาตรฐาน
                      </button>
                    )}
                  </div>

                  <label className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-[#D5CEC0] hover:border-[#8C6D3F] rounded-xl cursor-pointer transition-colors group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFooterImageUpload}
                      className="hidden"
                    />
                    <Upload className="w-4 h-4 text-[#8C6D3F] group-hover:scale-110 transition-transform" />
                    <span className="text-xs text-[#5C5548] font-medium">
                      {customFooterImageUrl
                        ? 'คลิกเพื่อเปลี่ยนภาพ Footer อื่น (PNG, JPG, SVG)'
                        : 'คลิกเพื่อเลือกไฟล์ภาพ Footer จากเครื่องคุณ (PNG, JPG, SVG)'}
                    </span>
                  </label>

                  {customFooterImageUrl && (
                    <div className="mt-2 p-2 bg-[#FAF8F5] border border-[#DDD6C8] rounded-xl flex items-center gap-3">
                      <img
                        src={customFooterImageUrl}
                        alt="Custom Footer Preview"
                        className="h-10 w-auto max-w-[140px] object-contain bg-white border border-[#E0E0E0] rounded p-1"
                      />
                      <div className="text-[10px] text-[#666]">
                        <span className="font-bold text-emerald-700 block">✓ กำลังใช้งานภาพนี้เป็น Footer ท้ายหน้า</span>
                        <span>ภาพจะแสดงที่แถบล่างสุดของสูจิบัตรทุกหน้า</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-[#E8E2D6] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-[#6E685C] hover:text-[#1A1918]"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-xl text-xs font-semibold tracking-wider uppercase shadow transition-all active:scale-95 disabled:opacity-50"
                >
                  {savedSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>บันทึกสำเร็จ!</span>
                    </>
                  ) : saving ? (
                    <span>กำลังบันทึก...</span>
                  ) : (
                    <>
                      <Save className="w-4 h-4 text-[#C5A880]" />
                      <span>บันทึกข้อความ</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main A4 Visual Catalog Viewer (WYSIWYG 100% True-to-Print A4 - Pure K-Plate Monochromes) */}
      <main className="w-full max-w-[210mm] mx-auto py-8 sm:py-12 space-y-12 sm:space-y-16">
        {/* Cover Page (A4, 210mm x 297mm, 15mm Padding, Pure K Black/Gray) */}
        <section className="catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm] bg-white border border-[#E0E0E0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border text-center">
          <div>
            <div className="border-b border-[#E0E0E0] pb-3 mb-5">
              <span className="catalog-heading-th font-serif text-3xl font-bold tracking-[0.2em] text-[#000000] block leading-normal">
                ARTVARA
              </span>
              <span className="catalog-body-th text-[10px] uppercase tracking-widest text-[#666666] mt-1 block leading-normal">
                International Art Festival &amp; Curated Exhibition
              </span>
            </div>

            {exhibition.bannerUrl && (
              <div className="relative w-full h-[140mm] max-w-[180mm] mx-auto overflow-hidden mb-5 flex items-center justify-center">
                <img
                  src={exhibition.bannerUrl}
                  alt={exhibition.title}
                  crossOrigin="anonymous"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            )}

            <div className="space-y-2.5 max-w-[170mm] mx-auto">
              <span className="catalog-body-th text-xs font-bold uppercase tracking-[0.2em] text-[#333333] block leading-normal">
                Official Exhibition Catalog (สูจิบัตร)
              </span>
              <h1 className="catalog-heading-th font-serif text-2xl sm:text-3xl font-bold text-[#000000] leading-snug">
                {exhibition.title}
              </h1>
              {curator?.name && (
                <p className="catalog-body-th text-xs text-[#444444] font-medium pt-1 leading-normal">
                  Curated by: <span className="font-semibold text-[#000000]">{curator.name}</span>
                </p>
              )}
              {hasReviewers && (
                <p className="catalog-body-th text-[11px] text-[#555555] font-medium pt-0.5 leading-normal">
                  Peer Review Committee:{' '}
                  <span className="font-semibold text-[#000000]">
                    {peerReviewersList.map((r) => [r.academicTitle, r.name].filter(Boolean).join(' ')).join(' • ')}
                  </span>
                </p>
              )}
              <p className="catalog-body-th text-[11px] text-[#666666] leading-normal">
                {formatDateRange(exhibition.startDate, exhibition.endDate)}
              </p>
            </div>
          </div>

          {/* Dynamic Cover Footer Text - Pure K Tint */}
          <div className="pt-4 border-t border-[#E0E0E0] text-center">
            <p className="catalog-body-th text-[10px] text-[#666666] uppercase tracking-widest leading-relaxed">
              {coverFooter}
            </p>
          </div>
        </section>

        {/* Page 2: Academic Peer Review Board & Curatorial Statement (Rendered when exhibition has peer reviewers) */}
        {hasReviewers && (
          <section className="catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm] bg-white border border-[#E0E0E0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border">
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-[#E0E0E0] pb-3">
                <span className="catalog-heading-th font-serif text-2xl font-bold tracking-[0.15em] text-[#000000] block">
                  ARTVARA
                </span>
                <span className="catalog-body-th text-[9px] uppercase tracking-widest text-[#666666] mt-0.5 block">
                  Academic Peer Review Board &amp; Curatorial Statement
                </span>
              </div>

              {/* Peer Review Board List */}
              <div className="space-y-3">
                <div>
                  <span className="catalog-heading-th text-xs font-bold uppercase tracking-[0.15em] text-[#000000] block">
                    คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)
                  </span>
                  <p className="catalog-body-th text-[10px] text-[#666666] mt-0.5">
                    รายนามคณะกรรมการผู้ทรงคุณวุฒิในการพิจารณาและประเมินผลงานศิลปกรรมในนิทรรศการ
                  </p>
                </div>

                <div className="space-y-2.5 pt-1">
                  {peerReviewersList.map((reviewer, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-[#FAFAFA] border border-[#E8E8E8] rounded-lg flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        {/* Reviewer Photo / Avatar */}
                        {reviewer.avatarUrl ? (
                          <div className="relative w-11 h-12 rounded-md overflow-hidden border border-[#D5CEC0] shrink-0 bg-[#1A1918]">
                            <img
                              src={reviewer.avatarUrl}
                              alt={reviewer.name || 'Reviewer'}
                              crossOrigin="anonymous"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-12 rounded-md bg-[#EFEFEF] border border-[#DCDCDC] flex items-center justify-center catalog-heading-th text-sm font-bold text-[#444444] shrink-0">
                            {reviewer.name?.trim().charAt(0).toUpperCase() || 'R'}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="catalog-body-th text-[9px] font-bold uppercase tracking-wider text-[#000000] bg-[#EAEAEA] px-1.5 py-0.5 rounded">
                              {reviewer.role || (idx === 0 ? 'ประธานกรรมการ' : `กรรมการผู้ทรงคุณวุฒิ`)}
                            </span>
                            <h4 className="catalog-heading-th text-xs font-bold text-[#000000]">
                              {[reviewer.academicTitle, reviewer.name].filter(Boolean).join(' ')}
                            </h4>
                          </div>
                          {reviewer.institution && (
                            <p className="catalog-body-th text-[10px] text-[#555555]">
                              {reviewer.institution}
                            </p>
                          )}
                        </div>
                      </div>

                      {reviewer.country && (
                        <span className="catalog-body-th text-[10px] text-[#777777] shrink-0">
                          {reviewer.country}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Curatorial Statement Block */}
              {exhibition.curatorNote && (
                <div className="space-y-2 pt-2 border-t border-[#E8E8E8]">
                  <span className="catalog-heading-th text-xs font-bold uppercase tracking-[0.15em] text-[#000000] block">
                    คำนำภัณฑารักษ์ (Curatorial Statement)
                  </span>
                  <p className="catalog-body-th text-[11px] text-[#333333] leading-relaxed italic whitespace-pre-line max-h-[75mm] overflow-hidden">
                    &quot;{exhibition.curatorNote}&quot;
                  </p>
                  {curator?.name && (
                    <p className="catalog-body-th text-[10px] font-bold text-[#000000] text-right pt-1">
                      — {curator.name} (Curator)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer Row for Page 2 */}
            <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[10px] text-[#777777]">
              <span>{plateFooter || 'Editorial & Academic Accreditation Board'}</span>
              <span className="font-mono text-[#555555] font-semibold">2</span>
            </div>
          </section>
        )}

        {/* Artwork Plates Per Page (A4, 210mm x 297mm, 15mm Margins, 8 Inches Boundary, Flag Above Photo) */}
        {artworks.map((art, idx) => {
          const artist = art.artist;
          const pageNum = hasReviewers ? idx + 3 : idx + 2;
          const hasRealPhoto =
            artist?.avatarUrl &&
            !artist.avatarUrl.includes('unsplash.com/photo-1507003211169') &&
            !artist.avatarUrl.includes('unsplash.com/photo-1534528741775');

          return (
            <section
              key={art.id}
              className="catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm] bg-white border border-[#E0E0E0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border"
            >
              <div>
                {/* 1. Main Large Artwork Image (Positioned from top to 8-inch boundary, exactly 175mm tall) */}
                <div className="relative w-full h-[175mm] max-h-[175mm] bg-white overflow-hidden mb-3 flex items-center justify-center">
                  <img
                    src={art.imageUrl}
                    alt={art.title}
                    crossOrigin="anonymous"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>

                {/* 2. Details Section (Starts at 8 inches from top of page - Pure K Black/Gray Text) */}
                <div className="relative z-10 flex flex-row items-start gap-5 pt-1">
                  {/* Left Column: Flag Image ON TOP, Artist Photo DIRECTLY BELOW */}
                  <div className="shrink-0 w-20 flex flex-col items-start">
                    {/* Flag Badge Image - Above Photo */}
                    <div className="relative w-9 h-5 rounded-[2px] overflow-hidden border border-[#D0D0D0] shadow-sm mb-2 bg-[#F5F5F5]">
                      <img
                        src={getFlagImageUrl(artist?.country)}
                        alt={artist?.country || 'Flag'}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Artist Photo / Avatar (Below Flag) */}
                    {hasRealPhoto ? (
                      <div className="relative w-20 h-24 bg-[#1A1A1A] rounded-lg overflow-hidden shadow">
                        <img
                          src={artist!.avatarUrl!}
                          alt={artist?.name || 'Artist'}
                          crossOrigin="anonymous"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-24 bg-[#EFEFEF] border border-[#D0D0D0] rounded-lg flex flex-col items-center justify-center shadow-sm overflow-hidden">
                        <span className="catalog-heading-th text-2xl font-bold text-[#444444] leading-none select-none">
                          {artist?.name?.trim().charAt(0).toUpperCase() || 'A'}
                        </span>
                        <span className="catalog-body-th text-[8px] text-[#999999] mt-1 font-medium leading-none">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Artist Info & Artwork Specs & Concept */}
                  <div className="flex-1 text-[#222222] min-w-0 space-y-2">
                    {/* Artist Block */}
                    <div className="space-y-0.5">
                      <h3 className="catalog-heading-th text-sm font-bold text-[#000000] leading-snug">
                        {artist?.name || 'Artist'}
                      </h3>
                      {artist?.email && (
                        <p className="catalog-body-th text-[#666666] text-[10px] leading-normal">
                          {artist.email}
                        </p>
                      )}
                      <p className="catalog-body-th text-[#666666] text-[10px] leading-normal">
                        {artist?.country || 'International'}
                      </p>
                    </div>

                    {/* Artwork Block */}
                    <div className="space-y-0.5">
                      <h4 className="catalog-heading-th text-xs sm:text-sm font-bold text-[#000000] leading-snug">
                        {art.title}
                      </h4>
                      <p className="catalog-body-th text-[#444444] text-[10px] leading-normal font-medium">
                        {[art.medium, art.dimensions, art.yearCreated ? `(${art.yearCreated})` : ''].filter(Boolean).join(' ')}
                      </p>
                    </div>

                    {/* Concept Block */}
                    {(art.concept?.trim() || art.description?.trim()) && (
                      <div className="catalog-body-th pt-0.5 pb-1 text-[10px] sm:text-[11px] leading-relaxed text-[#333333] break-words">
                        <span className="font-bold text-[#000000]">Concept : </span>
                        <span>{art.concept?.trim() || art.description?.trim()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Footer Graphic / Custom Banner */}
              {footerGraphicType === 'custom_image' && customFooterImageUrl ? (
                <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden z-0 flex items-end justify-center px-4 pb-2">
                  <img src={customFooterImageUrl} alt="Footer Banner" className="max-h-full max-w-full object-contain" />
                </div>
              ) : footerGraphicType === 'wave_mono' ? (
                <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden z-0 opacity-40">
                  <svg viewBox="0 0 600 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`webWaveMono-${art.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#444444" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#111111" stopOpacity="0.15" />
                      </linearGradient>
                    </defs>
                    <path d="M-30,120 C120,40 260,130 380,60 C480,0 560,90 630,30 L630,120 Z" fill={`url(#webWaveMono-${art.id})`} />
                  </svg>
                </div>
              ) : footerGraphicType === 'line_gold' ? (
                <div className="absolute bottom-10 left-8 right-8 border-b border-[#C5A880]/50 pointer-events-none z-0" />
              ) : footerGraphicType !== 'none' ? (
                <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none overflow-hidden z-0 opacity-40">
                  <svg viewBox="0 0 600 120" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`webWave1-${art.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D0D0D0" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#B0B0B0" stopOpacity="0.2" />
                      </linearGradient>
                      <linearGradient id={`webWave2-${art.id}`} x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#F5B28B" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#EFA478" stopOpacity="0.15" />
                      </linearGradient>
                    </defs>
                    <path d="M-30,120 C120,40 260,130 380,60 C480,0 560,90 630,30 L630,120 Z" fill={`url(#webWave1-${art.id})`} />
                    <path d="M-30,120 C90,90 220,20 370,80 C490,140 570,60 630,70 L630,120 Z" fill={`url(#webWave2-${art.id})`} />
                  </svg>
                </div>
              ) : null}

              {/* Bottom Footer Row: Pure K Grayscale Tints */}
              <div className="relative z-10 mt-3 pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[10px] text-[#777777]">
                <span>
                  {plateFooter ? plateFooter : ''}
                  {art.price ? (plateFooter ? ` • ${formatPrice(art.price)}` : formatPrice(art.price)) : ''}
                </span>
                <span className="font-mono text-[#555555] font-semibold">{pageNum}</span>
              </div>
            </section>
          );
        })}
      </main>

      {/* Floating Action Button for 100% Quick Access on any device/scroll */}
      <div className="no-print fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsStandardModalOpen(true)}
          disabled={isGeneratingPdf}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-full font-bold text-sm shadow-2xl transition-all hover:scale-105 active:scale-95 ring-4 ring-white/50 disabled:opacity-50"
          title="เลือกระดับมาตรฐานและดาวน์โหลดสูจิบัตร PDF"
        >
          {downloaded ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : isGeneratingPdf ? (
            <Loader2 className="w-5 h-5 text-[#C5A880] animate-spin" />
          ) : (
            <Download className="w-5 h-5 text-[#C5A880]" />
          )}
          <span>
            {downloaded
              ? 'ดาวน์โหลดไฟล์สำเร็จแล้ว!'
              : isGeneratingPdf
              ? 'กำลังสร้างและดาวน์โหลด PDF...'
              : '📥 ดาวน์โหลดสูจิบัตร PDF'}
          </span>
        </button>
      </div>

      <div className="no-print">
        <Footer exhibition={exhibition} />
      </div>
    </div>
  );
}
