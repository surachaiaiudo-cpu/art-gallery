'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Heart,
  Maximize2,
  ZoomIn,
  Compass,
  Volume2,
  VolumeX,
  Play,
  Pause,
  X,
  MessageSquare,
} from 'lucide-react';
import { Artwork, Exhibition } from '@/types/exhibition';
import { CalculatedArtworkSlot, RoomGeometryConfig } from './types';
import { CountryFlag } from '@/components/ui/CountryFlag';
import { formatDimensionsInCm } from '@/lib/utils';
import { useLanguage } from '@/context/LanguageContext';

interface Mobile3DControlsProps {
  exhibition: Exhibition;
  roomConfigs: RoomGeometryConfig[];
  currentRoomIndex: number;
  currentRoomConfig: RoomGeometryConfig;
  focusedArtwork: Artwork | null;
  focusedSlot: CalculatedArtworkSlot | null;
  aimedArtwork: Artwork | null;
  aimedSlot: CalculatedArtworkSlot | null;
  viewedArtworkIds: Set<string>;
  likedArtworkIds: Set<string>;
  isMuted: boolean;
  isGuidedTour: boolean;
  isFullscreen: boolean;
  onSetJoystickVector: (v: { x: number; y: number }) => void;
  onRotateCameraSnap: (angleDelta: number) => void;
  onCenterView: () => void;
  onZoomStep: (deltaFov: number) => void;
  onSelectArtwork: (artwork: Artwork) => void;
  onOpenLightbox: (artwork: Artwork) => void;
  onOpenInquiry: (artwork: Artwork) => void;
  onToggleLike: (id: string) => void;
  onClearFocus: () => void;
  onSelectRoomIndex: (index: number) => void;
  onToggleMute: () => void;
  onToggleGuidedTour: () => void;
  onToggleFullscreen: () => void;
  onSwitchTo2D?: () => void;
  onOpenMinimap: () => void;
}

export function Mobile3DControls({
  exhibition,
  roomConfigs,
  currentRoomIndex,
  currentRoomConfig,
  focusedArtwork,
  focusedSlot,
  aimedArtwork,
  aimedSlot,
  viewedArtworkIds,
  likedArtworkIds,
  isMuted,
  isGuidedTour,
  isFullscreen,
  onSetJoystickVector,
  onRotateCameraSnap,
  onCenterView,
  onZoomStep,
  onSelectArtwork,
  onOpenLightbox,
  onOpenInquiry,
  onToggleLike,
  onClearFocus,
  onSelectRoomIndex,
  onToggleMute,
  onToggleGuidedTour,
  onToggleFullscreen,
  onSwitchTo2D,
  onOpenMinimap,
}: Mobile3DControlsProps) {
  const { lang } = useLanguage();
  const [showRoomDrawer, setShowRoomDrawer] = useState(false);
  const [showGestureTip, setShowGestureTip] = useState(true);

  // Auto-hide gesture hint after 4.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowGestureTip(false), 4500);
    return () => clearTimeout(timer);
  }, []);

  // -------------------------------------------------------------
  // Virtual Analog Joystick State & Touch Handlers
  // -------------------------------------------------------------
  const joystickBaseRef = useRef<HTMLDivElement | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isJoystickActive, setIsJoystickActive] = useState(false);
  const joystickTouchIdRef = useRef<number | null>(null);
  const joystickCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const maxRadius = 42; // Joystick max deflection radius in pixels

  const handleJoystickTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    const touch = e.touches[0];
    if (!touch || !joystickBaseRef.current) return;

    const rect = joystickBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    joystickCenterRef.current = { x: centerX, y: centerY };
    joystickTouchIdRef.current = touch.identifier;
    setIsJoystickActive(true);

    updateJoystickPosition(touch.clientX, touch.clientY);
  };

  const handleJoystickTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (joystickTouchIdRef.current === null) return;
    const touch = Array.from(e.touches).find((t) => t.identifier === joystickTouchIdRef.current);
    if (touch) {
      updateJoystickPosition(touch.clientX, touch.clientY);
    }
  };

  const handleJoystickTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    setIsJoystickActive(false);
    joystickTouchIdRef.current = null;
    setKnobPos({ x: 0, y: 0 });
    onSetJoystickVector({ x: 0, y: 0 });
  };

  const updateJoystickPosition = (clientX: number, clientY: number) => {
    const dx = clientX - joystickCenterRef.current.x;
    const dy = clientY - joystickCenterRef.current.y;
    const dist = Math.hypot(dx, dy);

    const clampedDist = Math.min(dist, maxRadius);
    const angle = Math.atan2(dy, dx);

    const knobX = Math.cos(angle) * clampedDist;
    const knobY = Math.sin(angle) * clampedDist;

    setKnobPos({ x: knobX, y: knobY });

    // Output normalized velocity: Y is inverted (up is positive forward)
    const normX = knobX / maxRadius;
    const normY = -(knobY / maxRadius);

    onSetJoystickVector({ x: normX, y: normY });
  };

  // -------------------------------------------------------------
  // Artwork Navigation (Next / Prev Artwork in room)
  // -------------------------------------------------------------
  const roomArtworks: Artwork[] = currentRoomConfig.slots
    .filter((s: CalculatedArtworkSlot): s is CalculatedArtworkSlot & { artwork: Artwork } => Boolean(s.artwork))
    .map((s) => s.artwork);

  const currentArtIndex = focusedArtwork
    ? roomArtworks.findIndex((a: Artwork) => a.id === focusedArtwork.id)
    : -1;

  const handlePrevArtwork = () => {
    if (roomArtworks.length === 0) return;
    const nextIdx = currentArtIndex <= 0 ? roomArtworks.length - 1 : currentArtIndex - 1;
    onSelectArtwork(roomArtworks[nextIdx]);
  };

  const handleNextArtwork = () => {
    if (roomArtworks.length === 0) return;
    const nextIdx = currentArtIndex >= roomArtworks.length - 1 ? 0 : currentArtIndex + 1;
    onSelectArtwork(roomArtworks[nextIdx]);
  };

  const currentRoomTitle = currentRoomConfig.isCornerPavilion
    ? (currentRoomConfig.pavilionTitle || 'Corner Pavilion')
    : `โถงที่ ${currentRoomIndex + 1}`;

  return (
    <div className="sm:hidden pointer-events-none select-none z-30 fixed inset-0 flex flex-col justify-between overflow-hidden">
      {/* 1. TOP MOBILE FLOATING CAPSULE BAR */}
      <div className="pointer-events-auto pt-3 px-3 w-full flex items-center justify-between gap-2 z-40">
        {/* Left: Room Selector Pill */}
        <button
          onClick={() => setShowRoomDrawer(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#161310]/80 backdrop-blur-xl border border-[#D9B878]/40 text-xs font-bold text-[#FFD98A] shadow-lg active:scale-95 transition-all"
        >
          <span className="text-[10px] text-[#D9B878]">🏛️</span>
          <span>{currentRoomTitle}</span>
          <span className="text-[10px] opacity-70">▼</span>
        </button>

        {/* Right: Quick Action Controls Pill */}
        <div className="flex items-center gap-1 bg-[#161310]/80 backdrop-blur-xl border border-[#D9B878]/30 p-1 rounded-full shadow-lg">
          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-full transition-all ${
              !isMuted ? 'text-[#FFD98A] bg-[#D9B878]/20' : 'text-neutral-400 hover:text-white'
            }`}
            title={isMuted ? 'เปิดเสียงบรรยากาศ' : 'ปิดเสียง'}
          >
            {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Guided Tour Toggle */}
          <button
            onClick={onToggleGuidedTour}
            className={`p-1.5 rounded-full transition-all ${
              isGuidedTour ? 'text-[#FFD98A] bg-[#D9B878]/30 animate-pulse' : 'text-neutral-400 hover:text-white'
            }`}
            title={isGuidedTour ? 'หยุดทัวร์อัตโนมัติ' : 'เริ่มทัวร์อัตโนมัติ'}
          >
            {isGuidedTour ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Minimap Button */}
          <button
            onClick={onOpenMinimap}
            className="p-1.5 rounded-full text-[#FFD98A] hover:bg-white/10 transition-all"
            title="เปิดผังห้องนิทรรศการ"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 transition-all"
            title="เปิดโหมดเต็มจอ"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Switch to 2D */}
          {onSwitchTo2D && (
            <button
              onClick={onSwitchTo2D}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#8B1B1B] text-white hover:bg-[#A32020] transition-all ml-0.5"
              title="สลับไปมุมมอง 2D"
            >
              2D
            </button>
          )}
        </div>
      </div>

      {/* 2. GESTURE GUIDE HINT TOAST */}
      {showGestureTip && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-auto bg-[#161310]/85 backdrop-blur-xl border border-[#D9B878]/40 px-3.5 py-1.5 rounded-full text-[11px] font-medium text-[#FFD98A] shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <span>👆 ปาดนิ้วหมุนรอบทิศ • 🕹️ เลื่อนจอยเพื่อเดิน • 🖼️ แตะที่ภาพเพื่อชม</span>
          <button onClick={() => setShowGestureTip(false)} className="text-white/60 hover:text-white">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. FOCUSED ARTWORK BOTTOM CARD (When standing near or inspecting an artwork) */}
      {focusedArtwork && (
        <div className="pointer-events-auto mx-3 mb-20 z-40 bg-[#161310]/90 backdrop-blur-2xl border border-[#D9B878]/50 rounded-2xl p-3 text-white shadow-2xl space-y-2 animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#D9B878] bg-[#D9B878]/15 px-1.5 py-0.5 rounded border border-[#D9B878]/30">
                  {currentArtIndex >= 0 ? `#${currentArtIndex + 1}` : 'PLATE'}
                </span>
                {focusedArtwork.artist?.country && (
                  <CountryFlag country={focusedArtwork.artist.country} className="w-3.5 h-2.5 shrink-0" />
                )}
                <span className="text-xs font-bold text-neutral-200 truncate">
                  {focusedArtwork.artist?.name || 'Artist'}
                </span>
              </div>
              <h3 className="font-serif text-sm font-bold text-[#FAF8F5] truncate">
                {focusedArtwork.title}
              </h3>
              <p className="text-[10px] text-neutral-400 truncate">
                {focusedArtwork.medium} • {formatDimensionsInCm(focusedArtwork.dimensions, lang)}
              </p>
            </div>

            <button
              onClick={onClearFocus}
              className="p-1 rounded-full bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20"
              title="ปิดมุมมองภาพนี้ / เดินชมต่อ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center justify-between gap-1.5 pt-0.5">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onOpenLightbox(focusedArtwork)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#D9B878] text-black font-bold rounded-xl text-xs shadow transition-all active:scale-95"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>ซูม 4K</span>
              </button>

              <button
                onClick={() => onToggleLike(focusedArtwork.id)}
                className={`p-2 rounded-xl border transition-all active:scale-95 ${
                  likedArtworkIds.has(focusedArtwork.id)
                    ? 'bg-rose-600/30 text-rose-400 border-rose-500/50'
                    : 'bg-white/10 text-white/80 border-white/20'
                }`}
                title="ถูกใจผลงานนี้"
              >
                <Heart
                  className={`w-3.5 h-3.5 ${likedArtworkIds.has(focusedArtwork.id) ? 'fill-rose-500 text-rose-500' : ''}`}
                />
              </button>

              <button
                onClick={() => onOpenInquiry(focusedArtwork)}
                className="p-2 rounded-xl bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 active:scale-95"
                title="สอบถามข้อมูลผลงาน"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Prev / Next Artwork Jump Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevArtwork}
                className="p-2 rounded-xl bg-white/10 text-white/90 border border-white/20 active:scale-95"
                title="ภาพก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleNextArtwork}
                className="p-2 rounded-xl bg-white/10 text-white/90 border border-white/20 active:scale-95"
                title="ภาพถัดไป"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN THUMB-FRIENDLY BOTTOM CONTROLS (JOYSTICK + CAMERA BUTTONS) */}
      <div className="pointer-events-none w-full px-4 pb-4 flex items-end justify-between z-30">
        
        {/* LEFT: Fluid Touch Virtual Analog Joystick */}
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className={`pointer-events-auto relative w-28 h-28 rounded-full border-2 flex items-center justify-center backdrop-blur-md shadow-2xl transition-colors ${
            isJoystickActive
              ? 'bg-[#D9B878]/25 border-[#FFD98A]'
              : 'bg-[#161310]/60 border-[#D9B878]/40 hover:border-[#FFD98A]'
          }`}
          style={{ touchAction: 'none' }}
          title="จอยสติ๊กควบคุมการเดิน 360°"
        >
          {/* Inner direction indicators */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <span className="text-[10px] font-mono font-bold text-[#FFD98A] absolute top-1.5">▲ W</span>
            <span className="text-[10px] font-mono font-bold text-[#FFD98A] absolute bottom-1.5">▼ S</span>
            <span className="text-[10px] font-mono font-bold text-[#FFD98A] absolute left-1.5">◀ A</span>
            <span className="text-[10px] font-mono font-bold text-[#FFD98A] absolute right-1.5">D ▶</span>
          </div>

          {/* Floating Analog Knob */}
          <div
            className={`w-12 h-12 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform ${
              isJoystickActive
                ? 'bg-[#FFD98A] border-white text-black scale-105'
                : 'bg-[#D9B878]/80 border-[#FFF] text-black'
            }`}
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="w-3 h-3 rounded-full bg-black/50" />
          </div>
        </div>

        {/* RIGHT: Quick Rotation Snap & Center View Buttons */}
        <div className="pointer-events-auto flex flex-col items-end gap-2.5">
          {/* Top Row: Turn 45 Left / Center View / Turn 45 Right */}
          <div className="flex items-center gap-1.5 bg-[#161310]/75 backdrop-blur-xl p-1.5 rounded-2xl border border-[#D9B878]/35 shadow-xl">
            {/* Turn 45° Left */}
            <button
              onClick={() => onRotateCameraSnap(Math.PI / 4)}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#D9B878]/30 active:bg-[#D9B878] active:text-black text-[#FFD98A] flex items-center justify-center active:scale-95 transition-all"
              title="หันซ้าย 45°"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Center Eye-Level View */}
            <button
              onClick={onCenterView}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#D9B878]/30 active:bg-[#D9B878] active:text-black text-[#FFD98A] flex items-center justify-center active:scale-95 transition-all"
              title="รีเซ็ตมองตรงกลางห้อง"
            >
              <span className="text-xs font-bold font-mono">🎯</span>
            </button>

            {/* Turn 45° Right */}
            <button
              onClick={() => onRotateCameraSnap(-Math.PI / 4)}
              className="w-10 h-10 rounded-xl bg-white/10 hover:bg-[#D9B878]/30 active:bg-[#D9B878] active:text-black text-[#FFD98A] flex items-center justify-center active:scale-95 transition-all"
              title="หันขวา 45°"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Row: Next/Prev Artwork Quick Jump Buttons */}
          <div className="flex items-center gap-1.5 bg-[#161310]/75 backdrop-blur-xl p-1.5 rounded-2xl border border-[#D9B878]/35 shadow-xl">
            <button
              onClick={handlePrevArtwork}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#D9B878]/30 active:bg-[#D9B878] active:text-black text-[#FFD98A] text-xs font-bold flex items-center gap-1 active:scale-95 transition-all"
              title="เดินไปดูภาพก่อนหน้า"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>ภาพก่อน</span>
            </button>

            <button
              onClick={handleNextArtwork}
              className="px-2.5 py-1.5 rounded-xl bg-[#D9B878] text-black text-xs font-bold flex items-center gap-1 active:scale-95 shadow transition-all"
              title="เดินไปดูภาพถัดไป"
            >
              <span>ภาพถัดไป</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. MOBILE ROOM SELECTOR DRAWER MODAL */}
      {showRoomDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="bg-[#161310]/95 backdrop-blur-2xl border border-[#D9B878]/40 rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 w-full max-w-md text-white shadow-2xl space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏛️</span>
                <h3 className="font-serif text-base font-bold text-[#FAF8F5]">
                  เลือกห้องจัดแสดง (Exhibition Halls)
                </h3>
              </div>
              <button
                onClick={() => setShowRoomDrawer(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {roomConfigs.map((room: RoomGeometryConfig, idx: number) => {
                const isCurrent = idx === currentRoomIndex;
                const artsCount = room.slots.filter((s: CalculatedArtworkSlot) => s.artwork).length;
                const roomTitle = room.isCornerPavilion
                  ? (room.pavilionTitle || 'Corner Pavilion')
                  : `โถงที่ ${idx + 1}`;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      onSelectRoomIndex(idx);
                      setShowRoomDrawer(false);
                    }}
                    className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                      isCurrent
                        ? 'bg-[#D9B878]/20 border-[#D9B878] text-[#FFD98A] shadow-md'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 text-neutral-300'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>{roomTitle}</span>
                        {isCurrent && (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#D9B878] text-black font-bold">
                            ห้องปัจจุบัน
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-neutral-400">
                        {artsCount} ผลงาน • ซุ้มประตูโค้งเชื่อมต่อ
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-[#D9B878]" />
                  </button>
                );
              })}
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => {
                  setShowRoomDrawer(false);
                  onOpenMinimap();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#D9B878] hover:underline"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>เปิดดูผังนิทรรศการรวม (Minimap Radar)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
