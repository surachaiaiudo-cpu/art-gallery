import { Artwork } from '@/types/exhibition';
import { RoomShape, CalculatedArtworkSlot, RoomGeometryConfig } from './types';

export const ARTWORKS_PER_ROOM = 20;
export const ROOM_W = 14;
export const ROOM_H = 5;
export const ROOM_D = 32;
export const DOOR_W = 2.8;
export const DOOR_H = 3.2;
export const CEILING_HEIGHT = ROOM_H;
export const EYE_LEVEL_Y = 2.0;
export const ROOM_SPACING_Z = ROOM_D;

export interface RoomPathNode {
  roomIndex: number;
  center: { x: number; y: number; z: number };
  rotationY: number;
  forward: { x: number; z: number };
  doorways: {
    front: boolean;
    back: boolean;
  };
}

/**
 * Calculates world-space connected path for N rooms.
 * If N <= 3: Straight corridor along -Z.
 * If N > 3: 3-legged U-SHAPE (Leg 1: -Z -> Leg 2: +X -> Leg 3: +Z)
 * Connecting doorways match seamlessly at wall boundaries.
 */
export function buildRoomPath(numRooms: number): RoomPathNode[] {
  const count = Math.max(1, numRooms);
  const nodes: RoomPathNode[] = [];

  // 1. Straight Line (N <= 3)
  if (count <= 3) {
    for (let i = 0; i < count; i++) {
      nodes.push({
        roomIndex: i,
        center: { x: 0, y: 0, z: -i * ROOM_D },
        rotationY: 0,
        forward: { x: 0, z: -1 },
        doorways: {
          front: i > 0,
          back: i < count - 1,
        },
      });
    }
    return nodes;
  }

  // 2. U-SHAPE Layout (N > 3)
  // Leg 1: -Z, Leg 2: +X, Leg 3: +Z
  const legSize = Math.ceil(count / 3);
  let curCenter = { x: 0, y: 0, z: 0 };
  let curForward = { x: 0, z: -1 };
  let curRotY = 0;

  for (let i = 0; i < count; i++) {
    let nextForward = { x: 0, z: -1 };
    let nextRotY = 0;

    if (i < legSize) {
      // Leg 1: traveling in -Z
      nextForward = { x: 0, z: -1 };
      nextRotY = 0;
    } else if (i < 2 * legSize) {
      // Leg 2: turn +90 deg -> traveling in +X
      nextForward = { x: 1, z: 0 };
      nextRotY = -Math.PI / 2;
    } else {
      // Leg 3: turn another +90 deg -> traveling in +Z
      nextForward = { x: 0, z: 1 };
      nextRotY = Math.PI;
    }

    if (i === 0) {
      curCenter = { x: 0, y: 0, z: 0 };
      curForward = nextForward;
      curRotY = nextRotY;
    } else {
      // Calculate seamless connection pivot between room (i-1) and room (i)
      const prevForward = curForward;
      curForward = nextForward;
      curRotY = nextRotY;

      // Exit of prev room = prevCenter + prevForward * (ROOM_D / 2)
      // Entry of cur room = curCenter - curForward * (ROOM_D / 2)
      // Thus: curCenter = prevCenter + (prevForward + curForward) * (ROOM_D / 2)
      curCenter = {
        x: curCenter.x + (prevForward.x + curForward.x) * (ROOM_D / 2),
        y: 0,
        z: curCenter.z + (prevForward.z + curForward.z) * (ROOM_D / 2),
      };
    }

    nodes.push({
      roomIndex: i,
      center: { ...curCenter },
      rotationY: curRotY,
      forward: { ...curForward },
      doorways: {
        front: i > 0,
        back: i < count - 1,
      },
    });
  }

  return nodes;
}

function rotatePointY(x: number, z: number, angleRad: number) {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  return {
    x: x * cos + z * sin,
    z: -x * sin + z * cos,
  };
}

/**
 * Calculates slot positions and orientations for standard gallery hall with world-space transformation.
 */
export function calculateRoomSlots(
  roomShape: RoomShape,
  roomIndex: number,
  artworksForThisRoom: Artwork[] = [],
  roomCenter: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 },
  roomRotationY: number = 0
): CalculatedArtworkSlot[] {
  const slots: CalculatedArtworkSlot[] = [];
  const validArtworks = artworksForThisRoom.filter(Boolean);
  const totalArtCount = Math.min(ARTWORKS_PER_ROOM, Math.max(validArtworks.length, 1));
  const wallY = EYE_LEVEL_Y;

  for (let k = 0; k < totalArtCount; k++) {
    const art = validArtworks[k] || null;
    const globalIdx = roomIndex * ARTWORKS_PER_ROOM + k;
    const side = k % 2 === 0 ? -1 : 1; // -1: Left wall, 1: Right wall
    const row = Math.floor(k / 2);
    
    // Spaced along room depth
    const rowStep = (ROOM_D - 6.4) / (ARTWORKS_PER_ROOM / 2 - 1);
    const pzRel = ROOM_D / 2 - 3.2 - row * rowStep;

    const localX = side * (ROOM_W / 2 - 0.02);
    const localY = wallY;
    const localZ = pzRel;
    const localRotY = side === -1 ? Math.PI / 2 : -Math.PI / 2;

    // Transform local coords to world coords
    const rot = rotatePointY(localX, localZ, roomRotationY);
    const worldX = roomCenter.x + rot.x;
    const worldY = localY;
    const worldZ = roomCenter.z + rot.z;
    const worldRotY = localRotY + roomRotationY;

    const wallName = side === -1 ? `ผนังฝั่งซ้าย (Left Wall #${row + 1})` : `ผนังฝั่งขวา (Right Wall #${row + 1})`;

    slots.push({
      slotIndex: globalIdx,
      roomIndex: roomIndex,
      wallIndex: side === -1 ? 3 : 1,
      wallName: wallName,
      position: { x: localX, y: localY, z: localZ },
      worldPosition: { x: worldX, y: worldY, z: worldZ },
      rotationY: localRotY,
      worldRotationY: worldRotY,
      artwork: art,
    });
  }

  return slots;
}

/**
 * Calculates complete multi-room configurations in world coordinates.
 */
export function buildMultiRoomConfigs(
  artworks: Artwork[],
  roomShapes: RoomShape[] = []
): RoomGeometryConfig[] {
  const totalArtworks = Math.max(artworks.length, 1);
  const totalRooms = Math.max(1, Math.ceil(totalArtworks / ARTWORKS_PER_ROOM));
  const pathNodes = buildRoomPath(totalRooms);

  const configs: RoomGeometryConfig[] = [];

  for (let r = 0; r < totalRooms; r++) {
    const shape = roomShapes[r] || 'RECTANGLE';
    const startIdx = r * ARTWORKS_PER_ROOM;
    const endIdx = startIdx + ARTWORKS_PER_ROOM;
    const roomArtworks = artworks.slice(startIdx, endIdx);
    const node = pathNodes[r];

    const slots = calculateRoomSlots(
      shape,
      r,
      roomArtworks,
      node.center,
      node.rotationY
    );

    configs.push({
      shape,
      roomIndex: r,
      center: node.center,
      rotationY: node.rotationY,
      width: ROOM_W,
      depth: ROOM_D,
      height: ROOM_H,
      slots,
      doorways: node.doorways,
    });
  }

  return configs;
}
