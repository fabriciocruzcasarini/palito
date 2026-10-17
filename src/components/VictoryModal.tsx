/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Player, RoundResult } from '../game/rules';
import { RankingTable } from './RankingTable';
import {
  PlayerRankingStat,
  recordMatchOutcome,
  loadStoredRankings,
} from '../utils/ranking';

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
  const [activeTab, setActiveTab] = useState<'ranking' | 'match'>('ranking');
  const [rankings, setRankings] = useState<PlayerRankingStat[]>(() => loadStoredRankings());
  const recordedRef = useRef(false);

  const isHumanWinner = myPlayerId ? winner.id === myPlayerId : winner.isHuman;
  const humanGuesses = history.map((h) => {
    const snap = myPlayerId
      ? h.playersSnapshot.find((p) => p.id === myPlayerId)
      : h.playersSnapshot.find((p) => p.isHuman);
    return snap ? snap.bet === h.realSum : false;
  });
  const humanHits = humanGuesses.filter(Boolean).length;

  const myPlayer = myPlayerId
    ? players.find((p) => p.id === myPlayerId)
    : players.find((p) => p.isHuman);
  const myPlayerName = myPlayer?.name || 'Você';

  // Automatically record this finished game into persistent ranking stats once
  useEffect(() => {
    if (!recordedRef.current && winner && players.length > 0) {
      recordedRef.current = true;
      const updated = recordMatchOutcome(
        players.map((p) => ({ name: p.name, avatar: p.avatar })),
        winner.name
      );
      setRankings(updated);
    }
  }, [winner, players]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-stone-900 border-2 border-amber-500/70 rounded-3xl p-5 md:p-7 text-center shadow-[0_0_60px_rgba(245,158,11,0.35)] animate-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Top Celebration Badge */}
        <div className="flex-shrink-0">
          <div className="text-5xl md:text-6xl mb-2 animate-bounce select-none">
            {isHumanWinner ? '🏆' : '🎩'}
          </div>

          <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-black rounded-full uppercase tracking-widest mb-1.5">
            {isHumanWinner ? 'Vitória Espetacular' : 'Fim de Jogo'}
          </span>

          <h2 className="text-2xl md:text-3xl font-black text-amber-100 mb-1">
            {isHumanWinner ? 'Você é o Campeão!' : `${winner.name} Venceu!`}
          </h2>

          <p className="text-xs md:text-sm text-stone-300 mb-4 max-w-md mx-auto">
            {isHumanWinner
              ? 'Você zerou todos os seus palitos primeiro e levou a fama de melhor jogador da mesa!'
              : `${winner.name} conseguiu zerar todos os palitos antes de todo mundo.`}
          </p>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2 bg-stone-950/70 p-3 rounded-2xl border border-stone-800 mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Rodadas</span>
              <span className="text-lg md:text-xl font-black text-amber-300 font-mono">
                {history.length}
              </span>
            </div>
            <div className="flex flex-col border-x border-stone-800">
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Seus Acertos</span>
              <span className="text-lg md:text-xl font-black text-emerald-400 font-mono">
                {humanHits}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-stone-400 uppercase font-semibold">Campeão</span>
              <span className="text-xs md:text-sm font-bold text-amber-200 truncate mt-1">
                {winner.name.split(' ')[0]}
              </span>
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex p-1 bg-stone-950 rounded-xl border border-stone-800 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab('ranking')}
              className={`flex-1 py-1.5 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'ranking'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>🏆</span>
              <span>Ranking Geral (Jogos / Vitórias / %)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('match')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'match'
                  ? 'bg-amber-500 text-stone-950 shadow-md'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <span>📋</span>
              <span>Palitos Desta Partida</span>
            </button>
          </div>
        </div>

        {/* Scrollable Center Content */}
        <div className="flex-1 overflow-y-auto pr-1 my-1 text-left">
          {activeTab === 'ranking' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-stone-400 px-1">
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  <span>📊</span>
                  <span>Classificação de Desempenho</span>
                </span>
                <span className="text-[10px] text-stone-400 font-mono">
                  Ordenado por % de Vitórias
                </span>
              </div>
              <RankingTable
                rankings={rankings}
                highlightPlayerName={myPlayerName}
                compact={true}
              />
            </div>
          ) : (
            <div className="bg-stone-950/60 rounded-xl p-3 border border-stone-800/80">
              <span className="text-xs uppercase font-bold text-stone-400 tracking-wider block mb-2">
                Palitos restantes ao final do jogo:
              </span>
              <div className="space-y-1.5">
                {players.map((p) => (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between text-xs py-2 px-3 rounded-lg ${
                      p.id === winner.id
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                        : 'bg-stone-900/60 text-stone-200'
                    }`}
                  >
                    <span className="font-semibold flex items-center gap-1.5">
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                      {p.id === winner.id && (
                        <span className="text-[10px] bg-amber-500 text-stone-950 font-black px-1.5 py-0.2 rounded uppercase">
                          Vencedor
                        </span>
                      )}
                    </span>
                    <span className="font-mono font-bold text-amber-300">
                      {p.reserves === 0 ? '0 palitos (Zerro!)' : `${p.reserves} palitos`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex-shrink-0 pt-3 border-t border-stone-800/80 mt-2">
          {isOnline ? (
            <div className="space-y-2">
              {isHost ? (
                <button
                  type="button"
                  data-start="true"
                  onClick={onRestart}
                  className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-base md:text-lg rounded-2xl shadow-xl border border-amber-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
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
                  className="w-full py-2.5 bg-stone-800 hover:bg-stone-750 text-stone-300 font-bold text-xs md:text-sm rounded-xl border border-stone-700 transition-all cursor-pointer"
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
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-base md:text-lg rounded-2xl shadow-xl border border-amber-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>🔄 Jogar Novamente</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
