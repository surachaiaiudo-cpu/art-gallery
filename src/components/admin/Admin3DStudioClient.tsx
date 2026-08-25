'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Exhibition, Artwork } from '@/types/exhibition';
import { RoomShape, LightPreset, CalculatedArtworkSlot } from '@/components/exhibition/3d/types';
import { buildMultiRoomConfigs } from '@/components/exhibition/3d/RoomArchitect';
import {
  Box,
  Shapes,
  Sun,
  Layers,
  Save,
  Eye,
  ArrowLeftRight,
  Trash2,
  Image as ImageIcon,
  FolderPlus,
  Compass,
  Building,
  Check,
  Plus,
  Minus,
  Sparkles,
  ExternalLink,
  Move,
  Maximize2,
} from 'lucide-react';

interface Admin3DStudioClientProps {
  initialExhibitions: Exhibition[];
}

export function Admin3DStudioClient({ initialExhibitions }: Admin3DStudioClientProps) {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>(initialExhibitions);
  const [selectedExhId, setSelectedExhId] = useState<string>(
    initialExhibitions[0]?.id || ''
  );

  const [projectionMode, setProjectionMode] = useState<'elevation' | 'floorplan'>('elevation');
  const [selectedRoomIndex, setSelectedRoomIndex] = useState<number>(0);
  const [selectedWallIndex, setSelectedWallIndex] = useState<number>(0);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [swapTargetIndex, setSwapTargetIndex] = useState<number | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedExhibition = useMemo(() => {
    return exhibitions.find((e) => e.id === selectedExhId) || exhibitions[0];
  }, [exhibitions, selectedExhId]);

  // Initial Theme Config
  const initialThemeConfig = useMemo(() => {
    if (selectedExhibition?.themeConfig) {
      try {
        return typeof selectedExhibition.themeConfig === 'string'
          ? JSON.parse(selectedExhibition.themeConfig)
          : selectedExhibition.themeConfig;
      } catch {}
    }
    return {
      roomShapes: ['SQUARE', 'RECTANGLE', 'L_SHAPE', 'CIRCULAR'] as RoomShape[],
      lightPreset: 'warm' as LightPreset,
      spotlightIntensity: 2.0,
      ceilingHeight: 8.5,
      enable3D: true,
    };
  }, [selectedExhibition]);

  const [roomShapes, setRoomShapes] = useState<RoomShape[]>(
    initialThemeConfig.roomShapes || ['SQUARE', 'RECTANGLE', 'L_SHAPE', 'CIRCULAR']
  );
  const [lightPreset, setLightPreset] = useState<LightPreset>(
    initialThemeConfig.lightPreset || 'warm'
  );
  const shapeLabels: Record<string, string> = {
    SQUARE: 'จัตุรัส',
    RECTANGLE: 'ผืนผ้า',
    L_SHAPE: 'ตัว L',
    CIRCULAR: 'ทรงกลม',
  };

  const [artworksList, setArtworksList] = useState<Artwork[]>(
    selectedExhibition?.artworks || []
  );
  const [showBlueprintThumbnails, setShowBlueprintThumbnails] = useState(true);

  // Sync state when switching exhibition
  React.useEffect(() => {
    if (selectedExhibition) {
      setArtworksList(selectedExhibition.artworks || []);
      if (selectedExhibition.themeConfig) {
        try {
          const parsed = typeof selectedExhibition.themeConfig === 'string'
            ? JSON.parse(selectedExhibition.themeConfig)
            : selectedExhibition.themeConfig;
          if (parsed.roomShapes) setRoomShapes(parsed.roomShapes);
          if (parsed.lightPreset) setLightPreset(parsed.lightPreset);
        } catch {}
      }
    }
  }, [selectedExhibition]);

  // Calculate Multi-room Blueprint Layout
  const roomConfigs = useMemo(() => {
    return buildMultiRoomConfigs(artworksList, roomShapes);
  }, [artworksList, roomShapes]);

  const currentRoom = roomConfigs[selectedRoomIndex] || roomConfigs[0];

  // Smart Wall Grouping (Zero-Scrollbar Architecture: 4-6 groups max)
  const wallGroups = useMemo(() => {
    if (!currentRoom) return [];

    if (currentRoom.shape === 'CIRCULAR') {
      // Group circular rotunda into 4 quadrant arcs (5 slots each)
      return [
        {
          index: 0,
          name: 'ส่วนโค้งทิศเหนือ (North Arc 0° - 90°)',
          shortName: 'ส่วนโค้งทิศเหนือ',
          slots: currentRoom.slots.slice(0, 5),
        },
        {
          index: 1,
          name: 'ส่วนโค้งทิศตะวันออก (East Arc 90° - 180°)',
          shortName: 'ส่วนโค้งตะวันออก',
          slots: currentRoom.slots.slice(5, 10),
        },
        {
          index: 2,
          name: 'ส่วนโค้งทิศใต้ (South Arc 180° - 270°)',
          shortName: 'ส่วนโค้งทิศใต้',
          slots: currentRoom.slots.slice(10, 15),
        },
        {
          index: 3,
          name: 'ส่วนโค้งทิศตะวันตก (West Arc 270° - 360°)',
          shortName: 'ส่วนโค้งตะวันตก',
          slots: currentRoom.slots.slice(15, 20),
        },
      ];
    }

    // Default map-based grouping for Square, Rectangle, L-Shape
    const map = new Map<string, CalculatedArtworkSlot[]>();
    currentRoom.slots.forEach((slot) => {
      if (!map.has(slot.wallName)) {
        map.set(slot.wallName, []);
      }
      map.get(slot.wallName)!.push(slot);
    });
    return Array.from(map.entries()).map(([name, slots], idx) => ({
      index: idx,
      name,
      shortName: name.split(' (')[0],
      slots,
    }));
  }, [currentRoom]);

  // Ensure active wall index is valid
  const safeWallIndex = selectedWallIndex >= wallGroups.length ? 0 : selectedWallIndex;
  const activeWall = wallGroups[safeWallIndex] || wallGroups[0];
  const activeSelectedArtwork = selectedSlotIndex !== null ? artworksList[selectedSlotIndex] : null;

  // Swap Handler
  const handleSlotClick = (slotIndex: number) => {
    if (swapTargetIndex === null) {
      setSelectedSlotIndex(slotIndex);
      // Auto switch to that wall quadrant if in elevation
      const foundGroupIdx = wallGroups.findIndex((g) =>
        g.slots.some((s) => s.slotIndex === slotIndex)
      );
      if (foundGroupIdx !== -1) {
        setSelectedWallIndex(foundGroupIdx);
      }
    } else {
      // Execute swap
      const updated = [...artworksList];
      const artA = updated[swapTargetIndex];
      const artB = updated[slotIndex];

      updated[swapTargetIndex] = artB;
      updated[slotIndex] = artA;

      setArtworksList(updated);
      if (selectedExhibition) selectedExhibition.artworks = updated;
      setSwapTargetIndex(null);
      setSelectedSlotIndex(slotIndex);
    }
  };

  // Remove Artwork from Slot
  const handleRemoveArtwork = (slotIndex: number) => {
    const updated = [...artworksList];
    updated[slotIndex] = null as any;
    setArtworksList(updated);
    if (selectedExhibition) selectedExhibition.artworks = updated;
  };

  // Assign from Bank
  const handleAssignArtwork = (art: Artwork) => {
    if (selectedSlotIndex === null) return;
    const updated = [...artworksList];

    // Avoid duplicate
    const existingIdx = updated.findIndex((a) => a && a.id === art.id);
    if (existingIdx !== -1) {
      updated[existingIdx] = updated[selectedSlotIndex];
    }

    updated[selectedSlotIndex] = art;
    setArtworksList(updated);
    if (selectedExhibition) selectedExhibition.artworks = updated;
  };

  // Save Settings
  const handleSave = async () => {
    if (!selectedExhibition) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updatedConfig = {
        ...initialThemeConfig,
        roomShapes,
        lightPreset,
        enable3D: true,
      };

      await fetch(`/api/admin/exhibitions/${selectedExhibition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedExhibition,
          themeConfig: JSON.stringify(updatedConfig),
          roomShapes,
          lightPreset,
        }),
      });

      const reorderedPayload = artworksList
        .filter(Boolean)
        .map((art, idx) => ({
          artworkId: art.id,
          displayOrder: idx + 1,
        }));

      if (reorderedPayload.length > 0) {
        await fetch(`/api/admin/exhibitions/${selectedExhibition.id}/artworks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artworks: reorderedPayload }),
        });
      }

      // Update local state in memory
      setExhibitions((prev) =>
        prev.map((e) =>
          e.id === selectedExhibition.id
            ? { ...e, themeConfig: JSON.stringify(updatedConfig), artworks: artworksList }
            : e
        )
      );

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (e) {
      console.error('Error saving 3D studio settings:', e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full w-full bg-[#F4F1EA] text-[#1E1D1B] flex flex-col overflow-hidden font-sans select-none">
      {/* 1. TOP HEADER TOOLBAR (Height 56px, Zero Page Scroll) */}
      <header className="h-14 bg-[#FAF8F5] border-b border-[#E5E0D8] px-5 flex items-center justify-between shrink-0 shadow-sm">
        {/* Left: Brand & Exhibition Selector */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#8C6D3F]/10 text-[#8C6D3F] border border-[#8C6D3F]/30 flex items-center justify-center font-bold shadow-sm">
              <Box className="w-4 h-4" />
            </div>
            <div>
              <span className="font-serif font-bold text-xs text-[#1E1D1B] tracking-wider uppercase block">
                ภาพฉายผังห้อง 3D
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-[#DDD7CC]" />

          {/* Exhibition Dropdown */}
          <div className="flex items-center space-x-1.5 bg-[#F0ECE1] px-2.5 py-1 rounded-xl border border-[#DCD5C9] text-xs shadow-inner">
            <span className="text-[#8C6D3F] font-bold text-[11px]">นิทรรศการ:</span>
            <select
              value={selectedExhId}
              onChange={(e) => setSelectedExhId(e.target.value)}
              className="bg-transparent text-[#1E1D1B] font-semibold focus:outline-none cursor-pointer max-w-[200px] truncate text-xs"
            >
              {exhibitions.map((exh) => (
                <option key={exh.id} value={exh.id} className="bg-white text-[#1E1D1B]">
                  {exh.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: Mode Switcher with Bubble Tooltips */}
        <div className="flex items-center bg-[#EAE6DE] p-0.5 rounded-xl border border-[#D5CFC4] text-xs font-semibold shadow-inner">
          <div className="relative group">
            <button
              onClick={() => setProjectionMode('elevation')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                projectionMode === 'elevation'
                  ? 'bg-[#1E1D1B] text-[#FAF8F5] shadow-md font-bold'
                  : 'text-[#68635B] hover:text-[#1E1D1B]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>รูปด้านผนัง (Elevation)</span>
            </button>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              จัดวางและสลับลำดับภาพบนผนังแต่ละด้าน
            </span>
          </div>

          <div className="relative group">
            <button
              onClick={() => setProjectionMode('floorplan')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                projectionMode === 'floorplan'
                  ? 'bg-[#1E1D1B] text-[#FAF8F5] shadow-md font-bold'
                  : 'text-[#68635B] hover:text-[#1E1D1B]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>แปลนห้อง (Floor Plan)</span>
            </button>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              มุมมองผังพื้น 2D Blueprint แบบสถาปัตยกรรม
            </span>
          </div>
        </div>

        {/* Right: Actions with Bubble Tooltips */}
        <div className="flex items-center space-x-2">
          {selectedExhibition && (
            <div className="relative group">
              <Link
                href={`/exhibitions/${selectedExhibition.slug}?mode=3d`}
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#F5F2EC] text-[#1E1D1B] border border-[#DDD7CC] text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Eye className="w-3.5 h-3.5 text-[#8C6D3F]" />
                <span className="hidden md:inline">เปิดดู 3D จริง</span>
              </Link>
              <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                เปิดห้องจัดแสดง 3D จริงในแท็บใหม่
              </span>
            </div>
          )}

          <div className="relative group">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-xl bg-[#8C6D3F] hover:bg-[#785C32] text-white text-xs font-bold flex items-center space-x-1.5 shadow-md transition-all disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>บันทึกแล้ว!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกผัง 3D'}</span>
                </>
              )}
            </button>
            <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              บันทึกการจัดผังและตำแหน่งภาพลงฐานข้อมูล
            </span>
          </div>
        </div>
      </header>

      {/* 2. SUB-BAR: REDESIGNED CLEAN MENU (Height 48px, Zero Scrollbars) */}
      <div className="h-12 bg-[#F0ECE1] border-b border-[#E0DBD0] px-5 flex items-center justify-between shrink-0 shadow-sm">
        {/* Left: Rooms & Shape with Bubble Tooltips */}
        <div className="flex items-center space-x-2">
          {/* Room Selector Dropdown */}
          <div className="relative group">
            <div className="flex items-center space-x-1.5 text-xs bg-white px-2.5 py-1 rounded-xl border border-[#DDD7CC] shadow-sm">
              <Building className="w-3.5 h-3.5 text-[#8C6D3F]" />
              <span className="text-[#68635B] font-bold text-[11px]">ห้อง:</span>
              <select
                value={selectedRoomIndex}
                onChange={(e) => {
                  setSelectedRoomIndex(Number(e.target.value));
                  setSelectedWallIndex(0);
                  setSelectedSlotIndex(null);
                }}
                className="bg-transparent text-[#1E1D1B] font-bold focus:outline-none cursor-pointer text-xs"
              >
                {roomConfigs.map((r, i) => r.isCornerPavilion ? (
                  <option key={i} value={i} disabled className="bg-neutral-100 text-neutral-400">
                    🏛️ โถงพักเชื่อมมุม {r.pavilionTitle || String.fromCharCode(65 + i)}
                  </option>
                ) : (
                  <option key={i} value={i}>
                    ห้องจัดแสดง #{(r.exhibitionRoomIndex ?? i) + 1} • {r.slots.filter(s => s.artwork).length} ผลงาน
                  </option>
                ))}
              </select>
            </div>
            <span className="pointer-events-none absolute -bottom-8 left-0 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              เลือกห้องจัดแสดงที่ต้องการจัดการ
            </span>
          </div>

          <div className="h-4 w-px bg-[#DDD7CC] mx-1" />

          {/* Architecture Layout Badge */}
          <div className="relative group">
            <div className="flex items-center space-x-1.5 text-xs bg-white px-2.5 py-1 rounded-xl border border-[#DDD7CC] shadow-sm">
              <span className="text-[#68635B] font-medium text-[11px]">ผังห้อง:</span>
              <span className="text-[#8C6D3F] font-bold text-xs">
                แกลเลอรีมาตรฐาน (14×32ม.)
              </span>
            </div>
            <span className="pointer-events-none absolute -bottom-8 left-0 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              สถาปัตยกรรมแกลเลอรีเชื่อมต่อแบบวนขวาทุก 3 ห้อง (Modular Cloister Circuit)
            </span>
          </div>

          <div className="h-4 w-px bg-[#DDD7CC] mx-1" />

          {/* Light Preset Dropdown */}
          <div className="relative group">
            <div className="flex items-center space-x-1.5 text-xs">
              <Sun className="w-3.5 h-3.5 text-[#8C6D3F]" />
              <select
                value={lightPreset}
                onChange={(e) => setLightPreset(e.target.value as LightPreset)}
                className="bg-white text-[#1E1D1B] font-medium px-2 py-0.5 rounded-lg border border-[#D5CFC4] focus:outline-none cursor-pointer shadow-sm text-xs"
              >
                <option value="warm">💡 Warm Museum</option>
                <option value="daylight">☀️ Daylight</option>
                <option value="dramatic">🎭 Dramatic</option>
                <option value="cool">❄️ Cool Minimal</option>
              </select>
            </div>
            <span className="pointer-events-none absolute -bottom-8 left-0 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              ปรับระบบแสงไฟบรรยากาศประจำนิทรรศการ
            </span>
          </div>
        </div>

        {/* Right: Wall Tabs (Zero scrollbar, Clean compact buttons) */}
        {projectionMode === 'elevation' && (
          <div className="flex items-center space-x-1 bg-white/80 p-0.5 rounded-xl border border-[#DDD7CC] text-xs shadow-inner">
            <span className="text-[#8C6D3F] text-[10px] px-2 font-mono font-bold whitespace-nowrap">ผนัง:</span>
            {wallGroups.map((w, wIdx) => (
              <div key={w.name} className="relative group">
                <button
                  onClick={() => {
                    setSelectedWallIndex(wIdx);
                    setSelectedSlotIndex(null);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all text-xs whitespace-nowrap ${
                    safeWallIndex === wIdx
                      ? 'bg-[#8C6D3F] text-white shadow-sm font-bold'
                      : 'text-[#68635B] hover:text-[#1E1D1B] hover:bg-[#F4F1EA]'
                  }`}
                >
                  <span>{w.shortName}</span>
                  <span className="ml-1 opacity-80 font-mono text-[10px]">({w.slots.length})</span>
                </button>
                <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                  {w.name} ({w.slots.length} ผลงาน)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. MAIN WORKSPACE (FITS 100% IN VIEWPORT - ZERO PAGE SCROLL) */}
      <div className="flex-1 grid grid-cols-12 gap-0 overflow-hidden">
        {/* LEFT / CENTER: ARCHITECTURAL BLUEPRINT CANVAS (Col 8) */}
        <div className="col-span-8 bg-[#EBE7DF] p-5 flex flex-col justify-between border-r border-[#DCD5C9] relative overflow-hidden">
          {/* Blueprint Info Watermark */}
          <div className="flex items-center justify-between text-xs text-[#68635B] pb-1.5 border-b border-[#DCD5C9]">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-[#8C6D3F] font-bold uppercase tracking-wider text-[11px]">
                {projectionMode === 'elevation' ? 'ELEVATION (รูปด้านผนัง)' : 'BLUEPRINT (แปลนพื้น)'}
              </span>
              <span>|</span>
              <span className="font-medium text-xs truncate max-w-[280px]">
                {projectionMode === 'elevation'
                  ? `${activeWall?.name} (${activeWall?.slots.length || 0} ผลงาน)`
                  : 'แปลนพื้นสถาปัตยกรรม (Top-Down Floorplan)'}
              </span>
            </div>

            <div className="flex items-center space-x-3 font-mono text-[10px] text-[#7A756D]">
              <span>ระดับสายตา: 2.20 m</span>
              <span>•</span>
              <span>เพดาน: 8.50 m</span>
            </div>
          </div>

          {/* Swap Indicator Pill */}
          {swapTargetIndex !== null && (
            <div className="my-1.5 p-2 bg-amber-100 border border-amber-400 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-pulse shadow-sm">
              <span className="flex items-center font-bold">
                <ArrowLeftRight className="w-3.5 h-3.5 mr-1.5 text-amber-700" />
                โหมดสลับตำแหน่ง: กำลังเลือก Slot #{swapTargetIndex + 1} — คลิกที่ช่องใดก็ได้เพื่อสลับ
              </span>
              <button
                onClick={() => setSwapTargetIndex(null)}
                className="px-2 py-0.5 bg-amber-800 hover:bg-amber-900 rounded text-[10px] text-white font-bold"
              >
                ยกเลิก
              </button>
            </div>
          )}

          {/* ---------------- PROJECTION MODE: ELEVATION VIEW ---------------- */}
          {projectionMode === 'elevation' && (
            <div className="flex-1 flex flex-col justify-center my-auto py-2 overflow-hidden">
              {/* Wall Frame Schematic Border */}
              <div className="relative w-full h-[330px] bg-[#FAF8F5] rounded-2xl border-2 border-[#D5CFC4] shadow-md p-3.5 flex flex-col justify-between overflow-hidden">
                {/* Ceiling Line */}
                <div className="flex items-center justify-between text-[9px] font-mono text-[#8C857B] border-b border-[#E2DDD3] pb-1 shrink-0">
                  <span className="flex items-center space-x-2">
                    <span className="font-bold text-[#8C6D3F]">▲ เพดานแกลเลอรี (CEILING 8.5m)</span>
                    <span className="text-[#A59582]">◀ ทางเข้าห้อง (Entrance)</span>
                  </span>
                  <span className="flex items-center space-x-2">
                    <span className="text-[#A59582]">ทางออกสู่ห้องถัดไป (Exit) ▶</span>
                    <span>รางไฟสปอตไลต์ 35° TRACK LIGHTS</span>
                  </span>
                </div>

                {/* Eye Level Guide Line (Y = 2.2m) */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-[#8C6D3F]/30 border-t border-dashed border-[#8C6D3F]/50 pointer-events-none z-0">
                  <span className="absolute -top-3 left-6 text-[9px] font-mono text-[#8C6D3F] uppercase font-bold">
                    ── เส้นระดับสายตามาตรฐาน (EYE-LEVEL 2.2m) ──
                  </span>
                </div>

                {/* 10 Artwork Slots along the 32m Wall (Horizontal Panorama) */}
                <div className="relative z-10 flex items-center h-full px-2 gap-3 overflow-x-auto overflow-y-hidden py-1">
                  {activeWall?.slots.map((slot) => {
                    const isSelected = selectedSlotIndex === slot.slotIndex;
                    const isSwapTarget = swapTargetIndex === slot.slotIndex;
                    const art = artworksList[slot.slotIndex] || null;

                    return (
                      <div
                        key={slot.slotIndex}
                        onClick={() => handleSlotClick(slot.slotIndex)}
                        className={`relative w-[138px] shrink-0 h-[220px] rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between p-2 shadow-sm ${
                          isSwapTarget
                            ? 'bg-amber-100 border-amber-500 ring-4 ring-amber-400 shadow-xl scale-105'
                            : isSelected
                            ? 'bg-[#FAF6EE] border-[#8C6D3F] shadow-lg ring-2 ring-[#8C6D3F]/60 scale-102'
                            : 'bg-white border-[#DDD7CC] hover:border-[#8C6D3F] hover:bg-[#FBF9F6]'
                        }`}
                      >
                        {/* Slot Badge */}
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#1E1D1B] text-[#FAF8F5]">
                            #{slot.slotIndex + 1}
                          </span>
                          <span className="text-[8px] text-[#7A756D] font-mono font-medium truncate max-w-[70px]">
                            {art ? (art.dimensions?.split(' ')[0] || '100cm') : 'ว่าง (Empty)'}
                          </span>
                        </div>

                        {/* Mounted Artwork Visual Frame */}
                        {art ? (
                          <div className="my-auto flex flex-col items-center">
                            <div className="relative w-full h-24 rounded-lg overflow-hidden bg-black border border-[#D5CFC4] shadow-sm group">
                              {art.imageUrl ? (
                                <img
                                  src={art.imageUrl}
                                  alt={art.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="w-full mt-1.5 text-center">
                              <h5 className="text-[10px] font-bold text-[#1E1D1B] truncate px-1" title={art.title}>
                                {art.title}
                              </h5>
                              <p className="text-[9px] text-[#8C6D3F] font-medium truncate">
                                {art.artist?.name || 'Artist'}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="my-auto flex flex-col items-center justify-center text-center p-2 border-2 border-dashed border-[#D5CFC4] rounded-lg bg-[#F8F6F0]">
                            <FolderPlus className="w-5 h-5 text-[#A8A29E] mb-1" />
                            <span className="text-[9px] text-[#57534E] font-bold">ช่องว่าง</span>
                            <span className="text-[7px] text-[#8C857B]">คลิกเพื่อเลือกภาพ</span>
                          </div>
                        )}

                        {/* Base Placard */}
                        <div className="w-full h-2.5 bg-[#EAE6DE] rounded border border-[#D5CFC4] flex items-center justify-center">
                          <span className="text-[6px] text-[#68635B] tracking-widest font-mono font-bold">MUSEUM PLACARD</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Floor Line */}
                <div className="flex items-center justify-between text-[9px] font-mono text-[#8C857B] border-t border-[#E2DDD3] pt-1 shrink-0">
                  <span>▼ พื้นหินขัด TERRAZZO (Y = 0.0m)</span>
                  <span className="text-[#8C6D3F] font-bold">ความยาวผนัง: 32.0 เมตร (10 สล็อต)</span>
                  <span>บัวเชิงผนัง (0.15m)</span>
                </div>
              </div>
            </div>
          )}

          {/* ---------------- PROJECTION MODE: ACCURATE ARCHITECTURAL 2D FLOOR PLAN ---------------- */}
          {projectionMode === 'floorplan' && (
            <div className="flex-1 flex flex-col justify-center items-center my-auto py-1">
              {/* Dedicated Blueprint Header Toolbar (Outside canvas to prevent any overlap) */}
              <div className="w-[620px] mb-2 flex items-center justify-between shrink-0">
                <div className="flex items-center space-x-1.5 bg-white px-3 py-1 rounded-xl border border-[#DDD7CC] text-[#1E1D1B] shadow-sm">
                  <Building className="w-3.5 h-3.5 text-[#8C6D3F]" />
                  <span className="text-xs font-bold">
                    {currentRoom?.isCornerPavilion
                      ? '🏛️ โถงพักประติมากรรม (14×14 ม.)'
                      : `ผังห้องจัดแสดง #${(currentRoom?.exhibitionRoomIndex ?? selectedRoomIndex) + 1} (14×32 ม.)`}
                  </span>
                </div>

                {/* Thumbnail Preview Toggle Button */}
                {!currentRoom?.isCornerPavilion && (
                  <button
                    onClick={() => setShowBlueprintThumbnails(!showBlueprintThumbnails)}
                    className="px-3 py-1 rounded-xl bg-white hover:bg-[#FAF8F5] text-[#8C6D3F] border border-[#DDD7CC] text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
                    title="สลับโหมดแสดงภาพตัวอย่าง / แสดงเฉพาะหมายเลข"
                  >
                    <span>{showBlueprintThumbnails ? '🖼️ แสดงรูปภาพ' : '🔢 เฉพาะตัวเลข'}</span>
                  </button>
                )}
              </div>

              {/* Blueprint Frame Container */}
              <div className="relative w-[620px] h-[345px] bg-[#FAF8F5] rounded-2xl border-2 border-[#D5CFC4] shadow-md p-2 flex items-center justify-center select-none">
                {/* SVG ARCHITECTURAL BLUEPRINT */}
                <svg viewBox="0 0 560 330" className="w-full h-full">
                  {/* Grid background */}
                  <defs>
                    <pattern id="archGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#EAE5DC" strokeWidth="0.8" />
                    </pattern>
                  </defs>
                  <rect width="560" height="330" fill="url(#archGrid)" />

                  {/* 1. CORNER PAVILION BLUEPRINT (14x14m) */}
                  {currentRoom?.isCornerPavilion ? (
                    <g transform="translate(185, 65)">
                      {/* Floor */}
                      <rect x="0" y="0" width="190" height="190" fill="#F4EFE6" stroke="#8C6D3F" strokeWidth="3" rx="4" />
                      
                      {/* Central Skylight & Sculpture Pedestal */}
                      <rect x="65" y="65" width="60" height="60" fill="#EDE6DA" stroke="#D9B878" strokeWidth="1.5" strokeDasharray="3,3" rx="4" />
                      <rect x="80" y="80" width="30" height="30" fill="#3B2D1F" stroke="#D9B878" strokeWidth="1.5" rx="3" />
                      <text x="95" y="98" fill="#FFD98A" fontSize="9" fontWeight="bold" textAnchor="middle">🏛️</text>

                      {/* Plants at corners */}
                      <circle cx="20" cy="20" r="10" fill="#4A6B3C" opacity="0.8" />
                      <circle cx="20" cy="170" r="10" fill="#4A6B3C" opacity="0.8" />

                      {/* Front Entrance Door (Bottom) */}
                      <rect x="75" y="186" width="40" height="8" fill="#FAF8F5" stroke="#FAF8F5" strokeWidth="2" />
                      <path d="M 75 190 Q 75 165, 115 165" fill="none" stroke="#8C6D3F" strokeWidth="1.2" strokeDasharray="2,2" />
                      <text x="95" y="206" fill="#8C6D3F" fontSize="8" fontWeight="bold" textAnchor="middle">▼ ทางเข้า (Entrance)</text>

                      {/* Right Exit Door (Right wall - 90 deg turn) */}
                      <rect x="186" y="75" width="8" height="40" fill="#FAF8F5" stroke="#FAF8F5" strokeWidth="2" />
                      <path d="M 190 75 Q 165 75, 165 115" fill="none" stroke="#8C6D3F" strokeWidth="1.2" strokeDasharray="2,2" />
                      <text x="210" y="98" fill="#8C6D3F" fontSize="8" fontWeight="bold">▶ เลี้ยวขวา (Next Hall)</text>

                      {/* Room Label */}
                      <text x="95" y="45" fill="#68635B" fontSize="10" fontWeight="bold" textAnchor="middle">
                        โถงพักเชื่อมมุมอาคาร (14×14 ม.)
                      </text>
                    </g>
                  ) : (
                    /* 2. STANDARD EXHIBITION GALLERY HALL (14x32m, 20 Slots with Side Wings) */
                    <g>
                      {/* Room Floor (X: 225 to 335, Y: 28 to 298) */}
                      <rect x="225" y="28" width="110" height="270" fill="#F4EFE6" rx="4" />

                      {/* Left & Right Structural Walls */}
                      <line x1="225" y1="28" x2="225" y2="298" stroke="#4A3E31" strokeWidth="3.5" />
                      <line x1="335" y1="28" x2="335" y2="298" stroke="#4A3E31" strokeWidth="3.5" />

                      {/* Top Wall with Doorway Opening (X: 268 to 292) */}
                      <line x1="225" y1="28" x2="268" y2="28" stroke="#4A3E31" strokeWidth="3.5" />
                      <line x1="292" y1="28" x2="335" y2="28" stroke="#4A3E31" strokeWidth="3.5" />
                      {/* Top Door Swing */}
                      <path d="M 268 28 Q 268 46, 292 46" fill="none" stroke="#8C6D3F" strokeWidth="1" strokeDasharray="2,2" />
                      <text x="280" y="20" fill="#8C6D3F" fontSize="7.5" fontWeight="bold" textAnchor="middle">▲ ประตูสู่ห้องถัดไป</text>

                      {/* Bottom Wall with Doorway Opening (X: 268 to 292) */}
                      <line x1="225" y1="298" x2="268" y2="298" stroke="#4A3E31" strokeWidth="3.5" />
                      <line x1="292" y1="298" x2="335" y2="298" stroke="#4A3E31" strokeWidth="3.5" />
                      {/* Bottom Door Swing */}
                      <path d="M 268 298 Q 268 280, 292 280" fill="none" stroke="#8C6D3F" strokeWidth="1" strokeDasharray="2,2" />
                      <text x="280" y="312" fill="#8C6D3F" fontSize="7.5" fontWeight="bold" textAnchor="middle">▼ ประตูทางเข้า</text>

                      {/* 2 Central Gallery Benches (3.0m x 0.95m) */}
                      <rect x="266" y="95" width="28" height="13" rx="2" fill="#3B2D1F" stroke="#8C6D3F" strokeWidth="1" />
                      <text x="280" y="104" fill="#FFD98A" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">BENCH 1</text>

                      <rect x="266" y="215" width="28" height="13" rx="2" fill="#3B2D1F" stroke="#8C6D3F" strokeWidth="1" />
                      <text x="280" y="224" fill="#FFD98A" fontSize="6" fontFamily="monospace" fontWeight="bold" textAnchor="middle">BENCH 2</text>

                      {/* 4 Corner Potted Plants */}
                      <circle cx="236" cy="38" r="5" fill="#4A6B3C" opacity="0.85" />
                      <circle cx="324" cy="38" r="5" fill="#4A6B3C" opacity="0.85" />
                      <circle cx="236" cy="288" r="5" fill="#4A6B3C" opacity="0.85" />
                      <circle cx="324" cy="288" r="5" fill="#4A6B3C" opacity="0.85" />

                      {/* 2 Pedestal Sculptures */}
                      <rect x="296" y="62" width="8" height="8" rx="1" fill="#DEDBD4" stroke="#8A6A34" strokeWidth="0.8" />
                      <text x="300" y="69" fontSize="5" textAnchor="middle">🏛️</text>

                      <rect x="256" y="252" width="8" height="8" rx="1" fill="#DEDBD4" stroke="#8A6A34" strokeWidth="0.8" />
                      <text x="260" y="259" fontSize="5" textAnchor="middle">🏛️</text>

                      {/* Center Room Dimensions Watermark */}
                      <text x="280" y="163" fill="#A89F91" fontSize="13" fontWeight="bold" opacity="0.2" textAnchor="middle">
                        14m × 32m
                      </text>

                      {/* Architectural Leader Lines and Pin Dots for 10 Rows */}
                      {Array.from({ length: 10 }).map((_, row) => {
                        const svgY = 46 + (9 - row) * 26.4;
                        return (
                          <g key={`leader-${row}`}>
                            {/* Left Wall Leader Line & Pin Dot */}
                            <line x1="198" y1={svgY} x2="225" y2={svgY} stroke="#C5A880" strokeWidth="0.9" strokeDasharray="2,2" />
                            <circle cx="225" cy={svgY} r="2.5" fill="#8C6D3F" stroke="#FAF8F5" strokeWidth="0.8" />

                            {/* Right Wall Leader Line & Pin Dot */}
                            <line x1="335" y1={svgY} x2="362" y2={svgY} stroke="#C5A880" strokeWidth="0.9" strokeDasharray="2,2" />
                            <circle cx="335" cy={svgY} r="2.5" fill="#8C6D3F" stroke="#FAF8F5" strokeWidth="0.8" />
                          </g>
                        );
                      })}
                    </g>
                  )}
                </svg>

                {/* INTERACTIVE CLICKABLE 20 SLOTS BADGES & THUMBNAILS IN OUTER WINGS */}
                {!currentRoom?.isCornerPavilion && currentRoom?.slots.map((slot, i) => {
                  const isSelected = selectedSlotIndex === slot.slotIndex;
                  const art = artworksList[slot.slotIndex];
                  const side = i % 2 === 0 ? -1 : 1; // -1: Left Wing, 1: Right Wing
                  const row = Math.floor(i / 2); // 0 to 9 from front to back

                  // SVG container is 620px x 345px, SVG viewBox is 560 x 330
                  // Card center in SVG: Left Wing X = 118, Right Wing X = 442
                  const svgCardX = side === -1 ? 118 : 442;
                  const svgY = 46 + (9 - row) * 26.4;

                  const leftPx = (svgCardX / 560) * 620;
                  const topPx = (svgY / 330) * 345;

                  return (
                    <div
                      key={slot.slotIndex}
                      onClick={() => handleSlotClick(slot.slotIndex)}
                      style={{ left: `${leftPx}px`, top: `${topPx}px` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer z-30 group hover:z-50 ${
                        isSelected ? 'scale-105 z-40' : 'hover:scale-105'
                      }`}
                    >
                      {showBlueprintThumbnails ? (
                        /* Extended Visual Wing Card with Thumbnail, Badge & Title */
                        <div
                          className={`w-[145px] h-[24px] px-1.5 py-0.5 rounded-lg border shadow-sm flex items-center justify-between text-[9px] transition-all bg-white ${
                            isSelected
                              ? 'border-[#8C6D3F] ring-2 ring-[#8C6D3F]/50 bg-[#1E1D1B] text-white shadow-md'
                              : art
                              ? 'border-[#DDD7CC] hover:border-[#8C6D3F] text-[#1E1D1B] hover:bg-[#FAF8F5]'
                              : 'border-dashed border-[#D5CFC4] text-[#A59582] bg-white/70'
                          }`}
                        >
                          {side === -1 ? (
                            /* Left Wall Slot Layout: [Thumbnail/Empty] [Title] [Badge #1] */
                            <>
                              <div className="flex items-center space-x-1.5 overflow-hidden">
                                {art?.imageUrl ? (
                                  <img
                                    src={art.imageUrl}
                                    alt={art.title}
                                    className="w-4 h-4 rounded object-cover shrink-0 shadow-inner"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded border border-dashed border-[#C5A880] flex items-center justify-center shrink-0 text-[8px] text-[#A59582]">
                                    +
                                  </div>
                                )}
                                <span className="truncate max-w-[82px] font-medium leading-none">
                                  {art?.title || 'ว่าง (Empty)'}
                                </span>
                              </div>
                              <span className={`font-mono font-bold text-[8px] px-1 py-0.5 rounded ${isSelected ? 'bg-[#8C6D3F] text-white' : 'bg-[#F0ECE1] text-[#8C6D3F]'}`}>
                                #{slot.slotIndex + 1}
                              </span>
                            </>
                          ) : (
                            /* Right Wall Slot Layout: [Badge #2] [Title] [Thumbnail/Empty] */
                            <>
                              <span className={`font-mono font-bold text-[8px] px-1 py-0.5 rounded ${isSelected ? 'bg-[#8C6D3F] text-white' : 'bg-[#F0ECE1] text-[#8C6D3F]'}`}>
                                #{slot.slotIndex + 1}
                              </span>
                              <div className="flex items-center space-x-1.5 overflow-hidden justify-end">
                                <span className="truncate max-w-[82px] font-medium leading-none text-right">
                                  {art?.title || 'ว่าง (Empty)'}
                                </span>
                                {art?.imageUrl ? (
                                  <img
                                    src={art.imageUrl}
                                    alt={art.title}
                                    className="w-4 h-4 rounded object-cover shrink-0 shadow-inner"
                                  />
                                ) : (
                                  <div className="w-4 h-4 rounded border border-dashed border-[#C5A880] flex items-center justify-center shrink-0 text-[8px] text-[#A59582]">
                                    +
                                  </div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        /* Compact Badge Mode */
                        <div
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] font-mono font-bold shadow-sm ${
                            isSelected
                              ? 'bg-[#1E1D1B] text-[#FAF8F5] border-[#8C6D3F] ring-3 ring-[#8C6D3F]/50 scale-115'
                              : art
                              ? 'bg-[#8C6D3F] text-white border-white hover:scale-115'
                              : 'bg-white text-[#7A756D] border-[#D5CFC4] hover:border-[#8C6D3F]'
                          }`}
                        >
                          #{slot.slotIndex + 1}
                        </div>
                      )}

                      {/* Popout Rollover Card to Side (Horizontal Popout - Zero Vertical Overlap) */}
                      <div
                        className={`pointer-events-none absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 whitespace-nowrap ${
                          side === -1 ? 'left-full ml-3 flex-row' : 'right-full mr-3 flex-row-reverse'
                        }`}
                      >
                        {/* Pointer Arrow */}
                        <div
                          className={`w-2.5 h-2.5 bg-[#1A1918]/95 rotate-45 border-white/20 shrink-0 z-10 ${
                            side === -1
                              ? '-mr-1.5 border-l border-b'
                              : '-ml-1.5 border-r border-t'
                          }`}
                        />

                        {/* Card Body */}
                        <div className="bg-[#1A1918]/95 text-white p-3 rounded-2xl border border-white/20 shadow-2xl flex items-center space-x-3 backdrop-blur-md min-w-[210px]">
                          {art?.imageUrl ? (
                            <img
                              src={art.imageUrl}
                              alt={art.title}
                              className="w-12 h-12 rounded-xl object-cover border border-white/20 shadow-md shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white/50 text-xs shrink-0 font-bold">
                              ว่าง
                            </div>
                          )}

                          <div className="text-left">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#8C6D3F] text-white shrink-0">
                                สล็อต #{slot.slotIndex + 1}
                              </span>
                              <span className="text-[10px] text-[#FFD98A] font-bold truncate max-w-[150px]">
                                {art?.title || 'ช่องว่าง (Empty Slot)'}
                              </span>
                            </div>
                            <div className="text-[9px] text-neutral-300 mt-0.5">
                              {art?.artist?.name ? `ศิลปิน: ${art.artist.name}` : `${side === -1 ? 'ผนังฝั่งซ้าย' : 'ผนังฝั่งขวา'} แถวที่ ${row + 1}`}
                            </div>
                            {art?.medium && (
                              <div className="text-[8px] text-[#C5A880] mt-0.5">
                                เทคนิค: {art.medium}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Bottom Quick Help */}
          <div className="text-[10px] text-[#68635B] flex items-center justify-between pt-1.5 border-t border-[#DCD5C9]">
            <span>💡 คลิกที่สล็อตภาพเพื่อเลือก/แก้ไข หรือกดสลับช่องเพื่อย้ายตำแหน่ง</span>
            <span className="font-mono text-[#8C6D3F] font-bold">
              ความจุห้อง: {currentRoom?.slots.filter(s => artworksList[s.slotIndex]).length} / 20 ชิ้น
            </span>
          </div>
        </div>

        {/* RIGHT: CURATOR INSPECTOR & ARTWORK BANK (Col 4 - Zero page scroll) */}
        <div className="col-span-4 bg-[#FAF8F5] p-4 flex flex-col justify-between overflow-hidden border-l border-[#E5E0D8]">
          {/* Top: Selected Slot Details & Inspector */}
          <div className="pb-3 border-b border-[#E2DDD3] shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C6D3F] flex items-center">
                <Layers className="w-3.5 h-3.5 mr-1" />
                รายละเอียดช่องแขวนภาพ
              </span>

              {selectedSlotIndex !== null && (
                <span className="text-[11px] font-mono font-bold text-white bg-[#8C6D3F] px-2 py-0.5 rounded-md shadow-sm">
                  Slot #{selectedSlotIndex + 1}
                </span>
              )}
            </div>

            {selectedSlotIndex !== null ? (
              <div className="bg-white p-3 rounded-xl border border-[#DDD7CC] space-y-2 text-xs shadow-sm">
                {activeSelectedArtwork ? (
                  <>
                    <div className="flex items-center space-x-2.5">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-black shrink-0 border border-[#D5CFC4] shadow-sm">
                        {activeSelectedArtwork.imageUrl && (
                          <img src={activeSelectedArtwork.imageUrl} alt={activeSelectedArtwork.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-bold text-[#1E1D1B] truncate text-xs">{activeSelectedArtwork.title}</h4>
                        <p className="text-[#8C6D3F] truncate text-[10px] font-medium">โดย {activeSelectedArtwork.artist?.name || 'ศิลปิน'}</p>
                        <p className="text-[#7A756D] text-[9px] font-mono">{activeSelectedArtwork.dimensions || '100x120 cm'}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-[#EAE6DE]">
                      <button
                        onClick={() => setSwapTargetIndex(selectedSlotIndex)}
                        className="py-1 px-2 rounded-lg bg-[#8C6D3F]/15 hover:bg-[#8C6D3F] text-[#8C6D3F] hover:text-white border border-[#8C6D3F]/30 text-[10px] font-bold flex items-center justify-center space-x-1 transition-all"
                      >
                        <ArrowLeftRight className="w-3 h-3" />
                        <span>สลับช่อง (Swap)</span>
                      </button>

                      <button
                        onClick={() => handleRemoveArtwork(selectedSlotIndex)}
                        className="py-1 px-2 rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 text-[10px] font-bold flex items-center justify-center space-x-1 transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>ปลดภาพออก</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-1.5 text-[#7A756D] text-[11px]">
                    <span>ช่องนี้ยังว่างอยู่ — เลือกภาพจากคลังด้านล่างเพื่อแขวน</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-3 rounded-xl border border-[#DDD7CC] text-center text-[11px] text-[#7A756D] shadow-sm">
                <span>คลิกเลือกช่องใดก็ได้บนภาพฉายผนังด้านซ้ายเพื่อจัดการ</span>
              </div>
            )}
          </div>

          {/* Bottom: Artwork Bank / Gallery Collection (Internal scroll inside box only) */}
          <div className="flex-1 flex flex-col overflow-hidden pt-2.5">
            <div className="flex items-center justify-between pb-1.5">
              <span className="text-[11px] font-bold text-[#1E1D1B] flex items-center">
                <FolderPlus className="w-3.5 h-3.5 text-[#8C6D3F] mr-1" />
                คลังผลงานศิลปะในนิทรรศการ
              </span>
              <span className="text-[9px] font-mono text-[#8C6D3F] font-bold">
                {selectedExhibition?.artworks?.length || 0} ชิ้น
              </span>
            </div>

            {/* Scrollable list inside container only */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 rounded-xl">
              {(selectedExhibition?.artworks || []).map((art) => {
                const assignedSlotIndex = artworksList.findIndex((a) => a && a.id === art.id);
                const isAssigned = assignedSlotIndex !== -1;

                return (
                  <div
                    key={art.id}
                    onClick={() => handleAssignArtwork(art)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs shadow-sm ${
                      isAssigned
                        ? 'bg-white border-[#DDD7CC] hover:border-[#8C6D3F]'
                        : 'bg-[#F5F1E8] border-[#8C6D3F]/50 hover:bg-[#FAF6EE] hover:border-[#8C6D3F]'
                    }`}
                  >
                    <div className="flex items-center space-x-2 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-black shrink-0 border border-[#D5CFC4]">
                        {art.imageUrl && (
                          <img src={art.imageUrl} alt={art.title} className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <h5 className="font-bold text-[#1E1D1B] truncate text-[10px]">{art.title}</h5>
                        <p className="text-[#8C6D3F] text-[9px] truncate font-medium">{art.artist?.name || 'Artist'}</p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      {isAssigned ? (
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#1E1D1B] text-[#FAF8F5]">
                          Slot #{assignedSlotIndex + 1}
                        </span>
                      ) : (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-[#8C6D3F] text-white shadow-sm">
                          + แขวนภาพ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
