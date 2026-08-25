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
 * Modular Circuit: Turns right 90 degrees every 3 rooms.
 * - Rooms 1-3: Heading North (-Z)
 * - Rooms 4-6: Heading East (+X)
 * - Rooms 7-9: Heading South (+Z)
 * - Rooms 10-12: Heading West (-X)
 * Connecting doorways match seamlessly at wall boundaries.
 */
export function buildRoomPath(count: number): Array<{
  roomIndex: number;
  center: { x: number; y: number; z: number };
  rotationY: number;
  forward: { x: number; z: number };
  doorways: { front: boolean; back: boolean };
}> {
  const nodes = [];
  const legDirections = [
    { forward: { x: 0, z: -1 }, rotY: 0 },              // Leg 0: North (-Z)
    { forward: { x: 1, z: 0 }, rotY: -Math.PI / 2 },    // Leg 1: East (+X)
    { forward: { x: 0, z: 1 }, rotY: Math.PI },          // Leg 2: South (+Z)
    { forward: { x: -1, z: 0 }, rotY: Math.PI / 2 },    // Leg 3: West (-X)
  ];

  let curCenter = { x: 0, y: 0, z: 0 };
  let curForward = legDirections[0].forward;
  let curRotY = legDirections[0].rotY;

  for (let i = 0; i < count; i++) {
    const legIdx = Math.floor(i / 3) % 4;
    const posInLeg = i % 3;
    const legInfo = legDirections[legIdx];

    if (i === 0) {
      curCenter = { x: 0, y: 0, z: 0 };
      curForward = legInfo.forward;
      curRotY = legInfo.rotY;
    } else if (posInLeg === 0) {
      // Start of a new leg: turn right 90 degrees!
      const prevForward = curForward;
      curForward = legInfo.forward;
      curRotY = legInfo.rotY;

      // Connect entrance of new room to exit of previous room
      curCenter = {
        x: curCenter.x + (prevForward.x + curForward.x) * (ROOM_D / 2),
        y: 0,
        z: curCenter.z + (prevForward.z + curForward.z) * (ROOM_D / 2),
      };
    } else {
      // Continue along the same straight leg
      curCenter = {
        x: curCenter.x + curForward.x * ROOM_D,
        y: 0,
        z: curCenter.z + curForward.z * ROOM_D,
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

export const CORNER_SIZE = 14; // Square transition pavilion 14m x 14m

/**
 * Calculates complete multi-room configurations in world coordinates with Corner Pavilions every 3 rooms.
 */
export function buildMultiRoomConfigs(
  artworks: Artwork[],
  roomShapes: RoomShape[] = []
): RoomGeometryConfig[] {
  const totalArtworks = Math.max(artworks.length, 1);
  const totalExhRooms = Math.max(1, Math.ceil(totalArtworks / ARTWORKS_PER_ROOM));

  const configs: RoomGeometryConfig[] = [];
  const legDirections = [
    { forward: { x: 0, z: -1 }, rotY: 0 },              // Leg 0: North (-Z)
    { forward: { x: 1, z: 0 }, rotY: -Math.PI / 2 },    // Leg 1: East (+X)
    { forward: { x: 0, z: 1 }, rotY: Math.PI },          // Leg 2: South (+Z)
    { forward: { x: -1, z: 0 }, rotY: Math.PI / 2 },    // Leg 3: West (-X)
  ];

  let curCenter = { x: 0, y: 0, z: 0 };
  let curForward = legDirections[0].forward;
  let curRotY = legDirections[0].rotY;
  let totalRoomIdx = 0;

  for (let exhIdx = 0; exhIdx < totalExhRooms; exhIdx++) {
    const legIdx = Math.floor(exhIdx / 3) % 4;
    const posInLeg = exhIdx % 3;
    const legInfo = legDirections[legIdx];

    // If starting a new leg (after 3 exhibition rooms), insert a Corner Transition Pavilion!
    if (exhIdx > 0 && posInLeg === 0) {
      const prevForward = curForward;
      const nextForward = legInfo.forward;
      const pavilionRotY = curRotY; // Pavilion aligns with previous leg's heading

      // Position pavilion directly at the exit of the previous room
      // Exit of prev room = curCenter + prevForward * (ROOM_D / 2)
      // Pavilion center = Exit of prev room + prevForward * (CORNER_SIZE / 2)
      const pavCenter = {
        x: curCenter.x + prevForward.x * (ROOM_D / 2 + CORNER_SIZE / 2),
        y: 0,
        z: curCenter.z + prevForward.z * (ROOM_D / 2 + CORNER_SIZE / 2),
      };

      const cornerLetter = String.fromCharCode(65 + totalRoomIdx);
      configs.push({
        shape: 'SQUARE',
        roomIndex: totalRoomIdx,
        isCornerPavilion: true,
        pavilionTitle: `โถงพักชมประติมากรรมมุมอาคาร (Corner Pavilion ${cornerLetter})`,
        center: pavCenter,
        rotationY: pavilionRotY,
        width: CORNER_SIZE,
        depth: CORNER_SIZE,
        height: ROOM_H,
        slots: [],
        doorways: {
          front: true, // Entrance from previous room (Front wall)
          back: false,
          right: true, // Exit to next room (Right wall)
          left: false,
        },
      });

      totalRoomIdx++;

      // Now set current position and direction for the new leg
      curForward = nextForward;
      curRotY = legInfo.rotY;

      // New room's entrance meets the Pavilion's Right Door!
      // Right door of Pavilion in world space = pavCenter + rightVector * (CORNER_SIZE / 2)
      // where rightVector in world space = nextForward!
      // Center of new room = Right door of Pavilion + nextForward * (ROOM_D / 2)
      curCenter = {
        x: pavCenter.x + nextForward.x * (CORNER_SIZE / 2 + ROOM_D / 2),
        y: 0,
        z: pavCenter.z + nextForward.z * (CORNER_SIZE / 2 + ROOM_D / 2),
      };
    } else if (exhIdx > 0) {
      // Continue along the same straight leg
      curCenter = {
        x: curCenter.x + curForward.x * ROOM_D,
        y: 0,
        z: curCenter.z + curForward.z * ROOM_D,
      };
    }

    // Exhibition Room
    const shape = roomShapes[exhIdx] || 'RECTANGLE';
    const startIdx = exhIdx * ARTWORKS_PER_ROOM;
    const endIdx = startIdx + ARTWORKS_PER_ROOM;
    const roomArtworks = artworks.slice(startIdx, endIdx);

    const slots = calculateRoomSlots(
      shape,
      totalRoomIdx,
      roomArtworks,
      curCenter,
      curRotY
    );

    const isLastExhRoom = exhIdx === totalExhRooms - 1;
    const needsBackDoor = !isLastExhRoom; // Connect to next room or next corner pavilion

    configs.push({
      shape,
      roomIndex: totalRoomIdx,
      isCornerPavilion: false,
      center: { ...curCenter },
      rotationY: curRotY,
      width: ROOM_W,
      depth: ROOM_D,
      height: ROOM_H,
      slots,
      doorways: {
        front: totalRoomIdx > 0,
        back: needsBackDoor,
      },
    });

    totalRoomIdx++;
  }

  return configs;
}
