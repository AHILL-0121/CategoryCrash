// ─── Category Pairs ───
const categoryPairs = [
    ["Things that are RED", "Things found in a KITCHEN"],
    ["Animals that can SWIM", "Things that are BIGGER than a car"],
    ["Things made of WOOD", "Things you find in a SCHOOL"],
    ["Countries in ASIA", "Countries with a FLAG that has RED in it"],
    ["Things that are COLD", "Things you find at a BEACH"],
    ["Jobs that require a UNIFORM", "Jobs that involve OUTDOOR work"],
    ["Sports played with a BALL", "Sports played in WATER"],
    ["Things that MAKE NOISE", "Things found in a BEDROOM"],
    ["Things that FLY", "Things that are YELLOW"],
    ["Foods that are SPICY", "Foods eaten for BREAKFAST"],
];
// ─── PartyKit Server ───
export default class CategoryCrashRoom {
    constructor(party) {
        this.party = party;
        this.timer = null;
        this.categories = [];
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
        // Shuffle categories for this room
        this.categories = this.shuffleArray([...categoryPairs]).slice(0, 10);
    }
    onConnect(conn) {
        console.log(`Connection ${conn.id} connected`);
        // Send current room state to the new connection
        this.sendTo(conn, {
            type: 'room:state',
            data: this.room,
        });
    }
    onMessage(message, sender) {
        try {
            const msg = JSON.parse(message);
            console.log(`Message from ${sender.id}:`, msg.type);
            switch (msg.type) {
                case 'player:join':
                    this.handlePlayerJoin(sender, msg.data);
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
        }
        catch (err) {
            console.error('Error handling message:', err);
            this.sendError(sender, 'Invalid message format');
        }
    }
    onClose(conn) {
        console.log(`Connection ${conn.id} disconnected`);
        this.handlePlayerLeave(conn);
    }
    // ─── Player Join ───
    handlePlayerJoin(conn, data) {
        // Check if room is full
        if (Object.keys(this.room.players).length >= this.room.settings.maxPlayers) {
            return this.sendError(conn, 'Room is full');
        }
        // Check if game already started
        if (this.room.phase !== 'lobby') {
            return this.sendError(conn, 'Game already in progress');
        }
        // Create player
        const isFirstPlayer = Object.keys(this.room.players).length === 0;
        const player = {
            id: conn.id,
            name: data.name,
            score: 0,
            isHost: isFirstPlayer,
            hasSubmitted: false,
        };
        this.room.players[conn.id] = player;
        // Broadcast to all
        this.broadcast({
            type: 'player:joined',
            data: player,
        });
    }
    // ─── Game Start ───
    handleGameStart(conn) {
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
    startNextRound() {
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
        const round = {
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
        // Transition to answering after 3 seconds
        setTimeout(() => {
            if (this.room.currentRound?.number === roundNumber) {
                this.transitionToAnswering();
            }
        }, 3000);
    }
    // ─── Transition to Answering ───
    transitionToAnswering() {
        if (!this.room.currentRound)
            return;
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
    handleAnswerSubmit(conn, data) {
        const player = this.room.players[conn.id];
        if (!player || player.hasSubmitted)
            return;
        const round = this.room.currentRound;
        if (!round || round.phase !== 'answering')
            return;
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
            if (this.timer)
                clearTimeout(this.timer);
            this.transitionToVoting();
        }
    }
    // ─── Transition to Voting ───
    transitionToVoting() {
        if (!this.room.currentRound)
            return;
        this.room.currentRound.phase = 'voting';
        // Broadcast phase change and reveal all answers
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
    // ─── Handle Vote Submit ───
    handleVoteSubmit(conn, data) {
        const round = this.room.currentRound;
        if (!round || round.phase !== 'voting')
            return;
        const answer = round.answers[data.targetPlayerId];
        if (!answer)
            return;
        // Can't vote on own answer
        if (data.targetPlayerId === conn.id)
            return;
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
            if (this.timer)
                clearTimeout(this.timer);
            this.transitionToScores();
        }
    }
    // ─── Transition to Scores ───
    transitionToScores() {
        if (!this.room.currentRound)
            return;
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
    calculateScores() {
        const round = this.room.currentRound;
        if (!round)
            return;
        // Sort answers by submission time
        const answersArray = Object.entries(round.answers)
            .map(([playerId, answer]) => ({ playerId, ...answer }))
            .sort((a, b) => a.submittedAt - b.submittedAt);
        // Track answer frequency for uniqueness
        const answerFrequency = {};
        answersArray.forEach(({ text }) => {
            const normalized = text.toLowerCase().trim();
            answerFrequency[normalized] = (answerFrequency[normalized] || 0) + 1;
        });
        // Calculate scores for each answer
        answersArray.forEach((answer, index) => {
            const player = this.room.players[answer.playerId];
            if (!player)
                return;
            let score = 0;
            // Base score by position
            if (index === 0)
                score = 500;
            else if (index === 1)
                score = 400;
            else
                score = 300;
            // Unique bonus
            const normalized = answer.text.toLowerCase().trim();
            if (answerFrequency[normalized] === 1) {
                score += 100;
            }
            // Check validity from votes
            const votes = Object.values(answer.votes);
            if (votes.length > 0) {
                const validVotes = votes.filter(v => v).length;
                const invalidVotes = votes.length - validVotes;
                // Majority voted invalid
                if (invalidVotes > validVotes) {
                    score -= 50;
                }
            }
            player.score += Math.max(0, score);
        });
    }
    // ─── End Game ───
    endGame() {
        this.room.phase = 'finished';
        const leaderboard = Object.values(this.room.players)
            .sort((a, b) => b.score - a.score);
        this.broadcast({
            type: 'game:over',
            data: { leaderboard },
        });
    }
    // ─── Game Restart ───
    handleGameRestart(conn) {
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
        this.categories = this.shuffleArray([...categoryPairs]).slice(0, 10);
        this.broadcast({
            type: 'room:state',
            data: this.room,
        });
    }
    // ─── Player Leave ───
    handlePlayerLeave(conn) {
        const player = this.room.players[conn.id];
        if (!player)
            return;
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
            if (this.timer)
                clearTimeout(this.timer);
        }
    }
    // ─── Utilities ───
    broadcast(message) {
        this.party.broadcast(JSON.stringify(message));
    }
    sendTo(conn, message) {
        conn.send(JSON.stringify(message));
    }
    sendError(conn, message) {
        this.sendTo(conn, {
            type: 'error',
            data: { message },
        });
    }
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}
