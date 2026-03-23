'use client';

import { useState, useEffect } from 'react';

interface CountdownScreenProps {
  roundNumber: number;
  categories: [string, string];
  onComplete: () => void;
  maxRounds?: number;
}

export function CountdownScreen({ roundNumber, categories, onComplete, maxRounds = 10 }: CountdownScreenProps) {
  const [count, setCount] = useState(3);
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev === 1) {
          clearInterval(interval);
          setShowCategories(true);
          setTimeout(onComplete, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (!showCategories) {
    return (
      <div className="fixed inset-0 z-50 bg-press-black flex flex-col items-center justify-center gap-6">
        <div className="font-mono text-xs tracking-widest uppercase text-muted animate-pulse">
          Round {roundNumber} of {maxRounds} — Get Ready
        </div>
        <div className="font-anton text-[140px] sm:text-[200px] leading-none text-crash-red" 
             style={{
               animation: 'countdown-pop 0.5s cubic-bezier(.2,1.4,.3,1)',
               textShadow: '8px 8px 0 rgba(255,32,32,0.2)',
             }}>
          {count}
        </div>
        <div className="font-mono text-sm text-muted">
          Categories revealing...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-press-black flex items-center justify-center p-5" style={{ animation: 'fade-in 0.3s ease-in' }}>
      <div className="text-center max-w-[680px] flex flex-col gap-8">
        <div className="font-anton text-2xl sm:text-4xl text-white tracking-wider mb-2">
          ROUND {roundNumber} CATEGORIES
        </div>

        {/* Categories display */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {/* Category 1 */}
          <div
            className="
              font-anton text-lg sm:text-2xl tracking-wide
              px-6 sm:px-8 py-4 border-[2.5px] border-press-black
              rounded-[12px] bg-crash-red text-white
              shadow-brutal-lg
            "
            style={{
              animation: 'bounce-in 0.6s cubic-bezier(.2,1,.3,1)',
            }}
          >
            {categories[0]}
          </div>

          {/* Divider */}
          <div className="font-anton text-3xl text-ink-gray opacity-40">✕</div>

          {/* Category 2 */}
          <div
            className="
              font-anton text-lg sm:text-2xl tracking-wide
              px-6 sm:px-8 py-4 border-[2.5px] border-press-black
              rounded-[12px] bg-volt-green text-press-black
              shadow-brutal-lg
            "
            style={{
              animation: 'bounce-in 0.6s cubic-bezier(.2,1,.3,1) 0.2s both',
            }}
          >
            {categories[1]}
          </div>
        </div>

        <div className="font-mono text-xs text-muted tracking-widest uppercase mt-4">
          3... 2... 1... START!
        </div>
      </div>

      <style>{`
        @keyframes countdown-pop {
          from {
            transform: scale(1.8) rotateX(20deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotateX(0);
            opacity: 1;
          }
        }

        @keyframes bounce-in {
          from {
            transform: scale(0.6) translateY(20px);
            opacity: 0;
          }
          to {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
