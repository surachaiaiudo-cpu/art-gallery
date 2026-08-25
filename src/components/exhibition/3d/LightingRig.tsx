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

  const dirTarget = useRef(new THREE.Object3D());
  const spotTargets = useRef([
    new THREE.Object3D(),
    new THREE.Object3D(),
    new THREE.Object3D(),
    new THREE.Object3D(),
  ]);

  return (
    <group position={[0, 0, activeRoomZ]}>
      {/* 1. Soft Skylight Daylight Simulation */}
      <hemisphereLight
        args={[config.skyColor, config.groundColor, config.skyIntensity * 0.35]}
        position={[0, 20, 0]}
      />

      {/* 2. Soft Ambient Light Fill */}
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity * 0.3} />

      {/* 3. Central Ceiling Skylight Directional Downlight with Attached Target */}
      <primitive object={dirTarget.current} position={[0, 0, 0]} />
      <directionalLight
        position={[0, 15, 0]}
        target={dirTarget.current}
        intensity={0.4}
        color={config.skyColor}
      />

      {/* 4. Interactive Studio Light for Inspection Mode */}
      {isInspectActive && (
        <pointLight
          position={[inspectX, 3.0, inspectZ]}
          intensity={inspectLightIntensity * 2.0}
          color="#FFF8E8"
          distance={8}
        />
      )}
    </group>
  );
}
