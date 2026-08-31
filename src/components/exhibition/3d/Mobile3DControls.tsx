'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  RotateCw,
  Heart,
  Maximize2,
  Minimize2,
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
  const [showMobileArtworkDock, setShowMobileArtworkDock] = useState(false);
  const [showGestureTip, setShowGestureTip] = useState(true);

  // Auto-hide gesture hint after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowGestureTip(false), 3500);
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

  const maxRadius = 34; // Compact ergonomic deflection radius

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
    <div className="md:hidden pointer-events-none select-none z-30 fixed inset-0 flex flex-col justify-between overflow-hidden">
      
      {/* 1. TOP MOBILE FLOATING CAPSULE BAR */}
      <div
        className="pointer-events-auto w-full px-2.5 pt-2 flex items-center justify-between gap-1.5 z-40"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top, 0.5rem))' }}
      >
        {/* Left: Back to 2D & Room Selector Pill */}
        <div className="flex items-center gap-1">
          {onSwitchTo2D && (
            <button
              onClick={onSwitchTo2D}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#161310]/85 backdrop-blur-xl border border-[#D9B878]/40 text-xs font-bold text-[#FFD98A] shadow-lg active:scale-95 transition-all"
              title="สลับไปมุมมอง 2D"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-[#D9B878]" />
              <span>2D</span>
            </button>
          )}

          <button
            onClick={() => setShowRoomDrawer(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#161310]/85 backdrop-blur-xl border border-[#D9B878]/40 text-xs font-bold text-[#FFD98A] shadow-lg active:scale-95 transition-all truncate max-w-[130px]"
          >
            <span className="text-[10px] text-[#D9B878]">🏛️</span>
            <span className="truncate">{currentRoomTitle}</span>
            <span className="text-[9px] opacity-70">▼</span>
          </button>

          {/* Quick Artwork Dock Drawer Toggle */}
          <button
            onClick={() => setShowMobileArtworkDock(true)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-[#161310]/85 backdrop-blur-xl border border-[#D9B878]/40 text-xs font-bold text-[#FFD98A] shadow-lg active:scale-95 transition-all"
            title="เปิดแถบดูผลงานทั้งหมดในห้องนี้"
          >
            <span>🖼️</span>
            <span className="text-[10px] font-mono font-bold text-[#D9B878]">{roomArtworks.length}</span>
          </button>
        </div>

        {/* Right: Quick Action Controls Pill */}
        <div className="flex items-center gap-0.5 bg-[#161310]/85 backdrop-blur-xl border border-[#D9B878]/35 p-1 rounded-full shadow-lg">
          {/* Sound Toggle */}
          <button
            onClick={onToggleMute}
            className={`p-1.5 rounded-full transition-all active:scale-95 ${
              !isMuted ? 'text-[#FFD98A] bg-[#D9B878]/25' : 'text-neutral-400'
            }`}
            title={isMuted ? 'เปิดเสียงบรรยากาศ' : 'ปิดเสียง'}
          >
            {!isMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Guided Tour Toggle */}
          <button
            onClick={onToggleGuidedTour}
            className={`p-1.5 rounded-full transition-all active:scale-95 ${
              isGuidedTour ? 'text-[#FFD98A] bg-[#D9B878]/30 animate-pulse' : 'text-neutral-400'
            }`}
            title={isGuidedTour ? 'หยุดทัวร์อัตโนมัติ' : 'เริ่มทัวร์อัตโนมัติ'}
          >
            {isGuidedTour ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Minimap Button */}
          <button
            onClick={onOpenMinimap}
            className="p-1.5 rounded-full text-[#FFD98A] hover:bg-white/10 active:scale-95 transition-all"
            title="เปิดผังห้องนิทรรศการ"
          >
            <Compass className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={onToggleFullscreen}
            className="p-1.5 rounded-full text-neutral-300 hover:text-white active:scale-95 transition-all"
            title="เปิดโหมดเต็มจอ"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 2. GESTURE GUIDE HINT TOAST */}
      {showGestureTip && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-40 pointer-events-auto bg-[#161310]/90 backdrop-blur-xl border border-[#D9B878]/40 px-3 py-1.5 rounded-full text-[11px] font-medium text-[#FFD98A] shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 max-w-[92vw] truncate">
          <span className="truncate">👆 ปาดนิ้วเพื่อหมุน • 🕹️ เลื่อนจอยเพื่อเดิน • แตะภาพเพื่อชม</span>
          <button onClick={() => setShowGestureTip(false)} className="text-white/60 hover:text-white shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3. FOCUSED ARTWORK BOTTOM CARD */}
      {focusedArtwork && (
        <div className="pointer-events-auto mx-2.5 mb-2 z-40 bg-[#161310]/95 backdrop-blur-2xl border border-[#D9B878]/50 rounded-2xl p-2.5 text-white shadow-2xl space-y-2 animate-in fade-in slide-in-from-bottom-2 max-w-[96vw]">
          <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-1.5">
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
              <h3 className="font-serif text-sm font-bold text-[#FAF8F5] truncate leading-tight">
                {focusedArtwork.title}
              </h3>
              <p className="text-[10px] text-neutral-400 truncate">
                {focusedArtwork.medium} {focusedArtwork.dimensions ? `• ${formatDimensionsInCm(focusedArtwork.dimensions, lang)}` : ''}
              </p>
            </div>

            <button
              onClick={onClearFocus}
              className="p-1.5 rounded-full bg-white/10 text-neutral-300 hover:text-white hover:bg-white/20 active:scale-95 shrink-0"
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
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#D9B878] hover:bg-[#FFD98A] text-black font-bold rounded-xl text-xs shadow transition-all active:scale-95"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                <span>ซูม 4K</span>
              </button>

              <button
                onClick={() => onToggleLike(focusedArtwork.id)}
                className={`p-1.5 px-2 rounded-xl border transition-all active:scale-95 ${
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
                className="p-1.5 px-2 rounded-xl bg-white/10 text-white/80 border border-white/20 hover:bg-white/20 active:scale-95"
                title="สอบถามข้อมูลผลงาน"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Prev / Next Artwork Jump Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevArtwork}
                className="px-2 py-1.5 rounded-xl bg-white/10 text-white/90 border border-white/20 active:scale-95 text-[11px] font-medium flex items-center gap-0.5"
                title="ภาพก่อนหน้า"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>ก่อน</span>
              </button>
              <button
                onClick={handleNextArtwork}
                className="px-2 py-1.5 rounded-xl bg-[#D9B878]/20 text-[#FFD98A] border border-[#D9B878]/40 active:scale-95 text-[11px] font-bold flex items-center gap-0.5"
                title="ภาพถัดไป"
              >
                <span>ถัดไป</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAIN THUMB-FRIENDLY BOTTOM CONTROLS (JOYSTICK + CAMERA BUTTONS) */}
      <div
        className="pointer-events-none w-full px-3 pb-2.5 flex items-end justify-between z-30"
        style={{ paddingBottom: 'max(0.6rem, env(safe-area-inset-bottom, 0.6rem))' }}
      >
        
        {/* LEFT: Compact Ergonomic Analog Joystick */}
        <div
          ref={joystickBaseRef}
          onTouchStart={handleJoystickTouchStart}
          onTouchMove={handleJoystickTouchMove}
          onTouchEnd={handleJoystickTouchEnd}
          onTouchCancel={handleJoystickTouchEnd}
          className={`pointer-events-auto relative w-20 h-20 rounded-full border-2 flex items-center justify-center backdrop-blur-md shadow-2xl transition-colors shrink-0 ${
            isJoystickActive
              ? 'bg-[#D9B878]/30 border-[#FFD98A] shadow-[0_0_15px_rgba(255,217,138,0.4)]'
              : 'bg-[#161310]/70 border-[#D9B878]/40'
          }`}
          style={{ touchAction: 'none' }}
          title="จอยสติ๊กควบคุมการเดิน 360°"
        >
          {/* Inner subtle direction indicators */}
          <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
            <span className="text-[8px] font-mono font-bold text-[#FFD98A] absolute top-1">▲</span>
            <span className="text-[8px] font-mono font-bold text-[#FFD98A] absolute bottom-1">▼</span>
            <span className="text-[8px] font-mono font-bold text-[#FFD98A] absolute left-1">◀</span>
            <span className="text-[8px] font-mono font-bold text-[#FFD98A] absolute right-1">▶</span>
          </div>

          {/* Floating Analog Knob */}
          <div
            className={`w-9 h-9 rounded-full border flex items-center justify-center shadow-lg transition-transform ${
              isJoystickActive
                ? 'bg-[#FFD98A] border-white scale-110'
                : 'bg-[#D9B878] border-[#FFF]'
            }`}
            style={{
              transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
              transition: isJoystickActive ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-black/40" />
          </div>
        </div>

        {/* RIGHT: Quick Rotation Snap & Center View Buttons */}
        <div className="pointer-events-auto flex items-center gap-1 bg-[#161310]/85 backdrop-blur-xl p-1 rounded-2xl border border-[#D9B878]/35 shadow-xl shrink-0">
          {/* Turn 45° Left */}
          <button
            onClick={() => onRotateCameraSnap(Math.PI / 4)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#D9B878]/30 active:bg-[#D9B878] active:text-black text-[#FFD98A] flex items-center justify-center active:scale-95 transition-all"
            title="หันซ้าย 45°"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Center Eye-Level View */}
          <button
            onClick={onCenterView}
            className="w-9 h-9 rounded-xl bg-[#D9B878]/20 hover:bg-[#D9B878]/40 active:bg-[#D9B878] active:text-black text-[#FFD98A] flex items-center justify-center active:scale-95 transition-all font-bold"
            title="รีเซ็ตมองตรงกึ่งกลางห้อง"
          >
            <span className="text-xs">🎯</span>
          </button>

          {/* Turn 45° Right */}
          <button
            onClick={() => onRotateCameraSnap(-Math.PI / 4)}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-[#D9B878]/30 active:bg-[#D9B878] active:text-black text-[#FFD98A] flex items-center justify-center active:scale-95 transition-all"
            title="หันขวา 45°"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5. MOBILE ROOM SELECTOR DRAWER MODAL */}
      {showRoomDrawer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/70 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="bg-[#161310]/95 backdrop-blur-2xl border-t border-[#D9B878]/40 rounded-t-3xl p-5 w-full text-white shadow-2xl space-y-3 max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="text-sm">🏛️</span>
                <h3 className="font-serif text-sm font-bold text-[#FAF8F5]">
                  เลือกห้องจัดแสดง (Exhibition Halls)
                </h3>
              </div>
              <button
                onClick={() => setShowRoomDrawer(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 active:scale-95"
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
                    className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all active:scale-98 ${
                      isCurrent
                        ? 'bg-[#D9B878]/25 border-[#D9B878] text-[#FFD98A] shadow-md'
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

            <div className="pt-1 text-center">
              <button
                onClick={() => {
                  setShowRoomDrawer(false);
                  onOpenMinimap();
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[#D9B878] hover:underline active:scale-95"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>เปิดดูผังนิทรรศการรวม (Minimap Radar)</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* 6. MOBILE ARTWORK DOCK DRAWER MODAL */}
      {showMobileArtworkDock && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 bg-black/75 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="bg-[#161310]/95 backdrop-blur-2xl border-t border-[#D9B878]/40 rounded-t-3xl p-4 w-full text-white shadow-2xl space-y-3 max-h-[75vh] overflow-y-auto animate-in slide-in-from-bottom-5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">🖼️</span>
                <div>
                  <h3 className="font-serif text-sm font-bold text-[#FAF8F5]">
                    {currentRoomTitle}: ผลงานจัดแสดง ({roomArtworks.length} ชิ้น)
                  </h3>
                  <p className="text-[10px] text-neutral-400">
                    แตะที่รูปเพื่อเดินชมผลงานชิ้นนั้นโดยตรง
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileArtworkDock(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-300 active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Grid of Artworks */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 py-1 max-h-[50vh] overflow-y-auto pr-1">
              {currentRoomConfig.slots
                .filter((s: CalculatedArtworkSlot) => s.artwork)
                .map((slot: CalculatedArtworkSlot) => {
                  if (!slot.artwork) return null;
                  const isSelected = focusedArtwork?.id === slot.artwork.id;
                  const isViewed = viewedArtworkIds.has(slot.artwork.id);
                  const art = slot.artwork;

                  return (
                    <button
                      key={slot.slotIndex}
                      onClick={() => {
                        onSelectArtwork(art);
                        setShowMobileArtworkDock(false);
                      }}
                      className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all active:scale-95 text-left bg-[#1A1714] ${
                        isSelected
                          ? 'border-[#FFD98A] ring-2 ring-[#D9B878] shadow-[0_0_12px_rgba(255,217,138,0.5)]'
                          : isViewed
                          ? 'border-[#D9B878]/50 opacity-90'
                          : 'border-white/15 opacity-75'
                      }`}
                    >
                      <div className="relative aspect-square w-full bg-[#121110]">
                        {art.imageUrl ? (
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#D9B878]">
                            #{slot.slotIndex + 1}
                          </div>
                        )}
                        {isViewed && (
                          <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#FFD98A] ring-1.5 ring-black shadow" />
                        )}
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-[2px] text-[9px] font-mono font-bold text-[#FFD98A]">
                          #{slot.slotIndex + 1}
                        </div>
                      </div>
                      <div className="p-1.5 space-y-0.5">
                        <div className="text-[10px] font-serif font-bold text-[#FAF8F5] truncate leading-tight">
                          {art.title}
                        </div>
                        <div className="text-[9px] text-[#C5A880] truncate">
                          {art.artist?.name || 'Artist'}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
