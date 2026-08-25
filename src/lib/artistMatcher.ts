/**
 * Cleans and normalizes an artist name for robust comparison
 * Handles academic titles, honorifics, Thai/English parentheses, multiple spaces
 * e.g. "Asst. Prof. Bundit Inkong" -> "bundit inkong"
 * e.g. "ผศ. บัณฑิต อินคง (Bundit Inkong)" -> "บัณฑิต อินคง bundit inkong"
 */
export function normalizeArtistName(name?: string | null): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(
      /\b(asst\.\s*prof\.|assoc\.\s*prof\.|prof\.|dr\.|mr\.|mrs\.|ms\.|ph\.d\.|ผศ\.\s*ดร\.|รศ\.\s*ดร\.|ศ\.\s*ดร\.|ผศ\.|รศ\.|ศ\.|ดร\.|อาจารย์|อ\.|นาย|นาง|นางสาว|คุณ)\b/gi,
      ' '
    )
    .replace(/[()[\]"''`{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts distinct lowercase tokens (words >= 2 chars) from a name
 */
export function getNameTokens(name?: string | null): string[] {
  const normalized = normalizeArtistName(name);
  if (!normalized) return [];
  return normalized.split(' ').filter((w) => w.length >= 2);
}

export interface ArtistCandidate {
  id: string;
  name: string;
  email?: string | null;
  country?: string | null;
  flagEmoji?: string | null;
  [key: string]: any;
}

export interface MatchInput {
  name?: string | null;
  email?: string | null;
  country?: string | null;
}

/**
 * Finds the best matching artist from an existing candidate pool
 */
export function findMatchingArtist<T extends ArtistCandidate>(
  candidates: T[],
  input: MatchInput
): T | null {
  if (!candidates || candidates.length === 0) return null;

  const rawInputEmail = (input.email || '').toLowerCase().trim();
  const isRealEmail =
    rawInputEmail &&
    rawInputEmail.includes('@') &&
    !rawInputEmail.includes('@artvara-artists.com') &&
    !rawInputEmail.includes('@artvara.gallery');

  // 1. Match by real Email (Highest confidence)
  if (isRealEmail) {
    const emailMatch = candidates.find(
      (c) => c.email && c.email.toLowerCase().trim() === rawInputEmail
    );
    if (emailMatch) return emailMatch;
  }

  const inputName = (input.name || '').trim();
  if (!inputName) return null;

  const normInput = normalizeArtistName(inputName);
  if (!normInput) return null;

  // 2. Exact match on raw name (case-insensitive)
  const exactMatch = candidates.find(
    (c) => (c.name || '').toLowerCase().trim() === inputName.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  // 3. Exact match on normalized name (collapses multiple spaces, removes parentheses)
  const normMatch = candidates.find(
    (c) => normalizeArtistName(c.name) === normInput
  );
  if (normMatch) return normMatch;

  // 4. Token-set match (handles "First Last" vs "Last First" or extra middle names)
  const inputTokens = getNameTokens(inputName);
  if (inputTokens.length >= 2) {
    const inputTokenSet = new Set(inputTokens);

    for (const c of candidates) {
      const candidateTokens = getNameTokens(c.name);
      if (candidateTokens.length >= 2) {
        // Check if all input tokens exist in candidate tokens or vice versa
        const allInCandidate = inputTokens.every((t) => candidateTokens.includes(t));
        const allInInput = candidateTokens.every((t) => inputTokenSet.has(t));

        if (allInCandidate || allInInput) {
          return c;
        }
      }
    }
  }

  // 5. High-similarity substring match for single long tokens (>= 6 chars)
  if (normInput.length >= 6) {
    for (const c of candidates) {
      const normCand = normalizeArtistName(c.name);
      if (normCand && (normCand.includes(normInput) || normInput.includes(normCand))) {
        // If countries match or either is missing, high confidence match
        const cCountry = (c.country || '').toLowerCase().trim();
        const inCountry = (input.country || '').toLowerCase().trim();
        if (!cCountry || !inCountry || cCountry === inCountry) {
          return c;
        }
      }
    }
  }

  return null;
}
