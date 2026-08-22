'use client';

import React from 'react';
import { getCountryCode, getCountryFlagEmoji, getFlagImageUrl, COUNTRY_CODE_MAP, ISO3_TO_ISO2 } from '@/lib/countryUtils';

export { getCountryCode, getCountryFlagEmoji, getFlagImageUrl, COUNTRY_CODE_MAP, ISO3_TO_ISO2 };

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

  let sizeClasses = 'w-6 h-4';
  if (size === 'xs') sizeClasses = 'w-4 h-3';
  else if (size === 'sm') sizeClasses = 'w-5 h-3.5';
  else if (size === 'md') sizeClasses = 'w-6 h-4';
  else if (size === 'lg') sizeClasses = 'w-8 h-5.5';
  else if (size === 'badge') sizeClasses = 'w-full h-full';

  let shapeClasses = 'rounded-[2px]';
  if (shape === 'circle') shapeClasses = 'rounded-full';
  else if (shape === 'square') shapeClasses = 'rounded-none';

  if (!code) {
    return (
      <span
        className={`inline-flex items-center justify-center text-xs overflow-hidden border border-black/10 shadow-sm bg-neutral-100 shrink-0 ${sizeClasses} ${shapeClasses} ${className}`}
        title={country || 'Country'}
      >
        🌐
      </span>
    );
  }

  const flagUrl = getFlagImageUrl(country);

  return (
    <span
      className={`inline-flex items-center justify-center overflow-hidden border border-black/15 shadow-sm bg-neutral-100 shrink-0 ${sizeClasses} ${shapeClasses} ${className}`}
      title={country || code.toUpperCase()}
    >
      <img
        src={flagUrl}
        alt={country || code.toUpperCase()}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </span>
  );
}
