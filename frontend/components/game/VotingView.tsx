'use client';

import { useState } from 'react';
import type { Round, Player } from '@/lib/types';
import { Button } from '../ui/Button';
import { TimerBar } from '../ui/TimerBar';

interface VotingViewProps {
  round: Round;
  players: Record<string, Player>;
  myPlayerId: string | null;
  onVote: (targetPlayerId: string, valid: boolean) => void;
}

const VOTING_TIME_LIMIT = 15000; // 15 seconds

export function VotingView({ round, players, myPlayerId, onVote }: VotingViewProps) {
  const [votes, setVotes] = useState<Record<string, boolean | null>>({});

  const handleVote = (playerId: string, valid: boolean) => {
    setVotes(prev => ({ ...prev, [playerId]: valid }));
    onVote(playerId, valid);
  };

  const answers = Object.entries(round.answers);

  // Check if AI validation is available for all answers
  const hasAnyAIValidation = answers.some(([_, answerData]) => answerData.aiValidation);
  const allAIValidated = answers.every(([_, answerData]) => answerData.aiValidation);

  return (
    <div className="w-full max-w-[700px] mx-auto px-5 py-10 flex flex-col gap-6">
      {/* Header */}
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <img
            src="/categorycrash-pixel-icon.svg"
            alt="Validation"
            className="w-16 h-16"
          />
        </div>
        <h2 className="font-anton text-3xl text-press-black mb-2">
          {hasAnyAIValidation ? 'AI VALIDATION' : 'VOTE ON ANSWERS'}
        </h2>
        <p className="font-mono text-sm text-muted">
          {hasAnyAIValidation && !allAIValidated && 'AI is judging answers... Manual voting available for pending answers'}
          {hasAnyAIValidation && allAIValidated && 'AI has judged all answers'}
          {!hasAnyAIValidation && 'Vote if answers are valid for both categories'}
        </p>
      </div>

      {/* Categories reminder */}
      <div className="flex items-center justify-center gap-2 flex-wrap text-center">
        <span className="font-anton text-sm text-crash-red">
          {round.categories[0]}
        </span>
        <span className="text-muted">✕</span>
        <span className="font-anton text-sm text-volt-green-dark">
          {round.categories[1]}
        </span>
      </div>

      {/* Timer */}
      <TimerBar duration={VOTING_TIME_LIMIT} active={true} />

      {/* Answer cards */}
      <div className="space-y-4">
        {answers.map(([playerId, answerData]) => {
          const player = players[playerId];
          if (!player) return null;

          const isMyAnswer = playerId === myPlayerId;
          const aiValidation = answerData.aiValidation;

          return (
            <div
              key={playerId}
              className="
                border-[2.5px] border-press-black
                rounded-[16px] bg-cream
                shadow-brutal p-5
              "
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-crash-red border-[2px] border-press-black flex items-center justify-center font-anton text-white text-sm">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-epilogue font-semibold">
                      {player.name}
                    </span>
                    {isMyAnswer && (
                      <span className="font-anton text-[10px] tracking-wider px-2 py-0.5 bg-press-black text-white rounded-sm">
                        YOU
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-lg font-medium text-press-black mb-3">
                    &ldquo;{answerData.text}&rdquo;
                  </div>
                </div>
              </div>

              {/* AI Validation Result or Manual Voting */}
              {aiValidation ? (
                <div className={`
                  rounded-[10px] p-4 border-[2.5px] border-press-black
                  ${aiValidation.valid ? 'bg-volt-green' : 'bg-crash-red/10'}
                `}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">
                      {aiValidation.valid ? '✓' : '✗'}
                    </span>
                    <span className="font-anton text-sm tracking-wider">
                      {aiValidation.valid ? 'VALID' : 'INVALID'} (AI)
                    </span>
                  </div>
                  <p className="text-xs text-muted leading-relaxed">
                    {aiValidation.reason}
                  </p>
                </div>
              ) : (
                <>
                  {!isMyAnswer ? (
                    <div>
                      <div className="rounded-[10px] p-3 mb-3 border-[2.5px] border-press-black bg-newsprint">
                        <div className="flex items-center gap-2 justify-center">
                          <div className="animate-spin text-base">⏳</div>
                          <span className="font-mono text-xs text-muted">
                            AI validation pending... Vote manually
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button
                          variant={votes[playerId] === true ? 'green' : 'ghost'}
                          onClick={() => handleVote(playerId, true)}
                          className="flex-1"
                        >
                          ✓ Valid
                        </Button>
                        <Button
                          variant={votes[playerId] === false ? 'red' : 'ghost'}
                          onClick={() => handleVote(playerId, false)}
                          className="flex-1"
                        >
                          ✗ Invalid
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[10px] p-4 border-[2.5px] border-press-black bg-newsprint">
                      <div className="text-center font-mono text-xs text-muted">
                        {aiValidation === undefined ? 'AI validation pending...' : 'You cannot vote on your own answer'}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
