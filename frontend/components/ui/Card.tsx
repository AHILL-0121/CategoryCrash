'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        bg-cream border-[2.5px] border-press-black
        rounded-[16px] shadow-brutal-lg
        ${className}
      `}
    >
      {children}
    </div>
  );
}
