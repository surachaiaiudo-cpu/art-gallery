'use client';

import React, { useState } from 'react';
import { Exhibition } from '@/types/exhibition';
import { Download, Printer, Loader2, CheckCircle2 } from 'lucide-react';

interface DownloadCatalogPDFButtonProps {
  exhibition: Exhibition;
  className?: string;
  variant?: 'primary' | 'secondary' | 'navbar';
}

export function DownloadCatalogPDFButton({
  exhibition,
  className = '',
  variant = 'primary',
}: DownloadCatalogPDFButtonProps) {
  const [loading, setLoading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);

      // Lazy import @react-pdf/renderer and template on-demand in browser only
      const [reactPdf, pdfTemplate] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./ExhibitionCatalogPDF'),
      ]);

      const DocumentComponent = pdfTemplate.ExhibitionCatalogPDF;
      const blob = await reactPdf.pdf(<DocumentComponent exhibition={exhibition} />).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exhibition.slug || 'exhibition'}-catalog-A4.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 4000);
    } catch (err) {
      console.error('Error generating PDF client-side:', err);
      // Seamless browser print fallback
      window.print();
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (variant === 'navbar') {
    return (
      <button
        onClick={handleDownloadPDF}
        disabled={loading}
        className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-[#F2EFE9] hover:bg-[#E5DFD3] text-[#2C2925] border border-[#D0CABE] transition-all shadow-sm active:scale-95 disabled:opacity-60 ${className}`}
        title="Download A4 PDF Catalog (1.5 cm Margins, White Background)"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : downloaded ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span className="hidden xs:inline">{loading ? 'Generating...' : 'PDF (A4)'}</span>
        <span className="xs:hidden">PDF</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleDownloadPDF}
        disabled={loading}
        className={`flex items-center gap-2 px-5 py-2.5 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95 disabled:opacity-60 ${className}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-[#C5A880]" />
        ) : downloaded ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Download className="w-4 h-4 text-[#C5A880]" />
        )}
        <span>
          {loading
            ? 'กำลังสร้างไฟล์ PDF A4...'
            : downloaded
            ? 'ดาวน์โหลดสำเร็จแล้ว!'
            : 'Download Official PDF (A4 Print-Ready)'}
        </span>
      </button>

      <button
        onClick={handlePrint}
        className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#4A453C] border border-[#D5CEC0] rounded-full text-xs font-semibold tracking-wider shadow-sm transition-all active:scale-95"
        title="พิมพ์ / บันทึกเป็น PDF ผ่านเบราว์เซอร์"
      >
        <Printer className="w-4 h-4 text-[#8C6D3F]" />
        <span>พิมพ์ A4</span>
      </button>
    </div>
  );
}
