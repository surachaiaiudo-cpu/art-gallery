import { Exhibition, Artwork, User } from './exhibition';

export type CatalogPaperSize = 'a4_portrait' | 'a4_landscape' | 'square_10x10' | 'square_8x8' | 'custom';

export type BlockElementType =
  | 'artwork_image'
  | 'artist_photo'
  | 'country_flag'
  | 'artwork_title'
  | 'artist_name'
  | 'artist_email'
  | 'medium'
  | 'dimensions'
  | 'year_created'
  | 'price'
  | 'concept'
  | 'qr_code'
  | 'page_number'
  | 'custom_text'
  | 'custom_box'
  | 'divider_line'
  | 'footer_graphic';

export interface CMYKColor {
  c: number; // 0 - 100
  m: number; // 0 - 100
  y: number; // 0 - 100
  k: number; // 0 - 100
}

export function cmykToRgb(c: number, m: number, y: number, k: number): { r: number; g: number; b: number } {
  const cNorm = Math.min(100, Math.max(0, c)) / 100;
  const mNorm = Math.min(100, Math.max(0, m)) / 100;
  const yNorm = Math.min(100, Math.max(0, y)) / 100;
  const kNorm = Math.min(100, Math.max(0, k)) / 100;

  const r = Math.round(255 * (1 - cNorm) * (1 - kNorm));
  const g = Math.round(255 * (1 - mNorm) * (1 - kNorm));
  const b = Math.round(255 * (1 - yNorm) * (1 - kNorm));
  return { r, g, b };
}

export function cmykToHex(c: number, m: number, y: number, k: number): string {
  const { r, g, b } = cmykToRgb(c, m, y, k);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function hexToCmyk(hex: string): CMYKColor {
  if (!hex || typeof hex !== 'string') return { c: 0, m: 0, y: 0, k: 100 };
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((char) => char + char).join('');
  }
  const r = (parseInt(cleanHex.substring(0, 2), 16) || 0) / 255;
  const g = (parseInt(cleanHex.substring(2, 4), 16) || 0) / 255;
  const b = (parseInt(cleanHex.substring(4, 6), 16) || 0) / 255;

  const k = 1 - Math.max(r, g, b);
  if (k >= 0.999) {
    return { c: 0, m: 0, y: 0, k: 100 };
  }
  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  const kPercent = Math.round(k * 100);
  return {
    c: Math.max(0, Math.min(100, c)),
    m: Math.max(0, Math.min(100, m)),
    y: Math.max(0, Math.min(100, y)),
    k: Math.max(0, Math.min(100, kPercent)),
  };
}

export const PRINT_CMYK_PALETTE: { label: string; c: number; m: number; y: number; k: number; hex: string }[] = [
  { label: 'แดงเลือดหมูเพาะช่าง (Crimson)', c: 15, m: 100, y: 90, k: 45, hex: '#8B1B1B' },
  { label: 'ทองเฮอริเทจ (Museum Gold)', c: 15, m: 30, y: 60, k: 20, hex: '#C5A880' },
  { label: 'ทองอำพันหอศิลป์ (Amber Accent)', c: 20, m: 40, y: 80, k: 25, hex: '#A47D4C' },
  { label: 'ดำหอศิลป์ (Museum Dark)', c: 60, m: 50, y: 50, k: 90, hex: '#141413' },
  { label: 'ชาร์โคลข้อความ (Text Dark)', c: 0, m: 0, y: 0, k: 90, hex: '#1F1C17' },
  { label: 'พื้นครีมหอศิลป์ (Warm Gallery)', c: 2, m: 3, y: 5, k: 0, hex: '#F5F4F0' },
  { label: 'ขาวกระดาษ (Pure White)', c: 0, m: 0, y: 0, k: 0, hex: '#FFFFFF' },
  { label: 'เทากลางคำบรรยาย (Muted Gray)', c: 0, m: 0, y: 0, k: 60, hex: '#737067' },
  { label: 'เทาเส้นแบ่ง (Gallery Border)', c: 0, m: 0, y: 0, k: 20, hex: '#E2DFD7' },
  { label: 'ครามสยาม (Royal Indigo)', c: 100, m: 80, y: 20, k: 30, hex: '#1A2E40' },
  { label: 'เขียวพงไพร (Forest Green)', c: 80, m: 30, y: 90, k: 25, hex: '#2D5A3F' },
  { label: 'ส้มดินเผา (Terracotta)', c: 10, m: 75, y: 90, k: 10, hex: '#C85227' },
];

export interface BlockStyle {
  fontFamily?: 'Maitree' | 'Sarabun' | 'Cinzel' | 'Inter' | 'Prompt' | 'serif' | 'sans-serif';
  fontSizePt?: number;
  fontWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold' | 'black';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  color?: string; // Hex representation
  cmyk?: CMYKColor; // CMYK print accurate values
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: string;
  textTransform?: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  
  // Image & Box
  objectFit?: 'contain' | 'cover' | 'fill';
  borderRadius?: number; // in pixels (all corners)
  borderTopLeftRadius?: number; // in pixels
  borderTopRightRadius?: number; // in pixels
  borderBottomRightRadius?: number; // in pixels
  borderBottomLeftRadius?: number; // in pixels
  borderWidth?: number; // in pixels
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'none';
  backgroundColor?: string;
  boxShadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  opacity?: number;
  imageUrl?: string;
  footerEffect?: 'solid' | 'gradient_fade';
  footerFadeDirection?: 'to-top' | 'to-bottom' | 'radial';

  // Text Prefix / Suffix
  prefixText?: string;
  suffixText?: string;
  hideIfEmpty?: boolean;
}

export interface CatalogBlockElement {
  id: string;
  type: BlockElementType;
  label: string;
  xInches: number;
  yInches: number;
  widthInches: number;
  heightInches: number;
  zIndex: number;
  style: BlockStyle;
  customContent?: string; // For custom_text or custom_box
}

export interface CatalogTemplateConfig {
  id: string;
  name: string;
  description?: string;
  paperSize: CatalogPaperSize;
  pageWidthInches: number;
  pageHeightInches: number;
  bleedInches?: number; // Bleed margin for print (default 0 or 0.125")
  gridSizeInches: number; // default 0.25 (1/4 inch)
  snapToGrid: boolean;
  backgroundColor: string;
  paddingInches: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  blocks: CatalogBlockElement[];
  updatedAt?: string;
}

// =========================================================================
// 📐 PRESET TEMPLATES
// =========================================================================

// Preset 1: Square 8x8 Inches - Modern 2-Column (Artwork 2/3, Artist & Info 1/3)
export const PRESET_SQUARE_8X8_MODERN: CatalogTemplateConfig = {
  id: 'preset-square-8x8-modern',
  name: 'Square 8x8" Modern 2-Column',
  paperSize: 'square_8x8',
  pageWidthInches: 8.0,
  pageHeightInches: 8.0,
  gridSizeInches: 0.25,
  snapToGrid: true,
  backgroundColor: '#FFFFFF',
  paddingInches: { top: 0.75, bottom: 0.25, left: 0.5, right: 0.25 },
  blocks: [
    {
      id: 'blk-artwork-img',
      type: 'artwork_image',
      label: 'ภาพผลงาน',
      xInches: 0.5,
      yInches: 0.75,
      widthInches: 4.75,
      heightInches: 6.75,
      zIndex: 1,
      style: {
        objectFit: 'contain',
        borderRadius: 0,
        boxShadow: 'none',
      },
    },
    {
      id: 'blk-flag',
      type: 'country_flag',
      label: 'ธงชาติ',
      xInches: 6.875,
      yInches: 0.85,
      widthInches: 0.59,
      heightInches: 0.3937,
      zIndex: 2,
      style: {
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#D0D0D0',
        objectFit: 'cover',
      },
    },
    {
      id: 'blk-artist-photo',
      type: 'artist_photo',
      label: 'ภาพถ่ายศิลปิน',
      xInches: 6.125,
      yInches: 1.375,
      widthInches: 1.5,
      heightInches: 1.5,
      zIndex: 2,
      style: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDDDDD',
        objectFit: 'cover',
        boxShadow: 'sm',
      },
    },
    {
      id: 'blk-artist-name',
      type: 'artist_name',
      label: 'ชื่อศิลปิน',
      xInches: 5.375,
      yInches: 3.5,
      widthInches: 2.375,
      heightInches: 0.5,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 13,
        fontWeight: 'bold',
        color: '#1A1918',
        textAlign: 'right',
      },
    },
    {
      id: 'blk-artwork-title',
      type: 'artwork_title',
      label: 'ชื่องานศิลปะ',
      xInches: 5.375,
      yInches: 4.125,
      widthInches: 2.375,
      heightInches: 0.5,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 12,
        fontWeight: 'semibold',
        fontStyle: 'italic',
        color: '#8B1B1B',
        textAlign: 'right',
      },
    },
    {
      id: 'blk-medium',
      type: 'medium',
      label: 'เทคนิค / วัสดุ',
      xInches: 5.375,
      yInches: 4.75,
      widthInches: 2.375,
      heightInches: 0.375,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 10,
        fontWeight: 'normal',
        color: '#444444',
        textAlign: 'right',
        prefixText: '',
      },
    },
    {
      id: 'blk-dimensions',
      type: 'dimensions',
      label: 'ขนาดผลงาน',
      xInches: 5.375,
      yInches: 5.125,
      widthInches: 2.375,
      heightInches: 0.375,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 10,
        fontWeight: 'normal',
        color: '#666666',
        textAlign: 'right',
      },
    },
    {
      id: 'blk-concept',
      type: 'concept',
      label: 'แนวคิดผลงาน',
      xInches: 5.375,
      yInches: 5.625,
      widthInches: 2.375,
      heightInches: 1.875,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 8.5,
        fontWeight: 'normal',
        color: '#555555',
        textAlign: 'right',
        lineHeight: 1.4,
      },
    },
  ],
};

// Preset 2: Square 10x10 Inches - Grand Centerpiece (Artwork Center Large + Bottom Card)
export const PRESET_SQUARE_10X10_GRAND: CatalogTemplateConfig = {
  id: 'preset-square-10x10-grand',
  name: 'Square 10x10" Grand Centerpiece',
  paperSize: 'square_10x10',
  pageWidthInches: 10.0,
  pageHeightInches: 10.0,
  gridSizeInches: 0.25,
  snapToGrid: true,
  backgroundColor: '#FFFFFF',
  paddingInches: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
  blocks: [
    {
      id: 'blk-artwork-img',
      type: 'artwork_image',
      label: 'ภาพผลงาน',
      xInches: 0.75,
      yInches: 0.75,
      widthInches: 8.5,
      heightInches: 6.25,
      zIndex: 1,
      style: {
        objectFit: 'contain',
        borderRadius: 4,
        boxShadow: 'md',
      },
    },
    {
      id: 'blk-artist-photo',
      type: 'artist_photo',
      label: 'ภาพถ่ายศิลปิน',
      xInches: 0.75,
      yInches: 7.25,
      widthInches: 1.5,
      heightInches: 1.5,
      zIndex: 2,
      style: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E2DC',
        objectFit: 'cover',
        boxShadow: 'sm',
      },
    },
    {
      id: 'blk-artwork-title',
      type: 'artwork_title',
      label: 'ชื่องานศิลปะ',
      xInches: 2.75,
      yInches: 7.25,
      widthInches: 4.75,
      heightInches: 0.5,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 16,
        fontWeight: 'bold',
        color: '#8B1B1B',
        textAlign: 'left',
      },
    },
    {
      id: 'blk-artist-name',
      type: 'artist_name',
      label: 'ชื่อศิลปิน',
      xInches: 2.75,
      yInches: 7.75,
      widthInches: 4.75,
      heightInches: 0.375,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 13,
        fontWeight: 'semibold',
        color: '#1A1918',
        textAlign: 'left',
      },
    },
    {
      id: 'blk-medium',
      type: 'medium',
      label: 'เทคนิค / วัสดุ',
      xInches: 2.75,
      yInches: 8.25,
      widthInches: 4.75,
      heightInches: 0.375,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 10,
        fontWeight: 'normal',
        color: '#5A554A',
        textAlign: 'left',
        prefixText: 'เทคนิค: ',
      },
    },
    {
      id: 'blk-dimensions',
      type: 'dimensions',
      label: 'ขนาดผลงาน',
      xInches: 2.75,
      yInches: 8.625,
      widthInches: 4.75,
      heightInches: 0.375,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 10,
        fontWeight: 'normal',
        color: '#777777',
        textAlign: 'left',
        prefixText: 'ขนาด: ',
      },
    },
    {
      id: 'blk-qr-code',
      type: 'qr_code',
      label: 'QR Code 3D Virtual Gallery',
      xInches: 7.75,
      yInches: 7.25,
      widthInches: 1.5,
      heightInches: 1.5,
      zIndex: 2,
      style: {
        borderWidth: 1,
        borderColor: '#E0DDD5',
        borderRadius: 4,
      },
    },
  ],
};

// Preset 3: A4 Portrait - Poh-Chang Heritage Classic
export const PRESET_A4_PORTRAIT_CLASSIC: CatalogTemplateConfig = {
  id: 'preset-a4-portrait-classic',
  name: 'A4 Portrait Poh-Chang Heritage',
  paperSize: 'a4_portrait',
  pageWidthInches: 8.27,
  pageHeightInches: 11.69,
  gridSizeInches: 0.25,
  snapToGrid: true,
  backgroundColor: '#FFFFFF',
  paddingInches: { top: 0.75, bottom: 0.75, left: 0.75, right: 0.75 },
  blocks: [
    {
      id: 'blk-artwork-img',
      type: 'artwork_image',
      label: 'ภาพผลงาน',
      xInches: 0.75,
      yInches: 0.75,
      widthInches: 6.77,
      heightInches: 6.5,
      zIndex: 1,
      style: {
        objectFit: 'contain',
        borderRadius: 0,
        boxShadow: 'none',
      },
    },
    {
      id: 'blk-artist-photo',
      type: 'artist_photo',
      label: 'ภาพถ่ายศิลปิน',
      xInches: 0.75,
      yInches: 7.5,
      widthInches: 1.5,
      heightInches: 1.5,
      zIndex: 2,
      style: {
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E2DC',
        objectFit: 'cover',
        boxShadow: 'sm',
      },
    },
    {
      id: 'blk-flag',
      type: 'country_flag',
      label: 'ธงชาติ',
      xInches: 2.75,
      yInches: 7.5,
      widthInches: 0.59,
      heightInches: 0.3937,
      zIndex: 2,
      style: {
        borderRadius: 2,
        borderWidth: 1,
        borderColor: '#DDD',
        objectFit: 'cover',
      },
    },
    {
      id: 'blk-artist-name',
      type: 'artist_name',
      label: 'ชื่อศิลปิน',
      xInches: 3.65,
      yInches: 7.5,
      widthInches: 3.87,
      heightInches: 0.45,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 15,
        fontWeight: 'bold',
        color: '#1A1918',
        textAlign: 'left',
      },
    },
    {
      id: 'blk-artwork-title',
      type: 'artwork_title',
      label: 'ชื่องานศิลปะ',
      xInches: 2.75,
      yInches: 8.1,
      widthInches: 4.77,
      heightInches: 0.45,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 13,
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: '#8B1B1B',
        textAlign: 'left',
      },
    },
    {
      id: 'blk-medium',
      type: 'medium',
      label: 'เทคนิค / วัสดุ',
      xInches: 2.75,
      yInches: 8.65,
      widthInches: 4.77,
      heightInches: 0.35,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 10,
        fontWeight: 'normal',
        color: '#444444',
        textAlign: 'left',
        prefixText: 'เทคนิค: ',
      },
    },
    {
      id: 'blk-dimensions',
      type: 'dimensions',
      label: 'ขนาดผลงาน',
      xInches: 2.75,
      yInches: 9.05,
      widthInches: 4.77,
      heightInches: 0.35,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 10,
        fontWeight: 'normal',
        color: '#666666',
        textAlign: 'left',
        prefixText: 'ขนาด: ',
      },
    },
    {
      id: 'blk-concept',
      type: 'concept',
      label: 'แนวคิดผลงาน',
      xInches: 0.75,
      yInches: 9.9,
      widthInches: 6.77,
      heightInches: 1.0,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 9,
        fontWeight: 'normal',
        color: '#555555',
        textAlign: 'left',
        lineHeight: 1.5,
      },
    },
  ],
};

// Preset 4: A4 Landscape Panorama
export const PRESET_A4_LANDSCAPE_PANORAMA: CatalogTemplateConfig = {
  id: 'preset-a4-landscape-panorama',
  name: 'A4 Landscape Panorama',
  paperSize: 'a4_landscape',
  pageWidthInches: 11.69,
  pageHeightInches: 8.27,
  gridSizeInches: 0.25,
  snapToGrid: true,
  backgroundColor: '#FFFFFF',
  paddingInches: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
  blocks: [
    {
      id: 'blk-artwork-img',
      type: 'artwork_image',
      label: 'ภาพผลงาน',
      xInches: 0.5,
      yInches: 0.5,
      widthInches: 7.25,
      heightInches: 7.27,
      zIndex: 1,
      style: {
        objectFit: 'contain',
      },
    },
    {
      id: 'blk-artist-photo',
      type: 'artist_photo',
      label: 'ภาพถ่ายศิลปิน',
      xInches: 8.25,
      yInches: 0.75,
      widthInches: 1.5,
      heightInches: 1.5,
      zIndex: 2,
      style: {
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#DDD',
        objectFit: 'cover',
      },
    },
    {
      id: 'blk-artist-name',
      type: 'artist_name',
      label: 'ชื่อศิลปิน',
      xInches: 8.0,
      yInches: 3.75,
      widthInches: 3.19,
      heightInches: 0.5,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 14,
        fontWeight: 'bold',
        color: '#1A1918',
      },
    },
    {
      id: 'blk-artwork-title',
      type: 'artwork_title',
      label: 'ชื่องานศิลปะ',
      xInches: 8.0,
      yInches: 4.35,
      widthInches: 3.19,
      heightInches: 0.5,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 12,
        fontWeight: 'bold',
        fontStyle: 'italic',
        color: '#8B1B1B',
      },
    },
    {
      id: 'blk-medium',
      type: 'medium',
      label: 'เทคนิค / วัสดุ',
      xInches: 8.0,
      yInches: 5.0,
      widthInches: 3.19,
      heightInches: 0.35,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 9.5,
        color: '#444',
      },
    },
    {
      id: 'blk-dimensions',
      type: 'dimensions',
      label: 'ขนาดผลงาน',
      xInches: 8.0,
      yInches: 5.4,
      widthInches: 3.19,
      heightInches: 0.35,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 9.5,
        color: '#666',
      },
    },
    {
      id: 'blk-concept',
      type: 'concept',
      label: 'แนวคิดผลงาน',
      xInches: 8.0,
      yInches: 5.9,
      widthInches: 3.19,
      heightInches: 1.87,
      zIndex: 2,
      style: {
        fontFamily: 'Maitree',
        fontSizePt: 8.5,
        color: '#555',
        lineHeight: 1.4,
      },
    },
  ],
};

// Preset 5: Minimalist Modern Clean (Full Art + Bottom Left Overlay)
export const PRESET_MINIMALIST_CLEAN: CatalogTemplateConfig = {
  id: 'preset-minimalist-clean',
  name: 'Minimalist Modern Clean',
  paperSize: 'square_10x10',
  pageWidthInches: 10.0,
  pageHeightInches: 10.0,
  gridSizeInches: 0.25,
  snapToGrid: true,
  backgroundColor: '#FAF8F5',
  paddingInches: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
  blocks: [
    {
      id: 'blk-artwork-img',
      type: 'artwork_image',
      label: 'ภาพผลงาน',
      xInches: 0.5,
      yInches: 0.5,
      widthInches: 9.0,
      heightInches: 7.0,
      zIndex: 1,
      style: {
        objectFit: 'contain',
        borderRadius: 2,
      },
    },
    {
      id: 'blk-artwork-title',
      type: 'artwork_title',
      label: 'ชื่องานศิลปะ',
      xInches: 0.5,
      yInches: 7.75,
      widthInches: 5.5,
      heightInches: 0.5,
      zIndex: 2,
      style: {
        fontFamily: 'Cinzel',
        fontSizePt: 16,
        fontWeight: 'bold',
        color: '#1A1918',
      },
    },
    {
      id: 'blk-artist-name',
      type: 'artist_name',
      label: 'ชื่อศิลปิน',
      xInches: 0.5,
      yInches: 8.35,
      widthInches: 5.5,
      heightInches: 0.375,
      zIndex: 2,
      style: {
        fontFamily: 'Inter',
        fontSizePt: 11,
        fontWeight: 'semibold',
        color: '#8C6D3F',
      },
    },
    {
      id: 'blk-medium',
      type: 'medium',
      label: 'เทคนิค / วัสดุ',
      xInches: 0.5,
      yInches: 8.85,
      widthInches: 5.5,
      heightInches: 0.375,
      zIndex: 2,
      style: {
        fontFamily: 'Inter',
        fontSizePt: 9.5,
        color: '#666',
      },
    },
    {
      id: 'blk-artist-photo',
      type: 'artist_photo',
      label: 'ภาพถ่ายศิลปิน',
      xInches: 7.75,
      yInches: 7.75,
      widthInches: 1.5,
      heightInches: 1.5,
      zIndex: 2,
      style: {
        borderRadius: 9999, // Circle
        borderWidth: 2,
        borderColor: '#8C6D3F',
        objectFit: 'cover',
      },
    },
  ],
};

export const BUILTIN_CATALOG_PRESETS: CatalogTemplateConfig[] = [
  PRESET_SQUARE_8X8_MODERN,
  PRESET_SQUARE_10X10_GRAND,
  PRESET_A4_PORTRAIT_CLASSIC,
  PRESET_A4_LANDSCAPE_PANORAMA,
  PRESET_MINIMALIST_CLEAN,
];

export function normalizeCatalogTemplate(template: CatalogTemplateConfig): CatalogTemplateConfig {
  if (!template || !Array.isArray(template.blocks)) return template;
  return {
    ...template,
    blocks: template.blocks.map((b) => {
      if (
        [
          'artwork_title',
          'artist_name',
          'artist_email',
          'medium',
          'dimensions',
          'year_created',
          'price',
          'concept',
          'page_number',
          'custom_text',
        ].includes(b.type)
      ) {
        const style = b.style || {};
        return {
          ...b,
          style: {
            ...style,
            fontFamily: style.fontFamily || 'Maitree',
          },
        };
      }
      return b;
    }),
  };
}

export function getExhibitionCatalogTemplate(exhibition?: Exhibition | null): CatalogTemplateConfig {
  if (!exhibition) return normalizeCatalogTemplate(PRESET_SQUARE_8X8_MODERN);

  if (exhibition.themeConfig) {
    try {
      const parsed = typeof exhibition.themeConfig === 'string' ? JSON.parse(exhibition.themeConfig) : exhibition.themeConfig;
      if (parsed.catalogTemplate && Array.isArray(parsed.catalogTemplate.blocks) && parsed.catalogTemplate.blocks.length > 0) {
        return normalizeCatalogTemplate(parsed.catalogTemplate);
      }
    } catch {}
  }

  return normalizeCatalogTemplate(PRESET_SQUARE_8X8_MODERN);
}

export function getArtworkCatalogTemplate(
  exhibition?: Exhibition | null,
  artworkId?: string
): CatalogTemplateConfig {
  if (!exhibition) return normalizeCatalogTemplate(PRESET_SQUARE_8X8_MODERN);

  if (exhibition.themeConfig) {
    try {
      const parsed = typeof exhibition.themeConfig === 'string' ? JSON.parse(exhibition.themeConfig) : exhibition.themeConfig;
      if (artworkId && parsed.pageOverrides && parsed.pageOverrides[artworkId]) {
        const override = parsed.pageOverrides[artworkId];
        if (Array.isArray(override.blocks) && override.blocks.length > 0) {
          return normalizeCatalogTemplate(override);
        }
      }
      if (parsed.catalogTemplate && Array.isArray(parsed.catalogTemplate.blocks) && parsed.catalogTemplate.blocks.length > 0) {
        return normalizeCatalogTemplate(parsed.catalogTemplate);
      }
    } catch {}
  }

  return normalizeCatalogTemplate(PRESET_SQUARE_8X8_MODERN);
}


export function getExhibitionPageOverrides(exhibition?: Exhibition | null): Record<string, CatalogTemplateConfig> {
  if (!exhibition?.themeConfig) return {};
  try {
    const parsed = typeof exhibition.themeConfig === 'string' ? JSON.parse(exhibition.themeConfig) : exhibition.themeConfig;
    if (parsed.pageOverrides && typeof parsed.pageOverrides === 'object') {
      return parsed.pageOverrides;
    }
  } catch {}
  return {};
}

