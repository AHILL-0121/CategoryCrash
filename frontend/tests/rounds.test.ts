import test from 'node:test';
import assert from 'node:assert/strict';
import { getRoundWinner, isAnswerValid } from '../lib/rounds.ts';
import type { AnswerRecord, Round } from '../lib/types.ts';

function answer(partial: Partial<AnswerRecord> & { submittedAt: number; text: string }): AnswerRecord {
  return { votes: {}, ...partial };
}

function round(answers: Record<string, AnswerRecord>): Round {
  return {
    number: 1,
    categories: ['Things that are RED', 'Things found in a KITCHEN'],
    phase: 'scores',
    startedAt: 0,
    answers,
    timeLimit: 20_000,
    votingTime: 15_000,
  };
}

const PLAYERS = {
  p1: { id: 'p1', name: 'Ada' },
  p2: { id: 'p2', name: 'Grace' },
  p3: { id: 'p3', name: 'Alan' },
};

test('an AI verdict decides validity outright', () => {
  assert.equal(
    isAnswerValid(answer({ text: 'tomato', submittedAt: 1, aiValidation: { valid: true, reason: '' } })),
    true
  );
  assert.equal(
    isAnswerValid(answer({ text: 'zebra', submittedAt: 1, aiValidation: { valid: false, reason: '' } })),
    false
  );
});

test('with no verdict, manual votes decide and ties go to valid', () => {
  const tied = answer({ text: 'ketchup', submittedAt: 1, votes: { a: true, b: false } });
  assert.equal(isAnswerValid(tied), true);

  const rejected = answer({ text: 'ketchup', submittedAt: 1, votes: { a: false, b: false, c: true } });
  assert.equal(isAnswerValid(rejected), false);
});

test('votes are ignored when the host disabled manual voting', () => {
  const outvoted = answer({ text: 'ketchup', submittedAt: 1, votes: { a: false, b: false } });
  assert.equal(isAnswerValid(outvoted, false), true);
});

// The core reason ScoreView was wrong: it showed whoever led the cumulative
// leaderboard, not whoever actually won the round.
test('the round winner is the fastest VALID answer, not the fastest answer', () => {
  const r = round({
    p1: answer({ text: 'zebra', submittedAt: 100, aiValidation: { valid: false, reason: '' } }),
    p2: answer({ text: 'tomato', submittedAt: 200, aiValidation: { valid: true, reason: '' } }),
    p3: answer({ text: 'apple', submittedAt: 300, aiValidation: { valid: true, reason: '' } }),
  });

  const winner = getRoundWinner(r, PLAYERS);
  assert.equal(winner?.name, 'Grace');
  assert.equal(winner?.answer, 'tomato');
  assert.equal(winner?.invalid, undefined);
});

test('when nothing is valid, the fastest answer is flagged rather than crowned', () => {
  const r = round({
    p1: answer({ text: 'zebra', submittedAt: 100, aiValidation: { valid: false, reason: '' } }),
    p2: answer({ text: 'banana', submittedAt: 200, aiValidation: { valid: false, reason: '' } }),
  });

  const winner = getRoundWinner(r, PLAYERS);
  assert.equal(winner?.name, 'Ada');
  assert.equal(winner?.invalid, true);
});

test('a round nobody answered has no winner', () => {
  assert.equal(getRoundWinner(round({}), PLAYERS), null);
});

test('a player who left is named rather than rendered as "Unknown"', () => {
  const r = round({
    ghost: answer({ text: 'tomato', submittedAt: 100, aiValidation: { valid: true, reason: '' } }),
  });

  const winner = getRoundWinner(r, PLAYERS);
  assert.equal(winner?.name, 'A player who left');
});
