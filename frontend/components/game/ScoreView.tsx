'use client';

import type { Player } from '@/lib/types';
import { PlayerCard } from '../ui/PlayerCard';

interface ScoreViewProps {
  players: Player[];
  roundNumber: number;
}

export function ScoreView({ players, roundNumber }: ScoreViewProps) {
  // Sort by score
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];

  return (
    <div className="w-full max-w-[600px] mx-auto px-5 py-10 flex flex-col gap-6">
      {/* Round complete */}
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <img
            src="/categorycrash-emblem.svg"
            alt="Round Complete"
            className="w-20 h-20 animate-pulse-glow"
          />
        </div>
        <h2 className="font-anton text-4xl text-press-black mb-2">
          ROUND {roundNumber} COMPLETE
        </h2>
        <p className="font-mono text-sm text-muted">
          Next round starting soon...
        </p>
      </div>

      {/* Round winner */}
      {winner && (
        <div className="text-center py-6 bg-crash-red/10 border-[2.5px] border-crash-red rounded-[16px]">
          <div className="font-anton text-sm tracking-widest uppercase text-muted mb-2">
            Round Winner
          </div>
          <div className="font-anton text-3xl text-crash-red">
            {winner.name}
          </div>
        </div>
      )}

      {/* Leaderboard */}
      <div className="border-[2.5px] border-press-black rounded-[16px] bg-cream shadow-brutal overflow-hidden">
        <div className="px-5 py-3.5 border-b-[2.5px] border-press-black flex items-center justify-between bg-newsprint">
          <h3 className="font-anton text-sm tracking-widest uppercase">
            Leaderboard
          </h3>
          <span className="font-mono text-xs text-muted">
            After Round {roundNumber}
          </span>
        </div>
        <div>
          {sortedPlayers.map((player, index) => (
            <PlayerCard
              key={player.id}
              player={player}
              rank={index + 1}
              showScore
            />
          ))}
        </div>
      </div>
    </div>
  );
}
