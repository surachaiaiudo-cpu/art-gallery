'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import NextImage from 'next/image';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PointerLockControls, Text, Html, Image as DreiImage } from '@react-three/drei';
import * as THREE from 'three';
import { Exhibition, Artwork, WallPosition } from '@/types/exhibition';
import { ArtworkLightbox } from './ArtworkLightbox';
import { ArtworkInquiryModal } from './ArtworkInquiryModal';
import { useLanguage } from '@/context/LanguageContext';
import { formatPrice, parseArtworkDimensions } from '@/lib/utils';
import { CountryFlag } from '@/components/ui/CountryFlag';
import {
  Eye,
  Move,
  Compass,
  Maximize,
  RotateCcw,
  Home,
  Sparkles,
  Building2,
  Gamepad2,
  Crosshair,
  MousePointer,
  ZoomIn,
  Mail,
  X,
  User,
} from 'lucide-react';

export type RoomSize = 'small' | 'medium' | 'large';

const ROOM_CONFIGS: Record<RoomSize, { dim: number; height: number; spawnZ: number; maxDist: number }> = {
  small: { dim: 10, height: 3.6, spawnZ: 3.8, maxDist: 5.5 },
  medium: { dim: 14, height: 4.4, spawnZ: 5.2, maxDist: 7.5 },
  large: { dim: 22, height: 5.8, spawnZ: 8.5, maxDist: 11.5 },
};

interface Exhibition3DRoomProps {
  exhibition: Exhibition;
  onSwitchTo2D?: () => void;
}

// -------------------------------------------------------------
// 3D Artwork Image Component (High-Res & Proxy CORS-Safe)
// -------------------------------------------------------------
function ArtworkImagePlane({
  url,
  width,
  height,
  zPos,
}: {
  url: string;
  width: number;
  height: number;
  zPos: number;
}) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin('anonymous');

    // Route through local proxy to ensure CORS and avoid browser image cache conflicts
    const targetUrl = url?.startsWith('http')
      ? `/api/image-proxy?url=${encodeURIComponent(url)}`
      : url || '';

    if (targetUrl) {
      loader.load(
        targetUrl,
        (tex) => {
          if (active) {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.needsUpdate = true;
            setTexture(tex);
          }
        },
        undefined,
        (err) => {
          console.warn('Texture load fallback:', err);
        }
      );
    }

    return () => {
      active = false;
    };
  }, [url]);

  return (
    <mesh position={[0, 0, zPos]}>
      <planeGeometry args={[width, height]} />
      {texture ? (
        <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
      ) : (
        <meshBasicMaterial color="#E8E2D6" side={THREE.DoubleSide} />
      )}
    </mesh>
  );
}

// -------------------------------------------------------------
// 3D Artwork Frame Component
// -------------------------------------------------------------
interface ArtworkMeshProps {
  artwork: Artwork;
  onInspect: (artwork: Artwork) => void;
  isFocused: boolean;
  roomSize: RoomSize;
}

function ArtworkMesh({ artwork, onInspect, isFocused, roomSize }: ArtworkMeshProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const config = ROOM_CONFIGS[roomSize];
  const ratio = config.dim / 14;
  const wallOffset = config.dim / 2 - 0.15;

  // Base coordinate from database
  const rawPos: WallPosition = artwork.wallPosition || {
    x: 0,
    y: 2.0,
    z: -6.85,
    rotationY: 0,
    wallIndex: 0,
    scale: 1,
  };

  // Adaptive wall position calculation based on room size
  let posX = rawPos.x * ratio;
  let posY = rawPos.y;
  let posZ = rawPos.z * ratio;
  const rotY = rawPos.rotationY;

  // Snap to appropriate wall boundary
  if (Math.abs(rawPos.rotationY) < 0.2) {
    // North wall (Back)
    posZ = -wallOffset;
    posX = rawPos.x * ratio;
  } else if (Math.abs(rawPos.rotationY - -Math.PI / 2) < 0.2) {
    // East wall (Right)
    posX = wallOffset;
    posZ = rawPos.z * ratio;
  } else if (Math.abs(rawPos.rotationY - Math.PI / 2) < 0.2) {
    // West wall (Left)
    posX = -wallOffset;
    posZ = rawPos.z * ratio;
  } else if (Math.abs(rawPos.rotationY - Math.PI) < 0.2) {
    // South wall (Front)
    posZ = wallOffset;
    posX = rawPos.x * ratio;
  }

  // Calculate real physical dimensions (W x H in meters) from artwork.dimensions
  const realDim = parseArtworkDimensions(artwork.dimensions);
  const frameWidth = realDim.widthMeters * (rawPos.scale || 1);
  const frameHeight = realDim.heightMeters * (rawPos.scale || 1);

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
    return () => {
      document.body.style.cursor = 'default';
    };
  }, [hovered]);

  return (
    <group
      ref={meshRef}
      position={[posX, posY, posZ]}
      rotation={[0, rotY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onInspect(artwork);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Backing Mounting Plate */}
      <mesh position={[0, 0, -0.015]} castShadow receiveShadow>
        <boxGeometry args={[frameWidth + 0.16, frameHeight + 0.16, 0.02]} />
        <meshStandardMaterial
          color={hovered ? '#B38F56' : '#2A1F18'}
          roughness={0.4}
          metalness={hovered ? 0.6 : 0.2}
        />
      </mesh>

      {/* 4 Outer Frame Borders (Open Center) */}
      {/* Top Border */}
      <mesh position={[0, frameHeight / 2 + 0.04, 0.01]} castShadow>
        <boxGeometry args={[frameWidth + 0.16, 0.08, 0.03]} />
        <meshStandardMaterial color={hovered ? '#D4BC96' : '#8C6D3F'} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Bottom Border */}
      <mesh position={[0, -(frameHeight / 2 + 0.04), 0.01]} castShadow>
        <boxGeometry args={[frameWidth + 0.16, 0.08, 0.03]} />
        <meshStandardMaterial color={hovered ? '#D4BC96' : '#8C6D3F'} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Left Border */}
      <mesh position={[-(frameWidth / 2 + 0.04), 0, 0.01]} castShadow>
        <boxGeometry args={[0.08, frameHeight, 0.03]} />
        <meshStandardMaterial color={hovered ? '#D4BC96' : '#8C6D3F'} roughness={0.3} metalness={0.6} />
      </mesh>
      {/* Right Border */}
      <mesh position={[frameWidth / 2 + 0.04, 0, 0.01]} castShadow>
        <boxGeometry args={[0.08, frameHeight, 0.03]} />
        <meshStandardMaterial color={hovered ? '#D4BC96' : '#8C6D3F'} roughness={0.3} metalness={0.6} />
      </mesh>

      {/* High-Resolution Artwork Image (Shader & CORS Safe) */}
      <ArtworkImagePlane
        url={artwork.imageUrl}
        width={frameWidth}
        height={frameHeight}
        zPos={0.006}
      />

      {/* Museum Placard / Label Plate underneath */}
      <group position={[0, -(frameHeight / 2 + 0.26), 0.02]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.26, 0.02]} />
          <meshStandardMaterial color="#EDE8DD" roughness={0.3} metalness={0.1} />
        </mesh>

        <Text
          position={[0, 0.04, 0.02]}
          fontSize={0.055}
          color="#1A1918"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.1}
          textAlign="center"
        >
          {artwork.title}
        </Text>
        <Text
          position={[0, -0.04, 0.02]}
          fontSize={0.04}
          color="#6E6759"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.1}
          textAlign="center"
        >
          {artwork.artist?.name || 'Artist'} • {artwork.yearCreated || '2026'}
        </Text>
      </group>

      {/* Dedicated Warm Spotlight from Ceiling */}
      <spotLight
        position={[0, 2.5, 1.8]}
        target-position={[0, 0, 0]}
        intensity={hovered ? 8 : 5}
        angle={0.55}
        penumbra={0.6}
        color="#FFF3E0"
        castShadow
      />

      {/* Interactive Inspect Floating Prompt */}
      {hovered && (
        <Html position={[0, frameHeight / 2 + 0.25, 0.2]} center distanceFactor={12}>
          <div className="px-3 py-1.5 bg-black/85 text-white text-[11px] font-sans rounded-full shadow-lg border border-white/20 whitespace-nowrap flex items-center gap-1.5 backdrop-blur animate-fade-in pointer-events-none">
            <Eye className="w-3 h-3 text-[#C5A880]" />
            <span>Click to inspect artwork</span>
          </div>
        </Html>
      )}
    </group>
  );
}

// -------------------------------------------------------------
// 3D Room Architecture & Lighting (Adaptive by RoomSize)
// -------------------------------------------------------------
function GalleryArchitecture({ roomSize }: { roomSize: RoomSize }) {
  const config = ROOM_CONFIGS[roomSize];
  const size = config.dim;
  const height = config.height;

  return (
    <group>
      {/* Floor: Polished Parquet / Light Wood */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color={roomSize === 'large' ? '#CFC7B9' : '#D8D0C3'}
          roughness={0.35}
          metalness={0.15}
        />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#1C1A18" roughness={0.9} />
      </mesh>

      {/* North Wall (Back) - Color #629388 */}
      <mesh position={[0, height / 2, -size / 2]} receiveShadow>
        <boxGeometry args={[size, height, 0.2]} />
        <meshStandardMaterial color="#629388" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* South Wall (Front with Entry Arch) - Color #629388 */}
      <mesh position={[-size / 3.5, height / 2, size / 2]} receiveShadow>
        <boxGeometry args={[size / 2.2, height, 0.2]} />
        <meshStandardMaterial color="#629388" roughness={0.6} metalness={0.05} />
      </mesh>
      <mesh position={[size / 3.5, height / 2, size / 2]} receiveShadow>
        <boxGeometry args={[size / 2.2, height, 0.2]} />
        <meshStandardMaterial color="#629388" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* West Wall (Left) - Color #629388 */}
      <mesh position={[-size / 2, height / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[size, height, 0.2]} />
        <meshStandardMaterial color="#629388" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* East Wall (Right) - Color #629388 */}
      <mesh position={[size / 2, height / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[size, height, 0.2]} />
        <meshStandardMaterial color="#629388" roughness={0.6} metalness={0.05} />
      </mesh>

      {/* Classical Marble Pillars in Large Room Mode */}
      {roomSize === 'large' && (
        <group>
          {[-6, 6].map((x) =>
            [-6, 6].map((z) => (
              <group key={`pillar-${x}-${z}`} position={[x, 0, z]}>
                {/* Column Base */}
                <mesh position={[0, 0.2, 0]} castShadow>
                  <boxGeometry args={[0.9, 0.4, 0.9]} />
                  <meshStandardMaterial color="#E5E0D5" roughness={0.3} />
                </mesh>
                {/* Fluted Column Shaft */}
                <mesh position={[0, height / 2, 0]} castShadow>
                  <cylinderGeometry args={[0.32, 0.35, height - 0.8, 24]} />
                  <meshStandardMaterial color="#EAE6DE" roughness={0.25} />
                </mesh>
                {/* Column Capital */}
                <mesh position={[0, height - 0.2, 0]} castShadow>
                  <boxGeometry args={[0.9, 0.4, 0.9]} />
                  <meshStandardMaterial color="#E5E0D5" roughness={0.3} />
                </mesh>
              </group>
            ))
          )}

          {/* Dual Museum Benches for Visitors in Large Room */}
          <group position={[0, 0.25, 4]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[3.2, 0.45, 0.9]} />
              <meshStandardMaterial color="#2B1E16" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.25, 0]}>
              <boxGeometry args={[3.0, 0.08, 0.8]} />
              <meshStandardMaterial color="#8C6D3F" roughness={0.4} />
            </mesh>
          </group>
        </group>
      )}

      {/* Central Classical Sculpture on Marble Pedestal */}
      <group position={[0, 0, roomSize === 'small' ? 0.8 : 1.5]}>
        <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.9, 1.2, 0.9]} />
          <meshStandardMaterial color="#EAE6DE" roughness={0.2} metalness={0.2} />
        </mesh>
        <mesh position={[0, 1.4, 0]} castShadow>
          <cylinderGeometry args={[0.3, 0.35, 0.4, 32]} />
          <meshStandardMaterial color="#3D332A" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.85, 0]} castShadow>
          <torusKnotGeometry args={[0.26, 0.08, 64, 16]} />
          <meshStandardMaterial color="#8C6D3F" roughness={0.25} metalness={0.85} />
        </mesh>
        <spotLight
          position={[0, height - 0.5, 1.5]}
          target-position={[0, 1.5, 1.5]}
          intensity={6}
          angle={0.6}
          penumbra={0.7}
          color="#FFF6E5"
          castShadow
        />
      </group>

      {/* Ceiling Track Lights Grid */}
      <mesh position={[0, height - 0.1, -size / 4]}>
        <boxGeometry args={[size * 0.7, 0.05, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, height - 0.1, size / 4]}>
        <boxGeometry args={[size * 0.7, 0.05, 0.1]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Warm Ambient Gallery Lighting */}
      <ambientLight intensity={roomSize === 'large' ? 1.1 : 0.9} color="#FFF5E6" />
      <directionalLight position={[0, height + 2, 0]} intensity={0.4} color="#FFF0DC" />
    </group>
  );
}

// -------------------------------------------------------------
// Interactive Camera Controller (WASD + Smooth Focus)
// -------------------------------------------------------------
interface CameraRigProps {
  focusedArtwork: Artwork | null;
  onClearFocus: () => void;
  roomSize: RoomSize;
  controlsRef: React.RefObject<any>;
  activeKeys: React.MutableRefObject<{ [key: string]: boolean }>;
}

function CameraRig({
  focusedArtwork,
  onClearFocus,
  roomSize,
  controlsRef,
  activeKeys,
}: CameraRigProps) {
  const { camera } = useThree();
  const config = ROOM_CONFIGS[roomSize];
  const targetPos = useRef(new THREE.Vector3(0, 1.8, config.spawnZ));
  const targetLook = useRef(new THREE.Vector3(0, 1.8, 0));

  // Reset camera when room size changes
  useEffect(() => {
    if (!focusedArtwork) {
      targetPos.current.set(0, 1.8, config.spawnZ);
      targetLook.current.set(0, 1.8, 0);
      camera.position.set(0, 1.8, config.spawnZ);
      camera.lookAt(0, 1.8, 0);
      if (controlsRef.current) {
        controlsRef.current.target.set(0, 1.8, 0);
        controlsRef.current.update();
      }
    }
  }, [roomSize, config.spawnZ, camera, focusedArtwork, controlsRef]);

  useFrame((state, delta) => {
    const isMoving =
      activeKeys.current['w'] ||
      activeKeys.current['arrowup'] ||
      activeKeys.current['s'] ||
      activeKeys.current['arrowdown'] ||
      activeKeys.current['a'] ||
      activeKeys.current['arrowleft'] ||
      activeKeys.current['d'] ||
      activeKeys.current['arrowright'];

    if (isMoving && focusedArtwork) {
      onClearFocus();
    }

    if (focusedArtwork && !isMoving) {
      const rawPos = focusedArtwork.wallPosition || { x: 0, y: 2.0, z: -6.85, rotationY: 0 };
      const ratio = config.dim / 14;
      const wallOffset = config.dim / 2 - 0.15;

      let artX = rawPos.x * ratio;
      let artZ = rawPos.z * ratio;

      if (Math.abs(rawPos.rotationY) < 0.2) {
        artZ = -wallOffset;
      } else if (Math.abs(rawPos.rotationY - -Math.PI / 2) < 0.2) {
        artX = wallOffset;
      } else if (Math.abs(rawPos.rotationY - Math.PI / 2) < 0.2) {
        artX = -wallOffset;
      } else if (Math.abs(rawPos.rotationY - Math.PI) < 0.2) {
        artZ = wallOffset;
      }

      // Stand in front of painting
      const offsetDist = 2.4;
      const camX = artX + Math.sin(rawPos.rotationY) * offsetDist;
      const camZ = artZ + Math.cos(rawPos.rotationY) * offsetDist;

      targetPos.current.set(camX, rawPos.y || 2.0, camZ);
      targetLook.current.set(artX, rawPos.y || 2.0, artZ);

      camera.position.lerp(targetPos.current, 0.08);
      camera.lookAt(targetLook.current);

      if (controlsRef.current) {
        controlsRef.current.target.lerp(targetLook.current, 0.08);
      }
    } else {
      // Free Walk Mode with WASD + Arrow Keys
      const moveSpeed = 5.2 * delta;
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const move = new THREE.Vector3();

      if (activeKeys.current['w'] || activeKeys.current['arrowup']) move.add(forward);
      if (activeKeys.current['s'] || activeKeys.current['arrowdown']) move.sub(forward);
      if (activeKeys.current['d'] || activeKeys.current['arrowright']) move.add(right);
      if (activeKeys.current['a'] || activeKeys.current['arrowleft']) move.sub(right);

      if (move.lengthSq() > 0) {
        move.normalize().multiplyScalar(moveSpeed);
        camera.position.add(move);

        // Clamp camera within room boundary
        const boundary = config.dim / 2 - 1.2;
        camera.position.x = Math.max(-boundary, Math.min(boundary, camera.position.x));
        camera.position.z = Math.max(-boundary, Math.min(boundary, camera.position.z));
        camera.position.y = 1.8; // Maintain constant eye level

        // Sync OrbitControls target
        if (controlsRef.current) {
          controlsRef.current.target.add(move);
          controlsRef.current.update();
        }
      }
    }
  });

  return null;
}

// -------------------------------------------------------------
// Main 3D Room Component
// -------------------------------------------------------------
export function Exhibition3DRoom({ exhibition, onSwitchTo2D }: Exhibition3DRoomProps) {
  const { lang, t } = useLanguage();
  const controlsRef = useRef<any>(null);
  const pointerLockRef = useRef<any>(null);
  const activeKeys = useRef<{ [key: string]: boolean }>({});
  const [pressedKeysState, setPressedKeysState] = useState<{ [key: string]: boolean }>({});
  const [controlMode, setControlMode] = useState<'fps' | 'orbit'>('fps');
  const [isFpsLocked, setIsFpsLocked] = useState(false);

  // Global Keyboard Event Listener for WASD + Arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting input if typing in a modal or input box
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        e.preventDefault();
        activeKeys.current[key] = true;
        setPressedKeysState((prev) => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        activeKeys.current[key] = false;
        setPressedKeysState((prev) => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Virtual Key Press Helper (for UI buttons)
  const handleVirtualKey = (key: string, pressed: boolean) => {
    activeKeys.current[key] = pressed;
    setPressedKeysState((prev) => ({ ...prev, [key]: pressed }));
  };
  
  // Read curator configured room size from exhibition themeConfig (default: medium)
  const defaultRoomSize: RoomSize = (() => {
    if (exhibition.themeConfig) {
      try {
        const parsed = JSON.parse(exhibition.themeConfig);
        if (parsed.roomSize === 'small' || parsed.roomSize === 'medium' || parsed.roomSize === 'large') {
          return parsed.roomSize;
        }
      } catch {}
    }
    return 'medium';
  })();

  const [roomSize, setRoomSize] = useState<RoomSize>(defaultRoomSize);
  const [focusedArtwork, setFocusedArtwork] = useState<Artwork | null>(null);
  const [detailModalArtwork, setDetailModalArtwork] = useState<Artwork | null>(null);
  const [inquiryArtwork, setInquiryArtwork] = useState<Artwork | null>(null);

  const artworks = exhibition.artworks || [];
  const config = ROOM_CONFIGS[roomSize];

  const handleInspectArtwork = (art: Artwork) => {
    setFocusedArtwork(art);
    setIsFpsLocked(false);
    // Explicitly release pointer lock so mouse cursor is instantly available for UI menus
    if (typeof document !== 'undefined' && document.pointerLockElement) {
      document.exitPointerLock();
    }
    if (pointerLockRef.current?.isLocked) {
      pointerLockRef.current.unlock();
    }
  };

  const handleResetCamera = () => {
    setFocusedArtwork(null);
  };

  const toggleControlMode = () => {
    if (controlMode === 'fps') {
      if (pointerLockRef.current?.isLocked) {
        pointerLockRef.current.unlock();
      }
      setControlMode('orbit');
    } else {
      setControlMode('fps');
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] bg-[#141210] overflow-hidden select-none">
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 1.8, config.spawnZ], fov: 60 }}
        className={`w-full h-full ${controlMode === 'fps' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <Suspense fallback={null}>
          <GalleryArchitecture roomSize={roomSize} />

          {artworks.map((artwork) => (
            <ArtworkMesh
              key={artwork.id}
              artwork={artwork}
              onInspect={handleInspectArtwork}
              isFocused={focusedArtwork?.id === artwork.id}
              roomSize={roomSize}
            />
          ))}

          <CameraRig
            focusedArtwork={focusedArtwork}
            onClearFocus={() => setFocusedArtwork(null)}
            roomSize={roomSize}
            controlsRef={controlsRef}
            activeKeys={activeKeys}
          />

          {/* FPS Mode: PointerLockControls (Mouse Look) */}
          {controlMode === 'fps' && !focusedArtwork && (
            <PointerLockControls
              ref={pointerLockRef}
              onLock={() => setIsFpsLocked(true)}
              onUnlock={() => setIsFpsLocked(false)}
            />
          )}

          {/* Orbit Mode: OrbitControls */}
          {controlMode === 'orbit' && !focusedArtwork && (
            <OrbitControls
              ref={controlsRef}
              enablePan={false}
              enableZoom={true}
              minDistance={0.5}
              maxDistance={config.maxDist}
              maxPolarAngle={Math.PI / 2 + 0.05}
              minPolarAngle={Math.PI / 4}
              target={[0, 1.8, 0]}
            />
          )}
        </Suspense>
      </Canvas>

      {/* FPS Center Crosshair (When Locked) */}
      {controlMode === 'fps' && isFpsLocked && !focusedArtwork && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <div className="relative flex items-center justify-center">
            {/* Center Aim Dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-[#C5A880] border border-white shadow-[0_0_8px_rgba(197,168,128,0.9)] animate-pulse" />
            {/* Subtle Crosshair Lines */}
            <div className="absolute w-6 h-[1.5px] bg-white/40" />
            <div className="absolute h-6 w-[1.5px] bg-white/40" />
          </div>
        </div>
      )}

      {/* FPS Click to Enter Walk Mode Overlay Prompt (When Not Locked) */}
      {controlMode === 'fps' && !isFpsLocked && !focusedArtwork && (
        <div
          onClick={() => pointerLockRef.current?.lock()}
          className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer bg-black/25 hover:bg-black/15 transition-all"
        >
          <div className="bg-black/85 backdrop-blur-md px-7 py-5 rounded-2xl border border-[#C5A880]/60 shadow-2xl text-center space-y-2.5 text-white animate-fade-in group hover:border-[#C5A880] transition-all">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#C5A880]/20 flex items-center justify-center border border-[#C5A880] group-hover:scale-110 transition-transform shadow-inner">
              <Gamepad2 className="w-7 h-7 text-[#C5A880]" />
            </div>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#E2CEB5]">
              {lang === 'th' ? 'คลิกที่นี่เพื่อเริ่มเดินชม (FPS Mode)' : 'Click to Enter FPS Walk Mode'}
            </h3>
            <p className="text-xs text-neutral-300 max-w-sm leading-relaxed">
              {lang === 'th'
                ? '🎮 ขยับเมาส์เพื่อหันมุมมอง 360° + ปุ่ม WASD เพื่อเดิน (กด Esc เพื่อปลดล็อคเมาส์)'
                : '🎮 Move mouse to look around in 360° + WASD to walk (Press Esc to release cursor)'}
            </p>
            <div className="pt-1">
              <span className="inline-block px-4 py-1.5 bg-[#C5A880] hover:bg-[#D4BC96] text-[#1A1918] font-bold text-xs rounded-full uppercase tracking-wider shadow">
                {lang === 'th' ? 'เริ่มเดินมุมมอง FPS' : 'Start Walking'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top Left Title Overlay */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <span className="text-[10px] uppercase tracking-[0.25em] text-[#C5A880] font-bold block drop-shadow">
          {lang === 'th' ? '3D นิทรรศการหอศิลป์เสมือนจริง' : '3D Virtual Walkthrough'}
        </span>
        <h2 className="font-serif text-lg sm:text-xl font-bold text-white drop-shadow-md">
          {exhibition.title}
        </h2>
      </div>

      {/* Top Center: Room Size Selector & FPS / Orbit Mode Switcher */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap items-center gap-2">
        {/* FPS / Orbit Mode Switcher */}
        <div className="flex items-center bg-black/80 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-xl text-xs font-semibold">
          <button
            onClick={() => {
              setControlMode('fps');
              setTimeout(() => pointerLockRef.current?.lock(), 50);
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              controlMode === 'fps'
                ? 'bg-[#C5A880] text-[#1A1918] shadow'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="First-Person Shooter Style Navigation (Mouse Look + WASD)"
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'มุมมอง FPS' : 'FPS Mode'}</span>
          </button>
          <button
            onClick={() => {
              if (pointerLockRef.current?.isLocked) pointerLockRef.current.unlock();
              setControlMode('orbit');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
              controlMode === 'orbit'
                ? 'bg-[#C5A880] text-[#1A1918] shadow'
                : 'text-neutral-300 hover:text-white'
            }`}
            title="Third-Person Orbit Navigation"
          >
            <Move className="w-3.5 h-3.5" />
            <span>{lang === 'th' ? 'หมุนกล้อง' : 'Orbit'}</span>
          </button>
        </div>

        {/* Room Size Selector (เล็ก / กลาง / ใหญ่) */}
        <div className="flex items-center bg-black/80 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-xl text-xs font-semibold">
          <div className="flex items-center gap-1.5 px-2 text-[#C5A880] border-r border-white/20 hidden md:flex">
            <Building2 className="w-3.5 h-3.5" />
            <span className="text-[10px] uppercase tracking-wider">{t.actions.roomSize}:</span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setRoomSize('small')}
              className={`px-2.5 py-1 rounded-full transition-all text-xs ${
                roomSize === 'small'
                  ? 'bg-[#C5A880] text-[#1A1918] shadow'
                  : 'text-neutral-300 hover:text-white'
              }`}
              title="Intimate Gallery Salon (10m)"
            >
              {t.actions.sizeSmall}
            </button>
            <button
              onClick={() => setRoomSize('medium')}
              className={`px-2.5 py-1 rounded-full transition-all text-xs ${
                roomSize === 'medium'
                  ? 'bg-[#C5A880] text-[#1A1918] shadow'
                  : 'text-neutral-300 hover:text-white'
              }`}
              title="Standard Exhibition Hall (14m)"
            >
              {t.actions.sizeMedium}
            </button>
            <button
              onClick={() => setRoomSize('large')}
              className={`px-2.5 py-1 rounded-full transition-all text-xs ${
                roomSize === 'large'
                  ? 'bg-[#C5A880] text-[#1A1918] shadow'
                  : 'text-neutral-300 hover:text-white'
              }`}
              title="Grand Museum Pavilion (22m)"
            >
              {t.actions.sizeLarge}
            </button>
          </div>
        </div>
      </div>

      {/* Top Right Quick Artwork Selector & Exit to Lobby */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <Link
          href="/"
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-black/80 hover:bg-black text-[#E2CEB5] hover:text-white text-xs font-semibold rounded-lg border border-white/20 backdrop-blur transition-all shadow"
          title={t.actions.returnToLobby}
        >
          <Home className="w-3.5 h-3.5 text-[#C5A880]" />
          <span>{t.actions.returnToLobby}</span>
        </Link>

        <select
          value={focusedArtwork?.id || ''}
          onChange={(e) => {
            const art = artworks.find((a) => a.id === e.target.value);
            if (art) handleInspectArtwork(art);
            else handleResetCamera();
          }}
          className="bg-black/75 hover:bg-black text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 backdrop-blur focus:outline-none cursor-pointer"
        >
          <option value="">{t.actions.jumpToArtwork}</option>
          {artworks.map((art, i) => (
            <option key={art.id} value={art.id}>
              #{i + 1} {art.title}
            </option>
          ))}
        </select>

        {focusedArtwork && (
          <button
            onClick={handleResetCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-black/75 hover:bg-black text-white text-xs rounded-lg border border-white/20 backdrop-blur transition-all"
            title={t.actions.freeWalk}
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">{t.actions.freeWalk}</span>
          </button>
        )}
      </div>

      {/* Luxury Museum Placard HUD (When an artwork is focused) */}
      {focusedArtwork && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-11/12 max-w-2xl bg-[#141210]/95 backdrop-blur-xl text-white border border-[#C5A880]/60 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-slide-up ring-1 ring-white/10">
          {/* Close button in top-right */}
          <button
            onClick={handleResetCamera}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-400 hover:text-white transition-all"
            title="Close Placard (Esc)"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Artwork Miniature Preview Thumbnail with Gold Bevel */}
            <div
              onClick={() => setDetailModalArtwork(focusedArtwork)}
              className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl overflow-hidden border-2 border-[#C5A880] shadow-lg cursor-pointer group"
              title="Click to Zoom 8x"
            >
              <NextImage
                src={focusedArtwork.imageUrl}
                alt={focusedArtwork.title}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ZoomIn className="w-5 h-5 text-white drop-shadow" />
              </div>
            </div>

            {/* Artwork Information */}
            <div className="flex-1 min-w-0 space-y-1.5 pr-6 sm:pr-0">
              {/* Badge row: CountryFlag + Tag + Price */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15">
                  <CountryFlag country={focusedArtwork.artist?.country} size="xs" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#E2CEB5]">
                    {focusedArtwork.artist?.country || 'Thailand'}
                  </span>
                </div>

                {focusedArtwork.price ? (
                  <span className="text-[11px] font-mono text-emerald-300 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/80 shadow-sm">
                    {formatPrice(focusedArtwork.price)}
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-[#A0988A] bg-white/5 px-2 py-0.5 rounded-full border border-white/10 font-semibold">
                    Price upon request
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug drop-shadow">
                {focusedArtwork.title}
              </h3>

              {/* Artist Name & Meta */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#DDD7CC]">
                <Link
                  href={focusedArtwork.artistId ? `/artists/${focusedArtwork.artistId}` : '#'}
                  className="font-semibold text-[#E5D2B8] hover:text-white underline-offset-2 hover:underline transition-colors"
                >
                  {focusedArtwork.artist?.name || 'Master Artist'}
                </Link>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-300">{focusedArtwork.medium}</span>
                <span className="text-neutral-500">•</span>
                <span className="text-neutral-400">{focusedArtwork.dimensions}</span>
                {focusedArtwork.yearCreated && (
                  <>
                    <span className="text-neutral-500">•</span>
                    <span className="text-[#C5A880] font-mono">{focusedArtwork.yearCreated}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action Button Bar - Compact Luxury Icon Buttons */}
          <div className="mt-4 pt-3.5 border-t border-[#C5A880]/25 flex items-center justify-between gap-3">
            <div className="text-[11px] text-neutral-400 hidden sm:flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A880] shrink-0" />
              <span className="truncate">{lang === 'th' ? 'ผลงานต้นฉบับพร้อมใบรับรองลิขสิทธิ์' : 'Authentic Masterpiece with Certificate'}</span>
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              {/* Artist Portfolio Link Icon Button */}
              {focusedArtwork.artistId && (
                <Link
                  href={`/artists/${focusedArtwork.artistId}`}
                  className="group/btn relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-110 active:scale-95 shadow"
                  title={lang === 'th' ? 'ดูประวัติและผลงานทั้งหมดของศิลปิน' : 'View Artist Portfolio'}
                >
                  <User className="w-4 h-4 text-[#E2CEB5] group-hover/btn:text-white" />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded font-medium whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow">
                    {lang === 'th' ? 'ศิลปิน' : 'Artist'}
                  </span>
                </Link>
              )}

              {/* Inquire Icon Button */}
              <button
                onClick={() => setInquiryArtwork(focusedArtwork)}
                className="group/btn relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-all hover:scale-110 active:scale-95 shadow"
                title={lang === 'th' ? 'ติดต่อสอบถามข้อมูลผลงาน' : 'Send Inquiry'}
              >
                <Mail className="w-4 h-4 text-[#C5A880]" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded font-medium whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow">
                  {lang === 'th' ? 'สอบถาม' : 'Inquire'}
                </span>
              </button>

              {/* 8x Deep Zoom Icon Button (Highlighted Gold) */}
              <button
                onClick={() => setDetailModalArtwork(focusedArtwork)}
                className="group/btn relative h-10 px-4 rounded-full bg-gradient-to-r from-[#C5A880] via-[#E2CEB5] to-[#C5A880] hover:brightness-110 text-[#141210] flex items-center gap-1.5 font-bold text-xs shadow-[0_4px_16px_rgba(197,168,128,0.4)] transition-all hover:scale-105 active:scale-95"
                title={lang === 'th' ? 'ซูมภาพความละเอียดสูง 8x' : 'Deep Zoom 8x'}
              >
                <ZoomIn className="w-4 h-4 text-[#141210]" />
                <span>8x</span>
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded font-medium whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow">
                  {lang === 'th' ? 'ซูมละเอียด 8x' : 'Deep Zoom 8x'}
                </span>
              </button>

              {/* Resume Walk Icon Button */}
              <button
                onClick={handleResetCamera}
                className="group/btn relative w-10 h-10 rounded-full bg-[#2A241F] hover:bg-[#3D352E] text-neutral-300 hover:text-white flex items-center justify-center border border-white/10 transition-all hover:scale-110 active:scale-95 shadow"
                title={lang === 'th' ? 'กลับไปเดินต่อ (Esc)' : 'Resume Walking (Esc)'}
              >
                <RotateCcw className="w-4 h-4 text-neutral-300 group-hover/btn:text-white" />
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/90 text-white text-[10px] rounded font-medium whitespace-nowrap opacity-0 group-hover/btn:opacity-100 transition-opacity pointer-events-none border border-white/10 shadow">
                  {lang === 'th' ? 'เดินต่อ' : 'Walk'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interactive WASD Walk Controls HUD & Virtual D-Pad */}
      {!focusedArtwork && (
        <div className="absolute bottom-6 left-6 z-20 flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-black/80 backdrop-blur-md text-white/90 p-3 rounded-xl border border-white/15 shadow-2xl">
          {/* Virtual WASD D-Pad */}
          <div className="flex flex-col items-center gap-1">
            <button
              onMouseDown={() => handleVirtualKey('w', true)}
              onMouseUp={() => handleVirtualKey('w', false)}
              onMouseLeave={() => handleVirtualKey('w', false)}
              onTouchStart={() => handleVirtualKey('w', true)}
              onTouchEnd={() => handleVirtualKey('w', false)}
              className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-all shadow ${
                pressedKeysState['w'] || pressedKeysState['arrowup']
                  ? 'bg-[#C5A880] text-[#1A1918] scale-95 ring-2 ring-white/50'
                  : 'bg-white/15 hover:bg-white/25 text-white active:scale-95'
              }`}
              title="Walk Forward (W / ↑)"
            >
              W
            </button>
            <div className="flex items-center gap-1">
              <button
                onMouseDown={() => handleVirtualKey('a', true)}
                onMouseUp={() => handleVirtualKey('a', false)}
                onMouseLeave={() => handleVirtualKey('a', false)}
                onTouchStart={() => handleVirtualKey('a', true)}
                onTouchEnd={() => handleVirtualKey('a', false)}
                className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-all shadow ${
                  pressedKeysState['a'] || pressedKeysState['arrowleft']
                    ? 'bg-[#C5A880] text-[#1A1918] scale-95 ring-2 ring-white/50'
                    : 'bg-white/15 hover:bg-white/25 text-white active:scale-95'
                }`}
                title="Strafe Left (A / ←)"
              >
                A
              </button>
              <button
                onMouseDown={() => handleVirtualKey('s', true)}
                onMouseUp={() => handleVirtualKey('s', false)}
                onMouseLeave={() => handleVirtualKey('s', false)}
                onTouchStart={() => handleVirtualKey('s', true)}
                onTouchEnd={() => handleVirtualKey('s', false)}
                className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-all shadow ${
                  pressedKeysState['s'] || pressedKeysState['arrowdown']
                    ? 'bg-[#C5A880] text-[#1A1918] scale-95 ring-2 ring-white/50'
                    : 'bg-white/15 hover:bg-white/25 text-white active:scale-95'
                }`}
                title="Walk Backward (S / ↓)"
              >
                S
              </button>
              <button
                onMouseDown={() => handleVirtualKey('d', true)}
                onMouseUp={() => handleVirtualKey('d', false)}
                onMouseLeave={() => handleVirtualKey('d', false)}
                onTouchStart={() => handleVirtualKey('d', true)}
                onTouchEnd={() => handleVirtualKey('d', false)}
                className={`w-8 h-8 rounded-lg font-mono font-bold text-xs flex items-center justify-center transition-all shadow ${
                  pressedKeysState['d'] || pressedKeysState['arrowright']
                    ? 'bg-[#C5A880] text-[#1A1918] scale-95 ring-2 ring-white/50'
                    : 'bg-white/15 hover:bg-white/25 text-white active:scale-95'
                }`}
                title="Strafe Right (D / →)"
              >
                D
              </button>
            </div>
          </div>

          {/* Descriptive Help Text */}
          <div className="space-y-1 text-[11px] text-neutral-300 sm:border-l sm:border-white/15 sm:pl-3">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white">WASD / {lang === 'th' ? 'ปุ่มลูกศร' : 'Arrow Keys'}:</span>
              <span>{t.actions.wasdToWalk}</span>
            </div>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Move className="w-3 h-3 text-[#C5A880]" />
              <span>{t.actions.dragToLook}</span>
              <span className="text-neutral-500">•</span>
              <Eye className="w-3 h-3 text-[#C5A880]" />
              <span>{t.actions.clickToFocus}</span>
            </div>
          </div>
        </div>
      )}

      {/* Deep-Zoom Modal when Inspect is triggered */}
      <ArtworkLightbox
        artwork={detailModalArtwork}
        artworksList={artworks}
        isOpen={Boolean(detailModalArtwork)}
        onClose={() => setDetailModalArtwork(null)}
        onSelectArtwork={(art) => setDetailModalArtwork(art)}
        onOpenInquiry={(art) => {
          setDetailModalArtwork(null);
          setInquiryArtwork(art);
        }}
      />

      {/* Curatorial Inquiry Modal */}
      <ArtworkInquiryModal
        artwork={inquiryArtwork}
        isOpen={Boolean(inquiryArtwork)}
        onClose={() => setInquiryArtwork(null)}
      />
    </div>
  );
}
