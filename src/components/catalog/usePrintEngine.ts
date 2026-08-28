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

    // Get all top-level page containers inside main (Cover, Statement, and Plates)
    const mainElement = document.querySelector('main');
    const directChildren = mainElement ? (Array.from(mainElement.children) as HTMLElement[]) : [];

    // Also query all individual page elements
    const pageElements = document.querySelectorAll<HTMLElement>(
      'main .catalog-a4-page, main .catalog-square8-page, main .catalog-dynamic-page, main [data-plate-id]'
    );

    // Tag direct children of main
    directChildren.forEach((child, idx) => {
      if (idx === pageIndex) {
        child.classList.add('print-this-page-only');
        child.classList.remove('print-hide-this-page');
      } else {
        child.classList.add('print-hide-this-page');
        child.classList.remove('print-this-page-only');
      }
    });

    // Tag individual page cards
    pageElements.forEach((page, idx) => {
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
      directChildren.forEach((child) => {
        child.classList.remove('print-this-page-only', 'print-hide-this-page');
      });
      pageElements.forEach((page) => {
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
