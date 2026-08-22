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
 * Robust CSV/TSV Table Tokenizer
 * 1. Correctly parses multiline cells within double quotes (Alt+Enter in Excel / Google Sheets)
 * 2. Auto-detects Tab (\t), Comma (,), or Pipe (|) delimiters
 * 3. Preserves exact column positions and empty cells
 * 4. Stitches unquoted orphan multiline concept lines back into the parent row
 */
export function parseTableRows(text: string): string[][] {
  if (!text || !text.trim()) return [];

  // Determine delimiter: Tab (\t) is standard when copying from Excel / Google Sheets
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
        // Escaped quote ("")
        currentCell += '"';
        i++; // skip next char
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of cell
      currentRow.push(currentCell.trim().replace(/^["']|["']$/g, ''));
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      // End of row (only when NOT inside quotes!)
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n in \r\n
      }
      currentRow.push(currentCell.trim().replace(/^["']|["']$/g, ''));
      currentCell = '';

      if (currentRow.some((c) => c.length > 0)) {
        rawRows.push(currentRow);
      }
      currentRow = [];
    } else {
      // Normal character (or newline inside quotes)
      currentCell += char;
    }
  }

  // Push trailing cell and row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim().replace(/^["']|["']$/g, ''));
    if (currentRow.some((c) => c.length > 0)) {
      rawRows.push(currentRow);
    }
  }

  // Pass 2: Handle unquoted multiline concept breaks (where user pasted unquoted text with newlines inside concept)
  // If a row has only 1 column (and no URL/dimensions), append it to the previous row's concept!
  const cleanedRows: string[][] = [];

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];

    // If row has standard multiple columns (>= 3)
    if (row.length >= 3) {
      cleanedRows.push(row);
    } else if (row.length === 1 && cleanedRows.length > 0 && row[0].trim().length > 0) {
      const orphanText = row[0].trim();
      const prevRow = cleanedRows[cleanedRows.length - 1];

      // If orphanText is an Image URL that got bumped to a new line
      if (/^https?:\/\//i.test(orphanText)) {
        if (prevRow.length >= 9 && !prevRow[8]) {
          prevRow[8] = orphanText;
        } else if (prevRow.length === 8) {
          prevRow.push(orphanText);
        } else {
          cleanedRows.push(row);
        }
      } else {
        // It is a continuation of the previous row's concept!
        // Index 7 is Concept in user's layout (0:Artist, 1:Country, 2:Email, 3:Title, 4:Medium, 5:Dim, 6:Unit, 7:Concept, 8:Image)
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
 * Follows the user's exact column sequence:
 * 0: Artist (ชื่อศิลปิน)
 * 1: Country (ประเทศ)
 * 2: Email (email)
 * 3: Title (ชื่อผลงาน)
 * 4: Medium (เทคนิค)
 * 5: Dimensions (ขนาด)
 * 6: Unit (หน่วยวัด)
 * 7: Concept (concept)
 * 8: Image URL (รูปภาพ / URL)
 */
export function parseTabularText(fullText: string): DetectedArtworkFields[] {
  if (!fullText || !fullText.trim()) return [];

  const allRows = parseTableRows(fullText);
  if (allRows.length === 0) return [];

  const firstLineCols = allRows[0].map((c) => c.toLowerCase());

  // Check if first line contains header keywords
  const isHeaderRow = firstLineCols.some((col) =>
    ['artist', 'ศิลปิน', 'country', 'ประเทศ', 'สัญชาติ', 'email', 'อีเมล', 'title', 'ชื่อ', 'ชื่องาน', 'ชื่อผลงาน', 'medium', 'เทคนิค', 'dimension', 'ขนาด', 'unit', 'หน่วย', 'concept', 'แนวคิด', 'image', 'url', 'ภาพ', 'รูป'].some((kw) =>
      col.includes(kw)
    )
  );

  let headerMap: {
    artist?: number;
    country?: number;
    email?: number;
    title?: number;
    medium?: number;
    dimensions?: number;
    unit?: number;
    year?: number;
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

    // If headers were found and mapped
    if (isHeaderRow && Object.keys(headerMap).length >= 2) {
      const artistName = (headerMap.artist !== undefined ? cols[headerMap.artist] || '' : '').trim();
      let artistCountry = (headerMap.country !== undefined ? cols[headerMap.country] || '' : '').trim();
      if (artistCountry) {
        const detected = detectCountry(artistCountry);
        if (detected) artistCountry = detected;
      }
      const artistEmail = (headerMap.email !== undefined ? cols[headerMap.email] || '' : '').trim();
      const title = (headerMap.title !== undefined ? cols[headerMap.title] || '' : '').trim();
      const medium = (headerMap.medium !== undefined ? cols[headerMap.medium] || '' : '').trim();
      
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

      const rawYear = headerMap.year !== undefined ? cols[headerMap.year] || '' : '';
      const yearCreated = detectYear(rawYear);
      const concept = (headerMap.concept !== undefined ? cols[headerMap.concept] || '' : '').trim();
      const imageUrl = (headerMap.imageUrl !== undefined ? cols[headerMap.imageUrl] || '' : '').trim();

      if (title || artistName || imageUrl || concept) {
        results.push({
          title,
          artistName,
          artistCountry,
          artistEmail,
          medium,
          dimensions,
          yearCreated,
          concept,
          imageUrl,
        });
      }
    } else {
      // Positional Mapping (Without Header Row)
      // Exactly as requested:
      // 0: Artist Name (ชื่อศิลปิน)
      // 1: Country (ประเทศ)
      // 2: Email (email)
      // 3: Title (ชื่อผลงาน)
      // 4: Medium (เทคนิค)
      // 5: Dimensions (ขนาด)
      // 6: Unit (หน่วยวัด)
      // 7: Concept (concept)
      // 8: Image URL (รูปภาพ)
      if (cols.length >= 2) {
        let artistName = (cols[0] || '').trim();
        let artistCountry = (cols[1] || '').trim();
        let artistEmail = '';
        let title = '';
        let medium = '';
        let rawDim = '';
        let rawUnit = '';
        let concept = '';
        let imageUrl = '';

        // Check if cols[2] is email
        if (cols.length >= 8) {
          artistEmail = (cols[2] || '').trim();
          title = (cols[3] || '').trim();
          medium = (cols[4] || '').trim();
          rawDim = (cols[5] || '').trim();
          rawUnit = (cols[6] || '').trim();
          concept = (cols[7] || '').trim();
          imageUrl = (cols[8] || '').trim();
        } else if (cols.length === 7) {
          // If 7 columns: check if cols[2] has '@'
          if ((cols[2] || '').includes('@')) {
            artistEmail = (cols[2] || '').trim();
            title = (cols[3] || '').trim();
            medium = (cols[4] || '').trim();
            rawDim = (cols[5] || '').trim();
            concept = (cols[6] || '').trim();
          } else {
            // No email column: 0:Artist, 1:Country, 2:Title, 3:Medium, 4:Dimensions, 5:Unit, 6:Concept
            title = (cols[2] || '').trim();
            medium = (cols[3] || '').trim();
            rawDim = (cols[4] || '').trim();
            rawUnit = (cols[5] || '').trim();
            concept = (cols[6] || '').trim();
          }
        } else {
          // General 3-6 columns
          title = (cols[3] || cols[2] || '').trim();
          medium = (cols[4] || cols[3] || '').trim();
          rawDim = (cols[5] || cols[4] || '').trim();
          concept = (cols[6] || cols[5] || '').trim();
        }

        // Normalize country if matched
        const detectedCountry = detectCountry(artistCountry);
        if (detectedCountry) {
          artistCountry = detectedCountry;
        }

        // Combine dimensions + unit
        let dimensions = rawDim;
        if (rawDim && rawUnit) {
          if (!rawDim.toLowerCase().includes(rawUnit.toLowerCase())) {
            dimensions = `${rawDim} ${rawUnit}`;
          }
        } else if (rawDim && !/(?:cm|ซม|mm|m|in)/i.test(rawDim) && /\d+\s*[x×X]\s*\d+/.test(rawDim)) {
          dimensions = `${rawDim} cm.`;
        }

        if (title || artistName || imageUrl || concept) {
          results.push({
            title,
            artistName,
            artistCountry,
            artistEmail,
            medium,
            dimensions,
            yearCreated: '',
            concept,
            imageUrl,
          });
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
  const parsedRows = parseTableRows(rawText);
  const cols = (parsedRows[0] || []).filter((c) => c.length > 0);

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

