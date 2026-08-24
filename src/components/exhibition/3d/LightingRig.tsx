'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { LightPreset, LightPresetConfig } from './types';

export const LIGHT_PRESETS: Record<LightPreset, LightPresetConfig> = {
  warm: {
    ambientColor: '#FFF2DC',
    ambientIntensity: 0.75,
    skyColor: '#FFF8EE',
    groundColor: '#D9C6B0',
    skyIntensity: 0.65,
    spotlightColor: '#FFF4E2',
    spotlightIntensity: 2.8,
  },
  daylight: {
    ambientColor: '#F5F5F0',
    ambientIntensity: 0.85,
    skyColor: '#FFFFFF',
    groundColor: '#D5D2C8',
    skyIntensity: 0.8,
    spotlightColor: '#FFFFFF',
    spotlightIntensity: 2.5,
  },
  dramatic: {
    ambientColor: '#B0A89C',
    ambientIntensity: 0.45,
    skyColor: '#DDD6CC',
    groundColor: '#8C8478',
    skyIntensity: 0.4,
    spotlightColor: '#FFF0D0',
    spotlightIntensity: 4.2,
  },
  cool: {
    ambientColor: '#E2E8F0',
    ambientIntensity: 0.8,
    skyColor: '#F0F5FF',
    groundColor: '#CBD5E1',
    skyIntensity: 0.75,
    spotlightColor: '#F8FAFC',
    spotlightIntensity: 2.4,
  },
};

interface LightingRigProps {
  preset?: LightPreset;
  activeRoomZ?: number;
  inspectLightAngle?: number; // In degrees, -90 to +90
  inspectLightIntensity?: number;
  isInspectActive?: boolean;
}

export function LightingRig({
  preset = 'warm',
  activeRoomZ = 0,
  inspectLightAngle = 35,
  inspectLightIntensity = 3.5,
  isInspectActive = false,
}: LightingRigProps) {
  const config = LIGHT_PRESETS[preset] || LIGHT_PRESETS.warm;

  // Convert inspect angle to radian offset
  const rad = (inspectLightAngle * Math.PI) / 180;
  const inspectX = Math.sin(rad) * 2.5;
  const inspectZ = Math.cos(rad) * 2.5;

  return (
    <group>
      {/* 1. Skylight Natural Daylight Simulation (Hemisphere Light) */}
      <hemisphereLight
        args={[config.skyColor, config.groundColor, config.skyIntensity]}
        position={[0, 20, activeRoomZ]}
      />

      {/* 2. Soft Ambient Light Fill */}
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity} />

      {/* 3. Central Ceiling Skylight Directional Downlight */}
      <directionalLight
        position={[0, 15, activeRoomZ]}
        intensity={0.6}
        color={config.skyColor}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />

      {/* 4. Ceiling Spot Track Lights Array around Room */}
      <spotLight
        position={[-6, 7.5, activeRoomZ - 6]}
        target-position={[-8, 2.2, activeRoomZ - 8]}
        intensity={config.spotlightIntensity}
        angle={0.7}
        penumbra={0.8}
        color={config.spotlightColor}
        castShadow
      />
      <spotLight
        position={[6, 7.5, activeRoomZ - 6]}
        target-position={[8, 2.2, activeRoomZ - 8]}
        intensity={config.spotlightIntensity}
        angle={0.7}
        penumbra={0.8}
        color={config.spotlightColor}
        castShadow
      />
      <spotLight
        position={[-6, 7.5, activeRoomZ + 6]}
        target-position={[-8, 2.2, activeRoomZ + 8]}
        intensity={config.spotlightIntensity}
        angle={0.7}
        penumbra={0.8}
        color={config.spotlightColor}
        castShadow
      />
      <spotLight
        position={[6, 7.5, activeRoomZ + 6]}
        target-position={[8, 2.2, activeRoomZ + 8]}
        intensity={config.spotlightIntensity}
        angle={0.7}
        penumbra={0.8}
        color={config.spotlightColor}
        castShadow
      />

      {/* 5. Interactive Studio Light for Inspection Mode */}
      {isInspectActive && (
        <spotLight
          position={[inspectX, 3.5, activeRoomZ + inspectZ]}
          intensity={inspectLightIntensity}
          angle={0.65}
          penumbra={0.85}
          color="#FFF8E8"
          castShadow
        />
      )}
    </group>
  );
}
