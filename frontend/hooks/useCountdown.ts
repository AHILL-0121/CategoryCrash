'use client';

import { useState, useEffect } from 'react';

interface UseCountdownOptions {
  duration: number;  // Duration in milliseconds
  active: boolean;   // Whether countdown is active
  onComplete?: () => void;
}

interface UseCountdownReturn {
  remaining: number;    // Remaining time in milliseconds
  percentage: number;   // Percentage remaining (0-100)
  seconds: number;      // Remaining seconds (rounded)
}

export function useCountdown({
  duration,
  active,
  onComplete,
}: UseCountdownOptions): UseCountdownReturn {
  const [remaining, setRemaining] = useState(duration);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    if (active) {
      setStartTime(Date.now());
      setRemaining(duration);
    } else {
      setStartTime(null);
    }
  }, [active, duration]);

  useEffect(() => {
    if (!active || startTime === null) return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newRemaining = Math.max(0, duration - elapsed);

      setRemaining(newRemaining);

      if (newRemaining === 0) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [active, startTime, duration, onComplete]);

  const percentage = (remaining / duration) * 100;
  const seconds = Math.ceil(remaining / 1000);

  return { remaining, percentage, seconds };
}
