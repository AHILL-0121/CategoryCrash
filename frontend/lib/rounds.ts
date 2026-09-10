import type { AnswerRecord, Player, Round } from './types';

/**
 * Whether an answer counts as valid for display purposes.
 *
 * Mirrors `calculateScores` in `party/index.ts`: the AI verdict wins outright;
 * with no verdict we fall back to the manual votes (ties go to valid), and with
 * neither we give the benefit of the doubt.
 *
 * The server remains the authority — this only decides what the UI renders.
 */
export function isAnswerValid(answer: AnswerRecord, enableVoting = true): boolean {
  if (answer.aiValidation) return answer.aiValidation.valid;

  const votes = Object.values(answer.votes ?? {});
  if (!enableVoting || votes.length === 0) return true;

  const validVotes = votes.filter(Boolean).length;
  return validVotes >= votes.length - validVotes;
}

export interface RoundWinner {
  playerId: string;
  name: string;
  answer: string;
  /** True when nobody produced a valid answer and this is just the fastest one. */
  invalid?: boolean;
}

/**
 * The winner of a single round: the fastest VALID answer, matching how the
 * server awards the 500-point top slot. Falls back to the fastest answer overall
 * (flagged `invalid`) when no answer survived validation.
 */
export function getRoundWinner(
  round: Round,
  players: Record<string, Pick<Player, 'id' | 'name'>>,
  enableVoting = true
): RoundWinner | null {
  const answers = Object.entries(round.answers)
    .map(([playerId, answer]) => ({ playerId, ...answer }))
    .sort((a, b) => a.submittedAt - b.submittedAt);

  if (answers.length === 0) return null;

  const named = (playerId: string) => players[playerId]?.name ?? 'A player who left';

  const firstValid = answers.find(a => isAnswerValid(a, enableVoting));
  if (firstValid) {
    return {
      playerId: firstValid.playerId,
      name: named(firstValid.playerId),
      answer: firstValid.text,
    };
  }

  return {
    playerId: answers[0].playerId,
    name: named(answers[0].playerId),
    answer: answers[0].text,
    invalid: true,
  };
}
