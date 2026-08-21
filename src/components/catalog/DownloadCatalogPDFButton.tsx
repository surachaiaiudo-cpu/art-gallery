'use client';

import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Exhibition } from '@/types/exhibition';
import { Download, Printer, CheckCircle2, ChevronDown, Sparkles, FileText, Layers } from 'lucide-react';

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
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigateToCatalog = (standard: 'standard' | 'pdfx1a' = 'standard') => {
    const targetPath = `/catalog/${exhibition.slug}`;
    if (pathname === targetPath) {
      // If already on page, scroll to top or trigger modal
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      router.push(`${targetPath}?export=${standard}`);
    }
  };

  if (variant === 'navbar') {
    return (
      <button
        onClick={() => handleNavigateToCatalog('standard')}
        className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-[#F2EFE9] hover:bg-[#E5DFD3] text-[#2C2925] border border-[#D0CABE] transition-all shadow-sm active:scale-95 ${className}`}
        title="ดาวน์โหลดสูจิบัตรขนาด A4 (Standard / PDF/X-1a:2001)"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden xs:inline">PDF (A4 เต็มหน้า)</span>
        <span className="xs:hidden">PDF</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleNavigateToCatalog('standard')}
        className={`flex items-center gap-2 px-5 py-2.5 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95 ${className}`}
        title="ดาวน์โหลดสูจิบัตรขนาด A4 เต็มหน้า (Standard / PDF/X-1a:2001)"
      >
        <Download className="w-4 h-4 text-[#C5A880]" />
        <span>Download PDF Catalog (Standard / PDF/X-1a)</span>
      </button>
    </div>
  );
}
