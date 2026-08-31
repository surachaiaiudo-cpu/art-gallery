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
    <div
      className={`flex flex-col bg-[#F9F8F6] text-[#1E1D1B] ${
        mode === '3d'
          ? 'h-[100dvh] w-full overflow-hidden fixed inset-0 z-10'
          : 'min-h-screen'
      }`}
    >
      {/* Top Navbar: On desktop show normally, on mobile in 3D mode hide to maximize 3D canvas viewport */}
      <div className={mode === '3d' ? 'hidden md:block shrink-0' : 'block shrink-0'}>
        <Navbar
          exhibition={exhibition}
          currentMode={mode}
          onModeChange={setMode}
        />
      </div>

      {/* Main Content: 2D Grid / Carousel Slider / 3D Virtual Gallery */}
      <main
        className={`w-full relative ${
          mode === '3d' ? 'flex-1 h-full overflow-hidden' : 'flex-1'
        }`}
      >
        {mode === '2d' ? (
          <div className="animate-fade-in">
            <Exhibition2DGrid exhibition={exhibition} />
          </div>
        ) : mode === 'carousel' ? (
          <div className="animate-fade-in">
            <ExhibitionCarousel exhibition={exhibition} />
          </div>
        ) : (
          <div className="animate-fade-in w-full h-full">
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
