'use client';

import React from 'react';

interface TooltipBubbleProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

export function TooltipBubble({
  content,
  position = 'top',
  children,
  className = '',
}: TooltipBubbleProps) {
  if (!content) return <>{children}</>;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[#1C1A17] border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[#1C1A17] border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[#1C1A17] border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[#1C1A17] border-t-transparent border-b-transparent border-l-transparent',
  };

  return (
    <div className={`relative group inline-flex items-center justify-center ${className}`}>
      {children}
      <div
        role="tooltip"
        className={`absolute ${positionClasses[position]} z-50 pointer-events-none opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 ease-out whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#1C1A17]/95 backdrop-blur-md text-[#FAF8F5] text-[11px] font-medium border border-[#C5A880]/30 shadow-xl shadow-black/40`}
      >
        <span>{content}</span>
        {/* Tiny triangular pointer */}
        <span
          className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
