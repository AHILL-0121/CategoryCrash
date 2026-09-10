'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useToast } from '@/contexts/ToastContext';
import { Button } from '@/components/ui/Button';
import { PlayerCard } from '@/components/ui/PlayerCard';
import { getRoundWinner } from '@/lib/rounds';

type ResultsClientProps = {
  roomId: string;
};

export function ResultsClient({ roomId }: ResultsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const playerName = searchParams.get('name') || 'Player';

  const { room, myPlayerId, restartGame } = useGameRoom({ roomId, playerName });

  // The host's restart flips the server room back to `lobby`. Without following
  // it, every player sits on a stale results page while a fresh lobby waits.
  useEffect(() => {
    if (room?.phase !== 'lobby') return;
    router.push(`/room/${roomId}?name=${encodeURIComponent(playerName)}`);
  }, [room?.phase, roomId, playerName, router]);

  const handlePlayAgain = () => {
    restartGame();
    showToast('Starting new game... 🎮', 'success');
  };

  const handleCopyLink = () => {
    const url = window.location.origin + `/room/${roomId}`;
    navigator.clipboard.writeText(url);
    showToast('Room link copied! 📋', 'success');
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="font-anton text-4xl text-press-black mb-4 animate-pulse-glow">
            LOADING...
          </div>
        </div>
      </div>
    );
  }

  const players = Object.values(room.players);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const winner = sortedPlayers[0];
  const isHost = myPlayerId ? room.players[myPlayerId]?.isHost : false;
  const roundHistory = room.roundHistory || [];

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 bg-press-black">
      <div className="w-full max-w-[600px] flex flex-col gap-6">
        {/* Logo Header */}
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <img
              src="/categorycrash-splash-og.svg"
              alt="CategoryCrash"
              className="w-full max-w-[480px] h-auto"
            />
          </div>
          <p className="font-mono text-sm text-gray-400">
            {roundHistory.length} rounds completed
          </p>
        </div>

        {/* Winner Podium */}
        {winner && (
          <div
            className="
              text-center py-8 px-6
              bg-gradient-to-br from-crash-red/10 to-volt-green/10
              border-[2.5px] border-press-black rounded-[16px]
              shadow-brutal-lg
            "
          >
            <div className="font-anton text-xl tracking-widest uppercase text-muted mb-3">
              👑 Winner
            </div>
            <div className="font-anton text-5xl text-press-black mb-2">
              {winner.name}
            </div>
            <div className="font-mono text-2xl font-bold text-crash-red">
              {winner.score} points
            </div>
          </div>
        )}

        {/* Final Leaderboard */}
        <div className="border-[2.5px] border-press-black rounded-[16px] bg-cream shadow-brutal overflow-hidden">
          <div className="px-5 py-3.5 border-b-[2.5px] border-press-black bg-newsprint">
            <h2 className="font-anton text-sm tracking-widest uppercase">
              Final Standings
            </h2>
          </div>
          <div>
            {sortedPlayers.map((player, index) => (
              <div
                key={player.id}
                className={`
                  ${index === 0 ? 'bg-crash-red/5' : ''}
                  ${index === 1 ? 'bg-volt-green/5' : ''}
                  ${index === 2 ? 'bg-coral/5' : ''}
                `}
              >
                <PlayerCard player={player} rank={index + 1} showScore />
              </div>
            ))}
          </div>
        </div>

        {/* Round-by-Round Results */}
        {roundHistory.length > 0 && (
          <div className="border-[2.5px] border-press-black rounded-[16px] bg-cream shadow-brutal overflow-hidden">
            <div className="px-5 py-3.5 border-b-[2.5px] border-press-black bg-newsprint">
              <h2 className="font-anton text-sm tracking-widest uppercase">
                Round Winners
              </h2>
            </div>
            <div className="divide-y-[1.5px] divide-press-black/10">
              {roundHistory.map((round) => {
                const roundWinner = getRoundWinner(round, room.players, room.settings.enableVoting);
                return (
                  <div key={round.number} className="px-5 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs text-muted">
                        Round {round.number}
                      </span>
                      {roundWinner && (
                        <span className="font-anton text-sm text-press-black">
                          🏆 {roundWinner.name}
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-muted/70 mb-1">
                      {round.categories[0]} × {round.categories[1]}
                    </div>
                    {roundWinner && (
                      <div className={`font-mono text-sm ${roundWinner.invalid ? 'text-crash-red/70' : 'text-volt-green'}`}>
                        &ldquo;{roundWinner.answer}&rdquo;
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {isHost && (
            <Button
              variant="red"
              onClick={handlePlayAgain}
              className="w-full"
            >
              🔄 PLAY AGAIN
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="w-full"
          >
            ← Back to Home
          </Button>

          <div className="text-center pt-2">
            <button
              onClick={handleCopyLink}
              className="font-mono text-xs text-muted hover:text-press-black transition-colors underline"
            >
              Share room link
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
