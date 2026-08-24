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
    if (pathname === targetPath || pathname?.startsWith('/catalog/')) {
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
    } else {
      router.push(`${targetPath}`);
    }
  };

  if (variant === 'navbar') {
    return (
      <div className="relative group">
        <button
          onClick={handleNavigateToCatalog}
          className={`p-2 rounded-full text-[#575249] hover:text-[#1A1918] hover:bg-[#EBE8E0] transition-colors flex items-center justify-center ${className}`}
          aria-label="ดาวน์โหลดสูจิบัตร PDF"
        >
          <Download className="w-4 h-4 text-[#8C6D3F]" />
        </button>
        <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
          ดาวน์โหลดสูจิบัตร (PDF)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleNavigateToCatalog}
        className={`flex items-center gap-2 px-5 py-2.5 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-full text-xs font-semibold uppercase tracking-wider shadow transition-all active:scale-95 ${className}`}
        title="ดาวน์โหลดสูจิบัตรขนาด A4 เต็มหน้า (Standard / PDF/X-1a:2001)"
      >
        <Download className="w-4 h-4 text-[#C5A880]" />
        <span>ดาวน์โหลดสูจิบัตร PDF (Standard / PDF/X)</span>
      </button>
    </div>
  );
}
