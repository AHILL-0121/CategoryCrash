'use client';

import type { Player } from '@/lib/types';

interface PlayerCardProps {
  player: Player;
  rank?: number;
  showScore?: boolean;
}

const avatarColors = [
  'bg-crash-red',
  'bg-volt-green',
  'bg-coral',
  'bg-yellow-400',
  'bg-blue-500',
  'bg-purple-500',
];

export function PlayerCard({ player, rank, showScore = false }: PlayerCardProps) {
  const colorIndex = parseInt(player.id.slice(-1), 36) % avatarColors.length;
  const avatarColor = avatarColors[colorIndex];

  return (
    <div
      className="
        flex items-center gap-3.5 px-5 py-3.5
        border-b-[1.5px] border-press-black last:border-b-0
        hover:bg-black/[0.02] transition-colors
      "
    >
      <div
        className={`
          w-9 h-9 rounded-full border-[2.5px] border-press-black
          flex items-center justify-center
          font-anton text-lg text-white
          ${avatarColor}
        `}
      >
        {player.name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-epilogue font-semibold text-sm">
            {player.name}
          </span>
          {player.isHost && (
            <span className="font-anton text-[10px] tracking-wider px-2 py-0.5 bg-crash-red text-white rounded-sm">
              HOST
            </span>
          )}
        </div>
        {showScore && (
          <span className="font-mono text-xs text-muted">
            {player.score} pts
          </span>
        )}
      </div>

      {rank !== undefined && (
        <div className="font-anton text-2xl text-press-black/30">
          #{rank}
        </div>
      )}

      {player.hasSubmitted && (
        <div className="w-2 h-2 rounded-full bg-volt-green animate-pulse" />
      )}
    </div>
  );
}
