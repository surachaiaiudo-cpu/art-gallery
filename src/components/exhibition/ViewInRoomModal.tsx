'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Artwork } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  Sparkles,
  Palette,
  Lightbulb,
  Frame,
  MessageSquare,
  Ruler,
  Armchair,
  Eye,
  Check,
} from 'lucide-react';
import { formatDimensionsInCm, parseArtworkDimensions } from '@/lib/utils';
import { TooltipBubble } from '@/components/ui/TooltipBubble';

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
  wallTexture: string;
  textColor: string;
  floorColor: string;
  baseboardColor: string;
};

const WALL_PRESETS: WallStyle[] = [
  {
    id: 'museum-warm',
    name: 'ผนังหอศิลป์โทนอุ่น',
    nameEn: 'Warm Museum Linen',
    wallTexture: 'radial-gradient(ellipse at 50% 35%, #FAF8F5 0%, #EAE5DC 100%)',
    textColor: '#2B2824',
    floorColor: '#B5A593',
    baseboardColor: '#D8D1C5',
  },
  {
    id: 'charcoal-lounge',
    name: 'ห้องนั่งเล่นชาร์โคล',
    nameEn: 'Charcoal Salon',
    wallTexture: 'radial-gradient(ellipse at 50% 35%, #272523 0%, #151413 100%)',
    textColor: '#F5F2EC',
    floorColor: '#2C2723',
    baseboardColor: '#3D3833',
  },
  {
    id: 'sage-gallery',
    name: 'สตูดิโอเขียวเซจ',
    nameEn: 'Olive Sage Studio',
    wallTexture: 'radial-gradient(ellipse at 50% 35%, #EEF2ED 0%, #D5DFD3 100%)',
    textColor: '#1F261E',
    floorColor: '#9C9283',
    baseboardColor: '#C4CCC1',
  },
  {
    id: 'midnight-navy',
    name: 'ไพรเวทแกลเลอรีมิดไนท์',
    nameEn: 'Midnight Navy',
    wallTexture: 'radial-gradient(ellipse at 50% 35%, #1D2635 0%, #0E131C 100%)',
    textColor: '#F0F4F8',
    floorColor: '#232730',
    baseboardColor: '#2F3847',
  },
];

type FrameStyle = 'none' | 'gold' | 'black' | 'oak';

export function ViewInRoomModal({
  artwork,
  isOpen,
  onClose,
  onOpenInquiry,
}: ViewInRoomModalProps) {
  const { lang } = useLanguage();
  const [selectedWall, setSelectedWall] = useState<WallStyle>(WALL_PRESETS[0]);
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('gold');
  const [spotlight, setSpotlight] = useState<boolean>(true);
  const [showPersonScale, setShowPersonScale] = useState<boolean>(true);
  const [showBench, setShowBench] = useState<boolean>(true);
  const [showDimensions, setShowDimensions] = useState<boolean>(true);

  if (!isOpen || !artwork) return null;

  // 1. Physically Accurate Dimensions Parsing
  const { widthMeters, heightMeters } = parseArtworkDimensions(artwork.dimensions);
  const widthCm = Math.max(Math.round(widthMeters * 100), 15);
  const heightCm = Math.max(Math.round(heightMeters * 100), 15);
  const widthInches = Math.round(widthCm / 2.54);
  const heightInches = Math.round(heightCm / 2.54);
  const aspectRatio = widthCm / heightCm;

  // 2. True-Scale Geometry
  // Wall reference height = 300 cm (Standard 3-meter gallery ceiling)
  // Human height = 175 cm (58.33% of wall height)
  // Eye-level hanging center = 150 cm (50% of wall height from floor)
  const WALL_HEIGHT_CM = 300;
  const HUMAN_HEIGHT_CM = 175;
  const EYE_LEVEL_CENTER_CM = 150;

  // Percentage height relative to the 300cm wall height
  // Scale factor cap to ensure enormous art (>240cm) fits within container while scaling strictly 1:1
  const maxAllowedWallCm = 270;
  const isOversized = heightCm > maxAllowedWallCm || (widthCm / aspectRatio > maxAllowedWallCm * 1.6);
  const scaleRatio = isOversized ? maxAllowedWallCm / Math.max(heightCm, widthCm / 1.6) : 1.0;

  const actualHeightPercent = (heightCm / WALL_HEIGHT_CM) * 100 * scaleRatio;
  const actualWidthPercent = (widthCm / WALL_HEIGHT_CM) * 100 * scaleRatio;
  const personHeightPercent = (HUMAN_HEIGHT_CM / WALL_HEIGHT_CM) * 100 * scaleRatio;

  // Center artwork at 150cm eye level
  // Bottom offset = eye level (50%) - half artwork height
  const bottomOffsetPercent = Math.max((EYE_LEVEL_CENTER_CM / WALL_HEIGHT_CM) * 100 * scaleRatio - (actualHeightPercent / 2), 2);

  // Frame CSS styles
  const getFrameClasses = () => {
    switch (frameStyle) {
      case 'gold':
        return 'p-3 bg-gradient-to-tr from-[#9C7938] via-[#F3E2B8] to-[#9C7938] shadow-[0_25px_50px_rgba(0,0,0,0.45),0_0_0_1px_rgba(0,0,0,0.2)] rounded-[2px]';
      case 'black':
        return 'p-3 bg-gradient-to-tr from-[#121212] via-[#2A2A2A] to-[#0A0A0A] shadow-[0_25px_50px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.15)] rounded-[2px]';
      case 'oak':
        return 'p-3 bg-gradient-to-tr from-[#593D24] via-[#A07855] to-[#593D24] shadow-[0_25px_50px_rgba(0,0,0,0.45)] rounded-[2px]';
      default:
        return 'shadow-[0_25px_60px_rgba(0,0,0,0.35),0_0_0_1px_rgba(0,0,0,0.08)]';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-xl animate-fade-in select-none">
      {/* Main Modal Frame */}
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[920px] bg-[#141312] rounded-2xl sm:rounded-3xl border border-white/15 overflow-hidden flex flex-col shadow-floating">
        
        {/* Top Header Bar */}
        <div className="h-16 px-4 sm:px-6 bg-[#1A1918]/95 border-b border-white/10 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#C5A880]/20 border border-[#C5A880]/50 flex items-center justify-center">
              <Frame className="w-4 h-4 text-[#C5A880]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#C5A880]">
                  {lang === 'th' ? 'จำลองขนาดจริง 1:1 เทียบสเกลตัวคน (175 ซม.)' : 'True 1:1 Scale Simulation (175 cm Human)'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-mono text-neutral-300 font-bold">
                  {widthCm} × {heightCm} ซม. ({widthInches}″ × {heightInches}″)
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-serif font-bold text-white truncate max-w-md">
                {artwork.title} — {artwork.artist?.name || 'Artist'}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenInquiry && (
              <button
                onClick={() => onOpenInquiry(artwork)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#C5A880] hover:bg-[#B3936A] text-[#161412] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{lang === 'th' ? 'ติดต่อสอบถาม' : 'Inquire'}</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center: The Interactive Room Stage with True Physical Geometry */}
        <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-end">
          
          {/* 1. The 3-Meter Gallery Wall Area (Spans from Top to Floor Line at 18%) */}
          <div
            className="absolute top-0 left-0 right-0 bottom-[18%] transition-all duration-700 overflow-hidden"
            style={{ background: selectedWall.wallTexture }}
          >
            {/* Spotlight Lighting Effect */}
            {spotlight && (
              <div
                className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[85%] h-full opacity-70 mix-blend-soft-light transition-opacity duration-500"
                style={{
                  background:
                    'radial-gradient(ellipse at 50% 0%, rgba(255, 245, 220, 0.85) 0%, rgba(255, 240, 200, 0.25) 55%, transparent 85%)',
                }}
              />
            )}

            {/* Ceiling Shadow */}
            <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-black/20 to-transparent pointer-events-none" />

            {/* 2. THE ARTWORK: Hanging at Exactly Eye-Level (150cm) with 1:1 Scale */}
            <div
              className="absolute left-1/2 -translate-x-1/2 transition-all duration-500 z-10 flex items-center justify-center"
              style={{
                bottom: `${bottomOffsetPercent}%`,
                height: `${actualHeightPercent}%`,
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

                {/* Dimension Ruler Overlay (Architectural Specs) */}
                {showDimensions && (
                  <>
                    {/* Top Width Ruler */}
                    <div className="absolute -top-7 left-0 right-0 flex items-center justify-between text-[10px] font-mono text-[#8C6D3F] bg-white/90 backdrop-blur-md px-2 py-0.5 rounded shadow-xs border border-[#C5A880]/40">
                      <span>◀</span>
                      <span className="font-bold">{widthCm} ซม. ({widthInches}″)</span>
                      <span>▶</span>
                    </div>

                    {/* Right Height Ruler */}
                    <div className="absolute top-0 bottom-0 -right-8 flex flex-col items-center justify-between text-[10px] font-mono text-[#8C6D3F] bg-white/90 backdrop-blur-md py-1 px-1 rounded shadow-xs border border-[#C5A880]/40">
                      <span>▲</span>
                      <span className="font-bold [writing-mode:vertical-rl] rotate-180">{heightCm} ซม.</span>
                      <span>▼</span>
                    </div>
                  </>
                )}

                {/* Museum Tombstone Placard beside the Artwork */}
                <div className="absolute -bottom-10 -left-20 hidden lg:block bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-md border border-[#E5DFD3] text-[10px] leading-tight text-[#2A2723] max-w-[150px] space-y-0.5">
                  <div className="font-serif font-bold text-[#1A1918] truncate">{artwork.title}</div>
                  <div className="text-[#666] truncate">{artwork.artist?.name}</div>
                  <div className="text-[#8C6D3F] font-mono font-semibold pt-0.5 border-t border-[#EFEBE3]">
                    {widthCm} × {heightCm} ซม.
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Baseboard / Wall-Floor Molding Trim */}
            <div
              className="absolute bottom-0 left-0 right-0 h-4 border-t border-black/15 shadow-sm transition-colors duration-500"
              style={{ backgroundColor: selectedWall.baseboardColor }}
            />
          </div>

          {/* 4. The Floor: Wooden / Gallery Floor Horizon (18% Height) */}
          <div
            className="relative w-full h-[18%] shadow-inner transition-colors duration-500 overflow-hidden"
            style={{
              backgroundColor: selectedWall.floorColor,
              backgroundImage:
                'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.08) 25%, rgba(0,0,0,0.35) 100%)',
            }}
          >
            {/* Perspective Floor Wood Grain Plank Lines */}
            <div className="w-full h-full opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_80px,rgba(0,0,0,0.6)_81px,rgba(0,0,0,0.6)_82px)]" />
          </div>

          {/* 5. PHYSICAL SCALE REFERENCE LAYER (Anchored Exactly on the Floor Line) */}
          <div className="absolute bottom-[18%] left-0 right-0 pointer-events-none z-15 flex items-end justify-between px-8 sm:px-16">
            
            {/* Realistic Human Silhouette Figure (175 cm Adult) */}
            {showPersonScale && (
              <div
                className="relative flex flex-col items-center select-none"
                style={{ height: `calc(${personHeightPercent} * 0.82vh)` }}
              >
                {/* 175 cm Height Indicator Pill */}
                <div className="absolute -top-7 px-2 py-0.5 bg-[#1A1918]/90 text-[#C5A880] border border-[#C5A880]/50 rounded-full text-[10px] font-mono font-bold whitespace-nowrap shadow-md">
                  👤 ~175 ซม. (5′9″)
                </div>

                {/* Realistic SVG Human Silhouette with Accurate Anatomical Proportions */}
                <svg
                  viewBox="0 0 100 280"
                  className="h-full w-auto text-[#1C1B1A] opacity-75 drop-shadow-[0_15px_15px_rgba(0,0,0,0.4)]"
                  fill="currentColor"
                >
                  {/* Head & Neck */}
                  <ellipse cx="50" cy="22" rx="11" ry="14" />
                  <path d="M46 36 L54 36 L56 42 L44 42 Z" />
                  {/* Shoulders & Torso */}
                  <path d="M44 42 C30 44 26 52 24 65 L22 120 C22 126 26 128 30 126 L34 85 L36 145 C36 155 38 160 44 162 L44 268 C44 274 40 278 35 280 L65 280 C60 278 56 274 56 268 L56 162 C62 160 64 155 64 145 L66 85 L70 126 C74 128 78 126 78 120 L76 65 C74 52 70 44 56 42 Z" />
                </svg>

                {/* Floor Shadow for the Human */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-16 h-3 bg-black/40 rounded-full blur-[2px]" />
              </div>
            )}

            {/* Gallery Bench Reference (160 × 45 cm) */}
            {showBench && (
              <div className="relative flex flex-col items-center select-none translate-y-1 mx-auto">
                <div className="w-56 sm:w-72 h-5 bg-[#2B231B] rounded-xs shadow-2xl border-t border-white/20 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                <div className="w-48 sm:w-64 flex justify-between h-9">
                  <div className="w-2.5 h-full bg-[#8C6D3F] shadow-md" />
                  <div className="w-2.5 h-full bg-[#8C6D3F] shadow-md" />
                </div>
                {/* Bench Floor Shadow */}
                <div className="absolute -bottom-1 w-64 h-3 bg-black/35 rounded-full blur-[2px]" />
              </div>
            )}

            <div className="w-12" />
          </div>
        </div>

        {/* Bottom Control Dock */}
        <div className="px-4 sm:px-6 py-3.5 bg-[#181716] border-t border-white/10 z-20 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          
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
                  className={`px-3 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                    selectedWall.id === wall.id
                      ? 'bg-[#C5A880] text-[#161412] font-bold shadow-xs'
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
              {[
                { id: 'gold', labelTh: 'ทองคลาสสิก', labelEn: 'Gold' },
                { id: 'black', labelTh: 'ดำโมเดิร์น', labelEn: 'Black' },
                { id: 'oak', labelTh: 'ไม้โอ๊ค', labelEn: 'Oak' },
                { id: 'none', labelTh: 'ไร้กรอบ', labelEn: 'None' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFrameStyle(f.id as FrameStyle)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                    frameStyle === f.id
                      ? 'bg-[#C5A880] text-[#161412] font-bold shadow-xs'
                      : 'bg-white/10 text-neutral-300 hover:bg-white/20'
                  }`}
                >
                  {lang === 'th' ? f.labelTh : f.labelEn}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Toggles */}
          <div className="flex items-center gap-2">
            {/* Dimension Ruler Toggle */}
            <TooltipBubble content={lang === 'th' ? 'เปิด/ปิด ไม้บรรทัดบอกขนาด (ซม./นิ้ว)' : 'Toggle Dimension Rulers'}>
              <button
                onClick={() => setShowDimensions(!showDimensions)}
                className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showDimensions
                    ? 'bg-[#C5A880]/20 border-[#C5A880] text-[#EAD8C0]'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                <Ruler className="w-3.5 h-3.5 text-[#C5A880]" />
                <span className="text-[11px] hidden lg:inline">{lang === 'th' ? 'ไม้บรรทัด' : 'Ruler'}</span>
              </button>
            </TooltipBubble>

            {/* Human Silhouette Toggle */}
            <TooltipBubble content={lang === 'th' ? 'เปิด/ปิด หุ่นคนเทียบสเกล (175 ซม.)' : 'Toggle 175cm Human Figure'}>
              <button
                onClick={() => setShowPersonScale(!showPersonScale)}
                className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showPersonScale
                    ? 'bg-[#C5A880]/20 border-[#C5A880] text-[#EAD8C0]'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                <span className="text-[11px]">👤 {showPersonScale ? (lang === 'th' ? 'สเกลคน 175 ซม.' : '175cm Human') : (lang === 'th' ? 'ซ่อนคน' : 'Hide Human')}</span>
              </button>
            </TooltipBubble>

            {/* Bench Toggle */}
            <TooltipBubble content={lang === 'th' ? 'เปิด/ปิด ม้านั่งแกลเลอรี' : 'Toggle Gallery Bench'}>
              <button
                onClick={() => setShowBench(!showBench)}
                className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  showBench
                    ? 'bg-[#C5A880]/20 border-[#C5A880] text-[#EAD8C0]'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                <Armchair className="w-3.5 h-3.5 text-[#C5A880]" />
              </button>
            </TooltipBubble>

            {/* Spotlight Toggle */}
            <TooltipBubble content={lang === 'th' ? 'เปิด/ปิด สปอตไลต์ส่องผนัง' : 'Toggle Gallery Spotlight'}>
              <button
                onClick={() => setSpotlight(!spotlight)}
                className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  spotlight
                    ? 'bg-[#C5A880]/20 border-[#C5A880] text-[#EAD8C0]'
                    : 'bg-white/5 border-white/10 text-neutral-400'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5 text-[#C5A880]" />
              </button>
            </TooltipBubble>
          </div>
        </div>

      </div>
    </div>
  );
}
