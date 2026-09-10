// ─── Type Definitions ───
// These mirror the authoritative definitions in `party/index.ts`. Keep them in
// sync — a field declared here but absent on the server reads as `undefined` at
// runtime while TypeScript insists it exists.
export type GamePhase = 'lobby' | 'playing' | 'finished';
export type RoundPhase = 'revealing' | 'answering' | 'voting' | 'scores';
export type Difficulty = 'easy' | 'medium' | 'hard';

// ─── Setting bounds (mirrors LIMITS in party/index.ts) ───
export const LIMITS = {
  maxRounds: { min: 3, max: 15 },
  timeLimit: { min: 10_000, max: 60_000 },
  revealTime: { min: 2_000, max: 10_000 },
  votingTime: { min: 5_000, max: 30_000 },
  maxPlayers: { min: 2, max: 6 },
  answerLength: 80,
  nameLength: 20,
} as const;

// ─── Player ───
export interface Player {
  id: string;           // PartyKit connection ID
  name: string;         // Display name (entered at lobby, de-duplicated)
  score: number;        // Cumulative score
  isHost: boolean;      // First to join = host
  hasSubmitted: boolean;// Current round submission status
  connected: boolean;   // False while the seat is held for a reconnect
  answer?: string;      // Current round answer (hidden until reveal)
  submittedAt?: number; // Timestamp for speed scoring
}

// ─── Answer ───
export interface AnswerRecord {
  text: string;
  submittedAt: number;
  votes: Record<string, boolean>; // playerId → valid/invalid (manual fallback)
  aiValidation?: {
    valid: boolean;
    reason: string;
  };
}

// ─── Round ───
export interface Round {
  number: number;
  categories: [string, string]; // e.g. ["Things that are RED", "Things in a KITCHEN"]
  phase: RoundPhase;
  startedAt: number;    // Unix timestamp
  answers: Record<string, AnswerRecord>;
  timeLimit: number;    // Answering window in ms
  votingTime: number;   // Voting/reveal window in ms
  aiValidation?: {
    possibleAnswers: string[];
    fetchedAt: number;
  };
}

// ─── GameRoom ───
export interface GameRoom {
  id: string;           // Room code e.g. "CRA-SH4"
  players: Record<string, Player>;
  currentRound: Round | null;
  roundHistory: Round[];
  phase: GamePhase;
  maxRounds: number;    // Default 10
  settings: {
    timeLimit: number;    // Time per round in ms (default 20000)
    maxPlayers: number;   // Max players allowed (default 6)
    enableVoting: boolean;// Manual voting fallback when the AI is undecided
    difficulty: Difficulty; // Category difficulty tier
    revealTime: number;   // Category reveal window in ms (default 5000)
    votingTime: number;   // Voting window in ms (default 15000)
  };
}

// ─── WebSocket Messages ───

// Client → Server
export type ClientMessage =
  | { type: 'player:join'; data: { name: string } }
  | { type: 'player:leave' }
  | { type: 'game:start' }
  | { type: 'answer:submit'; data: { answer: string } }
  | { type: 'vote:submit'; data: { targetPlayerId: string; valid: boolean } }
  | { type: 'settings:update'; data: { settings?: Partial<GameRoom['settings']>; maxRounds?: number } }
  | { type: 'game:restart' };

// Server → Client
export type ServerMessage =
  | { type: 'connection:ready'; data: { connectionId: string } }
  | { type: 'room:state'; data: GameRoom }
  | { type: 'player:left'; data: { id: string } }
  | { type: 'round:start'; data: Round }
  | { type: 'round:phase'; data: { phase: RoundPhase } }
  | { type: 'answer:locked'; data: { playerId: string } }
  | { type: 'round:reveal'; data: { answers: Round['answers'] } }
  | { type: 'round:scores'; data: { players: Player[]; answers: Round['answers'] } }
  | { type: 'game:over'; data: { leaderboard: Player[]; roundHistory: Round[] } }
  | { type: 'error'; data: { message: string } };
