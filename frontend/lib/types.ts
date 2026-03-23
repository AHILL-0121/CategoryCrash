// ─── Type Definitions ───
export type GamePhase = 'lobby' | 'playing' | 'finished';
export type RoundPhase = 'revealing' | 'answering' | 'voting' | 'scores';

// ─── Player ───
export interface Player {
  id: string;           // PartyKit connection ID
  name: string;         // Display name (entered at lobby)
  score: number;        // Cumulative score
  isHost: boolean;      // First to join = host
  hasSubmitted: boolean;// Current round submission status
  answer?: string;      // Current round answer (hidden until reveal)
  submittedAt?: number; // Timestamp for speed scoring
}

// ─── Round ───
export interface Round {
  number: number;       // 1–10
  categories: [string, string]; // e.g. ["Things that are RED", "Things in a KITCHEN"]
  phase: RoundPhase;    // revealing | answering | voting | scores
  startedAt: number;    // Unix timestamp
  answers: Record<string, {
    text: string;
    submittedAt: number;
    votes: Record<string, boolean>; // playerId → valid/invalid (deprecated, now using AI)
    aiValidation?: {
      valid: boolean;
      reason: string;
    };
  }>;
  timeLimit: number;    // Default 20000ms
  aiValidation?: {
    possibleAnswers: string[];
    fetchedAt: number;
  };
}

// ─── GameRoom ───
export interface GameRoom {
  id: string;           // Room code e.g. "CRASH-4821"
  players: Record<string, Player>;
  currentRound: Round | null;
  roundHistory: Round[];
  phase: GamePhase;     // lobby | playing | finished
  maxRounds: number;    // Default 10
  settings: {
    timeLimit: number;  // Time per round in ms (default 20000)
    maxPlayers: number; // Max players allowed (default 6)
    enableVoting: boolean; // Enable manual voting fallback (default true)
    difficulty: 'easy' | 'medium' | 'hard'; // Category difficulty
    revealTime: number; // Time to show categories before answering (default 3000ms)
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
  | { type: 'room:state'; data: GameRoom }
  | { type: 'player:joined'; data: Player }
  | { type: 'player:left'; data: { id: string } }
  | { type: 'round:start'; data: Round }
  | { type: 'round:phase'; data: { phase: RoundPhase } }
  | { type: 'answer:locked'; data: { playerId: string } }
  | { type: 'round:reveal'; data: { answers: Round['answers'] } }
  | { type: 'round:scores'; data: { players: Player[] } }
  | { type: 'game:over'; data: { leaderboard: Player[]; roundHistory: Round[] } }
  | { type: 'timer:tick'; data: { remaining: number } }
  | { type: 'error'; data: { message: string } };
