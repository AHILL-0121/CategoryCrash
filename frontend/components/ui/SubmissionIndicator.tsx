'use client';

import { PlayerAvatar } from './PlayerAvatar';

interface SubmissionIndicatorProps {
  players: Array<{
    id: string;
    name: string;
    hasSubmitted: boolean;
  }>;
  currentUserId?: string;
}

export function SubmissionIndicator({ players, currentUserId }: SubmissionIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
      {players.map((player, index) => {
        const isCurrentUser = player.id === currentUserId;
        const playerName = isCurrentUser ? 'You' : player.name;

        return (
          <div
            key={player.id}
            className={`
              flex items-center gap-2 px-3 py-2
              border-[2px] border-press-black rounded-[8px]
              transition-all
              ${player.hasSubmitted
                ? 'bg-volt-green/20 border-volt-green'
                : 'bg-cream border-ink-gray'}
            `}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <PlayerAvatar name={player.name} size="sm" />
            <div className="font-mono text-xs font-medium">
              {playerName}
            </div>
            {player.hasSubmitted && (
              <div className="text-volt-green text-sm font-bold">✓</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
