'use client';

import { useCallback } from 'react';
import { Exhibition } from '@/types/exhibition';

export function usePrintEngine(exhibition: Exhibition) {
  // Print Single Page (WYSIWYG Vector PDF Export for currently viewed page)
  const handlePrintSinglePage = useCallback((pageIndex: number) => {
    if (typeof document === 'undefined') return;

    const originalTitle = document.title;
    const cleanSlug = exhibition.slug || 'catalog';
    const pageNum = pageIndex + 1;
    document.title = `${cleanSlug}-Page-${pageNum}-Official-A4-Vector`;

    // Mark single page for print
    document.body.classList.add('print-single-mode');
    const pages = document.querySelectorAll<HTMLElement>('main .catalog-a4-page');
    pages.forEach((page, idx) => {
      if (idx === pageIndex) {
        page.classList.add('print-this-page-only');
        page.classList.remove('print-hide-this-page');
      } else {
        page.classList.add('print-hide-this-page');
        page.classList.remove('print-this-page-only');
      }
    });

    const cleanup = () => {
      document.title = originalTitle;
      document.body.classList.remove('print-single-mode');
      pages.forEach((page) => {
        page.classList.remove('print-this-page-only', 'print-hide-this-page');
      });
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();

    // Fallback timeout in case onafterprint does not fire
    setTimeout(cleanup, 2500);
  }, [exhibition.slug]);

  // 100% WYSIWYG Pure Vector PDF Export (Direct Browser Engine)
  const handleSaveVectorPDF100Percent = useCallback(() => {
    if (typeof document === 'undefined') return;

    const originalTitle = document.title;
    const cleanSlug = exhibition.slug || 'catalog';
    document.title = `${cleanSlug}-Official-A4-Vector-Catalog`;

    const cleanup = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();

    setTimeout(cleanup, 2500);
  }, [exhibition.slug]);

  return {
    handlePrintSinglePage,
    handleSaveVectorPDF100Percent,
  };
}
