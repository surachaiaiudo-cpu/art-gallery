'use client';

import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Exhibition, Artwork } from '@/types/exhibition';
import {
  RoomShape,
  LightPreset,
  CalculatedArtworkSlot,
  RoomGeometryConfig,
} from './types';
import {
  createWhiteEpoxyFloorTexture,
  createFloorBenchContactShadowTexture,
  createFloorPedestalContactShadowTexture,
  createPartitionContactShadowTexture,
  createWallFloorEdgeAOTexture,
  createPlasterWallAOMap,
  createPlasterBumpMap,
} from './MaterialFactory';
import {
  buildMultiRoomConfigs,
  ROOM_W,
  ROOM_H,
  ROOM_D,
  DOOR_W,
  DOOR_H,
  CEILING_HEIGHT,
  EYE_LEVEL_Y,
  ROOM_SPACING_Z,
  ARTWORKS_PER_ROOM,
} from './RoomArchitect';
import { LightingRig } from './LightingRig';
import { Artwork3DFrame } from './Artwork3DFrame';
import { MinimapRadar } from './MinimapRadar';
import { RoomCuratorStudioModal } from './RoomCuratorStudioModal';
import { ArtworkInspectModal } from './ArtworkInspectModal';
import { Mobile3DControls } from './Mobile3DControls';
import { getOptimizedImageUrl } from '@/lib/imagekit';
import {
  Compass,
  Play,
  Pause,
  RotateCcw,
  Layers,
  Shapes,
  Sun,
  Eye,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Building,
  Volume2,
  VolumeX,
  Music,
  ChevronUp,
  ChevronDown,
  RotateCw,
  MapPin,
  HelpCircle,
  Gamepad2,
  MousePointer,
  X,
} from 'lucide-react';
import { museumAudio } from './MuseumSoundscape';

// -------------------------------------------------------------
// 3D Interconnected Museum Gallery Hall Mesh with Real Doorways & Baked Lightmaps
// -------------------------------------------------------------
function makeArtLightmap(
  arts: { pzRel: number; w: number; h: number; cy: number }[],
  mirrored: boolean
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const a of arts) {
    const u = (a.pzRel + ROOM_D / 2) / ROOM_D;
    const cx = (mirrored ? 1 - u : u) * canvas.width;
    const cyPx = (1 - a.cy / ROOM_H) * canvas.height;
    const rx = (a.w * 1.35 / ROOM_D) * canvas.width;

    // 1. Ceiling downlight cone beam
    ctx.save();
    const beamTop = rx * 0.22;
    const beamBot = rx * 0.85;
    const beamGrad = ctx.createLinearGradient(0, 0, 0, cyPx);
    beamGrad.addColorStop(0, 'rgba(255, 243, 218, 0.26)');
    beamGrad.addColorStop(0.75, 'rgba(255, 241, 214, 0.13)');
    beamGrad.addColorStop(1, 'rgba(255, 241, 214, 0)');
    ctx.fillStyle = beamGrad;
    ctx.beginPath();
    ctx.moveTo(cx - beamTop, 0);
    ctx.lineTo(cx + beamTop, 0);
    ctx.lineTo(cx + beamBot, cyPx);
    ctx.lineTo(cx - beamBot, cyPx);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 2. Dual-layer radial spotlight glow (Core + Halo)
    for (const [ryMul, alpha] of [
      [3.4, 0.72],
      [6.0, 0.16],
    ]) {
      const ry = (a.h * ryMul / ROOM_H) * canvas.height;
      ctx.save();
      ctx.translate(cx, cyPx);
      ctx.scale(1, ry / rx);
      const grad = ctx.createRadialGradient(0, 0, rx * 0.06, 0, 0, rx);
      grad.addColorStop(0, `rgba(255, 243, 216, ${alpha})`);
      grad.addColorStop(0.4, `rgba(255, 238, 204, ${alpha * 0.32})`);
      grad.addColorStop(0.75, `rgba(255, 238, 204, ${alpha * 0.08})`);
      grad.addColorStop(1, 'rgba(255, 238, 204, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Module-level lightmap & sign caches (generated only once per room layout, zero canvas repaints on re-render)
const roomLightmapCache = new Map<
  string,
  { left: THREE.CanvasTexture | null; right: THREE.CanvasTexture | null }
>();
const roomSignCache = new Map<number, THREE.CanvasTexture>();

function getRoomLightmaps(
  roomKey: string,
  sideArtL: { pzRel: number; w: number; h: number; cy: number }[],
  sideArtR: { pzRel: number; w: number; h: number; cy: number }[]
) {
  if (roomLightmapCache.has(roomKey)) {
    return roomLightmapCache.get(roomKey)!;
  }

  const left = sideArtL.length > 0 ? makeArtLightmap(sideArtL, true) : null;
  const right = sideArtR.length > 0 ? makeArtLightmap(sideArtR, false) : null;

  const result = { left, right };
  roomLightmapCache.set(roomKey, result);
  return result;
}

function getRoomSignTexture(roomIndex: number): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  if (roomSignCache.has(roomIndex)) {
    return roomSignCache.get(roomIndex)!;
  }
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 84;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#14100D';
    ctx.fillRect(0, 0, 512, 84);
    ctx.fillStyle = '#D8CFBF';
    ctx.font = '300 38px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const letter = String.fromCharCode(65 + roomIndex);
    ctx.fillText(`E X H I B I T   ${letter}`, 256, 44);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  roomSignCache.set(roomIndex, t);
  return t;
}

// Module-level static architectural materials singleton (Modern White Cube aesthetic)
const roomArchMaterials = {
  baseboard: new THREE.MeshStandardMaterial({ color: '#E4E7EA', roughness: 0.35, metalness: 0.1 }),
  trim: new THREE.MeshStandardMaterial({ color: '#16181B', roughness: 0.3, metalness: 0.2 }),
  track: new THREE.MeshStandardMaterial({ color: '#E2E6EA', roughness: 0.2, metalness: 0.85 }),
  trackRailBlack: new THREE.MeshStandardMaterial({ color: '#161719', roughness: 0.35, metalness: 0.8 }),
  head: new THREE.MeshStandardMaterial({ color: '#F0F3F6', roughness: 0.25, metalness: 0.7 }),
  lens: new THREE.MeshStandardMaterial({ color: '#FFF8EB', emissive: '#FFF8EB', emissiveIntensity: 2.2 }),
  benchTop: new THREE.MeshStandardMaterial({ color: '#7A522E', roughness: 0.55, metalness: 0.05 }), // Warm teak/oak wood
  benchLeg: new THREE.MeshStandardMaterial({ color: '#141517', roughness: 0.3, metalness: 0.85 }), // Matte black industrial metal
  pot: new THREE.MeshStandardMaterial({ color: '#E0E3E6', roughness: 0.4 }),
  soil: new THREE.MeshStandardMaterial({ color: '#1E1914', roughness: 1.0 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#2C4A26', roughness: 0.75 }),
  facetedPedestal: new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 0.22, metalness: 0.05 }), // Crisp white faceted geometric pedestal
  bronze: new THREE.MeshPhysicalMaterial({ color: '#C49A45', roughness: 0.2, metalness: 0.95, clearcoat: 0.6 }),
  darkSteel: new THREE.MeshPhysicalMaterial({ color: '#1A1C20', roughness: 0.25, metalness: 0.9, clearcoat: 0.5 }),
  windowGlass: new THREE.MeshPhysicalMaterial({ color: '#EAF3FC', transmission: 0.9, opacity: 0.4, transparent: true, roughness: 0.05, ior: 1.5 }),
  windowFrame: new THREE.MeshStandardMaterial({ color: '#181A1D', roughness: 0.35, metalness: 0.7 }),
  windowDaylightGlow: new THREE.MeshBasicMaterial({ color: '#F8FCFF' }),
};

// Procedural Semicircular Roman Arch Wall Geometry (Cached singleton)
const archWallGeoCache = new Map<string, THREE.BufferGeometry>();

function getArchWallGeometry(wallW: number, wallH: number, doorW: number = DOOR_W, straightH: number = 2.4): THREE.BufferGeometry {
  const key = `${wallW}_${wallH}_${doorW}_${straightH}`;
  if (archWallGeoCache.has(key)) return archWallGeoCache.get(key)!;

  const shape = new THREE.Shape();
  // Outer rectangle: from bottom-left (-w/2, 0) up to top-right (w/2, h)
  shape.moveTo(-wallW / 2, 0);
  shape.lineTo(wallW / 2, 0);
  shape.lineTo(wallW / 2, wallH);
  shape.lineTo(-wallW / 2, wallH);
  shape.closePath();

  // Inner semicircular arch opening
  const r = doorW / 2;
  const hole = new THREE.Path();
  hole.moveTo(-r, 0);
  hole.lineTo(-r, straightH);
  // Semicircle arc at top: from angle PI (left) to 0 (right) clockwise
  hole.absarc(0, straightH, r, Math.PI, 0, true);
  hole.lineTo(r, 0);
  hole.lineTo(-r, 0);
  hole.closePath();

  shape.holes.push(hole);
  const geo = new THREE.ShapeGeometry(shape, 32);
  geo.computeVertexNormals();

  if (geo.attributes.uv) {
    geo.setAttribute('uv2', geo.attributes.uv.clone());
  }

  archWallGeoCache.set(key, geo);
  return geo;
}

// Neoclassical Semicircular Roman Arch Trim Molding (คิ้วบัวซุ้มประตูโค้ง)
function RomanArchTrim({ doorW = DOOR_W, straightH = 2.4 }: { doorW?: number; straightH?: number }) {
  const r = doorW / 2;
  return (
    <group position={[0, 0, 0]}>
      {/* Left Vertical Pilaster Column */}
      <mesh position={[-r - 0.035, straightH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.07, straightH, 0.12]} />
        <primitive object={roomArchMaterials.trim} attach="material" />
      </mesh>
      {/* Right Vertical Pilaster Column */}
      <mesh position={[r + 0.035, straightH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.07, straightH, 0.12]} />
        <primitive object={roomArchMaterials.trim} attach="material" />
      </mesh>
      {/* Left Capital Block */}
      <mesh position={[-r - 0.035, straightH, 0.01]}>
        <boxGeometry args={[0.11, 0.06, 0.14]} />
        <primitive object={roomArchMaterials.trim} attach="material" />
      </mesh>
      {/* Right Capital Block */}
      <mesh position={[r + 0.035, straightH, 0.01]}>
        <boxGeometry args={[0.11, 0.06, 0.14]} />
        <primitive object={roomArchMaterials.trim} attach="material" />
      </mesh>
      {/* Semicircular Arch Top Molding Rim */}
      <mesh position={[0, straightH, 0]}>
        <torusGeometry args={[r + 0.035, 0.035, 12, 36, Math.PI]} />
        <primitive object={roomArchMaterials.trim} attach="material" />
      </mesh>
      {/* Central Keystone (หินก้อนยอดซุ้มโค้ง) */}
      <mesh position={[0, straightH + r + 0.035, 0.015]}>
        <boxGeometry args={[0.18, 0.12, 0.14]} />
        <primitive object={roomArchMaterials.trim} attach="material" />
      </mesh>
    </group>
  );
}

function RoomStructureMesh({
  config,
  epoxyFloorTex,
  benchShadowTex,
  pedestalShadowTex,
  partitionShadowTex,
  wallFloorEdgeAOTex,
  wallAOTex,
  wallBumpTex,
  spotlightIntensity = 1.0,
}: {
  config: RoomGeometryConfig;
  epoxyFloorTex: THREE.CanvasTexture | null;
  benchShadowTex: THREE.CanvasTexture | null;
  pedestalShadowTex: THREE.CanvasTexture | null;
  partitionShadowTex: THREE.CanvasTexture | null;
  wallFloorEdgeAOTex: THREE.CanvasTexture | null;
  wallAOTex: THREE.CanvasTexture | null;
  wallBumpTex: THREE.CanvasTexture | null;
  spotlightIntensity?: number;
}) {
  const h = config.height || ROOM_H;
  const w = config.width || ROOM_W;
  const d = config.depth || ROOM_D;
  const withDoorFront = config.doorways?.front || false;
  const withDoorBack = config.doorways?.back || false;
  const segW = (w - DOOR_W) / 2;

  // Memoize left & right wall artwork positions based on config
  const { sideArtL, sideArtR, roomKey } = useMemo(() => {
    const l: { pzRel: number; w: number; h: number; cy: number }[] = [];
    const r: { pzRel: number; w: number; h: number; cy: number }[] = [];
    config.slots.forEach((slot) => {
      if (!slot.artwork) return;
      const isLeft = slot.wallIndex === 3 || slot.position.x < 0;
      const item = { pzRel: slot.position.z, w: 2.1, h: 1.4, cy: slot.position.y || EYE_LEVEL_Y };
      if (isLeft) l.push(item);
      else r.push(item);
    });
    const key = `room_${config.roomIndex}_${l.length}_${r.length}_${config.slots.map((s) => s.artwork?.id || '').join('_')}`;
    return { sideArtL: l, sideArtR: r, roomKey: key };
  }, [config]);


  // Baked spotlight lightmap textures retrieved from module cache (0 canvas repaints per render pass)
  const lightmaps = useMemo(() => {
    return getRoomLightmaps(roomKey, sideArtL, sideArtR);
  }, [roomKey, sideArtL, sideArtR]);

  const wallBaseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#F8F9FB', // Crisp contemporary gallery white
        roughness: 0.90,
        metalness: 0.01,
        side: THREE.FrontSide,
      }),
    []
  );

  // Baked Wall Left Material with cached procedural spotlight lightmap
  const wallMatLeft = useMemo(() => {
    const m = wallBaseMat.clone();
    if (lightmaps.left) {
      m.emissive = new THREE.Color('#FFFFFF');
      m.emissiveMap = lightmaps.left;
      m.emissiveIntensity = spotlightIntensity;
    }
    return m;
  }, [wallBaseMat, lightmaps.left, spotlightIntensity]);

  // Baked Wall Right Material with cached procedural spotlight lightmap
  const wallMatRight = useMemo(() => {
    const m = wallBaseMat.clone();
    if (lightmaps.right) {
      m.emissive = new THREE.Color('#FFFFFF');
      m.emissiveMap = lightmaps.right;
      m.emissiveIntensity = spotlightIntensity;
    }
    return m;
  }, [wallBaseMat, lightmaps.right, spotlightIntensity]);

  // Modern High-Gloss White Epoxy Floor Material
  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#F2F5F8',
        roughness: 0.16, // High-gloss specular sheen
        metalness: 0.08,
        side: THREE.DoubleSide,
        map: epoxyFloorTex || undefined,
      }),
    [epoxyFloorTex]
  );

  // Modern Matte Black / Dark Charcoal Exposed Ceiling Material
  const ceilingMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#131416',
        roughness: 0.95,
        metalness: 0.05,
      }),
    []
  );

  // Exhibit room sign texture (retrieved from module cache)
  const signTex = useMemo(() => {
    return getRoomSignTexture(config.roomIndex);
  }, [config.roomIndex]);

  if (config.isCornerPavilion) {
    const pw = config.width || 14;
    const pd = config.depth || 14;
    const pSegW = (pw - DOOR_W) / 2;
    const pSegD = (pd - DOOR_W) / 2;

    return (
      <group>
        {/* Floor - Glossy White Epoxy */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[pw, pd]} />
          <primitive object={floorMaterial} attach="material" />
        </mesh>

        {/* Wall-Floor Junction Baseboard Ambient Occlusion Crevice Shadows */}
        {wallFloorEdgeAOTex && (
          <>
            {/* Left Wall AO */}
            <mesh position={[-pw / 2 + 0.35, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.7, pd]} />
              <meshBasicMaterial map={wallFloorEdgeAOTex} transparent opacity={0.75} depthWrite={false} />
            </mesh>
            {/* Back Wall AO */}
            <mesh position={[0, 0.002, -pd / 2 + 0.35]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}>
              <planeGeometry args={[0.7, pw]} />
              <meshBasicMaterial map={wallFloorEdgeAOTex} transparent opacity={0.75} depthWrite={false} />
            </mesh>
          </>
        )}

        {/* Ceiling - Matte Charcoal Black */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
          <planeGeometry args={[pw, pd]} />
          <primitive object={ceilingMaterial} attach="material" />
        </mesh>

        {/* Modern Suspended Ceiling Track Light Grid */}
        <group position={[0, h - 0.08, 0]}>
          {[-pw / 4, pw / 4].map((gx, gi) => (
            <mesh key={`p-track-x-${gi}`} position={[gx, 0, 0]}>
              <boxGeometry args={[0.06, 0.08, pd - 2]} />
              <primitive object={roomArchMaterials.track} attach="material" />
            </mesh>
          ))}
          {[-pd / 4, pd / 4].map((gz, gi) => (
            <mesh key={`p-track-z-${gi}`} position={[0, 0, gz]}>
              <boxGeometry args={[pw - 2, 0.08, 0.06]} />
              <primitive object={roomArchMaterials.track} attach="material" />
            </mesh>
          ))}
        </group>

        {/* Pavilion Ambient Downlight */}
        <pointLight
          position={[0, h - 0.4, 0]}
          intensity={2.8}
          distance={20}
          decay={1.2}
          color="#FFF8F0"
        />

        {/* Front Wall (z = +pd/2) -> Roman Semicircular Arch Entrance */}
        <group position={[0, 0, pd / 2 - 0.005]}>
          <mesh rotation={[0, Math.PI, 0]} receiveShadow geometry={getArchWallGeometry(pw, h, DOOR_W, 2.4)}>
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          <RomanArchTrim doorW={DOOR_W} straightH={2.4} />
        </group>

        {/* Back Wall (z = -pd/2) -> Architectural Daylight Window / Solid wall */}
        <group position={[0, 0, -pd / 2]}>
          <mesh position={[0, h / 2, 0]} receiveShadow>
            <planeGeometry args={[pw, h]} />
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          {/* Daylight Atrium Window on Pavilion Back Wall */}
          <group position={[0, h / 2, 0.02]}>
            <mesh position={[0, 0, -0.04]}>
              <planeGeometry args={[6.8, 3.8]} />
              <primitive object={roomArchMaterials.windowDaylightGlow} attach="material" />
            </mesh>
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[6.6, 3.6]} />
              <primitive object={roomArchMaterials.windowGlass} attach="material" />
            </mesh>
            {[-2.0, 0, 2.0].map((mx, mi) => (
              <mesh key={`p-mull-v-${mi}`} position={[mx, 0, 0.01]}>
                <boxGeometry args={[0.06, 3.6, 0.04]} />
                <primitive object={roomArchMaterials.windowFrame} attach="material" />
              </mesh>
            ))}
            <mesh position={[0, 0, 0.01]}>
              <boxGeometry args={[6.6, 0.06, 0.04]} />
              <primitive object={roomArchMaterials.windowFrame} attach="material" />
            </mesh>
          </group>
        </group>

        {/* Left Wall (x = -pw/2) -> Solid wall */}
        <mesh position={[-pw / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <planeGeometry args={[pd, h]} />
          <primitive object={wallBaseMat} attach="material" />
        </mesh>

        {/* Right Wall (x = +pw/2) -> Roman Semicircular Arch Exit (Right Turn) */}
        <group position={[pw / 2 - 0.005, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <mesh receiveShadow geometry={getArchWallGeometry(pd, h, DOOR_W, 2.4)}>
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          <RomanArchTrim doorW={DOOR_W} straightH={2.4} />
        </group>

        {/* Central Modern Faceted Polygon Pedestal with Floor Contact Shadow */}
        <group position={[0, 0, 0]}>
          {/* Soft Radial Contact Shadow on Floor */}
          {pedestalShadowTex && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <planeGeometry args={[2.2, 2.2]} />
              <meshBasicMaterial map={pedestalShadowTex} transparent opacity={0.85} depthWrite={false} />
            </mesh>
          )}
          {/* Faceted Geometric Sculpture Pedestal (Chiseled Modern Polygon) */}
          <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.56, 0.42, 0.96, 6]} />
            <primitive object={roomArchMaterials.facetedPedestal} attach="material" />
          </mesh>
          {/* Contemporary Bronze / Gold Sculpture */}
          <mesh position={[0, 1.48, 0]} rotation={[0.4, 0.6, 0]}>
            <torusKnotGeometry args={[0.36, 0.1, 120, 16]} />
            <primitive object={roomArchMaterials.bronze} attach="material" />
          </mesh>
        </group>

        {/* 2 Decorative Minimalist Plants */}
        {[
          [-pw / 2 + 1.2, -pd / 2 + 1.2],
          [-pw / 2 + 1.2, pd / 2 - 1.2],
        ].map(([px, pz], pi) => (
          <group key={`pav-plant-${pi}`} position={[px, 0, pz]}>
            {pedestalShadowTex && (
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
                <planeGeometry args={[1.2, 1.2]} />
                <meshBasicMaterial map={pedestalShadowTex} transparent opacity={0.65} depthWrite={false} />
              </mesh>
            )}
            <mesh position={[0, 0.275, 0]}>
              <cylinderGeometry args={[0.32, 0.24, 0.55, 12]} />
              <primitive object={roomArchMaterials.pot} attach="material" />
            </mesh>
            <mesh position={[0, 0.54, 0]}>
              <cylinderGeometry args={[0.28, 0.28, 0.04, 12]} />
              <primitive object={roomArchMaterials.soil} attach="material" />
            </mesh>
            {Array.from({ length: 6 }).map((_, f) => (
              <mesh
                key={f}
                position={[
                  Math.sin(f * 2.5 + pi) * (0.22 + f * 0.03),
                  0.75 + f * 0.16,
                  Math.cos(f * 2.5 + pi) * (0.22 + f * 0.03),
                ]}
                scale={[1, 0.75, 1]}
              >
                <sphereGeometry args={[0.26 - f * 0.02, 8, 6]} />
                <primitive object={roomArchMaterials.leaf} attach="material" />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    );
  }

  return (
    <group>
      {/* 1. Floor - High-Gloss White Epoxy with Reflective Specular */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* 1.1 Wall-to-Floor Junction Baseboard Ambient Occlusion Crevice Shadows */}
      {wallFloorEdgeAOTex && (
        <>
          {/* Left Wall Floor AO Strip */}
          <mesh position={[-w / 2 + 0.35, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.7, d]} />
            <meshBasicMaterial map={wallFloorEdgeAOTex} transparent opacity={0.75} depthWrite={false} />
          </mesh>
          {/* Right Wall Floor AO Strip */}
          <mesh position={[w / 2 - 0.35, 0.002, 0]} rotation={[-Math.PI / 2, 0, Math.PI]}>
            <planeGeometry args={[0.7, d]} />
            <meshBasicMaterial map={wallFloorEdgeAOTex} transparent opacity={0.75} depthWrite={false} />
          </mesh>
        </>
      )}

      {/* 2. Ceiling - Matte Charcoal Black Industrial Museum Roof */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <primitive object={ceilingMaterial} attach="material" />
      </mesh>

      {/* 3. Left Wall with Spotlight Lightmap (x = -w/2) */}
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
        <primitive object={wallMatLeft} attach="material" />
      </mesh>

      {/* 4. Right Wall with Spotlight Lightmap (x = w/2) */}
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
        <primitive object={wallMatRight} attach="material" />
      </mesh>

      {/* 5. Two Central Freestanding Exhibition Partition Islands (ผนังลอยกลางห้อง 2 แถว แขวนรวม 12 ภาพ) */}
      {[6.0, -6.0].map((pz, pi) => (
        <group key={`partition-${pi}`} position={[0, 0, pz]}>
          {/* Dedicated Architectural Ambient Occlusion Contact Shadow on Floor under Partition */}
          {partitionShadowTex && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
              <planeGeometry args={[6.0, 1.2]} />
              <meshBasicMaterial map={partitionShadowTex} transparent opacity={0.92} depthWrite={false} />
            </mesh>
          )}
          {/* Floating White Exhibition Partition Wall */}
          <mesh position={[0, 1.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.6, 3.6, 0.38]} />
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          {/* Partition Top Accent Rail */}
          <mesh position={[0, 3.62, 0]}>
            <boxGeometry args={[5.64, 0.04, 0.4]} />
            <primitive object={roomArchMaterials.baseboard} attach="material" />
          </mesh>
          {/* Dedicated Suspended Overhead Track Lights */}
          <mesh position={[0, h - 0.08, 0]}>
            <boxGeometry args={[5.8, 0.08, 0.05]} />
            <primitive object={roomArchMaterials.track} attach="material" />
          </mesh>
        </group>
      ))}

      {/* 6. Ceiling Track Light Rails and White Spotlight Fixtures */}
      {[-1, 1].map((sd) => {
        const tx = sd * (w / 2 - 1.2);
        const arts = sd === -1 ? sideArtL : sideArtR;
        return (
          <group key={`track-${sd}`}>
            {/* White Suspended Lighting Rail */}
            <mesh position={[tx, h - 0.08, 0]}>
              <boxGeometry args={[0.05, 0.1, d]} />
              <primitive object={roomArchMaterials.track} attach="material" />
            </mesh>
            {/* Suspended Steel Hanger Rods to Ceiling */}
            {[-d / 3, 0, d / 3].map((rz, ri) => (
              <mesh key={`rod-${ri}`} position={[tx, h - 0.04, rz]}>
                <cylinderGeometry args={[0.008, 0.008, 0.08, 8]} />
                <primitive object={roomArchMaterials.trim} attach="material" />
              </mesh>
            ))}
            {/* White Fixture heads pointing at each artwork */}
            {arts.map((a, ai) => (
              <group
                key={`fixture-${ai}`}
                position={[tx, h - 0.1, a.pzRel]}
                rotation={[0.35, sd === -1 ? -Math.PI / 2 : Math.PI / 2, 0]}
              >
                <mesh position={[0, -0.035, 0]}>
                  <boxGeometry args={[0.035, 0.07, 0.035]} />
                  <primitive object={roomArchMaterials.track} attach="material" />
                </mesh>
                <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.038, 0.06, 0.24, 14]} />
                  <primitive object={roomArchMaterials.head} attach="material" />
                </mesh>
                <mesh position={[0, 0, 0.232]}>
                  <circleGeometry args={[0.046, 14]} />
                  <primitive object={roomArchMaterials.lens} attach="material" />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* Central Track Light for Freestanding Partition */}
      <mesh position={[0, h - 0.08, 0]}>
        <boxGeometry args={[0.05, 0.1, 7.0]} />
        <primitive object={roomArchMaterials.track} attach="material" />
      </mesh>

      {/* 7. Warm Ambient Museum Ceiling Wash Lights */}
      <pointLight
        position={[0, h - 0.3, 0]}
        intensity={3.2}
        distance={26}
        decay={1.1}
        color="#FFF8EC"
      />

      {/* 8. Minimalist Baseboards Left & Right */}
      <mesh position={[-w / 2 + 0.02, 0.05, 0]}>
        <boxGeometry args={[0.04, 0.1, d]} />
        <primitive object={roomArchMaterials.baseboard} attach="material" />
      </mesh>
      <mesh position={[w / 2 - 0.02, 0.05, 0]}>
        <boxGeometry args={[0.04, 0.1, d]} />
        <primitive object={roomArchMaterials.baseboard} attach="material" />
      </mesh>

      {/* 9. Front Wall (z = d/2) */}
      {!withDoorFront ? (
        <mesh position={[0, h / 2, d / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
          <planeGeometry args={[w, h]} />
          <primitive object={wallBaseMat} attach="material" />
        </mesh>
      ) : (
        <group position={[0, 0, d / 2 - 0.005]}>
          <mesh rotation={[0, Math.PI, 0]} receiveShadow geometry={getArchWallGeometry(w, h, DOOR_W, 2.4)}>
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          <RomanArchTrim doorW={DOOR_W} straightH={2.4} />
        </group>
      )}

      {/* 10. Back Wall (z = -d/2) with Architectural Daylight Window */}
      {!withDoorBack ? (
        <group position={[0, 0, -d / 2]}>
          {/* Solid Wall Surface */}
          <mesh position={[0, h / 2, 0]} receiveShadow>
            <planeGeometry args={[w, h]} />
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          {/* Grand Floor-to-Ceiling Daylight Atrium Window */}
          <group position={[0, h / 2, 0.02]}>
            {/* Exterior Bright Natural Light Wash */}
            <mesh position={[0, 0, -0.04]}>
              <planeGeometry args={[7.8, 4.2]} />
              <primitive object={roomArchMaterials.windowDaylightGlow} attach="material" />
            </mesh>
            {/* Window Glass Plane */}
            <mesh position={[0, 0, 0]}>
              <planeGeometry args={[7.6, 4.0]} />
              <primitive object={roomArchMaterials.windowGlass} attach="material" />
            </mesh>
            {/* Minimalist Dark Metal Window Mullions */}
            {[-2.5, 0, 2.5].map((mx, mi) => (
              <mesh key={`mull-v-${mi}`} position={[mx, 0, 0.01]}>
                <boxGeometry args={[0.06, 4.0, 0.04]} />
                <primitive object={roomArchMaterials.windowFrame} attach="material" />
              </mesh>
            ))}
            <mesh position={[0, 0, 0.01]}>
              <boxGeometry args={[7.6, 0.06, 0.04]} />
              <primitive object={roomArchMaterials.windowFrame} attach="material" />
            </mesh>
          </group>
        </group>
      ) : (
        <group position={[0, 0, -d / 2 + 0.005]}>
          <mesh receiveShadow geometry={getArchWallGeometry(w, h, DOOR_W, 2.4)}>
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          <RomanArchTrim doorW={DOOR_W} straightH={2.4} />
        </group>
      )}

      {/* 11. Exhibit Signboard above front entrance arch */}
      {signTex && (
        <mesh position={[0, 4.38, d / 2 - 0.06]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[2.8, 0.36]} />
          <meshStandardMaterial
            map={signTex}
            emissiveMap={signTex}
            emissive="#FFFFFF"
            emissiveIntensity={0.35}
            roughness={0.4}
          />
        </mesh>
      )}

      {/* 12. 2 Modern Loft Benches with Floor Contact Shadows */}
      {[-d / 4, d / 4].map((bz, i) => (
        <group key={`bench-${i}`} position={[i === 0 ? 3.5 : -3.5, 0, bz]}>
          {/* Soft Floor Drop Shadow Plane */}
          {benchShadowTex && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <planeGeometry args={[3.4, 1.4]} />
              <meshBasicMaterial map={benchShadowTex} transparent opacity={0.78} depthWrite={false} />
            </mesh>
          )}
          {/* Solid Natural Teak Wood Plank */}
          <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.8, 0.09, 0.8]} />
            <primitive object={roomArchMaterials.benchTop} attach="material" />
          </mesh>
          {/* Matte Black Metal Loop Legs at each end */}
          {[-1.15, 1.15].map((lx, li) => (
            <mesh key={`leg-${li}`} position={[lx, 0.2, 0]}>
              <boxGeometry args={[0.08, 0.38, 0.76]} />
              <primitive object={roomArchMaterials.benchLeg} attach="material" />
            </mesh>
          ))}
        </group>
      ))}

      {/* 13. Modern White Faceted Polygon Pedestal with Contact Shadow */}
      <group position={[0, 0, 4.8]}>
        {/* Soft Radial Contact Shadow on Floor */}
        {pedestalShadowTex && (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
            <planeGeometry args={[1.8, 1.8]} />
            <meshBasicMaterial map={pedestalShadowTex} transparent opacity={0.82} depthWrite={false} />
          </mesh>
        )}
        {/* Crisp White Faceted Geometric Pedestal */}
        <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.55, 0.42, 0.96, 6]} />
          <primitive object={roomArchMaterials.facetedPedestal} attach="material" />
        </mesh>
      </group>

      {/* 14. 2 Minimalist Sculptures on Corner Pedestals */}
      {[
        [-2.9, -d / 2 + 5.5, 'bronze'],
        [2.9, d / 2 - 5.5, 'steel'],
      ].map(([sx, sz, type], si) => (
        <group key={`sculpt-${si}`} position={[Number(sx), 0, Number(sz)]}>
          {pedestalShadowTex && (
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
              <planeGeometry args={[1.4, 1.4]} />
              <meshBasicMaterial map={pedestalShadowTex} transparent opacity={0.7} depthWrite={false} />
            </mesh>
          )}
          <mesh position={[0, 0.525, 0]}>
            <boxGeometry args={[0.55, 1.05, 0.55]} />
            <primitive object={roomArchMaterials.facetedPedestal} attach="material" />
          </mesh>
          {type === 'bronze' ? (
            <mesh position={[0, 1.42, 0]} rotation={[0.6, 0, 0]}>
              <torusKnotGeometry args={[0.24, 0.08, 90, 14]} />
              <primitive object={roomArchMaterials.bronze} attach="material" />
            </mesh>
          ) : (
            <mesh position={[0, 1.4, 0]} rotation={[0, 0, 0.3]}>
              <icosahedronGeometry args={[0.3, 1]} />
              <primitive object={roomArchMaterials.darkSteel} attach="material" />
            </mesh>
          )}
        </group>
      ))}
    </group>
  );
}

// -------------------------------------------------------------
// Interactive Camera Rig Controller (WASD, Arrow Turn & Radar Sync)
// -------------------------------------------------------------
function rotatePointY(x: number, z: number, angleRad: number) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: x * cos + z * sin,
    z: -x * sin + z * cos,
  };
}

function findCurrentRoomIndex(
  playerPos: { x: number; z: number },
  configs: RoomGeometryConfig[],
  fallbackIdx: number
): number {
  let bestIdx = fallbackIdx;
  let minSqDist = Infinity;

  for (let i = 0; i < configs.length; i++) {
    const room = configs[i];
    const dx = playerPos.x - room.center.x;
    const dz = playerPos.z - room.center.z;
    const local = rotatePointY(dx, dz, -room.rotationY);
    const halfW = (room.width || ROOM_W) / 2;
    const halfD = (room.depth || ROOM_D) / 2;

    if (Math.abs(local.x) <= halfW + 0.3 && Math.abs(local.z) <= halfD + 0.3) {
      const sqDist = dx * dx + dz * dz;
      if (sqDist < minSqDist) {
        minSqDist = sqDist;
        bestIdx = i;
      }
    }
  }
  return bestIdx;
}

// -------------------------------------------------------------
// Approach 1: Scene Warmup Helper (Pre-compile shaders on load)
// -------------------------------------------------------------
function SceneWarmupHelper({ onReady }: { onReady?: () => void }) {
  const { gl, scene, camera } = useThree();

  useEffect(() => {
    try {
      gl.compile(scene, camera);
    } catch (e) {
      console.warn('Scene warmup compile:', e);
    }
    if (onReady) {
      const timer = setTimeout(onReady, 500);
      return () => clearTimeout(timer);
    }
  }, [gl, scene, camera, onReady]);

  return null;
}

interface CameraControllerProps {
  focusedArtwork: Artwork | null;
  focusedSlot: CalculatedArtworkSlot | null;
  onClearFocus: () => void;
  currentRoomConfig: RoomGeometryConfig;
  roomConfigs: RoomGeometryConfig[];
  currentRoomIndex: number;
  onRoomChange: (newRoomIdx: number) => void;
  controlsRef: React.RefObject<any>;
  activeKeys: React.MutableRefObject<{ [key: string]: boolean }>;
  cameraTransformRef: React.MutableRefObject<{ x: number; z: number; rotY: number }>;
  warpTarget: { x: number; z: number; rotY?: number } | null;
  onClearWarp: () => void;
  onAimArtwork: (artwork: Artwork | null, slot: CalculatedArtworkSlot | null) => void;
  onMarkViewed: (artworkId: string) => void;
  onTogglePointerLock?: (locked: boolean) => void;
}

function CameraController({
  focusedArtwork,
  focusedSlot,
  onClearFocus,
  currentRoomConfig,
  roomConfigs,
  currentRoomIndex,
  onRoomChange,
  controlsRef,
  activeKeys,
  cameraTransformRef,
  warpTarget,
  onClearWarp,
  onAimArtwork,
  onMarkViewed,
  onTogglePointerLock,
}: CameraControllerProps) {
  const { camera, raycaster, scene, gl } = useThree();
  const targetCamPos = useRef(new THREE.Vector3(0, 1.8, ROOM_D / 2 - 3));
  const screenCenter = useRef(new THREE.Vector2(0, 0));
  const aimHoldTimeRef = useRef(0);
  const aimedArtworkIdRef = useRef<string | null>(null);
  const prevRaycastPos = useRef(new THREE.Vector3());
  const prevRaycastYawPitch = useRef({ yaw: -999, pitch: -999 });
  const lastHitResult = useRef<{ artwork: Artwork | null; slot: CalculatedArtworkSlot | null }>({ artwork: null, slot: null });
  const lastRoomChangeTimeRef = useRef(0);

  // Option 1: Cinematic Quick-Glide Warp State (0.36s High-Speed Luxury Drone Glide)
  const isGliding = useRef(false);
  const glideStartPos = useRef(new THREE.Vector3());
  const glideEndPos = useRef(new THREE.Vector3());
  const glideStartYaw = useRef(0);
  const glideEndYaw = useRef(0);
  const glideStartTime = useRef(0);
  const glideDuration = 360; // 360ms fast smooth ease-out flight

  // First-Person Free-Look State (Yaw: Left/Right, Pitch: Up/Down)
  const isPointerDown = useRef(false);
  const pointerStart = useRef({ x: 0, y: 0 });
  const yaw = useRef(0); // Horizontal angle in radians (0 = looking down -Z)
  const pitch = useRef(0); // Vertical angle in radians (0 = horizontal, >0 = up, <0 = down)
  const targetYaw = useRef(0);
  const targetPitch = useRef(0);
  const isInitialized = useRef(false);

  // Initialize initial camera angles
  useEffect(() => {
    if (!isInitialized.current) {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const initYaw = Math.atan2(dir.x, -dir.z);
      const initPitch = Math.asin(Math.max(-1, Math.min(1, dir.y)));
      yaw.current = initYaw;
      targetYaw.current = initYaw;
      pitch.current = initPitch;
      targetPitch.current = initPitch;
      isInitialized.current = true;
    }
  }, [camera]);

  // Handle Warp Trigger from Minimap or Room Switcher with Cinematic Quick-Glide
  useEffect(() => {
    if (warpTarget) {
      glideStartPos.current.copy(camera.position);
      glideEndPos.current.set(warpTarget.x, 1.8, warpTarget.z);
      glideStartYaw.current = yaw.current;
      const newYaw = warpTarget.rotY ?? 0;
      glideEndYaw.current = newYaw;
      glideStartTime.current = performance.now();
      isGliding.current = true;
      targetPitch.current = 0;
      onClearWarp();
    }
  }, [warpTarget, onClearWarp, camera]);

  // Mouse / Pointer Lock & Drag Look-Around (Left, Right, Up, Down)
  useEffect(() => {
    const dom = gl.domElement;
    if (!dom) return;

    dom.style.cursor = 'grab';

    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === dom;
      if (onTogglePointerLock) {
        onTogglePointerLock(isLocked);
      }
      dom.style.cursor = isLocked ? 'crosshair' : 'grab';
    };

    const onPointerDown = (e: PointerEvent) => {
      if (document.pointerLockElement === dom) return;
      isPointerDown.current = true;
      pointerStart.current = { x: e.clientX, y: e.clientY };
      dom.style.cursor = 'grabbing';
    };

    const onPointerMove = (e: PointerEvent) => {
      const isLocked = document.pointerLockElement === dom;

      if (isLocked) {
        // 🎮 FPS Game Mode: Move mouse directly without clicking!
        const dx = e.movementX || 0;
        const dy = e.movementY || 0;

        if (Math.abs(dx) > 0 || Math.abs(dy) > 0) {
          if (focusedArtwork || focusedSlot) {
            onClearFocus();
          }
        }

        const sensitivity = 0.0022;
        targetYaw.current += dx * sensitivity;
        targetPitch.current = Math.max(-1.3, Math.min(1.3, targetPitch.current - dy * sensitivity));
      } else if (isPointerDown.current) {
        // 🖱️ Classic Mode: Click & Drag to look around
        const dx = e.clientX - pointerStart.current.x;
        const dy = e.clientY - pointerStart.current.y;
        pointerStart.current = { x: e.clientX, y: e.clientY };

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          if (focusedArtwork || focusedSlot) {
            onClearFocus();
          }
        }

        const sensitivity = 0.0034;
        targetYaw.current += dx * sensitivity;
        targetPitch.current = Math.max(-1.3, Math.min(1.3, targetPitch.current - dy * sensitivity));
      }
    };

    const onPointerUp = () => {
      isPointerDown.current = false;
      if (document.pointerLockElement !== dom) {
        dom.style.cursor = 'grab';
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = Math.max(35, Math.min(75, camera.fov + e.deltaY * 0.04));
        camera.updateProjectionMatrix();
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: true });

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
    };
  }, [gl, camera, focusedArtwork, focusedSlot, onClearFocus, onTogglePointerLock]);

  useFrame((state, delta) => {
    // 0. Raycast center screen to detect aimed artwork (optimized with motion detection & targeted artwork groups)
    const posDistSq = prevRaycastPos.current.distanceToSquared(camera.position);
    const yawDelta = Math.abs(prevRaycastYawPitch.current.yaw - yaw.current);
    const pitchDelta = Math.abs(prevRaycastYawPitch.current.pitch - pitch.current);
    const shouldRaycast = posDistSq > 0.0004 || yawDelta > 0.001 || pitchDelta > 0.001;

    let hitArtwork: Artwork | null = lastHitResult.current.artwork;
    let hitSlot: CalculatedArtworkSlot | null = lastHitResult.current.slot;

    if (shouldRaycast) {
      prevRaycastPos.current.copy(camera.position);
      prevRaycastYawPitch.current = { yaw: yaw.current, pitch: pitch.current };

      raycaster.setFromCamera(screenCenter.current, camera);
      raycaster.far = 12.0;

      // Filter only visible group children containing artwork userData
      const interactables: THREE.Object3D[] = [];
      for (const child of scene.children) {
        if (child.visible && (child as any).isGroup && child.children.length > 0) {
          for (const sub of child.children) {
            if (sub.userData?.artwork && sub.userData?.slot) {
              interactables.push(sub);
            }
          }
        }
      }

      const intersects = interactables.length > 0
        ? raycaster.intersectObjects(interactables, true)
        : raycaster.intersectObjects(scene.children, true);

      hitArtwork = null;
      hitSlot = null;

      for (const hit of intersects) {
        let obj: THREE.Object3D | null = hit.object;
        while (obj) {
          if (obj.userData?.artwork && obj.userData?.slot) {
            hitArtwork = obj.userData.artwork;
            hitSlot = obj.userData.slot;
            break;
          }
          obj = obj.parent;
        }
        if (hitArtwork) break;
      }

      lastHitResult.current = { artwork: hitArtwork, slot: hitSlot };
    }

    const hitId = hitArtwork?.id || null;
    if (hitId !== aimedArtworkIdRef.current) {
      aimedArtworkIdRef.current = hitId;
      onAimArtwork(hitArtwork, hitSlot);
    }

    if (hitArtwork) {
      aimHoldTimeRef.current += delta;
      if (aimHoldTimeRef.current > 0.85) {
        onMarkViewed(hitArtwork.id);
      }
    } else {
      aimHoldTimeRef.current = 0;
    }

    // 0. Option 1: High-Speed Cinematic Drone Glide Flight Easing
    if (isGliding.current) {
      const elapsed = performance.now() - glideStartTime.current;
      const progress = Math.min(1, elapsed / glideDuration);
      // Smooth cubic ease-out curve
      const t = 1 - Math.pow(1 - progress, 3);

      camera.position.lerpVectors(glideStartPos.current, glideEndPos.current, t);
      targetCamPos.current.copy(camera.position);

      // Shortest angular interpolation for yaw
      const diffYaw =
        ((glideEndYaw.current - glideStartYaw.current + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      const curGlideYaw = glideStartYaw.current + diffYaw * t;
      yaw.current = curGlideYaw;
      targetYaw.current = curGlideYaw;
      pitch.current = THREE.MathUtils.lerp(pitch.current, 0, t);
      targetPitch.current = 0;

      cameraTransformRef.current.x = camera.position.x;
      cameraTransformRef.current.z = camera.position.z;
      cameraTransformRef.current.rotY = yaw.current;

      const forwardX = Math.sin(yaw.current) * Math.cos(pitch.current);
      const forwardY = Math.sin(pitch.current);
      const forwardZ = -Math.cos(yaw.current) * Math.cos(pitch.current);
      const lookTarget = new THREE.Vector3(
        camera.position.x + forwardX,
        camera.position.y + forwardY,
        camera.position.z + forwardZ
      );
      camera.lookAt(lookTarget);

      if (progress >= 1) {
        isGliding.current = false;
        camera.position.copy(glideEndPos.current);
        targetCamPos.current.copy(glideEndPos.current);
        yaw.current = glideEndYaw.current;
        targetYaw.current = glideEndYaw.current;
      }
      return;
    }

    const isMoving =
      activeKeys.current['w'] ||
      activeKeys.current['arrowup'] ||
      activeKeys.current['s'] ||
      activeKeys.current['arrowdown'] ||
      activeKeys.current['a'] ||
      activeKeys.current['d'];

    if (isMoving && (focusedArtwork || focusedSlot)) {
      onClearFocus();
    }

    // 1. Keyboard Look Rotation (ArrowLeft / ArrowRight / Q / E) & Pitch (PageUp / PageDown)
    const keyTurnSpeed = 2.2 * delta;
    if (activeKeys.current['arrowleft'] || activeKeys.current['q']) {
      targetYaw.current -= keyTurnSpeed;
    }
    if (activeKeys.current['arrowright'] || activeKeys.current['e']) {
      targetYaw.current += keyTurnSpeed;
    }
    if (activeKeys.current['pageup']) {
      targetPitch.current = Math.min(1.3, targetPitch.current + keyTurnSpeed * 0.6);
    }
    if (activeKeys.current['pagedown']) {
      targetPitch.current = Math.max(-1.3, targetPitch.current - keyTurnSpeed * 0.6);
    }

    // 2. Smooth Damping for Yaw & Pitch
    yaw.current = THREE.MathUtils.lerp(yaw.current, targetYaw.current, 0.18);
    pitch.current = THREE.MathUtils.lerp(pitch.current, targetPitch.current, 0.18);

    // 3. Smooth Focus Mode on Selected Artwork
    if (focusedSlot && !isMoving && !isPointerDown.current) {
      const offsetDist = 2.4;
      const artPos = focusedSlot.worldPosition || focusedSlot.position;
      const rotY = focusedSlot.worldRotationY !== undefined ? focusedSlot.worldRotationY : focusedSlot.rotationY;
      const camX = artPos.x + Math.sin(rotY) * offsetDist;
      const camZ = artPos.z + Math.cos(rotY) * offsetDist;

      targetCamPos.current.set(camX, EYE_LEVEL_Y, camZ);
      camera.position.lerp(targetCamPos.current, 0.08);

      const lookDx = artPos.x - camera.position.x;
      const lookDz = artPos.z - camera.position.z;
      targetYaw.current = Math.atan2(lookDx, -lookDz);
      targetPitch.current = (artPos.y - EYE_LEVEL_Y) * 0.15;
    } else {
      // 4. Walk / Strafe Movement (WASD + ArrowUp/ArrowDown)
      const moveSpeed = 5.5 * delta;
      const forward = new THREE.Vector3(Math.sin(yaw.current), 0, -Math.cos(yaw.current)).normalize();
      const right = new THREE.Vector3(Math.cos(yaw.current), 0, Math.sin(yaw.current)).normalize();

      const move = new THREE.Vector3();
      if (activeKeys.current['w'] || activeKeys.current['arrowup']) move.add(forward);
      if (activeKeys.current['s'] || activeKeys.current['arrowdown']) move.sub(forward);
      if (activeKeys.current['d']) move.add(right);
      if (activeKeys.current['a']) move.sub(right);

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(moveSpeed);
        const tentativeX = camera.position.x + move.x;
        const tentativeZ = camera.position.z + move.z;

        const curRoom = roomConfigs[currentRoomIndex] || currentRoomConfig;

        // Transform tentative position into current room's local space
        const dx = tentativeX - curRoom.center.x;
        const dz = tentativeZ - curRoom.center.z;
        const local = rotatePointY(dx, dz, -curRoom.rotationY);

        const isPavilion = curRoom.isCornerPavilion;
        const halfW = (curRoom.width || ROOM_W) / 2;
        const halfD = (curRoom.depth || ROOM_D) / 2;
        const margin = 0.6;
        const doorHalfW = DOOR_W / 2;

        if (isPavilion) {
          // Corner Pavilion: Front entrance (z = +halfD), Right exit (x = +halfW)
          const inFrontDoor = Math.abs(local.x) < doorHalfW - 0.35;
          const inRightDoor = Math.abs(local.z) < doorHalfW - 0.35;

          // Clamp local X
          if (local.x < -halfW + margin) local.x = -halfW + margin; // Left wall solid
          if (local.x > halfW - margin && !inRightDoor) local.x = halfW - margin; // Right wall doorway

          // Clamp local Z
          if (local.z < -halfD + margin) local.z = -halfD + margin; // Back wall solid
          if (local.z > halfD - margin && !inFrontDoor) local.z = halfD - margin; // Front wall doorway
        } else {
          // Standard Exhibition Gallery Room
          local.x = Math.max(-halfW + margin, Math.min(halfW - margin, local.x));

          const inDoor = Math.abs(local.x) < doorHalfW - 0.45;
          if (local.z > halfD - margin) {
            if (!curRoom.doorways?.front || !inDoor) {
              local.z = halfD - margin;
            }
          }
          if (local.z < -halfD + margin) {
            if (!curRoom.doorways?.back || !inDoor) {
              local.z = -halfD + margin;
            }
          }

          // Two Central Freestanding Partitions Obstacle Collision (width: 5.6m, depth: 0.38m at z = +6.0m and z = -6.0m)
          // Player cannot walk through either partition wall
          const partHalfW = 2.8 + margin; // 3.4m
          const partHalfD = 0.19 + margin; // 0.79m

          for (const partZ of [6.0, -6.0]) {
            const relZ = local.z - partZ;
            if (Math.abs(local.x) < partHalfW && Math.abs(relZ) < partHalfD) {
              const overlapX = partHalfW - Math.abs(local.x);
              const overlapZ = partHalfD - Math.abs(relZ);
              if (overlapZ < overlapX) {
                local.z = partZ + (relZ > 0 ? partHalfD : -partHalfD);
              } else {
                local.x = local.x > 0 ? partHalfW : -partHalfW;
              }
            }
          }
        }

        // Transform clamped local coordinates back to world space
        const clampedRot = rotatePointY(local.x, local.z, curRoom.rotationY);
        const finalX = curRoom.center.x + clampedRot.x;
        const finalZ = curRoom.center.z + clampedRot.z;

        camera.position.set(finalX, 1.8, finalZ);

        // Check if room index changed (debounced to eliminate doorway fluttering)
        const newRoomIdx = findCurrentRoomIndex(
          { x: finalX, z: finalZ },
          roomConfigs,
          currentRoomIndex
        );
        const now = performance.now();
        if (newRoomIdx !== currentRoomIndex && now - lastRoomChangeTimeRef.current > 500) {
          lastRoomChangeTimeRef.current = now;
          onRoomChange(newRoomIdx);
        }
      }
    }

    // 5. Compute Look-At vector from current Camera Position + Head Orientation (Yaw + Pitch)
    const forwardX = Math.sin(yaw.current) * Math.cos(pitch.current);
    const forwardY = Math.sin(pitch.current);
    const forwardZ = -Math.cos(yaw.current) * Math.cos(pitch.current);

    const lookTarget = new THREE.Vector3(
      camera.position.x + forwardX,
      camera.position.y + forwardY,
      camera.position.z + forwardZ
    );
    camera.lookAt(lookTarget);

    // Sync camera orientation to Minimap Radar via mutable ref (0 React re-renders)
    const rotY = Math.atan2(forwardX, -forwardZ);
    if (cameraTransformRef?.current) {
      cameraTransformRef.current.x = camera.position.x;
      cameraTransformRef.current.z = camera.position.z;
      cameraTransformRef.current.rotY = rotY;
    }
  });

  return null;
}

// -------------------------------------------------------------
// Main Modern 3D Gallery Engine Component
// -------------------------------------------------------------
export interface Modern3DGalleryEngineProps {
  exhibition: Exhibition;
  isCuratorMode?: boolean; // false for public visitors, true for admin studio
  onOpenLightbox?: (artwork: Artwork) => void;
  onOpenInquiry?: (artwork: Artwork) => void;
  onSwitchTo2D?: () => void;
}

export function Modern3DGalleryEngine({
  exhibition,
  isCuratorMode = false,
  onOpenLightbox,
  onOpenInquiry,
  onSwitchTo2D,
}: Modern3DGalleryEngineProps) {
  const controlsRef = useRef<any>(null);
  const activeKeys = useRef<{ [key: string]: boolean }>({});

  // Parse initial themeConfig from exhibition database record
  const parsedTheme = useMemo(() => {
    if (exhibition?.themeConfig) {
      try {
        return typeof exhibition.themeConfig === 'string'
          ? JSON.parse(exhibition.themeConfig)
          : exhibition.themeConfig;
      } catch {}
    }
    return {};
  }, [exhibition?.themeConfig]);

  // Local state for curator interactive overrides
  const [userRoomShapes, setUserRoomShapes] = useState<RoomShape[] | null>(null);
  const [userLightPreset, setUserLightPreset] = useState<LightPreset | null>(null);
  const [userSpotlightIntensity, setUserSpotlightIntensity] = useState<number | null>(null);

  // Active room shapes (prioritizes curator override > exhibition database config > default)
  const activeRoomShapes = useMemo<RoomShape[]>(() => {
    if (userRoomShapes && userRoomShapes.length > 0) return userRoomShapes;
    if (parsedTheme?.roomShapes && Array.isArray(parsedTheme.roomShapes) && parsedTheme.roomShapes.length > 0) {
      return parsedTheme.roomShapes as RoomShape[];
    }
    return ['SQUARE', 'RECTANGLE', 'L_SHAPE', 'CIRCULAR'];
  }, [userRoomShapes, parsedTheme?.roomShapes]);

  // Active light preset
  const activeLightPreset = useMemo<LightPreset>(() => {
    if (userLightPreset) return userLightPreset;
    if (parsedTheme?.lightPreset) return parsedTheme.lightPreset as LightPreset;
    return 'daylight';
  }, [userLightPreset, parsedTheme?.lightPreset]);

  // Active spotlight intensity for baked lightmap
  const activeSpotlightIntensity = useMemo<number>(() => {
    if (typeof userSpotlightIntensity === 'number') return userSpotlightIntensity;
    if (typeof parsedTheme?.spotlightIntensity === 'number') return parsedTheme.spotlightIntensity;
    return 1.0;
  }, [userSpotlightIntensity, parsedTheme?.spotlightIntensity]);

  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);

  // Interactive Lighting
  const [inspectLightAngle, setInspectLightAngle] = useState(35);
  const [inspectLightIntensity, setInspectLightIntensity] = useState(3.5);

  // State: Ambient Soundscape Audio
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioPreset, setAudioPreset] = useState<'museum' | 'river' | 'piano'>('museum');

  const handleToggleAudio = () => {
    if (isAudioPlaying) {
      museumAudio.stopSoundscape();
      setIsAudioPlaying(false);
    } else {
      museumAudio.startSoundscape(audioPreset);
      setIsAudioPlaying(true);
    }
  };

  useEffect(() => {
    return () => {
      museumAudio.stopSoundscape();
    };
  }, []);

  // State: Focus & Modals
  const [focusedArtwork, setFocusedArtwork] = useState<Artwork | null>(null);
  const [focusedSlot, setFocusedSlot] = useState<CalculatedArtworkSlot | null>(null);
  const [isCuratorStudioOpen, setIsCuratorStudioOpen] = useState(false);

  // State: Pointer Lock (FPS Game Mode)
  const [isPointerLocked, setIsPointerLocked] = useState(false);

  const handleTogglePointerLock = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    if (document.pointerLockElement === canvas) {
      document.exitPointerLock?.();
    } else {
      canvas.requestPointerLock?.();
    }
  };

  // State: Fullscreen Mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleToggleFullscreen = async () => {
    if (typeof document === 'undefined') return;

    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.warn('Error attempting to enable full-screen mode:', err);
      }
    } else {
      if (document.exitFullscreen) {
        try {
          await document.exitFullscreen();
          setIsFullscreen(false);
        } catch (err) {
          console.warn('Error attempting to exit full-screen mode:', err);
        }
      }
    }
  };

  // Sync fullscreen state when user presses F11 or ESC
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  // State: Milestone 3 UI Layer & Interaction Progress
  const [is3DLoading, setIs3DLoading] = useState(true);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [dontShowOnboardingAgain, setDontShowOnboardingAgain] = useState(false);
  const [currentAim, setCurrentAim] = useState<{ artwork: Artwork; slot: CalculatedArtworkSlot } | null>(null);
  const [viewedArtworkIds, setViewedArtworkIds] = useState<Set<string>>(new Set());
  const [likedArtworkIds, setLikedArtworkIds] = useState<Set<string>>(new Set());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; sub: string } | null>(null);

  // Check first-time onboarding
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasSeen = localStorage.getItem('artvara_3d_onboarding_shown');
    if (!hasSeen) {
      // Auto open onboarding after initial load finishes
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    if (dontShowOnboardingAgain && typeof window !== 'undefined') {
      localStorage.setItem('artvara_3d_onboarding_shown', 'true');
    }
  };

  // Milestone D: Persistence of Visitor Viewed & Liked Artworks
  useEffect(() => {
    if (typeof window === 'undefined' || !exhibition?.slug) return;
    try {
      const savedViews = localStorage.getItem(`artvara_viewed_${exhibition.slug}`);
      if (savedViews) {
        const parsed = JSON.parse(savedViews);
        if (Array.isArray(parsed)) setViewedArtworkIds(new Set(parsed));
      }
      const savedLikes = localStorage.getItem(`artvara_likes_${exhibition.slug}`);
      if (savedLikes) {
        const parsed = JSON.parse(savedLikes);
        if (Array.isArray(parsed)) setLikedArtworkIds(new Set(parsed));
      }
    } catch (e) {
      console.warn('Failed to load visitor progress from localStorage:', e);
    }
  }, [exhibition?.slug]);

  // Persist viewed state
  useEffect(() => {
    if (typeof window === 'undefined' || !exhibition?.slug || viewedArtworkIds.size === 0) return;
    try {
      localStorage.setItem(`artvara_viewed_${exhibition.slug}`, JSON.stringify(Array.from(viewedArtworkIds)));
    } catch (e) {
      console.warn('Failed to save viewed progress:', e);
    }
  }, [viewedArtworkIds, exhibition?.slug]);

  // Persist liked state
  useEffect(() => {
    if (typeof window === 'undefined' || !exhibition?.slug) return;
    try {
      localStorage.setItem(`artvara_likes_${exhibition.slug}`, JSON.stringify(Array.from(likedArtworkIds)));
    } catch (e) {
      console.warn('Failed to save likes:', e);
    }
  }, [likedArtworkIds, exhibition?.slug]);

  const handleToggleLike = (id: string) => {
    setLikedArtworkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMarkViewed = (id: string) => {
    setViewedArtworkIds((prev) => {
      if (prev.has(id)) return prev;
      return new Set(prev).add(id);
    });
  };

  // Camera Minimap Radar ref - mutable ref avoids 60fps React re-renders
  const cameraTransformRef = useRef({ x: 0, z: 8, rotY: 0 });
  const [warpTarget, setWarpTarget] = useState<{ x: number; z: number; rotY?: number } | null>(null);
  const [isMinimapMobileOpen, setIsMinimapMobileOpen] = useState(false);

  // Virtual Touch Controller handlers
  const handleTouchKey = (key: string, pressed: boolean) => {
    activeKeys.current[key] = pressed;
  };

  // Guided Tour
  const [isGuidedTour, setIsGuidedTour] = useState(false);
  const tourIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Procedural Materials
  const epoxyFloorTex = useMemo(() => createWhiteEpoxyFloorTexture(), []);
  const benchShadowTex = useMemo(() => createFloorBenchContactShadowTexture(), []);
  const pedestalShadowTex = useMemo(() => createFloorPedestalContactShadowTexture(), []);
  const partitionShadowTex = useMemo(() => createPartitionContactShadowTexture(), []);
  const wallFloorEdgeAOTex = useMemo(() => createWallFloorEdgeAOTexture(), []);
  const wallAOTex = useMemo(() => createPlasterWallAOMap(), []);
  const wallBumpTex = useMemo(() => createPlasterBumpMap(), []);

  // Multi-room Calculations
  const roomConfigs = useMemo(() => {
    const rawArtworks = exhibition.artworks || [];
    return buildMultiRoomConfigs(rawArtworks, activeRoomShapes);
  }, [exhibition.artworks, activeRoomShapes]);

  const currentRoomConfig = roomConfigs[currentRoomIndex] || roomConfigs[0];

  // Room Entry Toast Trigger
  useEffect(() => {
    const rConfig = roomConfigs[currentRoomIndex];
    if (rConfig) {
      if (rConfig.isCornerPavilion) {
        setToastMessage({
          title: `C O R N E R   P A V I L I O N`,
          sub: rConfig.pavilionTitle || `โถงพักชมประติมากรรมมุมอาคาร (เลี้ยวขวา)`,
        });
      } else {
        const letter = String.fromCharCode(65 + currentRoomIndex);
        const artCount = rConfig.slots.filter((s) => s.artwork).length;
        setToastMessage({
          title: `E X H I B I T   ${letter}`,
          sub: `ห้องที่ ${currentRoomIndex + 1} จาก ${roomConfigs.length} · ${artCount} ผลงานจัดแสดง`,
        });
      }
      const t = setTimeout(() => setToastMessage(null), 2800);
      return () => clearTimeout(t);
    }
  }, [currentRoomIndex, roomConfigs]);



  // Global Keyboard Navigation (WASD, Arrows, E to Inspect, H for Help, ESC to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
        activeKeys.current[k] = true;
      } else if (k === 'e') {
        e.preventDefault();
        if (focusedArtwork) {
          setFocusedArtwork(null);
          setFocusedSlot(null);
        } else if (currentAim) {
          setFocusedArtwork(currentAim.artwork);
          setFocusedSlot(currentAim.slot);
          handleMarkViewed(currentAim.artwork.id);
        }
      } else if (k === 'h') {
        e.preventDefault();
        setIsHelpOpen((prev) => !prev);
      } else if (k === 'f') {
        e.preventDefault();
        handleToggleFullscreen();
      } else if (k === 'escape') {
        setFocusedArtwork(null);
        setFocusedSlot(null);
        setIsHelpOpen(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        activeKeys.current[k] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [focusedArtwork, currentAim]);

  // Inspect Artwork Handler
  const handleInspectArtwork = (artwork: Artwork) => {
    setFocusedArtwork(artwork);
    handleMarkViewed(artwork.id);
    for (const room of roomConfigs) {
      const found = room.slots.find((s) => s.artwork?.id === artwork.id);
      if (found) {
        setFocusedSlot(found);
        setCurrentRoomIndex(found.roomIndex);
        break;
      }
    }
  };

  // Guided Tour Cycle
  useEffect(() => {
    if (isGuidedTour) {
      const allSlots = roomConfigs.flatMap((r) => r.slots.filter((s) => s.artwork));
      if (allSlots.length === 0) return;

      let idx = 0;
      const stepTour = () => {
        const slot = allSlots[idx % allSlots.length];
        if (slot && slot.artwork) {
          setFocusedArtwork(slot.artwork);
          setFocusedSlot(slot);
          setCurrentRoomIndex(slot.roomIndex);
        }
        idx++;
      };

      stepTour();
      tourIntervalRef.current = setInterval(stepTour, 6000);
    } else {
      if (tourIntervalRef.current) clearInterval(tourIntervalRef.current);
    }

    return () => {
      if (tourIntervalRef.current) clearInterval(tourIntervalRef.current);
    };
  }, [isGuidedTour, roomConfigs]);

  // Curator Slot Swap Engine with Database Persistence
  const handleSwapSlots = async (slotIndexA: number, slotIndexB: number) => {
    const rawArtworks = [...(exhibition.artworks || [])];
    const artA = rawArtworks[slotIndexA];
    const artB = rawArtworks[slotIndexB];

    rawArtworks[slotIndexA] = artB;
    rawArtworks[slotIndexB] = artA;

    exhibition.artworks = rawArtworks;
    setUserRoomShapes([...activeRoomShapes]);

    // Persist swapped artworks order to Cloudflare D1 / database
    try {
      const reorderedPayload = rawArtworks
        .filter(Boolean)
        .map((art, idx) => ({
          artworkId: art.id,
          displayOrder: idx + 1,
        }));

      if (reorderedPayload.length > 0 && exhibition.id) {
        await fetch(`/api/admin/exhibitions/${exhibition.id}/artworks`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ artworks: reorderedPayload }),
        });
      }
    } catch (e) {
      console.warn('Auto-save swapped slots failed:', e);
    }
  };

  // Add / Remove Rooms (Curator only) with Database Persistence
  const handleAddRoom = async () => {
    const updated: RoomShape[] = [...activeRoomShapes, 'SQUARE'];
    setUserRoomShapes(updated);
    try {
      if (exhibition.id) {
        await fetch(`/api/admin/exhibitions/${exhibition.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomShapes: updated,
            lightPreset: activeLightPreset,
          }),
        });
      }
    } catch (e) {
      console.warn('Auto-save add room failed:', e);
    }
  };

  const handleRemoveRoom = async () => {
    if (activeRoomShapes.length > 1) {
      const updated = activeRoomShapes.slice(0, -1);
      setUserRoomShapes(updated);
      if (currentRoomIndex >= activeRoomShapes.length - 1) {
        setCurrentRoomIndex(activeRoomShapes.length - 2);
      }
      try {
        if (exhibition.id) {
          await fetch(`/api/admin/exhibitions/${exhibition.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomShapes: updated,
              lightPreset: activeLightPreset,
            }),
          });
        }
      } catch (e) {
        console.warn('Auto-save remove room failed:', e);
      }
    }
  };

  // Change room shape directly (Curator only) with Database Persistence
  const handleChangeCurrentRoomShape = async (newShape: RoomShape) => {
    const updated = [...activeRoomShapes];
    updated[currentRoomIndex] = newShape;
    setUserRoomShapes(updated);

    try {
      if (exhibition.id) {
        await fetch(`/api/admin/exhibitions/${exhibition.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomShapes: updated,
            lightPreset: activeLightPreset,
          }),
        });
      }
    } catch (e) {
      console.warn('Auto-save roomShape failed:', e);
    }
  };

  // Change light preset with Database Persistence
  const handleChangeLightPreset = async (preset: LightPreset) => {
    setUserLightPreset(preset);
    try {
      if (exhibition.id) {
        await fetch(`/api/admin/exhibitions/${exhibition.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomShapes: activeRoomShapes,
            lightPreset: preset,
          }),
        });
      }
    } catch (e) {
      console.warn('Auto-save light preset failed:', e);
    }
  };

  const shapeTitles: Record<string, string> = {
    SQUARE: 'ทรงจัตุรัส',
    RECTANGLE: 'ทรงผืนผ้า',
    L_SHAPE: 'ทรงตัว L',
    CIRCULAR: 'ทรงกลม',
  };

  return (
    <div className="relative w-full h-full min-h-[calc(100vh-64px)] overflow-hidden bg-[#0D0C0B] select-none text-slate-100" style={{ touchAction: "none" }}>
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 1.8, ROOM_D / 2 - 3], fov: 60 }}
        dpr={[1, 1.25]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        className="w-full h-full"
      >
        <color attach="background" args={['#0D0C0B']} />
        <Suspense fallback={null}>
          <SceneWarmupHelper onReady={() => setIs3DLoading(false)} />
          <LightingRig
            preset={activeLightPreset}
            activeRoomCenter={currentRoomConfig.center}
            inspectLightAngle={inspectLightAngle}
            inspectLightIntensity={inspectLightIntensity}
            isInspectActive={!!focusedArtwork}
          />

          {/* Render All Connected World-Space Rooms with Instant Visible Toggle (Approach 2) */}
          {roomConfigs.map((rConfig) => {
            const isVisible = Math.abs(rConfig.roomIndex - currentRoomIndex) <= 1;

            return (
              <group
                key={`room-${rConfig.roomIndex}`}
                position={[rConfig.center.x, rConfig.center.y, rConfig.center.z]}
                rotation={[0, rConfig.rotationY, 0]}
                visible={isVisible}
              >
                <RoomStructureMesh
                  config={rConfig}
                  epoxyFloorTex={epoxyFloorTex}
                  benchShadowTex={benchShadowTex}
                  pedestalShadowTex={pedestalShadowTex}
                  partitionShadowTex={partitionShadowTex}
                  wallFloorEdgeAOTex={wallFloorEdgeAOTex}
                  wallAOTex={wallAOTex}
                  wallBumpTex={wallBumpTex}
                  spotlightIntensity={activeSpotlightIntensity}
                />

                {/* Render Artworks in this Room ONLY when visible (prevents loading distant rooms) */}
                {isVisible &&
                  rConfig.slots.map((slot) => {
                    if (!slot.artwork) return null;
                    return (
                      <Artwork3DFrame
                        key={`art-slot-${slot.slotIndex}`}
                        slot={slot}
                        artwork={slot.artwork}
                        isFocused={focusedArtwork?.id === slot.artwork.id}
                        onInspect={handleInspectArtwork}
                      />
                    );
                  })}
              </group>
            );
          })}

          {/* Interactive Multi-Room Camera Rig Controller */}
          <CameraController
            focusedArtwork={focusedArtwork}
            focusedSlot={focusedSlot}
            onClearFocus={() => {
              setFocusedArtwork(null);
              setFocusedSlot(null);
            }}
            currentRoomConfig={currentRoomConfig}
            roomConfigs={roomConfigs}
            currentRoomIndex={currentRoomIndex}
            onRoomChange={(newIdx) => setCurrentRoomIndex(newIdx)}
            controlsRef={controlsRef}
            activeKeys={activeKeys}
            cameraTransformRef={cameraTransformRef}
            warpTarget={warpTarget}
            onClearWarp={() => setWarpTarget(null)}
            onAimArtwork={(art, slot) => {
              setCurrentAim(art && slot ? { artwork: art, slot } : null);
            }}
            onMarkViewed={handleMarkViewed}
            onTogglePointerLock={setIsPointerLocked}
          />
        </Suspense>
      </Canvas>

      {/* Center Screen Raycast Crosshair Dot */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-150 z-20 ${
          currentAim
            ? 'w-3 h-3 bg-[#FFD98A] shadow-[0_0_14px_rgba(255,217,138,0.95)] scale-150 ring-2 ring-[#D9B878]/50'
            : isPointerLocked
            ? 'w-2 h-2 bg-[#FFD98A] shadow-[0_0_8px_rgba(255,217,138,0.8)] ring-1 ring-black/40'
            : 'w-1.5 h-1.5 bg-white/80 shadow-[0_0_6px_rgba(0,0,0,0.8)]'
        }`}
      />

      {/* Floating Game Mode Active Notification Pill */}
      {isPointerLocked && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="px-4 sm:px-5 py-2 rounded-2xl bg-[#161310]/85 backdrop-blur-2xl border border-[#FFD98A]/50 shadow-[0_8px_32px_rgba(0,0,0,0.5)] text-center flex items-center gap-2 sm:gap-2.5">
            <Gamepad2 className="w-4 h-4 text-[#FFD98A] animate-pulse shrink-0" />
            <span className="text-xs text-white font-medium">
              <strong className="text-[#FFD98A]">🎮 โหมดเกมเปิดใช้งาน:</strong> ขยับเมาส์เพื่อหันหน้า • กด <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono text-[10px] text-white">ESC</kbd> ปลดล็อกเมาส์
            </span>
          </div>
        </div>
      )}

      {/* Floating Room Entry Toast Notification */}
      {toastMessage && !isPointerLocked && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in zoom-in-95 duration-300">
          <div className="px-6 py-2.5 rounded-2xl bg-[#161310]/25 backdrop-blur-2xl border border-[#D9B878]/40 shadow-[0_8px_32px_rgba(0,0,0,0.35)] text-center">
            <div className="text-[11px] tracking-[0.3em] uppercase text-[#D9B878] font-bold">
              {toastMessage.title}
            </div>
            <div className="text-[11px] text-white font-light mt-0.5">
              {toastMessage.sub}
            </div>
          </div>
        </div>
      )}

      {/* Floating Aim Card (Bottom Center) */}
      {currentAim && !focusedArtwork && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
          <button
            onClick={() => {
              setFocusedArtwork(currentAim.artwork);
              setFocusedSlot(currentAim.slot);
              handleMarkViewed(currentAim.artwork.id);
            }}
            className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-[#161310]/25 backdrop-blur-2xl border border-[#D9B878]/40 text-white shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:border-[#FFD98A] hover:bg-[#1E1914]/50 transition-all group cursor-pointer"
          >
            <div className="text-left">
              <div className="text-xs sm:text-sm font-serif font-bold text-[#F4F3EE] group-hover:text-[#FFD98A] transition-colors">
                « {currentAim.artwork.title} »
              </div>
              <div className="text-[11px] text-[#C5A880] font-light">
                {currentAim.artwork.artist?.name || 'Artist'}{' '}
                {currentAim.artwork.yearCreated ? `· ${currentAim.artwork.yearCreated}` : ''}
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-[#D9B878]/20 border border-[#D9B878]/35 text-[10px] text-[#FFD98A] font-mono tracking-wider font-semibold whitespace-nowrap group-hover:bg-[#D9B878]/35 transition-colors">
              กด E หรือคลิก
            </div>
          </button>
        </div>
      )}

      {/* Top Header Bar Controls */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3.5 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none gap-3">
        {/* Left Side: Brand & Navigation */}
        <div className="flex items-center space-x-2 sm:space-x-3 pointer-events-auto">
          {onSwitchTo2D && (
            <div className="relative group">
              <button
                onClick={onSwitchTo2D}
                className="px-3 py-1.5 rounded-xl bg-[#161310]/25 backdrop-blur-xl hover:bg-[#221C16]/50 text-xs font-semibold text-white border border-[#D9B878]/30 hover:border-[#D9B878] shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex items-center space-x-1 transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4 text-[#D9B878] shrink-0" />
                <span className="font-bold">2D</span>
              </button>
              <span className="pointer-events-none absolute -bottom-8 left-0 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                กลับสู่มุมมองรายการภาพ 2D
              </span>
            </div>
          )}

          {/* Multi-Room Switcher */}
          {roomConfigs.length > 1 ? (
            <div className="relative group">
              <div className="flex items-center space-x-1 bg-[#161310]/25 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-[#D9B878]/30 shadow-[0_4px_20px_rgba(0,0,0,0.25)] text-xs">
                <span className="text-[#C5A880] font-medium hidden sm:inline">ห้อง:</span>
                <select
                  value={currentRoomIndex}
                  onChange={(e) => {
                    const idx = Number(e.target.value);
                    setCurrentRoomIndex(idx);
                    setFocusedArtwork(null);
                    setFocusedSlot(null);
                    const targetRoom = roomConfigs[idx];
                    if (targetRoom) {
                      const halfD = (targetRoom.depth || ROOM_D) / 2;
                      const offset = rotatePointY(0, halfD - 3.2, targetRoom.rotationY);
                      setWarpTarget({
                        x: targetRoom.center.x + offset.x,
                        z: targetRoom.center.z + offset.z,
                        rotY: targetRoom.rotationY,
                      });
                    }
                  }}
                  className="bg-transparent font-bold text-white focus:outline-none cursor-pointer text-xs"
                >
                  {roomConfigs.map((r, i) => {
                    if (r.isCornerPavilion) {
                      return (
                        <option key={i} value={i} className="bg-[#161310] text-[#D9B878]">
                          🏛️ #{i + 1} {r.pavilionTitle || 'โถงมุมอาคาร (Corner Pavilion)'}
                        </option>
                      );
                    }
                    const letter = String.fromCharCode(65 + (r.exhibitionRoomIndex >= 0 ? r.exhibitionRoomIndex : i));
                    const artCount = r.slots.filter((s) => s.artwork).length;
                    const startArt = (r.exhibitionRoomIndex >= 0 ? r.exhibitionRoomIndex : i) * ARTWORKS_PER_ROOM + 1;
                    const endArt = startArt + artCount - 1;
                    return (
                      <option key={i} value={i} className="bg-[#161310] text-white">
                        🖼️ #{i + 1} Exhibit {letter} ({artCount > 0 ? `ภาพ ${startArt}–${endArt}` : `${artCount} ภาพ`})
                      </option>
                    );
                  })}
                </select>
              </div>
              <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
                สลับห้องจัดแสดงในนิทรรศการ
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-1 bg-[#161310]/25 backdrop-blur-xl px-3 py-1.5 rounded-xl border border-[#D9B878]/30 shadow-[0_4px_20px_rgba(0,0,0,0.25)] text-xs font-semibold text-white">
              <Building className="w-3.5 h-3.5 text-[#D9B878] mr-1" />
              <span>ห้อง #{currentRoomIndex + 1}</span>
            </div>
          )}

          {/* Ambient Museum Soundscape Audio Player */}
          <div className="relative group">
            <div className="flex items-center space-x-1 bg-[#161310]/25 backdrop-blur-xl px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#D9B878]/30 shadow-[0_4px_20px_rgba(0,0,0,0.25)] text-xs">
              <button
                onClick={handleToggleAudio}
                className="flex items-center space-x-1 text-[#FFD98A] font-semibold focus:outline-none hover:text-white"
              >
                {isAudioPlaying ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-[#D9B878] animate-pulse" />
                    <span className="text-[#FFD98A] hidden md:inline">ดนตรี</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-neutral-300 hidden md:inline">เปิดเสียง</span>
                  </>
                )}
              </button>
              {isAudioPlaying && (
                <select
                  value={audioPreset}
                  onChange={(e) => {
                    const preset = e.target.value as 'museum' | 'river' | 'piano';
                    setAudioPreset(preset);
                    museumAudio.startSoundscape(preset);
                  }}
                  className="bg-transparent font-medium text-white focus:outline-none cursor-pointer text-xs ml-0.5"
                >
                  <option value="museum" className="bg-[#161310] text-white">🏛️ หอศิลป์</option>
                  <option value="river" className="bg-[#161310] text-white">🌿 สายน้ำ</option>
                  <option value="piano" className="bg-[#161310] text-white">🎹 เปียโน</option>
                </select>
              )}
            </div>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {isAudioPlaying ? 'เลือกแนวเพลงบรรยากาศ' : 'เปิดเสียงบรรยากาศหอศิลป์เสมือนจริง'}
            </span>
          </div>
        </div>

        {/* Center Progress Bar: "ชมแล้ว x/n" */}
        <div className="flex-1 max-w-xs hidden sm:flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-[#161310]/25 border border-[#D9B878]/30 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.25)] pointer-events-auto">
          <div className="flex-1 h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#D9B878] to-[#FFD98A] transition-all duration-500 rounded-full"
              style={{
                width: `${
                  (exhibition.artworks?.length || 0) > 0
                    ? Math.min(100, (viewedArtworkIds.size / (exhibition.artworks?.length || 1)) * 100)
                    : 0
                }%`,
              }}
            />
          </div>
          <span className="text-[11px] font-mono text-[#D9B878] font-bold shrink-0">
            ชมแล้ว {viewedArtworkIds.size}/{exhibition.artworks?.length || 0}
          </span>
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* FPS Game Mode Toggle */}
          <div className="relative group">
            <button
              onClick={handleTogglePointerLock}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 sm:space-x-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] border transition-all active:scale-95 ${
                isPointerLocked
                  ? 'bg-[#FFD98A] text-black border-[#FFD98A] font-bold ring-2 ring-[#D9B878]/60 shadow-[0_0_16px_rgba(255,217,138,0.5)]'
                  : 'bg-[#161310]/25 backdrop-blur-xl hover:bg-[#221C16]/50 text-[#FFD98A] border-[#D9B878]/30 hover:border-[#D9B878]'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isPointerLocked ? 'โหมดเกม (เปิดอยู่)' : 'โหมดเกม'}
              </span>
            </button>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {isPointerLocked ? 'กด ESC เพื่อปลดล็อกเมาส์' : 'เปิดโหมดหมุนเมาส์แบบเกม FPS (ไม่ต้องกดคลิกค้าง)'}
            </span>
          </div>

          {/* Fullscreen Mode Toggle */}
          <div className="relative group">
            <button
              onClick={handleToggleFullscreen}
              className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 sm:space-x-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] border transition-all active:scale-95 ${
                isFullscreen
                  ? 'bg-[#FFD98A] text-black border-[#FFD98A] font-bold shadow-[0_0_16px_rgba(255,217,138,0.5)]'
                  : 'bg-[#161310]/25 backdrop-blur-xl hover:bg-[#221C16]/50 text-white hover:text-[#FFD98A] border-[#D9B878]/30 hover:border-[#D9B878]'
              }`}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-black" />
                  <span className="hidden sm:inline">ย่อจอ</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-[#D9B878]" />
                  <span className="hidden sm:inline">เต็มจอ</span>
                </>
              )}
            </button>
            <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#1A1918]/95 px-2.5 py-1 text-[11px] font-sans font-medium text-white shadow-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:-bottom-9 z-50 border border-white/15">
              {isFullscreen ? 'ออกจากมุมมองเต็มจอ (กด F หรือ ESC)' : 'เปิดมุมมองเต็มหน้าจอ Fullscreen (กด F)'}
            </span>
          </div>

          {/* Help Button (H) */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#161310]/25 backdrop-blur-xl hover:bg-[#221C16]/50 text-[#C5A880] hover:text-[#FFD98A] border border-[#D9B878]/30 hover:border-[#D9B878] text-xs font-medium flex items-center space-x-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all"
            title="วิธีควบคุม (กด H)"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#D9B878]" />
            <span className="hidden sm:inline">HELP</span>
            <kbd className="hidden md:inline px-1 py-0.2 text-[9px] bg-black/40 rounded border border-white/15">H</kbd>
          </button>

          {/* Guided Tour */}
          <button
            onClick={() => setIsGuidedTour(!isGuidedTour)}
            className={`px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 sm:space-x-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] border transition-all ${
              isGuidedTour
                ? 'bg-[#D9B878] text-black border-[#D9B878] animate-pulse font-bold'
                : 'bg-[#161310]/25 backdrop-blur-xl hover:bg-[#221C16]/50 text-[#FFD98A] border-[#D9B878]/30'
            }`}
          >
            {isGuidedTour ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">หยุด Tour</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#D9B878]" />
                <span className="hidden sm:inline">Tour</span>
              </>
            )}
          </button>

          {/* Reset Overview */}
          <button
            onClick={() => {
              setFocusedArtwork(null);
              setFocusedSlot(null);
              const room0 = roomConfigs[0];
              if (room0) {
                const halfD = (room0.depth || ROOM_D) / 2;
                const offset = rotatePointY(0, halfD - 3.2, room0.rotationY);
                setWarpTarget({
                  x: room0.center.x + offset.x,
                  z: room0.center.z + offset.z,
                });
              } else {
                setWarpTarget({ x: 0, z: 12.8 });
              }
            }}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-[#161310]/25 backdrop-blur-xl hover:bg-[#221C16]/50 text-white border border-[#D9B878]/30 text-xs font-medium flex items-center space-x-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all"
            title="รีเซ็ตมุมมองสู่จุดเริ่มต้น"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#D9B878]" />
            <span className="hidden sm:inline">ภาพรวม</span>
          </button>
        </div>
      </header>

      {/* Help Modal Overlay */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="bg-[#161310]/40 backdrop-blur-2xl border border-[#D9B878]/35 rounded-3xl p-6 sm:p-8 max-w-md w-full text-white shadow-[0_16px_50px_rgba(0,0,0,0.5)] relative">
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#C5A880] hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-[10px] uppercase tracking-widest text-[#D9B878] font-bold mb-1">
              POH-CHANG ACADEMY OF ARTS • ARTVARA
            </div>
            <h3 className="text-xl font-serif font-bold text-white mb-4">
              การควบคุมในหอศิลป์ 3D
            </h3>
            <div className="space-y-2.5 text-xs text-neutral-200">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#FFD98A]/10 border border-[#FFD98A]/30">
                <span className="font-semibold text-white">🎮 โหมดเกม (FPS Look)</span>
                <span className="text-[#FFD98A] font-medium">ขยับเมาส์หันหน้าได้ทันที ไม่ต้องคลิกค้าง</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>🖱️ โหมดปกติ (Click & Drag)</span>
                <span className="text-[#FFD98A]">คลิกซ้ายค้างแล้วลากเพื่อหมุนหันหน้า 360°</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>🔍 เลื่อนล้อเมาส์ (Wheel)</span>
                <span className="font-semibold text-[#FFD98A]">ซูมเข้า / ซูมออก (Zoom)</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>⛶ เปิด / ปิด โหมดเต็มหน้าจอ</span>
                <div className="flex items-center gap-1 font-mono text-[#FFD98A]">
                  <kbd className="px-2 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">F</kbd>
                  <span className="text-neutral-400 font-sans">หรือ ปุ่มเต็มจอ</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>เดินหน้า / ถอยหลัง / สไลด์</span>
                <div className="flex gap-1 font-mono text-[#FFD98A]">
                  <kbd className="px-2 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">W</kbd>
                  <kbd className="px-2 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">A</kbd>
                  <kbd className="px-2 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">S</kbd>
                  <kbd className="px-2 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">D</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>หมุนมุมมองด้วยคีย์บอร์ด</span>
                <div className="flex gap-1 font-mono text-[#FFD98A]">
                  <kbd className="px-2 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">Q</kbd>
                  <kbd className="px-2 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">E</kbd>
                  <kbd className="px-2 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">←</kbd>
                  <kbd className="px-2 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">→</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>ดูรายละเอียดภาพที่เล็ง</span>
                <div className="flex items-center gap-1.5 font-mono text-[#FFD98A]">
                  <kbd className="px-2.5 py-0.5 bg-black/40 rounded border border-[#D9B878]/30">E</kbd>
                  <span className="text-neutral-400 font-sans">หรือ คลิกที่ภาพ</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>เปิด / ปิด คำแนะนำนี้</span>
                <kbd className="px-2.5 py-0.5 bg-black/40 rounded border border-[#D9B878]/30 font-mono text-[#FFD98A]">H</kbd>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span>ปลดล็อกเมาส์ / ปิดหน้าต่าง</span>
                <kbd className="px-2.5 py-0.5 bg-black/40 rounded border border-[#D9B878]/30 font-mono text-[#FFD98A]">ESC</kbd>
              </div>
            </div>
            <button
              onClick={() => setIsHelpOpen(false)}
              className="mt-6 w-full py-3 rounded-xl bg-[#D9B878] hover:bg-[#e0c388] text-black font-semibold text-xs tracking-wider uppercase transition-colors shadow-lg"
            >
              เข้าใจแล้ว เริ่มเดินชม
            </button>
          </div>
        </div>
      )}

      {/* Top Right Minimap Radar (Desktop: Fixed, Mobile: Toggleable) */}
      <div className="absolute top-20 right-6 z-30 pointer-events-auto hidden sm:block">
        <MinimapRadar
          roomConfig={currentRoomConfig}
          roomConfigs={roomConfigs}
          currentRoomIndex={currentRoomIndex}
          cameraTransformRef={cameraTransformRef}
          onWarpToPosition={(x, z) => setWarpTarget({ x, z })}
          onSelectArtwork={(slot) => {
            if (slot.artwork) handleInspectArtwork(slot.artwork);
          }}
        />
      </div>

      {/* Mobile Minimap Toggle Button */}
      <div className="absolute top-16 right-3 z-30 pointer-events-auto sm:hidden">
        <button
          onClick={() => setIsMinimapMobileOpen(!isMinimapMobileOpen)}
          className={`p-2.5 rounded-2xl shadow-lg border backdrop-blur-xl flex items-center gap-1.5 text-xs font-bold transition-all ${
            isMinimapMobileOpen
              ? 'bg-[#D9B878] text-black border-[#D9B878]'
              : 'bg-[#161310]/30 text-[#FFD98A] border-[#D9B878]/30'
          }`}
          title="เปิด/ปิด แผนที่ผังห้อง"
        >
          <Compass className="w-4 h-4" />
          <span>แผนที่</span>
        </button>

        {/* Mobile Minimap Popup Modal */}
        {isMinimapMobileOpen && (
          <div className="absolute top-12 right-0 bg-[#161310]/40 backdrop-blur-2xl p-2 rounded-3xl shadow-2xl border border-[#D9B878]/40 animate-in fade-in zoom-in-95">
            <MinimapRadar
              roomConfig={currentRoomConfig}
              roomConfigs={roomConfigs}
              currentRoomIndex={currentRoomIndex}
              cameraTransformRef={cameraTransformRef}
              onWarpToPosition={(x, z) => {
                setWarpTarget({ x, z });
                setIsMinimapMobileOpen(false);
              }}
              onSelectArtwork={(slot) => {
                if (slot.artwork) {
                  handleInspectArtwork(slot.artwork);
                  setIsMinimapMobileOpen(false);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 📱 ENHANCED MOBILE TOUCH CONTROLS (Strafe A/D + Walk W/S + Turn L/R) */}
      {/* ========================================================================= */}
      <div className="sm:hidden pointer-events-none select-none">
        {/* Left Hand: Movement D-Pad (Walk Forward/Back & Strafe Left/Right) */}
        <div className="absolute bottom-28 left-3 z-30 pointer-events-auto flex flex-col items-center">
          {/* Forward (W) */}
          <button
            onTouchStart={() => handleTouchKey('w', true)}
            onTouchEnd={() => handleTouchKey('w', false)}
            onMouseDown={() => handleTouchKey('w', true)}
            onMouseUp={() => handleTouchKey('w', false)}
            className="w-11 h-10 rounded-t-2xl bg-[#161310]/70 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-all"
            aria-label="Walk Forward"
            title="เดินหน้า (W)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          
          {/* Middle Row: Strafe Left (A) | Backward (S) | Strafe Right (D) */}
          <div className="flex items-center">
            {/* Strafe Left (A) */}
            <button
              onTouchStart={() => handleTouchKey('a', true)}
              onTouchEnd={() => handleTouchKey('a', false)}
              onMouseDown={() => handleTouchKey('a', true)}
              onMouseUp={() => handleTouchKey('a', false)}
              className="w-10 h-10 rounded-l-2xl bg-[#161310]/70 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-all text-[11px] font-bold"
              aria-label="Strafe Left"
              title="สไลด์ซ้าย (A)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {/* Backward (S) */}
            <button
              onTouchStart={() => handleTouchKey('s', true)}
              onTouchEnd={() => handleTouchKey('s', false)}
              onMouseDown={() => handleTouchKey('s', true)}
              onMouseUp={() => handleTouchKey('s', false)}
              className="w-11 h-10 bg-[#161310]/70 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-all"
              aria-label="Walk Backward"
              title="ถอยหลัง (S)"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
            {/* Strafe Right (D) */}
            <button
              onTouchStart={() => handleTouchKey('d', true)}
              onTouchEnd={() => handleTouchKey('d', false)}
              onMouseDown={() => handleTouchKey('d', true)}
              onMouseUp={() => handleTouchKey('d', false)}
              className="w-10 h-10 rounded-r-2xl bg-[#161310]/70 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-all text-[11px] font-bold"
              aria-label="Strafe Right"
              title="สไลด์ขวา (D)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Hand: Look & Rotation Controls (Turn Left, Turn Right) */}
        <div className="absolute bottom-28 right-3 z-30 pointer-events-auto flex items-center gap-1.5">
          {/* Turn Left */}
          <button
            onTouchStart={() => handleTouchKey('arrowleft', true)}
            onTouchEnd={() => handleTouchKey('arrowleft', false)}
            onMouseDown={() => handleTouchKey('arrowleft', true)}
            onMouseUp={() => handleTouchKey('arrowleft', false)}
            className="w-11 h-11 rounded-2xl bg-[#161310]/70 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-all"
            aria-label="Turn Left"
            title="หันซ้าย"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Turn Right */}
          <button
            onTouchStart={() => handleTouchKey('arrowright', true)}
            onTouchEnd={() => handleTouchKey('arrowright', false)}
            onMouseDown={() => handleTouchKey('arrowright', true)}
            onMouseUp={() => handleTouchKey('arrowright', false)}
            className="w-11 h-11 rounded-2xl bg-[#161310]/70 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-all"
            aria-label="Turn Right"
            title="หันขวา"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Artwork Carousel Bar */}
      <div className="hidden sm:block absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-full px-2 sm:px-4">
        <div className="bg-[#161310]/25 backdrop-blur-2xl px-3 sm:px-4 py-2 rounded-2xl flex items-center space-x-2 sm:space-x-3 shadow-[0_8px_32px_rgba(0,0,0,0.35)] border border-[#D9B878]/30">
          <span className="text-xs text-[#C5A880] font-medium pr-2 border-r border-white/10 hidden md:inline">
            ผลงานในห้องนี้:
          </span>
          <div className="flex items-center space-x-2 overflow-x-auto max-w-[90vw] sm:max-w-lg py-1 scrollbar-none">
            {currentRoomConfig.slots
              .filter((s) => s.artwork)
              .map((slot) => {
                const isSelected = focusedArtwork?.id === slot.artwork?.id;
                const isViewed = slot.artwork ? viewedArtworkIds.has(slot.artwork.id) : false;
                return (
                  <button
                    key={slot.slotIndex}
                    onClick={() => {
                      if (slot.artwork) handleInspectArtwork(slot.artwork);
                    }}
                    className={`h-11 w-11 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all relative ${
                      isSelected
                        ? 'border-[#FFD98A] scale-110 shadow-lg ring-2 ring-[#D9B878]'
                        : isViewed
                        ? 'border-[#D9B878]/60 opacity-90 hover:opacity-100 hover:border-[#FFD98A]'
                        : 'border-white/20 opacity-70 hover:opacity-100 hover:border-[#D9B878]'
                    }`}
                    title={slot.artwork?.title}
                  >
                    {slot.artwork?.imageUrl ? (
                      <img
                        src={slot.artwork.imageUrl}
                        alt={slot.artwork.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2A231C] flex items-center justify-center text-[10px] font-bold text-[#D9B878]">
                        #{slot.slotIndex + 1}
                      </div>
                    )}
                    {isViewed && (
                      <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#FFD98A] ring-1 ring-black" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      </div>

      {/* Artwork Inspection Modal Drawer */}
      <ArtworkInspectModal
        artwork={focusedArtwork}
        isOpen={!!focusedArtwork}
        onClose={() => {
          setFocusedArtwork(null);
          setFocusedSlot(null);
        }}
        onOpenLightbox={onOpenLightbox}
        onOpenInquiry={onOpenInquiry}
        lightAngle={inspectLightAngle}
        onLightAngleChange={setInspectLightAngle}
        lightIntensity={inspectLightIntensity}
        onLightIntensityChange={setInspectLightIntensity}
        isLiked={focusedArtwork ? likedArtworkIds.has(focusedArtwork.id) : false}
        onToggleLike={(art) => handleToggleLike(art.id)}
      />

      {/* 3D Exhibition & Room Curator Studio Modal (Curator mode only) */}
      {isCuratorMode && (
        <RoomCuratorStudioModal
          isOpen={isCuratorStudioOpen}
          onClose={() => setIsCuratorStudioOpen(false)}
          exhibition={exhibition}
          roomConfigs={roomConfigs}
          currentRoomIndex={currentRoomIndex}
          onSelectRoomIndex={(idx) => {
            setCurrentRoomIndex(idx);
            const targetRoom = roomConfigs[idx];
            if (targetRoom) {
              const halfD = (targetRoom.depth || ROOM_D) / 2;
              const offset = rotatePointY(0, halfD - 3.2, targetRoom.rotationY);
              setWarpTarget({
                x: targetRoom.center.x + offset.x,
                z: targetRoom.center.z + offset.z,
                rotY: targetRoom.rotationY,
              });
            }
          }}
          onAddRoom={handleAddRoom}
          onRemoveRoom={handleRemoveRoom}
          onChangeRoomShape={handleChangeCurrentRoomShape}
          lightPreset={activeLightPreset}
          onChangeLightPreset={handleChangeLightPreset}
          onSwapSlots={handleSwapSlots}
          onFocusSlot={(slot) => {
            if (slot.artwork) handleInspectArtwork(slot.artwork);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* 🌟 1. CINEMATIC 3D LOADING OVERLAY (Smooth Shader & Texture Preload Screen) */}
      {/* ========================================================================= */}
      <div
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0D0C0B] transition-opacity duration-700 pointer-events-none ${
          is3DLoading ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        }`}
      >
        <div className="relative flex flex-col items-center max-w-sm px-6 text-center">
          {/* Animated Glowing Ring & Museum Icon */}
          <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-[#D9B878]/20 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-t-[#D9B878] border-r-[#FFD98A] border-b-transparent border-l-transparent animate-spin duration-1000" />
            <Building className="w-8 h-8 text-[#FFD98A] animate-pulse" />
          </div>

          <div className="text-[10px] tracking-[0.3em] uppercase text-[#D9B878] font-bold mb-2">
            POH-CHANG ACADEMY OF ARTS • 3D SPATIAL ENGINE
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mb-2">
            {exhibition.title || 'ห้องนิทรรศการเสมือนจริง 3D'}
          </h2>

          <p className="text-xs text-neutral-400 font-light mb-6">
            กำลังสร้างแบบจำลองสถาปัตยกรรม คำนวณแสงเงา Spotlight และจัดวางผลงานศิลปกรรม...
          </p>

          {/* Glowing Animated Progress Bar */}
          <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#D9B878] via-[#FFD98A] to-[#D9B878] w-full animate-pulse rounded-full" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🚀 2. FIRST-TIME INTERACTIVE ONBOARDING SPLASH GUIDE */}
      {/* ========================================================================= */}
      {isOnboardingOpen && !is3DLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in pointer-events-auto">
          <div className="bg-[#161310]/95 backdrop-blur-2xl border border-[#D9B878]/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full text-white shadow-[0_20px_60px_rgba(0,0,0,0.7)] relative animate-in fade-in zoom-in-95 duration-300">
            {/* Close Button */}
            <button
              onClick={handleCloseOnboarding}
              className="absolute top-5 right-5 p-2 text-[#C5A880] hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="ปิดคำแนะนำ"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="text-[10px] tracking-[0.3em] uppercase text-[#D9B878] font-bold mb-1">
              POH-CHANG ACADEMY OF ARTS • ARTVARA 3D
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white mb-2">
              ยินดีต้อนรับสู่หอศิลป์เสมือนจริง
            </h3>
            <p className="text-xs text-neutral-300 mb-6 font-light">
              สัมผัสประสบการณ์เดินชมนิทรรศการเสมือนจริงแบบ 3D ได้อย่างอิสระ ทุกมุมมองและขนาดสเกลสมจริง
            </p>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {/* Card 1: Game Mode Look */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D9B878]/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5 text-[#FFD98A] font-semibold text-xs">
                  <Gamepad2 className="w-4 h-4" />
                  <span>โหมดเกม FPS Look</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed font-light">
                  กดปุ่ม <strong>โหมดเกม</strong> ด้านบน แล้วขยับเมาส์หันมองได้ทันทีอย่างเป็นธรรมชาติ
                </p>
              </div>

              {/* Card 2: WASD Movement */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D9B878]/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5 text-[#FFD98A] font-semibold text-xs">
                  <Compass className="w-4 h-4" />
                  <span>ปุ่มเดิน W A S D</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed font-light">
                  ใช้ปุ่ม <kbd className="px-1 py-0.5 bg-black/40 rounded text-[10px]">W</kbd><kbd className="px-1 py-0.5 bg-black/40 rounded text-[10px]">A</kbd><kbd className="px-1 py-0.5 bg-black/40 rounded text-[10px]">S</kbd><kbd className="px-1 py-0.5 bg-black/40 rounded text-[10px]">D</kbd> หรือลูกศร เพื่อเดินสำรวจทุกโถงห้อง
                </p>
              </div>

              {/* Card 3: Inspect & Lighting */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D9B878]/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5 text-[#FFD98A] font-semibold text-xs">
                  <Eye className="w-4 h-4" />
                  <span>ดูรายละเอียด & จัดแสงไฟ</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed font-light">
                  คลิกที่ภาพ หรือกด <kbd className="px-1 py-0.5 bg-black/40 rounded text-[10px]">E</kbd> เพื่อเพ่งดูภาพ พร้อมปรับทิศทางแสง Spotlight ได้เอง
                </p>
              </div>

              {/* Card 4: Mobile Touch D-Pad */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D9B878]/40 transition-colors">
                <div className="flex items-center gap-2 mb-1.5 text-[#FFD98A] font-semibold text-xs">
                  <MousePointer className="w-4 h-4" />
                  <span>ลากหมุน & แตะนำทาง</span>
                </div>
                <p className="text-[11px] text-neutral-300 leading-relaxed font-light">
                  บนมือถือใช้ปุ่มเสมือนซ้าย-ขวา หรือคลิกลากหน้าจอเพื่อหมุนมุมมอง 360° รอบตัว
                </p>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-400 hover:text-white">
                <input
                  type="checkbox"
                  checked={dontShowOnboardingAgain}
                  onChange={(e) => setDontShowOnboardingAgain(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-[#D9B878] focus:ring-[#D9B878]"
                />
                <span>ไม่ต้องแสดงคำแนะนำนี้อีกในครั้งถัดไป</span>
              </label>

              <button
                onClick={handleCloseOnboarding}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#D9B878] to-[#FFD98A] hover:brightness-110 text-black font-bold text-xs tracking-wider uppercase transition-all shadow-lg active:scale-95"
              >
                เริ่มเดินชมนิทรรศการ 🚀
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
