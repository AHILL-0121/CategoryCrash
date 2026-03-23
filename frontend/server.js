/**
 * Alternative WebSocket Server for Local Development
 * Use this instead of PartyKit when developing on Windows
 *
 * Run with: node server.js
 */

const { WebSocketServer } = require('ws');
const http = require('http');
const fetch = require('node-fetch');

const PORT = 1999;
const VALIDATION_API_URL = 'http://localhost:3000/api/validate-answer';

// In-memory room storage
const rooms = new Map();

// Create HTTP server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'CategoryCrash WebSocket Server Running' }));
});

// Create WebSocket server
const wss = new WebSocketServer({ server });

// Room management
function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      id: roomId,
      players: {},
      currentRound: null,
      roundHistory: [],
      phase: 'lobby',
      maxRounds: 10,
      settings: {
        timeLimit: 20000,
        maxPlayers: 6,
        enableVoting: true,
        difficulty: 'medium',
        revealTime: 3000,
      },
      connections: new Set(),
    });
  }
  return rooms.get(roomId);
}

function broadcast(room, message, exclude = null) {
  const data = JSON.stringify(message);
  room.connections.forEach((ws) => {
    if (ws !== exclude && ws.readyState === 1) {
      ws.send(data);
    }
  });
}

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(Boolean);

  if (pathParts[0] !== 'parties' || pathParts[1] !== 'game') {
    ws.close();
    return;
  }

  const roomId = pathParts[2] || 'default';
  const room = getRoom(roomId);
  room.connections.add(ws);

  console.log(`✅ Client connected to room: ${roomId}`);

  // Send initial room state
  ws.send(JSON.stringify({
    type: 'sync',
    room: {
      id: room.id,
      players: room.players,
      currentRound: room.currentRound,
      roundHistory: room.roundHistory,
      phase: room.phase,
      maxRounds: room.maxRounds,
      settings: room.settings,
    },
  }));

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      handleMessage(ws, room, message);
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', () => {
    room.connections.delete(ws);
    console.log(`👋 Client disconnected from room: ${roomId}`);

    // Clean up empty rooms after 5 minutes
    if (room.connections.size === 0) {
      setTimeout(() => {
        if (room.connections.size === 0) {
          rooms.delete(roomId);
          console.log(`🗑️  Cleaned up empty room: ${roomId}`);
        }
      }, 5 * 60 * 1000);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
});

function handleMessage(ws, room, message) {
  console.log(`📨 Message in ${room.id}:`, message.type);

  switch (message.type) {
    case 'join':
      handleJoin(ws, room, message);
      break;
    case 'start':
      handleStart(ws, room);
      break;
    case 'answer':
      handleAnswer(ws, room, message);
      break;
    case 'vote':
      handleVote(ws, room, message);
      break;
    case 'settings':
      handleSettingsUpdate(ws, room, message);
      break;
    case 'restart':
      handleRestart(ws, room);
      break;
    default:
      console.log('⚠️  Unknown message type:', message.type);
  }
}

function handleJoin(ws, room, message) {
  const { playerId, playerName } = message;

  const isFirstPlayer = Object.keys(room.players).length === 0;

  room.players[playerId] = {
    id: playerId,
    name: playerName,
    score: 0,
    isHost: isFirstPlayer,
    hasSubmitted: false,
  };

  broadcast(room, {
    type: 'sync',
    room: {
      id: room.id,
      players: room.players,
      currentRound: room.currentRound,
      roundHistory: room.roundHistory,
      phase: room.phase,
      maxRounds: room.maxRounds,
      settings: room.settings,
    },
  });
}

function handleStart(ws, room) {
  if (room.phase !== 'lobby') return;

  room.phase = 'playing';
  startNextRound(room);
}

function handleAnswer(ws, room, message) {
  const { playerId, answer } = message;

  if (!room.currentRound || room.currentRound.phase !== 'answering') return;

  const player = room.players[playerId];
  if (!player) return;

  player.hasSubmitted = true;
  player.answer = answer;

  room.currentRound.answers[playerId] = {
    text: answer,
    submittedAt: Date.now(),
    votes: {},
  };

  broadcast(room, {
    type: 'sync',
    room: {
      id: room.id,
      players: room.players,
      currentRound: room.currentRound,
      roundHistory: room.roundHistory,
      phase: room.phase,
      maxRounds: room.maxRounds,
      settings: room.settings,
    },
  });
}

function handleVote(ws, room, message) {
  const { voterId, targetPlayerId, valid } = message;

  if (!room.currentRound || room.currentRound.phase !== 'voting') return;

  const answerData = room.currentRound.answers[targetPlayerId];
  if (!answerData) return;

  answerData.votes[voterId] = valid;

  broadcast(room, {
    type: 'sync',
    room: {
      id: room.id,
      players: room.players,
      currentRound: room.currentRound,
      roundHistory: room.roundHistory,
      phase: room.phase,
      maxRounds: room.maxRounds,
      settings: room.settings,
    },
  });
}

function handleSettingsUpdate(ws, room, message) {
  // Only allow host to update settings
  const playerId = Object.keys(room.players).find(id => room.connections.has(ws) && room.players[id]);
  if (!playerId || !room.players[playerId].isHost) {
    console.log('⚠️  Non-host tried to update settings');
    return;
  }

  // Only allow updates in lobby
  if (room.phase !== 'lobby') {
    console.log('⚠️  Cannot update settings during game');
    return;
  }

  // Update settings
  if (message.settings) {
    room.settings = {
      ...room.settings,
      ...message.settings,
    };
  }

  // Update maxRounds if provided
  if (message.maxRounds !== undefined) {
    room.maxRounds = message.maxRounds;
  }

  console.log(`✓ Settings updated in ${room.id}:`, room.settings, 'maxRounds:', room.maxRounds);

  // Broadcast updated room state
  broadcast(room, {
    type: 'sync',
    room: {
      id: room.id,
      players: room.players,
      currentRound: room.currentRound,
      roundHistory: room.roundHistory,
      phase: room.phase,
      maxRounds: room.maxRounds,
      settings: room.settings,
    },
  });
}

function handleRestart(ws, room) {
  // Reset room state
  Object.values(room.players).forEach(player => {
    player.score = 0;
    player.hasSubmitted = false;
    delete player.answer;
  });

  room.currentRound = null;
  room.roundHistory = [];
  room.phase = 'lobby';

  broadcast(room, {
    type: 'sync',
    room: {
      id: room.id,
      players: room.players,
      currentRound: room.currentRound,
      roundHistory: room.roundHistory,
      phase: room.phase,
      maxRounds: room.maxRounds,
      settings: room.settings,
    },
  });
}

function startNextRound(room) {
  const roundNumber = room.roundHistory.length + 1;

  // Simplified category pairs for demo
  const categoryPairs = [
    ["Things that are RED", "Things found in a KITCHEN"],
    ["Animals that can SWIM", "Things BIGGER than a car"],
    ["Things made of WOOD", "Things in a SCHOOL"],
    ["Countries in ASIA", "Countries with RED in flag"],
    ["Things that are COLD", "Things at a BEACH"],
    ["Jobs that require a UNIFORM", "Jobs that work at NIGHT"],
    ["Things that FLY", "Things that are YELLOW"],
    ["Sports played with a BALL", "Sports played INDOORS"],
    ["Things you PLANT", "Things that are GREEN"],
    ["Musical INSTRUMENTS", "Things made of METAL"],
  ];

  const categories = categoryPairs[(roundNumber - 1) % categoryPairs.length];

  room.currentRound = {
    number: roundNumber,
    categories,
    phase: 'revealing',
    startedAt: Date.now(),
    answers: {},
    timeLimit: room.settings.timeLimit,
  };

  // Reset player submission status
  Object.values(room.players).forEach(player => {
    player.hasSubmitted = false;
    delete player.answer;
  });

  broadcast(room, {
    type: 'sync',
    room: {
      id: room.id,
      players: room.players,
      currentRound: room.currentRound,
      roundHistory: room.roundHistory,
      phase: room.phase,
      maxRounds: room.maxRounds,
      settings: room.settings,
    },
  });

  // Auto-transition to answering phase
  setTimeout(() => {
    if (room.currentRound && room.currentRound.number === roundNumber) {
      room.currentRound.phase = 'answering';
      broadcast(room, {
        type: 'sync',
        room: {
          id: room.id,
          players: room.players,
          currentRound: room.currentRound,
          roundHistory: room.roundHistory,
          phase: room.phase,
          maxRounds: room.maxRounds,
          settings: room.settings,
        },
      });

      // Auto-transition to voting phase
      setTimeout(async () => {
        if (room.currentRound && room.currentRound.number === roundNumber) {
          // Run AI validation on all submitted answers
          await validateAnswersWithAI(room);

          room.currentRound.phase = 'voting';
          broadcast(room, {
            type: 'sync',
            room: {
              id: room.id,
              players: room.players,
              currentRound: room.currentRound,
              roundHistory: room.roundHistory,
              phase: room.phase,
              maxRounds: room.maxRounds,
              settings: room.settings,
            },
          });

          // Auto-transition to scores phase
          setTimeout(() => {
            if (room.currentRound && room.currentRound.number === roundNumber) {
              calculateScores(room);
              room.currentRound.phase = 'scores';

              broadcast(room, {
                type: 'sync',
                room: {
                  id: room.id,
                  players: room.players,
                  currentRound: room.currentRound,
                  roundHistory: room.roundHistory,
                  phase: room.phase,
                  maxRounds: room.maxRounds,
                  settings: room.settings,
                },
              });

              // Move to next round or finish
              setTimeout(() => {
                if (room.currentRound && room.currentRound.number === roundNumber) {
                  room.roundHistory.push(room.currentRound);

                  if (roundNumber >= room.maxRounds) {
                    room.phase = 'finished';
                    room.currentRound = null;
                  } else {
                    startNextRound(room);
                  }

                  broadcast(room, {
                    type: 'sync',
                    room: {
                      id: room.id,
                      players: room.players,
                      currentRound: room.currentRound,
                      roundHistory: room.roundHistory,
                      phase: room.phase,
                      maxRounds: room.maxRounds,
                      settings: room.settings,
                    },
                  });
                }
              }, 5000);
            }
          }, 15000);
        }
      }, room.settings.timeLimit);
    }
  }, room.settings.revealTime || 3000);
}

function calculateScores(room) {
  if (!room.currentRound) return;

  const answers = Object.entries(room.currentRound.answers);
  const sortedByTime = [...answers].sort((a, b) =>
    a[1].submittedAt - b[1].submittedAt
  );

  answers.forEach(([playerId, answerData]) => {
    const player = room.players[playerId];
    if (!player) return;

    let points = 0;

    // Position points (faster = more points)
    const position = sortedByTime.findIndex(([id]) => id === playerId);
    points += Math.max(0, 50 - (position * 10));

    // Validity points - prioritize AI validation, fallback to manual voting
    let isValid = false;

    if (answerData.aiValidation) {
      // Use AI validation if available
      isValid = answerData.aiValidation.valid === true;
    } else if (room.settings.enableVoting) {
      // Fallback to manual voting if AI failed and voting is enabled
      const votes = Object.values(answerData.votes);
      const validVotes = votes.filter(v => v === true).length;
      const invalidVotes = votes.filter(v => v === false).length;
      isValid = validVotes > invalidVotes;
    }

    if (isValid) {
      points += 30;
    }

    // Uniqueness points (different from others)
    const otherAnswers = answers
      .filter(([id]) => id !== playerId)
      .map(([, data]) => data.text.toLowerCase());

    if (!otherAnswers.includes(answerData.text.toLowerCase())) {
      points += 20;
    }

    player.score += points;
  });
}

// AI Validation function
async function validateAnswersWithAI(room) {
  if (!room.currentRound) return;

  const answers = Object.entries(room.currentRound.answers);
  const [category1, category2] = room.currentRound.categories;

  console.log(`🤖 Validating ${answers.length} answers with AI...`);

  // Validate all answers in parallel
  await Promise.all(
    answers.map(async ([playerId, answerData]) => {
      try {
        const response = await fetch(VALIDATION_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            answer: answerData.text,
            category1,
            category2,
          }),
        });

        const result = await response.json();

        // Store AI validation result
        answerData.aiValidation = {
          valid: result.valid || false,
          reason: result.reason || 'Validation failed',
        };

        console.log(`  ✓ ${answerData.text}: ${result.valid ? 'VALID' : 'INVALID'}`);
      } catch (error) {
        console.error(`  ✗ Failed to validate answer for ${playerId}:`, error.message);
        // Default to invalid if AI fails
        answerData.aiValidation = {
          valid: false,
          reason: 'Validation error',
        };
      }
    })
  );

  console.log('✅ AI validation complete');
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║                                                ║
║   🎮 CategoryCrash WebSocket Server           ║
║                                                ║
║   Running on: http://localhost:${PORT}        ║
║   WebSocket: ws://localhost:${PORT}           ║
║                                                ║
║   Status: ✅ Ready for connections            ║
║                                                ║
╚════════════════════════════════════════════════╝
  `);
});

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});
