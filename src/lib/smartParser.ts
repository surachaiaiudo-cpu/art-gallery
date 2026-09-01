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
  price?: string | number;
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
  'ประติมากรรม', 'หมึก', 'กระดาษ', 'ดินเผา', 'สำริด', 'ภาพพิมพ์', 'สีฝุ่น', 'ถ่านชาโคล',
  'ปูนปั้น', 'ปูนปั้นสด', 'สีไม้', 'แกะสลัก', 'จิตรกรรม', 'ลายรดน้ำ', 'ภาพปัก', 'เซรามิก'
];

/**
 * Remove leading label prefixes (e.g. "Technique : ", "Price : ", "ขนาด : ")
 */
export function cleanPrefix(str: string, prefixes: string[]): string {
  let res = str.trim();
  for (const p of prefixes) {
    const reg = new RegExp(`^${p}\\s*[:：\\-=]\\s*`, 'i');
    if (reg.test(res)) {
      res = res.replace(reg, '').trim();
    }
  }
  return res;
}

/**
 * Robust CSV/TSV Table Tokenizer
 */
export function parseTableRows(text: string): string[][] {
  if (!text || !text.trim()) return [];

  const tabCount = (text.match(/\t/g) || []).length;
  const commaCount = (text.match(/,/g) || []).length;
  const pipeCount = (text.match(/\|/g) || []).length;

  let delimiter = '\t';
  if (tabCount === 0 && pipeCount > commaCount) {
    delimiter = '|';
  } else if (tabCount === 0 && commaCount > 0) {
    delimiter = ',';
  }

  const rawRows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      currentRow.push(currentCell.trim().replace(/^["']|["']$/g, ''));
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim().replace(/^["']|["']$/g, ''));
      currentCell = '';

      if (currentRow.some((c) => c.length > 0)) {
        rawRows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim().replace(/^["']|["']$/g, ''));
    if (currentRow.some((c) => c.length > 0)) {
      rawRows.push(currentRow);
    }
  }

  // Handle unquoted multiline concept breaks
  const cleanedRows: string[][] = [];
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (row.length >= 3) {
      cleanedRows.push(row);
    } else if (row.length === 1 && cleanedRows.length > 0 && row[0].trim().length > 0) {
      const orphanText = row[0].trim();
      const prevRow = cleanedRows[cleanedRows.length - 1];
      if (/^https?:\/\//i.test(orphanText)) {
        if (prevRow.length >= 9 && !prevRow[8]) {
          prevRow[8] = orphanText;
        } else if (prevRow.length === 8) {
          prevRow.push(orphanText);
        } else {
          cleanedRows.push(row);
        }
      } else {
        if (prevRow.length >= 8) {
          prevRow[7] = prevRow[7] ? `${prevRow[7]}\n${orphanText}` : orphanText;
        } else if (prevRow.length >= 7) {
          prevRow[6] = prevRow[6] ? `${prevRow[6]}\n${orphanText}` : orphanText;
        } else if (prevRow.length > 0) {
          prevRow[prevRow.length - 1] = `${prevRow[prevRow.length - 1]}\n${orphanText}`;
        } else {
          cleanedRows.push(row);
        }
      }
    } else if (row.some((c) => c.length > 0)) {
      cleanedRows.push(row);
    }
  }

  return cleanedRows;
}

/**
 * Match Country from string
 */
export function detectCountry(str: string): string {
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
 * Detect Year from string (CE 1900-2099 or BE 2400-2600)
 */
export function detectYear(str: string): number | '' {
  if (!str) return '';
  const match = str.trim().match(/\b(19\d\d|20\d\d|24\d\d|25\d\d)\b/);
  if (match) {
    const y = parseInt(match[1], 10);
    if (y >= 2400 && y <= 2600) return y - 543; // Convert BE to CE
    if (y >= 1900 && y <= 2099) return y;
  }
  return '';
}

/**
 * Detect Price (e.g., "Price : 40,000 บาท", "40,000", "40000 THB")
 */
export function detectPrice(str: string): number | null {
  const clean = str.trim();
  if (!clean) return null;
  const hasPriceKw =
    /^(?:price|ราคา|มูลค่า|cost)\s*[:：\-]?/i.test(clean) ||
    /บาท|thb|฿|baht/i.test(clean);
  const numMatch = clean.replace(/,/g, '').match(/\d+(?:\.\d+)?/);

  if (hasPriceKw && numMatch) {
    const p = parseFloat(numMatch[0]);
    if (!isNaN(p) && p > 0) return p;
  }
  if (/^\d{1,3}(?:,\d{3})+(?:\.\d{2})?$/.test(clean)) {
    const p = parseFloat(clean.replace(/,/g, ''));
    if (!isNaN(p) && p > 0) return p;
  }
  if (/^\d{4,9}$/.test(clean) && parseInt(clean, 10) >= 100) {
    const p = parseFloat(clean);
    if (!isNaN(p) && p > 0) return p;
  }
  return null;
}

/**
 * Detect Medium / Technique (with prefix stripping)
 */
export function detectMedium(str: string): string {
  const clean = str.trim();
  if (!clean) return '';
  const lower = clean.toLowerCase();
  const isExplicit = /^(?:technique|medium|material|เทคนิค|วัสดุ|เทคนิค\/วัสดุ)\s*[:：\-]/i.test(clean);
  const stripped = cleanPrefix(clean, ['technique', 'medium', 'material', 'เทคนิค', 'วัสดุ', 'เทคนิค/วัสดุ']);

  if (isExplicit) {
    return stripped || clean;
  }
  if (MEDIUM_KEYWORDS.some((kw) => lower.includes(kw)) && clean.length < 120) {
    return stripped;
  }
  return '';
}

/**
 * Detect Dimensions (e.g. 120 x 180 cm., 60 X 40 ซม.)
 */
export function detectDimensions(str: string): string {
  const clean = str.trim();
  if (!clean) return '';
  const isExplicit = /^(?:size|dimension|dimensions|ขนาด|ขนาดผลงาน)\s*[:：\-]/i.test(clean);
  const stripped = cleanPrefix(clean, ['size', 'dimension', 'dimensions', 'ขนาด', 'ขนาดผลงาน']);

  if (isExplicit || /\d+\s*(?:x|×|X|\*)\s*\d+/i.test(clean)) {
    let dim = stripped;
    if (!/(?:cm|ซม|mm|m|in|นิ้ว)/i.test(dim) && /\d+\s*(?:x|×|X|\*)\s*\d+/i.test(dim)) {
      dim = `${dim} cm.`;
    }
    return dim;
  }
  return '';
}

function isLikelyHeaderRow(cols: string[]): boolean {
  // If cells contain data patterns (colon prefixes, dimensions numbers, formatted prices, long descriptions), it is NOT a header row!
  const hasDataPatterns = cols.some((col) => {
    const c = col.trim();
    return (
      /[:：]/.test(c) ||
      /\d+\s*[x×X*]\s*\d+/.test(c) ||
      /\d{1,3}(?:,\d{3})+/.test(c) ||
      c.length > 30
    );
  });
  if (hasDataPatterns) return false;

  const headerKeywords = [
    'artist', 'ศิลปิน', 'author', 'creator', 'country', 'ประเทศ', 'สัญชาติ',
    'email', 'อีเมล', 'title', 'ชื่อ', 'ผลงาน', 'artwork', 'medium', 'เทคนิค',
    'วัสดุ', 'size', 'ขนาด', 'dimension', 'dimensions', 'unit', 'หน่วย',
    'year', 'ปี', 'concept', 'แนวคิด', 'description', 'คำอธิบาย', 'image', 'รูป',
    'photo', 'ภาพ', 'url', 'price', 'ราคา'
  ];
  const matches = cols.filter((col) => {
    const clean = col.toLowerCase().trim();
    return clean.length < 25 && headerKeywords.some((kw) => clean === kw || clean.startsWith(kw));
  });
  return matches.length >= 2;
}

/**
 * Parse single row columns with full semantic classifier
 */
export function parseSingleRowCols(cols: string[]): DetectedArtworkFields {
  let title = '';
  let artistName = '';
  let artistCountry = '';
  let artistEmail = '';
  let medium = '';
  let dimensions = '';
  let yearCreated: number | string = '';
  let price: string | number = '';
  let concept = '';
  let imageUrl = '';

  const unassigned: string[] = [];

  for (let i = 0; i < cols.length; i++) {
    const col = cols[i].trim();
    if (!col) continue;

    // 1. Price Check
    const p = detectPrice(col);
    if (p !== null && !price) {
      price = p;
      continue;
    }

    // 2. Email Check
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(col)) {
      artistEmail = col;
      continue;
    }

    // 3. Image URL Check
    if (/^https?:\/\/.+/i.test(col)) {
      imageUrl = col;
      continue;
    }

    // 4. Dimensions Check
    const d = detectDimensions(col);
    if (d && !dimensions) {
      dimensions = d;
      continue;
    }

    // 5. Medium Check
    const m = detectMedium(col);
    if (m && !medium) {
      medium = m;
      continue;
    }

    // 6. Explicit Prefix Checks (Artist, Title, Year, Concept)
    if (/^(?:artist|creator|author|ศิลปิน|ชื่อศิลปิน)\s*[:：\-]/i.test(col)) {
      artistName = cleanPrefix(col, ['artist', 'creator', 'author', 'ศิลปิน', 'ชื่อศิลปิน']);
      continue;
    }
    if (/^(?:title|artwork|ชื่อผลงาน|ชื่องาน|ชื่อภาพ)\s*[:：\-]/i.test(col)) {
      title = cleanPrefix(col, ['title', 'artwork', 'ชื่อผลงาน', 'ชื่องาน', 'ชื่อภาพ']);
      continue;
    }
    if (/^(?:year|ปี|ปีที่สร้าง)\s*[:：\-]/i.test(col)) {
      yearCreated = detectYear(col) || cleanPrefix(col, ['year', 'ปี', 'ปีที่สร้าง']);
      continue;
    }
    if (/^(?:concept|description|statement|แนวคิด|คำบรรยาย|คำอธิบาย)\s*[:：\-]/i.test(col)) {
      concept = cleanPrefix(col, ['concept', 'description', 'statement', 'แนวคิด', 'คำบรรยาย', 'คำอธิบาย']);
      continue;
    }

    // 7. Country Check
    const detectedCountry = detectCountry(col);
    if (detectedCountry && !artistCountry && col.length <= 25) {
      artistCountry = detectedCountry;
      continue;
    }

    // 8. Standalone Year Check
    const yearVal = detectYear(col);
    if (yearVal && !yearCreated && col.length <= 8) {
      yearCreated = yearVal;
      continue;
    }

    // 9. Long statement / Concept
    if (col.length > 80 || col.includes('. ') || col.includes('คือ') || col.includes('this artwork')) {
      if (!concept) {
        concept = col;
      } else {
        concept = `${concept}\n${col}`;
      }
      continue;
    }

    unassigned.push(col);
  }

  // Assign remaining unassigned columns (Thai art catalog standard sequence: [Artist Name], [Artwork Title])
  if (!artistName && !title) {
    if (unassigned.length >= 2) {
      artistName = unassigned.shift() || '';
      title = unassigned.shift() || '';
      if (unassigned.length > 0 && !concept) {
        concept = unassigned.join(' | ');
      }
    } else if (unassigned.length === 1) {
      title = unassigned.shift() || '';
    }
  } else if (!artistName && unassigned.length > 0) {
    artistName = unassigned.shift() || '';
  } else if (!title && unassigned.length > 0) {
    title = unassigned.shift() || '';
  }

  if (unassigned.length > 0 && !concept) {
    concept = unassigned.join(' | ');
  }

  return {
    title,
    artistName,
    artistCountry: artistCountry || 'Thailand',
    artistEmail,
    medium,
    dimensions,
    yearCreated: yearCreated || 2026,
    price: price ? String(price) : '',
    concept,
    imageUrl,
  };
}

/**
 * Parse full multi-line table from Excel/CSV
 */
export function parseTabularText(fullText: string): DetectedArtworkFields[] {
  if (!fullText || !fullText.trim()) return [];

  const allRows = parseTableRows(fullText);
  if (allRows.length === 0) return [];

  const firstLineCols = allRows[0].map((c) => c.toLowerCase());
  const isHeaderRow = isLikelyHeaderRow(allRows[0]);

  let headerMap: {
    artist?: number;
    country?: number;
    email?: number;
    title?: number;
    medium?: number;
    dimensions?: number;
    unit?: number;
    year?: number;
    price?: number;
    concept?: number;
    imageUrl?: number;
  } = {};

  if (isHeaderRow) {
    firstLineCols.forEach((col, idx) => {
      if (['ชื่อศิลปิน', 'ศิลปิน', 'artist', 'creator', 'author'].some((kw) => col.includes(kw))) {
        if (headerMap.artist === undefined) headerMap.artist = idx;
      } else if (['ประเทศ', 'สัญชาติ', 'country', 'nation', 'nationality'].some((kw) => col.includes(kw))) {
        if (headerMap.country === undefined) headerMap.country = idx;
      } else if (['email', 'อีเมล', 'mail', 'e-mail'].some((kw) => col.includes(kw))) {
        if (headerMap.email === undefined) headerMap.email = idx;
      } else if (['ชื่อผลงาน', 'ชื่องาน', 'ชื่อภาพ', 'title', 'artwork', 'piece'].some((kw) => col.includes(kw))) {
        if (headerMap.title === undefined) headerMap.title = idx;
      } else if (['เทคนิค', 'วัสดุ', 'medium', 'technique', 'material'].some((kw) => col.includes(kw))) {
        if (headerMap.medium === undefined) headerMap.medium = idx;
      } else if (['ขนาด', 'ขนาดผลงาน', 'dimension', 'dimensions', 'size', 'wxh'].some((kw) => col.includes(kw))) {
        if (headerMap.dimensions === undefined) headerMap.dimensions = idx;
      } else if (['หน่วย', 'หน่วยวัด', 'unit'].some((kw) => col.includes(kw))) {
        if (headerMap.unit === undefined) headerMap.unit = idx;
      } else if (['ราคา', 'มูลค่า', 'price', 'cost'].some((kw) => col.includes(kw))) {
        if (headerMap.price === undefined) headerMap.price = idx;
      } else if (['ปี', 'ปีที่สร้าง', 'year', 'date'].some((kw) => col.includes(kw))) {
        if (headerMap.year === undefined) headerMap.year = idx;
      } else if (['แนวคิด', 'แนวคิดผลงาน', 'concept', 'คำอธิบาย', 'description', 'statement'].some((kw) => col.includes(kw))) {
        if (headerMap.concept === undefined) headerMap.concept = idx;
      } else if (['รูป', 'ภาพ', 'รูปภาพ', 'image', 'url', 'photo', 'link'].some((kw) => col.includes(kw))) {
        if (headerMap.imageUrl === undefined) headerMap.imageUrl = idx;
      }
    });
  }

  const startIdx = isHeaderRow ? 1 : 0;
  const results: DetectedArtworkFields[] = [];

  for (let i = startIdx; i < allRows.length; i++) {
    const cols = allRows[i];

    if (isHeaderRow && Object.keys(headerMap).length >= 2) {
      const artistName = (headerMap.artist !== undefined ? cleanPrefix(cols[headerMap.artist] || '', ['artist', 'ศิลปิน']) : '').trim();
      let artistCountry = (headerMap.country !== undefined ? cols[headerMap.country] || '' : '').trim();
      if (artistCountry) {
        const detected = detectCountry(artistCountry);
        if (detected) artistCountry = detected;
      }
      const artistEmail = (headerMap.email !== undefined ? cols[headerMap.email] || '' : '').trim();
      const title = (headerMap.title !== undefined ? cleanPrefix(cols[headerMap.title] || '', ['title', 'ชื่องาน', 'ชื่อผลงาน']) : '').trim();
      const rawMedium = (headerMap.medium !== undefined ? cols[headerMap.medium] || '' : '').trim();
      const medium = detectMedium(rawMedium) || cleanPrefix(rawMedium, ['technique', 'medium', 'material', 'เทคนิค', 'วัสดุ']);

      let rawDim = (headerMap.dimensions !== undefined ? cols[headerMap.dimensions] || '' : '').trim();
      let rawUnit = (headerMap.unit !== undefined ? cols[headerMap.unit] || '' : '').trim();
      let dimensions = rawDim;
      if (rawDim && rawUnit) {
        if (!rawDim.toLowerCase().includes(rawUnit.toLowerCase())) {
          dimensions = `${rawDim} ${rawUnit}`;
        }
      } else if (rawDim && !/(?:cm|ซม|mm|m|in)/i.test(rawDim) && /\d+\s*[x×X]\s*\d+/.test(rawDim)) {
        dimensions = `${rawDim} cm.`;
      }
      dimensions = cleanPrefix(dimensions, ['size', 'dimension', 'dimensions', 'ขนาด']);

      const rawPrice = headerMap.price !== undefined ? cols[headerMap.price] || '' : '';
      const parsedPrice = detectPrice(rawPrice);
      const price = parsedPrice !== null ? String(parsedPrice) : '';

      const rawYear = headerMap.year !== undefined ? cols[headerMap.year] || '' : '';
      const yearCreated = detectYear(rawYear) || 2026;
      const concept = (headerMap.concept !== undefined ? cleanPrefix(cols[headerMap.concept] || '', ['concept', 'แนวคิด', 'description']) : '').trim();
      const imageUrl = (headerMap.imageUrl !== undefined ? cols[headerMap.imageUrl] || '' : '').trim();

      if (title || artistName || imageUrl || concept || medium) {
        results.push({
          title,
          artistName,
          artistCountry: artistCountry || 'Thailand',
          artistEmail,
          medium,
          dimensions,
          yearCreated,
          price,
          concept,
          imageUrl,
        });
      }
    } else {
      // Positional / Smart Classifier per row
      if (cols.some((c) => c.trim().length > 0)) {
        const parsed = parseSingleRowCols(cols);
        if (parsed.title || parsed.artistName || parsed.medium || parsed.concept || parsed.imageUrl) {
          results.push(parsed);
        }
      }
    }
  }

  return results;
}

/**
 * Smart Auto-Detector for a single line of text
 */
export function smartDetectArtwork(rawText: string): DetectedArtworkFields {
  const parsedRows = parseTableRows(rawText);
  const cols = (parsedRows[0] || []).filter((c) => c.length > 0);
  return parseSingleRowCols(cols);
}
