'use client';

import React from 'react';
import Image from 'next/image';

const COUNTRY_CODE_MAP: Record<string, string> = {
  thailand: 'th',
  thai: 'th',
  th: 'th',
  ไทย: 'th',
  ประเทศไทย: 'th',
  italy: 'it',
  italian: 'it',
  it: 'it',
  อิตาลี: 'it',
  japan: 'jp',
  japanese: 'jp',
  jp: 'jp',
  ญี่ปุ่น: 'jp',
  france: 'fr',
  french: 'fr',
  fr: 'fr',
  ฝรั่งเศส: 'fr',
  australia: 'au',
  australian: 'au',
  au: 'au',
  ออสเตรเลีย: 'au',
  usa: 'us',
  'united states': 'us',
  america: 'us',
  american: 'us',
  us: 'us',
  สหรัฐอเมริกา: 'us',
  uk: 'gb',
  'united kingdom': 'gb',
  britain: 'gb',
  british: 'gb',
  england: 'gb',
  gb: 'gb',
  สหราชอาณาจักร: 'gb',
  อังกฤษ: 'gb',
  germany: 'de',
  german: 'de',
  de: 'de',
  เยอรมนี: 'de',
  china: 'cn',
  chinese: 'cn',
  cn: 'cn',
  จีน: 'cn',
  korea: 'kr',
  'south korea': 'kr',
  korean: 'kr',
  kr: 'kr',
  เกาหลี: 'kr',
  เกาหลีใต้: 'kr',
  spain: 'es',
  spanish: 'es',
  es: 'es',
  สเปน: 'es',
  netherlands: 'nl',
  dutch: 'nl',
  holland: 'nl',
  nl: 'nl',
  เนเธอร์แลนด์: 'nl',
  singapore: 'sg',
  sg: 'sg',
  สิงคโปร์: 'sg',
  vietnam: 'vn',
  vn: 'vn',
  เวียดนาม: 'vn',
  malaysia: 'my',
  my: 'my',
  มาเลเซีย: 'my',
  switzerland: 'ch',
  swiss: 'ch',
  ch: 'ch',
  สวิตเซอร์แลนด์: 'ch',
  canada: 'ca',
  ca: 'ca',
  แคนาดา: 'ca',
  sweden: 'se',
  se: 'se',
  สวีเดน: 'se',
  norway: 'no',
  no: 'no',
  นอร์เวย์: 'no',
  denmark: 'dk',
  dk: 'dk',
  เดนมาร์ก: 'dk',
};

/**
 * Resolves a country string to a 2-letter ISO code for FlagCDN
 */
export function getCountryCode(countryName?: string | null): string {
  if (!countryName) return 'th';
  const clean = countryName.toLowerCase().trim();

  // Check direct map
  if (COUNTRY_CODE_MAP[clean]) {
    return COUNTRY_CODE_MAP[clean];
  }

  // Check partial substring match
  for (const [key, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (clean.includes(key)) {
      return code;
    }
  }

  return 'th'; // default fallback to Thailand
}

/**
 * Returns Flag Image URL (e.g. https://flagcdn.com/w80/th.png)
 */
export function getFlagImageUrl(countryName?: string | null): string {
  const code = getCountryCode(countryName);
  return `https://flagcdn.com/w80/${code}.png`;
}

interface CountryFlagProps {
  country?: string | null;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'badge';
  shape?: 'circle' | 'rounded' | 'square';
}

export function CountryFlag({
  country,
  className = '',
  size = 'md',
  shape = 'rounded',
}: CountryFlagProps) {
  const code = getCountryCode(country);
  const flagUrl = `https://flagcdn.com/w80/${code}.png`;

  let sizeClasses = 'w-6 h-4';
  if (size === 'xs') sizeClasses = 'w-4 h-3';
  else if (size === 'sm') sizeClasses = 'w-5 h-3.5';
  else if (size === 'md') sizeClasses = 'w-6 h-4';
  else if (size === 'lg') sizeClasses = 'w-8 h-5.5';
  else if (size === 'badge') sizeClasses = 'w-full h-full';

  let shapeClasses = 'rounded-[2px]';
  if (shape === 'circle') shapeClasses = 'rounded-full';
  else if (shape === 'square') shapeClasses = 'rounded-none';

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden border border-black/15 shadow-sm bg-neutral-100 shrink-0 ${sizeClasses} ${shapeClasses} ${className}`}
      title={country || 'Country'}
    >
      <img
        src={flagUrl}
        alt={country || 'Flag'}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </span>
  );
}
