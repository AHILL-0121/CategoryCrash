'use client';

import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'red' | 'green' | 'black' | 'ghost' | 'coral';
  children: ReactNode;
}

export function Button({
  variant = 'red',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantClasses = {
    red: 'bg-crash-red text-white',
    green: 'bg-volt-green text-press-black',
    black: 'bg-press-black text-white',
    ghost: 'bg-newsprint text-press-black',
    coral: 'bg-coral text-white',
  };

  return (
    <button
      className={`
        font-anton text-base tracking-wider px-7 py-3.5
        border-[2.5px] border-press-black rounded-[10px]
        shadow-brutal hover:shadow-brutal-lg
        active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-hover
        hover:-translate-x-0.5 hover:-translate-y-0.5
        transition-all duration-100
        inline-flex items-center justify-center gap-2
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
