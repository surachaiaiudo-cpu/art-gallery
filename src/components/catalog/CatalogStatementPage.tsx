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
}

export function CatalogStatementPage({
  exhibition,
  curator,
  peerReviewersList,
  plateFooter,
}: CatalogStatementPageProps) {
  return (
    <section className="catalog-a4-page w-[210mm] h-[297mm] min-h-[297mm] max-h-[297mm] p-[15mm] bg-white border border-[#E0E0E0] shadow-2xl mx-auto rounded-sm flex flex-col justify-between overflow-hidden relative box-border text-[#1E1D1B]">
      <div className="space-y-4">
        {/* Header */}
        <div className="border-b border-[#E0E0E0] pb-2 flex items-center justify-between">
          <span className="catalog-heading-th font-serif text-lg font-bold tracking-[0.15em] text-[#000000]">
            ARTVARA
          </span>
          <span className="catalog-body-th text-[9px] uppercase tracking-widest text-[#666666]">
            Academic Accreditation &amp; Curatorial Statement
          </span>
        </div>

        {/* Peer Reviewers Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-[#E8E8E8] pb-1">
            <span className="catalog-heading-th text-xs font-bold uppercase tracking-[0.15em] text-[#000000]">
              คณะกรรมการผู้ทรงคุณวุฒิประเมินผลงาน (Peer Review Committee)
            </span>
            <span className="catalog-body-th text-[10px] text-[#666666]">
              {peerReviewersList.length} ท่าน
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1">
            {peerReviewersList.map((reviewer, idx) => {
              const avatarUrl = getOptimizedImageUrl(reviewer.avatarUrl, {
                width: 160,
                quality: 80,
              });

              return (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2 rounded-lg bg-[#FAFAFA] border border-[#EEEEEE]"
                >
                  {avatarUrl ? (
                    <div className="relative w-11 h-14 rounded overflow-hidden bg-[#E0E0E0] shrink-0 border border-[#DDDDDD] shadow-sm">
                      <img
                        src={avatarUrl}
                        alt={reviewer.name}
                        crossOrigin="anonymous"
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-11 h-14 bg-[#EEEEEE] border border-[#DDDDDD] rounded flex flex-col items-center justify-center shrink-0 shadow-sm">
                      <span className="catalog-heading-th text-sm font-bold text-[#888888]">
                        {reviewer.name?.trim().charAt(0) || 'P'}
                      </span>
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <div className="relative w-4 h-2.5 rounded-[1px] overflow-hidden border border-[#D0D0D0] shrink-0 bg-[#F5F5F5]">
                        <img
                          src={getFlagImageUrl(reviewer.country)}
                          alt={reviewer.country || 'Flag'}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="catalog-heading-th text-[10px] font-bold text-[#8C6D3F] uppercase truncate">
                        {reviewer.role || 'กรรมการผู้ทรงคุณวุฒิ'}
                      </span>
                    </div>

                    <h4 className="catalog-heading-th text-xs font-bold text-[#000000] truncate">
                      {[reviewer.academicTitle, reviewer.name].filter(Boolean).join(' ')}
                    </h4>

                    {reviewer.currentPosition && (
                      <p className="catalog-body-th text-[9px] text-[#444444] line-clamp-1">
                        {reviewer.currentPosition}
                      </p>
                    )}

                    {reviewer.institution && (
                      <p className="catalog-body-th text-[9px] text-[#666666] line-clamp-1">
                        {reviewer.institution}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Curatorial Statement */}
        {exhibition.curatorNote && (
          <div className="space-y-2 pt-2 border-t border-[#E8E8E8]">
            <span className="catalog-heading-th text-xs font-bold uppercase tracking-[0.15em] text-[#000000] block">
              คำนำภัณฑารักษ์ (Curatorial Statement)
            </span>
            <p className="catalog-body-th text-[11px] text-[#333333] leading-relaxed italic whitespace-pre-line max-h-[75mm] overflow-hidden">
              &quot;{exhibition.curatorNote}&quot;
            </p>
            {curator?.name && (
              <p className="catalog-body-th text-[10px] font-bold text-[#000000] text-right pt-1">
                — {curator.name} (Curator)
              </p>
            )}
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-[#E5E5E5] flex items-center justify-between text-[10px] text-[#777777]">
        <span>{plateFooter || 'Editorial & Academic Accreditation Board'}</span>
        <span className="font-mono text-[#555555] font-semibold">2</span>
      </div>
    </section>
  );
}
