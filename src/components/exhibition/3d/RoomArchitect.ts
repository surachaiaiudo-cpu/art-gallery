import { Artwork } from '@/types/exhibition';
import { RoomShape, CalculatedArtworkSlot, RoomGeometryConfig } from './types';

export const ARTWORKS_PER_ROOM = 20;
export const CEILING_HEIGHT = 8.5;
export const EYE_LEVEL_Y = 2.2;
export const ROOM_SPACING_Z = 34;

/**
 * Calculates slot positions and orientations for any given room shape
 * with STRICT mathematical enforcement of circular inward normals and balanced distribution.
 */
export function calculateRoomSlots(
  roomShape: RoomShape,
  roomIndex: number,
  artworksForThisRoom: Artwork[] = []
): CalculatedArtworkSlot[] {
  const roomCenterZ = roomIndex * -ROOM_SPACING_Z;
  const wallY = EYE_LEVEL_Y;
  const wallOffset = 0.08;
  const slots: CalculatedArtworkSlot[] = [];

  // Filter valid artworks
  const validArtworks = artworksForThisRoom.filter(Boolean);
  const totalArtCount = Math.max(validArtworks.length, 1);
  const isBalancedMode = totalArtCount < ARTWORKS_PER_ROOM;

  // -------------------------------------------------------------
  // 1. CIRCULAR ROTUNDA (Strict Inward Normal & Angular Geometry)
  // -------------------------------------------------------------
  if (roomShape === 'CIRCULAR') {
    const radius = 12 - wallOffset;
    const numSlots = isBalancedMode ? totalArtCount : ARTWORKS_PER_ROOM;

    for (let i = 0; i < numSlots; i++) {
      const art = validArtworks[i] || null;
      // Equiangular distribution clockwise around 360°
      const angle = i * ((Math.PI * 2) / numSlots);
      const posX = Math.sin(angle) * radius;
      const posZ = roomCenterZ - Math.cos(angle) * radius;

      // Mathematically guaranteed inward normal pointing to room center (0, roomCenterZ)
      const rotY = Math.atan2(-posX, -(posZ - roomCenterZ));

      const deg = Math.round((angle * 180) / Math.PI);
      const wallName = `ส่วนโค้งวงกลม ${deg}° (Rotunda Ring Slot #${i + 1})`;

      slots.push({
        slotIndex: roomIndex * ARTWORKS_PER_ROOM + i,
        roomIndex: roomIndex,
        wallIndex: Math.floor((angle / (Math.PI * 2)) * 4), // 4 quadrant index
        wallName: wallName,
        position: { x: posX, y: wallY, z: posZ },
        rotationY: rotY,
        artwork: art,
      });
    }

    return slots;
  }

  // -------------------------------------------------------------
  // 2. SQUARE PAVILION (22 x 22m - Balanced across 4 walls)
  // -------------------------------------------------------------
  if (roomShape === 'SQUARE') {
    const w = 22;
    const d = 22;
    const wallDefinitions = [
      { name: 'ผนังฝั่งทิศเหนือ (North Wall)', length: w, normal: 0, index: 0 },
      { name: 'ผนังฝั่งตะวันออก (East Wall)', length: d, normal: -Math.PI / 2, index: 1 },
      { name: 'ผนังฝั่งทิศใต้ (South Wall)', length: w, normal: Math.PI, index: 2 },
      { name: 'ผนังฝั่งตะวันตก (West Wall)', length: d, normal: Math.PI / 2, index: 3 },
    ];

    const wallCounts = [0, 0, 0, 0];
    const totalToPlace = isBalancedMode ? totalArtCount : ARTWORKS_PER_ROOM;

    for (let i = 0; i < totalToPlace; i++) {
      wallCounts[i % 4]++;
    }

    let placedCount = 0;
    wallDefinitions.forEach((wallDef, wallIdx) => {
      const k = wallCounts[wallIdx];
      for (let j = 0; j < k; j++) {
        const globalIdx = roomIndex * ARTWORKS_PER_ROOM + placedCount;
        const art = validArtworks[placedCount] || null;
        const t = (j + 1) / (k + 1);
        let posX = 0;
        let posZ = 0;

        if (wallIdx === 0) {
          // North
          posX = -w / 2 + t * w;
          posZ = roomCenterZ - d / 2 + wallOffset;
        } else if (wallIdx === 1) {
          // East
          posX = w / 2 - wallOffset;
          posZ = roomCenterZ - d / 2 + t * d;
        } else if (wallIdx === 2) {
          // South
          posX = w / 2 - t * w;
          posZ = roomCenterZ + d / 2 - wallOffset;
        } else {
          // West
          posX = -w / 2 + wallOffset;
          posZ = roomCenterZ + d / 2 - t * d;
        }

        slots.push({
          slotIndex: globalIdx,
          roomIndex: roomIndex,
          wallIndex: wallDef.index,
          wallName: wallDef.name,
          position: { x: posX, y: wallY, z: posZ },
          rotationY: wallDef.normal,
          artwork: art,
        });

        placedCount++;
      }
    });

    return slots;
  }

  // -------------------------------------------------------------
  // 3. RECTANGLE GALLERY (30 x 16m - Proportional Balanced Spacing)
  // -------------------------------------------------------------
  if (roomShape === 'RECTANGLE') {
    const w = 30;
    const d = 16;
    const totalToPlace = isBalancedMode ? totalArtCount : ARTWORKS_PER_ROOM;

    const weights = [30, 16, 30, 16];
    const totalWeight = 92;
    const wallCounts = [0, 0, 0, 0];

    let remaining = totalToPlace;
    for (let i = 0; i < 4; i++) {
      wallCounts[i] = Math.max(1, Math.round((weights[i] / totalWeight) * totalToPlace));
      remaining -= wallCounts[i];
    }
    let adjustIdx = 0;
    while (remaining > 0) {
      wallCounts[adjustIdx % 4]++;
      remaining--;
      adjustIdx++;
    }
    while (remaining < 0) {
      const maxIdx = wallCounts.indexOf(Math.max(...wallCounts));
      if (wallCounts[maxIdx] > 1) {
        wallCounts[maxIdx]--;
        remaining++;
      } else break;
    }

    let placedCount = 0;
    const wallDefs = [
      { name: 'ผนังฝั่งทิศเหนือ (North Wall)', length: w, normal: 0, index: 0 },
      { name: 'ผนังฝั่งตะวันออก (East Wall)', length: d, normal: -Math.PI / 2, index: 1 },
      { name: 'ผนังฝั่งทิศใต้ (South Wall)', length: w, normal: Math.PI, index: 2 },
      { name: 'ผนังฝั่งตะวันตก (West Wall)', length: d, normal: Math.PI / 2, index: 3 },
    ];

    wallDefs.forEach((wallDef, wallIdx) => {
      const k = wallCounts[wallIdx];
      for (let j = 0; j < k; j++) {
        const globalIdx = roomIndex * ARTWORKS_PER_ROOM + placedCount;
        const art = validArtworks[placedCount] || null;
        const t = (j + 1) / (k + 1);

        let posX = 0;
        let posZ = 0;

        if (wallIdx === 0) {
          posX = -w / 2 + t * w;
          posZ = roomCenterZ - d / 2 + wallOffset;
        } else if (wallIdx === 1) {
          posX = w / 2 - wallOffset;
          posZ = roomCenterZ - d / 2 + t * d;
        } else if (wallIdx === 2) {
          posX = w / 2 - t * w;
          posZ = roomCenterZ + d / 2 - wallOffset;
        } else {
          posX = -w / 2 + wallOffset;
          posZ = roomCenterZ + d / 2 - t * d;
        }

        slots.push({
          slotIndex: globalIdx,
          roomIndex: roomIndex,
          wallIndex: wallDef.index,
          wallName: wallDef.name,
          position: { x: posX, y: wallY, z: posZ },
          rotationY: wallDef.normal,
          artwork: art,
        });

        placedCount++;
      }
    });

    return slots;
  }

  // -------------------------------------------------------------
  // 4. L_SHAPE GALLERY (6 Segments - Balanced Distribution)
  // -------------------------------------------------------------
  const segDefs = [
    { name: 'ผนังฝั่งตะวันตกด้านนอก (Outer West)', length: 20, normal: Math.PI / 2, index: 0 },
    { name: 'ผนังฝั่งเหนือหลัก (North Main)', length: 14, normal: 0, index: 1 },
    { name: 'ผนังมุมหักใน (Inner Corner)', length: 12, normal: -Math.PI / 2, index: 2 },
    { name: 'ผนังปีกขวา (East Wing)', length: 10, normal: 0, index: 3 },
    { name: 'ผนังฝั่งตะวันออกสุด (Far East)', length: 8, normal: -Math.PI / 2, index: 4 },
    { name: 'ผนังฝั่งใต้เชื่อมต่อ (South Return)', length: 24, normal: Math.PI, index: 5 },
  ];

  const totalToPlace = isBalancedMode ? totalArtCount : ARTWORKS_PER_ROOM;
  const segCounts = [0, 0, 0, 0, 0, 0];
  for (let i = 0; i < totalToPlace; i++) {
    segCounts[i % 6]++;
  }

  let placedCount = 0;
  segDefs.forEach((seg, sIdx) => {
    const k = segCounts[sIdx];
    for (let j = 0; j < k; j++) {
      const globalIdx = roomIndex * ARTWORKS_PER_ROOM + placedCount;
      const art = validArtworks[placedCount] || null;
      const t = (j + 1) / (k + 1);

      let posX = 0;
      let posZ = 0;

      if (sIdx === 0) {
        posX = -12 + wallOffset;
        posZ = roomCenterZ + 10 - t * 20;
      } else if (sIdx === 1) {
        posX = -12 + t * 14;
        posZ = roomCenterZ - 10 + wallOffset;
      } else if (sIdx === 2) {
        posX = 2 - wallOffset;
        posZ = roomCenterZ - 10 + t * 12;
      } else if (sIdx === 3) {
        posX = 2 + t * 10;
        posZ = roomCenterZ + 2 + wallOffset;
      } else if (sIdx === 4) {
        posX = 12 - wallOffset;
        posZ = roomCenterZ + 2 + t * 8;
      } else {
        posX = 12 - t * 24;
        posZ = roomCenterZ + 10 - wallOffset;
      }

      slots.push({
        slotIndex: globalIdx,
        roomIndex: roomIndex,
        wallIndex: seg.index,
        wallName: seg.name,
        position: { x: posX, y: wallY, z: posZ },
        rotationY: seg.normal,
        artwork: art,
      });

      placedCount++;
    }
  });

  return slots;
}

/**
 * Calculates complete multi-room configurations
 */
export function buildMultiRoomConfigs(
  artworks: Artwork[],
  roomShapes: RoomShape[]
): RoomGeometryConfig[] {
  const totalArtworks = Math.max(artworks.length, 1);
  const totalRooms = Math.max(1, Math.ceil(totalArtworks / ARTWORKS_PER_ROOM));

  const configs: RoomGeometryConfig[] = [];

  for (let r = 0; r < totalRooms; r++) {
    const shape = roomShapes[r] || 'SQUARE';
    const startIdx = r * ARTWORKS_PER_ROOM;
    const endIdx = startIdx + ARTWORKS_PER_ROOM;
    const roomArtworks = artworks.slice(startIdx, endIdx);

    let width = 22;
    let depth = 22;
    if (shape === 'RECTANGLE') {
      width = 30;
      depth = 16;
    } else if (shape === 'L_SHAPE') {
      width = 24;
      depth = 20;
    } else if (shape === 'CIRCULAR') {
      width = 24;
      depth = 24;
    }

    const slots = calculateRoomSlots(shape, r, roomArtworks);

    configs.push({
      shape,
      roomIndex: r,
      center: { x: 0, y: 0, z: r * -ROOM_SPACING_Z },
      width,
      depth,
      height: CEILING_HEIGHT,
      slots,
    });
  }

  return configs;
}
