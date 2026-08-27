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
 * Accurately preserves centimeters (e.g. 9 x 24 cm -> 9 × 24 ซม., 120 x 180 cm -> 120 × 180 ซม.)
 */
export function formatDimensionsInCm(dimStr?: string | null, lang: string = 'th'): string {
  if (!dimStr) return lang === 'th' ? '120 × 180 ซม.' : '120 × 180 cm.';

  const unit = lang === 'th' ? 'ซม.' : 'cm.';
  const str = dimStr.trim();

  // Check if string explicitly mentions meters (e.g., "1.5 x 2.0 m" or "1.5 ม.")
  const isExplicitMeters = /\b(m|meters?|เมตร|ม\.)\b/i.test(str) && !/\b(cm|ซม)\b/i.test(str);

  // Look for 2 or 3 numbers (Width x Height x Depth or Width x Height)
  const matches = str.match(/(\d+(?:\.\d+)?)\s*(?:x|×|X|\*)\s*(\d+(?:\.\d+)?)(?:\s*(?:x|×|X|\*)\s*(\d+(?:\.\d+)?))?/);
  if (matches && matches[1] && matches[2]) {
    let num1 = parseFloat(matches[1]);
    let num2 = parseFloat(matches[2]);
    let num3 = matches[3] ? parseFloat(matches[3]) : null;

    if (isExplicitMeters) {
      num1 = Math.round(num1 * 100);
      num2 = Math.round(num2 * 100);
      if (num3 !== null) num3 = Math.round(num3 * 100);
    }

    if (num3 !== null) {
      return `${num1} × ${num2} × ${num3} ${unit}`;
    }
    return `${num1} × ${num2} ${unit}`;
  }

  const clean = str.replace(/\s*(?:cm|ซม|m|ม)\.?/gi, '').trim();
  return `${clean} ${unit}`;
}

/**
 * Parses real-world physical artwork dimensions (e.g., "120 x 180 cm.", "9 x 24 cm.", "1.5 x 2.0 m")
 * and converts to real 3D meter units for Three.js without distorting portrait/landscape aspect ratio.
 */
export function parseArtworkDimensions(dimStr?: string | null): { widthMeters: number; heightMeters: number } {
  if (!dimStr) {
    return { widthMeters: 1.5, heightMeters: 1.2 };
  }

  const str = dimStr.trim();
  const isExplicitMeters = /\b(m|meters?|เมตร|ม\.)\b/i.test(str) && !/\b(cm|ซม)\b/i.test(str);

  const matches = str.match(/(\d+(?:\.\d+)?)\s*(?:x|×|X|\*)\s*(\d+(?:\.\d+)?)/);
  if (matches && matches[1] && matches[2]) {
    const num1 = parseFloat(matches[1]);
    const num2 = parseFloat(matches[2]);

    let wMeters = isExplicitMeters ? num1 : (num1 > 10 ? num1 / 100 : (str.includes('.') && num1 < 4 ? num1 : num1 / 100));
    let hMeters = isExplicitMeters ? num2 : (num2 > 10 ? num2 / 100 : (str.includes('.') && num2 < 4 ? num2 : num2 / 100));

    // Safety bounds: minimum 0.15m (15 cm) to 6.0m (600 cm)
    wMeters = Math.min(Math.max(wMeters, 0.15), 6.0);
    hMeters = Math.min(Math.max(hMeters, 0.15), 6.0);

    return { widthMeters: wMeters, heightMeters: hMeters };
  }

  return { widthMeters: 1.5, heightMeters: 1.2 };
}

/**
 * Sanitizes email strings by removing invisible unicode, zero-width characters, quotes, and whitespace.
 * Prevents HTML5 form validation errors like "A part followed by '@' should not contain the symbol ''".
 */
export function cleanEmail(email: string): string {
  if (!email) return '';
  return email
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g, '') // remove zero-width & non-breaking spaces
    .replace(/["'“”‘’`´]/g, '') // remove quotes
    .replace(/\s+/g, '') // remove internal and external whitespace
    .trim()
    .toLowerCase();
}

/**
 * Sanitizes names and text by removing control characters, zero-width spaces, and extra whitespace.
 */
export function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/[\u200B-\u200D\uFEFF\u00A0\u2060\u180E]/g, '')
    .replace(/^["'“”‘’`´]|["'“”‘’`´]$/g, '') // strip surrounding quotes
    .replace(/\s+/g, ' ')
    .trim();
}

