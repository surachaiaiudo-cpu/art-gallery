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

  const handleNavigateToCatalog = () => {
    const targetPath = `/catalog/${exhibition.slug}`;
    if (pathname === targetPath) {
      window.print();
    } else {
      router.push(`${targetPath}?export=pdf`);
    }
  };

  if (variant === 'navbar') {
    return (
      <button
        onClick={handleNavigateToCatalog}
        className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-medium tracking-wider uppercase bg-[#F2EFE9] hover:bg-[#E5DFD3] text-[#2C2925] border border-[#D0CABE] transition-all shadow-sm active:scale-95 ${className}`}
        title="สูจิบัตร A4 (Vector PDF)"
      >
        <Printer className="w-3.5 h-3.5 text-[#8C6D3F]" />
        <span className="hidden xs:inline">สูจิบัตร PDF (Vector)</span>
        <span className="xs:hidden">PDF</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleNavigateToCatalog}
        className={`flex items-center gap-2 px-5 py-2.5 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95 ${className}`}
        title="ดาวน์โหลด / บันทึกสูจิบัตรขนาด A4 เต็มหน้า (Vector PDF)"
      >
        <Printer className="w-4 h-4 text-[#C5A880]" />
        <span>บันทึกสูจิบัตร PDF (Vector คมชัด 100%)</span>
      </button>
    </div>
  );
}
