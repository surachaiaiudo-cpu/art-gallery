'use client';

export const runtime = 'edge';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Exhibition, Artwork, WallPosition } from '@/types/exhibition';
import { useLanguage } from '@/context/LanguageContext';
import { parseArtworkDimensions } from '@/lib/utils';
import {
  Save,
  Layers,
  Box,
  Eye,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ExternalLink,
  ArrowLeft,
  Building2,
  Move,
  Sparkles,
  Maximize2,
  Compass,
  Info,
  ShieldCheck,
  Ruler,
  ArrowRightLeft,
  Keyboard,
  Sliders,
} from 'lucide-react';

export type RoomSize = 'small' | 'medium' | 'large';

const ROOM_BOUNDS: Record<RoomSize, { dim: number; labelTh: string; labelEn: string }> = {
  small: { dim: 10, labelTh: 'เล็ก (10ม. × 10ม.)', labelEn: 'Small (10m × 10m)' },
  medium: { dim: 14, labelTh: 'กลาง (14ม. × 14ม.)', labelEn: 'Medium (14m × 14m)' },
  large: { dim: 22, labelTh: 'ใหญ่ (22ม. × 22ม.)', labelEn: 'Large (22m × 22m)' },
};

interface WallOverlapResult {
  hasOverlap: boolean;
  overlapPairs: Array<{ art1: Artwork; art2: Artwork; gap: number }>;
}

interface WallSpacingSegment {
  type: 'gap' | 'artwork';
  label: string;
  distanceMeters: number;
  artwork?: Artwork;
  artIndex?: number;
  isNegative?: boolean;
  artAId?: string;
  artBId?: string;
}

export default function AdminExhibitionBuilderPage({
  params,
}: {
  params: { id: string };
}) {
  const { lang, t } = useLanguage();
  const [exhibition, setExhibition] = useState<Exhibition | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedArtId, setSelectedArtId] = useState<string | null>(null);
  const [roomSize, setRoomSize] = useState<RoomSize>('medium');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [hoveredArtId, setHoveredArtId] = useState<string | null>(null);
  const [activeWallTab, setActiveWallTab] = useState<0 | 1 | 2 | 3>(0);
  const [customUniformGap, setCustomUniformGap] = useState<string>('1.20');

  const floorPlanRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch(`/api/exhibitions/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.exhibition) {
          setExhibition(data.exhibition);
          setArtworks(data.exhibition.artworks || []);
          if (data.exhibition.artworks?.length > 0) {
            setSelectedArtId(data.exhibition.artworks[0].id);
          }

          if (data.exhibition.themeConfig) {
            try {
              const parsed = JSON.parse(data.exhibition.themeConfig);
              if (
                parsed.roomSize &&
                (parsed.roomSize === 'small' || parsed.roomSize === 'medium' || parsed.roomSize === 'large')
              ) {
                setRoomSize(parsed.roomSize);
              }
            } catch {}
          }
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const selectedArtwork = artworks.find((a) => a.id === selectedArtId);
  const currentBound = ROOM_BOUNDS[roomSize].dim;
  const maxCoord = currentBound / 2 - 0.15;

  // Collision & Overlap Detection Calculation for each wall
  const wallOverlapAnalysis = useMemo(() => {
    const walls: Record<number, Artwork[]> = { 0: [], 1: [], 2: [], 3: [] };

    for (const art of artworks) {
      const pos = art.wallPosition;
      if (pos && typeof pos.wallIndex === 'number') {
        walls[pos.wallIndex] = walls[pos.wallIndex] || [];
        walls[pos.wallIndex].push(art);
      }
    }

    const results: Record<number, WallOverlapResult> = {
      0: { hasOverlap: false, overlapPairs: [] },
      1: { hasOverlap: false, overlapPairs: [] },
      2: { hasOverlap: false, overlapPairs: [] },
      3: { hasOverlap: false, overlapPairs: [] },
    };

    for (let w = 0; w < 4; w++) {
      const list = walls[w] || [];
      const pairs: Array<{ art1: Artwork; art2: Artwork; gap: number }> = [];

      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a1 = list[i];
          const a2 = list[j];

          const dim1 = parseArtworkDimensions(a1.dimensions);
          const dim2 = parseArtworkDimensions(a2.dimensions);

          const coord1 = w === 0 || w === 2 ? a1.wallPosition!.x : a1.wallPosition!.z;
          const coord2 = w === 0 || w === 2 ? a2.wallPosition!.x : a2.wallPosition!.z;

          const distance = Math.abs(coord1 - coord2);
          const requiredDist = (dim1.widthMeters + dim2.widthMeters) / 2 + 0.3;
          const gap = distance - (dim1.widthMeters + dim2.widthMeters) / 2;

          if (distance < requiredDist) {
            pairs.push({ art1: a1, art2: a2, gap });
          }
        }
      }

      results[w] = {
        hasOverlap: pairs.length > 0,
        overlapPairs: pairs,
      };
    }

    return results;
  }, [artworks]);

  // Calculate Wall Spacing Segments
  const getWallSpacingSegments = useCallback(
    (wallIndex: number): WallSpacingSegment[] => {
      const wallArts = artworks
        .filter((a) => (a.wallPosition?.wallIndex ?? 0) === wallIndex)
        .sort((a, b) => {
          const posA = wallIndex === 0 || wallIndex === 2 ? a.wallPosition!.x : a.wallPosition!.z;
          const posB = wallIndex === 0 || wallIndex === 2 ? b.wallPosition!.x : b.wallPosition!.z;
          return posA - posB;
        });

      if (wallArts.length === 0) {
        return [
          {
            type: 'gap',
            label: lang === 'th' ? 'พื้นที่ว่างตลอดแนวผนัง' : 'Full Empty Wall Span',
            distanceMeters: currentBound,
          },
        ];
      }

      const segments: WallSpacingSegment[] = [];
      const wallStart = -currentBound / 2;
      const wallEnd = currentBound / 2;

      // Distance from start corner to first artwork
      const firstArt = wallArts[0];
      const firstDim = parseArtworkDimensions(firstArt.dimensions);
      const firstCenter = wallIndex === 0 || wallIndex === 2 ? firstArt.wallPosition!.x : firstArt.wallPosition!.z;
      const firstLeft = firstCenter - firstDim.widthMeters / 2;
      const startGap = firstLeft - wallStart;

      if (startGap > 0.02) {
        segments.push({
          type: 'gap',
          label: lang === 'th' ? 'จากมุมซ้าย' : 'From Left Corner',
          distanceMeters: parseFloat(startGap.toFixed(2)),
          artAId: undefined,
          artBId: firstArt.id,
        });
      }

      // Iterate through artworks and middle gaps
      for (let i = 0; i < wallArts.length; i++) {
        const art = wallArts[i];
        const dim = parseArtworkDimensions(art.dimensions);
        const artIdxInAll = artworks.findIndex((a) => a.id === art.id) + 1;

        segments.push({
          type: 'artwork',
          label: art.title,
          distanceMeters: parseFloat(dim.widthMeters.toFixed(2)),
          artwork: art,
          artIndex: artIdxInAll,
        });

        // Middle gap to next artwork
        if (i < wallArts.length - 1) {
          const nextArt = wallArts[i + 1];
          const nextDim = parseArtworkDimensions(nextArt.dimensions);
          const currentCenter = wallIndex === 0 || wallIndex === 2 ? art.wallPosition!.x : art.wallPosition!.z;
          const nextCenter = wallIndex === 0 || wallIndex === 2 ? nextArt.wallPosition!.x : nextArt.wallPosition!.z;

          const currentRight = currentCenter + dim.widthMeters / 2;
          const nextLeft = nextCenter - nextDim.widthMeters / 2;
          const middleGap = nextLeft - currentRight;

          segments.push({
            type: 'gap',
            label: lang === 'th' ? `ห่างระหว่าง #${artIdxInAll} ⟷ #${artIdxInAll + 1}` : `Gap #${artIdxInAll} ⟷ #${artIdxInAll + 1}`,
            distanceMeters: parseFloat(middleGap.toFixed(2)),
            isNegative: middleGap < 0,
            artAId: art.id,
            artBId: nextArt.id,
          });
        }
      }

      // Distance from last artwork to end corner
      const lastArt = wallArts[wallArts.length - 1];
      const lastDim = parseArtworkDimensions(lastArt.dimensions);
      const lastCenter = wallIndex === 0 || wallIndex === 2 ? lastArt.wallPosition!.x : lastArt.wallPosition!.z;
      const lastRight = lastCenter + lastDim.widthMeters / 2;
      const endGap = wallEnd - lastRight;

      if (endGap > 0.02) {
        segments.push({
          type: 'gap',
          label: lang === 'th' ? 'ถึงมุมขวา' : 'To Right Corner',
          distanceMeters: parseFloat(endGap.toFixed(2)),
          artAId: lastArt.id,
          artBId: undefined,
        });
      }

      return segments;
    },
    [artworks, currentBound, lang]
  );

  // Update a Specific Gap Between Artworks (by typing custom meter value)
  const handleUpdateCustomGap = (artAId: string | undefined, artBId: string | undefined, newGapValue: number) => {
    if (isNaN(newGapValue) || newGapValue < 0.1) return;

    setArtworks((prev) => {
      const wallArts = prev
        .filter((a) => (a.wallPosition?.wallIndex ?? 0) === activeWallTab)
        .sort((a, b) => {
          const posA = activeWallTab === 0 || activeWallTab === 2 ? a.wallPosition!.x : a.wallPosition!.z;
          const posB = activeWallTab === 0 || activeWallTab === 2 ? b.wallPosition!.x : b.wallPosition!.z;
          return posA - posB;
        });

      if (!artAId && artBId) {
        // Gap from left corner to first artwork
        const firstArt = wallArts.find((a) => a.id === artBId);
        if (!firstArt) return prev;
        const dim = parseArtworkDimensions(firstArt.dimensions);
        const newFirstCenter = -currentBound / 2 + newGapValue + dim.widthMeters / 2;

        return prev.map((art) => {
          if (art.id !== artBId) return art;
          const currentPos = art.wallPosition!;
          return {
            ...art,
            wallPosition: {
              ...currentPos,
              x: activeWallTab === 0 || activeWallTab === 2 ? parseFloat(newFirstCenter.toFixed(2)) : currentPos.x,
              z: activeWallTab === 1 || activeWallTab === 3 ? parseFloat(newFirstCenter.toFixed(2)) : currentPos.z,
            },
          };
        });
      }

      if (artAId && artBId) {
        // Middle gap between artA and artB
        const artA = wallArts.find((a) => a.id === artAId);
        const artB = wallArts.find((a) => a.id === artBId);
        if (!artA || !artB) return prev;

        const dimA = parseArtworkDimensions(artA.dimensions);
        const dimB = parseArtworkDimensions(artB.dimensions);

        const centerA = activeWallTab === 0 || activeWallTab === 2 ? artA.wallPosition!.x : artA.wallPosition!.z;
        const rightA = centerA + dimA.widthMeters / 2;
        const newCenterB = rightA + newGapValue + dimB.widthMeters / 2;

        const deltaShift = newCenterB - (activeWallTab === 0 || activeWallTab === 2 ? artB.wallPosition!.x : artB.wallPosition!.z);
        const bIndex = wallArts.findIndex((a) => a.id === artBId);

        // Shift artB and all subsequent artworks to maintain spacing
        const shiftedIds = new Set(wallArts.slice(bIndex).map((a) => a.id));

        return prev.map((art) => {
          if (!shiftedIds.has(art.id)) return art;
          const currentPos = art.wallPosition!;
          const curVal = activeWallTab === 0 || activeWallTab === 2 ? currentPos.x : currentPos.z;
          const newVal = Math.min(maxCoord, Math.max(-maxCoord, curVal + deltaShift));

          return {
            ...art,
            wallPosition: {
              ...currentPos,
              x: activeWallTab === 0 || activeWallTab === 2 ? parseFloat(newVal.toFixed(2)) : currentPos.x,
              z: activeWallTab === 1 || activeWallTab === 3 ? parseFloat(newVal.toFixed(2)) : currentPos.z,
            },
          };
        });
      }

      return prev;
    });
  };

  // Apply Uniform Custom Gap to All Artworks on Active Wall
  const handleApplyUniformGap = () => {
    const gapMeters = parseFloat(customUniformGap);
    if (isNaN(gapMeters) || gapMeters < 0.1) return;

    const wallArts = artworks
      .filter((a) => (a.wallPosition?.wallIndex ?? 0) === activeWallTab)
      .sort((a, b) => {
        const posA = activeWallTab === 0 || activeWallTab === 2 ? a.wallPosition!.x : a.wallPosition!.z;
        const posB = activeWallTab === 0 || activeWallTab === 2 ? b.wallPosition!.x : b.wallPosition!.z;
        return posA - posB;
      });

    if (wallArts.length === 0) return;

    // Calculate total physical width of all artworks
    let totalArtWidth = 0;
    const dimsList = wallArts.map((art) => {
      const d = parseArtworkDimensions(art.dimensions);
      totalArtWidth += d.widthMeters;
      return d;
    });

    const totalGapsWidth = (wallArts.length - 1) * gapMeters;
    const totalClusterSpan = totalArtWidth + totalGapsWidth;

    // Start centered on wall
    let currentLeftEdge = -totalClusterSpan / 2;

    const updatedMap = new Map<string, number>();

    for (let i = 0; i < wallArts.length; i++) {
      const art = wallArts[i];
      const dim = dimsList[i];
      const centerCoord = currentLeftEdge + dim.widthMeters / 2;
      updatedMap.set(art.id, parseFloat(centerCoord.toFixed(2)));
      currentLeftEdge += dim.widthMeters + gapMeters;
    }

    setArtworks((prev) =>
      prev.map((art) => {
        if (!updatedMap.has(art.id)) return art;
        const newCoord = updatedMap.get(art.id)!;
        const currentPos = art.wallPosition!;
        return {
          ...art,
          wallPosition: {
            ...currentPos,
            x: activeWallTab === 0 || activeWallTab === 2 ? newCoord : currentPos.x,
            z: activeWallTab === 1 || activeWallTab === 3 ? newCoord : currentPos.z,
          },
        };
      })
    );
  };

  // Direct coordinate update
  const handlePositionChange = (key: keyof WallPosition, value: number) => {
    if (!selectedArtId) return;

    setArtworks((prev) =>
      prev.map((art) => {
        if (art.id !== selectedArtId) return art;
        const currentPos: WallPosition = art.wallPosition || {
          x: 0,
          y: 2.0,
          z: -maxCoord,
          rotationY: 0,
          wallIndex: 0,
          scale: 1,
        };
        return {
          ...art,
          wallPosition: {
            ...currentPos,
            [key]: parseFloat(value.toFixed(2)),
          },
        };
      })
    );
  };

  // Convert 2D Screen Click / Drag Coordinates to 3D Wall Snap Coordinates with collision resolution
  const snapToWall = useCallback(
    (clientX: number, clientY: number) => {
      if (!floorPlanRef.current || !selectedArtId) return;

      const rect = floorPlanRef.current.getBoundingClientRect();
      const clickX = clientX - rect.left;
      const clickY = clientY - rect.top;

      const normX = ((clickX / rect.width) * 2 - 1);
      const normY = ((clickY / rect.height) * 2 - 1);

      const rawMeterX = normX * (currentBound / 2);
      const rawMeterZ = normY * (currentBound / 2);

      const distNorth = Math.abs(normY - -1);
      const distSouth = Math.abs(normY - 1);
      const distWest = Math.abs(normX - -1);
      const distEast = Math.abs(normX - 1);

      const minDist = Math.min(distNorth, distSouth, distWest, distEast);

      let snappedX = rawMeterX;
      let snappedZ = rawMeterZ;
      let rotY = 0;
      let wallIndex = 0;

      if (minDist === distNorth) {
        wallIndex = 0;
        snappedZ = -maxCoord;
        snappedX = Math.max(-maxCoord, Math.min(maxCoord, rawMeterX));
        rotY = 0;
      } else if (minDist === distEast) {
        wallIndex = 1;
        snappedX = maxCoord;
        snappedZ = Math.max(-maxCoord, Math.min(maxCoord, rawMeterZ));
        rotY = -Math.PI / 2;
      } else if (minDist === distSouth) {
        wallIndex = 2;
        snappedZ = maxCoord;
        snappedX = Math.max(-maxCoord, Math.min(maxCoord, rawMeterX));
        rotY = Math.PI;
      } else {
        wallIndex = 3;
        snappedX = -maxCoord;
        snappedZ = Math.max(-maxCoord, Math.min(maxCoord, rawMeterZ));
        rotY = Math.PI / 2;
      }

      setArtworks((prev) =>
        prev.map((art) => {
          if (art.id !== selectedArtId) return art;
          const currentPos: WallPosition = art.wallPosition || {
            x: 0,
            y: 2.0,
            z: -maxCoord,
            rotationY: 0,
            wallIndex: 0,
            scale: 1,
          };
          return {
            ...art,
            wallPosition: {
              ...currentPos,
              x: parseFloat(snappedX.toFixed(2)),
              z: parseFloat(snappedZ.toFixed(2)),
              rotationY: rotY,
              wallIndex,
            },
          };
        })
      );
    },
    [currentBound, maxCoord, selectedArtId]
  );

  const handleFloorMouseDown = (e: React.MouseEvent) => {
    setIsDraggingPin(true);
    snapToWall(e.clientX, e.clientY);
  };

  const handleFloorMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPin) return;
    snapToWall(e.clientX, e.clientY);
  };

  const handleFloorMouseUp = () => {
    setIsDraggingPin(false);
  };

  const handleAutoDistribute = () => {
    if (artworks.length === 0) return;

    const total = artworks.length;
    const perWall = Math.ceil(total / 4);

    setArtworks((prev) =>
      prev.map((art, idx) => {
        const wallIdx = Math.floor(idx / perWall);
        const posInWall = idx % perWall;
        const countInThisWall = Math.min(perWall, total - wallIdx * perWall);

        const availableSpan = currentBound * 0.75;
        const spacing = availableSpan / (countInThisWall + 1);
        const offset = -((countInThisWall - 1) * spacing) / 2 + posInWall * spacing;

        let x = 0;
        let z = 0;
        let rotY = 0;

        if (wallIdx === 0) {
          z = -maxCoord;
          x = offset;
          rotY = 0;
        } else if (wallIdx === 1) {
          x = maxCoord;
          z = offset;
          rotY = -Math.PI / 2;
        } else if (wallIdx === 2) {
          z = maxCoord;
          x = offset;
          rotY = Math.PI;
        } else {
          x = -maxCoord;
          z = offset;
          rotY = Math.PI / 2;
        }

        return {
          ...art,
          wallPosition: {
            x: parseFloat(x.toFixed(2)),
            y: 2.0,
            z: parseFloat(z.toFixed(2)),
            rotationY: rotY,
            wallIndex: wallIdx,
            scale: 1,
          },
        };
      })
    );
  };

  const handleSaveAll = async () => {
    if (!exhibition) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        roomSize,
        wallPositions: artworks.map((art, idx) => ({
          exhibitionId: exhibition.id,
          artworkId: art.id,
          wallPosition: art.wallPosition,
          displayOrder: idx + 1,
        })),
      };

      const res = await fetch(`/api/exhibitions/${exhibition.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save wall coordinates:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!exhibition) {
    return (
      <div className="p-10 text-center text-[#8A8376]">
        {lang === 'th' ? 'กำลังโหลดระบบจัดตำแหน่งภาพ...' : 'Loading Exhibition Builder...'}
      </div>
    );
  }

  const selectedRealDim = selectedArtwork ? parseArtworkDimensions(selectedArtwork.dimensions) : null;
  const anyOverlapOverall = Object.values(wallOverlapAnalysis).some((w) => w.hasOverlap);
  const activeWallSegments = getWallSpacingSegments(activeWallTab);

  return (
    <div className="max-w-6xl mx-auto space-y-8 select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DCD5C8] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#8C6D3F]">
            <Layers className="w-3.5 h-3.5" />
            <span>{t.admin.title}</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#1A1918] mt-1">
            {t.admin.wallBuilder}
          </h1>
          <p className="text-xs text-[#6E685C] mt-1">
            {lang === 'th' ? 'นิทรรศการ' : 'Exhibition'}:{' '}
            <span className="font-semibold text-[#1A1918]">{exhibition.title}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/exhibitions/${exhibition.slug}?mode=3d`}
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-[#FAF8F5] text-[#1A1918] border border-[#D5CEC0] rounded-lg text-xs font-semibold uppercase tracking-wider shadow-sm transition-all"
          >
            <Box className="w-3.5 h-3.5 text-[#8C6D3F]" />
            <span>{t.admin.test3d}</span>
          </Link>

          <button
            onClick={handleSaveAll}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider shadow transition-all disabled:opacity-50"
          >
            {isSaving ? (
              t.admin.saving
            ) : saveSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t.admin.saved}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{t.admin.saveLayout}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Room Scale Configuration & Collision Status Bar */}
      <div className="bg-white rounded-xl border border-[#E0D9CD] p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#E0D9CD] flex items-center justify-center text-[#8C6D3F] shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif text-base font-bold text-[#1A1918]">
                {lang === 'th' ? 'ขนาดผังห้อง 3D และไม้บรรทัดวัดระยะห่าง' : '3D Room Scale & Custom Spacing'}
              </h3>
              {!anyOverlapOverall ? (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  <span>{lang === 'th' ? 'ระยะห่างปลอดภัย ไม่ทับซ้อน' : 'Zero Overlap'}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  <AlertTriangle className="w-3 h-3" />
                  <span>{lang === 'th' ? 'มีภาพซ้อนทับกัน' : 'Overlap Detected'}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-[#7A7468]">
              {lang === 'th'
                ? `ขนาดห้อง: ${ROOM_BOUNDS[roomSize].labelTh} — กำหนดระยะห่างระหว่างภาพได้อิสระโดยการพิมพ์ตัวเลข`
                : `Room Scale: ${ROOM_BOUNDS[roomSize].labelEn} — Type exact gap distances between artworks`}
            </p>
          </div>
        </div>

        {/* Room Size Selector & Auto-Distribute */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleAutoDistribute}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#FAF8F5] hover:bg-[#EFEBE2] text-[#8C6D3F] border border-[#DDD6C8] rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
            title="Auto-Distribute Artworks evenly across 4 walls"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'จัดวางกระจายอัตโนมัติ' : 'Auto Distribute'}</span>
          </button>

          <div className="flex items-center bg-[#F3EFE9] p-1 rounded-lg border border-[#DDD6C8] text-xs font-semibold">
            <button
              onClick={() => setRoomSize('small')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                roomSize === 'small'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'text-[#6E685C] hover:text-[#1A1918]'
              }`}
            >
              🟢 {lang === 'th' ? 'เล็ก 10ม.' : 'Small 10m'}
            </button>
            <button
              onClick={() => setRoomSize('medium')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                roomSize === 'medium'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'text-[#6E685C] hover:text-[#1A1918]'
              }`}
            >
              🟡 {lang === 'th' ? 'กลาง 14ม.' : 'Medium 14m'}
            </button>
            <button
              onClick={() => setRoomSize('large')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                roomSize === 'large'
                  ? 'bg-[#1A1918] text-white shadow-sm'
                  : 'text-[#6E685C] hover:text-[#1A1918]'
              }`}
            >
              🟣 {lang === 'th' ? 'ใหญ่ 22ม.' : 'Large 22m'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Drag-and-Drop Floor Plan Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Artworks Selection Roster (4 Cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-[#E0D9CD] shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0EBE0] pb-3">
            <h3 className="font-serif text-base font-bold text-[#1A1918]">
              {t.admin.artworksCount} ({artworks.length})
            </h3>
            <span className="text-[10px] uppercase font-bold text-[#8C6D3F]">
              {lang === 'th' ? 'คลิกเลือก / ลากวาง' : 'Select / Drag'}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {artworks.map((art, idx) => {
              const isSelected = art.id === selectedArtId;
              const pos = art.wallPosition;
              const dims = parseArtworkDimensions(art.dimensions);

              return (
                <div
                  key={art.id}
                  onClick={() => setSelectedArtId(art.id)}
                  onMouseEnter={() => setHoveredArtId(art.id)}
                  onMouseLeave={() => setHoveredArtId(null)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-[#FAF8F5] border-[#8C6D3F] shadow-md ring-2 ring-[#8C6D3F]/40'
                      : 'bg-white border-[#E8E2D6] hover:border-[#D0C7B6]'
                  }`}
                >
                  <div className="relative w-14 h-14 bg-[#1A1918] rounded-lg overflow-hidden shrink-0 shadow-sm">
                    <Image src={art.imageUrl} alt={art.title} fill className="object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-[#8C6D3F]">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] font-mono text-[#8C8477]">
                        {dims.widthMeters.toFixed(2)}m × {dims.heightMeters.toFixed(2)}m
                      </span>
                    </div>

                    <h4 className="font-serif text-xs font-bold text-[#1A1918] truncate mt-0.5">
                      {art.title}
                    </h4>
                    <p className="text-[11px] text-[#6E685C] truncate">{art.artist?.name}</p>

                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#7A7468] bg-[#F4F1EA] px-2 py-0.5 rounded font-mono">
                      <span>
                        X:{pos?.x.toFixed(1)} Z:{pos?.z.toFixed(1)}
                      </span>
                      <span className="font-bold text-[#8C6D3F]">
                        {pos?.wallIndex === 0
                          ? 'North Wall'
                          : pos?.wallIndex === 1
                          ? 'East Wall'
                          : pos?.wallIndex === 2
                          ? 'South Wall'
                          : 'West Wall'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Visual Floor Plan with Artwork Thumbnails, Previews & Distance Rulers (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-xl border border-[#E0D9CD] shadow-sm p-6 sm:p-8 space-y-6">
            {/* Selected Artwork Physical Dimensions Placard */}
            {selectedArtwork && selectedRealDim && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FAF8F5] border border-[#EAE4D8] rounded-xl shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 bg-[#1A1918] rounded-lg overflow-hidden shrink-0 shadow">
                    <Image
                      src={selectedArtwork.imageUrl}
                      alt={selectedArtwork.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-[#8C6D3F] font-bold">
                      {lang === 'th' ? 'กำลังจัดวางตำแหน่ง:' : 'Placing Artwork:'}
                    </span>
                    <h3 className="font-serif text-base font-bold text-[#1A1918]">
                      {selectedArtwork.title}
                    </h3>
                    <p className="text-xs text-[#6E685C]">
                      {selectedArtwork.artist?.name} • {selectedArtwork.medium}
                    </p>
                  </div>
                </div>

                <div className="text-right bg-white px-3.5 py-2 rounded-lg border border-[#EAE4D8]">
                  <span className="text-[10px] uppercase tracking-wider text-[#8C6D3F] font-bold block">
                    {lang === 'th' ? 'ขนาดจริงตามผลงาน' : 'Physical Dimensions'}:
                  </span>
                  <p className="font-mono text-sm font-bold text-[#1A1918]">
                    {selectedRealDim.widthMeters.toFixed(2)}m × {selectedRealDim.heightMeters.toFixed(2)}m
                  </p>
                  <p className="text-[10px] text-[#7A7468]">({selectedArtwork.dimensions})</p>
                </div>
              </div>
            )}

            {/* Interactive Drag & Drop Floor Plan Canvas with Real Picture Previews */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#8C6D3F]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[#1A1918]">
                    {lang === 'th'
                      ? `ผังห้องแสดงภาพตัวอย่างจริงและระยะห่าง (${currentBound}ม. × ${currentBound}ม.)`
                      : `Live Picture Preview Floor Plan (${currentBound}m × ${currentBound}m)`}
                  </span>
                </div>
                <span className="text-[11px] text-[#8C6D3F] font-semibold">
                  🖱️ {lang === 'th' ? 'คลิกลากเพื่อย้ายภาพบนผนัง' : 'Drag painting thumbnail onto wall'}
                </span>
              </div>

              {/* Floor Plan Square Canvas */}
              <div
                ref={floorPlanRef}
                onMouseDown={handleFloorMouseDown}
                onMouseMove={handleFloorMouseMove}
                onMouseUp={handleFloorMouseUp}
                onMouseLeave={handleFloorMouseUp}
                className="relative w-full aspect-square max-w-xl mx-auto bg-[#F4F1EA] border-4 border-[#2A231C] rounded-2xl p-6 flex items-center justify-center shadow-inner cursor-crosshair overflow-hidden"
              >
                {/* Wall Direction Indicators */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#2A231C] text-white text-[10px] font-bold uppercase tracking-wider rounded-b z-10 shadow">
                  {t.admin.northWall} (0°)
                </div>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-[#2A231C] text-white text-[10px] font-bold uppercase tracking-wider rounded-t z-10 shadow">
                  {t.admin.southEntrance} (180°)
                </div>
                <div className="absolute left-2 top-1/2 -translate-y-1/2 -rotate-90 px-3 py-0.5 bg-[#2A231C] text-white text-[10px] font-bold uppercase tracking-wider rounded-b z-10 shadow">
                  {t.admin.westWall} (90°)
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 rotate-90 px-3 py-0.5 bg-[#2A231C] text-white text-[10px] font-bold uppercase tracking-wider rounded-b z-10 shadow">
                  {t.admin.eastWall} (-90°)
                </div>

                {/* Wall Snapping Guide Lines (Dashed) */}
                <div className="absolute inset-5 border-2 border-dashed border-[#C5A880]/50 rounded-lg pointer-events-none" />

                {/* Center Sculpture Pedestal */}
                <div className="w-14 h-14 rounded-full bg-[#2A231C] text-white flex flex-col items-center justify-center text-[8px] font-bold shadow-lg z-10 pointer-events-none">
                  <span>🏛️</span>
                  <span>{t.admin.centerPedestal}</span>
                </div>

                {/* Placed Artwork Real Image Thumbnail Previews on Walls */}
                {artworks.map((art, idx) => {
                  const isCurrent = art.id === selectedArtId;
                  const isHovered = art.id === hoveredArtId;
                  const pos = art.wallPosition;
                  if (!pos) return null;

                  const dims = parseArtworkDimensions(art.dimensions);
                  const widthPx = Math.max((dims.widthMeters / currentBound) * 460, 42);

                  const leftPct = ((pos.x + currentBound / 2) / currentBound) * 100;
                  const topPct = ((pos.z + currentBound / 2) / currentBound) * 100;

                  return (
                    <div
                      key={art.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedArtId(art.id);
                      }}
                      onMouseEnter={() => setHoveredArtId(art.id)}
                      onMouseLeave={() => setHoveredArtId(null)}
                      style={{
                        left: `${leftPct}%`,
                        top: `${topPct}%`,
                      }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing transition-transform duration-150 z-20 ${
                        isCurrent || isHovered ? 'scale-125 z-30' : 'hover:scale-110'
                      }`}
                    >
                      {/* Real Image Miniature Card with Physical Width Proportion */}
                      <div
                        style={{ width: `${widthPx}px` }}
                        className={`group/card relative h-10 rounded-md border-2 overflow-hidden shadow-md flex items-center justify-between transition-all ${
                          isCurrent
                            ? 'border-[#C5A880] ring-4 ring-amber-400/60 shadow-xl'
                            : 'border-white bg-[#1A1918]'
                        }`}
                      >
                        <Image
                          src={art.imageUrl}
                          alt={art.title}
                          fill
                          className="object-cover opacity-90 group-hover/card:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/40" />

                        <span className="absolute top-0.5 left-1 px-1 py-0.2 bg-black/80 text-[#C5A880] text-[8px] font-bold font-mono rounded">
                          #{idx + 1}
                        </span>

                        <span className="absolute bottom-0.5 right-1 px-1 py-0.2 bg-black/80 text-white text-[7px] font-mono rounded">
                          {dims.widthMeters.toFixed(1)}m
                        </span>
                      </div>

                      {(isHovered || isCurrent) && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1 bg-black/90 text-white text-[10px] rounded shadow-xl whitespace-nowrap pointer-events-none z-40 border border-white/20">
                          <p className="font-bold">
                            #{idx + 1} {art.title}
                          </p>
                          <p className="text-[#C5A880] text-[9px]">
                            {dims.widthMeters}m × {dims.heightMeters}m ({art.dimensions})
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wall Spacing Ruler & Custom Typed Gap Controls */}
            <div className="pt-6 border-t border-[#F0EBE0] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-[#8C6D3F]" />
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1A1918] block">
                      {lang === 'th' ? 'ไม้บรรทัดกำหนดระยะห่างระหว่างภาพ (พิมพ์ตัวเลขได้)' : 'Custom Wall Spacing & Gap Inputs'}
                    </span>
                    <span className="text-[11px] text-[#7A7468]">
                      {lang === 'th' ? `ความยาวผนังด้านนี้: ${currentBound.toFixed(2)} เมตร` : `Total Wall Span: ${currentBound.toFixed(2)} meters`}
                    </span>
                  </div>
                </div>

                {/* Wall Tabs [North | East | South | West] */}
                <div className="flex items-center bg-[#F3EFE9] p-0.5 rounded-lg border border-[#DDD6C8] text-xs font-semibold">
                  <button
                    onClick={() => setActiveWallTab(0)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeWallTab === 0 ? 'bg-[#1A1918] text-white shadow-sm' : 'text-[#6E685C] hover:text-[#1A1918]'
                    }`}
                  >
                    {t.admin.northWall} ({artworks.filter((a) => a.wallPosition?.wallIndex === 0).length})
                  </button>
                  <button
                    onClick={() => setActiveWallTab(1)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeWallTab === 1 ? 'bg-[#1A1918] text-white shadow-sm' : 'text-[#6E685C] hover:text-[#1A1918]'
                    }`}
                  >
                    {t.admin.eastWall} ({artworks.filter((a) => a.wallPosition?.wallIndex === 1).length})
                  </button>
                  <button
                    onClick={() => setActiveWallTab(2)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeWallTab === 2 ? 'bg-[#1A1918] text-white shadow-sm' : 'text-[#6E685C] hover:text-[#1A1918]'
                    }`}
                  >
                    {t.admin.southEntrance} ({artworks.filter((a) => a.wallPosition?.wallIndex === 2).length})
                  </button>
                  <button
                    onClick={() => setActiveWallTab(3)}
                    className={`px-3 py-1 rounded-md transition-all ${
                      activeWallTab === 3 ? 'bg-[#1A1918] text-white shadow-sm' : 'text-[#6E685C] hover:text-[#1A1918]'
                    }`}
                  >
                    {t.admin.westWall} ({artworks.filter((a) => a.wallPosition?.wallIndex === 3).length})
                  </button>
                </div>
              </div>

              {/* Set Uniform Custom Gap Toolbar (พิมพ์กำหนดระยะห่างเท่ากันทุกภาพ) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D8]">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#3D3A34]">
                  <Keyboard className="w-4 h-4 text-[#8C6D3F]" />
                  <span>{lang === 'th' ? 'พิมพ์กำหนดระยะห่างเท่ากันทุกภาพบนผนังนี้:' : 'Set Uniform Gap for All Paintings on this Wall:'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-[#D5CEC0]">
                    <input
                      type="number"
                      step="0.05"
                      min="0.2"
                      max="5.0"
                      value={customUniformGap}
                      onChange={(e) => setCustomUniformGap(e.target.value)}
                      className="w-16 text-center font-mono font-bold text-xs bg-transparent focus:outline-none text-[#1A1918]"
                    />
                    <span className="text-xs text-[#7A7468]">m</span>
                  </div>

                  <button
                    onClick={handleApplyUniformGap}
                    className="px-3.5 py-1.5 bg-[#1A1918] hover:bg-[#33302C] text-white rounded-lg text-xs font-semibold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                  >
                    {lang === 'th' ? 'นำไปใช้' : 'Apply Gap'}
                  </button>
                </div>
              </div>

              {/* Interactive Editable Spacing Ruler Bar (พิมพ์ระยะห่างเฉพาะจุดได้) */}
              <div className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#EAE4D8] overflow-x-auto">
                <div className="flex items-center gap-2 min-w-[550px]">
                  {activeWallSegments.map((seg, sIdx) => {
                    if (seg.type === 'gap') {
                      const isTooClose = seg.distanceMeters < 0.35 || seg.isNegative;
                      return (
                        <div
                          key={`seg-gap-${sIdx}`}
                          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all ${
                            isTooClose
                              ? 'bg-rose-50 border-rose-300 text-rose-800'
                              : 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <ArrowRightLeft className="w-3 h-3 text-[#8C6D3F]" />
                            <input
                              type="number"
                              step="0.05"
                              min="0.1"
                              max="10.0"
                              defaultValue={seg.distanceMeters.toFixed(2)}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  handleUpdateCustomGap(seg.artAId, seg.artBId, val);
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseFloat((e.target as HTMLInputElement).value);
                                  if (!isNaN(val)) {
                                    handleUpdateCustomGap(seg.artAId, seg.artBId, val);
                                  }
                                }
                              }}
                              className="w-14 text-center font-mono text-xs font-bold bg-white/90 border border-[#D5CEC0] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#8C6D3F]"
                              title={lang === 'th' ? 'พิมพ์ระยะห่างและกด Enter' : 'Type distance in meters and press Enter'}
                            />
                            <span className="text-[11px] font-mono">m</span>
                          </div>
                          <span className="text-[9px] text-[#7A7468] truncate max-w-[120px] mt-1">
                            {seg.label}
                          </span>
                        </div>
                      );
                    } else {
                      const art = seg.artwork!;
                      const isSelected = art.id === selectedArtId;
                      return (
                        <div
                          key={`seg-art-${sIdx}`}
                          onClick={() => setSelectedArtId(art.id)}
                          className={`cursor-pointer px-3 py-2 rounded-lg border-2 flex items-center gap-2 transition-all shrink-0 ${
                            isSelected
                              ? 'bg-[#1A1918] text-white border-[#C5A880] shadow-md ring-2 ring-amber-400'
                              : 'bg-white text-[#1A1918] border-[#DDD6C8] hover:border-[#B38F56]'
                          }`}
                        >
                          <div className="relative w-8 h-8 rounded bg-[#1A1918] overflow-hidden shrink-0">
                            <Image src={art.imageUrl} alt={art.title} fill className="object-cover" />
                          </div>
                          <div className="text-left">
                            <p className="font-serif text-xs font-bold truncate max-w-[100px]">
                              #{seg.artIndex} {art.title}
                            </p>
                            <p className="font-mono text-[10px] text-[#8C6D3F] font-semibold">
                              {seg.distanceMeters.toFixed(2)}m
                            </p>
                          </div>
                        </div>
                      );
                    }
                  })}
                </div>
              </div>

              {/* Direct Coordinate Inputs for Selected Artwork */}
              {selectedArtwork && selectedArtwork.wallPosition && (
                <div className="p-4 bg-white rounded-xl border border-[#E0D9CD] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#8C6D3F] flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      <span>{lang === 'th' ? 'พิมพ์พิกัดละเอียด (Direct Coordinate Input)' : 'Direct Metric Coordinate Inputs'}</span>
                    </span>
                    <span className="text-[11px] text-[#7A7468]">
                      #{artworks.findIndex((a) => a.id === selectedArtwork.id) + 1} {selectedArtwork.title}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* X Coordinate Input */}
                    <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#EAE4D8]">
                      <label className="text-[11px] font-semibold text-[#5A554A] block mb-1">
                        {t.admin.horizontalX} (ม.)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min={-maxCoord}
                        max={maxCoord}
                        value={selectedArtwork.wallPosition.x}
                        onChange={(e) => handlePositionChange('x', parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5CEC0] rounded font-mono text-xs font-bold text-[#1A1918] focus:outline-none focus:border-[#8C6D3F]"
                      />
                    </div>

                    {/* Z Coordinate Input */}
                    <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#EAE4D8]">
                      <label className="text-[11px] font-semibold text-[#5A554A] block mb-1">
                        {t.admin.depthZ} (ม.)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min={-maxCoord}
                        max={maxCoord}
                        value={selectedArtwork.wallPosition.z}
                        onChange={(e) => handlePositionChange('z', parseFloat(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5CEC0] rounded font-mono text-xs font-bold text-[#1A1918] focus:outline-none focus:border-[#8C6D3F]"
                      />
                    </div>

                    {/* Y Coordinate Input (Hanging Height) */}
                    <div className="p-2.5 bg-[#FAF8F5] rounded-lg border border-[#EAE4D8]">
                      <label className="text-[11px] font-semibold text-[#5A554A] block mb-1">
                        {t.admin.heightY} (ม.)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        min="1.2"
                        max={roomSize === 'large' ? '4.5' : '3.0'}
                        value={selectedArtwork.wallPosition.y}
                        onChange={(e) => handlePositionChange('y', parseFloat(e.target.value) || 2.0)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5CEC0] rounded font-mono text-xs font-bold text-[#1A1918] focus:outline-none focus:border-[#8C6D3F]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
