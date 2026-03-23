'use client';

import { useState } from 'react';
import type { GameRoom } from '@/lib/types';
import { Button } from '../ui/Button';
import { useToast } from '@/contexts/ToastContext';

interface RoomSettingsProps {
  settings: GameRoom['settings'];
  maxRounds: number;
  isHost: boolean;
  onUpdateSettings: (settings: Partial<GameRoom['settings']>, maxRounds?: number) => void;
  onUpdateMaxRounds: (maxRounds: number) => void; // Kept for backwards compatibility
}

export function RoomSettings({
  settings,
  maxRounds,
  isHost,
  onUpdateSettings,
  onUpdateMaxRounds
}: RoomSettingsProps) {
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);
  const [localMaxRounds, setLocalMaxRounds] = useState(maxRounds);

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
              className="text-muted hover:text-press-black text-xl leading-none"
            >
              ✕
            </button>
          </div>

          {/* Number of Rounds */}
          <div>
            <label className="block font-epilogue font-semibold text-sm mb-2">
              Number of Rounds
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="3"
                max="15"
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
            <label className="block font-epilogue font-semibold text-sm mb-2">
              Answer Time (seconds)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="60"
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
            <label className="block font-epilogue font-semibold text-sm mb-2">
              Category Reveal Time (seconds)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="10"
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

          {/* Difficulty */}
          <div>
            <label className="block font-epilogue font-semibold text-sm mb-2">
              Category Difficulty
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setLocalSettings({
                    ...localSettings,
                    difficulty: diff
                  })}
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
              {localSettings.difficulty === 'easy' && 'Common, straightforward categories'}
              {localSettings.difficulty === 'medium' && 'Moderately challenging combinations'}
              {localSettings.difficulty === 'hard' && 'Tricky and creative categories'}
            </p>
          </div>

          {/* Max Players */}
          <div>
            <label className="block font-epilogue font-semibold text-sm mb-2">
              Max Players
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="2"
                max="10"
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
              <label className="block font-epilogue font-semibold text-sm">
                Manual Voting Fallback
              </label>
              <p className="text-xs text-muted mt-1">
                Allow manual voting if AI validation fails
              </p>
            </div>
            <button
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
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="green"
              onClick={handleSave}
              className="flex-1"
            >
              Save Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
