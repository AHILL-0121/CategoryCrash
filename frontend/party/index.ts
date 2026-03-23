import type * as Party from 'partykit/server';

// ─── Type Definitions ───
type GamePhase = 'lobby' | 'playing' | 'finished';
type RoundPhase = 'revealing' | 'answering' | 'voting' | 'scores';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
  hasSubmitted: boolean;
  answer?: string;
  submittedAt?: number;
}

interface Round {
  number: number;
  categories: [string, string];
  phase: RoundPhase;
  startedAt: number;
  answers: Record<string, {
    text: string;
    submittedAt: number;
    votes: Record<string, boolean>;
    aiValidation?: {
      valid: boolean;
      reason: string;
    };
  }>;
  timeLimit: number;
  aiValidation?: {
    possibleAnswers: string[];
    fetchedAt: number;
  };
}

interface GameRoom {
  id: string;
  players: Record<string, Player>;
  currentRound: Round | null;
  roundHistory: Round[];
  phase: GamePhase;
  maxRounds: number;
  settings: {
    timeLimit: number;
    maxPlayers: number;
    enableVoting: boolean;
  };
}

// ─── Category Pairs ───
// Each pair requires answers that fit BOTH categories simultaneously
const categoryPairs: [string, string][] = [
  // ══════════════════════════════════════════════════════════════
  // COLOR + LOCATION/OBJECT COMBOS
  // ══════════════════════════════════════════════════════════════
  ["Things that are RED", "Things found in a KITCHEN"],
  ["Things that are GREEN", "Things you can EAT"],
  ["Things that are YELLOW", "Things that FLY"],
  ["Things that are BLUE", "Things found in the OCEAN"],
  ["Things that are WHITE", "Things that are COLD"],
  ["Things that are ORANGE", "Things that GROW on trees"],
  ["Things that are BLACK", "Animals"],
  ["Things that are PINK", "Things you can WEAR"],
  ["Things that are BROWN", "Things made of WOOD"],
  ["Things that are PURPLE", "Things you find in a GARDEN"],

  // ══════════════════════════════════════════════════════════════
  // ANIMAL COMBOS
  // ══════════════════════════════════════════════════════════════
  ["Animals that can SWIM", "Things that are BIGGER than a car"],
  ["Animals with FOUR LEGS", "Animals found in AFRICA"],
  ["Animals that can FLY", "Animals that eat INSECTS"],
  ["Animals with FUR", "Animals kept as PETS"],
  ["Animals that live in WATER", "Animals you can EAT"],
  ["Animals that are NOCTURNAL", "Animals with WINGS"],
  ["Animals found in AUSTRALIA", "Animals that can JUMP"],
  ["Animals that HIBERNATE", "Animals with CLAWS"],
  ["Animals that live in the JUNGLE", "Animals that make LOUD sounds"],
  ["Farm animals", "Animals that produce MILK"],

  // ══════════════════════════════════════════════════════════════
  // FOOD COMBOS
  // ══════════════════════════════════════════════════════════════
  ["Foods that are SPICY", "Foods eaten for BREAKFAST"],
  ["Foods that are SWEET", "Things that are ROUND"],
  ["Foods from ITALY", "Foods made with CHEESE"],
  ["Foods that are FRIED", "Foods from ASIA"],
  ["Foods you eat with your HANDS", "Foods served at PARTIES"],
  ["Foods that are SOUR", "FRUITS"],
  ["Foods eaten for DESSERT", "Foods that are FROZEN"],
  ["Foods that are CRUNCHY", "Foods made from VEGETABLES"],
  ["Foods wrapped in BREAD", "Foods from MEXICO"],
  ["Seafood", "Foods that are EXPENSIVE"],

  // ══════════════════════════════════════════════════════════════
  // LOCATION/PLACE COMBOS
  // ══════════════════════════════════════════════════════════════
  ["Things found in a SCHOOL", "Things made of WOOD"],
  ["Things found in a BEDROOM", "Things that MAKE NOISE"],
  ["Things found at a BEACH", "Things that are COLD"],
  ["Things found in a HOSPITAL", "Things that are WHITE"],
  ["Things found in an OFFICE", "Things that use ELECTRICITY"],
  ["Things found in a PARK", "Things that are GREEN"],
  ["Things found in a BATHROOM", "Things made of PLASTIC"],
  ["Things found in a GYM", "Things that are HEAVY"],
  ["Things found at an AIRPORT", "Things with WHEELS"],
  ["Things found in a LIBRARY", "Things that are QUIET"],

  // ══════════════════════════════════════════════════════════════
  // GEOGRAPHY/COUNTRIES
  // ══════════════════════════════════════════════════════════════
  ["Countries in ASIA", "Countries with a FLAG that has RED in it"],
  ["Countries in EUROPE", "Countries that start with the letter 'S'"],
  ["Countries with BEACHES", "Countries that speak SPANISH"],
  ["Countries with MOUNTAINS", "Countries in SOUTH AMERICA"],
  ["Island countries", "Countries in the PACIFIC"],
  ["Countries that are COLD", "Countries in NORTHERN EUROPE"],
  ["Countries famous for FOOD", "Countries in the MEDITERRANEAN"],
  ["Countries with DESERTS", "Countries in AFRICA"],
  ["Countries with RAINFORESTS", "Countries near the EQUATOR"],
  ["Landlocked countries", "Countries in CENTRAL EUROPE"],

  // ══════════════════════════════════════════════════════════════
  // SPORTS/ACTIVITIES
  // ══════════════════════════════════════════════════════════════
  ["Sports played with a BALL", "Sports played in WATER"],
  ["Sports played in TEAMS", "Sports played on GRASS"],
  ["Olympic sports", "Sports that use a RACKET"],
  ["Winter sports", "Sports that are DANGEROUS"],
  ["Sports played INDOORS", "Sports with a NET"],
  ["Sports that involve RUNNING", "Individual sports"],
  ["Sports popular in AMERICA", "Sports played with a BAT"],
  ["Sports that require BALANCE", "Sports done on ICE"],
  ["Extreme sports", "Sports done in the AIR"],
  ["Sports watched on TV", "Sports with a BALL"],

  // ══════════════════════════════════════════════════════════════
  // JOBS/PROFESSIONS
  // ══════════════════════════════════════════════════════════════
  ["Jobs that require a UNIFORM", "Jobs that involve OUTDOOR work"],
  ["Jobs in HEALTHCARE", "Jobs that help PEOPLE"],
  ["Jobs that require a DEGREE", "Jobs in an OFFICE"],
  ["Jobs that involve TRAVEL", "Jobs that pay WELL"],
  ["Jobs in ENTERTAINMENT", "Jobs that are CREATIVE"],
  ["Jobs that involve ANIMALS", "Jobs done OUTDOORS"],
  ["Jobs that require PHYSICAL strength", "Jobs that are DANGEROUS"],
  ["Jobs in TECHNOLOGY", "Jobs that didn't exist 50 YEARS AGO"],
  ["Jobs that involve FOOD", "Jobs in RESTAURANTS"],
  ["Jobs that require EARLY mornings", "Jobs in TRANSPORTATION"],

  // ══════════════════════════════════════════════════════════════
  // EVERYDAY OBJECTS
  // ══════════════════════════════════════════════════════════════
  ["Things that use BATTERIES", "Things you carry in a BAG"],
  ["Things made of METAL", "Things found in a TOOLBOX"],
  ["Things that are SOFT", "Things you SLEEP with"],
  ["Things that are SHARP", "Things found in a KITCHEN"],
  ["Things with BUTTONS", "Things you WEAR"],
  ["Things that SPIN", "Things that use ELECTRICITY"],
  ["Things that FOLD", "Things made of PAPER"],
  ["Things with HANDLES", "Things you CARRY"],
  ["Things that BREAK easily", "Things made of GLASS"],
  ["Things that are WATERPROOF", "Things you use OUTDOORS"],

  // ══════════════════════════════════════════════════════════════
  // ENTERTAINMENT/MEDIA
  // ══════════════════════════════════════════════════════════════
  ["Things in a MOVIE THEATER", "Things that are DARK"],
  ["Musical INSTRUMENTS", "Things made of WOOD"],
  ["Things at a CONCERT", "Things that are LOUD"],
  ["Video game CHARACTERS", "Things that are FICTIONAL"],
  ["Things on a TV SHOW", "Things that make you LAUGH"],
  ["Things at a CIRCUS", "Things that are COLORFUL"],
  ["Things in a MUSEUM", "Things that are OLD"],
  ["Superheroes", "Things that can FLY"],
  ["Things at an AMUSEMENT PARK", "Things that SPIN"],
  ["Disney characters", "Things that are ANIMATED"],

  // ══════════════════════════════════════════════════════════════
  // NATURE/SCIENCE
  // ══════════════════════════════════════════════════════════════
  ["Things in SPACE", "Things that are BRIGHT"],
  ["Things that GROW", "Things that need WATER"],
  ["Things found in a FOREST", "Things that are TALL"],
  ["Weather phenomena", "Things that are DANGEROUS"],
  ["Things in the SKY", "Things that MOVE"],
  ["Things underground", "Things that are VALUABLE"],
  ["Things in the DESERT", "Things that survive HEAT"],
  ["Things at the NORTH POLE", "Things that are WHITE"],
  ["Things that are MICROSCOPIC", "Things that are ALIVE"],
  ["Chemical elements", "Things that are SHINY"],

  // ══════════════════════════════════════════════════════════════
  // TIME/SEASONS/HOLIDAYS
  // ══════════════════════════════════════════════════════════════
  ["Things associated with CHRISTMAS", "Things that are RED"],
  ["Things associated with SUMMER", "Things that are HOT"],
  ["Things associated with HALLOWEEN", "Things that are SCARY"],
  ["Things you do in WINTER", "Things that involve SNOW"],
  ["Things associated with BIRTHDAYS", "Things that are SWEET"],
  ["Things you do at NIGHT", "Things that need LIGHT"],
  ["Things from the 1990s", "Things that are NOSTALGIC"],
  ["Things you do on WEEKENDS", "Things that are FUN"],
  ["Things associated with SPRING", "Things that BLOOM"],
  ["Things you do in the MORNING", "Things that involve WATER"],

  // ══════════════════════════════════════════════════════════════
  // MISCELLANEOUS CREATIVE COMBOS
  // ══════════════════════════════════════════════════════════════
  ["Things that are EXPENSIVE", "Things made of LEATHER"],
  ["Things that SMELL good", "Things you find in a BATHROOM"],
  ["Things that are FAST", "Things with ENGINES"],
  ["Things that are HEAVY", "Things made of STONE"],
  ["Things that are TINY", "Things that are VALUABLE"],
  ["Things that FLOAT", "Things made of RUBBER"],
  ["Things that are STICKY", "Things used in COOKING"],
  ["Things that are TRANSPARENT", "Things found in a LABORATORY"],
  ["Things that STRETCH", "Things you EXERCISE with"],
  ["Things that are MAGNETIC", "Things on a REFRIGERATOR"],
  ["Things that are FLAMMABLE", "Things found in a GARAGE"],
  ["Things that MELT", "Things made of WAX"],
  ["Things with STRIPES", "Things at a ZOO"],
  ["Things that BOUNCE", "Things used in SPORTS"],
  ["Things that GLOW", "Things used at NIGHT"],
];

// ─── PartyKit Server ───
export default class CategoryCrashRoom implements Party.Server {
  room: GameRoom;
  timer: NodeJS.Timeout | null = null;
  categories: [string, string][] = [];

  constructor(public party: Party.Room) {
    // Initialize room state
    this.room = {
      id: party.id,
      players: {},
      currentRound: null,
      roundHistory: [],
      phase: 'lobby',
      maxRounds: 10,
      settings: {
        timeLimit: 20000,
        maxPlayers: 6,
        enableVoting: true,
      },
    };

    // Shuffle categories for this room (keep enough for max possible rounds)
    this.categories = this.shuffleArray([...categoryPairs]).slice(0, 15);
  }

  onConnect(conn: Party.Connection): void | Promise<void> {
    console.log(`Connection ${conn.id} connected`);

    // Send current room state to the new connection
    this.sendTo(conn, {
      type: 'room:state',
      data: this.room,
    });
  }

  onMessage(message: string, sender: Party.Connection): void | Promise<void> {
    try {
      const msg = JSON.parse(message);
      console.log(`Message from ${sender.id}:`, msg.type);

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
      }
    } catch (err) {
      console.error('Error handling message:', err);
      this.sendError(sender, 'Invalid message format');
    }
  }

  onClose(conn: Party.Connection): void {
    console.log(`Connection ${conn.id} disconnected`);
    this.handlePlayerLeave(conn);
  }

  // ─── Player Join ───
  handlePlayerJoin(conn: Party.Connection, data: { name: string }): void {
    // When game is finished, allow reconnection by matching player name
    if (this.room.phase === 'finished') {
      // Find existing player by name
      const existingPlayer = Object.values(this.room.players).find(p => p.name === data.name);

      if (existingPlayer) {
        // Update the player's connection ID to the new connection
        const oldId = existingPlayer.id;
        delete this.room.players[oldId];
        existingPlayer.id = conn.id;
        this.room.players[conn.id] = existingPlayer;
        console.log(`Player ${data.name} reconnected with new connection ${conn.id}`);

        // Send current room state to the reconnected player
        this.broadcast({
          type: 'room:state',
          data: this.room,
        });
        return;
      }

      // New player trying to join finished game - not allowed
      return this.sendError(conn, 'Game has already finished');
    }

    // Check if room is full
    if (Object.keys(this.room.players).length >= this.room.settings.maxPlayers) {
      return this.sendError(conn, 'Room is full');
    }

    // Check if game already started (playing phase)
    if (this.room.phase === 'playing') {
      return this.sendError(conn, 'Game already in progress');
    }

    // Create player
    const isFirstPlayer = Object.keys(this.room.players).length === 0;
    const player: Player = {
      id: conn.id,
      name: data.name,
      score: 0,
      isHost: isFirstPlayer,
      hasSubmitted: false,
    };

    this.room.players[conn.id] = player;

    // Broadcast updated room state to all
    this.broadcast({
      type: 'room:state',
      data: this.room,
    });
  }

  // ─── Settings Update ───
  handleSettingsUpdate(conn: Party.Connection, data: { settings: Partial<GameRoom['settings']>; maxRounds?: number }): void {
    const player = this.room.players[conn.id];

    // Only host can update settings
    if (!player?.isHost) {
      return this.sendError(conn, 'Only host can update settings');
    }

    // Check if game already started
    if (this.room.phase !== 'lobby') {
      return this.sendError(conn, 'Cannot change settings during game');
    }

    // Update settings
    if (data.settings) {
      this.room.settings = {
        ...this.room.settings,
        ...data.settings,
      };
    }

    // Update max rounds
    if (data.maxRounds && data.maxRounds >= 1 && data.maxRounds <= 15) {
      this.room.maxRounds = data.maxRounds;
      // Reshuffle categories if we need more than currently available
      if (data.maxRounds > this.categories.length) {
        this.categories = this.shuffleArray([...categoryPairs]).slice(0, data.maxRounds);
      } else {
        this.categories = this.categories.slice(0, data.maxRounds);
      }
    }

    console.log(`Settings updated: maxRounds=${this.room.maxRounds}, timeLimit=${this.room.settings.timeLimit}`);

    // Broadcast updated room state to all
    this.broadcast({
      type: 'room:state',
      data: this.room,
    });
  }

  // ─── Game Start ───
  handleGameStart(conn: Party.Connection): void {
    const player = this.room.players[conn.id];

    // Only host can start
    if (!player?.isHost) {
      return this.sendError(conn, 'Only host can start the game');
    }

    // Need at least 2 players
    if (Object.keys(this.room.players).length < 2) {
      return this.sendError(conn, 'Need at least 2 players to start');
    }

    this.room.phase = 'playing';
    this.startNextRound();
  }

  // ─── Start Next Round ───
  async startNextRound(): Promise<void> {
    const roundNumber = this.room.roundHistory.length + 1;

    if (roundNumber > this.room.maxRounds) {
      this.endGame();
      return;
    }

    // Reset player submission status
    Object.values(this.room.players).forEach(player => {
      player.hasSubmitted = false;
      delete player.answer;
      delete player.submittedAt;
    });

    // Create new round
    const categories = this.categories[roundNumber - 1] || this.categories[0];
    const round: Round = {
      number: roundNumber,
      categories,
      phase: 'revealing',
      startedAt: Date.now(),
      answers: {},
      timeLimit: this.room.settings.timeLimit,
    };

    this.room.currentRound = round;

    this.broadcast({
      type: 'round:start',
      data: round,
    });

    // Fetch possible answers from AI
    this.fetchPossibleAnswers(categories);

    // Transition to answering after 3 seconds
    setTimeout(() => {
      if (this.room.currentRound?.number === roundNumber) {
        this.transitionToAnswering();
      }
    }, 3000);
  }

  // ─── Fetch Possible Answers from AI ───
  private async fetchPossibleAnswers(categories: [string, string]): Promise<void> {
    const roundNumber = this.room.currentRound?.number;
    console.log(`[AI] Round ${roundNumber}: Fetching possible answers for "${categories[0]}" × "${categories[1]}"`);

    try {
      const apiUrl = process.env.PARTYKIT_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/get-possible-answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category1: categories[0],
          category2: categories[1],
        }),
      });

      if (!response.ok) {
        console.error(`[AI] Round ${roundNumber}: Failed to fetch - ${response.status} ${response.statusText}`);
        return;
      }

      const data = await response.json();
      if (this.room.currentRound && data.possibleAnswers) {
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

  // ─── Transition to Answering ───
  transitionToAnswering(): void {
    if (!this.room.currentRound) return;

    this.room.currentRound.phase = 'answering';
    this.broadcast({
      type: 'round:phase',
      data: { phase: 'answering' },
    });

    // Start answer timer
    this.timer = setTimeout(() => {
      this.transitionToVoting();
    }, this.room.settings.timeLimit);
  }

  // ─── Handle Answer Submit ───
  handleAnswerSubmit(conn: Party.Connection, data: { answer: string }): void {
    const player = this.room.players[conn.id];
    if (!player || player.hasSubmitted) return;

    const round = this.room.currentRound;
    if (!round || round.phase !== 'answering') return;

    // Record answer
    player.hasSubmitted = true;
    player.answer = data.answer;
    player.submittedAt = Date.now();

    round.answers[conn.id] = {
      text: data.answer,
      submittedAt: player.submittedAt,
      votes: {},
    };

    // Broadcast submission (without revealing answer)
    this.broadcast({
      type: 'answer:locked',
      data: { playerId: conn.id },
    });

    // If all players submitted, move to voting
    const allSubmitted = Object.values(this.room.players).every(p => p.hasSubmitted);
    if (allSubmitted) {
      if (this.timer) clearTimeout(this.timer);
      this.transitionToVoting();
    }
  }

  // ─── Transition to Voting ───
  transitionToVoting(): void {
    if (!this.room.currentRound) return;

    this.room.currentRound.phase = 'voting';

    // Validate all answers against pre-fetched AI answers
    this.validateAllAnswers();

    // Broadcast phase change and reveal all answers with validation results
    this.broadcast({
      type: 'round:phase',
      data: { phase: 'voting' },
    });

    this.broadcast({
      type: 'round:reveal',
      data: { answers: this.room.currentRound.answers },
    });

    // Auto-transition after 15 seconds
    this.timer = setTimeout(() => {
      this.transitionToScores();
    }, 15000);
  }

  // ─── Validate All Answers Against Pre-fetched List ───
  private validateAllAnswers(): void {
    const round = this.room.currentRound;
    if (!round) return;

    const possibleAnswers = round.aiValidation?.possibleAnswers || [];
    const categories = round.categories;

    console.log(`[AI VALIDATION] Validating answers against ${possibleAnswers.length} possible answers`);
    if (possibleAnswers.length > 0) {
      console.log(`[AI VALIDATION] Possible answers: ${possibleAnswers.join(', ')}`);
    }

    // If no AI answers available, skip validation (manual voting will be used)
    if (possibleAnswers.length === 0) {
      console.log(`[AI VALIDATION] No pre-fetched answers available - skipping instant validation`);
      return;
    }

    // Validate each player's answer
    for (const [playerId, answerData] of Object.entries(round.answers)) {
      const playerAnswer = answerData.text.toLowerCase().trim();

      // Check if answer matches any of the possible answers (fuzzy matching)
      const isValid = this.isAnswerValid(playerAnswer, possibleAnswers);

      // Generate reason based on validation
      let reason: string;
      if (isValid) {
        reason = `"${answerData.text}" fits both "${categories[0]}" and "${categories[1]}"`;
      } else {
        reason = `"${answerData.text}" doesn't clearly fit both categories`;
      }

      // Set AI validation result
      answerData.aiValidation = {
        valid: isValid,
        reason: reason,
      };

      console.log(`[AI VALIDATION] Player ${playerId}: "${answerData.text}" → ${isValid ? 'VALID' : 'INVALID'}`);
    }
  }

  // ─── Check if Answer is Valid (Fuzzy Matching) ───
  private isAnswerValid(playerAnswer: string, possibleAnswers: string[]): boolean {
    // Normalize player answer
    const normalizedAnswer = playerAnswer.toLowerCase().trim();

    for (const possible of possibleAnswers) {
      const normalizedPossible = possible.toLowerCase().trim();

      // Exact match
      if (normalizedAnswer === normalizedPossible) {
        return true;
      }

      // Contains match (e.g., "red apple" contains "apple")
      if (normalizedAnswer.includes(normalizedPossible) || normalizedPossible.includes(normalizedAnswer)) {
        return true;
      }

      // Word overlap (check if significant words match)
      const answerWords = normalizedAnswer.split(/\s+/).filter(w => w.length > 2);
      const possibleWords = normalizedPossible.split(/\s+/).filter(w => w.length > 2);

      for (const answerWord of answerWords) {
        for (const possibleWord of possibleWords) {
          // Check for singular/plural variations
          if (answerWord === possibleWord ||
              answerWord === possibleWord + 's' ||
              answerWord + 's' === possibleWord ||
              answerWord === possibleWord + 'es' ||
              answerWord + 'es' === possibleWord) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // ─── Handle Vote Submit ───
  handleVoteSubmit(conn: Party.Connection, data: { targetPlayerId: string; valid: boolean }): void {
    const round = this.room.currentRound;
    if (!round || round.phase !== 'voting') return;

    const answer = round.answers[data.targetPlayerId];
    if (!answer) return;

    // Can't vote on own answer
    if (data.targetPlayerId === conn.id) return;

    // Record vote
    answer.votes[conn.id] = data.valid;

    // Check if everyone voted
    const playerCount = Object.keys(this.room.players).length;
    const answerCount = Object.keys(round.answers).length;
    const expectedVotes = playerCount - 1; // Can't vote on own

    let allVoted = true;
    for (const [playerId, answerData] of Object.entries(round.answers)) {
      const voteCount = Object.keys(answerData.votes).length;
      if (voteCount < expectedVotes) {
        allVoted = false;
        break;
      }
    }

    if (allVoted) {
      if (this.timer) clearTimeout(this.timer);
      this.transitionToScores();
    }
  }

  // ─── Transition to Scores ───
  transitionToScores(): void {
    if (!this.room.currentRound) return;

    this.room.currentRound.phase = 'scores';

    // Calculate scores
    this.calculateScores();

    // Broadcast updated scores
    this.broadcast({
      type: 'round:phase',
      data: { phase: 'scores' },
    });

    this.broadcast({
      type: 'round:scores',
      data: { players: Object.values(this.room.players) },
    });

    // Move round to history
    this.room.roundHistory.push(this.room.currentRound);

    // Start next round after 5 seconds
    this.timer = setTimeout(() => {
      this.startNextRound();
    }, 5000);
  }

  // ─── Calculate Scores ───
  calculateScores(): void {
    const round = this.room.currentRound;
    if (!round) return;

    // Sort answers by submission time
    const answersArray = Object.entries(round.answers)
      .map(([playerId, answer]) => ({ playerId, ...answer }))
      .sort((a, b) => a.submittedAt - b.submittedAt);

    // Track answer frequency for uniqueness
    const answerFrequency: Record<string, number> = {};
    answersArray.forEach(({ text }) => {
      const normalized = text.toLowerCase().trim();
      answerFrequency[normalized] = (answerFrequency[normalized] || 0) + 1;
    });

    // Calculate scores for each answer
    answersArray.forEach((answer, index) => {
      const player = this.room.players[answer.playerId];
      if (!player) return;

      let score = 0;

      // Base score by position
      if (index === 0) score = 500;
      else if (index === 1) score = 400;
      else score = 300;

      // Unique bonus
      const normalized = answer.text.toLowerCase().trim();
      if (answerFrequency[normalized] === 1) {
        score += 100;
      }

      // Check validity from AI validation (primary) or manual votes (fallback)
      const aiValidation = answer.aiValidation;
      if (aiValidation) {
        // AI validation takes precedence
        if (!aiValidation.valid) {
          score = 0; // Invalid answers get no points
        }
      } else {
        // Fallback to manual votes if no AI validation
        const votes = Object.values(answer.votes);
        if (votes.length > 0) {
          const validVotes = votes.filter(v => v).length;
          const invalidVotes = votes.length - validVotes;

          // Majority voted invalid
          if (invalidVotes > validVotes) {
            score = 0;
          }
        }
      }

      player.score += Math.max(0, score);
      console.log(`[SCORING] ${player.name}: "${answer.text}" → ${score} points (AI valid: ${aiValidation?.valid})`);
    });
  }

  // ─── End Game ───
  endGame(): void {
    this.room.phase = 'finished';

    const leaderboard = Object.values(this.room.players)
      .sort((a, b) => b.score - a.score);

    this.broadcast({
      type: 'game:over',
      data: {
        leaderboard,
        roundHistory: this.room.roundHistory,
      },
    });
  }

  // ─── Game Restart ───
  handleGameRestart(conn: Party.Connection): void {
    const player = this.room.players[conn.id];
    if (!player?.isHost) {
      return this.sendError(conn, 'Only host can restart');
    }

    // Reset game
    Object.values(this.room.players).forEach(p => {
      p.score = 0;
      p.hasSubmitted = false;
      delete p.answer;
      delete p.submittedAt;
    });

    this.room.phase = 'lobby';
    this.room.currentRound = null;
    this.room.roundHistory = [];
    // Reshuffle with fresh categories for next game
    this.categories = this.shuffleArray([...categoryPairs]).slice(0, this.room.maxRounds);

    this.broadcast({
      type: 'room:state',
      data: this.room,
    });
  }

  // ─── Player Leave ───
  handlePlayerLeave(conn: Party.Connection): void {
    const player = this.room.players[conn.id];
    if (!player) return;

    // Don't remove players when game is finished - preserve data for results viewing
    if (this.room.phase === 'finished') {
      console.log(`Player ${player.name} disconnected but game is finished - preserving data`);
      return;
    }

    delete this.room.players[conn.id];

    // If host left, promote next player
    if (player.isHost) {
      const nextPlayer = Object.values(this.room.players)[0];
      if (nextPlayer) {
        nextPlayer.isHost = true;
      }
    }

    this.broadcast({
      type: 'player:left',
      data: { id: conn.id },
    });

    // If no players left, cleanup
    if (Object.keys(this.room.players).length === 0) {
      if (this.timer) clearTimeout(this.timer);
    }
  }

  // ─── Utilities ───
  broadcast(message: any): void {
    this.party.broadcast(JSON.stringify(message));
  }

  sendTo(conn: Party.Connection, message: any): void {
    conn.send(JSON.stringify(message));
  }

  sendError(conn: Party.Connection, message: string): void {
    this.sendTo(conn, {
      type: 'error',
      data: { message },
    });
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
