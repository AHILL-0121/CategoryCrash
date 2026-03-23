'use client';

import { ReactNode } from 'react';

interface RoundIndicatorProps {
  currentRound: number;
  totalRounds: number;
}

export function RoundIndicator({ currentRound, totalRounds }: RoundIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      <div className="font-mono text-xs tracking-widest uppercase text-muted">
        Round {currentRound} / {totalRounds}
      </div>
      <div className="flex items-center gap-2">
        {Array.from({ length: totalRounds }, (_, i) => (
          <div
            key={i}
            className={`
              w-2 h-2 rounded-full transition-all
              ${i < currentRound - 1
                ? 'bg-volt-green border-[1.5px] border-volt-green'
                : i === currentRound - 1
                ? 'bg-crash-red  border-[1.5px] border-crash-red w-2.5 h-2.5'
                : 'bg-cream border-[1.5px] border-ink-gray'}
            `}
          />
        ))}
      </div>
    </div>
  );
}
