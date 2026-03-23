'use client';

import { useState, FormEvent } from 'react';
import type { Round } from '@/lib/types';
import { TimerBar } from '../ui/TimerBar';

interface AnswerViewProps {
  round: Round;
  players: any[];
  onSubmit: (answer: string) => void;
  hasSubmitted: boolean;
  maxRounds?: number;
}

export function AnswerView({ round, players, onSubmit, hasSubmitted, maxRounds = 10 }: AnswerViewProps) {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (answer.trim() && !hasSubmitted) {
      onSubmit(answer.trim());
      setAnswer('');
    }
  };

  const submittedCount = players.filter(p => p.hasSubmitted).length;

  return (
    <div className="w-full max-w-[600px] mx-auto px-5 py-10 flex flex-col gap-6">
      {/* Round number */}
      <div className="text-center">
        <span className="font-mono text-xs tracking-widest uppercase text-muted">
          Round {round.number} of {maxRounds}
        </span>
      </div>

      {/* Categories display */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <div
          className="
            font-anton text-xl sm:text-2xl tracking-wide
            px-6 py-3 border-[2.5px] border-press-black
            rounded-[10px] bg-crash-red text-white
            shadow-brutal
          "
        >
          {round.categories[0]}
        </div>
        <div className="flex items-center justify-center">
          <img
            src="/categorycrash-emblem.svg"
            alt="vs"
            className="w-12 h-12 opacity-80"
          />
        </div>
        <div
          className="
            font-anton text-xl sm:text-2xl tracking-wide
            px-6 py-3 border-[2.5px] border-press-black
            rounded-[10px] bg-volt-green text-press-black
            shadow-brutal
          "
        >
          {round.categories[1]}
        </div>
      </div>

      {/* Timer */}
      <TimerBar
        duration={round.timeLimit}
        active={round.phase === 'answering'}
        onComplete={() => {}}
      />

      {/* Answer input */}
      {!hasSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer here..."
            autoFocus
            className="
              w-full font-mono text-base font-medium
              px-4 py-3.5 border-[2.5px] border-press-black
              rounded-[10px] bg-newsprint text-press-black
              shadow-brutal focus:shadow-brutal-lg
              focus:-translate-x-0.5 focus:-translate-y-0.5
              transition-all outline-none
              placeholder:text-ink-gray placeholder:font-normal
            "
          />
          <button
            type="submit"
            disabled={!answer.trim()}
            className="
              w-full font-anton text-base tracking-wider
              px-7 py-3.5 border-[2.5px] border-press-black
              rounded-[10px] bg-volt-green text-press-black
              shadow-brutal hover:shadow-brutal-lg
              active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-hover
              hover:-translate-x-0.5 hover:-translate-y-0.5
              transition-all duration-100
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            ✓ SUBMIT ANSWER
          </button>
        </form>
      ) : (
        <div className="text-center py-8">
          <div className="inline-block px-8 py-4 bg-volt-green/20 border-[2.5px] border-volt-green rounded-[16px]">
            <div className="font-anton text-2xl text-volt-green-dark mb-2">
              ✓ Answer Submitted!
            </div>
            <p className="font-mono text-sm text-muted">
              Waiting for other players...
            </p>
          </div>
        </div>
      )}

      {/* Submission indicators */}
      <div className="text-center">
        <p className="font-mono text-xs tracking-widest uppercase text-muted mb-3">
          Players submitted
        </p>
        <div className="flex items-center justify-center gap-2">
          {players.map((player) => (
            <div
              key={player.id}
              className={`
                w-10 h-10 rounded-full border-[2.5px] border-press-black
                flex items-center justify-center font-anton text-sm
                transition-all
                ${
                  player.hasSubmitted
                    ? 'bg-volt-green text-press-black scale-110'
                    : 'bg-gray-200 text-gray-400'
                }
              `}
            >
              {player.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
        <p className="font-mono text-xs text-muted mt-2">
          {submittedCount} / {players.length}
        </p>
      </div>
    </div>
  );
}
