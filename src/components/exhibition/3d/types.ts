import { Artwork } from '@/types/exhibition';

export type RoomShape = 'SQUARE' | 'RECTANGLE' | 'L_SHAPE' | 'CIRCULAR';

export type LightPreset = 'warm' | 'daylight' | 'dramatic' | 'cool';

export interface CalculatedArtworkSlot {
  slotIndex: number;
  roomIndex: number;
  wallIndex: number; // 0: North/Back, 1: East/Right, 2: South/Front, 3: West/Left (or radial index)
  wallName: string;
  position: { x: number; y: number; z: number };
  worldPosition?: { x: number; y: number; z: number };
  rotationY: number;
  worldRotationY?: number;
  artwork?: Artwork | null;
}

export interface RoomGeometryConfig {
  shape: RoomShape;
  roomIndex: number;
  // Index into the exhibition's own room sequence (excluding corner pavilions).
  // Used to look up roomShapes[]. Set to -1 for pavilions.
  exhibitionRoomIndex: number;
  isCornerPavilion?: boolean;
  pavilionTitle?: string;
  center: { x: number; y: number; z: number };
  rotationY: number;
  width: number;
  depth: number;
  height: number;
  slots: CalculatedArtworkSlot[];
  doorways?: {
    front: boolean;
    back: boolean;
    right?: boolean;
    left?: boolean;
  };
}

export interface LightPresetConfig {
  ambientColor: string;
  ambientIntensity: number;
  skyColor: string;
  groundColor: string;
  skyIntensity: number;
  spotlightColor: string;
  spotlightIntensity: number;
}
