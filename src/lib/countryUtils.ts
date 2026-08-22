export const COUNTRY_CODE_MAP: Record<string, string> = {
  // Asia
  thailand: 'th',
  thai: 'th',
  ไทย: 'th',
  ประเทศไทย: 'th',
  japan: 'jp',
  japanese: 'jp',
  ญี่ปุ่น: 'jp',
  'south korea': 'kr',
  korea: 'kr',
  korean: 'kr',
  เกาหลี: 'kr',
  เกาหลีใต้: 'kr',
  'north korea': 'kp',
  เกาหลีเหนือ: 'kp',
  china: 'cn',
  chinese: 'cn',
  จีน: 'cn',
  taiwan: 'tw',
  ไต้หวัน: 'tw',
  'hong kong': 'hk',
  ฮ่องกง: 'hk',
  macau: 'mo',
  มาเก๊า: 'mo',
  singapore: 'sg',
  singaporean: 'sg',
  สิงคโปร์: 'sg',
  malaysia: 'my',
  malaysian: 'my',
  มาเลเซีย: 'my',
  vietnam: 'vn',
  vietnamese: 'vn',
  เวียดนาม: 'vn',
  indonesia: 'id',
  indonesian: 'id',
  อินโดนีเซีย: 'id',
  philippines: 'ph',
  filipino: 'ph',
  ฟิลิปปินส์: 'ph',
  myanmar: 'mm',
  burma: 'mm',
  burmese: 'mm',
  พม่า: 'mm',
  เมียนมา: 'mm',
  เมียนมาร์: 'mm',
  cambodia: 'kh',
  cambodian: 'kh',
  กัมพูชา: 'kh',
  เขมร: 'kh',
  laos: 'la',
  laotian: 'la',
  ลาว: 'la',
  brunei: 'bn',
  บรูไน: 'bn',
  india: 'in',
  indian: 'in',
  อินเดีย: 'in',
  pakistan: 'pk',
  ปากีสถาน: 'pk',
  bangladesh: 'bd',
  บังกลาเทศ: 'bd',
  'sri lanka': 'lk',
  ศรีลังกา: 'lk',
  nepal: 'np',
  เนปาล: 'np',
  bhutan: 'bt',
  ภูฏาน: 'bt',
  maldives: 'mv',
  มัลดีฟส์: 'mv',
  mongolia: 'mn',
  มองโกเลีย: 'mn',

  // Middle East
  'united arab emirates': 'ae',
  uae: 'ae',
  ดูไบ: 'ae',
  สหรัฐอาหรับเอมิเรตส์: 'ae',
  'saudi arabia': 'sa',
  ซาอุดีอาระเบีย: 'sa',
  israel: 'il',
  israeli: 'il',
  อิสราเอล: 'il',
  turkey: 'tr',
  turkiye: 'tr',
  turkish: 'tr',
  ตุรกี: 'tr',
  ทูร์เคีย: 'tr',
  syria: 'sy',
  ซีเรีย: 'sy',
  iran: 'ir',
  อิหร่าน: 'ir',
  iraq: 'iq',
  อิรัก: 'iq',
  kurdistan: 'krd',
  kurdish: 'krd',
  เคอร์ดิสถาน: 'krd',
  เคิร์ด: 'krd',
  qatar: 'qa',
  กาตาร์: 'qa',
  kuwait: 'kw',
  คูเวต: 'kw',
  jordan: 'jo',
  จอร์แดน: 'jo',
  lebanon: 'lb',
  เลบานอน: 'lb',
  oman: 'om',
  โอมาน: 'om',

  // Europe
  italy: 'it',
  italian: 'it',
  อิตาลี: 'it',
  france: 'fr',
  french: 'fr',
  ฝรั่งเศส: 'fr',
  germany: 'de',
  german: 'de',
  เยอรมนี: 'de',
  เยอรมัน: 'de',
  'united kingdom': 'gb',
  uk: 'gb',
  britain: 'gb',
  british: 'gb',
  england: 'gb',
  'great britain': 'gb',
  สหราชอาณาจักร: 'gb',
  อังกฤษ: 'gb',
  spain: 'es',
  spanish: 'es',
  สเปน: 'es',
  netherlands: 'nl',
  dutch: 'nl',
  holland: 'nl',
  เนเธอร์แลนด์: 'nl',
  ฮอลแลนด์: 'nl',
  switzerland: 'ch',
  swiss: 'ch',
  สวิตเซอร์แลนด์: 'ch',
  สวิส: 'ch',
  sweden: 'se',
  swedish: 'se',
  สวีเดน: 'se',
  norway: 'no',
  norwegian: 'no',
  นอร์เวย์: 'no',
  denmark: 'dk',
  danish: 'dk',
  เดนมาร์ก: 'dk',
  finland: 'fi',
  finnish: 'fi',
  ฟินแลนด์: 'fi',
  belgium: 'be',
  belgian: 'be',
  เบลเยียม: 'be',
  austria: 'at',
  austrian: 'at',
  ออสเตรีย: 'at',
  portugal: 'pt',
  portuguese: 'pt',
  โปรตุเกส: 'pt',
  greece: 'gr',
  greek: 'gr',
  กรีซ: 'gr',
  ireland: 'ie',
  irish: 'ie',
  ไอร์แลนด์: 'ie',
  poland: 'pl',
  polish: 'pl',
  โปแลนด์: 'pl',
  russia: 'ru',
  russian: 'ru',
  รัสเซีย: 'ru',
  ukraine: 'ua',
  ยูเครน: 'ua',
  'czech republic': 'cz',
  czechia: 'cz',
  เช็ก: 'cz',
  hungary: 'hu',
  ฮังการี: 'hu',
  romania: 'ro',
  โรมาเนีย: 'ro',
  iceland: 'is',
  ไอซ์แลนด์: 'is',
  croatia: 'hr',
  โครเอเชีย: 'hr',
  serbia: 'rs',
  เซอร์เบีย: 'rs',
  slovakia: 'sk',
  สโลวาเกีย: 'sk',
  slovenia: 'si',
  สโลวีเนีย: 'si',
  bulgaria: 'bg',
  บัลแกเรีย: 'bg',
  estonia: 'ee',
  เอสโตเนีย: 'ee',
  latvia: 'lv',
  ลัตเวีย: 'lv',
  lithuania: 'lt',
  ลิทัวเนีย: 'lt',
  luxembourg: 'lu',
  ลักเซมเบิร์ก: 'lu',
  monaco: 'mc',
  โมนาโก: 'mc',
  malta: 'mt',
  มอลตา: 'mt',
  cyprus: 'cy',
  ไซปรัส: 'cy',

  // Americas
  'united states': 'us',
  usa: 'us',
  america: 'us',
  american: 'us',
  สหรัฐอเมริกา: 'us',
  สหรัฐ: 'us',
  อเมริกา: 'us',
  canada: 'ca',
  canadian: 'ca',
  แคนาดา: 'ca',
  mexico: 'mx',
  mexican: 'mx',
  เม็กซิโก: 'mx',
  brazil: 'br',
  brazilian: 'br',
  บราซิล: 'br',
  argentina: 'ar',
  argentine: 'ar',
  อาร์เจนตินา: 'ar',
  chile: 'cl',
  ชิลี: 'cl',
  colombia: 'co',
  โคลอมเบีย: 'co',
  peru: 'pe',
  เปรู: 'pe',
  cuba: 'cu',
  คิวบา: 'cu',
  jamaica: 'jm',
  จาเมกา: 'jm',
  'costa rica': 'cr',
  คอสตาริกา: 'cr',
  panama: 'pa',
  ปานามา: 'pa',
  uruguay: 'uy',
  อุรุกวัย: 'uy',

  // Oceania
  australia: 'au',
  australian: 'au',
  ออสเตรเลีย: 'au',
  'new zealand': 'nz',
  นิวซีแลนด์: 'nz',

  // Africa
  egypt: 'eg',
  egyptian: 'eg',
  อียิปต์: 'eg',
  'south africa': 'za',
  แอฟริกาใต้: 'za',
  morocco: 'ma',
  โมร็อกโก: 'ma',
  kenya: 'ke',
  เคนยา: 'ke',
  nigeria: 'ng',
  ไนจีเรีย: 'ng',
  ghana: 'gh',
  กานา: 'gh',
};

export const ISO3_TO_ISO2: Record<string, string> = {
  tha: 'th',
  jpn: 'jp',
  kor: 'kr',
  prk: 'kp',
  chn: 'cn',
  twn: 'tw',
  hkg: 'hk',
  mac: 'mo',
  sgp: 'sg',
  mys: 'my',
  vnm: 'vn',
  idn: 'id',
  phl: 'ph',
  mmr: 'mm',
  khm: 'kh',
  lao: 'la',
  brn: 'bn',
  ind: 'in',
  pak: 'pk',
  bgd: 'bd',
  lka: 'lk',
  npl: 'np',
  btn: 'bt',
  mdv: 'mv',
  mng: 'mn',
  are: 'ae',
  sau: 'sa',
  isr: 'il',
  tur: 'tr',
  syr: 'sy',
  irn: 'ir',
  irq: 'iq',
  ita: 'it',
  fra: 'fr',
  deu: 'de',
  gbr: 'gb',
  esp: 'es',
  nld: 'nl',
  che: 'ch',
  swe: 'se',
  nor: 'no',
  dnk: 'dk',
  fin: 'fi',
  bel: 'be',
  aut: 'at',
  prt: 'pt',
  grc: 'gr',
  irl: 'ie',
  pol: 'pl',
  rus: 'ru',
  ukr: 'ua',
  cze: 'cz',
  hun: 'hu',
  rou: 'ro',
  isl: 'is',
  hrv: 'hr',
  srb: 'rs',
  svk: 'sk',
  svn: 'si',
  bgr: 'bg',
  est: 'ee',
  lva: 'lv',
  ltu: 'lt',
  lux: 'lu',
  mco: 'mc',
  mlt: 'mt',
  cyp: 'cy',
  usa: 'us',
  can: 'ca',
  mex: 'mx',
  bra: 'br',
  arg: 'ar',
  chl: 'cl',
  col: 'co',
  per: 'pe',
  cub: 'cu',
  jam: 'jm',
  cri: 'cr',
  pan: 'pa',
  ury: 'uy',
  aus: 'au',
  nzl: 'nz',
  egy: 'eg',
  zaf: 'za',
  mar: 'ma',
  ken: 'ke',
  nga: 'ng',
  gha: 'gh',
};

/**
 * Resolves a country string to a 2-letter ISO code for FlagCDN
 */
export function getCountryCode(countryName?: string | null): string {
  if (!countryName) return '';
  const clean = countryName.toLowerCase().trim();
  if (!clean) return '';

  // 1. Direct 2-letter ISO code match (e.g. "th", "it", "jp", "us", "gb", "fr")
  if (clean.length === 2 && /^[a-z]{2}$/.test(clean)) {
    return clean;
  }

  // 2. Direct exact dictionary match
  if (COUNTRY_CODE_MAP[clean]) {
    return COUNTRY_CODE_MAP[clean];
  }

  // 3. 3-letter ISO code match (e.g. "tha", "jpn", "usa", "gbr")
  if (ISO3_TO_ISO2[clean]) {
    return ISO3_TO_ISO2[clean];
  }

  // 4. Check whole-word / token match (only for keys >= 3 chars to prevent false positives)
  for (const [key, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (key.length >= 3) {
      if (
        clean === key ||
        clean.startsWith(key + ' ') ||
        clean.endsWith(' ' + key) ||
        clean.includes(' ' + key + ' ') ||
        clean.startsWith(key + ',')
      ) {
        return code;
      }
    }
  }

  // 5. Safe substring match ONLY for unique keys with length >= 4
  for (const [key, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (key.length >= 4 && clean.includes(key)) {
      return code;
    }
  }

  return '';
}

/**
 * Converts a country name to a Unicode emoji flag (e.g. "th" -> 🇹🇭)
 */
export function getCountryFlagEmoji(countryName?: string | null): string {
  const code = getCountryCode(countryName);
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(...code.toUpperCase().split('').map((c) => 127397 + c.charCodeAt(0)));
}

/**
 * Custom High-Resolution Flag Image URLs for Autonomous / Cultural Regions
 */
export const CUSTOM_FLAG_URLS: Record<string, string> = {
  krd: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Kurdistan.svg/160px-Flag_of_Kurdistan.svg.png',
  kurdistan: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Kurdistan.svg/160px-Flag_of_Kurdistan.svg.png',
  kurdish: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Kurdistan.svg/160px-Flag_of_Kurdistan.svg.png',
  'เคอร์ดิสถาน': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Kurdistan.svg/160px-Flag_of_Kurdistan.svg.png',
  'เคิร์ด': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Kurdistan.svg/160px-Flag_of_Kurdistan.svg.png',
  tibet: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Flag_of_Tibet.svg/160px-Flag_of_Tibet.svg.png',
  'ทิเบต': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Flag_of_Tibet.svg/160px-Flag_of_Tibet.svg.png',
  'ธิเบต': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Flag_of_Tibet.svg/160px-Flag_of_Tibet.svg.png',
};

/**
 * Returns Flag Image URL (e.g. https://flagcdn.com/w80/th.png or Custom Regional Flag URL)
 */
export function getFlagImageUrl(countryName?: string | null): string {
  if (!countryName) return '';
  const clean = countryName.trim().toLowerCase();

  // 1. Check custom direct regional flag URLs first (e.g. Kurdistan, Tibet)
  for (const [key, url] of Object.entries(CUSTOM_FLAG_URLS)) {
    if (clean === key || clean.includes(key)) {
      return url;
    }
  }

  const code = getCountryCode(countryName);
  if (!code) return '';

  if (CUSTOM_FLAG_URLS[code]) {
    return CUSTOM_FLAG_URLS[code];
  }

  return `https://flagcdn.com/w80/${code}.png`;
}
