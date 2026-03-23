'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const [showCountdown, setShowCountdown] = useState(false);
  const prevPhaseRef = useRef<string | null>(null);
  const prevRoundPhaseRef = useRef<string | null>(null);

  const {
    room,
    isConnected,
    myPlayerId,
    error: serverError,
    submitAnswer,
    vote,
    startGame,
    restartGame,
    updateSettings,
  } = useGameRoom({ roomId, playerName });

  useEffect(() => {
    if (serverError) {
      setError(serverError);
      showToast(serverError, 'error');
      // Clear error after 5 seconds
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [serverError, showToast]);

  // Handle game phase changes with toasts
  useEffect(() => {
    if (!room) return;

    // Game started
    if (prevPhaseRef.current === 'lobby' && room.phase === 'playing') {
      showToast('Game started! Get ready! 🎮', 'success');
    }

    // Game finished
    if (prevPhaseRef.current === 'playing' && room.phase === 'finished') {
      showToast('Game Over! Calculating results... 🏆', 'info');
    }

    prevPhaseRef.current = room.phase;
  }, [room?.phase, showToast]);

  // Handle round phase changes with toasts
  useEffect(() => {
    if (!room?.currentRound) return;

    const roundPhase = room.currentRound.phase;

    // Voting phase started
    if (prevRoundPhaseRef.current === 'answering' && roundPhase === 'voting') {
      showToast('Time\'s up! Validating answers... ⏱️', 'info');
    }

    // Scores phase started
    if (prevRoundPhaseRef.current === 'voting' && roundPhase === 'scores') {
      showToast('Round complete! Check the scores 📊', 'success');
    }

    prevRoundPhaseRef.current = roundPhase;
  }, [room?.currentRound?.phase, showToast]);

  // Handle revealing phase countdown
  useEffect(() => {
    if (room?.phase === 'playing' && room.currentRound?.phase === 'revealing') {
      setShowCountdown(true);
    }
  }, [room?.phase, room?.currentRound?.phase]);

  // Redirect to results when game is finished
  useEffect(() => {
    if (room?.phase === 'finished') {
      setTimeout(() => {
        router.push(`/room/${roomId}/results?name=${encodeURIComponent(playerName)}`);
      }, 3000);
    }
  }, [room?.phase, roomId, playerName, router]);

  // Wrap submitAnswer with toast
  const handleSubmitAnswer = (answer: string) => {
    submitAnswer(answer);
    showToast('Answer locked in! 🔒', 'success');
  };

  // Wrap vote with toast
  const handleVote = (targetPlayerId: string, valid: boolean) => {
    vote(targetPlayerId, valid);
    showToast(valid ? 'Voted valid ✓' : 'Voted invalid ✕', 'info');
  };

  // Wrap startGame with toast
  const handleStartGame = () => {
    startGame();
    showToast('Starting game...', 'info');
  };

  if (!isConnected || !room) {
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
          {/* Revealing/Countdown Phase */}
          {showCountdown && room.currentRound.phase === 'revealing' && (
            <CountdownScreen
              roundNumber={room.currentRound.number}
              categories={room.currentRound.categories}
              onComplete={() => setShowCountdown(false)}
              maxRounds={room.maxRounds}
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
            />
          )}

          {/* Score Phase */}
          {room.currentRound.phase === 'scores' && (
            <ScoreView
              players={Object.values(room.players)}
              roundNumber={room.currentRound.number}
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
