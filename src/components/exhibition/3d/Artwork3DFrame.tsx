'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
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
// Dedicated High-Reliability Artwork Texture Plane
// -------------------------------------------------------------
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

    // Use HTML5 Image loader for 100% reliable canvas texture creation
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (!active) return;
      try {
        const tex = new THREE.Texture(img);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        setTexture(tex);
      } catch (err) {
        console.warn('Canvas texture creation error, using fallback:', err);
        const fallbackTex = generateArtworkFallbackTexture(
          title,
          artistName,
          width / height
        );
        if (active) setTexture(fallbackTex);
      }
    };

    img.onerror = () => {
      console.warn('Image proxy load failed for:', imageUrl, 'using fallback texture');
      if (!active) return;
      const fallbackTex = generateArtworkFallbackTexture(
        title,
        artistName,
        width / height
      );
      setTexture(fallbackTex);
    };

    img.src = targetUrl;

    return () => {
      active = false;
    };
  }, [imageUrl, title, artistName, width, height]);

  return (
    <mesh position={[0, 0, 0.022]}>
      <planeGeometry args={[width, height]} />
      {texture ? (
        <meshBasicMaterial map={texture} toneMapped={false} side={THREE.DoubleSide} />
      ) : (
        <meshBasicMaterial color="#E5DFD5" side={THREE.DoubleSide} />
      )}
    </mesh>
  );
}

// -------------------------------------------------------------
// 3D Artwork Frame & Lighting Component
// -------------------------------------------------------------
export function Artwork3DFrame({
  slot,
  artwork,
  isFocused = false,
  onInspect,
}: Artwork3DFrameProps) {
  const [hovered, setHovered] = useState(false);

  const groupRef = useRef<THREE.Group>(null);
  const spotLightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Group>(null);

  // Link SpotLight to target point at center of this frame
  useEffect(() => {
    if (spotLightRef.current && targetRef.current) {
      spotLightRef.current.target = targetRef.current;
    }
  }, []);

  // Real-world physical dimensions from artwork metadata
  const dimensions = useMemo(() => {
    const parsed = parseArtworkDimensions(artwork.dimensions);
    return { width: parsed.widthMeters, height: parsed.heightMeters };
  }, [artwork.dimensions]);

  const frameWidth = dimensions.width;
  const frameHeight = dimensions.height;

  // Contact shadow texture
  const contactShadowTex = useMemo(() => createContactShadowTexture(), []);

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
      ref={groupRef}
      position={[slot.position.x, slot.position.y, slot.position.z]}
      rotation={[0, slot.rotationY, 0]}
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
      {/* Target object for Spotlight in center of frame */}
      <group ref={targetRef} position={[0, 0, 0]} />

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
        <meshStandardMaterial
          color={hovered || isFocused ? '#2C2216' : '#1A1816'}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* 3. Passe-partout (Mount Mat) */}
      <mesh position={[0, 0, 0.016]}>
        <planeGeometry args={[frameWidth + 0.1, frameHeight + 0.1]} />
        <meshStandardMaterial color="#FAF8F5" roughness={0.9} />
      </mesh>

      {/* 4. Outer Gold / Dark Walnut Frame Moldings */}
      {/* Top Molding */}
      <mesh position={[0, frameHeight / 2 + 0.05, 0.02]} castShadow>
        <boxGeometry args={[frameWidth + 0.18, 0.06, 0.04]} />
        <meshStandardMaterial
          color={hovered || isFocused ? '#D4AF37' : '#2A2016'}
          roughness={hovered ? 0.25 : 0.4}
          metalness={hovered ? 0.6 : 0.2}
        />
      </mesh>
      {/* Bottom Molding */}
      <mesh position={[0, -(frameHeight / 2 + 0.05), 0.02]} castShadow>
        <boxGeometry args={[frameWidth + 0.18, 0.06, 0.04]} />
        <meshStandardMaterial
          color={hovered || isFocused ? '#D4AF37' : '#2A2016'}
          roughness={hovered ? 0.25 : 0.4}
          metalness={hovered ? 0.6 : 0.2}
        />
      </mesh>
      {/* Left Molding */}
      <mesh position={[-(frameWidth / 2 + 0.05), 0, 0.02]} castShadow>
        <boxGeometry args={[0.06, frameHeight + 0.06, 0.04]} />
        <meshStandardMaterial
          color={hovered || isFocused ? '#D4AF37' : '#2A2016'}
          roughness={hovered ? 0.25 : 0.4}
          metalness={hovered ? 0.6 : 0.2}
        />
      </mesh>
      {/* Right Molding */}
      <mesh position={[frameWidth / 2 + 0.05, 0, 0.02]} castShadow>
        <boxGeometry args={[0.06, frameHeight + 0.06, 0.04]} />
        <meshStandardMaterial
          color={hovered || isFocused ? '#D4AF37' : '#2A2016'}
          roughness={hovered ? 0.25 : 0.4}
          metalness={hovered ? 0.6 : 0.2}
        />
      </mesh>

      {/* 5. Actual Mounted Artwork Picture Plane */}
      <ArtworkPicturePlane
        imageUrl={artwork.imageUrl}
        title={artwork.title}
        artistName={artwork.artist?.name || 'Artist'}
        width={frameWidth}
        height={frameHeight}
      />

      {/* 6. Museum Placard / Exhibition Label Plate */}
      <group position={[0, -(frameHeight / 2 + 0.24), 0.01]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.2, 0.24, 0.015]} />
          <meshStandardMaterial color="#F4F2EB" roughness={0.3} metalness={0.05} />
        </mesh>

        <Text
          position={[0, 0.045, 0.01]}
          fontSize={0.048}
          color="#1E293B"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.1}
          textAlign="center"
        >
          {artwork.title || 'Untitled'}
        </Text>
        <Text
          position={[0, -0.04, 0.01]}
          fontSize={0.034}
          color="#64748B"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.1}
          textAlign="center"
        >
          {artwork.artist?.name || 'Artist'} • {artwork.yearCreated || '2026'}
        </Text>
      </group>

      {/* 7. Dedicated 35° Track Light Fixture Body */}
      <group position={[0, frameHeight / 2 + 1.2, 1.8]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.2, 16]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Only enable dynamic point light when focused or hovered to stay within WebGL uniform limits */}
        {(hovered || isFocused) && (
          <pointLight
            position={[0, 0, 0]}
            intensity={isFocused ? 12.0 : 6.0}
            color="#FFF7EC"
            distance={6}
          />
        )}
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
}
