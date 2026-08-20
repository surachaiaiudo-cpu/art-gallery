/**
 * Smart Auto-Detector & Field Classifier for Artworks
 * Automatically recognizes:
 * - Artist Name
 * - Artist Country
 * - Artist Email
 * - Artwork Title
 * - Medium / Technique
 * - Dimensions (e.g. 120 x 100 cm.)
 * - Year Created (e.g. 2017 from 03.04.2017)
 * - Concept Statement
 * - High-Res Image URL
 */

export interface DetectedArtworkFields {
  title: string;
  artistName: string;
  artistCountry: string;
  artistEmail: string;
  medium: string;
  dimensions: string;
  yearCreated: number;
  concept: string;
  imageUrl: string;
}

const COMMON_COUNTRIES = [
  'thailand', 'thai', 'australia', 'japan', 'italy', 'france', 'germany',
  'united kingdom', 'uk', 'usa', 'united states', 'china', 'korea',
  'vietnam', 'singapore', 'malaysia', 'indonesia', 'philippines', 'syria',
  'cambodia', 'laos', 'myanmar', 'india', 'spain', 'netherlands', 'switzerland',
  'ไทย', 'ออสเตรเลีย', 'ญี่ปุ่น', 'อิตาลี', 'ฝรั่งเศส', 'เยอรมนี'
];

const MEDIUM_KEYWORDS = [
  'oil', 'acrylic', 'canvas', 'mixed media', 'linen', 'tempera', 'gold leaf',
  'wood', 'pigment', 'watercolor', 'watercolour', 'pastel', 'ink', 'paper',
  'sculpture', 'bronze', 'ceramic', 'print', 'etching', 'gouache',
  'สีน้ำมัน', 'อะคริลิก', 'ผ้าใบ', 'ผ้าลินิน', 'สื่อผสม', 'ทองคำเปลว', 'สีน้ำ', 'ประติมากรรม'
];

export function smartDetectArtwork(rawText: string): DetectedArtworkFields {
  // Split line by tab (Excel/Google Sheets copy) or comma or pipe
  let rawCols = rawText.includes('\t')
    ? rawText.split('\t')
    : rawText.includes('|')
    ? rawText.split('|')
    : rawText.split(',');

  // Clean strings
  const cols = rawCols.map(c => c.trim().replace(/^["']|["']$/g, '')).filter(Boolean);

  let title = '';
  let artistName = '';
  let artistCountry = 'Thailand';
  let artistEmail = '';
  let medium = 'Oil on Canvas';
  let dimensions = '120 x 180 cm.';
  let yearCreated = 2026;
  let concept = '';
  let imageUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop';

  const unassigned: string[] = [];

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i];
    const lower = col.toLowerCase();

    // 1. Detect Email
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(col)) {
      artistEmail = col;
      continue;
    }

    // 2. Detect Image URL
    if (/^https?:\/\/.+/i.test(col)) {
      imageUrl = col;
      continue;
    }

    // 3. Detect Dimensions (e.g., "120 x 100", "120x100 cm.", "100 × 150")
    if (/\d+\s*(?:x|×|X)\s*\d+/.test(col)) {
      let dim = col;
      // Check if next column is unit like "cm." or "ซม."
      if (i + 1 < cols.length && /^(cm\.?|ซม\.?|mm\.?|m\.?|in\.?)$/i.test(cols[i + 1])) {
        dim = `${dim} ${cols[i + 1]}`;
        i++; // skip unit column
      } else if (!/(?:cm|ซม|m|in)/i.test(dim)) {
        dim = `${dim} cm.`;
      }
      dimensions = dim;
      continue;
    }

    // 4. Detect Country
    if (COMMON_COUNTRIES.some(c => lower === c || lower.startsWith(c))) {
      artistCountry = col.charAt(0).toUpperCase() + col.slice(1);
      continue;
    }

    // 5. Detect Year / Date (e.g., "2017", "03.04.2017", "2569", "2024-2026")
    const yearMatch = col.match(/\b(19\d\d|20\d\d)\b/);
    if (yearMatch && col.length <= 15) {
      yearCreated = parseInt(yearMatch[1]);
      // If it looks like a titled date code like "03.04.2017", it could also be the title!
      if (col.length > 5 && !title) {
        title = col;
      }
      continue;
    }

    // 6. Detect Medium / Technique
    if (MEDIUM_KEYWORDS.some(kw => lower.includes(kw)) && col.length < 80) {
      medium = col;
      continue;
    }

    // 7. Detect Long Concept / Statement Paragraph (> 50 chars or contains sentences)
    if (col.length > 50 || col.includes('. ') || col.includes('คือ') || col.includes('this work')) {
      concept = col;
      continue;
    }

    // Otherwise keep for Artist Name or Title
    unassigned.push(col);
  }

  // Resolve remaining unassigned columns (e.g. Artist Name, Title)
  if (unassigned.length > 0) {
    if (!artistName) {
      artistName = unassigned.shift()!;
    }
    if (unassigned.length > 0 && !title) {
      title = unassigned.shift()!;
    }
  }

  // Fallbacks if not set
  if (!title) {
    title = artistName ? `Artwork by ${artistName}` : 'Untitled Artwork';
  }
  if (!artistName) {
    artistName = 'สมโภชน์ บุญส่งประเสริฐ';
  }

  return {
    title,
    artistName,
    artistCountry,
    artistEmail,
    medium,
    dimensions,
    yearCreated,
    concept,
    imageUrl,
  };
}
