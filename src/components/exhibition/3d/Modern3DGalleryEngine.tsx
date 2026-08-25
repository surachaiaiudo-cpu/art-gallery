'use client';

import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Exhibition, Artwork } from '@/types/exhibition';
import {
  RoomShape,
  LightPreset,
  CalculatedArtworkSlot,
  RoomGeometryConfig,
} from './types';
import {
  createTerrazzoFloorTexture,
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
  Plus,
  Minus,
  Maximize2,
  Building,
  Volume2,
  VolumeX,
  Music,
  ChevronUp,
  ChevronDown,
  RotateCw,
  MapPin,
  HelpCircle,
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

function RoomStructureMesh({
  config,
  terrazzoTex,
  wallAOTex,
  wallBumpTex,
  spotlightIntensity = 1.0,
}: {
  config: RoomGeometryConfig;
  terrazzoTex: THREE.CanvasTexture | null;
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

  // Separate left and right wall artwork positions for precise lightmap baking
  const sideArtL: { pzRel: number; w: number; h: number; cy: number }[] = [];
  const sideArtR: { pzRel: number; w: number; h: number; cy: number }[] = [];

  config.slots.forEach((slot) => {
    if (!slot.artwork) return;
    const isLeft = slot.wallIndex === 3 || slot.position.x < 0;
    const item = { pzRel: slot.position.z, w: 2.1, h: 1.4, cy: slot.position.y || EYE_LEVEL_Y };
    if (isLeft) sideArtL.push(item);
    else sideArtR.push(item);
  });

  const wallBaseMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#E8E4DC',
        roughness: 0.92,
        metalness: 0.02,
        side: THREE.DoubleSide,
        aoMap: wallAOTex || undefined,
        aoMapIntensity: 0.8,
        bumpMap: wallBumpTex || undefined,
        bumpScale: 0.003,
      }),
    [wallAOTex, wallBumpTex]
  );

  // Baked Wall Left Material with procedural spotlight lightmap
  const wallMatLeft = useMemo(() => {
    const m = wallBaseMat.clone();
    if (sideArtL.length > 0) {
      const lm = makeArtLightmap(sideArtL, true);
      if (lm) {
        m.emissive = new THREE.Color('#FFFFFF');
        m.emissiveMap = lm;
        m.emissiveIntensity = spotlightIntensity;
      }
    }
    return m;
  }, [wallBaseMat, sideArtL, spotlightIntensity]);

  // Baked Wall Right Material with procedural spotlight lightmap
  const wallMatRight = useMemo(() => {
    const m = wallBaseMat.clone();
    if (sideArtR.length > 0) {
      const lm = makeArtLightmap(sideArtR, false);
      if (lm) {
        m.emissive = new THREE.Color('#FFFFFF');
        m.emissiveMap = lm;
        m.emissiveIntensity = spotlightIntensity;
      }
    }
    return m;
  }, [wallBaseMat, sideArtR, spotlightIntensity]);

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6B5138',
        roughness: 0.45,
        metalness: 0.05,
        side: THREE.DoubleSide,
        map: terrazzoTex || undefined,
      }),
    [terrazzoTex]
  );

  const baseboardMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2A2622',
        roughness: 0.5,
        metalness: 0.1,
      }),
    []
  );

  const trimMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2A2622',
        roughness: 0.5,
        metalness: 0.2,
      }),
    []
  );

  const trackMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1C1A18', roughness: 0.4, metalness: 0.6 }),
    []
  );
  const headMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#26221E', roughness: 0.35, metalness: 0.7 }),
    []
  );
  const lensMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#FFF3DD', emissive: '#FFF3DD', emissiveIntensity: 1.6 }),
    []
  );

  const benchTopMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#3A3026', roughness: 0.5 }),
    []
  );
  const benchLegMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1C1814', roughness: 0.4, metalness: 0.5 }),
    []
  );

  const potMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8F857A', roughness: 0.85 }), []);
  const soilMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#241B12', roughness: 1.0 }), []);
  const leafMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#3E5A33', roughness: 0.8 }), []);
  const pedMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#DEDBD4', roughness: 0.35 }), []);
  const bronzeMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#8A6A34', roughness: 0.25, metalness: 0.9, clearcoat: 0.4 }),
    []
  );
  const darkSteelMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: '#33363B', roughness: 0.3, metalness: 0.85, clearcoat: 0.3 }),
    []
  );

  // Exhibit room sign texture
  const signTex = useMemo(() => {
    if (typeof document === 'undefined') return null;
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
      const letter = String.fromCharCode(65 + config.roomIndex);
      ctx.fillText(`E X H I B I T   ${letter}`, 256, 44);
    }
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [config.roomIndex]);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#F5F5F0" roughness={0.95} />
      </mesh>

      {/* Left Wall with Baked Lightmap (x = -w/2) */}
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
        <primitive object={wallMatLeft} attach="material" />
      </mesh>

      {/* Right Wall with Baked Lightmap (x = w/2) */}
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[d, h]} />
        <primitive object={wallMatRight} attach="material" />
      </mesh>

      {/* Ceiling Track Light Rails and Fixture Heads */}
      {[-1, 1].map((sd) => {
        const tx = sd * (w / 2 - 1.15);
        const arts = sd === -1 ? sideArtL : sideArtR;
        return (
          <group key={`track-${sd}`}>
            {/* Rail */}
            <mesh position={[tx, h - 0.05, 0]}>
              <boxGeometry args={[0.045, 0.1, d]} />
              <primitive object={trackMat} attach="material" />
            </mesh>
            {/* Fixture heads pointing at each artwork */}
            {arts.map((a, ai) => (
              <group
                key={`fixture-${ai}`}
                position={[tx, h - 0.075, a.pzRel]}
                rotation={[0.35, sd === -1 ? -Math.PI / 2 : Math.PI / 2, 0]}
              >
                <mesh position={[0, -0.035, 0]}>
                  <boxGeometry args={[0.035, 0.07, 0.035]} />
                  <primitive object={trackMat} attach="material" />
                </mesh>
                <mesh position={[0, 0, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.038, 0.06, 0.26, 14]} />
                  <primitive object={headMat} attach="material" />
                </mesh>
                <mesh position={[0, 0, 0.242]}>
                  <circleGeometry args={[0.048, 14]} />
                  <primitive object={lensMat} attach="material" />
                </mesh>
              </group>
            ))}
          </group>
        );
      })}

      {/* Central Ceiling Luminaire Panels */}
      {[-w / 2 + 2, 0, w / 2 - 2].map((px, pi) => (
        <group key={`panel-${pi}`} position={[px, h - 0.03, 0]}>
          <mesh>
            <boxGeometry args={[1.6, 0.04, 0.35]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFF9F0" emissiveIntensity={0.75} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.03, 0]}>
            <planeGeometry args={[1.6, 0.35]} />
            <meshBasicMaterial color="#FFF9F0" />
          </mesh>
        </group>
      ))}

      {/* Baseboards Left & Right */}
      <mesh position={[-w / 2 + 0.03, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, d]} />
        <primitive object={baseboardMaterial} attach="material" />
      </mesh>
      <mesh position={[w / 2 - 0.03, 0.06, 0]}>
        <boxGeometry args={[0.06, 0.12, d]} />
        <primitive object={baseboardMaterial} attach="material" />
      </mesh>

      {/* Front Wall (z = d/2) */}
      {!withDoorFront ? (
        <mesh position={[0, h / 2, d / 2]} rotation={[0, Math.PI, 0]} receiveShadow>
          <planeGeometry args={[w, h]} />
          <primitive object={wallBaseMat} attach="material" />
        </mesh>
      ) : (
        <group position={[0, 0, d / 2]}>
          {/* Left Segment */}
          <mesh position={[-(DOOR_W / 2 + segW / 2), h / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
            <planeGeometry args={[segW, h]} />
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          {/* Right Segment */}
          <mesh position={[DOOR_W / 2 + segW / 2, h / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
            <planeGeometry args={[segW, h]} />
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          {/* Lintel above door */}
          <mesh position={[0, DOOR_H + (h - DOOR_H) / 2, 0]} rotation={[0, Math.PI, 0]} receiveShadow>
            <planeGeometry args={[DOOR_W, h - DOOR_H]} />
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
        </group>
      )}

      {/* Back Wall (z = -d/2) */}
      {!withDoorBack ? (
        <mesh position={[0, h / 2, -d / 2]} receiveShadow>
          <planeGeometry args={[w, h]} />
          <primitive object={wallBaseMat} attach="material" />
        </mesh>
      ) : (
        <group position={[0, 0, -d / 2]}>
          {/* Left Segment */}
          <mesh position={[-(DOOR_W / 2 + segW / 2), h / 2, 0]} receiveShadow>
            <planeGeometry args={[segW, h]} />
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          {/* Right Segment */}
          <mesh position={[DOOR_W / 2 + segW / 2, h / 2, 0]} receiveShadow>
            <planeGeometry args={[segW, h]} />
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          {/* Lintel above door */}
          <mesh position={[0, DOOR_H + (h - DOOR_H) / 2, 0]} receiveShadow>
            <planeGeometry args={[DOOR_W, h - DOOR_H]} />
            <primitive object={wallBaseMat} attach="material" />
          </mesh>
          {/* Architectural Portal Archway (Clean Single Arch) */}
          <mesh position={[-DOOR_W / 2 - 0.06, DOOR_H / 2, 0]}>
            <boxGeometry args={[0.12, DOOR_H, 0.24]} />
            <primitive object={trimMat} attach="material" />
          </mesh>
          <mesh position={[DOOR_W / 2 + 0.06, DOOR_H / 2, 0]}>
            <boxGeometry args={[0.12, DOOR_H, 0.24]} />
            <primitive object={trimMat} attach="material" />
          </mesh>
          <mesh position={[0, DOOR_H + 0.06, 0]}>
            <boxGeometry args={[DOOR_W + 0.24, 0.12, 0.24]} />
            <primitive object={trimMat} attach="material" />
          </mesh>
        </group>
      )}

      {/* Exhibit Signboard above front entrance */}
      {signTex && (
        <mesh position={[0, 3.9, d / 2 - 0.06]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[3.4, 0.55]} />
          <meshStandardMaterial
            map={signTex}
            emissiveMap={signTex}
            emissive="#FFFFFF"
            emissiveIntensity={0.35}
            roughness={0.4}
          />
        </mesh>
      )}

      {/* 2 Central Gallery Benches */}
      {[-d / 4, d / 4].map((bz, i) => (
        <group key={`bench-${i}`} position={[0, 0, bz]}>
          <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.0, 0.12, 0.95]} />
            <primitive object={benchTopMat} attach="material" />
          </mesh>
          {[[-1.32, -0.36], [1.32, -0.36], [-1.32, 0.36], [1.32, 0.36]].map(([lx, lz], li) => (
            <mesh key={`leg-${li}`} position={[lx, 0.2, lz]}>
              <boxGeometry args={[0.07, 0.4, 0.07]} />
              <primitive object={benchLegMat} attach="material" />
            </mesh>
          ))}
        </group>
      ))}

      {/* 4 Corner Potted Plants */}
      {[
        [-w / 2 + 1.2, -d / 2 + 1.4],
        [w / 2 - 1.2, -d / 2 + 1.4],
        [-w / 2 + 1.2, d / 2 - 1.4],
        [w / 2 - 1.2, d / 2 - 1.4],
      ].map(([px, pz], pi) => (
        <group key={`plant-${pi}`} position={[px, 0, pz]}>
          <mesh position={[0, 0.275, 0]}>
            <cylinderGeometry args={[0.34, 0.26, 0.55, 12]} />
            <primitive object={potMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.54, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.04, 12]} />
            <primitive object={soilMat} attach="material" />
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
              <sphereGeometry args={[0.28 - f * 0.02, 8, 6]} />
              <primitive object={leafMat} attach="material" />
            </mesh>
          ))}
        </group>
      ))}

      {/* 2 Sculptures on Pedestals */}
      {[
        [-2.9, -d / 2 + 5.5, 'bronze'],
        [2.9, d / 2 - 5.5, 'steel'],
      ].map(([sx, sz, type], si) => (
        <group key={`sculpt-${si}`} position={[Number(sx), 0, Number(sz)]}>
          <mesh position={[0, 0.525, 0]}>
            <boxGeometry args={[0.55, 1.05, 0.55]} />
            <primitive object={pedMat} attach="material" />
          </mesh>
          {type === 'bronze' ? (
            <mesh position={[0, 1.42, 0]} rotation={[0.6, 0, 0]}>
              <torusKnotGeometry args={[0.24, 0.08, 90, 14]} />
              <primitive object={bronzeMat} attach="material" />
            </mesh>
          ) : (
            <mesh position={[0, 1.4, 0]} rotation={[0, 0, 0.3]}>
              <icosahedronGeometry args={[0.3, 1]} />
              <primitive object={darkSteelMat} attach="material" />
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
  for (let i = 0; i < configs.length; i++) {
    const room = configs[i];
    const dx = playerPos.x - room.center.x;
    const dz = playerPos.z - room.center.z;
    const local = rotatePointY(dx, dz, -room.rotationY);
    const halfW = (room.width || ROOM_W) / 2;
    const halfD = (room.depth || ROOM_D) / 2;
    if (Math.abs(local.x) <= halfW + 0.5 && Math.abs(local.z) <= halfD + 0.5) {
      return i;
    }
  }
  return fallbackIdx;
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
  onCameraUpdate: (pos: { x: number; z: number }, rotY: number) => void;
  warpTarget: { x: number; z: number } | null;
  onClearWarp: () => void;
  onAimArtwork: (artwork: Artwork | null, slot: CalculatedArtworkSlot | null) => void;
  onMarkViewed: (artworkId: string) => void;
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
  onCameraUpdate,
  warpTarget,
  onClearWarp,
  onAimArtwork,
  onMarkViewed,
}: CameraControllerProps) {
  const { camera, raycaster, scene } = useThree();
  const targetCamPos = useRef(new THREE.Vector3(0, 1.8, ROOM_D / 2 - 3));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.8, 0));
  const screenCenter = useRef(new THREE.Vector2(0, 0));
  const aimHoldTimeRef = useRef(0);

  // Handle Warp Trigger from Minimap or Room Switcher
  useEffect(() => {
    if (warpTarget) {
      camera.position.set(warpTarget.x, 1.8, warpTarget.z);
      targetCamPos.current.set(warpTarget.x, 1.8, warpTarget.z);
      targetLookAt.current.set(warpTarget.x, 1.8, warpTarget.z - 5);
      camera.lookAt(targetLookAt.current);
      if (controlsRef.current) {
        controlsRef.current.target.set(targetLookAt.current.x, 1.8, targetLookAt.current.z);
        controlsRef.current.update();
      }
      onClearWarp();
    }
  }, [warpTarget, onClearWarp, controlsRef, camera]);

  useFrame((state, delta) => {
    // 0. Raycast center screen to detect aimed artwork & track viewed progress
    raycaster.setFromCamera(screenCenter.current, camera);
    raycaster.far = 12.0;
    const intersects = raycaster.intersectObjects(scene.children, true);
    let hitArtwork: Artwork | null = null;
    let hitSlot: CalculatedArtworkSlot | null = null;

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

    if (hitArtwork && hitSlot) {
      onAimArtwork(hitArtwork, hitSlot);
      aimHoldTimeRef.current += delta;
      if (aimHoldTimeRef.current > 0.85) {
        onMarkViewed(hitArtwork.id);
      }
    } else {
      aimHoldTimeRef.current = 0;
      onAimArtwork(null, null);
    }

    const isMoving =
      activeKeys.current['w'] ||
      activeKeys.current['arrowup'] ||
      activeKeys.current['s'] ||
      activeKeys.current['arrowdown'] ||
      activeKeys.current['a'] ||
      activeKeys.current['d'] ||
      activeKeys.current['arrowleft'] ||
      activeKeys.current['arrowright'];

    if (isMoving && (focusedArtwork || focusedSlot)) {
      onClearFocus();
    }

    // 1. Smooth Focus Mode on Selected Artwork
    if (focusedSlot && !isMoving) {
      const offsetDist = 2.4;
      const artPos = focusedSlot.worldPosition || focusedSlot.position;
      const rotY = focusedSlot.worldRotationY !== undefined ? focusedSlot.worldRotationY : focusedSlot.rotationY;
      const camX = artPos.x + Math.sin(rotY) * offsetDist;
      const camZ = artPos.z + Math.cos(rotY) * offsetDist;

      targetCamPos.current.set(camX, EYE_LEVEL_Y, camZ);
      targetLookAt.current.set(artPos.x, EYE_LEVEL_Y, artPos.z);

      camera.position.lerp(targetCamPos.current, 0.08);
      camera.lookAt(targetLookAt.current);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLookAt.current, 0.08);
      }
    } else {
      // 2. Turn View Left / Right with Arrow Keys
      const turnSpeed = 2.2 * delta;
      if (activeKeys.current['arrowleft'] && controlsRef.current) {
        const offset = controlsRef.current.target.clone().sub(camera.position);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), turnSpeed);
        controlsRef.current.target.copy(camera.position).add(offset);
        controlsRef.current.update();
      }
      if (activeKeys.current['arrowright'] && controlsRef.current) {
        const offset = controlsRef.current.target.clone().sub(camera.position);
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), -turnSpeed);
        controlsRef.current.target.copy(camera.position).add(offset);
        controlsRef.current.update();
      }

      // 3. Walk / Strafe Movement (WASD + ArrowUp/ArrowDown)
      const moveSpeed = 5.5 * delta;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const move = new THREE.Vector3();
      if (activeKeys.current['w'] || activeKeys.current['arrowup']) move.add(forward);
      if (activeKeys.current['s'] || activeKeys.current['arrowdown']) move.sub(forward);
      if (activeKeys.current['d']) move.add(right);
      if (activeKeys.current['a']) move.sub(right);

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(moveSpeed);
        const tentativeX = camera.position.x + move.x;
        const tentativeZ = camera.position.z + move.z;

        const curRoomIdx = findCurrentRoomIndex(
          { x: camera.position.x, z: camera.position.z },
          roomConfigs,
          currentRoomIndex
        );
        const curRoom = roomConfigs[curRoomIdx] || currentRoomConfig;

        // Transform tentative position into current room's local space
        const dx = tentativeX - curRoom.center.x;
        const dz = tentativeZ - curRoom.center.z;
        const local = rotatePointY(dx, dz, -curRoom.rotationY);

        const halfW = (curRoom.width || ROOM_W) / 2;
        const halfD = (curRoom.depth || ROOM_D) / 2;
        const margin = 0.6;
        const doorHalfW = DOOR_W / 2;

        // Clamp local X (side walls)
        local.x = Math.max(-halfW + margin, Math.min(halfW - margin, local.x));

        // Check Doorways along local Z
        const inDoor = Math.abs(local.x) < doorHalfW - 0.45;

        // Front wall boundary (z = +halfD = +16)
        if (local.z > halfD - margin) {
          if (!curRoom.doorways?.front || !inDoor) {
            local.z = halfD - margin;
          }
        }

        // Back wall boundary (z = -halfD = -16)
        if (local.z < -halfD + margin) {
          if (!curRoom.doorways?.back || !inDoor) {
            local.z = -halfD + margin;
          }
        }

        // Transform clamped local coordinates back to world space
        const clampedRot = rotatePointY(local.x, local.z, curRoom.rotationY);
        const finalX = curRoom.center.x + clampedRot.x;
        const finalZ = curRoom.center.z + clampedRot.z;

        const deltaMove = new THREE.Vector3(
          finalX - camera.position.x,
          0,
          finalZ - camera.position.z
        );

        camera.position.set(finalX, 1.8, finalZ);

        if (controlsRef.current) {
          controlsRef.current.target.add(deltaMove);
          controlsRef.current.update();
        }

        // Check if room index changed
        const newRoomIdx = findCurrentRoomIndex(
          { x: finalX, z: finalZ },
          roomConfigs,
          curRoomIdx
        );
        if (newRoomIdx !== currentRoomIndex) {
          onRoomChange(newRoomIdx);
        }
      }
    }

    // Sync camera orientation to Minimap Radar
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const rotY = Math.atan2(dir.x, dir.z);
    onCameraUpdate({ x: camera.position.x, z: camera.position.z }, rotY);
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
    return 'warm';
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

  // State: Milestone 3 UI Layer & Interaction Progress
  const [currentAim, setCurrentAim] = useState<{ artwork: Artwork; slot: CalculatedArtworkSlot } | null>(null);
  const [viewedArtworkIds, setViewedArtworkIds] = useState<Set<string>>(new Set());
  const [likedArtworkIds, setLikedArtworkIds] = useState<Set<string>>(new Set());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ title: string; sub: string } | null>(null);

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

  // Camera Minimap Radar state
  const [cameraRadarPos, setCameraRadarPos] = useState({ x: 0, z: 8 });
  const [cameraRadarRotY, setCameraRadarRotY] = useState(0);
  const [warpTarget, setWarpTarget] = useState<{ x: number; z: number } | null>(null);
  const [isMinimapMobileOpen, setIsMinimapMobileOpen] = useState(false);

  // Virtual Touch Controller handlers
  const handleTouchKey = (key: string, pressed: boolean) => {
    activeKeys.current[key] = pressed;
  };

  // Guided Tour
  const [isGuidedTour, setIsGuidedTour] = useState(false);
  const tourIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Procedural Materials
  const terrazzoTex = useMemo(() => createTerrazzoFloorTexture(), []);
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
      const letter = String.fromCharCode(65 + currentRoomIndex);
      const artCount = rConfig.slots.filter((s) => s.artwork).length;
      setToastMessage({
        title: `E X H I B I T   ${letter}`,
        sub: `ห้องที่ ${currentRoomIndex + 1} จาก ${roomConfigs.length} · ${artCount} ผลงานจัดแสดง`,
      });
      const t = setTimeout(() => setToastMessage(null), 2800);
      return () => clearTimeout(t);
    }
  }, [currentRoomIndex, roomConfigs]);

  // Background Preload Artwork Images across rooms for instant transitions
  useEffect(() => {
    if (typeof window === 'undefined' || !exhibition?.artworks) return;
    const urls = exhibition.artworks
      .map((a) => a?.imageUrl)
      .filter((u): u is string => Boolean(u));

    urls.forEach((url) => {
      const targetUrl = url.startsWith('http')
        ? `/api/image-proxy?url=${encodeURIComponent(url)}`
        : url;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = targetUrl;
    });
  }, [exhibition?.artworks]);

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
    <div className="relative w-full h-[calc(100dvh-64px)] overflow-hidden bg-[#F4F3EE] select-none text-slate-800">
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
        <color attach="background" args={['#161514']} />
        <Suspense fallback={null}>
          <LightingRig
            preset={activeLightPreset}
            activeRoomZ={currentRoomConfig.center.z}
            inspectLightAngle={inspectLightAngle}
            inspectLightIntensity={inspectLightIntensity}
            isInspectActive={!!focusedArtwork}
          />

          {/* Render All Connected World-Space Rooms with Visibility Culling (currentRoomIndex ± 1) */}
          {roomConfigs.map((rConfig) => {
            const isVisible = Math.abs(rConfig.roomIndex - currentRoomIndex) <= 1;
            if (!isVisible) return null;

            return (
              <group
                key={`room-${rConfig.roomIndex}`}
                position={[rConfig.center.x, rConfig.center.y, rConfig.center.z]}
                rotation={[0, rConfig.rotationY, 0]}
              >
                <RoomStructureMesh
                  config={rConfig}
                  terrazzoTex={terrazzoTex}
                  wallAOTex={wallAOTex}
                  wallBumpTex={wallBumpTex}
                  spotlightIntensity={activeSpotlightIntensity}
                />

                {/* Render Artworks in this Room (Max 20 per room) */}
                {rConfig.slots.map((slot) => {
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
            onCameraUpdate={(pos, rotY) => {
              setCameraRadarPos(pos);
              setCameraRadarRotY(rotY);
            }}
            warpTarget={warpTarget}
            onClearWarp={() => setWarpTarget(null)}
            onAimArtwork={(art, slot) => {
              setCurrentAim(art && slot ? { artwork: art, slot } : null);
            }}
            onMarkViewed={handleMarkViewed}
          />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            target={[0, 1.8, 0]}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={1.0}
            maxDistance={25.0}
          />
        </Suspense>
      </Canvas>

      {/* Center Screen Raycast Crosshair Dot */}
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-150 z-20 ${
          currentAim
            ? 'w-3 h-3 bg-[#FFD98A] shadow-[0_0_14px_rgba(255,217,138,0.95)] scale-150 ring-2 ring-[#D9B878]/50'
            : 'w-1.5 h-1.5 bg-white/80 shadow-[0_0_6px_rgba(0,0,0,0.8)]'
        }`}
      />

      {/* Floating Room Entry Toast Notification */}
      {toastMessage && (
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
                    setWarpTarget({ x: 0, z: 4.5 });
                  }}
                  className="bg-transparent font-bold text-white focus:outline-none cursor-pointer text-xs"
                >
                  {roomConfigs.map((r, i) => (
                    <option key={i} value={i} className="bg-[#161310] text-white">
                      #{i + 1} {shapeTitles[r.shape] || r.shape}
                    </option>
                  ))}
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
          <span className="text-[11px] font-mono font-medium text-[#C5A880] whitespace-nowrap">
            ชมแล้ว {viewedArtworkIds.size}/{exhibition.artworks?.length || 0}
          </span>
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center space-x-2 pointer-events-auto">
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
              setWarpTarget({ x: 0, z: 4.5 });
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
                <span>หมุนมุมมองซ้าย / ขวา</span>
                <div className="flex gap-1 font-mono text-[#FFD98A]">
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
                <span>ปิดหน้าต่าง / ปลดล็อกเมาส์</span>
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
          cameraPos={cameraRadarPos}
          cameraRotationY={cameraRadarRotY}
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
              cameraPos={cameraRadarPos}
              cameraRotationY={cameraRadarRotY}
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

      {/* Mobile Touch Virtual D-Pad (Walk & Turn for Touchscreen / Mobile) */}
      <div className="absolute bottom-24 left-3 z-30 pointer-events-auto flex flex-col items-center gap-1 sm:hidden select-none">
        {/* Forward Button */}
        <button
          onTouchStart={() => handleTouchKey('w', true)}
          onTouchEnd={() => handleTouchKey('w', false)}
          onMouseDown={() => handleTouchKey('w', true)}
          onMouseUp={() => handleTouchKey('w', false)}
          className="w-12 h-11 rounded-2xl bg-[#161310]/30 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-transform"
          aria-label="Walk Forward"
        >
          <ChevronUp className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-1.5">
          {/* Turn Left Button */}
          <button
            onTouchStart={() => handleTouchKey('arrowleft', true)}
            onTouchEnd={() => handleTouchKey('arrowleft', false)}
            onMouseDown={() => handleTouchKey('arrowleft', true)}
            onMouseUp={() => handleTouchKey('arrowleft', false)}
            className="w-11 h-11 rounded-2xl bg-[#161310]/30 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-transform"
            aria-label="Turn Left"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {/* Backward Button */}
          <button
            onTouchStart={() => handleTouchKey('s', true)}
            onTouchEnd={() => handleTouchKey('s', false)}
            onMouseDown={() => handleTouchKey('s', true)}
            onMouseUp={() => handleTouchKey('s', false)}
            className="w-12 h-11 rounded-2xl bg-[#161310]/30 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-transform"
            aria-label="Walk Backward"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
          {/* Turn Right Button */}
          <button
            onTouchStart={() => handleTouchKey('arrowright', true)}
            onTouchEnd={() => handleTouchKey('arrowright', false)}
            onMouseDown={() => handleTouchKey('arrowright', true)}
            onMouseUp={() => handleTouchKey('arrowright', false)}
            className="w-11 h-11 rounded-2xl bg-[#161310]/30 active:bg-[#D9B878] active:text-black backdrop-blur-xl border border-[#D9B878]/30 shadow-lg flex items-center justify-center text-[#FFD98A] active:scale-95 transition-transform"
            aria-label="Turn Right"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bottom Artwork Carousel Bar */}
      <div className="absolute bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-full px-2 sm:px-4">
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
            const targetZ = idx * -ROOM_SPACING_Z;
            setWarpTarget({ x: 0, z: targetZ + 6 });
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
    </div>
  );
}
