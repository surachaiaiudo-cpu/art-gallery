import * as THREE from 'three';

/**
 * MaterialFactory: Creates procedural Canvas textures for Terrazzo floor,
 * plaster bump, Ambient Occlusion (AO) maps, and frame contact shadows.
 */

// 1. Procedural Terrazzo Tile Floor Texture
export function createTerrazzoFloorTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base terrazzo warm off-white background
  ctx.fillStyle = '#E5E1D8';
  ctx.fillRect(0, 0, size, size);

  // Draw tile grid lines (subtle joint seams)
  const tileSize = size / 4;
  ctx.strokeStyle = 'rgba(180, 175, 165, 0.4)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= size; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  for (let y = 0; y <= size; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }

  // Generate terrazzo stone specks/chips
  const speckColors = [
    'rgba(70, 65, 60, 0.35)',
    'rgba(140, 130, 118, 0.4)',
    'rgba(195, 185, 170, 0.6)',
    'rgba(215, 205, 190, 0.8)',
    'rgba(160, 120, 80, 0.25)', // slight warm ochre chip
  ];

  const random = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  let seed = 42;
  for (let i = 0; i < 1800; i++) {
    const px = random(seed++) * size;
    const py = random(seed++) * size;
    const radius = random(seed++) * 3.5 + 0.8;
    const color = speckColors[Math.floor(random(seed++) * speckColors.length)];

    ctx.fillStyle = color;
    ctx.beginPath();
    // Non-circular organic chip shapes
    ctx.arc(px, py, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// 2. Procedural Wall/Corner Ambient Occlusion Map (AO Map)
export function createPlasterWallAOMap(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Base white (no occlusion)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  // Vertical gradient (ceiling and baseboard corner shadows)
  const gradV = ctx.createLinearGradient(0, 0, 0, size);
  gradV.addColorStop(0, 'rgba(45, 45, 45, 0.6)');
  gradV.addColorStop(0.12, 'rgba(255, 255, 255, 1.0)');
  gradV.addColorStop(0.88, 'rgba(255, 255, 255, 1.0)');
  gradV.addColorStop(1.0, 'rgba(35, 35, 35, 0.7)');
  ctx.fillStyle = gradV;
  ctx.fillRect(0, 0, size, size);

  // Horizontal gradient (wall-to-wall corner seams)
  const gradH = ctx.createLinearGradient(0, 0, size, 0);
  gradH.addColorStop(0, 'rgba(45, 45, 45, 0.55)');
  gradH.addColorStop(0.1, 'rgba(255, 255, 255, 1.0)');
  gradH.addColorStop(0.9, 'rgba(255, 255, 255, 1.0)');
  gradH.addColorStop(1.0, 'rgba(45, 45, 45, 0.55)');
  ctx.fillStyle = gradH;
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

// 3. Contact Shadow Texture for 3D Artwork Frames
export function createContactShadowTexture(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const grad = ctx.createRadialGradient(size / 2, size / 2, 20, size / 2, size / 2, size / 2 - 10);
  grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
  grad.addColorStop(0.4, 'rgba(0, 0, 0, 0.22)');
  grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 4. Procedural Wall Micro-Bump Map
export function createPlasterBumpMap(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 24;
    const val = Math.min(255, Math.max(0, 128 + noise));
    data[i] = val;
    data[i + 1] = val;
    data[i + 2] = val;
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(16, 16);
  return texture;
}

// 5. Procedural Artwork Texture Fallback
export function generateArtworkFallbackTexture(
  title: string,
  artistName: string,
  aspectRatio: number = 1.2,
  colorA: string = '#2B3A4A',
  colorB: string = '#8A6D3B'
): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;

  const width = 512;
  const height = Math.round(512 / (aspectRatio || 1.2));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Rich gradient background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, colorA);
  grad.addColorStop(1, colorB);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle geometric grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, height * 0.65);
  ctx.lineTo(width, height * 0.35);
  ctx.stroke();

  // Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px Kanit, Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title || 'Art Piece', width / 2, height / 2 - 10);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = '14px Kanit, Inter, sans-serif';
  ctx.fillText(artistName || 'Artist', width / 2, height / 2 + 18);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
