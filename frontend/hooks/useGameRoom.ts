'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [error, setError] = useState<string | null>(null);
  const hasJoined = useRef(false);

  const partyHost = host || process.env.NEXT_PUBLIC_PARTYKIT_HOST || 'localhost:1999';

  // PartySocket connection
  const socket = usePartySocket({
    host: partyHost,
    room: roomId,
    onMessage: (evt) => {
      try {
        const message: ServerMessage = JSON.parse(evt.data);
        handleServerMessage(message);
      } catch (err) {
        console.error('Failed to parse message:', err);
      }
    },
    onOpen: () => {
      console.log('Connected to room:', roomId);
      // Auto-join when connection opens
      if (!hasJoined.current && playerName) {
        sendMessage({ type: 'player:join', data: { name: playerName } });
        hasJoined.current = true;
      }
    },
    onClose: () => {
      console.log('Disconnected from room:', roomId);
    },
    onError: (err) => {
      console.error('PartySocket error:', err);
    },
  });

  // Handle incoming server messages
  const handleServerMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case 'room:state':
        setRoom(message.data);
        // Set my player ID from the room state
        const myPlayer = Object.values(message.data.players).find(
          p => p.name === playerName
        );
        if (myPlayer) {
          setMyPlayerId(myPlayer.id);
          console.log('Found my player:', myPlayer.id, 'isHost:', myPlayer.isHost);
        } else {
          console.warn('Could not find player with name:', playerName, 'Available players:', Object.values(message.data.players).map(p => p.name));
        }
        break;

      case 'player:joined':
        setRoom(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: {
              ...prev.players,
              [message.data.id]: message.data,
            },
          };
        });
        // Try to set myPlayerId if not already set
        if (!myPlayerId && message.data.name === playerName) {
          setMyPlayerId(message.data.id);
          console.log('Set myPlayerId from player:joined:', message.data.id, 'isHost:', message.data.isHost);
        }
        break;

      case 'player:left':
        setRoom(prev => {
          if (!prev) return prev;
          const { [message.data.id]: removed, ...remainingPlayers } = prev.players;
          return {
            ...prev,
            players: remainingPlayers,
          };
        });
        break;

      case 'round:start':
        setRoom(prev => {
          if (!prev) return prev;
          // Reset all players' hasSubmitted status for the new round
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
            currentRound: {
              ...prev.currentRound,
              phase: message.data.phase,
            },
          };
        });
        break;

      case 'answer:locked':
        setRoom(prev => {
          if (!prev) return prev;
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

      case 'round:reveal':
        setRoom(prev => {
          if (!prev || !prev.currentRound) return prev;
          return {
            ...prev,
            currentRound: {
              ...prev.currentRound,
              answers: message.data.answers,
            },
          };
        });
        break;

      case 'round:scores':
        setRoom(prev => {
          if (!prev) return prev;
          const updatedPlayers = { ...prev.players };
          message.data.players.forEach(player => {
            if (updatedPlayers[player.id]) {
              updatedPlayers[player.id] = player;
            }
          });
          return {
            ...prev,
            players: updatedPlayers,
          };
        });
        break;

      case 'game:over':
        setRoom(prev => {
          if (!prev) return prev;
          // Update players from leaderboard and store roundHistory
          const updatedPlayers = { ...prev.players };
          message.data.leaderboard.forEach(player => {
            if (updatedPlayers[player.id]) {
              updatedPlayers[player.id] = player;
            }
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
  }, [playerName]);

  // Send message to server
  const sendMessage = useCallback((message: ClientMessage) => {
    if (socket) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  // Public API methods
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
    isConnected: !!socket,
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
