'use client';

import { useState, useCallback } from 'react';
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
  const [isPrinting, setIsPrinting] = useState(false);

  // Print Single Page (WYSIWYG Vector PDF Export for currently viewed page)
  const handlePrintSinglePage = useCallback(async (pageIndex: number) => {
    if (typeof document === 'undefined') return;

    const originalTitle = document.title;
    const cleanSlug = exhibition.slug || 'catalog';
    const pageNum = pageIndex + 1;
    document.title = `${cleanSlug}-Page-${pageNum}-Official-A4-Vector`;

    // 1. Activate print DOM state
    setIsPrinting(true);
    document.body.classList.add('print-single-mode');

    // Allow React to mount print DOM
    await new Promise((r) => setTimeout(r, 100));

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

    // Ensure images on that page are decoded before opening print dialog
    await waitForAllImagesToLoad();

    const cleanup = () => {
      document.title = originalTitle;
      document.body.classList.remove('print-single-mode');
      pages.forEach((page) => {
        page.classList.remove('print-this-page-only', 'print-hide-this-page');
      });
      setIsPrinting(false);
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();

    // Fallback timeout in case onafterprint does not fire
    setTimeout(cleanup, 4000);
  }, [exhibition.slug]);

  // 100% WYSIWYG Pure Vector PDF Export (Direct Browser Engine)
  const handleSaveVectorPDF100Percent = useCallback(async () => {
    if (typeof document === 'undefined') return;

    const originalTitle = document.title;
    const cleanSlug = exhibition.slug || 'catalog';
    document.title = `${cleanSlug}-Official-A4-Vector-Catalog`;

    // 1. Activate print DOM state
    setIsPrinting(true);

    // Allow React to mount print DOM
    await new Promise((r) => setTimeout(r, 100));

    // Ensure all images are fully loaded before opening print dialog
    await waitForAllImagesToLoad();

    const cleanup = () => {
      document.title = originalTitle;
      setIsPrinting(false);
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();

    setTimeout(cleanup, 4000);
  }, [exhibition.slug]);

  return {
    isPrinting,
    handlePrintSinglePage,
    handleSaveVectorPDF100Percent,
  };
}
