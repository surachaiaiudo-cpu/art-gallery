'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Artwork } from '@/types/exhibition';
import { X, Send, CheckCircle2, AlertCircle, Sparkles, MessageSquare, ShieldCheck, Calendar, DollarSign } from 'lucide-react';
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
  const [visitorPhone, setVisitorPhone] = useState('');
  const [inquiryType, setInquiryType] = useState<'acquisition' | 'provenance' | 'private-view'>('acquisition');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen || !artwork) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const fullMessage = `[Inquiry Type: ${inquiryType.toUpperCase()}] Phone: ${visitorPhone || 'N/A'}\n${message}`;

      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artworkId: artwork.id,
          visitorName,
          visitorEmail,
          message: fullMessage,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-[#181614] border border-[#C5A880]/40 rounded-3xl shadow-floating overflow-hidden p-6 sm:p-8 text-[#FAF8F5]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {submitSuccess ? (
          <div className="py-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#C5A880]/20 border border-[#C5A880] flex items-center justify-center text-[#D4AF37]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white">
              {lang === 'th' ? 'ส่งคำขอข้อมูลเรียบร้อยแล้ว' : 'Inquiry Submitted Successfully'}
            </h3>
            <p className="text-xs text-neutral-300 max-w-sm leading-relaxed">
              {lang === 'th'
                ? 'ภัณฑารักษ์หอศิลป์เพาะช่างจะติดต่อกลับท่านทางอีเมลหรือหมายเลขโทรศัพท์โดยเร็วที่สุด'
                : 'The Poh-Chang Curatorial Office will contact you via email or phone shortly.'}
            </p>
          </div>
        ) : (
          <div>
            {/* Header with Artwork Snapshot */}
            <div className="border-b border-white/10 pb-5 mb-6 flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#C5A880]/40 bg-black/50 shrink-0">
                <Image
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#C5A880]/15 border border-[#C5A880]/30 text-[9px] font-bold text-[#EAD8C0] uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3 h-3 text-[#C5A880]" />
                  <span>VIP Curatorial Concierge</span>
                </div>
                <h2 className="font-serif text-lg sm:text-xl font-bold text-white truncate">{artwork.title}</h2>
                <p className="text-xs text-[#C5A880] truncate">
                  {artwork.artist?.name} ({artwork.artist?.country || 'Thailand'})
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Quick Intent Pills */}
            <div className="mb-5 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                {lang === 'th' ? 'วัตถุประสงค์ในการติดต่อ:' : 'Inquiry Purpose:'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setInquiryType('acquisition')}
                  className={`p-2 rounded-xl text-[11px] font-semibold border transition-all ${
                    inquiryType === 'acquisition'
                      ? 'bg-[#C5A880] text-[#121110] border-[#C5A880] shadow-md font-bold'
                      : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  💎 {lang === 'th' ? 'ขอเสนอราคา' : 'Acquisition'}
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryType('provenance')}
                  className={`p-2 rounded-xl text-[11px] font-semibold border transition-all ${
                    inquiryType === 'provenance'
                      ? 'bg-[#C5A880] text-[#121110] border-[#C5A880] shadow-md font-bold'
                      : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  📜 {lang === 'th' ? 'ประวัติผลงาน' : 'Provenance'}
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryType('private-view')}
                  className={`p-2 rounded-xl text-[11px] font-semibold border transition-all ${
                    inquiryType === 'private-view'
                      ? 'bg-[#C5A880] text-[#121110] border-[#C5A880] shadow-md font-bold'
                      : 'bg-white/5 border-white/10 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  📅 {lang === 'th' ? 'นัดชมผลงานจริง' : 'Private View'}
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    {lang === 'th' ? 'ชื่อ-นามสกุล' : 'Full Name'} <span className="text-[#C5A880]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder={lang === 'th' ? 'เช่น กานดา พิทักษ์ศิลป์' : 'e.g. John Doe'}
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>

                <div>
                  <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                    {lang === 'th' ? 'เบอร์โทรศัพท์ติดต่อ' : 'Phone Number'}
                  </label>
                  <input
                    type="tel"
                    value={visitorPhone}
                    onChange={(e) => setVisitorPhone(e.target.value)}
                    placeholder="081-xxx-xxxx"
                    className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A880]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  {lang === 'th' ? 'อีเมล' : 'Email'} <span className="text-[#C5A880]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div>
                <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                  {lang === 'th' ? 'ข้อความถึงภัณฑารักษ์' : 'Curatorial Message'}
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={lang === 'th' ? 'ระบุรายละเอียดคำถามหรือข้อมูลที่ต้องการทราบ...' : 'Additional questions or details...'}
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A880]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  {t.inquiryModal.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#C5A880] hover:bg-[#B39366] text-[#121110] rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg transition-all disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? (
                    t.inquiryModal.submitting
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{lang === 'th' ? 'ส่งคำขอข้อมูล' : 'Submit Concierge Request'}</span>
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
