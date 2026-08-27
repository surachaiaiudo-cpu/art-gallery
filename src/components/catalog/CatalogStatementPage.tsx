'use client';

import React from 'react';
import { Exhibition, PeerReviewer, User } from '@/types/exhibition';
import { getFlagImageUrl } from '@/components/ui/CountryFlag';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface CatalogStatementPageProps {
  exhibition: Exhibition;
  curator?: User | null;
  peerReviewersList: PeerReviewer[];
  plateFooter: string;
  paperSize?: 'a4' | 'square8x8';
}

export function CatalogStatementPage({
  exhibition,
  curator,
  peerReviewersList,
  plateFooter,
  paperSize = 'a4',
}: CatalogStatementPageProps) {
  const isSquare = paperSize === 'square8x8';

  return (
    <section className={`${isSquare ? 'catalog-square8-page w-[203.2mm] h-[203.2mm] min-h-[203.2mm] max-h-[203.2mm] p-[6.35mm]' : 'catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm]'} bg-white border border-[#E0E0E0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border text-[#1E1D1B]`}>
      <div className="space-y-3">
        {/* Header */}
        <div className="border-b border-[#E0E0E0] pb-2 flex items-center justify-between">
          <span className="catalog-heading-th font-serif text-lg font-bold tracking-[0.15em] text-[#000000]">
            ARTVARA
          </span>
          <span className="catalog-body-th text-[8px] uppercase tracking-widest text-[#666666]">
            Academic Accreditation &amp; Curatorial Statement
          </span>
        </div>

        {/* Peer Reviewers Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-1">
            <span className="catalog-heading-th text-[11px] font-bold uppercase tracking-[0.15em] text-[#000000]">
              คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)
            </span>
            <span className="catalog-body-th text-[9px] text-[#666666]">
              {peerReviewersList.length} ท่าน
            </span>
          </div>

          <div className={`grid ${isSquare ? 'grid-cols-2 gap-2.5' : 'grid-cols-2 gap-x-4 gap-y-3'} pt-1`}>
            {peerReviewersList.map((reviewer, idx) => {
              const avatarUrl = getOptimizedImageUrl(reviewer.avatarUrl, {
                width: 160,
                quality: 80,
              });
              const flagUrl = getFlagImageUrl(reviewer.country);

              return (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE]"
                >
                  {avatarUrl ? (
                    <div className="relative w-10 h-12 rounded overflow-hidden bg-[#E0E0E0] shrink-0 border border-[#DDDDDD] shadow-xs">
                      <img
                        src={avatarUrl}
                        alt={reviewer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-12 bg-[#EEEEEE] border border-[#DDDDDD] rounded flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="catalog-heading-th text-xs font-bold text-[#888888]">
                        {reviewer.name?.trim().charAt(0) || 'P'}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1">
                      {flagUrl && (
                        <div className="relative w-3.5 h-2 rounded-[1px] overflow-hidden border border-[#D0D0D0] shrink-0 bg-[#F5F5F5]">
                          <img
                            src={flagUrl}
                            alt={reviewer.country || 'Flag'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <span className="catalog-heading-th text-[9px] font-bold text-[#8C6D3F] uppercase truncate">
                        {reviewer.role || 'กรรมการผู้ทรงคุณวุฒิ'}
                      </span>
                    </div>

                    <h4 className="catalog-heading-th text-[11px] font-bold text-[#000000] truncate">
                      {[reviewer.academicTitle, reviewer.name].filter(Boolean).join(' ')}
                    </h4>

                    {reviewer.currentPosition && (
                      <p className="catalog-body-th text-[8.5px] text-[#444444] line-clamp-1">
                        {reviewer.currentPosition}
                      </p>
                    )}

                    {reviewer.institution && (
                      <p className="catalog-body-th text-[8px] text-[#777777] line-clamp-1">
                        {reviewer.institution}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-[#E0E0E0] flex items-center justify-between text-[8px] text-[#666666]">
        <span className="catalog-body-th truncate max-w-[160mm]">{plateFooter}</span>
        <span className="font-mono text-[#444444] font-bold text-[9px]">2</span>
      </div>
    </section>
  );
}
