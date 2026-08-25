'use client';

import { useCallback } from 'react';
import { Exhibition } from '@/types/exhibition';

async function waitForAllImagesToLoad(): Promise<void> {
  if (typeof document === 'undefined') return;

  const images = Array.from(document.querySelectorAll<HTMLImageElement>('main .catalog-a4-page img'));
  if (images.length === 0) return;

  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) {
        return Promise.resolve();
      }
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
}

export function usePrintEngine(exhibition: Exhibition) {
  // Print Single Page (WYSIWYG Vector PDF Export for currently viewed page)
  const handlePrintSinglePage = useCallback(async (pageIndex: number) => {
    if (typeof document === 'undefined') return;

    const originalTitle = document.title;
    const cleanSlug = exhibition.slug || 'catalog';
    const pageNum = pageIndex + 1;
    document.title = `${cleanSlug}-Page-${pageNum}-Official-A4-Vector`;

    // Mark single page for print
    const pages = document.querySelectorAll<HTMLElement>('main .catalog-a4-page');
    pages.forEach((page, idx) => {
      if (idx === pageIndex) {
        page.classList.add('print-this-page-only');
      } else {
        page.classList.add('print-hide-this-page');
      }
    });

    // Ensure images on that page are decoded before opening print dialog
    await waitForAllImagesToLoad();

    const cleanup = () => {
      document.title = originalTitle;
      pages.forEach((page) => {
        page.classList.remove('print-this-page-only', 'print-hide-this-page');
      });
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();

    // Fallback timeout in case onafterprint does not fire
    setTimeout(cleanup, 3000);
  }, [exhibition.slug]);

  // 100% WYSIWYG Pure Vector PDF Export (Direct Browser Engine)
  const handleSaveVectorPDF100Percent = useCallback(async () => {
    if (typeof document === 'undefined') return;

    const originalTitle = document.title;
    const cleanSlug = exhibition.slug || 'catalog';
    document.title = `${cleanSlug}-Official-A4-Vector-Catalog`;

    // Ensure all images are fully loaded before opening print dialog
    await waitForAllImagesToLoad();

    const cleanup = () => {
      document.title = originalTitle;
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();

    setTimeout(cleanup, 3000);
  }, [exhibition.slug]);

  return {
    handlePrintSinglePage,
    handleSaveVectorPDF100Percent,
  };
}
