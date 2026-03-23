'use client';

interface PlayerAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function PlayerAvatar({ name, size = 'md', color }: PlayerAvatarProps) {
  const initial = name.charAt(0).toUpperCase();

  // Generate a consistent color based on name if not provided
  const getColor = () => {
    if (color) return color;

    const colors = [
      '#FFE8E8', // light red
      '#E8FFE8', // light green
      '#FFF8E0', // light yellow
      '#EEF0FF', // light blue
      '#FFE8F5', // light pink
      '#E8F8FF', // light cyan
    ];

    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
  };

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full border-[2px] border-press-black
        flex items-center justify-center
        font-anton tracking-wide
        flex-shrink-0
      `}
      style={{ background: getColor() }}
    >
      {initial}
    </div>
  );
}
