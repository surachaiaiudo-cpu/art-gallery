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

export interface ExhibitionThemeConfig {
  wallTexture?: string;
  wallColor?: string;
  floorColor?: string;
  ambientColor?: string;
  spotlightIntensity?: number;
  ambientAudioUrl?: string;
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
