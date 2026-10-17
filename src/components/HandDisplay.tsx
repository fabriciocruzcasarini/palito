import React from 'react';
import { Matchstick } from './Matchstick';

interface HandDisplayProps {
  sticksCount: number | null;
  isOpen: boolean;
  isHuman: boolean;
  playerName: string;
  isCurrentTurn?: boolean;
}

export const HandDisplay: React.FC<HandDisplayProps> = ({
  sticksCount,
  isOpen,
  isHuman,
  isCurrentTurn = false,
}) => {
  const count = sticksCount ?? 0;

  if (isOpen) {
    return (
      <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-amber-950/40 border border-amber-600/30 animate-in fade-in zoom-in-95 duration-300">
        <div className="text-2xl mb-1">✋</div>
        <div className="flex items-center justify-center min-h-[50px] gap-1 px-2 py-1">
          {count === 0 ? (
            <span className="text-xs font-semibold text-amber-200/60 uppercase tracking-wider italic">
              Mão Vazia (0)
            </span>
          ) : (
            Array.from({ length: count }).map((_, i) => (
              <Matchstick
                key={i}
                size="sm"
                rotation={(i - (count - 1) / 2) * 12}
                highlighted={true}
              />
            ))
          )}
        </div>
        <span className="text-xs font-bold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded-full border border-amber-500/40 mt-1">
          {count} {count === 1 ? 'palito' : 'palitos'}
        </span>
      </div>
    );
  }

  // Closed hand (Secret)
  return (
    <div
      className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all duration-300 ${
        isCurrentTurn
          ? 'bg-amber-500/20 border-2 border-amber-400 ring-4 ring-amber-400/20 scale-105'
          : 'bg-amber-950/30 border border-amber-900/40'
      }`}
    >
      <div className="relative">
        <span className="text-3xl filter drop-shadow">✊</span>
        {isHuman && sticksCount !== null && (
          <span className="absolute -bottom-1 -right-2 bg-emerald-600 text-white text-[11px] font-black px-1.5 py-0.2 rounded-full border border-emerald-300 shadow">
            {sticksCount}
          </span>
        )}
      </div>
      <span className="text-[11px] font-medium text-amber-200/70 mt-1">
        {isHuman && sticksCount !== null
          ? `Você pôs ${sticksCount}`
          : 'Mão fechada'}
      </span>
    </div>
  );
};
