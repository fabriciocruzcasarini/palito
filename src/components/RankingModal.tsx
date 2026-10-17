/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RankingTable } from './RankingTable';
import {
  PlayerRankingStat,
  loadStoredRankings,
  clearStoredRankings,
} from '../utils/ranking';

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  highlightPlayerName?: string;
}

export const RankingModal: React.FC<RankingModalProps> = ({
  isOpen,
  onClose,
  highlightPlayerName,
}) => {
  const [rankings, setRankings] = useState<PlayerRankingStat[]>(() => loadStoredRankings());

  useEffect(() => {
    if (isOpen) {
      setRankings(loadStoredRankings());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClear = () => {
    if (window.confirm('Tem certeza de que deseja zerar todas as estatísticas do ranking?')) {
      clearStoredRankings();
      setRankings([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl bg-stone-900 border border-amber-500/40 rounded-3xl p-5 md:p-7 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl">
              🏆
            </span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-amber-200">
                Ranking de Jogadores
              </h2>
              <p className="text-xs text-stone-400">
                Classificação geral por jogos, vitórias e percentual de aproveitamento (%)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4">
          <RankingTable
            rankings={rankings}
            highlightPlayerName={highlightPlayerName}
            onClearRankings={handleClear}
          />
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm rounded-xl transition-all cursor-pointer shadow-md"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
