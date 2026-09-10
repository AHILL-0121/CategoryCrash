'use client';

import { useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useGameRoom } from '@/hooks/useGameRoom';
import { useToast } from '@/contexts/ToastContext';
import { LobbyView } from '@/components/game/LobbyView';
import { AnswerView } from '@/components/game/AnswerView';
import { VotingView } from '@/components/game/VotingView';
import { ScoreView } from '@/components/game/ScoreView';
import { CountdownScreen } from '@/components/ui/CountdownScreen';

type GameRoomClientProps = {
  roomId: string;
};

export function GameRoomClient({ roomId }: GameRoomClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const playerName = searchParams.get('name') || 'Player';
  const prevPhaseRef = useRef<string | null>(null);
  const prevRoundPhaseRef = useRef<string | null>(null);

  const {
    room,
    isConnected,
    myPlayerId,
    error,
    submitAnswer,
    vote,
    startGame,
    updateSettings,
  } = useGameRoom({ roomId, playerName });

  useEffect(() => {
    if (error) showToast(error, 'error');
  }, [error, showToast]);

  // Game phase changes
  useEffect(() => {
    if (!room) return;

    if (prevPhaseRef.current === 'lobby' && room.phase === 'playing') {
      showToast('Game started! Get ready! 🎮', 'success');
    }
    if (prevPhaseRef.current === 'playing' && room.phase === 'finished') {
      showToast('Game Over! Calculating results... 🏆', 'info');
    }

    prevPhaseRef.current = room.phase;
  }, [room, showToast]);

  // Round phase changes
  useEffect(() => {
    const roundPhase = room?.currentRound?.phase;
    if (!roundPhase) return;

    if (prevRoundPhaseRef.current === 'answering' && roundPhase === 'voting') {
      showToast('Time\'s up! Validating answers... ⏱️', 'info');
    }
    if (prevRoundPhaseRef.current === 'voting' && roundPhase === 'scores') {
      showToast('Round complete! Check the scores 📊', 'success');
    }

    prevRoundPhaseRef.current = roundPhase;
  }, [room?.currentRound?.phase, showToast]);

  // Redirect to results when the game is finished
  useEffect(() => {
    if (room?.phase !== 'finished') return;
    const timer = setTimeout(() => {
      router.push(`/room/${roomId}/results?name=${encodeURIComponent(playerName)}`);
    }, 3000);
    return () => clearTimeout(timer);
  }, [room?.phase, roomId, playerName, router]);

  const handleSubmitAnswer = (answer: string) => {
    submitAnswer(answer);
    showToast('Answer locked in! 🔒', 'success');
  };

  const handleVote = (targetPlayerId: string, valid: boolean) => {
    vote(targetPlayerId, valid);
    showToast(valid ? 'Voted valid ✓' : 'Voted invalid ✕', 'info');
  };

  const handleStartGame = () => {
    startGame();
    showToast('Starting game...', 'info');
  };

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <img
              src="/categorycrash-pixel-icon.png"
              alt="CategoryCrash"
              className="w-20 h-20 animate-pulse-glow"
            />
          </div>
          <div className="font-anton text-4xl text-press-black mb-4 animate-pulse-glow">
            CONNECTING...
          </div>
          <div className="font-mono text-sm text-muted">
            Joining room {roomId}
          </div>
        </div>
      </div>
    );
  }

  const myPlayer = myPlayerId ? room.players[myPlayerId] : null;

  return (
    <main className="min-h-screen">
      {/* Reconnect banner — the seat is held server-side while this shows. */}
      {!isConnected && (
        <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto bg-coral text-press-black px-4 py-3 rounded border-2 border-press-black shadow-brutal z-50">
          <p className="font-mono text-sm">Connection lost — reconnecting…</p>
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="fixed top-4 left-4 right-4 max-w-sm mx-auto bg-crash-red text-white px-4 py-3 rounded border-2 border-press-black shadow-brutal z-50">
          <p className="font-mono text-sm">{error}</p>
        </div>
      )}

      {/* Lobby Phase */}
      {room.phase === 'lobby' && (
        <LobbyView
          room={room}
          myPlayerId={myPlayerId}
          onStartGame={handleStartGame}
          onUpdateSettings={updateSettings}
        />
      )}

      {/* Playing Phase */}
      {room.phase === 'playing' && room.currentRound && (
        <>
          {/* Revealing Phase — driven purely by the server's phase, so the
              categories stay on screen for the whole reveal window. */}
          {room.currentRound.phase === 'revealing' && (
            <CountdownScreen
              key={room.currentRound.number}
              roundNumber={room.currentRound.number}
              categories={room.currentRound.categories}
              maxRounds={room.maxRounds}
              revealTime={room.settings.revealTime}
            />
          )}

          {/* Answering Phase */}
          {room.currentRound.phase === 'answering' && (
            <AnswerView
              round={room.currentRound}
              players={Object.values(room.players)}
              onSubmit={handleSubmitAnswer}
              hasSubmitted={myPlayer?.hasSubmitted || false}
              maxRounds={room.maxRounds}
            />
          )}

          {/* Voting Phase */}
          {room.currentRound.phase === 'voting' && (
            <VotingView
              round={room.currentRound}
              players={room.players}
              myPlayerId={myPlayerId}
              onVote={handleVote}
              enableVoting={room.settings.enableVoting}
            />
          )}

          {/* Score Phase */}
          {room.currentRound.phase === 'scores' && (
            <ScoreView
              players={Object.values(room.players)}
              round={room.currentRound}
              maxRounds={room.maxRounds}
            />
          )}
        </>
      )}

      {/* Finished Phase */}
      {room.phase === 'finished' && (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="font-anton text-5xl text-crash-red mb-4">
              GAME OVER!
            </div>
            <div className="font-mono text-sm text-muted">
              Redirecting to results...
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
