'use client';

import { useState, useEffect, useCallback } from 'react';
import usePartySocket from 'partysocket/react';
import type { GameRoom, ServerMessage, ClientMessage } from '@/lib/types';

interface UseGameRoomOptions {
  roomId: string;
  playerName: string;
  host?: string; // PartyKit host URL
}

interface UseGameRoomReturn {
  room: GameRoom | null;
  isConnected: boolean;
  myPlayerId: string | null;
  error: string | null;
  submitAnswer: (answer: string) => void;
  vote: (targetPlayerId: string, valid: boolean) => void;
  startGame: () => void;
  restartGame: () => void;
  leaveRoom: () => void;
  updateSettings: (settings: Partial<GameRoom['settings']>, maxRounds?: number) => void;
}

export function useGameRoom({
  roomId,
  playerName,
  host,
}: UseGameRoomOptions): UseGameRoomReturn {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const partyHost = host || process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

  const socket = usePartySocket({
    host: partyHost,
    // partyserver routes by Durable Object binding name (kebab-cased).
    party: 'category-crash-room',
    room: roomId,
    onMessage: (evt) => {
      try {
        handleServerMessage(JSON.parse(evt.data) as ServerMessage);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    },
    onOpen: () => {
      console.log('Connected to room:', roomId);
      setIsConnected(true);
    },
    onClose: () => {
      console.log('Disconnected from room:', roomId);
      setIsConnected(false);
    },
    onError: (err) => {
      console.error('PartySocket error:', err);
      setIsConnected(false);
    },
  });

  // Handle incoming server messages
  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      // The server tells us our own connection id. Never infer identity from the
      // display name — names are not unique and change on de-duplication.
      case 'connection:ready':
        setMyPlayerId(message.data.connectionId);
        break;

      case 'room:state':
        setRoom(message.data);
        break;

      case 'player:left':
        setRoom(prev => {
          if (!prev) return prev;
          const { [message.data.id]: _removed, ...remainingPlayers } = prev.players;
          return { ...prev, players: remainingPlayers };
        });
        break;

      case 'round:start':
        setRoom(prev => {
          if (!prev) return prev;
          // Reset every player's submission state for the new round.
          const resetPlayers = { ...prev.players };
          Object.keys(resetPlayers).forEach(playerId => {
            resetPlayers[playerId] = {
              ...resetPlayers[playerId],
              hasSubmitted: false,
              answer: undefined,
              submittedAt: undefined,
            };
          });
          return {
            ...prev,
            players: resetPlayers,
            currentRound: message.data,
            phase: 'playing',
          };
        });
        break;

      case 'round:phase':
        setRoom(prev => {
          if (!prev || !prev.currentRound) return prev;
          return {
            ...prev,
            currentRound: { ...prev.currentRound, phase: message.data.phase },
          };
        });
        break;

      case 'answer:locked':
        setRoom(prev => {
          if (!prev || !prev.players[message.data.playerId]) return prev;
          return {
            ...prev,
            players: {
              ...prev.players,
              [message.data.playerId]: {
                ...prev.players[message.data.playerId],
                hasSubmitted: true,
              },
            },
          };
        });
        break;

      // Sent once when voting opens, then again once the AI verdicts land.
      case 'round:reveal':
        setRoom(prev => {
          if (!prev || !prev.currentRound) return prev;
          return {
            ...prev,
            currentRound: { ...prev.currentRound, answers: message.data.answers },
          };
        });
        break;

      case 'round:scores':
        setRoom(prev => {
          if (!prev) return prev;
          const updatedPlayers = { ...prev.players };
          message.data.players.forEach(player => {
            updatedPlayers[player.id] = player;
          });
          return {
            ...prev,
            players: updatedPlayers,
            currentRound: prev.currentRound
              ? { ...prev.currentRound, answers: message.data.answers }
              : prev.currentRound,
          };
        });
        break;

      case 'game:over':
        setRoom(prev => {
          if (!prev) return prev;
          const updatedPlayers = { ...prev.players };
          message.data.leaderboard.forEach(player => {
            updatedPlayers[player.id] = player;
          });
          return {
            ...prev,
            phase: 'finished',
            players: updatedPlayers,
            roundHistory: message.data.roundHistory,
          };
        });
        break;

      case 'error':
        console.error('Server error:', message.data.message);
        setError(message.data.message);
        break;

      default:
        console.log('Unhandled message:', message);
    }
  }, []);

  // Join on EVERY open, not just the first. partysocket reconnects on its own
  // after a drop; without a fresh join the socket comes back but the server has
  // no player record bound to the new connection id, so the user becomes a
  // ghost whose answers are silently discarded. The server treats a repeat join
  // from a known name as a reconnect and restores the seat, score and answer.
  useEffect(() => {
    if (!isConnected || !socket || !playerName) return;
    socket.send(JSON.stringify({ type: 'player:join', data: { name: playerName } }));
  }, [isConnected, socket, playerName]);

  // Clear a transient error so the same message can be shown again later.
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  const sendMessage = useCallback((message: ClientMessage) => {
    socket?.send(JSON.stringify(message));
  }, [socket]);

  const submitAnswer = useCallback((answer: string) => {
    sendMessage({ type: 'answer:submit', data: { answer } });
  }, [sendMessage]);

  const vote = useCallback((targetPlayerId: string, valid: boolean) => {
    sendMessage({ type: 'vote:submit', data: { targetPlayerId, valid } });
  }, [sendMessage]);

  const startGame = useCallback(() => {
    sendMessage({ type: 'game:start' });
  }, [sendMessage]);

  const restartGame = useCallback(() => {
    sendMessage({ type: 'game:restart' });
  }, [sendMessage]);

  const leaveRoom = useCallback(() => {
    sendMessage({ type: 'player:leave' });
  }, [sendMessage]);

  const updateSettings = useCallback((settings: Partial<GameRoom['settings']>, maxRounds?: number) => {
    sendMessage({ type: 'settings:update', data: { settings, maxRounds } });
  }, [sendMessage]);

  return {
    room,
    isConnected,
    myPlayerId,
    error,
    submitAnswer,
    vote,
    startGame,
    restartGame,
    leaveRoom,
    updateSettings,
  };
}
