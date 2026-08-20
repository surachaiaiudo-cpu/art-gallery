'use client';

import React from 'react';
import { Inquiry } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { Inbox, Mail, Clock } from 'lucide-react';

interface AdminInquiriesClientProps {
  inquiries: Inquiry[];
}

export function AdminInquiriesClient({ inquiries }: AdminInquiriesClientProps) {
  const { lang, t } = useLanguage();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD5C8] pb-6">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
            {t.admin.title}
          </span>
          <h1 className="font-serif text-3xl font-bold text-[#1A1918] mt-1">
            {t.admin.inquiries}
          </h1>
          <p className="text-xs text-[#6E685C] mt-1">
            {lang === 'th'
              ? 'ติดตามและตอบกลับข้อความสอบถามข้อมูลผลงานศิลปกรรมจากผู้ชมและผู้เข้าชมนิทรรศการ'
              : 'Track and respond to inquiries submitted by exhibition visitors and collectors.'}
          </p>
        </div>
      </div>

      {/* Inquiries Cards */}
      <div className="space-y-4">
        {inquiries.length === 0 ? (
          <div className="p-12 text-center text-[#8C8477] bg-white rounded-xl border border-[#E0D9CD]">
            {t.admin.noInquiries}
          </div>
        ) : (
          inquiries.map((inq) => (
            <div
              key={inq.id}
              className="bg-white rounded-xl border border-[#E0D9CD] shadow-sm p-6 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#F0ECE4] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#FAF8F5] border border-[#E0D9CD] text-[#1A1918] flex items-center justify-center font-bold font-serif text-sm">
                    {inq.visitorName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-[#1A1918]">
                      {inq.visitorName}
                    </h3>
                    <a
                      href={`mailto:${inq.visitorEmail}`}
                      className="text-xs text-[#8C6D3F] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3 h-3" />
                      <span>{inq.visitorEmail}</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-[#8C8477] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{inq.createdAt || 'Recent'}</span>
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                    {inq.status}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#8C6D3F] block mb-1">
                  {t.admin.targetArtwork}: <span className="text-[#1A1918]">{inq.artworkTitle}</span>
                </span>
                <p className="text-xs text-[#4A453C] leading-relaxed bg-[#FAF8F5] p-3.5 rounded-lg border border-[#EDE8DF]">
                  "{inq.message}"
                </p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <a
                  href={`mailto:${inq.visitorEmail}?subject=ARTVARA Curatorial Response: ${encodeURIComponent(inq.artworkTitle || '')}`}
                  className="px-4 py-2 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all"
                >
                  {t.admin.replyEmail}
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
