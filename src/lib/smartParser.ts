/**
 * Smart Auto-Detector & Field Classifier for Artworks
 * Accurately parses Excel / TSV / CSV / Text data without shifting columns
 * Leaves missing/empty fields as empty strings ("") without inserting fake mockups.
 */

export interface DetectedArtworkFields {
  title: string;
  artistName: string;
  artistCountry: string;
  artistEmail: string;
  medium: string;
  dimensions: string;
  yearCreated: number | string;
  concept: string;
  imageUrl: string;
}

const COMMON_COUNTRIES: Record<string, string> = {
  thailand: 'Thailand',
  thai: 'Thailand',
  ไทย: 'Thailand',
  ประเทศไทย: 'Thailand',
  japan: 'Japan',
  japanese: 'Japan',
  ญี่ปุ่น: 'Japan',
  australia: 'Australia',
  australian: 'Australia',
  ออสเตรเลีย: 'Australia',
  italy: 'Italy',
  italian: 'Italy',
  อิตาลี: 'Italy',
  france: 'France',
  french: 'France',
  ฝรั่งเศส: 'France',
  germany: 'Germany',
  german: 'Germany',
  เยอรมนี: 'Germany',
  'united kingdom': 'United Kingdom',
  uk: 'United Kingdom',
  อังกฤษ: 'United Kingdom',
  usa: 'United States',
  'united states': 'United States',
  america: 'United States',
  สหรัฐอเมริกา: 'United States',
  china: 'China',
  chinese: 'China',
  จีน: 'China',
  korea: 'South Korea',
  'south korea': 'South Korea',
  เกาหลี: 'South Korea',
  vietnam: 'Vietnam',
  เวียดนาม: 'Vietnam',
  singapore: 'Singapore',
  สิงคโปร์: 'Singapore',
  malaysia: 'Malaysia',
  มาเลเซีย: 'Malaysia',
  indonesia: 'Indonesia',
  อินโดนีเซีย: 'Indonesia',
  philippines: 'Philippines',
  ฟิลิปปินส์: 'Philippines',
  myanmar: 'Myanmar',
  burma: 'Myanmar',
  พม่า: 'Myanmar',
  cambodia: 'Cambodia',
  กัมพูชา: 'Cambodia',
  laos: 'Laos',
  ลาว: 'Laos',
  india: 'India',
  อินเดีย: 'India',
  spain: 'Spain',
  สเปน: 'Spain',
  netherlands: 'Netherlands',
  holland: 'Netherlands',
  เนเธอร์แลนด์: 'Netherlands',
  switzerland: 'Switzerland',
  สวิตเซอร์แลนด์: 'Switzerland',
  russia: 'Russia',
  รัสเซีย: 'Russia',
  canada: 'Canada',
  แคนาดา: 'Canada',
  brazil: 'Brazil',
  บราซิล: 'Brazil',
  mexico: 'Mexico',
  เม็กซิโก: 'Mexico',
  turkey: 'Turkey',
  ตุรกี: 'Turkey',
  egypt: 'Egypt',
  อียิปต์: 'Egypt',
  syria: 'Syria',
  ซีเรีย: 'Syria',
};

const MEDIUM_KEYWORDS = [
  'oil', 'acrylic', 'canvas', 'mixed media', 'linen', 'tempera', 'gold leaf',
  'wood', 'pigment', 'watercolor', 'watercolour', 'pastel', 'ink', 'paper',
  'sculpture', 'bronze', 'ceramic', 'print', 'etching', 'gouache', 'charcoal',
  'drawing', 'lithograph', 'serigraph', 'digital', 'resin', 'plaster', 'clay',
  'สีน้ำมัน', 'อะคริลิก', 'ผ้าใบ', 'ผ้าลินิน', 'สื่อผสม', 'ทองคำเปลว', 'สีน้ำ',
  'ประติมากรรม', 'หมึก', 'กระดาษ', 'ดินเผา', 'สำริด', 'ภาพพิมพ์', 'สีฝุ่น', 'ถ่านชาโคล'
];

/**
 * Split a single line into columns by Tab, Comma, or Pipe while preserving empty columns
 */
function splitColumns(line: string): string[] {
  if (line.includes('\t')) {
    return line.split('\t').map((c) => c.trim().replace(/^["']|["']$/g, ''));
  }
  if (line.includes('|')) {
    return line.split('|').map((c) => c.trim().replace(/^["']|["']$/g, ''));
  }
  // CSV comma splitter (respects quotes)
  const regex = /(?:^|,)(?:"([^"]*)"|([^,]*))/g;
  const result: string[] = [];
  let match;
  while ((match = regex.exec(line)) !== null) {
    if (match.index === regex.lastIndex) regex.lastIndex++;
    const val = (match[1] !== undefined ? match[1] : match[2] || '').trim();
    result.push(val.replace(/^["']|["']$/g, ''));
  }
  return result.length > 0 ? result : [line.trim()];
}

/**
 * Match Country from string (returns normalized English country name or empty string)
 */
function detectCountry(str: string): string {
  const clean = str.trim().toLowerCase();
  if (!clean) return '';
  if (COMMON_COUNTRIES[clean]) {
    return COMMON_COUNTRIES[clean];
  }
  for (const [key, val] of Object.entries(COMMON_COUNTRIES)) {
    if (clean === key || (clean.length > 2 && clean.startsWith(key))) {
      return val;
    }
  }
  return '';
}

/**
 * Detect Year from string (1900-2099)
 */
function detectYear(str: string): number | '' {
  if (!str) return '';
  const match = str.trim().match(/\b(19\d\d|20\d\d)\b/);
  if (match) {
    const y = parseInt(match[1], 10);
    if (y >= 1900 && y <= 2099) return y;
  }
  return '';
}

/**
 * Detect Dimensions (e.g., 120 x 180 cm.)
 */
function detectDimensions(str: string): string {
  if (!str) return '';
  const match = str.trim().match(/\b\d+(?:\.\d+)?\s*(?:x|×|X|\*)\s*\d+(?:\.\d+)?(?:\s*(?:x|×|X|\*)\s*\d+(?:\.\d+)?)?(?:\s*(?:cm|ซม|mm|m|in|inch|inches|\.?))?/i);
  if (match) {
    let dim = match[0].trim();
    if (!/(?:cm|ซม|mm|m|in)/i.test(dim)) {
      dim = `${dim} cm.`;
    }
    return dim;
  }
  return '';
}

/**
 * Parse full multi-line table from Excel/CSV
 * Detects headers automatically or maps positional columns accurately
 */
export function parseTabularText(fullText: string): DetectedArtworkFields[] {
  if (!fullText || !fullText.trim()) return [];

  const rawLines = fullText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (rawLines.length === 0) return [];

  const firstLineCols = splitColumns(rawLines[0]).map((c) => c.toLowerCase());

  // Check if first line contains header keywords
  const isHeaderRow = firstLineCols.some((col) =>
    ['title', 'ชื่อ', 'ชื่องาน', 'ชื่อผลงาน', 'artist', 'ศิลปิน', 'country', 'ประเทศ', 'สัญชาติ', 'medium', 'เทคนิค', 'dimension', 'ขนาด', 'year', 'ปี', 'concept', 'แนวคิด', 'image', 'url', 'ภาพ', 'รูป'].some((kw) =>
      col.includes(kw)
    )
  );

  let headerMap: {
    title?: number;
    artist?: number;
    country?: number;
    medium?: number;
    dimensions?: number;
    year?: number;
    concept?: number;
    imageUrl?: number;
  } = {};

  if (isHeaderRow) {
    firstLineCols.forEach((col, idx) => {
      if (['title', 'ชื่อ', 'ชื่องาน', 'ชื่อผลงาน', 'work', 'piece'].some((kw) => col.includes(kw))) {
        if (headerMap.title === undefined) headerMap.title = idx;
      } else if (['artist', 'ศิลปิน', 'ผู้สร้าง', 'author'].some((kw) => col.includes(kw))) {
        if (headerMap.artist === undefined) headerMap.artist = idx;
      } else if (['country', 'ประเทศ', 'สัญชาติ', 'nation'].some((kw) => col.includes(kw))) {
        if (headerMap.country === undefined) headerMap.country = idx;
      } else if (['medium', 'เทคนิค', 'วัสดุ', 'technique', 'material'].some((kw) => col.includes(kw))) {
        if (headerMap.medium === undefined) headerMap.medium = idx;
      } else if (['dimension', 'ขนาด', 'size', 'wxh'].some((kw) => col.includes(kw))) {
        if (headerMap.dimensions === undefined) headerMap.dimensions = idx;
      } else if (['year', 'ปี', 'ปีที่สร้าง', 'date'].some((kw) => col.includes(kw))) {
        if (headerMap.year === undefined) headerMap.year = idx;
      } else if (['concept', 'แนวคิด', 'คำอธิบาย', 'description', 'statement'].some((kw) => col.includes(kw))) {
        if (headerMap.concept === undefined) headerMap.concept = idx;
      } else if (['image', 'url', 'ภาพ', 'รูป', 'รูปภาพ', 'link', 'photo'].some((kw) => col.includes(kw))) {
        if (headerMap.imageUrl === undefined) headerMap.imageUrl = idx;
      }
    });
  }

  const startIdx = isHeaderRow ? 1 : 0;
  const results: DetectedArtworkFields[] = [];

  for (let i = startIdx; i < rawLines.length; i++) {
    const line = rawLines[i];
    const cols = splitColumns(line);

    // If headers were found and mapped
    if (isHeaderRow && Object.keys(headerMap).length >= 2) {
      const title = (headerMap.title !== undefined ? cols[headerMap.title] || '' : '').trim();
      const artistName = (headerMap.artist !== undefined ? cols[headerMap.artist] || '' : '').trim();
      let artistCountry = (headerMap.country !== undefined ? cols[headerMap.country] || '' : '').trim();
      if (artistCountry) {
        const detected = detectCountry(artistCountry);
        if (detected) artistCountry = detected;
      }
      const medium = (headerMap.medium !== undefined ? cols[headerMap.medium] || '' : '').trim();
      let dimensions = (headerMap.dimensions !== undefined ? cols[headerMap.dimensions] || '' : '').trim();
      if (dimensions && !/(?:cm|ซม|mm|m|in)/i.test(dimensions) && /\d+\s*[x×X]\s*\d+/.test(dimensions)) {
        dimensions = `${dimensions} cm.`;
      }
      const rawYear = headerMap.year !== undefined ? cols[headerMap.year] || '' : '';
      const yearCreated = detectYear(rawYear);
      const concept = (headerMap.concept !== undefined ? cols[headerMap.concept] || '' : '').trim();
      const imageUrl = (headerMap.imageUrl !== undefined ? cols[headerMap.imageUrl] || '' : '').trim();

      // Only add if at least one meaningful field exists
      if (title || artistName || imageUrl || concept) {
        results.push({
          title,
          artistName,
          artistCountry,
          artistEmail: '',
          medium,
          dimensions,
          yearCreated,
          concept,
          imageUrl,
        });
      }
    } else {
      // Positional / Standard Column Mapping (without header)
      // Standard: 0:Title, 1:Artist, 2:Country, 3:Medium, 4:Dimensions, 5:Year, 6:Concept, 7:ImageUrl
      if (cols.length >= 3) {
        let title = (cols[0] || '').trim();
        let artistName = (cols[1] || '').trim();
        let artistCountry = (cols[2] || '').trim();
        let medium = (cols[3] || '').trim();
        let dimensions = (cols[4] || '').trim();
        let yearCreated: number | string = detectYear(cols[5] || '');
        let concept = (cols[6] || '').trim();
        let imageUrl = (cols[7] || '').trim();

        // Check if country was placed in column 2 or if col 2 is medium
        const detectedCountry = detectCountry(artistCountry);
        if (detectedCountry) {
          artistCountry = detectedCountry;
        }

        // If dimensions in col 4
        if (dimensions && !/(?:cm|ซม|mm|m|in)/i.test(dimensions) && /\d+\s*[x×X]\s*\d+/.test(dimensions)) {
          dimensions = `${dimensions} cm.`;
        }

        if (title || artistName || imageUrl || concept) {
          results.push({
            title,
            artistName,
            artistCountry,
            artistEmail: '',
            medium,
            dimensions,
            yearCreated,
            concept,
            imageUrl,
          });
        }
      } else {
        // Fallback to smart heuristic single line parser
        const detected = smartDetectArtwork(line);
        if (detected.title || detected.artistName || detected.imageUrl) {
          results.push(detected);
        }
      }
    }
  }

  return results;
}

/**
 * Smart Auto-Detector for a single line of text
 * Strict field isolation: never puts country name into title or artist name
 * Leaves missing fields as empty strings ("")
 */
export function smartDetectArtwork(rawText: string): DetectedArtworkFields {
  const rawCols = splitColumns(rawText);
  // Keep clean values while preserving non-empty elements
  const cols = rawCols.filter((c) => c.length > 0);

  let title = '';
  let artistName = '';
  let artistCountry = '';
  let artistEmail = '';
  let medium = '';
  let dimensions = '';
  let yearCreated: number | string = '';
  let concept = '';
  let imageUrl = '';

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

    // 3. Detect Dimensions (e.g. 120 x 180 cm.)
    if (/\d+\s*(?:x|×|X)\s*\d+/.test(col)) {
      let dim = col;
      if (i + 1 < cols.length && /^(cm\.?|ซม\.?|mm\.?|m\.?|in\.?)$/i.test(cols[i + 1])) {
        dim = `${dim} ${cols[i + 1]}`;
        i++;
      } else if (!/(?:cm|ซม|m|in)/i.test(dim)) {
        dim = `${dim} cm.`;
      }
      dimensions = dim;
      continue;
    }

    // 4. Detect Country (STRICT - will NEVER become title or artist name)
    const detectedCountry = detectCountry(col);
    if (detectedCountry) {
      artistCountry = detectedCountry;
      continue;
    }

    // 5. Detect Year
    const yearVal = detectYear(col);
    if (yearVal && col.length <= 10) {
      yearCreated = yearVal;
      continue;
    }

    // 6. Detect Medium / Technique
    if (MEDIUM_KEYWORDS.some((kw) => lower.includes(kw)) && col.length < 80) {
      medium = col;
      continue;
    }

    // 7. Detect Long Concept / Statement Paragraph
    if (col.length > 60 || col.includes('. ') || col.includes('คือ') || col.includes('this artwork')) {
      concept = col;
      continue;
    }

    // Unassigned candidate for Title or Artist Name
    unassigned.push(col);
  }

  // Assign remaining columns: First is Title (or Artist Name if Title is specified)
  if (unassigned.length > 0) {
    title = unassigned[0];
    if (unassigned.length > 1) {
      artistName = unassigned[1];
    }
    if (unassigned.length > 2 && !concept) {
      concept = unassigned.slice(2).join(' ');
    }
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

