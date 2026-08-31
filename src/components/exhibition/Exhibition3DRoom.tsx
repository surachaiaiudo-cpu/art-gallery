'use client';

import React, { useState } from 'react';
import { Exhibition, Artwork } from '@/types/exhibition';
import { Modern3DGalleryEngine } from './3d/Modern3DGalleryEngine';
import { ArtworkLightbox } from './ArtworkLightbox';
import { ArtworkInquiryModal } from './ArtworkInquiryModal';

interface Exhibition3DRoomProps {
  exhibition: Exhibition;
  onSwitchTo2D?: () => void;
}

export function Exhibition3DRoom({ exhibition, onSwitchTo2D }: Exhibition3DRoomProps) {
  const [lightboxArtwork, setLightboxArtwork] = useState<Artwork | null>(null);
  const [inquiryArtwork, setInquiryArtwork] = useState<Artwork | null>(null);

  const artworks = exhibition.artworks || [];

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0D0C0B]">
      {/* Modern 3D Web Gallery Engine */}
      <Modern3DGalleryEngine
        exhibition={exhibition}
        onSwitchTo2D={onSwitchTo2D}
        onOpenLightbox={(art) => setLightboxArtwork(art)}
        onOpenInquiry={(art) => setInquiryArtwork(art)}
      />

      {/* High-Resolution Artwork Lightbox (HD Deep-Zoom) */}
      <ArtworkLightbox
        artwork={lightboxArtwork}
        artworksList={artworks}
        isOpen={Boolean(lightboxArtwork)}
        onClose={() => setLightboxArtwork(null)}
        onSelectArtwork={(art) => setLightboxArtwork(art)}
        onOpenInquiry={(art) => {
          setLightboxArtwork(null);
          setInquiryArtwork(art);
        }}
      />

      {/* Collector / Curatorial Inquiry Modal */}
      <ArtworkInquiryModal
        artwork={inquiryArtwork}
        isOpen={Boolean(inquiryArtwork)}
        onClose={() => setInquiryArtwork(null)}
      />
    </div>
  );
}
