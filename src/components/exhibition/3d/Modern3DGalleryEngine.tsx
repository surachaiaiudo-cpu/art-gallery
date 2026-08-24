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
} from 'lucide-react';
import { museumAudio } from './MuseumSoundscape';

// -------------------------------------------------------------
// 3D Single Room Geometry Mesh Component (4 Distinct Shapes)
// -------------------------------------------------------------
function RoomStructureMesh({
  config,
  terrazzoTex,
  wallAOTex,
  wallBumpTex,
}: {
  config: RoomGeometryConfig;
  terrazzoTex: THREE.CanvasTexture | null;
  wallAOTex: THREE.CanvasTexture | null;
  wallBumpTex: THREE.CanvasTexture | null;
}) {
  const h = config.height || CEILING_HEIGHT;
  const cz = config.center.z;

  const wallMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#FAF8F3',
        roughness: 0.85,
        metalness: 0.02,
        side: THREE.DoubleSide,
        aoMap: wallAOTex || undefined,
        aoMapIntensity: 0.8,
        bumpMap: wallBumpTex || undefined,
        bumpScale: 0.003,
      }),
    [wallAOTex, wallBumpTex]
  );

  const floorMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#D8D2C5',
        roughness: 0.35,
        metalness: 0.05,
        side: THREE.DoubleSide,
        map: terrazzoTex || undefined,
      }),
    [terrazzoTex]
  );

  const baseboardMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3E2F20',
        roughness: 0.4,
        metalness: 0.1,
      }),
    []
  );

  const benchWoodMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#3B2D1F',
        roughness: 0.4,
        metalness: 0.1,
      }),
    []
  );

  // 1. CIRCULAR ROTUNDA
  if (config.shape === 'CIRCULAR') {
    const radius = 12;
    return (
      <group position={[0, 0, cz]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <circleGeometry args={[radius, 64]} />
          <primitive object={floorMaterial} attach="material" />
        </mesh>

        {/* Curved Circular Wall */}
        <mesh position={[0, h / 2, 0]} receiveShadow>
          <cylinderGeometry args={[radius, radius, h, 64, 1, true]} />
          <primitive object={wallMaterial} attach="material" side={THREE.BackSide} />
        </mesh>

        {/* Circular Baseboard */}
        <mesh position={[0, 0.075, 0]}>
          <cylinderGeometry args={[radius - 0.02, radius - 0.02, 0.15, 64, 1, true]} />
          <primitive object={baseboardMaterial} attach="material" side={THREE.BackSide} />
        </mesh>

        {/* Circular Skylight Ceiling */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
          <ringGeometry args={[4, radius, 64]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </mesh>

        {/* Central Circular Bench */}
        <group position={[0, 0.25, 0]}>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[2.0, 2.2, 0.45, 32]} />
            <primitive object={benchWoodMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[1.9, 1.9, 0.08, 32]} />
            <meshStandardMaterial color="#8C6D3F" roughness={0.3} />
          </mesh>
        </group>
      </group>
    );
  }

  // 2. L-SHAPE GALLERY (6 Wall Segments + L-Floor)
  if (config.shape === 'L_SHAPE') {
    return (
      <group position={[0, 0, cz]}>
        {/* L-Floor Segment 1 (Main Wing: 14x20m, centered at x=-5, z=0) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0, 0]} receiveShadow>
          <planeGeometry args={[14, 20]} />
          <primitive object={floorMaterial} attach="material" />
        </mesh>
        {/* L-Floor Segment 2 (Right Extension: 10x8m, centered at x=7, z=6) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[7, 0, 6]} receiveShadow>
          <planeGeometry args={[10, 8]} />
          <primitive object={floorMaterial} attach="material" />
        </mesh>

        {/* Ceiling Segment 1 */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[-5, h, 0]}>
          <planeGeometry args={[14, 20]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </mesh>
        {/* Ceiling Segment 2 */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[7, h, 6]}>
          <planeGeometry args={[10, 8]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </mesh>

        {/* Wall 0: Outer West Wall (x = -12, length = 20m) */}
        <mesh position={[-12, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[20, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[-12 + 0.08, 0.075, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[20, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* Wall 1: North Wall (z = -10, length = 14m, x centered at -5) */}
        <mesh position={[-5, h / 2, -10]} receiveShadow>
          <boxGeometry args={[14, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[-5, 0.075, -10 + 0.08]}>
          <boxGeometry args={[14, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* Wall 2: Inner Corner Wall (x = 2, length = 12m, z centered at -4) */}
        <mesh position={[2, h / 2, -4]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[12, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[2 - 0.08, 0.075, -4]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[12, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* Wall 3: East Wing Wall (z = 2, length = 10m, x centered at 7) */}
        <mesh position={[7, h / 2, 2]} receiveShadow>
          <boxGeometry args={[10, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[7, 0.075, 2 + 0.08]}>
          <boxGeometry args={[10, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* Wall 4: Far East Wall (x = 12, length = 8m, z centered at 6) */}
        <mesh position={[12, h / 2, 6]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[8, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[12 - 0.08, 0.075, 6]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[8, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* Wall 5: South Return Wall (z = 10, length = 24m, x centered at 0) */}
        <mesh position={[0, h / 2, 10]} receiveShadow>
          <boxGeometry args={[24, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0.075, 10 - 0.08]}>
          <boxGeometry args={[24, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* Minimalist Bench at L-Corner */}
        <group position={[-5, 0.25, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.45, 0.9]} />
            <primitive object={benchWoodMat} attach="material" />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <boxGeometry args={[3.0, 0.08, 0.8]} />
            <meshStandardMaterial color="#8C6D3F" roughness={0.3} />
          </mesh>
        </group>
      </group>
    );
  }

  // 3. RECTANGLE GALLERY (30 x 16m)
  if (config.shape === 'RECTANGLE') {
    const w = 30, d = 16;
    return (
      <group position={[0, 0, cz]}>
        {/* Floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[w, d]} />
          <primitive object={floorMaterial} attach="material" />
        </mesh>
        {/* Ceiling */}
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
          <planeGeometry args={[w, d]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </mesh>

        {/* North Wall */}
        <mesh position={[0, h / 2, -d / 2]} receiveShadow>
          <boxGeometry args={[w, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0.075, -d / 2 + 0.08]}>
          <boxGeometry args={[w, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* South Wall */}
        <mesh position={[0, h / 2, d / 2]} receiveShadow>
          <boxGeometry args={[w, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[0, 0.075, d / 2 - 0.08]}>
          <boxGeometry args={[w, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* West Wall */}
        <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[d, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[-w / 2 + 0.08, 0.075, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[d, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* East Wall */}
        <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
          <boxGeometry args={[d, h, 0.2]} />
          <primitive object={wallMaterial} attach="material" />
        </mesh>
        <mesh position={[w / 2 - 0.08, 0.075, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <boxGeometry args={[d, 0.15, 0.04]} />
          <primitive object={baseboardMaterial} attach="material" />
        </mesh>

        {/* Dual Benches for Long Rectangle */}
        <group position={[-5, 0.25, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.45, 0.9]} />
            <primitive object={benchWoodMat} attach="material" />
          </mesh>
        </group>
        <group position={[5, 0.25, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[2.6, 0.45, 0.9]} />
            <primitive object={benchWoodMat} attach="material" />
          </mesh>
        </group>
      </group>
    );
  }

  // 4. SQUARE PAVILION (22 x 22m - Default)
  const w = 22, d = 22;
  return (
    <group position={[0, 0, cz]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[w, d]} />
        <primitive object={floorMaterial} attach="material" />
      </mesh>

      {/* Ceiling with Skylight opening */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>

      {/* North Wall (Back) */}
      <mesh position={[0, h / 2, -d / 2]} receiveShadow>
        <boxGeometry args={[w, h, 0.2]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.075, -d / 2 + 0.08]}>
        <boxGeometry args={[w, 0.15, 0.04]} />
        <primitive object={baseboardMaterial} attach="material" />
      </mesh>

      {/* South Wall (Front) */}
      <mesh position={[0, h / 2, d / 2]} receiveShadow>
        <boxGeometry args={[w, h, 0.2]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[0, 0.075, d / 2 - 0.08]}>
        <boxGeometry args={[w, 0.15, 0.04]} />
        <primitive object={baseboardMaterial} attach="material" />
      </mesh>

      {/* West Wall (Left) */}
      <mesh position={[-w / 2, h / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[d, h, 0.2]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[-w / 2 + 0.08, 0.075, 0]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[d, 0.15, 0.04]} />
        <primitive object={baseboardMaterial} attach="material" />
      </mesh>

      {/* East Wall (Right) */}
      <mesh position={[w / 2, h / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[d, h, 0.2]} />
        <primitive object={wallMaterial} attach="material" />
      </mesh>
      <mesh position={[w / 2 - 0.08, 0.075, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <boxGeometry args={[d, 0.15, 0.04]} />
        <primitive object={baseboardMaterial} attach="material" />
      </mesh>

      {/* Minimalist Gallery Bench in Center */}
      <group position={[0, 0.25, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[3.2, 0.45, 0.9]} />
          <primitive object={benchWoodMat} attach="material" />
        </mesh>
        <mesh position={[0, 0.25, 0]}>
          <boxGeometry args={[3.0, 0.08, 0.8]} />
          <meshStandardMaterial color="#8C6D3F" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// -------------------------------------------------------------
// Interactive Camera Rig Controller (WASD, Arrow Turn & Radar Sync)
// -------------------------------------------------------------
interface CameraControllerProps {
  focusedArtwork: Artwork | null;
  focusedSlot: CalculatedArtworkSlot | null;
  onClearFocus: () => void;
  currentRoomConfig: RoomGeometryConfig;
  controlsRef: React.RefObject<any>;
  activeKeys: React.MutableRefObject<{ [key: string]: boolean }>;
  onCameraUpdate: (pos: { x: number; z: number }, rotY: number) => void;
  warpTarget: { x: number; z: number } | null;
  onClearWarp: () => void;
}

function CameraController({
  focusedArtwork,
  focusedSlot,
  onClearFocus,
  currentRoomConfig,
  controlsRef,
  activeKeys,
  onCameraUpdate,
  warpTarget,
  onClearWarp,
}: CameraControllerProps) {
  const { camera } = useThree();
  const targetCamPos = useRef(new THREE.Vector3(0, 1.8, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 1.8, 0));

  // Handle Warp Trigger from Minimap or Room Switcher
  useEffect(() => {
    if (warpTarget) {
      const cz = currentRoomConfig.center.z;
      camera.position.set(warpTarget.x, 1.8, warpTarget.z);
      targetCamPos.current.set(warpTarget.x, 1.8, warpTarget.z);
      targetLookAt.current.set(warpTarget.x, 1.8, cz);
      camera.lookAt(warpTarget.x, 1.8, cz);
      if (controlsRef.current) {
        controlsRef.current.target.set(warpTarget.x, 1.8, cz);
        controlsRef.current.update();
      }
      onClearWarp();
    }
  }, [warpTarget, onClearWarp, controlsRef, camera, currentRoomConfig.center.z]);

  useFrame((state, delta) => {
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
      const artPos = focusedSlot.position;
      const camX = artPos.x + Math.sin(focusedSlot.rotationY) * offsetDist;
      const camZ = artPos.z + Math.cos(focusedSlot.rotationY) * offsetDist;

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
        camera.position.add(move);

        // Boundary Clamp inside room
        const bX = currentRoomConfig.width / 2 - 1.2;
        const bZ = currentRoomConfig.depth / 2 - 1.2;
        const cz = currentRoomConfig.center.z;

        camera.position.x = Math.max(-bX, Math.min(bX, camera.position.x));
        camera.position.z = Math.max(cz - bZ, Math.min(cz + bZ, camera.position.z));
        camera.position.y = 1.8;

        if (controlsRef.current) {
          controlsRef.current.target.add(move);
          controlsRef.current.update();
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

  // Camera Minimap Radar state
  const [cameraRadarPos, setCameraRadarPos] = useState({ x: 0, z: 8 });
  const [cameraRadarRotY, setCameraRadarRotY] = useState(0);
  const [warpTarget, setWarpTarget] = useState<{ x: number; z: number } | null>(null);

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

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        e.preventDefault();
        activeKeys.current[k] = true;
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
  }, []);

  // Inspect Artwork Handler
  const handleInspectArtwork = (artwork: Artwork) => {
    setFocusedArtwork(artwork);
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

  // Curator Slot Swap Engine
  const handleSwapSlots = (slotIndexA: number, slotIndexB: number) => {
    const rawArtworks = [...(exhibition.artworks || [])];
    const artA = rawArtworks[slotIndexA];
    const artB = rawArtworks[slotIndexB];

    rawArtworks[slotIndexA] = artB;
    rawArtworks[slotIndexB] = artA;

    exhibition.artworks = rawArtworks;
    setUserRoomShapes([...activeRoomShapes]);
  };

  // Add / Remove Rooms (Curator only)
  const handleAddRoom = () => {
    setUserRoomShapes([...activeRoomShapes, 'SQUARE']);
  };

  const handleRemoveRoom = () => {
    if (activeRoomShapes.length > 1) {
      setUserRoomShapes(activeRoomShapes.slice(0, -1));
      if (currentRoomIndex >= activeRoomShapes.length - 1) {
        setCurrentRoomIndex(activeRoomShapes.length - 2);
      }
    }
  };

  // Change room shape directly (Curator only)
  const handleChangeCurrentRoomShape = async (newShape: RoomShape) => {
    const updated = [...activeRoomShapes];
    updated[currentRoomIndex] = newShape;
    setUserRoomShapes(updated);

    try {
      await fetch(`/api/admin/exhibitions/${exhibition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomShapes: updated,
          lightPreset: activeLightPreset,
        }),
      });
    } catch (e) {
      console.warn('Auto-save roomShape failed:', e);
    }
  };

  const shapeTitles: Record<string, string> = {
    SQUARE: 'ทรงจัตุรัส',
    RECTANGLE: 'ทรงผืนผ้า',
    L_SHAPE: 'ทรงตัว L',
    CIRCULAR: 'ทรงกลม',
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-[#F4F3EE] select-none text-slate-800">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 1.8, 8], fov: 60 }}
        gl={{
          antialias: true,
          alpha: false,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
        shadows
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

          {/* Render Active Room with exact morphing and zero lag */}
          <group key={`room-${currentRoomConfig.roomIndex}-${currentRoomConfig.shape}`}>
            <RoomStructureMesh
              config={currentRoomConfig}
              terrazzoTex={terrazzoTex}
              wallAOTex={wallAOTex}
              wallBumpTex={wallBumpTex}
            />

            {/* Render Artworks in Active Room (Max 20 per room) */}
            {currentRoomConfig.slots.map((slot) => {
              if (!slot.artwork) return null;
              return (
                <Artwork3DFrame
                  key={`art-slot-${slot.slotIndex}-${currentRoomConfig.shape}`}
                  slot={slot}
                  artwork={slot.artwork}
                  isFocused={focusedArtwork?.id === slot.artwork.id}
                  onInspect={handleInspectArtwork}
                />
              );
            })}
          </group>

          {/* Interactive Camera Rig Controller */}
          <CameraController
            focusedArtwork={focusedArtwork}
            focusedSlot={focusedSlot}
            onClearFocus={() => {
              setFocusedArtwork(null);
              setFocusedSlot(null);
            }}
            currentRoomConfig={currentRoomConfig}
            controlsRef={controlsRef}
            activeKeys={activeKeys}
            onCameraUpdate={(pos, rotY) => {
              setCameraRadarPos(pos);
              setCameraRadarRotY(rotY);
            }}
            warpTarget={warpTarget}
            onClearWarp={() => setWarpTarget(null)}
          />

          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            target={[0, 1.8, currentRoomConfig.center.z]}
            maxPolarAngle={Math.PI / 2 - 0.05}
            minDistance={1.0}
            maxDistance={25.0}
          />
        </Suspense>
      </Canvas>

      {/* Top Header Bar Controls (Role-aware: Clean Visitor View vs Full Curator View) */}
      <header className="absolute top-4 left-0 right-0 z-30 flex items-center justify-between px-6 pointer-events-none">
        <div className="flex items-center space-x-3 pointer-events-auto">
          {onSwitchTo2D && (
            <button
              onClick={onSwitchTo2D}
              className="px-3.5 py-2 rounded-2xl bg-white/95 hover:bg-white text-xs font-semibold text-slate-800 border border-slate-200 shadow-md flex items-center space-x-2 transition-all hover:scale-105"
            >
              <ChevronLeft className="w-4 h-4 text-amber-600" />
              <span>กลับสู่มุมมอง 2D</span>
            </button>
          )}

          {/* Multi-Room Switcher or Single-Room Badge */}
          {roomConfigs.length > 1 ? (
            <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
              <span className="text-amber-800 font-medium">ห้อง:</span>
              <select
                value={currentRoomIndex}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  setCurrentRoomIndex(idx);
                  setFocusedArtwork(null);
                  setFocusedSlot(null);
                  const targetCenterZ = idx * -ROOM_SPACING_Z;
                  setWarpTarget({ x: 0, z: targetCenterZ + 8 });
                }}
                className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer"
              >
                {roomConfigs.map((r, i) => (
                  <option key={i} value={i}>
                    ห้อง #{i + 1} ({shapeTitles[r.shape] || r.shape})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-200 shadow-sm text-xs font-semibold text-slate-800">
              <Building className="w-3.5 h-3.5 text-amber-600 mr-1" />
              <span>ห้อง #{currentRoomIndex + 1} • {shapeTitles[currentRoomConfig.shape] || currentRoomConfig.shape}</span>
            </div>
          )}

          {/* Ambient Museum Soundscape Audio Player (For all viewers) */}
          <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
            <button
              onClick={handleToggleAudio}
              className="flex items-center space-x-1.5 text-amber-900 font-semibold focus:outline-none hover:text-amber-700"
              title={isAudioPlaying ? 'ปิดเสียงบรรยากาศ' : 'เปิดเสียงบรรยากาศ'}
            >
              {isAudioPlaying ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span className="text-amber-800 hidden sm:inline">เสียงบรรยากาศ</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-slate-500 hidden sm:inline">เปิดเสียง</span>
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
                className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer text-xs ml-1"
              >
                <option value="museum">🏛️ หอศิลป์</option>
                <option value="river">🌿 ริมสายน้ำ</option>
                <option value="piano">🎹 เปียโน</option>
              </select>
            )}
          </div>

          {/* Curator Mode Exclusive Controls (Shape & Lighting Preset) */}
          {isCuratorMode && (
            <>
              {/* Light Atmosphere Preset Switcher for Curator */}
              <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <select
                  value={activeLightPreset}
                  onChange={(e) => setUserLightPreset(e.target.value as LightPreset)}
                  className="bg-transparent font-medium text-slate-800 focus:outline-none cursor-pointer text-xs"
                  title="กำหนดระบบแสงไฟบรรยากาศในห้องจัดแสดง"
                >
                  <option value="warm">💡 แสงอบอุ่น (Warm Museum)</option>
                  <option value="daylight">☀️ แสงธรรมชาติ (Daylight)</option>
                  <option value="dramatic">🎭 แสงดุดัน (Dramatic)</option>
                  <option value="cool">❄️ แสงโทนเย็น (Cool Minimal)</option>
                </select>
              </div>

              {/* Shape Switcher */}
              <div className="flex items-center space-x-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
                <Shapes className="w-3.5 h-3.5 text-amber-600" />
                <select
                  value={currentRoomConfig.shape}
                  onChange={(e) => handleChangeCurrentRoomShape(e.target.value as RoomShape)}
                  className="bg-transparent font-bold text-amber-900 focus:outline-none cursor-pointer"
                >
                  <option value="SQUARE">ทรงจัตุรัส (Square)</option>
                  <option value="RECTANGLE">ทรงผืนผ้า (Rectangle)</option>
                  <option value="L_SHAPE">ทรงตัว L (L-Shape)</option>
                  <option value="CIRCULAR">ทรงกลม (Rotunda)</option>
                </select>
              </div>
            </>
          )}
        </div>

        {/* Right Header Buttons */}
        <div className="flex items-center space-x-2 pointer-events-auto">
          {/* Curator Studio Modal Button (Only in Curator mode) */}
          {isCuratorMode && (
            <button
              onClick={() => setIsCuratorStudioOpen(true)}
              className="px-4 py-2 rounded-2xl bg-amber-500/25 hover:bg-amber-500/35 text-amber-950 border border-amber-500/50 text-xs font-bold flex items-center space-x-2 shadow-md transition-all hover:scale-105"
              title="เปิดสตูดิโอจัดการห้องจัดแสดง 3D และผังผนัง"
            >
              <Settings className="w-4 h-4 text-amber-700 animate-spin-slow" />
              <span>⚙️ จัดการห้อง 3D (Curator Studio)</span>
            </button>
          )}

          <button
            onClick={() => setIsGuidedTour(!isGuidedTour)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-semibold flex items-center space-x-1.5 shadow-sm border transition-all ${
              isGuidedTour
                ? 'bg-amber-600 text-white border-amber-600 animate-pulse'
                : 'bg-white/95 hover:bg-white text-amber-900 border-slate-200'
            }`}
          >
            {isGuidedTour ? (
              <>
                <Pause className="w-3.5 h-3.5" />
                <span>หยุด Tour</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-amber-600" />
                <span>Guided Tour</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              setFocusedArtwork(null);
              setFocusedSlot(null);
              setWarpTarget({ x: 0, z: currentRoomConfig.center.z + 8 });
            }}
            className="px-3.5 py-2 rounded-2xl bg-white/95 hover:bg-white text-slate-800 border border-slate-200 text-xs font-medium flex items-center space-x-1.5 shadow-sm transition-all"
            title="รีเซ็ตตำแหน่งกล้องสู่ภาพรวมห้อง"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
            <span>ภาพรวม</span>
          </button>
        </div>
      </header>

      {/* Top Left Keyboard Nav Helper Badge */}
      <div className="absolute top-20 left-6 z-30 pointer-events-none hidden lg:block">
        <div className="bg-white/90 backdrop-blur-md px-3.5 py-2 rounded-2xl text-[11px] text-slate-600 shadow-lg border border-white/80 flex items-center space-x-3">
          <span className="font-semibold text-amber-800 flex items-center">
            ควบคุมการเดิน:
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-200/90 rounded text-slate-800 font-mono">
              W
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-200/90 rounded text-slate-800 font-mono">
              A
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-200/90 rounded text-slate-800 font-mono">
              S
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-200/90 rounded text-slate-800 font-mono">
              D
            </kbd>{' '}
            เดิน/สไลด์
          </span>
          <span>|</span>
          <span>
            <kbd className="px-1.5 py-0.5 bg-slate-200/90 rounded text-slate-800 font-mono">
              ←
            </kbd>{' '}
            <kbd className="px-1.5 py-0.5 bg-slate-200/90 rounded text-slate-800 font-mono">
              →
            </kbd>{' '}
            หันมองซ้าย-ขวา
          </span>
        </div>
      </div>

      {/* Top Right Minimap Radar */}
      <div className="absolute top-20 right-6 z-30 pointer-events-auto block">
        <MinimapRadar
          roomConfig={currentRoomConfig}
          cameraPos={cameraRadarPos}
          cameraRotationY={cameraRadarRotY}
          onWarpToPosition={(x, z) => setWarpTarget({ x, z })}
          onSelectArtwork={(slot) => {
            if (slot.artwork) handleInspectArtwork(slot.artwork);
          }}
        />
      </div>

      {/* Bottom Artwork Carousel Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-full px-4">
        <div className="bg-white/95 backdrop-blur-xl px-4 py-2.5 rounded-2xl flex items-center space-x-3 shadow-2xl border border-white/80">
          <span className="text-xs text-slate-500 font-medium pr-2 border-r border-slate-200 hidden md:inline">
            ผลงานในห้องนี้:
          </span>
          <div className="flex items-center space-x-2 overflow-x-auto max-w-[70vw] sm:max-w-lg py-1">
            {currentRoomConfig.slots
              .filter((s) => s.artwork)
              .map((slot) => {
                const isSelected = focusedArtwork?.id === slot.artwork?.id;
                return (
                  <button
                    key={slot.slotIndex}
                    onClick={() => {
                      if (slot.artwork) handleInspectArtwork(slot.artwork);
                    }}
                    className={`h-11 w-11 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all relative ${
                      isSelected
                        ? 'border-amber-500 scale-110 shadow-md ring-2 ring-amber-400'
                        : 'border-white hover:border-amber-300 opacity-80 hover:opacity-100'
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
                      <div className="w-full h-full bg-amber-100 flex items-center justify-center text-[10px] font-bold text-amber-800">
                        #{slot.slotIndex + 1}
                      </div>
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
          onChangeLightPreset={setUserLightPreset}
          onSwapSlots={handleSwapSlots}
          onFocusSlot={(slot) => {
            if (slot.artwork) handleInspectArtwork(slot.artwork);
          }}
        />
      )}
    </div>
  );
}
