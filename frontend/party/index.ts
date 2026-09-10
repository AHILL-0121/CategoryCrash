import type * as Party from 'partykit/server';
// Relative, not aliased: the PartyKit bundler does not read tsconfig paths.
import { matchesKnownAnswer, tokenize, uniquenessKey } from '../lib/answer-matching';

// ─── Type Definitions ───
type GamePhase = 'lobby' | 'playing' | 'finished';
type RoundPhase = 'revealing' | 'answering' | 'voting' | 'scores';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  hasSubmitted: boolean;
  connected: boolean;
  answer?: string;
  submittedAt?: number;
}

interface AnswerRecord {
  text: string;
  submittedAt: number;
  votes: Record<string, boolean>;
  aiValidation?: {
    valid: boolean;
    reason: string;
  };
}

interface Round {
  number: number;
  categories: [string, string];
  phase: RoundPhase;
  startedAt: number;
  answers: Record<string, AnswerRecord>;
  timeLimit: number;
  votingTime: number;
  aiValidation?: {
    possibleAnswers: string[];
    fetchedAt: number;
  };
}

interface GameSettings {
  timeLimit: number;
  maxPlayers: number;
  enableVoting: boolean;
  difficulty: Difficulty;
  revealTime: number;
  votingTime: number;
}

interface GameRoom {
  id: string;
  players: Record<string, Player>;
  currentRound: Round | null;
  roundHistory: Round[];
  phase: GamePhase;
  maxRounds: number;
  settings: GameSettings;
}

interface CategoryPair {
  categories: [string, string];
  difficulty: Difficulty;
}

// ─── Limits (single source of truth; the client mirrors these) ───
export const LIMITS = {
  maxRounds: { min: 3, max: 15 },
  timeLimit: { min: 10_000, max: 60_000 },
  revealTime: { min: 2_000, max: 10_000 },
  votingTime: { min: 5_000, max: 30_000 },
  maxPlayers: { min: 2, max: 6 },
  answerLength: 80,
  nameLength: 20,
} as const;

// Per-connection flood protection.
const RATE_LIMIT = { windowMs: 1_000, maxMessages: 15 };

const DEFAULT_SETTINGS: GameSettings = {
  timeLimit: 20_000,
  maxPlayers: 6,
  enableVoting: true,
  difficulty: 'medium',
  revealTime: 5_000,
  votingTime: 15_000,
};

// ─── Category Pairs ───
// Each pair requires answers that fit BOTH categories simultaneously.
// `difficulty` reflects how constrained the intersection is: `easy` pairs have
// many obvious answers, `hard` pairs need real knowledge or lateral thinking.
const categoryPairs: CategoryPair[] = [
  // ── COLOR + LOCATION/OBJECT COMBOS ──
  { categories: ["Things that are RED", "Things found in a KITCHEN"], difficulty: 'easy' },
  { categories: ["Things that are GREEN", "Things you can EAT"], difficulty: 'easy' },
  { categories: ["Things that are YELLOW", "Things that FLY"], difficulty: 'medium' },
  { categories: ["Things that are BLUE", "Things found in the OCEAN"], difficulty: 'easy' },
  { categories: ["Things that are WHITE", "Things that are COLD"], difficulty: 'easy' },
  { categories: ["Things that are ORANGE", "Things that GROW on trees"], difficulty: 'medium' },
  { categories: ["Things that are BLACK", "Animals"], difficulty: 'easy' },
  { categories: ["Things that are PINK", "Things you can WEAR"], difficulty: 'easy' },
  { categories: ["Things that are BROWN", "Things made of WOOD"], difficulty: 'easy' },
  { categories: ["Things that are PURPLE", "Things you find in a GARDEN"], difficulty: 'medium' },

  // ── ANIMALS ──
  { categories: ["Animals that can SWIM", "Things that are BIGGER than a car"], difficulty: 'medium' },
  { categories: ["Animals with FOUR LEGS", "Animals found in AFRICA"], difficulty: 'easy' },
  { categories: ["Animals that can FLY", "Animals that eat INSECTS"], difficulty: 'medium' },
  { categories: ["Animals with FUR", "Animals kept as PETS"], difficulty: 'easy' },
  { categories: ["Animals that live in WATER", "Animals you can EAT"], difficulty: 'easy' },
  { categories: ["Animals that are NOCTURNAL", "Animals with WINGS"], difficulty: 'medium' },
  { categories: ["Animals found in AUSTRALIA", "Animals that can JUMP"], difficulty: 'medium' },
  { categories: ["Animals that HIBERNATE", "Animals with CLAWS"], difficulty: 'hard' },
  { categories: ["Animals that live in the JUNGLE", "Animals that make LOUD sounds"], difficulty: 'medium' },
  { categories: ["Farm animals", "Animals that produce MILK"], difficulty: 'easy' },

  // ── FOOD & DRINK ──
  { categories: ["Foods that are SPICY", "Foods eaten for BREAKFAST"], difficulty: 'medium' },
  { categories: ["Foods that are SWEET", "Things that are ROUND"], difficulty: 'easy' },
  { categories: ["Foods from ITALY", "Foods made with CHEESE"], difficulty: 'easy' },
  { categories: ["Foods that are FRIED", "Foods from ASIA"], difficulty: 'medium' },
  { categories: ["Foods you eat with your HANDS", "Foods served at PARTIES"], difficulty: 'easy' },
  { categories: ["Foods that are SOUR", "FRUITS"], difficulty: 'easy' },
  { categories: ["Foods eaten for DESSERT", "Foods that are FROZEN"], difficulty: 'easy' },
  { categories: ["Foods that are CRUNCHY", "Foods made from VEGETABLES"], difficulty: 'easy' },
  { categories: ["Foods wrapped in BREAD", "Foods from MEXICO"], difficulty: 'medium' },
  { categories: ["Seafood", "Foods that are EXPENSIVE"], difficulty: 'medium' },

  // ── PLACES & LOCATIONS ──
  { categories: ["Things found in a SCHOOL", "Things made of WOOD"], difficulty: 'easy' },
  { categories: ["Things found in a BEDROOM", "Things that MAKE NOISE"], difficulty: 'easy' },
  { categories: ["Things found at a BEACH", "Things that are COLD"], difficulty: 'medium' },
  { categories: ["Things found in a HOSPITAL", "Things that are WHITE"], difficulty: 'easy' },
  { categories: ["Things found in an OFFICE", "Things that use ELECTRICITY"], difficulty: 'easy' },
  { categories: ["Things found in a PARK", "Things that are GREEN"], difficulty: 'easy' },
  { categories: ["Things found in a BATHROOM", "Things made of PLASTIC"], difficulty: 'easy' },
  { categories: ["Things found in a GYM", "Things that are HEAVY"], difficulty: 'easy' },
  { categories: ["Things found at an AIRPORT", "Things with WHEELS"], difficulty: 'easy' },
  { categories: ["Things found in a LIBRARY", "Things that are QUIET"], difficulty: 'easy' },

  // ── GEOGRAPHY ──
  { categories: ["Countries in ASIA", "Countries with a FLAG that has RED in it"], difficulty: 'hard' },
  { categories: ["Countries in EUROPE", "Countries that start with the letter 'S'"], difficulty: 'hard' },
  { categories: ["Countries with BEACHES", "Countries that speak SPANISH"], difficulty: 'medium' },
  { categories: ["Countries with MOUNTAINS", "Countries in SOUTH AMERICA"], difficulty: 'medium' },
  { categories: ["Island countries", "Countries in the PACIFIC"], difficulty: 'hard' },
  { categories: ["Countries that are COLD", "Countries in NORTHERN EUROPE"], difficulty: 'hard' },
  { categories: ["Countries famous for FOOD", "Countries in the MEDITERRANEAN"], difficulty: 'medium' },
  { categories: ["Countries with DESERTS", "Countries in AFRICA"], difficulty: 'medium' },
  { categories: ["Countries with RAINFORESTS", "Countries near the EQUATOR"], difficulty: 'hard' },
  { categories: ["Landlocked countries", "Countries in CENTRAL EUROPE"], difficulty: 'hard' },

  // ── SPORTS & GAMES ──
  { categories: ["Sports played with a BALL", "Sports played in WATER"], difficulty: 'medium' },
  { categories: ["Sports played in TEAMS", "Sports played on GRASS"], difficulty: 'easy' },
  { categories: ["Olympic sports", "Sports that use a RACKET"], difficulty: 'medium' },
  { categories: ["Winter sports", "Sports that are DANGEROUS"], difficulty: 'medium' },
  { categories: ["Sports played INDOORS", "Sports with a NET"], difficulty: 'easy' },
  { categories: ["Sports that involve RUNNING", "Individual sports"], difficulty: 'medium' },
  { categories: ["Sports popular in AMERICA", "Sports played with a BAT"], difficulty: 'easy' },
  { categories: ["Sports that require BALANCE", "Sports done on ICE"], difficulty: 'hard' },
  { categories: ["Extreme sports", "Sports done in the AIR"], difficulty: 'medium' },
  { categories: ["Sports watched on TV", "Sports with a BALL"], difficulty: 'easy' },

  // ── JOBS & PROFESSIONS ──
  { categories: ["Jobs that require a UNIFORM", "Jobs that involve OUTDOOR work"], difficulty: 'easy' },
  { categories: ["Jobs in HEALTHCARE", "Jobs that help PEOPLE"], difficulty: 'easy' },
  { categories: ["Jobs that require a DEGREE", "Jobs in an OFFICE"], difficulty: 'easy' },
  { categories: ["Jobs that involve TRAVEL", "Jobs that pay WELL"], difficulty: 'medium' },
  { categories: ["Jobs in ENTERTAINMENT", "Jobs that are CREATIVE"], difficulty: 'easy' },
  { categories: ["Jobs that involve ANIMALS", "Jobs done OUTDOORS"], difficulty: 'easy' },
  { categories: ["Jobs that require PHYSICAL strength", "Jobs that are DANGEROUS"], difficulty: 'medium' },
  { categories: ["Jobs in TECHNOLOGY", "Jobs that didn't exist 50 YEARS AGO"], difficulty: 'hard' },
  { categories: ["Jobs that involve FOOD", "Jobs in RESTAURANTS"], difficulty: 'easy' },
  { categories: ["Jobs that require EARLY mornings", "Jobs in TRANSPORTATION"], difficulty: 'medium' },

  // ── OBJECTS & ITEMS ──
  { categories: ["Things that use BATTERIES", "Things you carry in a BAG"], difficulty: 'easy' },
  { categories: ["Things made of METAL", "Things found in a TOOLBOX"], difficulty: 'easy' },
  { categories: ["Things that are SOFT", "Things you SLEEP with"], difficulty: 'easy' },
  { categories: ["Things that are SHARP", "Things found in a KITCHEN"], difficulty: 'easy' },
  { categories: ["Things with BUTTONS", "Things you WEAR"], difficulty: 'easy' },
  { categories: ["Things that SPIN", "Things that use ELECTRICITY"], difficulty: 'medium' },
  { categories: ["Things that FOLD", "Things made of PAPER"], difficulty: 'easy' },
  { categories: ["Things with HANDLES", "Things you CARRY"], difficulty: 'easy' },
  { categories: ["Things that BREAK easily", "Things made of GLASS"], difficulty: 'easy' },
  { categories: ["Things that are WATERPROOF", "Things you use OUTDOORS"], difficulty: 'medium' },

  // ── ENTERTAINMENT & MEDIA ──
  { categories: ["Things in a MOVIE THEATER", "Things that are DARK"], difficulty: 'easy' },
  { categories: ["Musical INSTRUMENTS", "Things made of WOOD"], difficulty: 'easy' },
  { categories: ["Things at a CONCERT", "Things that are LOUD"], difficulty: 'easy' },
  { categories: ["Video game CHARACTERS", "Things that are FICTIONAL"], difficulty: 'easy' },
  { categories: ["Things on a TV SHOW", "Things that make you LAUGH"], difficulty: 'medium' },
  { categories: ["Things at a CIRCUS", "Things that are COLORFUL"], difficulty: 'easy' },
  { categories: ["Things in a MUSEUM", "Things that are OLD"], difficulty: 'easy' },
  { categories: ["Superheroes", "Things that can FLY"], difficulty: 'easy' },
  { categories: ["Things at an AMUSEMENT PARK", "Things that SPIN"], difficulty: 'easy' },
  { categories: ["Disney characters", "Things that are ANIMATED"], difficulty: 'easy' },

  // ── NATURE/SCIENCE ──
  { categories: ["Things in SPACE", "Things that are BRIGHT"], difficulty: 'easy' },
  { categories: ["Things that GROW", "Things that need WATER"], difficulty: 'easy' },
  { categories: ["Things found in a FOREST", "Things that are TALL"], difficulty: 'easy' },
  { categories: ["Weather phenomena", "Things that are DANGEROUS"], difficulty: 'easy' },
  { categories: ["Things in the SKY", "Things that MOVE"], difficulty: 'easy' },
  { categories: ["Things underground", "Things that are VALUABLE"], difficulty: 'hard' },
  { categories: ["Things in the DESERT", "Things that survive HEAT"], difficulty: 'medium' },
  { categories: ["Things at the NORTH POLE", "Things that are WHITE"], difficulty: 'easy' },
  { categories: ["Things that are MICROSCOPIC", "Things that are ALIVE"], difficulty: 'hard' },
  { categories: ["Chemical elements", "Things that are SHINY"], difficulty: 'hard' },

  // ── TIME/SEASONS/HOLIDAYS ──
  { categories: ["Things associated with CHRISTMAS", "Things that are RED"], difficulty: 'easy' },
  { categories: ["Things associated with SUMMER", "Things that are HOT"], difficulty: 'easy' },
  { categories: ["Things associated with HALLOWEEN", "Things that are SCARY"], difficulty: 'easy' },
  { categories: ["Things you do in WINTER", "Things that involve SNOW"], difficulty: 'easy' },
  { categories: ["Things associated with BIRTHDAYS", "Things that are SWEET"], difficulty: 'easy' },
  { categories: ["Things you do at NIGHT", "Things that need LIGHT"], difficulty: 'medium' },
  { categories: ["Things from the 1990s", "Things that are NOSTALGIC"], difficulty: 'hard' },
  { categories: ["Things you do on WEEKENDS", "Things that are FUN"], difficulty: 'easy' },
  { categories: ["Things associated with SPRING", "Things that BLOOM"], difficulty: 'easy' },
  { categories: ["Things you do in the MORNING", "Things that involve WATER"], difficulty: 'medium' },

  // ── MISCELLANEOUS CREATIVE COMBOS ──
  { categories: ["Things that are EXPENSIVE", "Things made of LEATHER"], difficulty: 'medium' },
  { categories: ["Things that SMELL good", "Things you find in a BATHROOM"], difficulty: 'easy' },
  { categories: ["Things that are FAST", "Things with ENGINES"], difficulty: 'easy' },
  { categories: ["Things that are HEAVY", "Things made of STONE"], difficulty: 'easy' },
  { categories: ["Things that are TINY", "Things that are VALUABLE"], difficulty: 'hard' },
  { categories: ["Things that FLOAT", "Things made of RUBBER"], difficulty: 'hard' },
  { categories: ["Things that are STICKY", "Things used in COOKING"], difficulty: 'medium' },
  { categories: ["Things that are TRANSPARENT", "Things found in a LABORATORY"], difficulty: 'hard' },
  { categories: ["Things that STRETCH", "Things you EXERCISE with"], difficulty: 'hard' },
  { categories: ["Things that are MAGNETIC", "Things on a REFRIGERATOR"], difficulty: 'hard' },
  { categories: ["Things that are FLAMMABLE", "Things found in a GARAGE"], difficulty: 'hard' },
  { categories: ["Things that MELT", "Things made of WAX"], difficulty: 'hard' },
  { categories: ["Things with STRIPES", "Things at a ZOO"], difficulty: 'easy' },
  { categories: ["Things that BOUNCE", "Things used in SPORTS"], difficulty: 'easy' },
  { categories: ["Things that GLOW", "Things used at NIGHT"], difficulty: 'medium' },
];

// ─── PartyKit Server ───
export default class CategoryCrashRoom implements Party.Server {
  room: GameRoom;
  timer: ReturnType<typeof setTimeout> | null = null;
  categories: [string, string][] = [];
  /** Sliding-window message counters, keyed by connection id. */
  private rateWindows = new Map<string, { count: number; startedAt: number }>();

  constructor(public party: Party.Room) {
    this.room = {
      id: party.id,
      players: {},
      currentRound: null,
      roundHistory: [],
      phase: 'lobby',
      maxRounds: 10,
      settings: { ...DEFAULT_SETTINGS },
    };

    this.categories = this.pickCategories(this.room.settings.difficulty, LIMITS.maxRounds.max);
  }

  // ─── Persistence ───
  // Without this, a hibernation or a worker restart silently destroys every
  // in-flight game. Players re-attach to the restored state by name.
  async onStart(): Promise<void> {
    try {
      const saved = await this.party.storage.get<{ room: GameRoom; categories: [string, string][] }>('state');
      if (!saved?.room) return;

      this.room = saved.room;
      this.categories = saved.categories ?? this.categories;
      // Every connection died with the previous instance.
      Object.values(this.room.players).forEach(p => { p.connected = false; });
      console.log(`[STATE] Restored room ${this.room.id} (phase=${this.room.phase}, players=${Object.keys(this.room.players).length})`);
    } catch (err) {
      console.error('[STATE] Failed to restore:', err);
    }
  }

  private async saveState(): Promise<void> {
    try {
      await this.party.storage.put('state', { room: this.room, categories: this.categories });
    } catch (err) {
      console.error('[STATE] Failed to persist:', err);
    }
  }

  onConnect(conn: Party.Connection): void {
    console.log(`Connection ${conn.id} connected`);

    // Tell the client its own connection id so it never has to guess its
    // identity from the display name (which is not unique).
    this.sendTo(conn, { type: 'connection:ready', data: { connectionId: conn.id } });
    this.sendTo(conn, { type: 'room:state', data: this.room });
  }

  onMessage(message: string, sender: Party.Connection): void {
    if (!this.allowMessage(sender)) {
      return this.sendError(sender, 'Slow down — too many requests');
    }

    let msg: any;
    try {
      msg = JSON.parse(message);
    } catch {
      return this.sendError(sender, 'Invalid message format');
    }

    if (!msg || typeof msg.type !== 'string') {
      return this.sendError(sender, 'Invalid message format');
    }

    try {
      switch (msg.type) {
        case 'player:join':
          this.handlePlayerJoin(sender, msg.data);
          break;
        case 'settings:update':
          this.handleSettingsUpdate(sender, msg.data);
          break;
        case 'game:start':
          this.handleGameStart(sender);
          break;
        case 'answer:submit':
          this.handleAnswerSubmit(sender, msg.data);
          break;
        case 'vote:submit':
          this.handleVoteSubmit(sender, msg.data);
          break;
        case 'game:restart':
          this.handleGameRestart(sender);
          break;
        case 'player:leave':
          this.handlePlayerLeave(sender);
          break;
        default:
          this.sendError(sender, `Unknown message type: ${msg.type}`);
      }
    } catch (err) {
      console.error('Error handling message:', err);
      this.sendError(sender, 'Something went wrong handling that request');
    }
  }

  onClose(conn: Party.Connection): void {
    console.log(`Connection ${conn.id} disconnected`);
    this.rateWindows.delete(conn.id);
    this.handlePlayerLeave(conn);
  }

  /** Simple per-connection sliding window. */
  private allowMessage(conn: Party.Connection): boolean {
    const now = Date.now();
    const window = this.rateWindows.get(conn.id);

    if (!window || now - window.startedAt >= RATE_LIMIT.windowMs) {
      this.rateWindows.set(conn.id, { count: 1, startedAt: now });
      return true;
    }
    window.count += 1;
    return window.count <= RATE_LIMIT.maxMessages;
  }

  // ─── Player Join ───
  handlePlayerJoin(conn: Party.Connection, data: unknown): void {
    const rawName = typeof (data as any)?.name === 'string' ? (data as any).name : '';
    const name = rawName.trim().slice(0, LIMITS.nameLength);
    if (!name) return this.sendError(conn, 'Please enter a name');

    // ── Reconnect path ──
    // A player whose socket dropped (refresh, tab sleep, network blip) keeps
    // their seat. We rebind their record to the new connection id and carry the
    // current round's answer across with them.
    const existing = Object.values(this.room.players).find(
      p => p.name.toLowerCase() === name.toLowerCase() && !this.isConnectionLive(p.id)
    );

    if (existing) {
      const oldId = existing.id;
      delete this.room.players[oldId];
      existing.id = conn.id;
      existing.connected = true;
      this.room.players[conn.id] = existing;

      // Move any in-flight answer/vote records onto the new id.
      const round = this.room.currentRound;
      if (round?.answers[oldId]) {
        round.answers[conn.id] = round.answers[oldId];
        delete round.answers[oldId];
      }
      for (const answer of Object.values(round?.answers ?? {})) {
        if (oldId in answer.votes) {
          answer.votes[conn.id] = answer.votes[oldId];
          delete answer.votes[oldId];
        }
      }

      console.log(`Player ${name} reconnected (${oldId} → ${conn.id})`);
      this.broadcast({ type: 'room:state', data: this.room });
      void this.saveState();
      return;
    }

    // ── New player path ──
    if (this.room.phase === 'finished') {
      return this.sendError(conn, 'Game has already finished');
    }
    if (this.room.phase === 'playing') {
      return this.sendError(conn, 'Game already in progress');
    }
    if (Object.keys(this.room.players).length >= this.room.settings.maxPlayers) {
      return this.sendError(conn, 'Room is full');
    }

    const isFirstPlayer = Object.keys(this.room.players).length === 0;
    this.room.players[conn.id] = {
      id: conn.id,
      name: this.uniqueName(name),
      score: 0,
      isHost: isFirstPlayer,
      hasSubmitted: false,
      connected: true,
    };

    this.broadcast({ type: 'room:state', data: this.room });
    void this.saveState();
  }

  private isConnectionLive(id: string): boolean {
    return this.party.getConnection(id) !== undefined;
  }

  /** Two players called "Alex" would otherwise be indistinguishable. */
  private uniqueName(name: string): string {
    const taken = new Set(Object.values(this.room.players).map(p => p.name.toLowerCase()));
    if (!taken.has(name.toLowerCase())) return name;

    for (let i = 2; i <= LIMITS.maxPlayers.max + 1; i++) {
      const candidate = `${name} (${i})`;
      if (!taken.has(candidate.toLowerCase())) return candidate;
    }
    return name;
  }

  // ─── Settings Update ───
  handleSettingsUpdate(conn: Party.Connection, data: unknown): void {
    const player = this.room.players[conn.id];
    if (!player?.isHost) return this.sendError(conn, 'Only host can update settings');
    if (this.room.phase !== 'lobby') return this.sendError(conn, 'Cannot change settings during game');

    const incoming = (data as any)?.settings;
    const next: GameSettings = { ...this.room.settings };

    if (incoming && typeof incoming === 'object') {
      next.timeLimit = clampNumber(incoming.timeLimit, LIMITS.timeLimit, next.timeLimit);
      next.revealTime = clampNumber(incoming.revealTime, LIMITS.revealTime, next.revealTime);
      next.votingTime = clampNumber(incoming.votingTime, LIMITS.votingTime, next.votingTime);
      next.maxPlayers = clampNumber(incoming.maxPlayers, LIMITS.maxPlayers, next.maxPlayers);
      if (typeof incoming.enableVoting === 'boolean') next.enableVoting = incoming.enableVoting;
      if (incoming.difficulty === 'easy' || incoming.difficulty === 'medium' || incoming.difficulty === 'hard') {
        next.difficulty = incoming.difficulty;
      }
    }

    // Never let the host shrink the room below the people already in it.
    const playerCount = Object.keys(this.room.players).length;
    next.maxPlayers = Math.max(next.maxPlayers, playerCount);

    const difficultyChanged = next.difficulty !== this.room.settings.difficulty;
    this.room.settings = next;

    const rawMaxRounds = (data as any)?.maxRounds;
    const nextMaxRounds = clampNumber(rawMaxRounds, LIMITS.maxRounds, this.room.maxRounds);
    const roundsChanged = nextMaxRounds !== this.room.maxRounds;
    this.room.maxRounds = nextMaxRounds;

    if (difficultyChanged || roundsChanged || this.categories.length < this.room.maxRounds) {
      this.categories = this.pickCategories(next.difficulty, Math.max(this.room.maxRounds, LIMITS.maxRounds.max));
    }

    console.log(
      `Settings updated: maxRounds=${this.room.maxRounds}, timeLimit=${next.timeLimit}, ` +
      `difficulty=${next.difficulty}, revealTime=${next.revealTime}, votingTime=${next.votingTime}`
    );

    this.broadcast({ type: 'room:state', data: this.room });
    void this.saveState();
  }

  /**
   * Category pool for a difficulty. If a tier does not hold enough pairs for the
   * requested round count we top up from the remaining pairs rather than
   * repeating a category twice in one game.
   */
  private pickCategories(difficulty: Difficulty, count: number): [string, string][] {
    const inTier = this.shuffleArray(categoryPairs.filter(p => p.difficulty === difficulty));
    const rest = this.shuffleArray(categoryPairs.filter(p => p.difficulty !== difficulty));
    return [...inTier, ...rest].slice(0, count).map(p => p.categories);
  }

  // ─── Game Start ───
  handleGameStart(conn: Party.Connection): void {
    const player = this.room.players[conn.id];
    if (!player?.isHost) return this.sendError(conn, 'Only host can start the game');
    if (Object.keys(this.room.players).length < 2) {
      return this.sendError(conn, 'Need at least 2 players to start');
    }

    this.room.phase = 'playing';
    void this.startNextRound();
  }

  // ─── Start Next Round ───
  async startNextRound(): Promise<void> {
    const roundNumber = this.room.roundHistory.length + 1;

    if (roundNumber > this.room.maxRounds) {
      this.endGame();
      return;
    }

    Object.values(this.room.players).forEach(player => {
      player.hasSubmitted = false;
      delete player.answer;
      delete player.submittedAt;
    });

    const categories = this.categories[roundNumber - 1] || this.categories[0];
    const round: Round = {
      number: roundNumber,
      categories,
      phase: 'revealing',
      startedAt: Date.now(),
      answers: {},
      timeLimit: this.room.settings.timeLimit,
      votingTime: this.room.settings.votingTime,
    };

    this.room.currentRound = round;
    this.broadcast({ type: 'round:start', data: round });
    void this.saveState();

    // Fire-and-forget; the result is only needed once answering ends.
    void this.fetchPossibleAnswers(categories, roundNumber);

    this.setPhaseTimer(() => {
      if (this.room.currentRound?.number === roundNumber) this.transitionToAnswering();
    }, this.room.settings.revealTime);
  }

  // ─── Fetch Possible Answers from AI ───
  private async fetchPossibleAnswers(categories: [string, string], roundNumber: number): Promise<void> {
    console.log(`[AI] Round ${roundNumber}: Fetching possible answers for "${categories[0]}" × "${categories[1]}"`);

    try {
      const response = await this.callBackend('/api/get-possible-answers', {
        category1: categories[0],
        category2: categories[1],
      });

      if (!response.ok) {
        console.error(`[AI] Round ${roundNumber}: Failed to fetch - ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();

      // Guard against round drift: a slow response must never overwrite a newer
      // round's answer list, which would invalidate every correct answer.
      if (this.room.currentRound?.number !== roundNumber) {
        console.warn(`[AI] Round ${roundNumber}: Response arrived after round advanced — discarded`);
        return;
      }

      if (Array.isArray(data.possibleAnswers)) {
        this.room.currentRound.aiValidation = {
          possibleAnswers: data.possibleAnswers.map((a: string) => a.toLowerCase().trim()),
          fetchedAt: Date.now(),
        };
        console.log(`[AI] Round ${roundNumber}: SUCCESS - ${data.possibleAnswers.length} answers: [${data.possibleAnswers.join(', ')}]`);
      }
    } catch (error) {
      console.error(`[AI] Round ${roundNumber}: Error -`, error);
    }
  }

  /** Single place that knows how to reach the Next.js API. */
  private callBackend(path: string, body: unknown): Promise<Response> {
    const apiUrl = process.env.PARTYKIT_BACKEND_URL || 'http://localhost:3000';
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (process.env.INTERNAL_API_SECRET) {
      headers['x-internal-key'] = process.env.INTERNAL_API_SECRET;
    }
    return fetch(`${apiUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  }

  // ─── Transition to Answering ───
  transitionToAnswering(): void {
    if (!this.room.currentRound) return;

    this.room.currentRound.phase = 'answering';
    this.broadcast({ type: 'round:phase', data: { phase: 'answering' } });

    this.setPhaseTimer(() => void this.transitionToVoting(), this.room.settings.timeLimit);
  }

  // ─── Handle Answer Submit ───
  handleAnswerSubmit(conn: Party.Connection, data: unknown): void {
    const player = this.room.players[conn.id];
    if (!player || player.hasSubmitted) return;

    const round = this.room.currentRound;
    if (!round || round.phase !== 'answering') return;

    const raw = typeof (data as any)?.answer === 'string' ? (data as any).answer : '';
    const answer = raw.trim().slice(0, LIMITS.answerLength);

    // The client blocks empty submissions; a hand-crafted socket frame does not.
    // An empty answer used to match every possible answer and win the round.
    if (!answer || tokenize(answer).length === 0) {
      return this.sendError(conn, 'Answer cannot be empty');
    }

    player.hasSubmitted = true;
    player.answer = answer;
    player.submittedAt = Date.now();

    round.answers[conn.id] = {
      text: answer,
      submittedAt: player.submittedAt,
      votes: {},
    };

    this.broadcast({ type: 'answer:locked', data: { playerId: conn.id } });

    const active = Object.values(this.room.players).filter(p => p.connected);
    if (active.length > 0 && active.every(p => p.hasSubmitted)) {
      void this.transitionToVoting();
    }
  }

  // ─── Transition to Voting ───
  async transitionToVoting(): Promise<void> {
    const round = this.room.currentRound;
    if (!round || round.phase === 'voting' || round.phase === 'scores') return;

    round.phase = 'voting';
    const roundNumber = round.number;

    this.broadcast({ type: 'round:phase', data: { phase: 'voting' } });
    this.broadcast({ type: 'round:reveal', data: { answers: round.answers } });

    this.setPhaseTimer(() => this.transitionToScores(), this.room.settings.votingTime);

    // Judge asynchronously, then push the verdicts to everyone.
    await this.validateAllAnswers(roundNumber);
    if (this.room.currentRound?.number === roundNumber) {
      this.broadcast({ type: 'round:reveal', data: { answers: this.room.currentRound.answers } });
      void this.saveState();
    }
  }

  /**
   * Two-tier validation:
   *   1. An exact (normalised) match against the pre-fetched list is accepted
   *      immediately — no API call.
   *   2. Everything else goes to the strict AI judge, which can actually reason
   *      about the two categories.
   * If the judge is unreachable the answer is left undecided, which hands it to
   * the manual-voting fallback rather than guessing.
   */
  private async validateAllAnswers(roundNumber: number): Promise<void> {
    const round = this.room.currentRound;
    if (!round || round.number !== roundNumber) return;

    const possibleAnswers = round.aiValidation?.possibleAnswers ?? [];
    const [category1, category2] = round.categories;

    console.log(`[AI VALIDATION] Round ${roundNumber}: ${possibleAnswers.length} known answers: ${possibleAnswers.join(', ') || '(none)'}`);

    const pending: Promise<void>[] = [];

    for (const [playerId, answerData] of Object.entries(round.answers)) {
      if (matchesKnownAnswer(answerData.text, possibleAnswers)) {
        answerData.aiValidation = {
          valid: true,
          reason: `"${answerData.text}" fits both "${category1}" and "${category2}"`,
        };
        console.log(`[AI VALIDATION] ${playerId}: "${answerData.text}" → VALID (known answer)`);
        continue;
      }

      pending.push(
        this.judgeAnswer(answerData.text, category1, category2)
          .then(verdict => {
            if (!verdict) {
              console.warn(`[AI VALIDATION] ${playerId}: "${answerData.text}" → UNDECIDED (judge unavailable)`);
              return;
            }
            answerData.aiValidation = verdict;
            console.log(`[AI VALIDATION] ${playerId}: "${answerData.text}" → ${verdict.valid ? 'VALID' : 'INVALID'} (judged)`);
          })
      );
    }

    await Promise.all(pending);
  }

  private async judgeAnswer(
    answer: string,
    category1: string,
    category2: string
  ): Promise<{ valid: boolean; reason: string } | null> {
    try {
      const response = await this.callBackend('/api/validate-answer', { answer, category1, category2 });
      if (!response.ok) return null;

      const data = await response.json();
      if (typeof data?.valid !== 'boolean') return null;

      return {
        valid: data.valid,
        reason: typeof data.reason === 'string' && data.reason
          ? data.reason
          : data.valid
            ? `"${answer}" fits both categories`
            : `"${answer}" doesn't fit both categories`,
      };
    } catch (error) {
      console.error('[AI VALIDATION] Judge call failed:', error);
      return null;
    }
  }

  // ─── Handle Vote Submit ───
  handleVoteSubmit(conn: Party.Connection, data: unknown): void {
    const round = this.room.currentRound;
    if (!round || round.phase !== 'voting') return;
    if (!this.room.settings.enableVoting) return;

    const targetPlayerId = (data as any)?.targetPlayerId;
    const valid = (data as any)?.valid;
    if (typeof targetPlayerId !== 'string' || typeof valid !== 'boolean') return;
    if (targetPlayerId === conn.id) return;
    if (!this.room.players[conn.id]) return;

    const answer = round.answers[targetPlayerId];
    // A verdict from the AI judge is final; manual votes only fill the gaps.
    if (!answer || answer.aiValidation) return;

    answer.votes[conn.id] = valid;

    const voterCount = Object.values(this.room.players).filter(p => p.connected).length - 1;
    const undecided = Object.values(round.answers).filter(a => !a.aiValidation);
    const allVoted = undecided.length > 0 &&
      undecided.every(a => Object.keys(a.votes).length >= Math.max(voterCount, 1));

    if (allVoted) this.transitionToScores();
  }

  // ─── Transition to Scores ───
  transitionToScores(): void {
    const round = this.room.currentRound;
    if (!round || round.phase === 'scores') return;

    round.phase = 'scores';
    this.calculateScores();

    this.broadcast({ type: 'round:phase', data: { phase: 'scores' } });
    this.broadcast({
      type: 'round:scores',
      data: { players: Object.values(this.room.players), answers: round.answers },
    });

    this.room.roundHistory.push(round);
    void this.saveState();

    this.setPhaseTimer(() => void this.startNextRound(), 5_000);
  }

  // ─── Calculate Scores ───
  calculateScores(): void {
    const round = this.room.currentRound;
    if (!round) return;

    const entries = Object.entries(round.answers).map(([playerId, answer]) => ({ playerId, ...answer }));

    // Uniqueness is judged across every answer, valid or not.
    const frequency: Record<string, number> = {};
    entries.forEach(({ text }) => {
      const key = uniquenessKey(text);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    const isValid = (answer: AnswerRecord): boolean => {
      if (answer.aiValidation) return answer.aiValidation.valid;

      // No AI verdict — fall back to the manual votes, if voting is on.
      const votes = Object.values(answer.votes);
      if (!this.room.settings.enableVoting || votes.length === 0) return true;
      const validVotes = votes.filter(v => v).length;
      return validVotes >= votes.length - validVotes; // ties go to valid
    };

    // Speed bonuses are ranked among VALID answers only. Previously an invalid
    // answer submitted first consumed the 500 slot and pushed the first correct
    // answer down to 400.
    const valid = entries.filter(isValid).sort((a, b) => a.submittedAt - b.submittedAt);
    const invalid = entries.filter(e => !isValid(e));

    valid.forEach((answer, index) => {
      const player = this.room.players[answer.playerId];
      if (!player) return;

      let score = index === 0 ? 500 : index === 1 ? 400 : 300;
      if (frequency[uniquenessKey(answer.text)] === 1) score += 100;

      player.score += score;
      console.log(`[SCORING] ${player.name}: "${answer.text}" → ${score} points (rank ${index + 1})`);
    });

    invalid.forEach(answer => {
      const player = this.room.players[answer.playerId];
      if (!player) return;
      console.log(`[SCORING] ${player.name}: "${answer.text}" → 0 points (invalid)`);
    });
  }

  // ─── End Game ───
  endGame(): void {
    this.clearTimer();
    this.room.phase = 'finished';
    this.room.currentRound = null;

    this.broadcast({
      type: 'game:over',
      data: {
        leaderboard: Object.values(this.room.players).sort((a, b) => b.score - a.score),
        roundHistory: this.room.roundHistory,
      },
    });
    void this.saveState();
  }

  // ─── Game Restart ───
  handleGameRestart(conn: Party.Connection): void {
    const player = this.room.players[conn.id];
    if (!player?.isHost) return this.sendError(conn, 'Only host can restart');

    // Orphaned timers from the game being abandoned would otherwise fire into
    // the fresh game.
    this.clearTimer();

    Object.values(this.room.players).forEach(p => {
      p.score = 0;
      p.hasSubmitted = false;
      delete p.answer;
      delete p.submittedAt;
    });

    this.room.phase = 'lobby';
    this.room.currentRound = null;
    this.room.roundHistory = [];
    this.categories = this.pickCategories(this.room.settings.difficulty, LIMITS.maxRounds.max);

    this.broadcast({ type: 'room:state', data: this.room });
    void this.saveState();
  }

  // ─── Player Leave ───
  handlePlayerLeave(conn: Party.Connection): void {
    const player = this.room.players[conn.id];
    if (!player) return;

    // Mid-game and post-game we keep the seat so the player can come back; only
    // a lobby departure actually removes them.
    if (this.room.phase === 'lobby') {
      delete this.room.players[conn.id];

      if (player.isHost) {
        const nextPlayer = Object.values(this.room.players)[0];
        if (nextPlayer) nextPlayer.isHost = true;
      }

      this.broadcast({ type: 'player:left', data: { id: conn.id } });
    } else {
      player.connected = false;
      console.log(`Player ${player.name} disconnected — seat held for reconnect`);
      this.broadcast({ type: 'room:state', data: this.room });

      // Everyone still present may already have answered.
      const round = this.room.currentRound;
      if (round?.phase === 'answering') {
        const active = Object.values(this.room.players).filter(p => p.connected);
        if (active.length > 0 && active.every(p => p.hasSubmitted)) {
          void this.transitionToVoting();
        }
      }
    }

    if (Object.keys(this.room.players).length === 0) this.clearTimer();
    void this.saveState();
  }

  // ─── Utilities ───
  /** Every phase transition goes through here so a timer can never be orphaned. */
  private setPhaseTimer(fn: () => void, ms: number): void {
    this.clearTimer();
    this.timer = setTimeout(fn, ms);
  }

  private clearTimer(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  broadcast(message: unknown): void {
    this.party.broadcast(JSON.stringify(message));
  }

  sendTo(conn: Party.Connection, message: unknown): void {
    conn.send(JSON.stringify(message));
  }

  sendError(conn: Party.Connection, message: string): void {
    this.sendTo(conn, { type: 'error', data: { message } });
  }

  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

/** Coerce to a number and clamp into range, falling back when absent/invalid. */
function clampNumber(value: unknown, range: { min: number; max: number }, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(range.max, Math.max(range.min, Math.round(n)));
}
