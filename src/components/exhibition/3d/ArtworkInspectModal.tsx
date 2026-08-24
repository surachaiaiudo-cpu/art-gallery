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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [reactions, setReactions] = useState(24);
  const [hasReacted, setHasReacted] = useState(false);
  const [showLightControls, setShowLightControls] = useState(false);

  if (!isOpen || !artwork) return null;

  const handleReaction = () => {
    if (!hasReacted) {
      setReactions((prev) => prev + 1);
      setHasReacted(true);
    }
  };

  return (
    <aside className="fixed top-0 right-0 h-full w-full sm:w-[440px] z-40 p-4 sm:p-6 pointer-events-auto flex flex-col justify-between overflow-y-auto animate-fade-in">
      <div className="bg-white/95 backdrop-blur-xl h-full w-full rounded-3xl p-6 flex flex-col justify-between border border-white/80 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content Body */}
        <div className="overflow-y-auto pr-1">
          {/* Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-800 border border-amber-500/20 mb-3">
            <Award className="w-3 h-3 mr-1 text-amber-600" />
            <span>Curated Exhibition Piece</span>
          </div>

          {/* Title & Artist */}
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1 leading-snug">
            {artwork.title}
          </h2>
          <p className="text-xs text-amber-800 font-medium mb-4">
            โดย {artwork.artist?.name || 'ศิลปินนิรนาม'}
          </p>

          {/* Image Preview & Fullscreen trigger */}
          {artwork.imageUrl && (
            <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 border border-slate-200 shadow-inner group">
              <img
                src={artwork.imageUrl}
                alt={artwork.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {onOpenLightbox && (
                <button
                  onClick={() => onOpenLightbox(artwork)}
                  className="absolute bottom-2.5 right-2.5 px-2.5 py-1.5 bg-slate-950/70 hover:bg-slate-950 text-white rounded-xl text-[10px] font-medium backdrop-blur flex items-center space-x-1.5 transition-colors"
                >
                  <Maximize2 className="w-3 h-3 text-amber-400" />
                  <span>ขยายภาพคมชัด (HD)</span>
                </button>
              )}
            </div>
          )}

          {/* Metadata Specs Grid */}
          <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 mb-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] font-medium">
                เทคนิค / สื่อ (Medium)
              </span>
              <span className="text-slate-700 font-normal">
                {artwork.medium || 'Fine Art on Canvas'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium">
                ขนาดจริง (Dimensions)
              </span>
              <span className="text-slate-700 font-normal">
                {artwork.dimensions || 'Standard Scale'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium">
                ปีที่สร้างสรรค์ (Year)
              </span>
              <span className="text-slate-700 font-normal">
                {artwork.yearCreated || '2026'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-medium">
                สถานะผลงาน (Status)
              </span>
              <span className="text-amber-700 font-semibold uppercase text-[11px]">
                {artwork.status || 'Available'}
              </span>
            </div>
          </div>

          {/* Interactive Light Studio Tool */}
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-900 flex items-center">
                <Sun className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
                ส่องไฟปรับองศาตรวจ Texture ผิวกระดาษ
              </span>
              <button
                onClick={() => setShowLightControls(!showLightControls)}
                className="text-[11px] text-amber-800 font-medium underline"
              >
                {showLightControls ? 'ซ่อน' : 'ปรับแสง'}
              </button>
            </div>

            {showLightControls && (
              <div className="space-y-2 pt-1 border-t border-amber-500/20 text-xs">
                <div>
                  <div className="flex justify-between text-[11px] text-amber-900 mb-1">
                    <span>องศาไฟตกกระทบ:</span>
                    <span className="font-mono">{lightAngle}°</span>
                  </div>
                  <input
                    type="range"
                    min="-60"
                    max="60"
                    value={lightAngle}
                    onChange={(e) => onLightAngleChange(Number(e.target.value))}
                    className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-[11px] text-amber-900 mb-1">
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
                    className="w-full h-1.5 bg-amber-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Artwork Story & Concept */}
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
              เรื่องราวและแนวคิดผลงาน
            </h4>
            <p className="text-xs text-slate-600 font-light leading-relaxed max-h-28 overflow-y-auto pr-1">
              {artwork.description ||
                artwork.concept ||
                'ผลงานศิลปะชิ้นนี้สะท้อนมุมมองและอารมณ์ผ่านการจัดวางองค์ประกอบเส้นสายและน้ำหนักแสงเงาอย่างประณีต...'}
            </p>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="space-y-2 pt-3 border-t border-slate-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleReaction}
              className={`py-2 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-1.5 transition-all ${
                hasReacted
                  ? 'bg-rose-100 border-rose-300 text-rose-800'
                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 text-rose-500 ${
                  hasReacted ? 'fill-rose-500' : ''
                }`}
              />
              <span>ถูกใจ ({reactions})</span>
            </button>

            {onOpenInquiry && (
              <button
                onClick={() => onOpenInquiry(artwork)}
                className="py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-medium flex items-center justify-center space-x-1.5 transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-amber-600" />
                <span>สอบถามผลงาน</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
