'use client';

import React, { useState, useEffect } from 'react';
import {
  MessageSquareHeart,
  PenTool,
  Star,
  Globe,
  Send,
  CheckCircle2,
  X,
  Heart,
  Sparkles,
  User,
  Quote,
} from 'lucide-react';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { useLanguage } from '@/context/LanguageContext';

interface GuestbookEntry {
  id: string;
  visitorName: string;
  visitorCountry: string | null;
  message: string;
  rating: number | null;
  createdAt: string | null;
}

interface DigitalGuestbookProps {
  exhibitionSlug: string;
  exhibitionTitle: string;
}

export function DigitalGuestbook({ exhibitionSlug, exhibitionTitle }: DigitalGuestbookProps) {
  const { lang } = useLanguage();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('Thailand');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/exhibitions/${exhibitionSlug}/guestbook`);
      const data = await res.json();
      if (data.entries) {
        setEntries(data.entries);
      }
    } catch (err) {
      console.error('Error loading guestbook:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [exhibitionSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !message) return;

    setSubmitting(true);

    const optimisticEntry: GuestbookEntry = {
      id: `temp-${Date.now()}`,
      visitorName: name,
      visitorCountry: country || 'Thailand',
      message: message,
      rating: rating,
      createdAt: new Date().toISOString(),
    };

    setEntries((prev) => [optimisticEntry, ...prev]);

    try {
      const res = await fetch(`/api/exhibitions/${exhibitionSlug}/guestbook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorName: name,
          visitorEmail: email,
          visitorCountry: country,
          rating: rating,
          message: message,
        }),
      });

      if (res.ok) {
        setSuccessMsg(true);
        setTimeout(() => {
          setSuccessMsg(false);
          setIsModalOpen(false);
          setName('');
          setEmail('');
          setMessage('');
        }, 1800);
      }
    } catch (err) {
      console.error('Failed to submit guestbook entry:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="bg-[#141210] rounded-3xl border border-[#2C2824] p-6 sm:p-10 shadow-2xl text-[#FAF8F5] my-12">
      {/* 1. Header with Golden Quill Pen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#2C2824] pb-6 mb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-[#C5A880]" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold">
              Digital Guestbook & Signature Wall
            </span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white">
            {lang === 'th' ? 'สมุดเยี่ยมชมและคำนิยมจากผู้ชม' : 'Exhibition Guestbook & Impressions'}
          </h2>
          <p className="text-xs text-neutral-400">
            {lang === 'th'
              ? `ร่วมส่งต่อความประทับใจ ลายเซ็น และข้อความกำลังใจแด่ศิลปินในนิทรรศการ (${entries.length} ข้อความ)`
              : `Leave your impressions and warm messages to the artists (${entries.length} entries)`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#C5A880] via-[#D4AF37] to-[#B39366] text-[#121110] rounded-2xl text-xs font-extrabold uppercase tracking-wider shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <PenTool className="w-4 h-4 text-[#121110]" />
          <span>{lang === 'th' ? 'ลงชื่อในสมุดเยี่ยมชม' : 'Sign Guestbook'}</span>
        </button>
      </div>

      {/* 2. Messages Wall Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-neutral-400">
          <div className="inline-block w-6 h-6 border-2 border-[#C5A880] border-t-transparent rounded-full animate-spin mb-2" />
          <p>{lang === 'th' ? 'กำลังโหลดข้อความสมุดเยี่ยมชม...' : 'Loading guestbook...'}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-black/30 rounded-2xl border border-dashed border-white/10 p-8">
          <Sparkles className="w-8 h-8 text-[#C5A880] mx-auto" />
          <h3 className="font-serif text-sm font-bold text-white">
            {lang === 'th' ? 'ยังไม่มีข้อความลงชื่อในสมุดเยี่ยมชม' : 'Be the first to sign the guestbook'}
          </h3>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto font-light">
            {lang === 'th'
              ? 'คุณสามารถเป็นคนแรกที่เขียนคำนิยมและส่งกำลังใจให้ศิลปินในนิทรรศการนี้ได้ทันที'
              : 'Share your thoughts and appreciation for this curated exhibition.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold text-[#EAD8C0] rounded-xl transition-all"
          >
            <PenTool className="w-3 h-3 text-[#C5A880]" />
            <span>{lang === 'th' ? 'เขียนข้อความแรก' : 'Write First Message'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {entries.map((item) => (
            <div
              key={item.id}
              className="bg-[#1C1A17] rounded-2xl border border-[#2C2824] p-5 shadow-lg hover:border-[#C5A880]/50 transition-all flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#8B1B1B]/40 border border-[#8B1B1B] flex items-center justify-center text-xs font-serif font-bold text-[#FFD98A]">
                      {item.visitorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{item.visitorName}</span>
                        {item.visitorCountry && (
                          <CountryFlag country={item.visitorCountry} className="w-3.5 h-2.5 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400 font-mono">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('th-TH') : 'วันนี้'}
                      </div>
                    </div>
                  </div>

                  {item.rating && (
                    <div className="flex items-center gap-0.5 text-[#D4AF37]">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-[#D4AF37]" />
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed italic bg-black/40 p-4 rounded-xl border border-white/5">
                  &ldquo;{item.message}&rdquo;
                </p>
              </div>

              <div className="pt-2 text-[10px] text-neutral-500 flex items-center justify-between border-t border-white/5">
                <span className="flex items-center gap-1 text-[#C5A880]">
                  <Heart className="w-3 h-3 text-[#C5A880] fill-[#C5A880]/20" />
                  <span>{lang === 'th' ? 'ผู้เยี่ยมชมนิทรรศการ' : 'Visitor Impression'}</span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">
                  POH-CHANG GUEST
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Sign Guestbook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in select-none">
          <div className="relative w-full max-w-lg bg-[#181614] border border-[#C5A880]/40 rounded-3xl shadow-floating p-6 sm:p-8 text-[#FAF8F5] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            {successMsg ? (
              <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-[#C5A880]" />
                <h3 className="font-serif text-xl font-bold text-white">
                  {lang === 'th' ? 'บันทึกลายเซ็นเรียบร้อยแล้ว' : 'Signed Successfully'}
                </h3>
                <p className="text-xs text-neutral-400">
                  {lang === 'th' ? 'ขอบพระคุณสำหรับข้อความกำลังใจแด่ศิลปิน' : 'Thank you for your appreciation.'}
                </p>
              </div>
            ) : (
              <div>
                <div className="border-b border-white/10 pb-4 mb-6">
                  <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-bold">
                    Digital Guestbook Entry
                  </span>
                  <h2 className="font-serif text-2xl font-bold text-white mt-1">
                    {lang === 'th' ? 'ลงชื่อในสมุดเยี่ยมชม' : 'Sign the Guestbook'}
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">
                    {exhibitionTitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                      {lang === 'th' ? 'ชื่อผู้เยี่ยมชม' : 'Your Name'} <span className="text-[#C5A880]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={lang === 'th' ? 'เช่น พิชิต ศิลป์วิจิตร' : 'e.g. David Ross'}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                        {lang === 'th' ? 'ประเทศ' : 'Country'}
                      </label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Thailand"
                        className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A880]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                        {lang === 'th' ? 'ความประทับใจ' : 'Rating'}
                      </label>
                      <div className="flex items-center gap-1.5 h-10 px-3 bg-black/40 border border-white/15 rounded-xl">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-1 hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                star <= rating ? 'text-[#D4AF37] fill-[#D4AF37]' : 'text-neutral-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold uppercase tracking-wider text-neutral-300 mb-1">
                      {lang === 'th' ? 'ข้อความความประทับใจ' : 'Your Message'} <span className="text-[#C5A880]">*</span>
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={lang === 'th' ? 'เขียนความประทับใจหรือกำลังใจแด่ศิลปิน...' : 'Share your thoughts...'}
                      className="w-full px-3.5 py-2.5 bg-black/40 border border-white/15 rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-[#C5A880]"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                    >
                      {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#C5A880] hover:bg-[#B39366] text-[#121110] rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50 active:scale-95"
                    >
                      {submitting ? (
                        <span>กำลังบันทึก...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>{lang === 'th' ? 'บันทึกคำนิยม' : 'Sign & Submit'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
