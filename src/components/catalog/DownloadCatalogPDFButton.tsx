'use client';

import React, { useState } from 'react';
import { Exhibition } from '@/types/exhibition';
import { Download, Printer, CheckCircle2 } from 'lucide-react';

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
  const [downloaded, setDownloaded] = useState(false);

  const handlePrintPDF = () => {
    setDownloaded(true);
    window.print();
    setTimeout(() => setDownloaded(false), 4000);
  };

  if (variant === 'navbar') {
    return (
      <button
        onClick={handlePrintPDF}
        className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-[#F2EFE9] hover:bg-[#E5DFD3] text-[#2C2925] border border-[#D0CABE] transition-all shadow-sm active:scale-95 ${className}`}
        title="พิมพ์ / บันทึกเป็น PDF ขนาด A4 (Margins 1.5 cm, พื้นหลังขาว)"
      >
        {downloaded ? (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        <span className="hidden xs:inline">PDF (A4)</span>
        <span className="xs:hidden">PDF</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handlePrintPDF}
        className={`flex items-center gap-2 px-5 py-2.5 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95 ${className}`}
        title="พิมพ์ หรือ บันทึกเป็นไฟล์ PDF ขนาด A4 มาตรฐาน (1.5 cm Margin, ขาวสะอาด)"
      >
        {downloaded ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        ) : (
          <Download className="w-4 h-4 text-[#C5A880]" />
        )}
        <span>
          {downloaded ? 'กำลังเปิดหน้าต่างพิมพ์ PDF...' : 'Download Official PDF (A4 Print-Ready)'}
        </span>
      </button>

      <button
        onClick={handlePrintPDF}
        className="hidden sm:flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-[#FAF8F5] text-[#4A453C] border border-[#D5CEC0] rounded-full text-xs font-semibold tracking-wider shadow-sm transition-all active:scale-95"
        title="พิมพ์ / บันทึกเป็น PDF ผ่านเบราว์เซอร์"
      >
        <Printer className="w-4 h-4 text-[#8C6D3F]" />
        <span>พิมพ์ A4</span>
      </button>
    </div>
  );
}
