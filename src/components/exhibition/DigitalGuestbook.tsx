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

    // Optimistic entry
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
        }, 1500);
      }
    } catch (err) {
      console.error('Error posting guestbook:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#FAF8F5] border border-[#E5DFD5] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8E2D8] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquareHeart className="w-5 h-5 text-[#8B1B1B]" />
            <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
              Digital Guestbook & Signature Wall
            </span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1918]">
            {lang === 'th' ? 'สมุดเยี่ยมชมนิทรรศการ & คำนิยมจากผู้ชม' : 'Exhibition Guestbook & Impressions'}
          </h2>
          <p className="text-xs text-[#7A7468]">
            {lang === 'th'
              ? `ร่วมส่งต่อความประทับใจ ลายเซ็น และข้อความกำลังใจแด่ศิลปินในนิทรรศการ (${entries.length} ข้อความ)`
              : `Leave your impressions and warm messages to the artists (${entries.length} entries)`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B1B1B] hover:bg-[#701515] text-white rounded-2xl text-xs font-bold shadow-md transition-all active:scale-95 cursor-pointer shrink-0"
        >
          <PenTool className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>{lang === 'th' ? 'ลงชื่อในสมุดเยี่ยมชม' : 'Sign Guestbook'}</span>
        </button>
      </div>

      {/* 2. Messages Wall Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-[#7A7468]">
          <div className="inline-block w-6 h-6 border-2 border-[#8B1B1B] border-t-transparent rounded-full animate-spin mb-2" />
          <p>{lang === 'th' ? 'กำลังโหลดข้อความสมุดเยี่ยมชม...' : 'Loading guestbook...'}</p>
        </div>
      ) : entries.length === 0 ? (
        <div className="py-12 text-center space-y-3 bg-white/60 rounded-2xl border border-dashed border-[#DDD6C8] p-8">
          <Sparkles className="w-8 h-8 text-[#C5A880] mx-auto" />
          <h3 className="font-serif text-sm font-bold text-[#1A1918]">
            {lang === 'th' ? 'ยังไม่มีข้อความลงชื่อในสมุดเยี่ยมชม' : 'Be the first to sign the guestbook'}
          </h3>
          <p className="text-xs text-[#7A7468] max-w-sm mx-auto">
            {lang === 'th'
              ? 'คุณสามารถเป็นคนแรกที่เขียนคำนิยมและส่งกำลังใจให้ศิลปินในนิทรรศการนี้ได้ทันที'
              : 'Share your thoughts and appreciation for this curated exhibition.'}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF8F5] hover:bg-[#EFEBE2] border border-[#D5CEC0] text-xs font-semibold text-[#8B1B1B] rounded-xl shadow-sm transition-all"
          >
            <PenTool className="w-3 h-3 text-[#8C6D3F]" />
            <span>{lang === 'th' ? 'เขียนข้อความแรก' : 'Write First Message'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E5DFD5] p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#DDD6C8] flex items-center justify-center text-xs font-serif font-bold text-[#8B1B1B]">
                      {item.visitorName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#1A1918] flex items-center gap-1.5">
                        <span>{item.visitorName}</span>
                        {item.visitorCountry && (
                          <CountryFlag country={item.visitorCountry} className="w-3.5 h-2.5 shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-[#8A8376]">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('th-TH') : 'วันนี้'}
                      </div>
                    </div>
                  </div>

                  {item.rating && (
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: item.rating }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-[#4A453C] leading-relaxed font-serif italic bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EFEBE3]">
                  "{item.message}"
                </p>
              </div>

              <div className="pt-2 text-[10px] text-[#A0988A] flex items-center justify-between border-t border-[#F2EEE7]">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
                  <span>{lang === 'th' ? 'ผู้เยี่ยมชม' : 'Visitor'}</span>
                </span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-[#8C6D3F]">
                  ARTVARA GUEST
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Sign Guestbook Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-[#FAF8F5] border border-[#DDD7CC] rounded-3xl shadow-2xl p-6 sm:p-8 text-[#1E1D1B] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-[#827D72] hover:text-[#1E1D1B] hover:bg-[#EAE5DA]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E3DED4] pb-4 mb-6">
              <span className="text-xs uppercase tracking-widest text-[#8C6D3F] font-bold">
                Digital Guestbook Entry
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1A1918] mt-1">
                {lang === 'th' ? 'ลงชื่อในสมุดเยี่ยมชม' : 'Sign the Guestbook'}
              </h2>
              <p className="text-xs text-[#7A7468] mt-1">
                {exhibitionTitle}
              </p>
            </div>

            {successMsg ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h3 className="font-serif text-lg font-bold text-[#1A1918]">
                  {lang === 'th' ? 'บันทึกลายเซ็นเรียบร้อยแล้ว!' : 'Thank you for signing!'}
                </h3>
                <p className="text-xs text-[#7A7468]">
                  {lang === 'th' ? 'ข้อความของคุณถูกบันทึกลงในสมุดเยี่ยมชมของนิทรรศการนี้' : 'Your entry is now visible on the guestbook wall.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'ชื่อของคุณ (Your Name) *' : 'Your Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น ศักดิ์ชัย วงศ์สว่าง"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D5CFC3] rounded-xl text-xs font-semibold text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                      {lang === 'th' ? 'ประเทศ (Country)' : 'Country'}
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Thailand, Japan..."
                      className="w-full px-3.5 py-2 bg-white border border-[#D5CFC3] rounded-xl text-xs text-[#1A1918] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                      {lang === 'th' ? 'ระดับความประทับใจ (Rating)' : 'Rating'}
                    </label>
                    <div className="flex items-center gap-1 pt-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-125 transition-transform cursor-pointer"
                        >
                          <Star
                            className={`w-5 h-5 ${
                              star <= rating ? 'fill-amber-400 text-amber-500' : 'text-neutral-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#5A554A] mb-1">
                    {lang === 'th' ? 'ข้อความความประทับใจ / คำนิยมแด่ศิลปิน *' : 'Your Impression Message *'}
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="เขียนข้อความความรู้สึก แรงบันดาลใจ หรือคำนิยมที่คุณมีต่อนิทรรศการนี้..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D5CFC3] rounded-xl text-xs font-serif leading-relaxed text-[#1A1918] focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]"
                  />
                </div>

                <div className="pt-3 border-t border-[#E5E0D5] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-[#6E685C] hover:text-[#1A1918]"
                  >
                    {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#8B1B1B] hover:bg-[#701515] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                  >
                    {submitting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-[#D4AF37]" />
                    )}
                    <span>{submitting ? 'กำลังส่ง...' : 'ส่งคำนิยม'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
