'use client';

import { useEffect, useState } from 'react';
import type { GameRoom, Difficulty } from '@/lib/types';
import { LIMITS } from '@/lib/types';
import { Button } from '../ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface RoomSettingsProps {
  settings: GameRoom['settings'];
  maxRounds: number;
  isHost: boolean;
  onUpdateSettings: (settings: Partial<GameRoom['settings']>, maxRounds?: number) => void;
}

const DIFFICULTY_BLURB: Record<Difficulty, string> = {
  easy: 'Common, straightforward categories',
  medium: 'Moderately challenging combinations',
  hard: 'Tricky and creative categories',
};

export function RoomSettings({ settings, maxRounds, isHost, onUpdateSettings }: RoomSettingsProps) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localMaxRounds, setLocalMaxRounds] = useState(maxRounds);

  // Resync whenever the server state changes while the panel is closed, so
  // opening it never shows a stale snapshot from first render.
  useEffect(() => {
    if (isOpen) return;
    setLocalSettings(settings);
    setLocalMaxRounds(maxRounds);
  }, [isOpen, settings, maxRounds]);

  if (!isHost) return null;

  const handleSave = () => {
    onUpdateSettings(localSettings, localMaxRounds);
    setIsOpen(false);
    showToast('Settings saved! ⚙️', 'success');
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    setLocalMaxRounds(maxRounds);
    setIsOpen(false);
    showToast('Changes discarded', 'info');
  };

  return (
    <div>
      {/* Settings Button */}
      {!isOpen && (
        <Button
          variant="ghost"
          onClick={() => setIsOpen(true)}
          className="w-full text-sm"
        >
          ⚙️ Room Settings
        </Button>
      )}

      {/* Settings Panel */}
      {isOpen && (
        <div className="border-[2.5px] border-press-black rounded-[16px] bg-cream shadow-brutal p-5 space-y-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-anton text-lg tracking-wider">ROOM SETTINGS</h3>
            <button
              onClick={handleCancel}
              aria-label="Close settings"
              className="text-muted hover:text-press-black text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Number of Rounds */}
          <div>
            <label htmlFor="setting-rounds" className="block font-epilogue font-semibold text-sm mb-2">
              Number of Rounds
            </label>
            <div className="flex items-center gap-3">
              <input
                id="setting-rounds"
                type="range"
                min={LIMITS.maxRounds.min}
                max={LIMITS.maxRounds.max}
                value={localMaxRounds}
                onChange={(e) => setLocalMaxRounds(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-mono text-sm font-bold w-10 text-center">
                {localMaxRounds}
              </span>
            </div>
          </div>

          {/* Time Limit */}
          <div>
            <label htmlFor="setting-time" className="block font-epilogue font-semibold text-sm mb-2">
              Answer Time (seconds)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="setting-time"
                type="range"
                min={LIMITS.timeLimit.min / 1000}
                max={LIMITS.timeLimit.max / 1000}
                step="5"
                value={localSettings.timeLimit / 1000}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  timeLimit: Number(e.target.value) * 1000
                })}
                className="flex-1"
              />
              <span className="font-mono text-sm font-bold w-10 text-center">
                {localSettings.timeLimit / 1000}s
              </span>
            </div>
          </div>

          {/* Reveal Time */}
          <div>
            <label htmlFor="setting-reveal" className="block font-epilogue font-semibold text-sm mb-2">
              Category Reveal Time (seconds)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="setting-reveal"
                type="range"
                min={LIMITS.revealTime.min / 1000}
                max={LIMITS.revealTime.max / 1000}
                step="1"
                value={localSettings.revealTime / 1000}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  revealTime: Number(e.target.value) * 1000
                })}
                className="flex-1"
              />
              <span className="font-mono text-sm font-bold w-10 text-center">
                {localSettings.revealTime / 1000}s
              </span>
            </div>
          </div>

          {/* Voting Time */}
          <div>
            <label htmlFor="setting-voting" className="block font-epilogue font-semibold text-sm mb-2">
              Answer Reveal &amp; Voting Time (seconds)
            </label>
            <div className="flex items-center gap-3">
              <input
                id="setting-voting"
                type="range"
                min={LIMITS.votingTime.min / 1000}
                max={LIMITS.votingTime.max / 1000}
                step="5"
                value={localSettings.votingTime / 1000}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  votingTime: Number(e.target.value) * 1000
                })}
                className="flex-1"
              />
              <span className="font-mono text-sm font-bold w-10 text-center">
                {localSettings.votingTime / 1000}s
              </span>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <span className="block font-epilogue font-semibold text-sm mb-2">
              Category Difficulty
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  type="button"
                  aria-pressed={localSettings.difficulty === diff}
                  onClick={() => setLocalSettings({ ...localSettings, difficulty: diff })}
                  className={`
                    py-2 px-3 border-[2.5px] border-press-black rounded-[8px]
                    font-anton text-xs tracking-wider uppercase
                    transition-all
                    ${localSettings.difficulty === diff
                      ? 'bg-crash-red text-white shadow-brutal'
                      : 'bg-newsprint text-press-black hover:bg-cream'
                    }
                  `}
                >
                  {diff}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted mt-2 leading-snug">
              {DIFFICULTY_BLURB[localSettings.difficulty]}
            </p>
          </div>

          {/* Max Players */}
          <div>
            <label htmlFor="setting-players" className="block font-epilogue font-semibold text-sm mb-2">
              Max Players
            </label>
            <div className="flex items-center gap-3">
              <input
                id="setting-players"
                type="range"
                min={LIMITS.maxPlayers.min}
                max={LIMITS.maxPlayers.max}
                value={localSettings.maxPlayers}
                onChange={(e) => setLocalSettings({
                  ...localSettings,
                  maxPlayers: Number(e.target.value)
                })}
                className="flex-1"
              />
              <span className="font-mono text-sm font-bold w-10 text-center">
                {localSettings.maxPlayers}
              </span>
            </div>
          </div>

          {/* Manual Voting Fallback */}
          <div className="flex items-center justify-between">
            <div>
              <span className="block font-epilogue font-semibold text-sm">
                Manual Voting Fallback
              </span>
              <p className="text-xs text-muted mt-1">
                Let players vote when the AI can&apos;t reach a verdict
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={localSettings.enableVoting}
              aria-label="Manual voting fallback"
              onClick={() => setLocalSettings({
                ...localSettings,
                enableVoting: !localSettings.enableVoting
              })}
              className={`
                w-12 h-7 rounded-full border-[2.5px] border-press-black
                transition-all relative
                ${localSettings.enableVoting ? 'bg-volt-green' : 'bg-newsprint'}
              `}
            >
              <div className={`
                absolute top-0.5 w-5 h-5 rounded-full bg-press-black
                transition-all border-[2px] border-white
                ${localSettings.enableVoting ? 'right-0.5' : 'left-0.5'}
              `} />
            </button>
          </div>

          {/* Save/Cancel Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="ghost" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button variant="green" onClick={handleSave} className="flex-1">
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
