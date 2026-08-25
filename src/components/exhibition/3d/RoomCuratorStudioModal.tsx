'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RoomShape, LightPreset, CalculatedArtworkSlot, RoomGeometryConfig } from './types';
import { Exhibition, Artwork } from '@/types/exhibition';
import {
  Shapes,
  Sun,
  Layers,
  Settings,
  Plus,
  Minus,
  Check,
  X,
  Eye,
  ArrowLeftRight,
  Sparkles,
  ExternalLink,
  Building,
  Image as ImageIcon,
} from 'lucide-react';

interface RoomCuratorStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  exhibition: Exhibition;
  roomConfigs: RoomGeometryConfig[];
  currentRoomIndex: number;
  onSelectRoomIndex: (index: number) => void;
  onAddRoom: () => void;
  onRemoveRoom: () => void;
  onChangeRoomShape: (shape: RoomShape) => void;
  lightPreset: LightPreset;
  onChangeLightPreset: (preset: LightPreset) => void;
  onSwapSlots: (slotIndexA: number, slotIndexB: number) => void;
  onFocusSlot: (slot: CalculatedArtworkSlot) => void;
}

export function RoomCuratorStudioModal({
  isOpen,
  onClose,
  exhibition,
  roomConfigs,
  currentRoomIndex,
  onSelectRoomIndex,
  onAddRoom,
  onRemoveRoom,
  onChangeRoomShape,
  lightPreset,
  onChangeLightPreset,
  onSwapSlots,
  onFocusSlot,
}: RoomCuratorStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'shape' | 'light' | 'walls' | 'admin'>('shape');
  const [selectedSwapSlot, setSelectedSwapSlot] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentRoom = roomConfigs[currentRoomIndex] || roomConfigs[0];

  // Group slots by wall
  const wallGroups: { [wallName: string]: CalculatedArtworkSlot[] } = {};
  if (currentRoom) {
    currentRoom.slots.forEach((slot) => {
      if (!wallGroups[slot.wallName]) {
        wallGroups[slot.wallName] = [];
      }
      wallGroups[slot.wallName].push(slot);
    });
  }

  const handleSlotClick = (slot: CalculatedArtworkSlot) => {
    if (selectedSwapSlot === null) {
      setSelectedSwapSlot(slot.slotIndex);
    } else if (selectedSwapSlot === slot.slotIndex) {
      setSelectedSwapSlot(null);
    } else {
      onSwapSlots(selectedSwapSlot, slot.slotIndex);
      setSelectedSwapSlot(null);
    }
  };

  const shapeOptions: Array<{ shape: RoomShape; title: string; desc: string; icon: string }> = [
    {
      shape: 'SQUARE',
      title: 'ทรงจัตุรัส (Square Pavilion)',
      desc: '22 × 22 ม. ผนัง 4 ทิศ ทิศละ 5 ภาพ เหมาะกับงานศิลปะชุดสมดุล 20 ชิ้น',
      icon: 'square',
    },
    {
      shape: 'RECTANGLE',
      title: 'ทรงผืนผ้า (Long Rectangle)',
      desc: '30 × 16 ม. ผนังยาว 7 ภาพ + ผนังสั้น 3 ภาพ เหมาะกับนิทรรศการพาโนรามา / Timeline',
      icon: 'rectangle-horizontal',
    },
    {
      shape: 'L_SHAPE',
      title: 'ทรงตัว L (L-Shape Gallery)',
      desc: 'ผังเลี้ยว 6 ส่วน แบ่งโซนเดิน เพิ่มบรรยากาศการค้นพบงานศิลปะ',
      icon: 'corner-down-right',
    },
    {
      shape: 'CIRCULAR',
      title: 'ทรงกลม (Circular Rotunda)',
      desc: 'รัศมี 11.5 ม. ผนังโค้ง 360° หมุนชมผลงานแบบรอบทิศทาง',
      icon: 'circle',
    },
  ];

  const lightOptions: Array<{ preset: LightPreset; title: string; desc: string; color: string }> = [
    {
      preset: 'warm',
      title: 'อบอุ่นคลาสสิก (Warm Museum)',
      desc: 'โทนแสงสีทองนวล 3000K ขับเน้นมิติทองคำเปลวและสีน้ำมัน',
      color: '#FFF2DC',
    },
    {
      preset: 'daylight',
      title: 'แสงธรรมชาติ (Daylight Atrium)',
      desc: 'แสงแดดธรรมชาติ 5000K ความเที่ยงตรงของสีสูง สีผลงานคมชัดแม่นยำ',
      color: '#FFFFFF',
    },
    {
      preset: 'dramatic',
      title: 'แสงดุดัน (Dramatic Spotlight)',
      desc: 'แสงเน้นคอนทราสต์ลึก สปอตไลต์ส่องเจาะจงผลงาน เงามืดคมชัด',
      color: '#B0A89C',
    },
    {
      preset: 'cool',
      title: 'โทนเย็นโมเดิร์น (Cool Minimal)',
      desc: 'แสงขาวอมฟ้า 6500K สไตล์หอศิลป์ร่วมสมัยสากล',
      color: '#E2E8F0',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 sm:p-6 animate-fade-in pointer-events-auto">
      <div className="bg-[#161310]/85 backdrop-blur-3xl w-full max-w-4xl max-h-[90vh] rounded-3xl p-6 sm:p-8 border border-[#D9B878]/35 shadow-[0_16px_60px_rgba(0,0,0,0.6)] flex flex-col justify-between overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D9B878]/15 flex items-center justify-center text-[#FFD98A] border border-[#D9B878]/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-bold text-white leading-snug">
                สตูดิโอจัดการห้องจัดแสดง 3D (3D Exhibition Curator Studio)
              </h3>
              <p className="text-xs text-[#C5A880]">
                ปรับแต่งรูปทรงห้อง, ระบบแสงเงา, และการจัดวางผลงานบนผนังแบบ Real-time
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-[#C5A880] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-2 pt-3 pb-2 border-b border-white/10 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveTab('shape')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'shape'
                ? 'bg-[#D9B878] text-black shadow-sm font-bold'
                : 'bg-white/5 text-[#C5A880] hover:bg-white/10'
            }`}
          >
            <Shapes className="w-4 h-4" />
            <span>1. ผังและรูปทรงห้อง ({currentRoom?.shape})</span>
          </button>

          <button
            onClick={() => setActiveTab('light')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'light'
                ? 'bg-[#D9B878] text-black shadow-sm font-bold'
                : 'bg-white/5 text-[#C5A880] hover:bg-white/10'
            }`}
          >
            <Sun className="w-4 h-4" />
            <span>2. ระบบแสงและบรรยากาศ ({lightPreset})</span>
          </button>

          <button
            onClick={() => setActiveTab('walls')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'walls'
                ? 'bg-[#D9B878] text-black shadow-sm font-bold'
                : 'bg-white/5 text-[#C5A880] hover:bg-white/10'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. จัดผังผนังแขวนภาพ (2D Elevation)</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-4 py-2 rounded-xl font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'admin'
                ? 'bg-[#D9B878] text-black shadow-sm font-bold'
                : 'bg-white/5 text-[#C5A880] hover:bg-white/10'
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            <span>4. ข้อมูลนิทรรศการ (Admin)</span>
          </button>
        </div>

        {/* Tab 1: Room Shapes & Number of Rooms */}
        {activeTab === 'shape' && (
          <div className="my-4 overflow-y-auto space-y-4 max-h-[56vh] pr-1">
            {/* Room Index Selector & Add/Remove */}
            <div className="p-4 bg-[#D9B878]/10 border border-[#D9B878]/25 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-[#FFD98A]">เลือกห้องที่ต้องการปรับแต่ง:</span>
                <select
                  value={currentRoomIndex}
                  onChange={(e) => onSelectRoomIndex(Number(e.target.value))}
                  className="px-3 py-1.5 bg-[#161310] border border-[#D9B878]/40 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-[#D9B878] shadow-sm cursor-pointer"
                >
                  {roomConfigs.map((r, i) => (
                    <option key={i} value={i} className="bg-[#161310] text-white">
                      {r.isCornerPavilion
                        ? `🏛️ โถงพักเชื่อมมุม ${r.pavilionTitle || String.fromCharCode(65 + i)}`
                        : `ห้องจัดแสดง #${(r.exhibitionRoomIndex ?? i) + 1} • ${r.slots.filter(s => s.artwork).length} ผลงาน`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-[#C5A880]">จำนวนห้องทั้งหมด:</span>
                <div className="flex items-center space-x-1 bg-black/40 border border-white/10 rounded-xl p-1 shadow-sm">
                  <button
                    onClick={onRemoveRoom}
                    disabled={roomConfigs.length <= 1}
                    className="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-bold text-xs px-2 text-[#FFD98A]">
                    {roomConfigs.length} ห้อง
                  </span>
                  <button
                    onClick={onAddRoom}
                    className="w-6 h-6 rounded-lg bg-[#D9B878]/20 hover:bg-[#D9B878]/40 text-[#FFD98A] font-bold flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Shape Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {shapeOptions.map((opt) => {
                const isSelected = currentRoom?.shape === opt.shape;
                return (
                  <div
                    key={opt.shape}
                    onClick={() => onChangeRoomShape(opt.shape)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#D9B878]/15 border-[#D9B878] shadow-lg ring-1 ring-[#FFD98A]'
                        : 'bg-white/5 border-white/10 hover:border-[#D9B878]/50 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-white">{opt.title}</h4>
                      {isSelected && (
                        <span className="px-2 py-0.5 bg-[#D9B878] text-black rounded-full text-[10px] font-bold flex items-center">
                          <Check className="w-3 h-3 mr-1" /> ใช้งานอยู่
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 font-light leading-relaxed mb-3">
                      {opt.desc}
                    </p>
                    <div className="text-[11px] font-mono text-[#FFD98A] font-semibold">
                      ความจุ: 20 ผลงาน / ผนังรอบห้อง
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Lighting Presets */}
        {activeTab === 'light' && (
          <div className="my-4 overflow-y-auto space-y-4 max-h-[56vh] pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {lightOptions.map((opt) => {
                const isSelected = lightPreset === opt.preset;
                return (
                  <div
                    key={opt.preset}
                    onClick={() => onChangeLightPreset(opt.preset)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#D9B878]/15 border-[#D9B878] shadow-lg ring-1 ring-[#FFD98A]'
                        : 'bg-white/5 border-white/10 hover:border-[#D9B878]/50 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-4 h-4 rounded-full border border-white/30"
                          style={{ backgroundColor: opt.color }}
                        />
                        <h4 className="text-sm font-bold text-white">{opt.title}</h4>
                      </div>
                      {isSelected && (
                        <span className="px-2 py-0.5 bg-[#D9B878] text-black rounded-full text-[10px] font-bold flex items-center">
                          <Check className="w-3 h-3 mr-1" /> ใช้งานอยู่
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 font-light leading-relaxed">
                      {opt.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Wall Elevation Curator */}
        {activeTab === 'walls' && (
          <div className="my-4 overflow-y-auto space-y-4 max-h-[56vh] pr-1">
            {selectedSwapSlot !== null && (
              <div className="p-3 bg-[#D9B878]/15 border border-[#D9B878]/40 rounded-2xl flex items-center justify-between text-xs text-[#FFD98A] animate-pulse">
                <span className="flex items-center font-medium">
                  <ArrowLeftRight className="w-4 h-4 mr-2 text-[#D9B878]" />
                  เลือกช่องเป้าหมายที่ต้องการสลับตำแหน่งกับ Slot #{selectedSwapSlot + 1}
                </span>
                <button
                  onClick={() => setSelectedSwapSlot(null)}
                  className="text-xs text-[#FFD98A] underline font-semibold hover:text-white"
                >
                  ยกเลิก
                </button>
              </div>
            )}

            {Object.entries(wallGroups).map(([wallName, slots]) => (
              <div key={wallName} className="p-4 bg-white/5 rounded-2xl border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#F4F3EE] flex items-center">
                    <Building className="w-3.5 h-3.5 text-[#D9B878] mr-1.5" />
                    {wallName}
                  </span>
                  <span className="text-[11px] text-[#C5A880] font-mono">
                    {slots.length} Slots
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {slots.map((slot) => {
                    const isSelected = selectedSwapSlot === slot.slotIndex;
                    const art = slot.artwork;

                    return (
                      <div
                        key={slot.slotIndex}
                        onClick={() => handleSlotClick(slot)}
                        className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#D9B878]/25 border-[#FFD98A] shadow-md ring-2 ring-[#D9B878]'
                            : 'bg-black/30 border-white/10 hover:border-[#D9B878]/50 hover:bg-black/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-mono font-bold text-[#FFD98A] bg-[#D9B878]/20 px-1.5 py-0.5 rounded-md border border-[#D9B878]/30">
                            #{slot.slotIndex + 1}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onFocusSlot(slot);
                              onClose();
                            }}
                            className="w-6 h-6 rounded-lg bg-white/10 hover:bg-[#D9B878]/20 flex items-center justify-center text-[#C5A880] hover:text-[#FFD98A] transition-colors"
                            title="ซูมกล้อง 3D ไปที่ภาพนี้"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {art ? (
                          <div className="space-y-1.5">
                            <div className="h-16 w-full rounded-lg bg-black/40 overflow-hidden relative flex items-center justify-center border border-white/10">
                              {art.imageUrl ? (
                                <img
                                  src={art.imageUrl}
                                  alt={art.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-[#C5A880]" />
                              )}
                            </div>
                            <div className="text-[11px] font-medium text-white truncate">
                              {art.title}
                            </div>
                            <div className="text-[10px] text-[#C5A880] truncate">
                              {art.artist?.name || 'Artist'}
                            </div>
                          </div>
                        ) : (
                          <div className="h-24 w-full rounded-lg border-2 border-dashed border-white/15 flex flex-col items-center justify-center text-[10px] text-neutral-400">
                            <span>ว่าง (Empty)</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Exhibition Admin Info */}
        {activeTab === 'admin' && (
          <div className="my-4 overflow-y-auto space-y-4 max-h-[56vh] pr-1 text-xs">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
              <h4 className="text-sm font-serif font-bold text-white">{exhibition.title}</h4>
              <p className="text-neutral-300 leading-relaxed font-light">
                {exhibition.curatorNote || 'นิทรรศการศิลปะร่วมสมัยที่คัดสรรผลงานชั้นเยี่ยม'}
              </p>
              <div className="grid grid-cols-2 gap-2 text-neutral-200 pt-2 border-t border-white/10">
                <div>
                  <span className="text-[#C5A880] block text-[10px]">ภัณฑารักษ์ (Curator)</span>
                  <span className="font-semibold">{exhibition.curator?.name || 'Curator'}</span>
                </div>
                <div>
                  <span className="text-[#C5A880] block text-[10px]">จำนวนผลงานทั้งหมด</span>
                  <span className="font-semibold text-[#FFD98A]">{exhibition.artworks?.length || 0} ชิ้น</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                href={`/admin/exhibitions/${exhibition.id || 'exh-01'}`}
                className="px-5 py-2.5 rounded-xl bg-[#D9B878] hover:bg-[#e6ca8a] text-black text-xs font-semibold flex items-center space-x-2 transition-all shadow-md font-bold"
              >
                <ExternalLink className="w-4 h-4" />
                <span>เปิดหน้าแก้ไขนิทรรศการเต็มรูปแบบ (Admin Panel)</span>
              </Link>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="text-xs text-[#C5A880]">
            ห้องปัจจุบัน: <span className="font-semibold text-[#FFD98A]">
              {currentRoom?.isCornerPavilion
                ? `🏛️ โถงพักเชื่อมมุม (${currentRoom.pavilionTitle || 'ประติมากรรม'})`
                : `ห้องจัดแสดง #${(currentRoom?.exhibitionRoomIndex ?? currentRoomIndex) + 1} • ${currentRoom?.slots?.filter(s => s.artwork).length || 0} ผลงาน`}
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#D9B878] hover:bg-[#e6ca8a] text-black text-xs font-bold transition-colors shadow-md flex items-center"
          >
            <Check className="w-4 h-4 mr-1.5" />
            ตกลง / ปิดสตูดิโอ
          </button>
        </div>
      </div>
    </div>
  );
}
