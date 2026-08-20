'use client';

import React, { useState } from 'react';
import { Artwork } from '@/types/exhibition';
import { X, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

interface ArtworkInquiryModalProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ArtworkInquiryModal({
  artwork,
  isOpen,
  onClose,
}: ArtworkInquiryModalProps) {
  const { lang, t } = useLanguage();
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [message, setMessage] = useState(
    artwork
      ? lang === 'th'
        ? `เรียนภัณฑารักษ์ ข้าพเจ้าต้องการสอบถามข้อมูลเพิ่มเติมเกี่ยวกับผลงาน "${artwork.title}" (${artwork.medium}, ${artwork.dimensions}) ของศิลปิน ${artwork.artist?.name || ''}`
        : `Dear Curator, I would like to inquire about "${artwork.title}" (${artwork.medium}, ${artwork.dimensions}) by ${artwork.artist?.name || ''}`
      : ''
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !artwork) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkId: artwork.id,
          visitorName,
          visitorEmail,
          message,
        }),
      });

      if (!res.ok) {
        throw new Error(lang === 'th' ? 'เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง' : 'Failed to submit inquiry. Please try again.');
      }

      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 2500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#DDD7CC] rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8 text-[#1E1D1B]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitSuccess ? (
          <div className="py-10 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-14 h-14 text-emerald-700 mb-3" />
            <h3 className="font-serif text-2xl font-bold text-[#1E1D1B] mb-2">{t.inquiryModal.successTitle}</h3>
            <p className="text-sm text-[#666155] max-w-xs">
              {t.inquiryModal.successDesc}
            </p>
          </div>
        ) : (
          <div>
            <div className="border-b border-[#E3DED4] pb-4 mb-6">
              <span className="text-xs uppercase tracking-widest text-[#8C7659] font-bold">
                {t.inquiryModal.title}
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1F1D1A] mt-1">{artwork.title}</h2>
              <p className="text-xs text-[#6B655B] mt-1">
                {t.specs.artist}: <span className="font-semibold text-[#2E2A24]">{artwork.artist?.name || 'Featured Artist'}</span> ({artwork.artist?.country})
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {t.inquiryModal.fullName} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  placeholder={lang === 'th' ? 'เช่น กานดา พิทักษ์ศิลป์' : 'e.g. Eleanor Vance'}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CFC3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]/50 focus:border-[#8C6D3F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {t.inquiryModal.email} <span className="text-rose-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="e.g. eleanor@example.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CFC3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]/50 focus:border-[#8C6D3F]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                  {t.inquiryModal.message}
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5CFC3] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]/50 focus:border-[#8C6D3F]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#6B655B] hover:text-[#1F1D1A]"
                >
                  {t.inquiryModal.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1F1D1A] hover:bg-[#38342E] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    t.inquiryModal.submitting
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{t.inquiryModal.submit}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
