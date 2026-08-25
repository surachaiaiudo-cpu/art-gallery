export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'curator' | 'artist';
  country?: string | null;
  flagEmoji?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  socialLinks?: string | null;
  createdAt?: string | null;
}

export interface WallPosition {
  x: number;
  y: number;
  z: number;
  rotationY: number;
  wallIndex: number;
  scale?: number;
  frameStyle?: 'gold' | 'black' | 'walnut' | 'minimal';
}

export interface Artwork {
  id: string;
  artistId: string;
  title: string;
  description?: string | null;
  concept?: string | null;
  yearCreated?: number | null;
  medium?: string | null;
  dimensions?: string | null;
  cloudinaryPublicId: string;
  imageUrl: string;
  model3dUrl?: string | null;
  price?: number | null;
  status: 'available' | 'reserved' | 'sold' | 'not_for_sale';
  createdAt?: string | null;
  artist?: User | null;
  displayOrder?: number;
  wallPosition?: WallPosition | null;
}

export interface PeerReviewer {
  id?: string;
  name: string;
  academicTitle?: string;
  institution?: string;
  currentPosition?: string;  // การทำงาน / ตำแหน่งงานในปัจจุบัน
  country?: string;
  avatarUrl?: string;
  role?: string;
}

export interface ExhibitionThemeConfig {
  wallTexture?: string;
  wallColor?: string;
  floorColor?: string;
  ambientColor?: string;
  spotlightIntensity?: number;
  ambientAudioUrl?: string;
  roomSize?: 'small' | 'medium' | 'large';
  enable3D?: boolean;
  catalogFooterText?: string;
  catalogPlateFooterText?: string;
  footerGraphicType?: 'wave_gold' | 'wave_mono' | 'line_gold' | 'custom_image' | 'none';
  customFooterImageUrl?: string;
  peerReviewers?: PeerReviewer[];
}

export function getCatalogFooterText(exhibition?: Exhibition | null): string {
  if (!exhibition) return 'International Art Festival and Art Exhibition in Thailand • ARTVARA Online Gallery';
  if (exhibition.themeConfig) {
    try {
      const parsed = JSON.parse(exhibition.themeConfig);
      if (parsed.catalogFooterText && parsed.catalogFooterText.trim()) {
        return parsed.catalogFooterText.trim();
      }
    } catch {}
  }
  return 'International Art Festival and Art Exhibition in Thailand • ARTVARA Online Gallery';
}

export function getCatalogPlateFooterText(exhibition?: Exhibition | null): string {
  if (!exhibition) return '';
  if (exhibition.themeConfig) {
    try {
      const parsed = JSON.parse(exhibition.themeConfig);
      if (parsed.catalogPlateFooterText && parsed.catalogPlateFooterText.trim()) {
        return parsed.catalogPlateFooterText.trim();
      }
    } catch {}
  }
  return '';
}

export function getExhibitionPeerReviewers(exhibition?: Exhibition | null): PeerReviewer[] {
  if (!exhibition || !exhibition.themeConfig) return [];
  try {
    const parsed = JSON.parse(exhibition.themeConfig);
    if (Array.isArray(parsed.peerReviewers) && parsed.peerReviewers.length > 0) {
      return parsed.peerReviewers;
    }
  } catch {}
  return [];
}

export interface Exhibition {
  id: string;
  title: string;
  slug: string;
  curatorNote?: string | null;
  bannerUrl?: string | null;
  catalogPdfUrl?: string | null;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'archived';
  themeConfig?: string | null;
  createdAt?: string | null;
  artworks?: Artwork[];
  curator?: User | null;
  artists?: User[];
}

export interface Inquiry {
  id: string;
  artworkId: string;
  visitorName: string;
  visitorEmail: string;
  message?: string | null;
  status: 'pending' | 'contacted' | 'completed';
  createdAt?: string | null;
  artworkTitle?: string;
}

export function is3DEnabled(exhibition?: Exhibition | null): boolean {
  if (!exhibition) return true;
  if (!exhibition.themeConfig) return true;
  try {
    const parsed =
      typeof exhibition.themeConfig === 'string'
        ? JSON.parse(exhibition.themeConfig)
        : exhibition.themeConfig;
    if (typeof parsed?.enable3D === 'boolean') {
      return parsed.enable3D;
    }
  } catch {}
  return true;
}
