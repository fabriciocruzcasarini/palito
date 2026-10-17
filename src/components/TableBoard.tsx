import React from 'react';
import { Player } from '../game/rules';
import { Matchstick } from './Matchstick';
import { HandDisplay } from './HandDisplay';

interface TableBoardProps {
  players: Player[];
  currentTurnPlayerIndex: number | null;
  starterPlayerId: string;
  gamePhase: 'hand_selection' | 'betting' | 'reveal' | 'round_result';
  realSum: number | null;
  roundWinnerId: string | null;
  roundNumber: number;
  myPlayerId?: string;
}

export const TableBoard: React.FC<TableBoardProps> = ({
  players,
  currentTurnPlayerIndex,
  starterPlayerId,
  gamePhase,
  realSum,
  roundWinnerId,
  roundNumber,
  myPlayerId,
}) => {
  const isRevealed = gamePhase === 'reveal' || gamePhase === 'round_result';

  return (
    <div className="relative w-full max-w-5xl mx-auto min-h-[480px] md:min-h-[560px] flex flex-col items-center justify-center p-3 md:p-6 select-none">
      {/* Tavern Table Mat (Rich Brazilian felt & wood texture) */}
      <div className="absolute inset-2 md:inset-4 rounded-[40px] md:rounded-[56px] bg-gradient-to-br from-[#1b382b] via-[#14281f] to-[#0d1c15] border-[6px] md:border-[10px] border-[#5c2c16] shadow-[inset_0_0_80px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.7)] overflow-hidden">
        {/* Subtle felt texture lines */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Table center crest */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15">
          <svg width="280" height="280" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="#fef3c7" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="50" cy="50" r="38" stroke="#fef3c7" strokeWidth="0.5" />
            <path d="M30 50 L70 50 M50 30 L50 70" stroke="#fef3c7" strokeWidth="0.8" />
          </svg>
        </div>
      </div>

      {/* Center Table Arena (Status / Reveal / Live Tally) */}
      <div className="relative z-10 w-full max-w-md my-auto text-center px-4 py-4 pointer-events-none">
        {gamePhase === 'hand_selection' && (
          <div className="bg-stone-900/85 border border-amber-600/40 rounded-2xl p-4 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="inline-block px-3 py-0.5 bg-amber-950/80 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
              Fase 1 · Escolha Secreta
            </div>
            <h3 className="text-lg md:text-xl font-black text-amber-100 mb-1">
              Escondendo os Palitos
            </h3>
            <p className="text-xs text-amber-200/70">
              Cada jogador escolhe em segredo quantos palitos de sua reserva esconderá na mão.
            </p>
          </div>
        )}

        {gamePhase === 'betting' && (
          <div className="bg-stone-900/85 border border-amber-600/40 rounded-2xl p-4 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95">
            <div className="inline-block px-3 py-0.5 bg-amber-950/80 border border-amber-500/30 rounded-full text-[11px] font-bold text-amber-300 uppercase tracking-wider mb-2">
              Fase 2 · Rodada de Palpites
            </div>
            <h3 className="text-lg md:text-xl font-black text-amber-100 mb-1">
              Quem dá mais no palpite?
            </h3>
            <p className="text-xs text-amber-200/70">
              Palpites únicos na ordem do turno. Tente adivinhar a soma total de palitos na mesa!
            </p>
          </div>
        )}

        {isRevealed && realSum !== null && (
          <div className="bg-stone-950/90 border-2 border-amber-500/60 rounded-3xl p-5 shadow-[0_0_50px_rgba(245,158,11,0.25)] animate-in zoom-in-90 duration-300">
            <span className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-black rounded-full uppercase tracking-widest mb-2">
              Mãos na Mesa!
            </span>
            <div className="text-xs text-amber-200/80 uppercase font-semibold tracking-wider">
              Soma Real de Palitos
            </div>
            <div className="text-5xl md:text-6xl font-black text-amber-300 my-1 font-mono drop-shadow-[0_4px_12px_rgba(245,158,11,0.5)]">
              {realSum}
            </div>

            {/* Sum breakdown */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap text-xs text-amber-100/90 font-mono my-2 bg-stone-900/60 py-1.5 px-3 rounded-lg border border-amber-900/40">
              {players.map((p, idx) => (
                <React.Fragment key={p.id}>
                  <span className="font-semibold">{p.name.split(' ')[0]}: {p.currentHand ?? 0}</span>
                  {idx < players.length - 1 && <span className="text-amber-500">+</span>}
                </React.Fragment>
              ))}
              <span className="text-amber-400 font-bold">= {realSum}</span>
            </div>

            {/* Round outcome message */}
            {roundWinnerId ? (
              <div className="mt-2 text-sm md:text-base font-black text-emerald-400 flex items-center justify-center gap-1.5 animate-bounce">
                <span>🎯</span>
                <span>
                  {players.find((p) => p.id === roundWinnerId)?.name} acertou na mosca!
                </span>
              </div>
            ) : (
              <div className="mt-2 text-sm md:text-base font-bold text-rose-300">
                ❌ Ninguém acertou o total ({realSum})!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Seated Players around the table */}
      <div className="relative z-10 w-full grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 mt-auto">
        {players.map((player, index) => {
          const isCurrentTurn = currentTurnPlayerIndex === index && gamePhase === 'betting';
          const isStarter = player.id === starterPlayerId;
          const isRoundWinner = isRevealed && roundWinnerId === player.id;
          const hasBet = player.currentBet !== null;
          const isThisMe = myPlayerId
            ? player.id === myPlayerId
            : player.isHuman && !player.id.startsWith('bot-');

          return (
            <div
              key={player.id}
              className={`relative flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${
                isRoundWinner
                  ? 'bg-amber-500/25 border-2 border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)] scale-105'
                  : isCurrentTurn
                  ? 'bg-stone-900/90 border-2 border-amber-400 ring-4 ring-amber-400/30 shadow-xl'
                  : 'bg-stone-900/70 border border-stone-700/60'
              }`}
            >
              {/* Starter Badge */}
              {isStarter && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-stone-950 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-200 uppercase tracking-wider shadow whitespace-nowrap z-20 flex items-center gap-1">
                  <span>👑</span>
                  <span>Abre a Rodada</span>
                </div>
              )}

              {/* Player Header: Avatar & Info */}
              <div className="flex items-center gap-2 w-full justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl p-1 bg-stone-800/80 rounded-xl border border-stone-600/50">
                    {player.avatar}
                  </span>
                  <div className="text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs md:text-sm font-black text-stone-100">
                        {player.name}
                      </span>
                      {isThisMe && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40 font-bold">
                          Você
                        </span>
                      )}
                    </div>
                    {player.personalityLabel && (
                      <span className="text-[10px] text-amber-200/60 block line-clamp-1 max-w-[120px]">
                        {player.personalityLabel}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stick Reserve Counter */}
                <div className="flex flex-col items-end">
                  <span className="text-[10px] text-stone-400 uppercase font-semibold">Reserva</span>
                  <div className="flex items-center gap-1 bg-stone-950/70 px-2 py-1 rounded-lg border border-stone-800">
                    <span className="text-sm font-black text-amber-400 font-mono">
                      {player.reserves}
                    </span>
                    <span className="text-[11px] text-amber-200/60">palitos</span>
                  </div>
                </div>
              </div>

              {/* Matchstick Graphic Pouch (Visual reserve) */}
              <div className="flex items-center justify-center gap-1 min-h-[36px] w-full bg-stone-950/40 rounded-lg p-1 mb-2 border border-stone-800/40">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Matchstick
                    key={i}
                    size="sm"
                    rotation={(i - 1) * 8}
                    isDiscarded={i >= player.reserves}
                  />
                ))}
              </div>

              {/* Hand & Bet Area */}
              <div className="w-full flex items-center justify-between gap-2 mt-1">
                {/* Hand display */}
                <div className="flex-1">
                  <HandDisplay
                    sticksCount={player.currentHand}
                    isOpen={isRevealed}
                    isHuman={isThisMe}
                    playerName={player.name}
                    isCurrentTurn={isCurrentTurn}
                  />
                </div>

                {/* Bet speech bubble */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <span className="text-[10px] text-stone-400 font-semibold uppercase mb-1">
                    Palpite
                  </span>
                  {hasBet ? (
                    <div
                      className={`relative px-3 py-1.5 rounded-xl font-mono text-sm md:text-base font-black transition-all ${
                        isRoundWinner
                          ? 'bg-amber-400 text-stone-950 ring-2 ring-amber-300 animate-pulse'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      <span className="text-xs mr-0.5 opacity-70">Aposta:</span>
                      <span>{player.currentBet}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-stone-500 italic px-2 py-1 bg-stone-950/40 rounded-lg border border-stone-800">
                      {isCurrentTurn ? 'Pensando...' : 'Aguardando'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
