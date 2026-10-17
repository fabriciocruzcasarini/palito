import React from 'react';
import { Player, RoundResult } from '../game/rules';

interface VictoryModalProps {
  winner: Player;
  players: Player[];
  history: RoundResult[];
  onRestart: () => void;
  onLeave?: () => void;
  isOnline?: boolean;
  isHost?: boolean;
  myPlayerId?: string;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  winner,
  players,
  history,
  onRestart,
  onLeave,
  isOnline = false,
  isHost = false,
  myPlayerId,
}) => {
  const isHumanWinner = myPlayerId ? winner.id === myPlayerId : winner.isHuman;
  const humanGuesses = history.map((h) => {
    const snap = myPlayerId
      ? h.playersSnapshot.find((p) => p.id === myPlayerId)
      : h.playersSnapshot.find((p) => p.isHuman);
    return snap ? snap.bet === h.realSum : false;
  });
  const humanHits = humanGuesses.filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-stone-900 border-2 border-amber-500/70 rounded-3xl p-6 md:p-8 text-center shadow-[0_0_60px_rgba(245,158,11,0.35)] animate-in zoom-in-95">
        {/* Confetti or Trophy icon */}
        <div className="text-6xl mb-3 animate-bounce">
          {isHumanWinner ? '🏆' : '🎩'}
        </div>

        <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black rounded-full uppercase tracking-widest mb-2">
          {isHumanWinner ? 'Vitória Espetacular' : 'Fim de Jogo'}
        </span>

        <h2 className="text-2xl md:text-3xl font-black text-amber-100 mb-1">
          {isHumanWinner ? 'Você é o Campeão!' : `${winner.name} Venceu!`}
        </h2>

        <p className="text-sm text-stone-300 mb-6">
          {isHumanWinner
            ? 'Você zerou todos os seus palitos primeiro e levou a fama de melhor jogador de purrinha da mesa!'
            : `${winner.name} conseguiu zerar todos os palitos antes de todo mundo. Mais sorte na próxima rodada!`}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 bg-stone-950/70 p-4 rounded-2xl border border-stone-800 mb-6">
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-400 uppercase font-semibold">Rodadas</span>
            <span className="text-xl font-black text-amber-300 font-mono">
              {history.length}
            </span>
          </div>
          <div className="flex flex-col border-x border-stone-800">
            <span className="text-[10px] text-stone-400 uppercase font-semibold">Seus Acertos</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {humanHits}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-stone-400 uppercase font-semibold">Campeão</span>
            <span className="text-sm font-bold text-amber-200 truncate mt-1">
              {winner.name.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Final Standings */}
        <div className="bg-stone-950/40 rounded-xl p-3 border border-stone-800/80 mb-6 text-left">
          <span className="text-xs uppercase font-bold text-stone-400 tracking-wider block mb-2">
            Placar Final de Palitos Restantes:
          </span>
          <div className="space-y-1.5">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-900/60"
              >
                <span className="font-semibold text-stone-200 flex items-center gap-1.5">
                  <span>{p.avatar}</span>
                  <span>{p.name}</span>
                </span>
                <span className="font-mono font-bold text-amber-300">
                  {p.reserves === 0 ? '0 palitos (CAMPEÃO)' : `${p.reserves} palitos`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {isOnline ? (
          <div className="space-y-2">
            {isHost ? (
              <button
                type="button"
                data-start="true"
                onClick={onRestart}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-lg rounded-2xl shadow-xl border border-amber-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
              >
                <span>🔄 Jogar Novamente (Mesma Sala)</span>
              </button>
            ) : (
              <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-400 text-xs flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Aguardando o anfitrião reiniciar a partida...</span>
              </div>
            )}
            {onLeave && (
              <button
                type="button"
                onClick={onLeave}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 font-bold text-sm rounded-xl border border-stone-700 transition-all cursor-pointer"
              >
                Sair da Sala
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            data-start="true"
            onClick={onRestart}
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-lg rounded-2xl shadow-xl border border-amber-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
          >
            <span>🔄 Jogar Novamente</span>
          </button>
        )}
      </div>
    </div>
  );
};
