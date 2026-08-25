'use client';

import React, { useEffect } from 'react';
import { Exhibition, PeerReviewer, User } from '@/types/exhibition';
import { ArrowLeft, ChevronLeft, ChevronRight, Printer, X } from 'lucide-react';
import { CatalogCoverPage } from './CatalogCoverPage';
import { CatalogStatementPage } from './CatalogStatementPage';
import { CatalogPlate } from './CatalogPlate';
import { PlateErrorBoundary } from './PlateErrorBoundary';

interface CatalogReaderModalProps {
  exhibition: Exhibition;
  curator?: User | null;
  peerReviewersList: PeerReviewer[];
  coverFooter: string;
  plateFooter: string;
  footerGraphicType: 'wave_gold' | 'wave_mono' | 'line_gold' | 'custom_image' | 'none';
  customFooterImageUrl?: string;
  selectedPageModalIndex: number;
  onClose: () => void;
  onSelectPageIndex: (index: number) => void;
  onPrintSinglePage: (index: number) => void;
}

export function CatalogReaderModal({
  exhibition,
  curator,
  peerReviewersList,
  coverFooter,
  plateFooter,
  footerGraphicType,
  customFooterImageUrl,
  selectedPageModalIndex,
  onClose,
  onSelectPageIndex,
  onPrintSinglePage,
}: CatalogReaderModalProps) {
  const artworks = exhibition.artworks || [];
  const hasReviewers = peerReviewersList.length > 0;
  const totalPages = 1 + (hasReviewers ? 1 : 0) + artworks.length;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        if (selectedPageModalIndex > 0) {
          onSelectPageIndex(selectedPageModalIndex - 1);
        }
      } else if (e.key === 'ArrowRight') {
        if (selectedPageModalIndex < totalPages - 1) {
          onSelectPageIndex(selectedPageModalIndex + 1);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        onPrintSinglePage(selectedPageModalIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPageModalIndex, totalPages, onClose, onSelectPageIndex, onPrintSinglePage]);

  return (
    <div className="no-print fixed inset-0 z-50 flex flex-col bg-black/90 backdrop-blur-md overflow-hidden animate-fade-in text-white">
      {/* Top Reader Navigation Bar */}
      <div className="shrink-0 bg-[#1A1918]/90 border-b border-[#333] px-4 py-3 flex items-center justify-between gap-4 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            title="ปิดหน้าอ่าน / กลับสู่ตาราง (ESC)"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่ตารางสูจิบัตร</span>
          </button>

          <span className="hidden sm:inline text-white/30">•</span>

          <span className="text-xs font-mono font-bold px-2.5 py-1 bg-[#8C6D3F]/30 text-[#E5D2B8] rounded border border-[#8C6D3F]/40">
            หน้า {selectedPageModalIndex + 1} / {totalPages}
          </span>
        </div>

        {/* Center: Previous / Next Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectPageIndex(selectedPageModalIndex - 1)}
            disabled={selectedPageModalIndex === 0}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="หน้าก่อนหน้า (Arrow Left ←)"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">หน้าก่อนหน้า</span>
          </button>

          <button
            onClick={() => onSelectPageIndex(selectedPageModalIndex + 1)}
            disabled={selectedPageModalIndex >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:pointer-events-none rounded-lg text-xs font-bold transition-all cursor-pointer"
            title="หน้าถัดไป (Arrow Right →)"
          >
            <span className="hidden sm:inline">หน้าถัดไป</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Print Single Page Button & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPrintSinglePage(selectedPageModalIndex)}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 bg-[#8C6D3F] hover:bg-[#735831] text-white rounded-lg text-xs font-bold shadow-md transition-all active:scale-95 ring-1 ring-white/20 cursor-pointer"
            title={`พิมพ์เฉพาะหน้านี้ (หน้า ${selectedPageModalIndex + 1}) ออกเป็น PDF Vector (Ctrl+P)`}
          >
            <Printer className="w-4 h-4 text-[#FFFDF9]" />
            <span>🖨️ พิมพ์หน้านี้ (หน้า {selectedPageModalIndex + 1})</span>
          </button>

          <button
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="ปิดหน้าอ่าน (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Modal Main Scrollable Viewer Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex items-center justify-center relative">
        {/* Side Floating Nav Arrow Buttons (Desktop) */}
        {selectedPageModalIndex > 0 && (
          <button
            onClick={() => onSelectPageIndex(selectedPageModalIndex - 1)}
            className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/90 text-white rounded-full items-center justify-center border border-white/20 shadow-2xl transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
            title="หน้าก่อนหน้า (←)"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {selectedPageModalIndex < totalPages - 1 && (
          <button
            onClick={() => onSelectPageIndex(selectedPageModalIndex + 1)}
            className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/60 hover:bg-black/90 text-white rounded-full items-center justify-center border border-white/20 shadow-2xl transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
            title="หน้าถัดไป (→)"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}

        {/* Active Large A4 Page Layout Container */}
        <div className="w-full max-w-[210mm] shadow-2xl rounded-sm my-auto text-[#1E1D1B]">
          <PlateErrorBoundary pageNumber={selectedPageModalIndex + 1}>
            {selectedPageModalIndex === 0 ? (
              <CatalogCoverPage
                exhibition={exhibition}
                curator={curator}
                coverFooter={coverFooter}
                isReaderModal
              />
            ) : hasReviewers && selectedPageModalIndex === 1 ? (
              <CatalogStatementPage
                exhibition={exhibition}
                curator={curator}
                peerReviewersList={peerReviewersList}
                plateFooter={plateFooter}
              />
            ) : (
              (() => {
                const artIdx = hasReviewers ? selectedPageModalIndex - 2 : selectedPageModalIndex - 1;
                const art = artworks[artIdx];
                if (!art) return null;

                return (
                  <CatalogPlate
                    artwork={art}
                    pageNumber={selectedPageModalIndex + 1}
                    plateFooter={plateFooter}
                    footerGraphicType={footerGraphicType}
                    customFooterImageUrl={customFooterImageUrl}
                    isReaderModal
                  />
                );
              })()
            )}
          </PlateErrorBoundary>
        </div>
      </div>
    </div>
  );
}
