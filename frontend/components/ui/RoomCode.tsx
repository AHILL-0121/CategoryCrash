'use client';

import { useState } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface RoomCodeProps {
  code: string;
}

export function RoomCode({ code }: RoomCodeProps) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    showToast('Room code copied! 📋', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2.5">
      <div
        onClick={handleCopy}
        className="
          font-anton text-[22px] tracking-[0.15em]
          bg-crash-red text-white
          px-4 py-2 rounded-[6px]
          border-[1.5px] border-white/20
          cursor-pointer active:scale-95 transition-transform
        "
      >
        {code}
      </div>
      <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
        {copied ? 'Copied!' : 'Click to copy'}
      </span>
    </div>
  );
}
