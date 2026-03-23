'use client';

import { useCountdown } from '@/hooks/useCountdown';

interface TimerBarProps {
  duration: number;
  active: boolean;
  onComplete?: () => void;
}

export function TimerBar({ duration, active, onComplete }: TimerBarProps) {
  const { percentage, seconds } = useCountdown({ duration, active, onComplete });

  const getColor = () => {
    if (percentage > 50) return 'bg-volt-green';
    if (percentage > 20) return 'bg-coral';
    return 'bg-crash-red';
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-xs text-muted tracking-widest uppercase">
          Time Remaining
        </span>
        <span className="font-anton text-2xl text-press-black">
          {seconds}s
        </span>
      </div>
      <div className="w-full h-3 bg-ink-gray/30 rounded-full overflow-hidden border-[1.5px] border-press-black">
        <div
          className={`h-full transition-all duration-100 ${getColor()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
