'use client';

import React, { useRef, useEffect } from 'react';
import { RoomGeometryConfig, CalculatedArtworkSlot } from './types';
import { Compass, MapPin } from 'lucide-react';

interface MinimapRadarProps {
  roomConfig: RoomGeometryConfig;
  roomConfigs?: RoomGeometryConfig[];
  currentRoomIndex?: number;
  cameraTransformRef: React.RefObject<{ x: number; z: number; rotY: number }>;
  onWarpToPosition: (x: number, z: number) => void;
  onSelectArtwork?: (slot: CalculatedArtworkSlot) => void;
}

export const MinimapRadar = React.memo(function MinimapRadar({
  roomConfig,
  roomConfigs = [],
  currentRoomIndex = 0,
  cameraTransformRef,
  onWarpToPosition,
  onSelectArtwork,
}: MinimapRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const allConfigs = roomConfigs.length > 0 ? roomConfigs : [roomConfig];

  useEffect(() => {
    let animId: number;

    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Compute bounding box across all rooms
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      allConfigs.forEach((r) => {
        const halfW = (r.width || 14) / 2 + 2;
        const halfD = (r.depth || 32) / 2 + 2;
        minX = Math.min(minX, r.center.x - halfW);
        maxX = Math.max(maxX, r.center.x + halfW);
        minZ = Math.min(minZ, r.center.z - halfD);
        maxZ = Math.max(maxZ, r.center.z + halfD);
      });

      const spanX = Math.max(maxX - minX, 10);
      const spanZ = Math.max(maxZ - minZ, 10);
      const pad = 12;
      const scale = Math.min((width - pad * 2) / spanX, (height - pad * 2) / spanZ);

      const worldToCanvas = (wx: number, wz: number) => {
        const px = width / 2 + (wx - (minX + maxX) / 2) * scale;
        const py = height / 2 + (wz - (minZ + maxZ) / 2) * scale;
        return { px, py };
      };

      // 1. Draw Connected Rooms Floorplans
      allConfigs.forEach((r) => {
        const isCur = r.roomIndex === currentRoomIndex;
        ctx.save();
        const c = worldToCanvas(r.center.x, r.center.z);
        ctx.translate(c.px, c.py);
        ctx.rotate(r.rotationY);

        const rW = (r.width || 14) * scale;
        const rD = (r.depth || 32) * scale;

        ctx.fillStyle = isCur ? 'rgba(217, 184, 120, 0.22)' : 'rgba(255, 255, 255, 0.06)';
        ctx.strokeStyle = isCur ? '#FFD98A' : 'rgba(217, 184, 120, 0.35)';
        ctx.lineWidth = isCur ? 1.8 : 1.0;

        ctx.beginPath();
        ctx.rect(-rW / 2, -rD / 2, rW, rD);
        ctx.fill();
        ctx.stroke();

        if (r.isCornerPavilion) {
          // Draw Central Sculpture Marker in Pavilion
          ctx.fillStyle = '#D9B878';
          ctx.beginPath();
          ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = isCur ? '#FFD98A' : 'rgba(255, 255, 255, 0.7)';
          ctx.font = 'bold 8px Segoe UI, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🏛️', 0, -rD / 4);
        } else {
          // Room Letter Label
          ctx.fillStyle = isCur ? '#FFD98A' : 'rgba(255, 255, 255, 0.6)';
          ctx.font = 'bold 9px Segoe UI, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String.fromCharCode(65 + r.roomIndex), 0, 0);

          // Artwork ticks on walls
          r.slots.forEach((slot) => {
            const lx = slot.position.x * scale;
            const lz = slot.position.z * scale;
            ctx.fillStyle = slot.artwork ? '#FFD98A' : 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.arc(lx, lz, 2.0, 0, Math.PI * 2);
            ctx.fill();
          });
        }

        ctx.restore();
      });

      // 2. Draw Player Position & Direction Arrow from shared ref
      const cam = cameraTransformRef?.current || { x: 0, z: 0, rotY: 0 };
      const p = worldToCanvas(cam.x, cam.z);
      ctx.save();
      ctx.translate(p.px, p.py);
      ctx.rotate(cam.rotY);

      ctx.fillStyle = '#FFD98A';
      ctx.beginPath();
      ctx.moveTo(0, -7);
      ctx.lineTo(4.5, 4.5);
      ctx.lineTo(0, 2);
      ctx.lineTo(-4.5, 4.5);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [allConfigs, currentRoomIndex, cameraTransformRef]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    allConfigs.forEach((r) => {
      const halfW = (r.width || 14) / 2 + 2;
      const halfD = (r.depth || 32) / 2 + 2;
      minX = Math.min(minX, r.center.x - halfW);
      maxX = Math.max(maxX, r.center.x + halfW);
      minZ = Math.min(minZ, r.center.z - halfD);
      maxZ = Math.max(maxZ, r.center.z + halfD);
    });

    const spanX = Math.max(maxX - minX, 10);
    const spanZ = Math.max(maxZ - minZ, 10);
    const pad = 12;
    const scale = Math.min((canvas.width - pad * 2) / spanX, (canvas.height - pad * 2) / spanZ);

    const targetX = (clickX - canvas.width / 2) / scale + (minX + maxX) / 2;
    const targetZ = (clickY - canvas.height / 2) / scale + (minZ + maxZ) / 2;

    onWarpToPosition(targetX, targetZ);
  };

  return (
    <div className="bg-[#161310]/20 backdrop-blur-2xl p-3 rounded-2xl border border-[#D9B878]/30 shadow-[0_8px_32px_rgba(0,0,0,0.35)] pointer-events-auto text-white">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-[#F4F3EE] tracking-wider flex items-center">
          <Compass className="w-3.5 h-3.5 text-[#D9B878] mr-1.5" />
          ผังนิทรรศการ ({allConfigs.length} ห้อง)
        </span>
        <span className="text-[9px] text-[#FFD98A] font-mono font-bold px-2 py-0.5 bg-[#D9B878]/15 rounded-full border border-[#D9B878]/30">
          ห้อง {String.fromCharCode(65 + currentRoomIndex)}
        </span>
      </div>

      <div className="relative w-44 h-32 bg-black/15 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden shadow-inner flex items-center justify-center cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={176}
          height={128}
          onClick={handleCanvasClick}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-[#C5A880] mt-1.5 px-1 font-medium">
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-[#D9B878] mr-1"></span> ภาพ
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-[#FFD98A] mr-1"></span> คุณอยู่ที่นี่
        </span>
      </div>
    </div>
  );
});
