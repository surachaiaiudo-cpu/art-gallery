'use client';

import React, { useState } from 'react';
import { Artwork } from '@/types/exhibition';
import {
  X,
  Award,
  Sun,
  Volume2,
  VolumeX,
  Heart,
  Mail,
  Maximize2,
  Sliders,
  Sparkles,
} from 'lucide-react';

interface ArtworkInspectModalProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenLightbox?: (artwork: Artwork) => void;
  onOpenInquiry?: (artwork: Artwork) => void;
  lightAngle: number;
  onLightAngleChange: (angle: number) => void;
  lightIntensity: number;
  onLightIntensityChange: (intensity: number) => void;
}

export function ArtworkInspectModal({
  artwork,
  isOpen,
  onClose,
  onOpenLightbox,
  onOpenInquiry,
  lightAngle,
  onLightAngleChange,
  lightIntensity,
  onLightIntensityChange,
}: ArtworkInspectModalProps) {
  const [reactions, setReactions] = useState(24);
  const [hasReacted, setHasReacted] = useState(false);
  const [showLightControls, setShowLightControls] = useState(false);

  if (!isOpen || !artwork) return null;

  const handleReaction = () => {
    if (!hasReacted) {
      setReactions((prev) => prev + 1);
      setHasReacted(true);
    } else {
      setReactions((prev) => Math.max(0, prev - 1));
      setHasReacted(false);
    }
  };

  return (
    <aside className="fixed top-0 right-0 h-full w-full sm:w-[460px] z-50 p-3 sm:p-5 pointer-events-auto flex flex-col justify-between overflow-y-auto animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="bg-[#161310]/35 backdrop-blur-2xl h-full w-full rounded-3xl p-6 sm:p-7 flex flex-col justify-between border border-[#D9B878]/30 shadow-[0_8px_40px_rgba(0,0,0,0.5)] text-white relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#C5A880] hover:text-white transition-colors"
          title="ปิด (ESC หรือ E)"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Body */}
        <div className="overflow-y-auto pr-1">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#D9B878]/15 text-[#FFD98A] border border-[#D9B878]/30 mb-3">
            <Award className="w-3 h-3 mr-1.5 text-[#D9B878]" />
            <span>EXHIBIT WORK</span>
          </div>

          {/* Title & Artist */}
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-white mb-1 leading-snug">
            {artwork.title}
          </h2>
          <p className="text-xs text-[#C5A880] font-medium mb-4">
            โดย {artwork.artist?.name || 'ศิลปินนิรนาม'} {artwork.artist?.country ? `(${artwork.artist.country})` : ''}
          </p>

          {/* Image Preview & Fullscreen trigger */}
          {artwork.imageUrl && (
            <div className="relative w-full h-48 rounded-2xl overflow-hidden mb-4 border border-[#D9B878]/25 shadow-inner group bg-black/25">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              />
              {onOpenLightbox && (
                <button
                  onClick={() => onOpenLightbox(artwork)}
                  className="absolute bottom-2.5 right-2.5 px-3 py-1.5 bg-black/60 hover:bg-black/85 text-white rounded-xl text-[10px] font-medium backdrop-blur flex items-center space-x-1.5 transition-colors border border-white/20"
                >
                  <Maximize2 className="w-3 h-3 text-[#FFD98A]" />
                  <span>ขยายภาพ HD</span>
                </button>
              )}
            </div>
          )}

          {/* Metadata Specs Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-black/20 border border-white/10 mb-4 text-xs">
            <div>
              <span className="text-[#A59582] block text-[10px] uppercase tracking-wider font-semibold">
                เทคนิค (Medium)
              </span>
              <span className="text-[#F4F3EE] font-light">
                {artwork.medium || 'Fine Art on Canvas'}
              </span>
            </div>
            <div>
              <span className="text-[#A59582] block text-[10px] uppercase tracking-wider font-semibold">
                ขนาดจริง (Dimensions)
              </span>
              <span className="text-[#F4F3EE] font-light">
                {artwork.dimensions || 'Standard Scale'}
              </span>
            </div>
            <div>
              <span className="text-[#A59582] block text-[10px] uppercase tracking-wider font-semibold">
                ปีที่สร้าง (Year)
              </span>
              <span className="text-[#F4F3EE] font-light">
                {artwork.yearCreated || '2026'}
              </span>
            </div>
            <div>
              <span className="text-[#A59582] block text-[10px] uppercase tracking-wider font-semibold">
                สถานะผลงาน (Status)
              </span>
              <span className="text-[#FFD98A] font-semibold uppercase text-[11px]">
                {artwork.status === 'available' ? '🟢 พร้อมสะสม' : artwork.status}
              </span>
            </div>
          </div>

          {/* Interactive Light Studio Tool */}
          <div className="mb-4 p-3.5 rounded-2xl bg-[#D9B878]/10 border border-[#D9B878]/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#FFD98A] flex items-center">
                <Sun className="w-3.5 h-3.5 text-[#D9B878] mr-1.5" />
                ส่องไฟปรับองศาตรวจ Texture ผิวกระดาษ
              </span>
              <button
                onClick={() => setShowLightControls(!showLightControls)}
                className="text-[11px] text-[#D9B878] font-medium underline hover:text-[#FFD98A]"
              >
                {showLightControls ? 'ซ่อน' : 'ปรับแสง'}
              </button>
            </div>

            {showLightControls && (
              <div className="space-y-2 pt-1 border-t border-[#D9B878]/20 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-[#C5A880] mb-1">
                    <span>องศาไฟตกกระทบ:</span>
                    <span className="font-mono">{lightAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    value={lightAngle}
                    onChange={(e) => onLightAngleChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#2A231C] rounded-lg appearance-none cursor-pointer accent-[#D9B878]"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-[#C5A880] mb-1">
                    <span>ความสว่างสปอตไลต์:</span>
                    <span className="font-mono">{lightIntensity.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="8.0"
                    step="0.5"
                    value={lightIntensity}
                    onChange={(e) => onLightIntensityChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-[#2A231C] rounded-lg appearance-none cursor-pointer accent-[#D9B878]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Artwork Story & Concept */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-[#D9B878] uppercase tracking-wider mb-1.5 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-[#D9B878] mr-1.5" />
              เรื่องราวและแนวคิดผลงาน
            </h4>
            <p className="text-xs text-neutral-300 font-light leading-relaxed max-h-28 overflow-y-auto pr-1">
              {artwork.description ||
                artwork.concept ||
                'ผลงานศิลปะชิ้นนี้สะท้อนมุมมองและอารมณ์ผ่านการจัดวางองค์ประกอบเส้นสายและน้ำหนักแสงเงาอย่างประณีต...'}
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="space-y-2 pt-3 border-t border-white/10">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleReaction}
              className={`py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                hasReacted
                  ? 'bg-rose-950/60 border-rose-500 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-neutral-300'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 text-rose-400 ${
                  hasReacted ? 'fill-rose-400' : ''
                }`}
              />
              <span>{hasReacted ? 'ถูกใจแล้ว' : 'ถูกใจ'} ({reactions})</span>
            </button>

            {onOpenInquiry && (
              <button
                onClick={() => onOpenInquiry(artwork)}
                className="py-2.5 px-3 rounded-xl bg-[#D9B878]/20 hover:bg-[#D9B878]/30 border border-[#D9B878]/40 text-[#FFD98A] text-xs font-medium flex items-center justify-center space-x-1.5 transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-[#D9B878]" />
                <span>สอบถามผลงาน</span>
              </button>
            )}
          </div>

          <div className="text-center pt-1">
            <span className="text-[10px] text-[#A59582] font-mono">
              กด <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/10 text-white">E</kbd> หรือ <kbd className="px-1.5 py-0.5 bg-black/40 rounded border border-white/10 text-white">ESC</kbd> เพื่อปิดหน้าต่างนี้
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
