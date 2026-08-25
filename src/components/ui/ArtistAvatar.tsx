'use client';

import React from 'react';
import { getOptimizedImageUrl } from '@/lib/imagekit';

interface ArtistAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
}

const sizeMap = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-base font-bold',
  xl: 'w-16 h-16 text-xl font-bold',
  '2xl': 'w-24 h-24 text-3xl font-bold',
};

export function ArtistAvatar({
  name = 'Artist',
  avatarUrl,
  size = 'md',
  className = '',
}: ArtistAvatarProps) {
  const sizeClass = sizeMap[size] || sizeMap.md;
  const cleanName = (name || 'A').trim();
  const initial = cleanName.charAt(0).toUpperCase();

  // If artist has an uploaded avatar and it is not an unsplash mockup
  if (
    avatarUrl &&
    avatarUrl.trim() &&
    !avatarUrl.includes('unsplash.com/photo-1507003211169') &&
    !avatarUrl.includes('unsplash.com/photo-1534528741775')
  ) {
    const optimizedUrl = getOptimizedImageUrl(avatarUrl, { width: 160, quality: 75 });
    return (
      <div className={`relative rounded-full overflow-hidden shrink-0 bg-[#26201B] ${sizeClass} ${className}`}>
        <img
          src={optimizedUrl}
          alt={cleanName}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  // Blank avatar with initial letter and luxury styling (No mockup photo)
  return (
    <div
      className={`rounded-full shrink-0 flex items-center justify-center font-serif uppercase tracking-wider bg-gradient-to-br from-[#2D241E] to-[#171310] text-[#D8C7B0] border border-[#C5A880]/30 shadow-inner select-none ${sizeClass} ${className}`}
      title={cleanName}
    >
      <span>{initial}</span>
    </div>
  );
}
