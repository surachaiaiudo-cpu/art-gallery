import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount?: number | null): string {
  if (amount == null) return 'Price upon request';
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateRange(startDateStr: string, endDateStr: string): string {
  try {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} – ${end.toLocaleDateString('en-US', options)}`;
  } catch {
    return `${startDateStr} – ${endDateStr}`;
  }
}

/**
 * Formats artwork dimensions cleanly in Centimeters (ซม. / cm.).
 * Always displays in Centimeters (e.g., "120 × 180 ซม." / "120 × 180 cm.").
 */
export function formatDimensionsInCm(dimStr?: string | null, lang: string = 'th'): string {
  if (!dimStr) return lang === 'th' ? '120 × 180 ซม.' : '120 × 180 cm.';

  const unit = lang === 'th' ? 'ซม.' : 'cm.';

  // Look for two numbers
  const matches = dimStr.match(/(\d+(?:\.\d+)?)\s*(?:x|×|X)\s*(\d+(?:\.\d+)?)/);
  if (matches && matches[1] && matches[2]) {
    const num1 = parseFloat(matches[1]);
    const num2 = parseFloat(matches[2]);

    // If entered in meters (e.g. 1.2 x 1.8), convert to cm
    const w = num1 < 10 ? Math.round(num1 * 100) : Math.round(num1);
    const h = num2 < 10 ? Math.round(num2 * 100) : Math.round(num2);

    return `${w} × ${h} ${unit}`;
  }

  const clean = dimStr.replace(/\s*(?:cm|ซม|m|ม)\.?/gi, '').trim();
  return `${clean} ${unit}`;
}

/**
 * Parses real-world physical artwork dimensions (e.g., "120 x 180 cm.", "100 x 150 cm.", "80 x 110 cm.")
 * and converts to real 3D meter units for Three.js.
 */
export function parseArtworkDimensions(dimStr?: string | null): { widthMeters: number; heightMeters: number } {
  if (!dimStr) {
    return { widthMeters: 1.8, heightMeters: 1.2 };
  }

  const matches = dimStr.match(/(\d+(?:\.\d+)?)\s*(?:x|×|X)\s*(\d+(?:\.\d+)?)/);
  if (matches && matches[1] && matches[2]) {
    const num1 = parseFloat(matches[1]);
    const num2 = parseFloat(matches[2]);

    const heightCm = Math.min(num1, num2);
    const widthCm = Math.max(num1, num2);

    const heightMeters = Math.min(Math.max(heightCm / 100, 0.4), 3.5);
    const widthMeters = Math.min(Math.max(widthCm / 100, 0.4), 4.5);

    return { widthMeters, heightMeters };
  }

  return { widthMeters: 1.8, heightMeters: 1.2 };
}
