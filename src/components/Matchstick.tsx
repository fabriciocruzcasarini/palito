import React from 'react';

interface MatchstickProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  rotation?: number;
  isDiscarded?: boolean;
  highlighted?: boolean;
}

export const Matchstick: React.FC<MatchstickProps> = ({
  className = '',
  size = 'md',
  rotation = 0,
  isDiscarded = false,
  highlighted = false,
}) => {
  const sizeMap = {
    sm: { width: 8, height: 38 },
    md: { width: 12, height: 60 },
    lg: { width: 16, height: 84 },
    xl: { width: 22, height: 110 },
  };

  const { width, height } = sizeMap[size];

  return (
    <div
      className={`inline-flex items-center justify-center transition-all duration-300 ${
        isDiscarded ? 'opacity-25 grayscale scale-90' : ''
      } ${highlighted ? 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'drop-shadow-md'} ${className}`}
      style={{
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'bottom center',
      }}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 16 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Wood shaft gradient */}
          <linearGradient id="matchWood" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="30%" stopColor="#fef3c7" />
            <stop offset="70%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Match head phosphorus gradient */}
          <radialGradient id="matchHead" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="40%" stopColor="#dc2626" />
            <stop offset="85%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#450a0a" />
          </radialGradient>

          {/* Slight char below head */}
          <linearGradient id="matchChar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350f" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Wooden shaft */}
        <rect
          x="4.5"
          y="18"
          width="7"
          height="62"
          rx="1.5"
          fill="url(#matchWood)"
          stroke="#92400e"
          strokeWidth="0.8"
        />

        {/* Char mark under head */}
        <rect x="4.5" y="18" width="7" height="8" rx="0.5" fill="url(#matchChar)" />

        {/* Red phosphorus match head */}
        <ellipse
          cx="8"
          cy="12"
          rx="5.5"
          ry="9"
          fill="url(#matchHead)"
          stroke="#7f1d1d"
          strokeWidth="0.8"
        />

        {/* Phosphorus highlight gloss */}
        <ellipse cx="6.5" cy="8.5" rx="2" ry="3.5" fill="#fecaca" opacity="0.6" />
      </svg>
    </div>
  );
};
