'use client';

import { useToast } from '@/contexts/ToastContext';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-[90vw] sm:max-w-md pointer-events-none">
      {toasts.map((toast) => {
        const bgColor = {
          error: 'bg-crash-red',
          success: 'bg-volt-green',
          warning: 'bg-coral',
          info: 'bg-newsprint',
        }[toast.type];

        const textColor = {
          error: 'text-white',
          success: 'text-press-black',
          warning: 'text-press-black',
          info: 'text-press-black',
        }[toast.type];

        const icon = {
          error: '❌',
          success: '✓',
          warning: '⚠️',
          info: 'ℹ️',
        }[toast.type];

        return (
          <div
            key={toast.id}
            className={`
              ${bgColor} ${textColor}
              px-5 py-3.5 border-[2.5px] border-press-black
              rounded-[12px] shadow-brutal
              animate-slide-in-right pointer-events-auto
              cursor-pointer
              hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg
              active:translate-x-0.5 active:translate-y-0.5 active:shadow-brutal-hover
              transition-all
            `}
            onClick={() => removeToast(toast.id)}
          >
            <div className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{icon}</span>
              <p className="font-medium text-sm leading-snug">
                {toast.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
