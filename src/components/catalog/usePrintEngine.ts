'use client';

import { useCallback } from 'react';
import { Exhibition } from '@/types/exhibition';
import {
  getExhibitionCatalogTemplate,
  getArtworkCatalogTemplate,
  CatalogTemplateConfig,
} from '@/types/catalogTemplate';

export function usePrintEngine(exhibition: Exhibition) {
  // Helper to inject exact @page size into <head>
  const injectDynamicPageSize = (widthInches: number, heightInches: number) => {
    if (typeof document === 'undefined') return;
    let styleEl = document.getElementById('dynamic-catalog-print-size') as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'dynamic-catalog-print-size';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = `
      @media print {
        @page {
          size: ${widthInches}in ${heightInches}in !important;
          margin: 0mm !important;
        }
      }
    `;
  };

  const removeDynamicPageSize = () => {
    if (typeof document === 'undefined') return;
    const styleEl = document.getElementById('dynamic-catalog-print-size');
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
  };

  // Print Single Page (WYSIWYG Vector PDF Export for currently viewed page)
  const handlePrintSinglePage = useCallback((pageIndex: number, customTemplate?: CatalogTemplateConfig | null) => {
    if (typeof document === 'undefined') return;

    const tpl =
      customTemplate && typeof customTemplate === 'object' && 'pageWidthInches' in customTemplate
        ? customTemplate
        : getExhibitionCatalogTemplate(exhibition);
    const widthInches = tpl.pageWidthInches || 8.0;
    const heightInches = tpl.pageHeightInches || 8.0;

    // Inject exact page size (e.g. 8in 8in)
    injectDynamicPageSize(widthInches, heightInches);

    const originalTitle = document.title;
    const cleanSlug = exhibition.slug || 'catalog';
    const pageNum = pageIndex + 1;
    document.title = `${cleanSlug}-Page-${pageNum}-${widthInches}x${heightInches}-Vector`;

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
      removeDynamicPageSize();
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
  }, [exhibition]);

  // 100% WYSIWYG Pure Vector PDF Export (Direct Browser Engine with Exact Dimensions)
  const handleSaveVectorPDF100Percent = useCallback((customTemplateOrEvent?: CatalogTemplateConfig | React.MouseEvent | unknown) => {
    if (typeof document === 'undefined') return;

    const tpl =
      customTemplateOrEvent && typeof customTemplateOrEvent === 'object' && 'pageWidthInches' in (customTemplateOrEvent as any)
        ? (customTemplateOrEvent as CatalogTemplateConfig)
        : getExhibitionCatalogTemplate(exhibition);
    const widthInches = tpl.pageWidthInches || 8.0;
    const heightInches = tpl.pageHeightInches || 8.0;

    // Inject exact page size (e.g. 8in 8in)
    injectDynamicPageSize(widthInches, heightInches);

    const originalTitle = document.title;
    const cleanSlug = exhibition.slug || 'catalog';
    document.title = `${cleanSlug}-Official-${widthInches}x${heightInches}-Vector-Catalog`;

    const cleanup = () => {
      document.title = originalTitle;
      removeDynamicPageSize();
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);
    window.print();

    setTimeout(cleanup, 2500);
  }, [exhibition]);

  return {
    handlePrintSinglePage,
    handleSaveVectorPDF100Percent,
  };
}
