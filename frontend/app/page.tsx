'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';

export default function HomePage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      showToast('Please enter your name before creating a room', 'error');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/room/create', { method: 'POST' });
      const data = await response.json();

      if (data.roomId) {
        showToast('Room created successfully! 🎮', 'success');
        router.push(`/room/${data.roomId}?name=${encodeURIComponent(playerName)}`);
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      showToast('Failed to create room. Please try again.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = (e: FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      showToast('Please enter your name before joining', 'error');
      return;
    }
    if (!roomCode.trim()) {
      showToast('Please enter a room code', 'warning');
      return;
    }

    router.push(`/room/${roomCode.toUpperCase()}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-10 perspective-[1000px]">
      <div className="w-full max-w-[480px] flex flex-col gap-5">
        {/* Hero Section */}
        <div
          className="
            text-center px-8 py-10 border-[2.5px] border-press-black
            rounded-[16px] bg-newsprint shadow-brutal-lg
            relative overflow-hidden
          "
        >
          {/* Decorative circles */}
          <div className="absolute -top-14 -left-14 w-48 h-48 bg-crash-red/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-14 -right-14 w-48 h-48 bg-volt-green/5 rounded-full pointer-events-none" />

          <div className="relative z-10">
            {/* Primary Logo */}
            <div className="mb-4 flex justify-center">
              <img
                src="/categorycrash-logo-primary.svg"
                alt="CategoryCrash Logo"
                className="w-full max-w-[320px] h-auto"
              />
            </div>
            <p className="text-sm text-muted font-medium mt-3 leading-relaxed">
              Answer two categories at once.<br />Speed meets creativity.
            </p>

            {/* Category preview */}
            <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
              <span className="font-anton text-xs tracking-wider px-3.5 py-1.5 border-[2.5px] border-press-black rounded-[6px] bg-crash-red text-white animate-float">
                THINGS THAT ARE RED
              </span>
              <span className="font-anton text-lg opacity-35">✕</span>
              <span className="font-anton text-xs tracking-wider px-3.5 py-1.5 border-[2.5px] border-press-black rounded-[6px] bg-volt-green text-press-black animate-float" style={{ animationDelay: '0.5s' }}>
                FOUND IN KITCHEN
              </span>
            </div>
          </div>
        </div>

        {/* Name input */}
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          className="
            w-full font-mono text-base font-medium
            px-4 py-3.5 border-[2.5px] border-press-black
            rounded-[10px] bg-newsprint
            shadow-brutal focus:shadow-brutal-lg
            focus:-translate-x-0.5 focus:-translate-y-0.5
            transition-all outline-none
            placeholder:text-ink-gray placeholder:font-normal
          "
        />

        {/* Action cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className="
              bg-cream border-[2.5px] border-press-black
              rounded-[16px] p-5 shadow-brutal
              hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brutal-lg
              active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-hover
              transition-all cursor-pointer
            "
            onClick={handleCreateRoom}
          >
            <div className="font-anton text-[11px] tracking-[0.12em] uppercase text-crash-red mb-2">
              Start New
            </div>
            <div className="font-anton text-2xl leading-none tracking-tight mb-1.5">
              CREATE<br />ROOM
            </div>
            <div className="text-xs text-muted leading-snug">
              Be the host
            </div>
            <div className="mt-4">
              <Button
                variant="red"
                className="w-full"
                disabled={isCreating}
              >
                {isCreating ? '...' : 'CREATE'}
              </Button>
            </div>
          </div>

          <div
            className="
              bg-cream border-[2.5px] border-press-black
              rounded-[16px] p-5 shadow-brutal
            "
          >
            <div className="font-anton text-[11px] tracking-[0.12em] uppercase text-volt-green-dark mb-2">
              Have Code?
            </div>
            <div className="font-anton text-2xl leading-none tracking-tight mb-1.5">
              JOIN<br />ROOM
            </div>
            <div className="text-xs text-muted leading-snug mb-3">
              Enter room code
            </div>
            <form onSubmit={handleJoinRoom} className="space-y-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="ROOM-CODE"
                maxLength={15}
                className="
                  w-full font-mono text-sm font-medium uppercase
                  px-3 py-2 border-[2px] border-press-black
                  rounded-[8px] bg-newsprint
                  shadow-brutal-hover
                  transition-all outline-none
                  placeholder:text-ink-gray placeholder:font-normal
                "
              />
              <Button
                type="submit"
                variant="green"
                className="w-full text-sm py-2"
                disabled={isJoining}
              >
                {isJoining ? '...' : 'JOIN'}
              </Button>
            </form>
          </div>
        </div>

        {/* How to play */}
        <div className="border-[2.5px] border-press-black rounded-[16px] bg-newsprint p-5 flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[110px] text-center">
            <div className="font-anton text-3xl leading-none text-crash-red">1</div>
            <p className="text-xs text-muted mt-1 leading-snug">Type answer for BOTH categories</p>
          </div>
          <div className="font-anton text-xl text-ink-gray self-center pt-1.5">→</div>
          <div className="flex-1 min-w-[110px] text-center">
            <div className="font-anton text-3xl leading-none text-crash-red">2</div>
            <p className="text-xs text-muted mt-1 leading-snug">AI validates your answer</p>
          </div>
          <div className="font-anton text-xl text-ink-gray self-center pt-1.5">→</div>
          <div className="flex-1 min-w-[110px] text-center">
            <div className="font-anton text-3xl leading-none text-crash-red">3</div>
            <p className="text-xs text-muted mt-1 leading-snug">Win with speed & creativity</p>
          </div>
        </div>

        {/* Game Rules */}
        <div className="border-[2.5px] border-press-black rounded-[16px] bg-cream shadow-brutal overflow-hidden">
          <div className="px-5 py-3.5 border-b-[2.5px] border-press-black bg-newsprint">
            <h2 className="font-anton text-sm tracking-widest uppercase">
              📖 Game Rules
            </h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Objective */}
            <div>
              <h3 className="font-anton text-sm text-crash-red mb-1.5">OBJECTIVE</h3>
              <p className="text-xs text-muted leading-relaxed">
                Each round shows TWO categories. Find a single answer that fits BOTH categories.
                Example: &ldquo;Tomato&rdquo; fits both &ldquo;Things that are RED&rdquo; and &ldquo;Found in Kitchen&rdquo;.
              </p>
            </div>

            {/* Scoring */}
            <div>
              <h3 className="font-anton text-sm text-volt-green-dark mb-1.5">SCORING</h3>
              <ul className="text-xs text-muted space-y-1.5">
                <li className="flex items-start gap-2">
                  <span className="text-crash-red font-bold">⚡</span>
                  <span><strong>Speed matters!</strong> 1st valid answer: 500pts, 2nd: 400pts, others: 300pts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-volt-green font-bold">✦</span>
                  <span><strong>Unique bonus:</strong> +100pts if no one else has your answer</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-coral font-bold">✕</span>
                  <span><strong>Invalid answers:</strong> 0pts (AI validates if answer fits both categories)</span>
                </li>
              </ul>
            </div>

            {/* Tips */}
            <div>
              <h3 className="font-anton text-sm text-coral mb-1.5">PRO TIPS</h3>
              <ul className="text-xs text-muted space-y-1">
                <li>• Think fast but think smart - invalid answers score nothing!</li>
                <li>• Creative answers are more likely to be unique (+100 bonus)</li>
                <li>• The host can adjust rounds, time limits, and difficulty</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
