'use client';

import type { GameRoom } from '@/lib/types';
import { PlayerCard } from '../ui/PlayerCard';
import { Button } from '../ui/Button';
import { RoomCode } from '../ui/RoomCode';
import { RoomSettings } from './RoomSettings';

interface LobbyViewProps {
  room: GameRoom;
  myPlayerId: string | null;
  onStartGame: () => void;
  onUpdateSettings: (settings: Partial<GameRoom['settings']>, maxRounds?: number) => void;
}

export function LobbyView({ room, myPlayerId, onStartGame, onUpdateSettings }: LobbyViewProps) {
  const players = Object.values(room.players);
  const canStart = players.length >= 2 && room.players[myPlayerId || '']?.isHost;

  return (
    <div className="w-full max-w-[520px] mx-auto px-5 py-10 flex flex-col gap-4">
      {/* Logo */}
      <div className="flex justify-center mb-2">
        <img
          src="/categorycrash-wordmark.svg"
          alt="CategoryCrash"
          className="w-full max-w-[360px] h-auto"
        />
      </div>

      {/* Header with room code */}
      <div
        className="
          flex items-center justify-between
          px-6 py-5 border-[2.5px] border-press-black
          rounded-[16px] bg-press-black shadow-brutal-lg
        "
      >
        <div>
          <h1 className="font-anton text-2xl text-white tracking-wide">
            WAITING ROOM
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Waiting for players to join...
          </p>
        </div>
        <RoomCode code={room.id} />
      </div>

      {/* Player list */}
      <div className="border-[2.5px] border-press-black rounded-[16px] bg-cream shadow-brutal overflow-hidden">
        <div className="px-5 py-3.5 border-b-[2.5px] border-press-black flex items-center justify-between bg-newsprint">
          <h2 className="font-anton text-sm tracking-widest uppercase">
            Players
          </h2>
          <span className="font-mono text-xs text-muted">
            {players.length}/{room.settings.maxPlayers}
          </span>
        </div>
        <div>
          {players.map((player) => (
            <PlayerCard key={player.id} player={player} />
          ))}
        </div>
      </div>

      {/* Start button (host only) */}
      {canStart && (
        <Button onClick={onStartGame} variant="red" className="w-full">
          🚀 START GAME
        </Button>
      )}

      {!canStart && players.length < 2 && (
        <div className="text-center py-4">
          <p className="font-mono text-sm text-muted">
            Need at least 2 players to start
          </p>
        </div>
      )}

      {/* Room Settings (host only) */}
      <RoomSettings
        settings={room.settings}
        maxRounds={room.maxRounds}
        isHost={room.players[myPlayerId || '']?.isHost || false}
        onUpdateSettings={onUpdateSettings}
      />

      {/* How to play */}
      <div className="border-[2.5px] border-press-black rounded-[16px] bg-newsprint p-5 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[110px] text-center">
          <div className="font-anton text-3xl leading-none text-crash-red">1</div>
          <p className="text-xs text-muted mt-1 leading-snug">
            Type an answer that fits BOTH categories
          </p>
        </div>
        <div className="font-anton text-xl text-ink-gray self-center pt-1.5">→</div>
        <div className="flex-1 min-w-[110px] text-center">
          <div className="font-anton text-3xl leading-none text-crash-red">2</div>
          <p className="text-xs text-muted mt-1 leading-snug">
            Vote on other players&rsquo; answers
          </p>
        </div>
        <div className="font-anton text-xl text-ink-gray self-center pt-1.5">→</div>
        <div className="flex-1 min-w-[110px] text-center">
          <div className="font-anton text-3xl leading-none text-crash-red">3</div>
          <p className="text-xs text-muted mt-1 leading-snug">
            Score points and climb the leaderboard
          </p>
        </div>
      </div>
    </div>
  );
}
