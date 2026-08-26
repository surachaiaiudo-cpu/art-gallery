'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { Text, Html } from '@react-three/drei';
import { Artwork } from '@/types/exhibition';
import { CalculatedArtworkSlot } from './types';
import {
  createContactShadowTexture,
  generateArtworkFallbackTexture,
} from './MaterialFactory';
import { parseArtworkDimensions } from '@/lib/utils';
import { Eye, Sun } from 'lucide-react';

interface Artwork3DFrameProps {
  slot: CalculatedArtworkSlot;
  artwork: Artwork;
  isFocused?: boolean;
  onInspect: (artwork: Artwork) => void;
}

// -------------------------------------------------------------
// Dedicated Zero-Flicker Canvas Placard Texture Generator
// -------------------------------------------------------------
function createPlacardTexture(title: string, artistName: string, year: number | string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Background Ivory / Alabaster Plate
  ctx.fillStyle = '#F8F6F0';
  ctx.fillRect(0, 0, 1024, 256);

  // Outer Border Trim
  ctx.strokeStyle = '#D5CBB9';
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 1004, 236);

  // Inner Gold Accent Line
  ctx.strokeStyle = '#8C6D3F';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(18, 18, 988, 220);

  // Title Typography
  ctx.fillStyle = '#1E1D1B';
  ctx.font = 'bold 50px "Sarabun", "Noto Sans Thai", "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const cleanTitle = title || 'Untitled';
  const displayTitle = cleanTitle.length > 32 ? cleanTitle.slice(0, 30) + '...' : cleanTitle;
  ctx.fillText(displayTitle, 512, 95);

  // Artist & Year Typography
  ctx.fillStyle = '#6E675F';
  ctx.font = '500 34px "Sarabun", "Noto Sans Thai", "Segoe UI", sans-serif';
  const subtitle = `${artistName || 'Artist'} • ${year || '2026'}`;
  const displaySub = subtitle.length > 42 ? subtitle.slice(0, 40) + '...' : subtitle;
  ctx.fillText(displaySub, 512, 175);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}const placardCache = new Map<string, THREE.CanvasTexture>();

function getPlacardTexture(title: string, artistName: string, year: number | string): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const key = `${title}__${artistName}__${year}`;
  if (placardCache.has(key)) {
    return placardCache.get(key)!;
  }
  const tex = createPlacardTexture(title, artistName, year);
  placardCache.set(key, tex);
  return tex;
}

let cachedContactShadowTex: THREE.CanvasTexture | null = null;
function getContactShadowTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  if (!cachedContactShadowTex) {
    cachedContactShadowTex = createContactShadowTexture();
  }
  return cachedContactShadowTex;
}

// -------------------------------------------------------------
// Global High-Speed Texture Cache (Instant 0ms Room Switching)
// -------------------------------------------------------------
const globalTextureCache = new Map<string, THREE.Texture>();

function ArtworkPicturePlane({
  imageUrl,
  title,
  artistName,
  width,
  height,
}: {
  imageUrl?: string | null;
  title: string;
  artistName: string;
  width: number;
  height: number;
}) {
  const { gl } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;

    if (!imageUrl) {
      const fallbackTex = generateArtworkFallbackTexture(
        title,
        artistName,
        width / height
      );
      if (active) setTexture(fallbackTex);
      return;
    }

    // Always route external URLs through local proxy to ensure CORS-safety in WebGL
    const targetUrl = imageUrl.startsWith('http')
      ? `/api/image-proxy?url=${encodeURIComponent(imageUrl)}`
      : imageUrl;

    // Instant memory cache hit
    if (globalTextureCache.has(targetUrl)) {
      const cached = globalTextureCache.get(targetUrl)!;
      if (active) setTexture(cached);
      return;
    }

    // Use HTML5 Image loader for 100% reliable canvas texture creation
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (!active) return;
      const tex = new THREE.Texture(img);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.needsUpdate = true;

      // Pre-warm to GPU VRAM immediately so walking into the room has 0ms GPU upload latency
      try {
        gl.initTexture(tex);
      } catch (e) {
        // Safe fallback
      }

      globalTextureCache.set(targetUrl, tex);
      setTexture(tex);
    };

    img.onerror = () => {
      if (!active) return;
      const fallback = generateArtworkFallbackTexture(
        title,
        artistName,
        width / height
      );
      if (fallback) {
        try {
          gl.initTexture(fallback);
        } catch (e) {}
        globalTextureCache.set(targetUrl, fallback);
        setTexture(fallback);
      }
    };

    img.src = targetUrl;

    return () => {
      active = false;
    };
  }, [imageUrl, title, artistName, width, height, gl]);

  if (!texture) {
    return (
      <mesh position={[0, 0, 0.048]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color="#1E1A16" />
      </mesh>
    );
  }

  return (
    <mesh position={[0, 0, 0.048]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}

const frameMatShared = {
  mountMat: new THREE.MeshStandardMaterial({ color: '#FAF8F5', roughness: 0.9 }),
  backingNormal: new THREE.MeshStandardMaterial({ color: '#1A1816', roughness: 0.4, metalness: 0.1 }),
  backingHovered: new THREE.MeshStandardMaterial({ color: '#2C2216', roughness: 0.4, metalness: 0.1 }),
  moldingNormal: new THREE.MeshStandardMaterial({ color: '#2A2016', roughness: 0.4, metalness: 0.2 }),
  moldingHovered: new THREE.MeshStandardMaterial({ color: '#D4AF37', roughness: 0.25, metalness: 0.6 }),
  brassBracket: new THREE.MeshStandardMaterial({ color: '#D4AF37', roughness: 0.25, metalness: 0.8 }),
  steelCable: new THREE.MeshStandardMaterial({ color: '#D1CCC0', roughness: 0.2, metalness: 0.9 }),
};

// -------------------------------------------------------------
// Interactive 3D Artwork Frame with Museum Track Spotlight & Placard
// -------------------------------------------------------------
export const Artwork3DFrame = React.memo(function Artwork3DFrame({
  slot,
  artwork,
  isFocused = false,
  onInspect,
}: Artwork3DFrameProps) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  // Real-world physical dimensions from artwork metadata
  const dimensions = useMemo(() => {
    const parsed = parseArtworkDimensions(artwork.dimensions);
    return { width: parsed.widthMeters, height: parsed.heightMeters };
  }, [artwork.dimensions]);

  const frameWidth = dimensions.width;
  const frameHeight = dimensions.height;

  // Cached Contact shadow texture
  const contactShadowTex = useMemo(() => getContactShadowTexture(), []);

  // Cached Placard Texture (generated once, 0ms overhead on room entry)
  const placardTexture = useMemo(() => {
    return getPlacardTexture(
      artwork.title,
      artwork.artist?.name || 'Artist',
      artwork.yearCreated || '2026'
    );
  }, [artwork.title, artwork.artist?.name, artwork.yearCreated]);

  // Placard Material with cached texture
  const placardMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      map: placardTexture || undefined,
      color: placardTexture ? '#FFFFFF' : '#F4F2EB',
      roughness: 0.4,
      metalness: 0.05,
    });
  }, [placardTexture]);

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

  const isHighlighted = hovered || isFocused;
  const backingMat = isHighlighted ? frameMatShared.backingHovered : frameMatShared.backingNormal;
  const moldingMat = isHighlighted ? frameMatShared.moldingHovered : frameMatShared.moldingNormal;

  return (
    <group
      ref={groupRef}
      position={[slot.position.x, slot.position.y, slot.position.z]}
      rotation={[0, slot.rotationY, 0]}
      userData={{ artwork, slot }}
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

      {/* 1. Contact Shadow Plane on Wall (Procedural AO) */}
      {contactShadowTex && (
        <mesh position={[0, 0, -0.015]} receiveShadow>
          <planeGeometry args={[frameWidth + 0.6, frameHeight + 0.6]} />
          <meshBasicMaterial
            map={contactShadowTex}
            transparent
            opacity={0.65}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 2. Frame Backing Board */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[frameWidth + 0.16, frameHeight + 0.16, 0.03]} />
        <primitive object={backingMat} attach="material" />
      </mesh>

      {/* 3. Passe-partout (Mount Mat) */}
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[frameWidth + 0.1, frameHeight + 0.1]} />
        <primitive object={frameMatShared.mountMat} attach="material" />
      </mesh>

      {/* 4. Outer Gold / Dark Walnut Frame Moldings */}
      {/* Top Molding */}
      <mesh position={[0, frameHeight / 2 + 0.05, 0.02]} castShadow>
        <boxGeometry args={[frameWidth + 0.18, 0.06, 0.04]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>
      {/* Bottom Molding */}
      <mesh position={[0, -(frameHeight / 2 + 0.05), 0.02]} castShadow>
        <boxGeometry args={[frameWidth + 0.18, 0.06, 0.04]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>
      {/* Left Molding */}
      <mesh position={[-(frameWidth / 2 + 0.05), 0, 0.02]} castShadow>
        <boxGeometry args={[0.06, frameHeight + 0.06, 0.04]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>
      {/* Right Molding */}
      <mesh position={[frameWidth / 2 + 0.05, 0, 0.02]} castShadow>
        <boxGeometry args={[0.06, frameHeight + 0.06, 0.04]} />
        <primitive object={moldingMat} attach="material" />
      </mesh>

      {/* 5. Actual Mounted Artwork Picture Plane */}
      <ArtworkPicturePlane
        imageUrl={artwork.imageUrl}
        title={artwork.title}
        artistName={artwork.artist?.name || 'Artist'}
        width={frameWidth}
        height={frameHeight}
      />

      {/* 6. Museum Placard / Exhibition Label Plate (Zero Z-Fighting Single Texture Mesh) */}
      <group position={[0, -(frameHeight / 2 + 0.22), 0.02]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.24, 0.02]} />
          <primitive object={placardMat} attach="material" />
        </mesh>
      </group>

      {/* 7. Realistic Gallery Suspension System (Stainless Steel Hanging Wires & Brass Brackets) */}
      <group position={[0, frameHeight / 2 + 0.02, 0.02]}>
        {/* Left Brass Mounting Bracket */}
        <mesh position={[-frameWidth * 0.32, 0.04, 0.01]} castShadow>
          <boxGeometry args={[0.05, 0.08, 0.03]} />
          <primitive object={frameMatShared.brassBracket} attach="material" />
        </mesh>
        {/* Left Stainless Steel Suspension Cable (Reaching up to ceiling) */}
        <mesh position={[-frameWidth * 0.32, 2.5, 0.01]}>
          <cylinderGeometry args={[0.005, 0.005, 5.0, 12]} />
          <primitive object={frameMatShared.steelCable} attach="material" />
        </mesh>

        {/* Right Brass Mounting Bracket */}
        <mesh position={[frameWidth * 0.32, 0.04, 0.01]} castShadow>
          <boxGeometry args={[0.05, 0.08, 0.03]} />
          <primitive object={frameMatShared.brassBracket} attach="material" />
        </mesh>
        {/* Right Stainless Steel Suspension Cable (Reaching up to ceiling) */}
        <mesh position={[frameWidth * 0.32, 2.5, 0.01]}>
          <cylinderGeometry args={[0.005, 0.005, 5.0, 12]} />
          <primitive object={frameMatShared.steelCable} attach="material" />
        </mesh>
      </group>

      {/* 8. Hover Floating Prompt */}
      {hovered && !isFocused && (
        <Html position={[0, frameHeight / 2 + 0.28, 0.1]} center distanceFactor={14}>
          <div className="px-3 py-1.5 bg-slate-900/90 text-white text-[11px] font-sans rounded-full shadow-xl border border-amber-400/40 whitespace-nowrap flex items-center gap-1.5 backdrop-blur animate-fade-in pointer-events-none">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium">คลิกเพื่อชมรายละเอียดภาพ</span>
          </div>
        </Html>
      )}
    </group>
  );
});
