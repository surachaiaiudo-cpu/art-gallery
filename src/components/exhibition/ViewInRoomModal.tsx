'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Artwork } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  Sparkles,
  Maximize2,
  Minimize2,
  Info,
  Palette,
  Lightbulb,
  Frame,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import { formatDimensionsInCm, parseArtworkDimensions } from '@/lib/utils';

interface ViewInRoomModalProps {
  artwork: Artwork | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenInquiry?: (artwork: Artwork) => void;
}

type WallStyle = {
  id: string;
  name: string;
  nameEn: string;
  bgClass: string;
  wallTexture: string;
  textColor: string;
  floorColor: string;
};

const WALL_PRESETS: WallStyle[] = [
  {
    id: 'museum-warm',
    name: 'ผนังหอศิลป์โทนอุ่น',
    nameEn: 'Warm Museum Linen',
    bgClass: 'bg-[#F2EFE9]',
    wallTexture: 'radial-gradient(ellipse at 50% 30%, #FAF8F5 0%, #ECE7DE 100%)',
    textColor: '#2B2824',
    floorColor: '#C4B5A2',
  },
  {
    id: 'charcoal-lounge',
    name: 'ห้องนั่งเล่นชาร์โคล',
    nameEn: 'Charcoal Salon',
    bgClass: 'bg-[#1C1B1A]',
    wallTexture: 'radial-gradient(ellipse at 50% 30%, #2A2826 0%, #151413 100%)',
    textColor: '#F5F2EC',
    floorColor: '#36322E',
  },
  {
    id: 'sage-gallery',
    name: 'สตูดิโอเขียวเซจ',
    nameEn: 'Olive Sage Studio',
    bgClass: 'bg-[#E3E8E1]',
    wallTexture: 'radial-gradient(ellipse at 50% 30%, #EFF2EE 0%, #D8DFD5 100%)',
    textColor: '#1F261E',
    floorColor: '#A89E8F',
  },
  {
    id: 'midnight-navy',
    name: 'ไพรเวทแกลเลอรีมิดไนท์',
    nameEn: 'Midnight Navy',
    bgClass: 'bg-[#141A24]',
    wallTexture: 'radial-gradient(ellipse at 50% 30%, #1F2836 0%, #0E131B 100%)',
    textColor: '#F0F4F8',
    floorColor: '#282C34',
  },
];

type FrameStyle = 'none' | 'gold' | 'black' | 'oak';

export function ViewInRoomModal({
  artwork,
  isOpen,
  onClose,
  onOpenInquiry,
}: ViewInRoomModalProps) {
  const { lang, t } = useLanguage();
  const [selectedWall, setSelectedWall] = useState<WallStyle>(WALL_PRESETS[0]);
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('gold');
  const [spotlight, setSpotlight] = useState<boolean>(true);
  const [showPersonScale, setShowPersonScale] = useState<boolean>(true);

  if (!isOpen || !artwork) return null;

  // Calculate approximate scale factor based on width/height in cm
  const { widthMeters, heightMeters } = parseArtworkDimensions(artwork.dimensions);
  const widthCm = Math.round(widthMeters * 100);
  const heightCm = Math.round(heightMeters * 100);
  const aspectRatio = widthCm / heightCm;

  // Clamp visual height in room view (relative to standard wall height of 300cm)
  const rawHeightPercent = (heightCm / 280) * 55;
  const clampedHeightPercent = Math.min(Math.max(rawHeightPercent, 22), 52);

  // Frame CSS classes
  const getFrameClasses = () => {
    switch (frameStyle) {
      case 'gold':
        return 'p-3 bg-gradient-to-tr from-[#B38F4D] via-[#F3E2B8] to-[#9C7938] shadow-[0_20px_50px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.15)] rounded-[2px]';
      case 'black':
        return 'p-3 bg-gradient-to-tr from-[#151515] via-[#2A2A2A] to-[#0A0A0A] shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.1)] rounded-[2px]';
      case 'oak':
        return 'p-3 bg-gradient-to-tr from-[#6E4F32] via-[#A07855] to-[#593D24] shadow-[0_20px_50px_rgba(0,0,0,0.35)] rounded-[2px]';
      default:
        return 'shadow-[0_25px_60px_rgba(0,0,0,0.3)]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      {/* Container */}
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[900px] bg-[#161514] rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden flex flex-col shadow-floating">
        
        {/* Top Bar */}
        <div className="h-16 px-4 sm:px-6 bg-[#1A1918]/90 border-b border-white/10 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/50 flex items-center justify-center">
              <Frame className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A880]">
                  {lang === 'th' ? 'จำลองสเกลแขวนบนผนังห้อง' : 'Interactive View in Room'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-neutral-300">
                  {formatDimensionsInCm(artwork.dimensions, lang)}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-white truncate max-w-md">
                {artwork.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInquiry && (
              <button
                onClick={() => onOpenInquiry(artwork)}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#C5A880] hover:bg-[#B3936A] text-[#161412] text-xs font-bold transition-all shadow-md active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{lang === 'th' ? 'ติดต่อสอบถามผลงาน' : 'Inquire Artwork'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: The Interactive Room Stage */}
        <div
          className="relative flex-1 w-full overflow-hidden flex flex-col items-center justify-center transition-all duration-700"
          style={{ background: selectedWall.wallTexture }}
        >
          {/* Spotlight Cone Light Effect */}
          {spotlight && (
            <div
              className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-full opacity-60 mix-blend-soft-light transition-opacity duration-500"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 0%, rgba(255, 245, 220, 0.8) 0%, rgba(255, 240, 200, 0.2) 50%, transparent 80%)',
              }}
            />
          )}

          {/* Wall Base Molding Line */}
          <div className="absolute bottom-[22%] left-0 right-0 h-4 bg-black/10 border-t border-black/10 border-b border-black/20" />

          {/* Room Floor with Wood Planks Effect */}
          <div
            className="absolute bottom-0 left-0 right-0 h-[22%] shadow-inner transition-colors duration-500"
            style={{
              backgroundColor: selectedWall.floorColor,
              backgroundImage:
                'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.3) 100%)',
            }}
          >
            {/* Floor Perspective Planks Lines */}
            <div className="w-full h-full opacity-15 bg-[repeating-linear-gradient(90deg,transparent,transparent_60px,rgba(0,0,0,0.4)_61px,rgba(0,0,0,0.4)_62px)]" />
          </div>

          {/* Scale Reference: Luxury Designer Bench & Person Silhouette */}
          <div className="absolute bottom-[8%] left-1/2 -translate-x-1/2 w-full max-w-4xl flex items-end justify-between px-12 pointer-events-none z-10">
            {/* Person Silhouette for Human Scale Reference (175 cm) */}
            {showPersonScale && (
              <div className="flex flex-col items-center opacity-45 hover:opacity-80 transition-opacity">
                <svg
                  width="54"
                  height="165"
                  viewBox="0 0 54 165"
                  fill="currentColor"
                  className="text-black/70 drop-shadow-md"
                >
                  <circle cx="27" cy="16" r="12" />
                  <path d="M12 36 C12 32 42 32 42 36 L44 90 C44 94 40 98 35 98 L33 162 C33 164 30 165 27 165 C24 165 21 164 21 162 L19 98 C14 98 10 94 10 90 Z" />
                </svg>
                <span className="text-[10px] font-mono text-black/60 mt-1 font-semibold">
                  ~175 cm
                </span>
              </div>
            )}

            {/* Designer Bench under artwork */}
            <div className="flex-1 flex flex-col items-center mx-8">
              <div className="w-64 sm:w-80 h-7 bg-[#2B2620] rounded-sm shadow-2xl border-t border-white/20 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
              <div className="w-56 sm:w-72 flex justify-between h-10">
                <div className="w-2 h-full bg-[#9E824C] shadow-md" />
                <div className="w-2 h-full bg-[#9E824C] shadow-md" />
              </div>
            </div>

            <div className="w-12" />
          </div>

          {/* The Artwork Hanging on the Wall */}
          <div
            className="relative z-10 transition-all duration-300 flex items-center justify-center -translate-y-6"
            style={{
              height: `${clampedHeightPercent}%`,
              aspectRatio: `${aspectRatio}`,
            }}
          >
            <div className={`relative w-full h-full ${getFrameClasses()} transition-all duration-300`}>
              <div className="relative w-full h-full overflow-hidden bg-neutral-900 shadow-inner">
                <Image
                  src={artwork.imageUrl}
                  alt={artwork.title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1200px) 80vw, 60vw"
                  priority
                />
              </div>

              {/* Artwork Physical Label / Museum Plaque next to frame */}
              <div className="absolute -bottom-8 -right-16 hidden lg:block bg-white/90 backdrop-blur-md px-2.5 py-1 rounded shadow-md border border-black/10 text-[9px] leading-tight text-[#2A2723] max-w-[130px]">
                <div className="font-bold truncate">{artwork.title}</div>
                <div className="text-neutral-500 truncate">{artwork.artist?.name}</div>
                <div className="text-neutral-400 font-mono mt-0.5">
                  {widthCm} × {heightCm} cm
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Control Dock */}
        <div className="px-4 sm:px-8 py-3.5 bg-[#1A1918] border-t border-white/10 z-20 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Wall Styles Selector */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-[11px] font-medium flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{lang === 'th' ? 'สีผนัง:' : 'Wall Style:'}</span>
            </span>
            <div className="flex items-center gap-1.5">
              {WALL_PRESETS.map((wall) => (
                <button
                  key={wall.id}
                  onClick={() => setSelectedWall(wall)}
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all ${
                    selectedWall.id === wall.id
                      ? 'bg-[#C5A880] text-[#161412] font-bold shadow'
                      : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                  }`}
                >
                  {lang === 'th' ? wall.name : wall.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Frame Style Selector */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-[11px] font-medium flex items-center gap-1.5">
              <Frame className="w-3.5 h-3.5 text-[#C5A880]" />
              <span>{lang === 'th' ? 'กรอบภาพ:' : 'Frame:'}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFrameStyle('gold')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  frameStyle === 'gold'
                    ? 'bg-[#C5A880] text-[#161412] font-bold'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                {lang === 'th' ? 'ทองคลาสสิก' : 'Gold'}
              </button>
              <button
                onClick={() => setFrameStyle('black')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  frameStyle === 'black'
                    ? 'bg-neutral-800 text-white border border-white/30 font-bold'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                {lang === 'th' ? 'ดำโมเดิร์น' : 'Black'}
              </button>
              <button
                onClick={() => setFrameStyle('oak')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  frameStyle === 'oak'
                    ? 'bg-[#8A6343] text-white font-bold'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                {lang === 'th' ? 'ไม้โอ๊ค' : 'Oak Wood'}
              </button>
              <button
                onClick={() => setFrameStyle('none')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  frameStyle === 'none'
                    ? 'bg-white/30 text-white font-bold'
                    : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                }`}
              >
                {lang === 'th' ? 'ไร้กรอบ' : 'Frameless'}
              </button>
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSpotlight(!spotlight)}
              className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                spotlight
                  ? 'bg-[#C5A880]/20 border-[#C5A880] text-[#EAD8C0]'
                  : 'bg-white/5 border-white/10 text-neutral-400'
              }`}
              title={lang === 'th' ? 'เปิด/ปิด สปอตไลต์' : 'Toggle Spotlight'}
            >
              <Lightbulb className="w-3.5 h-3.5 text-[#C5A880]" />
              <span className="text-[11px] hidden md:inline">
                {spotlight ? (lang === 'th' ? 'สปอตไลต์เปิด' : 'Spotlight ON') : (lang === 'th' ? 'สปอตไลต์ปิด' : 'Spotlight OFF')}
              </span>
            </button>

            <button
              onClick={() => setShowPersonScale(!showPersonScale)}
              className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 ${
                showPersonScale
                  ? 'bg-[#C5A880]/20 border-[#C5A880] text-[#EAD8C0]'
                  : 'bg-white/5 border-white/10 text-neutral-400'
              }`}
              title={lang === 'th' ? 'เปิด/ปิด สเกลคนยืน' : 'Toggle Human Silhouette Scale'}
            >
              <span className="text-[11px]">👤 {showPersonScale ? (lang === 'th' ? 'เทียบคน' : 'Person Scale') : (lang === 'th' ? 'ซ่อนคน' : 'Hide Person')}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
