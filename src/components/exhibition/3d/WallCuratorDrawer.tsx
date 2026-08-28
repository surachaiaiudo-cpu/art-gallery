'use client';

import React, { useState } from 'react';
import { CalculatedArtworkSlot, RoomGeometryConfig } from './types';
import { Artwork } from '@/types/exhibition';
import {
  Layers,
  ArrowLeftRight,
  Eye,
  X,
  Check,
  Building,
  Image as ImageIcon,
} from 'lucide-react';

interface WallCuratorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomConfigs: RoomGeometryConfig[];
  currentRoomIndex: number;
  onSwapSlots: (slotIndexA: number, slotIndexB: number) => void;
  onFocusSlot: (slot: CalculatedArtworkSlot) => void;
}

export function WallCuratorDrawer({
  isOpen,
  onClose,
  roomConfigs,
  currentRoomIndex,
  onSwapSlots,
  onFocusSlot,
}: WallCuratorDrawerProps) {
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const currentRoom = roomConfigs[currentRoomIndex] || roomConfigs[0];
  if (!currentRoom) return null;

  // Group slots by wall name
  const wallGroups: { [wallName: string]: CalculatedArtworkSlot[] } = {};
  currentRoom.slots.forEach((slot) => {
    if (!wallGroups[slot.wallName]) {
      wallGroups[slot.wallName] = [];
    }
    wallGroups[slot.wallName].push(slot);
  });

  const handleSlotClick = (slot: CalculatedArtworkSlot) => {
    if (selectedSlotIndex === null) {
      setSelectedSlotIndex(slot.slotIndex);
    } else if (selectedSlotIndex === slot.slotIndex) {
      setSelectedSlotIndex(null);
    } else {
      // Swap the two slots
      onSwapSlots(selectedSlotIndex, slot.slotIndex);
      setSelectedSlotIndex(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-md p-4 sm:p-6 animate-fade-in pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-xl w-full max-w-4xl max-h-[88vh] rounded-3xl p-6 border border-white/80 shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 border border-amber-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 leading-snug">
                ระบบจัดการผังผนังจัดแสดง (Wall Elevation Curator)
              </h3>
              <p className="text-xs text-slate-500">
                คลิกเลือก 2 ช่องเพื่อสลับตำแหน่ง (Swap) หรือกดปุ่มแว่นขยายเพื่อโฟกัสกล้อง 3D
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selected Slot Indicator Banner */}
        {selectedSlotIndex !== null && (
          <div className="my-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-900 animate-pulse">
            <span className="flex items-center font-medium">
              <ArrowLeftRight className="w-4 h-4 mr-2 text-amber-600" />
              เลือกช่องเป้าหมายที่ต้องการสลับตำแหน่งกับ Slot #{selectedSlotIndex + 1}
            </span>
            <button
              onClick={() => setSelectedSlotIndex(null)}
              className="text-xs text-amber-800 underline font-semibold hover:text-amber-950"
            >
              ยกเลิก
            </button>
          </div>
        )}

        {/* Wall Elevations List */}
        <div className="my-4 overflow-y-auto space-y-6 max-h-[56vh] pr-2">
          {Object.entries(wallGroups).map(([wallName, slots]) => (
            <div
              key={wallName}
              className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-800 flex items-center">
                  <Building className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
                  {wallName}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {slots.length} Slots
                </span>
              </div>

              {/* 2D Elevation Blueprint Display */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {slots.map((slot) => {
                  const isSelected = selectedSlotIndex === slot.slotIndex;
                  const art = slot.artwork;

                  return (
                    <div
                      key={slot.slotIndex}
                      onClick={() => handleSlotClick(slot)}
                      className={`relative p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-400'
                          : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-sm'
                      }`}
                    >
                      {/* Slot Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md">
                          #{slot.slotIndex + 1}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onFocusSlot(slot);
                            onClose();
                          }}
                          className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-800 hover:text-black transition-colors"
                          title="ซูมกล้อง 3D ไปที่ภาพนี้"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Artwork Thumbnail / Info */}
                      {art ? (
                        <div className="space-y-1.5">
                          <div className="h-16 w-full rounded-lg bg-slate-100 overflow-hidden relative flex items-center justify-center border border-slate-200">
                            {art.imageUrl ? (
                              <img
                                src={art.imageUrl}
                                alt={art.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="text-[11px] font-medium text-slate-900 truncate">
                            {art.title}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            {art.artist?.name || 'Artist'}
                          </div>
                        </div>
                      ) : (
                        <div className="h-24 w-full rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-[10px] text-slate-400">
                          <span>ว่าง (Empty Slot)</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            จำนวนผลงานในห้องนี้: <span className="font-semibold text-slate-800">{currentRoom.slots.filter(s => s.artwork).length} / 20</span>
          </div>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors shadow-md flex items-center"
          >
            <Check className="w-4 h-4 mr-1.5" />
            ตกลง / อัปเดตผัง 3D
          </button>
        </div>
      </div>
    </div>
  );
}
