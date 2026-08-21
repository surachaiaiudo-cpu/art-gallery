'use client';

import React, { useState } from 'react';
import { Exhibition, is3DEnabled } from '@/types/exhibition';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Exhibition2DGrid } from './Exhibition2DGrid';
import { ExhibitionCarousel } from './ExhibitionCarousel';
import { Exhibition3DRoom } from './Exhibition3DRoom';

interface ExhibitionViewSwitcherProps {
  exhibition: Exhibition;
  initialMode?: '2d' | 'carousel' | '3d';
}

export function ExhibitionViewSwitcher({
  exhibition,
  initialMode = '2d',
}: ExhibitionViewSwitcherProps) {
  const allowedInitialMode = !is3DEnabled(exhibition) && initialMode === '3d' ? '2d' : initialMode;
  const [mode, setMode] = useState<'2d' | 'carousel' | '3d'>(allowedInitialMode);

  return (
    <div className="min-h-screen flex flex-col bg-[#F9F8F6] text-[#1E1D1B]">
      {/* Top Navbar with 2D / Carousel / 3D Mode Toggle */}
      <Navbar
        exhibition={exhibition}
        currentMode={mode}
        onModeChange={setMode}
      />

      {/* Main Content: 2D Grid / Carousel Slider / 3D Virtual Gallery */}
      <main className="flex-1 w-full relative">
        {mode === '2d' ? (
          <div className="animate-fade-in">
            <Exhibition2DGrid exhibition={exhibition} />
          </div>
        ) : mode === 'carousel' ? (
          <div className="animate-fade-in">
            <ExhibitionCarousel exhibition={exhibition} />
          </div>
        ) : (
          <div className="animate-fade-in w-full">
            <Exhibition3DRoom
              exhibition={exhibition}
              onSwitchTo2D={() => setMode('2d')}
            />
          </div>
        )}
      </main>

      {/* Footer (shown in 2D and Carousel modes) */}
      {mode !== '3d' && <Footer exhibition={exhibition} />}
    </div>
  );
}
