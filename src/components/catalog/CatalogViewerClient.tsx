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
import { getAdobeMonthlyUsage, incrementAdobeUsage } from '@/lib/adobeQuota';
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
  const [pdfProgressPercent, setPdfProgressPercent] = useState(0);
  const [pdfProgressStep, setPdfProgressStep] = useState('');
  const [pdfEstimatedSeconds, setPdfEstimatedSeconds] = useState(0);

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

  // 🅰️ 1-Click Adobe PostScript Cloud PDF for a SINGLE page in Reader Modal
  const handleDownloadAdobePdfSinglePage = async (pageIndex: number) => {
    const currentQuota = getAdobeMonthlyUsage();
    if (currentQuota.isExceeded) {
      alert(
        `⚠️ โควต้า Adobe PDF ฟรีประจำเดือน ${currentQuota.monthName} ถูกใช้งานครบ ${currentQuota.max} ครั้งแล้วครับ\n\n` +
        `💡 คุณสามารถกดปุ่ม "พิมพ์หน้านี้" เพื่อบันทึกไฟล์ PDF ได้ฟรี 100% ไม่จำกัดจำนวนครั้งครับ`
      );
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setPdfProgressPercent(15);
      setPdfProgressStep('เตรียมข้อมูลหน้าสูจิบัตร');
      setPdfProgressText(`กำลังประมวลผลหน้า ${pageIndex + 1}...`);
      setPdfEstimatedSeconds(5);

      // Find the active modal page container
      const modalPageEl =
        document.querySelector('.catalog-reader-modal .catalog-dynamic-page') ||
        document.querySelector('.catalog-dynamic-page') ||
        document.querySelector('.catalog-cover-page') ||
        document.querySelector('.catalog-statement-page');

      if (!modalPageEl) {
        throw new Error('ไม่พบข้อมูลหน้าสูจิบัตรที่เลือก');
      }

      const isCustomSize = Boolean(customTemplate?.pageWidthInches && customTemplate?.pageHeightInches);
      const w = isCustomSize ? (customTemplate?.pageWidthInches || 8.0) : (paperSize === 'square8x8' ? 8.0 : 8.27);
      const h = isCustomSize ? (customTemplate?.pageHeightInches || 8.0) : (paperSize === 'square8x8' ? 8.0 : 11.69);

      const cleanHtml = modalPageEl.outerHTML
        .replace(/loading="lazy"/g, 'loading="eager"')
        .replace(/decoding="async"/g, 'decoding="sync"')
        .replace(/<img /g, '<img onerror="this.style.display=\'none\'" ');

      // Extract ONLY catalog-related CSS rules (avoids exceeding Adobe's payload limit)
      const CATALOG_KEYWORDS = [
        'catalog-', '.font-serif', '.font-bold', '.text-', '.bg-',
        '.flex', '.grid', '.space-', '.p-', '.px-', '.py-', '.pt-', '.pb-',
        '.m-', '.mx-', '.my-', '.mt-', '.mb-', '.w-', '.h-', '.min-h-', '.max-',
        '.border', '.rounded', '.shadow', '.overflow', '.relative', '.absolute',
        '.truncate', '.uppercase', '.tracking-', '.leading-', '.block',
        '.items-', '.justify-', '.gap-', 'Maitree', 'Prompt', 'Sarabun', 'Cinzel', '@font-face',
      ];
      let inlinedCss = '';
      try {
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            for (const rule of Array.from(sheet.cssRules || [])) {
              if (rule instanceof CSSImportRule) continue;
              const text = rule.cssText;
              if (CATALOG_KEYWORDS.some(kw => text.includes(kw))) {
                inlinedCss += text + '\n';
              }
            }
          } catch { /* cross-origin */ }
        }
      } catch { /* fallback */ }

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${exhibition.title || 'Art Exhibition'}-Page-${pageIndex + 1}-Adobe</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=Maitree:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
${inlinedCss}
    @page { size: ${w}in ${h}in; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body {
      width: ${w}in;
      height: ${h}in;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: #ffffff;
      font-family: 'Maitree', 'Noto Serif Thai', Georgia, serif;
    }
    .catalog-dynamic-page, .catalog-cover-page, .catalog-statement-page, .catalog-a4-page, .catalog-square8-page, section {
      position: relative !important;
      width: ${w}in !important;
      height: ${h}in !important;
      max-width: ${w}in !important;
      max-height: ${h}in !important;
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
      overflow: hidden !important;
      background-color: #ffffff !important;
      box-sizing: border-box !important;
    }
  </style>
</head>
<body class="bg-white">
  ${cleanHtml}
</body>
</html>`;



      // Step 1: Request Presigned Upload Asset from Adobe Cloud (Instant 50ms)
      setPdfProgressPercent(30);
      setPdfProgressStep('กำลังเชื่อมต่อ Adobe Cloud');
      setPdfProgressText('ขอพื้นที่จัดเก็บเอกสารบน Adobe Cloud Storage...');
      setPdfEstimatedSeconds(4);

      const initRes = await fetch('/api/catalog/adobe-pdf?action=create-asset', { method: 'POST' });
      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({}));
        throw new Error(errData.error || 'ไม่สามารถเชื่อมต่อ Adobe Cloud ได้');
      }
      const { uploadUri, assetID } = await initRes.json();

      // Step 2: Upload HTML Document DIRECTLY to AWS S3 (0ms through Cloudflare Worker)
      setPdfProgressPercent(50);
      setPdfProgressStep('อัปโหลดข้อมูลสู่ Adobe Cloud');
      setPdfProgressText('กำลังส่งข้อมูลความละเอียดสูงตรงสู่ Adobe Storage...');
      setPdfEstimatedSeconds(3);

      const uploadRes = await fetch(uploadUri, {
        method: 'PUT',
        headers: { 'Content-Type': 'text/html' },
        body: fullHtml,
      });

      if (!uploadRes.ok) {
        throw new Error(`ไม่สามารถอัปโหลดข้อมูลไปยัง Adobe Storage ได้ (${uploadRes.status})`);
      }

      // Step 3: Start Conversion Job on Adobe Engine
      setPdfProgressPercent(70);
      setPdfProgressStep('เริ่มประมวลผลด้วย Adobe PostScript Engine');
      setPdfProgressText('ส่งคำสั่งแปลงไฟล์เข้าสู่ระบบ Adobe Document Cloud...');
      setPdfEstimatedSeconds(2);

      const startRes = await fetch('/api/catalog/adobe-pdf?action=start-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetID,
          pageWidthInches: w,
          pageHeightInches: h,
        }),
      });

      if (!startRes.ok) {
        const errData = await startRes.json().catch(() => ({}));
        throw new Error(errData.error || 'ไม่สามารถเริ่มการแปลงไฟล์บน Adobe Cloud ได้');
      }

      const { pollingLocation } = await startRes.json();

      // Step 4: Poll status on Adobe Cloud
      let downloadUri = '';
      let attempts = 0;
      const maxAttempts = 30;

      while (!downloadUri && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 1500));
        attempts++;

        const simulatedPercent = Math.min(94, Math.round(75 + (attempts / 3) * 19));
        setPdfProgressPercent(simulatedPercent);
        setPdfProgressStep('Adobe PostScript Engine กำลังประมวลผล');
        setPdfProgressText(`ประมวลผลบน Adobe Cloud (${attempts * 1.5}s)...`);
        setPdfEstimatedSeconds(Math.max(1, 3 - attempts));

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

      // Step 5: Download PDF directly from AWS S3
      setPdfProgressPercent(98);
      setPdfProgressStep('ดาวน์โหลดไฟล์ PDF');
      setPdfProgressText('กำลังบันทึกไฟล์ PDF ลงเครื่อง...');
      setPdfEstimatedSeconds(1);

      const pdfRes = await fetch(downloadUri);
      const blob = await pdfRes.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${exhibition.slug || 'catalog'}-Page-${pageIndex + 1}-Adobe.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Increment monthly quota count
      incrementAdobeUsage(1);

      setPdfProgressPercent(100);
      setPdfProgressStep('เสร็จสมบูรณ์ 100%');
      setPdfProgressText('ดาวน์โหลดหน้า Adobe PDF เรียบร้อยแล้ว');
      setPdfEstimatedSeconds(0);

      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgressText('');
        setPdfProgressPercent(0);
      }, 1000);
    } catch (err: any) {
      console.error('Adobe Single Page PDF generation error:', err);
      alert(`ไม่สามารถสร้าง Adobe PDF หน้านี้ได้: ${err.message || 'โปรดลองอีกครั้ง'}`);
      setIsGeneratingPdf(false);
      setPdfProgressText('');
      setPdfProgressPercent(0);
    }
  };

  // 🅰️ 1-Click Adobe PostScript Cloud PDF Generation (Full Book)
  const handleDownloadFullAdobePDF = async () => {
    const currentQuota = getAdobeMonthlyUsage();
    if (currentQuota.isExceeded) {
      alert(
        `⚠️ โควต้า Adobe PDF ฟรีประจำเดือน ${currentQuota.monthName} ถูกใช้งานครบ ${currentQuota.max} ครั้งแล้วครับ\n\n` +
        `ระบบความปลอดภัยจะระงับการเรียก Adobe Cloud ชั่วคราวเพื่อป้องกันค่าใช้จ่ายส่วนเกิน\n\n` +
        `💡 คุณสามารถกดปุ่ม "พิมพ์ / PDF เบราว์เซอร์" เพื่อบันทึกไฟล์ PDF ขนาดตามจริงได้ฟรี 100% ไม่จำกัดจำนวนครั้งครับ`
      );
      return;
    }

    try {
      setIsGeneratingPdf(true);
      setPdfProgressPercent(10);
      setPdfProgressStep('เตรียมข้อมูลและเลย์เอาต์หน้าสูจิบัตร');
      setPdfProgressText('กำลังรวบรวมรูปภาพและเนื้อหาทุกหน้า...');
      setPdfEstimatedSeconds(12);

      const targetEl = document.getElementById('catalog-continuous-stream-container') || document.querySelector('.catalog-continuous-view');
      if (!targetEl) {
        throw new Error('ไม่พบข้อมูลหน้าสูจิบัตร');
      }

      const isCustomSize = Boolean(customTemplate?.pageWidthInches && customTemplate?.pageHeightInches);
      const w = isCustomSize ? (customTemplate?.pageWidthInches || 8.0) : (paperSize === 'square8x8' ? 8.0 : 8.27);
      const h = isCustomSize ? (customTemplate?.pageHeightInches || 8.0) : (paperSize === 'square8x8' ? 8.0 : 11.69);

      const cleanHtml = targetEl.innerHTML
        .replace(/loading="lazy"/g, 'loading="eager"')
        .replace(/decoding="async"/g, 'decoding="sync"')
        .replace(/<img /g, '<img onerror="this.style.display=\'none\'" ');

      // Extract ONLY catalog-related CSS rules from compiled browser stylesheets
      // This avoids sending the entire Next.js/Tailwind bundle (which would exceed Adobe's limits)
      const CATALOG_KEYWORDS = [
        'catalog-', 'catalog_', '.font-serif', '.font-bold', '.text-', '.bg-',
        '.flex', '.grid', '.space-', '.p-', '.px-', '.py-', '.pt-', '.pb-',
        '.m-', '.mx-', '.my-', '.mt-', '.mb-', '.w-', '.h-', '.min-h-', '.max-',
        '.border', '.rounded', '.shadow', '.overflow', '.relative', '.absolute',
        '.truncate', '.uppercase', '.tracking-', '.leading-', '.block',
        '.items-', '.justify-', '.gap-', '.col-', '.row-', 'Maitree', 'Prompt',
        'Sarabun', 'Cinzel', 'Inter', '@font-face',
      ];
      let inlinedCss = '';
      try {
        for (const sheet of Array.from(document.styleSheets)) {
          try {
            const rules = Array.from(sheet.cssRules || []);
            for (const rule of rules) {
              if (rule instanceof CSSImportRule) continue;
              const text = rule.cssText;
              // Only include rules that contain catalog-relevant selectors or font definitions
              if (CATALOG_KEYWORDS.some(kw => text.includes(kw))) {
                inlinedCss += text + '\n';
              }
            }
          } catch {
            // Cross-origin sheets — skip silently
          }
        }
      } catch {
        // fallback: no extra CSS
      }

      const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${exhibition.title || 'Art Exhibition'}-Catalog-Adobe</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=Maitree:wght@300;400;500;600;700&family=Prompt:wght@300;400;500;600;700&family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
${inlinedCss}
    @page { size: ${w}in ${h}in; margin: 0; }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body {
      width: ${w}in;
      margin: 0;
      padding: 0;
      background: #ffffff;
      font-family: 'Maitree', 'Noto Serif Thai', Georgia, serif;
    }
    #catalog-continuous-stream-container {
      display: block !important;
      width: ${w}in !important;
      max-width: ${w}in !important;
      margin: 0 !important;
      padding: 0 !important;
    }
    .hidden {
      display: block !important;
    }
    .catalog-dynamic-page, .catalog-cover-page, .catalog-statement-page, .catalog-a4-page, .catalog-square8-page, section {
      display: block !important;
      position: relative !important;
      width: ${w}in !important;
      height: ${h}in !important;
      min-height: ${h}in !important;
      max-width: ${w}in !important;
      max-height: ${h}in !important;
      margin: 0 !important;
      border: none !important;
      box-shadow: none !important;
      page-break-after: always !important;
      break-after: page !important;
      overflow: hidden !important;
      background-color: #ffffff !important;
      box-sizing: border-box !important;
    }
    .no-print { display: none !important; }
  </style>
</head>
<body class="bg-white">
  ${cleanHtml}
</body>
</html>`;



      // Step 1: Request Presigned Upload Asset from Adobe Cloud (Instant 50ms)
      setPdfProgressPercent(25);
      setPdfProgressStep('กำลังเชื่อมต่อ Adobe Cloud');
      setPdfProgressText('ขอพื้นที่จัดเก็บเอกสารบน Adobe Cloud Storage...');
      setPdfEstimatedSeconds(8);

      const initRes = await fetch('/api/catalog/adobe-pdf?action=create-asset', { method: 'POST' });
      if (!initRes.ok) {
        const errData = await initRes.json().catch(() => ({}));
        throw new Error(errData.error || 'ไม่สามารถเชื่อมต่อ Adobe Cloud ได้');
      }
      const { uploadUri, assetID } = await initRes.json();

      // Step 2: Upload HTML Document DIRECTLY to AWS S3 (0ms through Cloudflare Worker)
      setPdfProgressPercent(45);
      setPdfProgressStep('อัปโหลดข้อมูลสูจิบัตรสู่ Adobe Cloud');
      setPdfProgressText('กำลังส่งข้อมูลความละเอียดสูงตรงสู่ Adobe Storage...');
      setPdfEstimatedSeconds(6);

      const uploadRes = await fetch(uploadUri, {
        method: 'PUT',
        headers: {
          'Content-Type': 'text/html',
        },
        body: fullHtml,
      });

      if (!uploadRes.ok) {
        throw new Error(`ไม่สามารถอัปโหลดข้อมูลไปยัง Adobe Storage ได้ (${uploadRes.status})`);
      }

      // Step 3: Start Conversion Job on Adobe Engine
      setPdfProgressPercent(60);
      setPdfProgressStep('เริ่มประมวลผลด้วย Adobe PostScript Engine');
      setPdfProgressText('ส่งคำสั่งแปลงไฟล์เข้าสู่ระบบ Adobe Document Cloud...');
      setPdfEstimatedSeconds(5);

      const startRes = await fetch('/api/catalog/adobe-pdf?action=start-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetID,
          pageWidthInches: w,
          pageHeightInches: h,
        }),
      });

      if (!startRes.ok) {
        const errData = await startRes.json().catch(() => ({}));
        throw new Error(errData.error || 'ไม่สามารถเริ่มการแปลงไฟล์บน Adobe Cloud ได้');
      }

      const { pollingLocation } = await startRes.json();

      // Step 4: Poll status on Adobe Cloud
      let downloadUri = '';
      let attempts = 0;
      const maxAttempts = 60;

      while (!downloadUri && attempts < maxAttempts) {
        await new Promise((r) => setTimeout(r, 2000));
        attempts++;

        const simulatedPercent = Math.min(92, Math.round(65 + (attempts / 5) * 27));
        setPdfProgressPercent(simulatedPercent);
        setPdfProgressStep('Adobe PostScript Engine กำลังเรนเดอร์ภาพและจัดหน้า');
        setPdfProgressText(`ประมวลผลบน Adobe Cloud (${attempts * 2} วินาที)...`);
        setPdfEstimatedSeconds(Math.max(1, 6 - attempts));

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

      // Step 5: Download PDF directly from AWS S3
      setPdfProgressPercent(96);
      setPdfProgressStep('Adobe Cloud ประมวลผลเสร็จสิ้น กำลังดาวน์โหลดไฟล์');
      setPdfProgressText('กำลังดาวน์โหลดไฟล์ PDF คุณภาพสูงลงเครื่องของคุณ...');
      setPdfEstimatedSeconds(1);

      const pdfRes = await fetch(downloadUri);
      const blob = await pdfRes.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${exhibition.slug || 'catalog'}-Full-Adobe.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);

      // Increment monthly quota count
      incrementAdobeUsage(1);

      setPdfProgressPercent(100);
      setPdfProgressStep('เสร็จสมบูรณ์ 100%');
      setPdfProgressText('ดาวน์โหลดสูจิบัตร Adobe PDF เรียบร้อยแล้ว');
      setPdfEstimatedSeconds(0);

      setTimeout(() => {
        setIsGeneratingPdf(false);
        setPdfProgressText('');
        setPdfProgressPercent(0);
      }, 1000);
    } catch (err: any) {
      console.error('Adobe PDF generation error:', err);
      alert(`ไม่สามารถสร้าง Adobe PDF ได้: ${err.message || 'โปรดลองอีกครั้ง'}`);
      setIsGeneratingPdf(false);
      setPdfProgressText('');
      setPdfProgressPercent(0);
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
          onDownloadAdobePdfSinglePage={handleDownloadAdobePdfSinglePage}
        />
      )}



      {/* Main Visual Catalog Viewer (WYSIWYG 100% True-to-Print Vector) */}
      <main
        id="catalog-continuous-stream-container"
        style={{ maxWidth: customTemplate.pageWidthInches ? `${customTemplate.pageWidthInches}in` : '210mm' }}
        className={`w-full mx-auto py-8 sm:py-12 space-y-12 sm:space-y-16 ${activeViewMode === 'grid3' ? 'hidden print:block' : 'block'}`}
      >
        {/* Cover Page */}
        <PlateErrorBoundary pageNumber={1}>
          <CatalogCoverPage
            exhibition={exhibition}
            curator={curator}
            coverFooter={coverFooter}
            paperSize={paperSize}
            widthInches={customTemplate?.pageWidthInches || (paperSize === 'square8x8' ? 8.0 : 8.27)}
            heightInches={customTemplate?.pageHeightInches || (paperSize === 'square8x8' ? 8.0 : 11.69)}
            backgroundColor={customTemplate?.backgroundColor}
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
              paperSize={paperSize}
              widthInches={customTemplate?.pageWidthInches || (paperSize === 'square8x8' ? 8.0 : 8.27)}
              heightInches={customTemplate?.pageHeightInches || (paperSize === 'square8x8' ? 8.0 : 11.69)}
              backgroundColor={customTemplate?.backgroundColor}
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

      {/* 🚀 Adobe PostScript PDF Progress Modal */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full mx-4 shadow-2xl border border-[#DDD7CC] text-center space-y-5 relative overflow-hidden">
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
                  กำลังสร้าง Adobe PostScript PDF
                </h3>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  ประมวลผลความละเอียดสูงจาก Adobe Document Cloud
                </p>
              </div>
            </div>

            {/* Big Percentage & Progress Bar */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between px-1">
                <span className="text-xs font-semibold text-neutral-700 truncate pr-2">
                  {pdfProgressStep || 'กำลังประมวลผล...'}
                </span>
                <span className="text-2xl font-black font-mono text-[#ED2224] shrink-0">
                  {pdfProgressPercent}%
                </span>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden p-0.5 border border-neutral-200">
                <div
                  className="h-full bg-gradient-to-r from-[#ED2224] via-[#FF5E4D] to-[#ED2224] rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${Math.max(5, pdfProgressPercent)}%` }}
                />
              </div>

              {/* Estimated Time Remaining */}
              <div className="flex items-center justify-between text-[10.5px] text-neutral-500 px-1 font-mono">
                <span className="truncate pr-2">{pdfProgressText}</span>
                {pdfEstimatedSeconds > 0 && (
                  <span className="shrink-0 text-[#8C6D3F] font-semibold">เหลือ ~{pdfEstimatedSeconds} วิ</span>
                )}
              </div>
            </div>

            {/* Steps Checklist */}
            <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200/80 text-left space-y-1.5 text-xs">
              <div className={`flex items-center gap-2 ${pdfProgressPercent >= 20 ? 'text-emerald-700 font-semibold' : 'text-neutral-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${pdfProgressPercent >= 20 ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'}`}>
                  {pdfProgressPercent >= 20 ? '✓' : '1'}
                </div>
                <span className="truncate">รวบรวมเลย์เอาต์และรูปภาพผลงาน</span>
              </div>
              <div className={`flex items-center gap-2 ${pdfProgressPercent >= 40 ? 'text-emerald-700 font-semibold' : pdfProgressPercent >= 20 ? 'text-[#ED2224] font-semibold' : 'text-neutral-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${pdfProgressPercent >= 40 ? 'bg-emerald-100 text-emerald-700' : pdfProgressPercent >= 20 ? 'bg-red-100 text-[#ED2224]' : 'bg-neutral-200 text-neutral-500'}`}>
                  {pdfProgressPercent >= 40 ? '✓' : '2'}
                </div>
                <span className="truncate">อัปโหลดสู่ Adobe Cloud Engine</span>
              </div>
              <div className={`flex items-center gap-2 ${pdfProgressPercent >= 90 ? 'text-emerald-700 font-semibold' : pdfProgressPercent >= 40 ? 'text-[#ED2224] font-semibold' : 'text-neutral-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${pdfProgressPercent >= 90 ? 'bg-emerald-100 text-emerald-700' : pdfProgressPercent >= 40 ? 'bg-red-100 text-[#ED2224]' : 'bg-neutral-200 text-neutral-500'}`}>
                  {pdfProgressPercent >= 90 ? '✓' : '3'}
                </div>
                <span className="truncate">เรนเดอร์ PostScript คุณภาพสูง 100%</span>
              </div>
              <div className={`flex items-center gap-2 ${pdfProgressPercent >= 100 ? 'text-emerald-700 font-semibold' : pdfProgressPercent >= 90 ? 'text-[#ED2224] font-semibold' : 'text-neutral-400'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0 ${pdfProgressPercent >= 100 ? 'bg-emerald-100 text-emerald-700' : pdfProgressPercent >= 90 ? 'bg-red-100 text-[#ED2224]' : 'bg-neutral-200 text-neutral-500'}`}>
                  {pdfProgressPercent >= 100 ? '✓' : '4'}
                </div>
                <span className="truncate">ดาวน์โหลดไฟล์ PDF ลงเครื่อง</span>
              </div>
            </div>
          </div>
        </div>
      )}

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
