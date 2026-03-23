import type { Player, Round } from './types';

interface AnswerWithPlayer {
  playerId: string;
  text: string;
  submittedAt: number;
  votes: Record<string, boolean>;
}

/**
 * Calculate scores for a round based on:
 * - Submission speed (1st: 500, 2nd: 400, 3rd+: 300)
 * - Unique bonus: +100 if nobody else wrote the same answer
 * - Invalid penalty: -50 if majority voted invalid
 */
export function calculateRoundScores(
  round: Round,
  players: Record<string, Player>
): Record<string, number> {
  const scores: Record<string, number> = {};

  // Initialize all scores to 0
  Object.keys(players).forEach(id => {
    scores[id] = 0;
  });

  // Convert answers to array with playerId
  const answersArray: AnswerWithPlayer[] = Object.entries(round.answers).map(
    ([playerId, answer]) => ({
      playerId,
      ...answer,
    })
  );

  // Sort by submission time (fastest first)
  answersArray.sort((a, b) => a.submittedAt - b.submittedAt);

  // Track answer frequency for uniqueness bonus
  const answerFrequency: Record<string, number> = {};
  answersArray.forEach(({ text }) => {
    const normalized = text.toLowerCase().trim();
    answerFrequency[normalized] = (answerFrequency[normalized] || 0) + 1;
  });

  // Calculate scores
  answersArray.forEach((answer, index) => {
    const { playerId, text, votes } = answer;
    let score = 0;

    // Base score by position
    if (index === 0) score = 500;       // 1st
    else if (index === 1) score = 400;  // 2nd
    else score = 300;                    // 3rd+

    // Check if answer is unique
    const normalized = text.toLowerCase().trim();
    if (answerFrequency[normalized] === 1) {
      score += 100; // Unique bonus
    }

    // Check validity from voting
    const voteResults = Object.values(votes);
    if (voteResults.length > 0) {
      const validVotes = voteResults.filter(v => v).length;
      const invalidVotes = voteResults.length - validVotes;

      // Majority voted invalid (ties count as valid)
      if (invalidVotes > validVotes) {
        score -= 50;
      }
    }

    scores[playerId] = Math.max(0, score); // Never negative
  });

  return scores;
}

/**
 * Check if answer is valid based on vote majority
 * Ties count as valid
 */
export function isAnswerValid(votes: Record<string, boolean>): boolean {
  const voteResults = Object.values(votes);
  if (voteResults.length === 0) return true; // No votes = valid by default

  const validVotes = voteResults.filter(v => v).length;
  const invalidVotes = voteResults.length - validVotes;

  return validVotes >= invalidVotes; // Ties go to valid
}

/**
 * Get sorted leaderboard from players
 */
export function getLeaderboard(players: Record<string, Player>): Player[] {
  return Object.values(players).sort((a, b) => b.score - a.score);
}
