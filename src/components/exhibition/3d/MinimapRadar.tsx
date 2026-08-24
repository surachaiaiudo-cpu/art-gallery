'use client';

import React, { useRef, useEffect } from 'react';
import { RoomGeometryConfig, CalculatedArtworkSlot } from './types';
import { Compass, MapPin } from 'lucide-react';

interface MinimapRadarProps {
  roomConfig: RoomGeometryConfig;
  cameraPos: { x: number; z: number };
  cameraRotationY: number;
  onWarpToPosition: (x: number, z: number) => void;
  onSelectArtwork?: (slot: CalculatedArtworkSlot) => void;
}

export function MinimapRadar({
  roomConfig,
  cameraPos,
  cameraRotationY,
  onWarpToPosition,
  onSelectArtwork,
}: MinimapRadarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Padding
    const pad = 12;
    const drawW = width - pad * 2;
    const drawH = height - pad * 2;

    const roomW = roomConfig.width || 22;
    const roomD = roomConfig.depth || 22;
    const centerZ = roomConfig.center.z;

    // Coordinate conversion function from 3D world to Minimap pixel coords
    const worldToCanvas = (x: number, z: number) => {
      const relZ = z - centerZ;
      if (roomConfig.shape === 'CIRCULAR') {
        const radiusCanvas = Math.min(drawW, drawH) / 2;
        const px = width / 2 + (x / 12) * radiusCanvas;
        const py = height / 2 + (relZ / 12) * radiusCanvas;
        return { px, py };
      }
      const px = pad + ((x + roomW / 2) / roomW) * drawW;
      const py = pad + ((relZ + roomD / 2) / roomD) * drawH;
      return { px, py };
    };

    // 1. Draw Room Architectural Boundary
    ctx.fillStyle = '#F1EFE9';
    ctx.strokeStyle = '#C5A059';
    ctx.lineWidth = 2;

    if (roomConfig.shape === 'CIRCULAR') {
      const radiusCanvas = Math.min(drawW, drawH) / 2;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, radiusCanvas, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Central circular bench
      ctx.fillStyle = '#D6CEBE';
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (roomConfig.shape === 'L_SHAPE') {
      ctx.beginPath();
      // Draw L-shape polygon
      const p1 = worldToCanvas(-12, -10 + centerZ);
      const p2 = worldToCanvas(2, -10 + centerZ);
      const p3 = worldToCanvas(2, 2 + centerZ);
      const p4 = worldToCanvas(12, 2 + centerZ);
      const p5 = worldToCanvas(12, 10 + centerZ);
      const p6 = worldToCanvas(-12, 10 + centerZ);

      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);
      ctx.lineTo(p3.px, p3.py);
      ctx.lineTo(p4.px, p4.py);
      ctx.lineTo(p5.px, p5.py);
      ctx.lineTo(p6.px, p6.py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Square or Rectangle
      const topLeft = worldToCanvas(-roomW / 2, -roomD / 2 + centerZ);
      const botRight = worldToCanvas(roomW / 2, roomD / 2 + centerZ);
      const rectW = botRight.px - topLeft.px;
      const rectH = botRight.py - topLeft.py;

      ctx.fillRect(topLeft.px, topLeft.py, rectW, rectH);
      ctx.strokeRect(topLeft.px, topLeft.py, rectW, rectH);
    }

    // 2. Draw Artwork Markers on Walls
    roomConfig.slots.forEach((slot) => {
      const pos = worldToCanvas(slot.position.x, slot.position.z);
      ctx.fillStyle = slot.artwork ? '#D97706' : '#94A3B8';
      ctx.beginPath();
      ctx.arc(pos.px, pos.py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 3. Draw Camera Position & FOV Radar Cone
    const cam = worldToCanvas(cameraPos.x, cameraPos.z);

    // FOV Radar Cone
    const fovAngle = Math.PI / 3.5; // ~50 degrees
    const viewDist = 32;
    const angle = cameraRotationY + Math.PI / 2;

    const leftAngle = angle - fovAngle / 2;
    const rightAngle = angle + fovAngle / 2;

    const pLeftX = cam.px + Math.cos(leftAngle) * viewDist;
    const pLeftY = cam.py + Math.sin(leftAngle) * viewDist;
    const pRightX = cam.px + Math.cos(rightAngle) * viewDist;
    const pRightY = cam.py + Math.sin(rightAngle) * viewDist;

    const grad = ctx.createRadialGradient(cam.px, cam.py, 2, cam.px, cam.py, viewDist);
    grad.addColorStop(0, 'rgba(225, 29, 72, 0.45)');
    grad.addColorStop(1, 'rgba(225, 29, 72, 0.0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cam.px, cam.py);
    ctx.lineTo(pLeftX, pLeftY);
    ctx.arc(cam.px, cam.py, viewDist, leftAngle, rightAngle);
    ctx.closePath();
    ctx.fill();

    // Camera Center Dot
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.arc(cam.px, cam.py, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [roomConfig, cameraPos, cameraRotationY]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pad = 12;
    const drawW = canvas.width - pad * 2;
    const drawH = canvas.height - pad * 2;

    const roomW = roomConfig.width || 22;
    const roomD = roomConfig.depth || 22;
    const centerZ = roomConfig.center.z;

    let targetX = 0;
    let targetZ = centerZ;

    if (roomConfig.shape === 'CIRCULAR') {
      const radiusCanvas = Math.min(drawW, drawH) / 2;
      const relPx = clickX - canvas.width / 2;
      const relPy = clickY - canvas.height / 2;
      targetX = (relPx / radiusCanvas) * 12;
      targetZ = (relPy / radiusCanvas) * 12 + centerZ;
    } else {
      const normX = (clickX - pad) / drawW;
      const normY = (clickY - pad) / drawH;
      targetX = normX * roomW - roomW / 2;
      targetZ = normY * roomD - roomD / 2 + centerZ;
    }

    // Check click near artwork
    for (const slot of roomConfig.slots) {
      const dx = slot.position.x - targetX;
      const dz = slot.position.z - targetZ;
      if (Math.sqrt(dx * dx + dz * dz) < 2.0) {
        if (onSelectArtwork) onSelectArtwork(slot);
        return;
      }
    }

    onWarpToPosition(targetX, targetZ);
  };

  const shapeNames: Record<string, string> = {
    SQUARE: 'ทรงจัตุรัส (Square)',
    RECTANGLE: 'ทรงผืนผ้า (Rectangle)',
    L_SHAPE: 'ทรงตัว L (L-Shape)',
    CIRCULAR: 'ทรงกลม (Rotunda)',
  };

  return (
    <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border border-white/80 shadow-xl pointer-events-auto">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-bold text-slate-800 tracking-wider flex items-center">
          <Compass className="w-3.5 h-3.5 text-amber-600 mr-1.5" />
          ผังห้อง ({shapeNames[roomConfig.shape] || 'Standard'})
        </span>
        <span className="text-[9px] text-amber-800 font-mono font-bold px-1.5 py-0.5 bg-amber-50 rounded-full border border-amber-200">
          Room #{roomConfig.roomIndex + 1}
        </span>
      </div>

      <div className="relative w-40 h-32 bg-[#E9E6DE] rounded-xl border border-slate-300/80 overflow-hidden shadow-inner flex items-center justify-center cursor-crosshair">
        <canvas
          ref={canvasRef}
          width={160}
          height={128}
          onClick={handleCanvasClick}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1.5 px-1 font-medium">
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-amber-600 mr-1"></span> จุดแขวนภาพ
        </span>
        <span className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-rose-600 mr-1"></span> คุณอยู่ที่นี่
        </span>
      </div>
    </div>
  );
}
