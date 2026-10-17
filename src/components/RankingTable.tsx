/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerRankingStat } from '../utils/ranking';

interface RankingTableProps {
  rankings: PlayerRankingStat[];
  highlightPlayerName?: string;
  onClearRankings?: () => void;
  compact?: boolean;
}

export const RankingTable: React.FC<RankingTableProps> = ({
  rankings,
  highlightPlayerName,
  onClearRankings,
  compact = false,
}) => {
  if (rankings.length === 0) {
    return (
      <div className="text-center py-6 px-4 bg-stone-950/60 rounded-2xl border border-stone-800 text-stone-400">
        <span className="text-3xl mb-2 block">📊</span>
        <p className="text-sm font-semibold text-stone-300">Nenhuma partida registrada ainda.</p>
        <p className="text-xs text-stone-500 mt-1">
          Jogue uma partida até o final para pontuar no ranking geral!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-950/70 shadow-inner">
        <table className="w-full text-left border-collapse text-xs md:text-sm">
          <thead>
            <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] md:text-xs font-bold uppercase tracking-wider text-stone-400">
              <th className="py-2.5 px-3 text-center w-12">Pos</th>
              <th className="py-2.5 px-3">Jogador</th>
              <th className="py-2.5 px-2.5 text-center">Jogos</th>
              <th className="py-2.5 px-2.5 text-center">Vitórias</th>
              <th className="py-2.5 px-3 text-right">Aprov. (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-800/60">
            {rankings.map((stat, idx) => {
              const isHighlighted =
                highlightPlayerName &&
                stat.name.trim().toLowerCase() === highlightPlayerName.trim().toLowerCase();

              const medal =
                idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`;

              // Progress bar color based on win rate
              const rateColor =
                stat.winRate >= 60
                  ? 'bg-emerald-500 text-emerald-300'
                  : stat.winRate >= 35
                  ? 'bg-amber-500 text-amber-300'
                  : 'bg-rose-500 text-rose-300';

              return (
                <tr
                  key={`${stat.name}-${idx}`}
                  className={`transition-colors ${
                    isHighlighted
                      ? 'bg-amber-500/15 text-amber-200 font-semibold border-l-4 border-l-amber-500'
                      : 'hover:bg-stone-900/40 text-stone-300'
                  }`}
                >
                  {/* Position Badge */}
                  <td className="py-2.5 px-3 text-center font-mono font-bold text-xs md:text-sm">
                    {medal}
                  </td>

                  {/* Player Name & Avatar */}
                  <td className="py-2.5 px-3 font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-base select-none">{stat.avatar || '🤠'}</span>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`truncate ${
                              isHighlighted ? 'text-amber-300 font-bold' : 'text-stone-200'
                            }`}
                          >
                            {stat.name}
                          </span>
                          {isHighlighted && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded uppercase font-black">
                              Você
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Matches / Games count */}
                  <td className="py-2.5 px-2.5 text-center font-mono font-semibold text-stone-300">
                    {stat.gamesPlayed}
                  </td>

                  {/* Wins count */}
                  <td className="py-2.5 px-2.5 text-center font-mono font-bold text-amber-300">
                    {stat.wins}
                  </td>

                  {/* Win rate % with visual pill */}
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 sm:w-20 bg-stone-800 rounded-full h-2 hidden sm:block overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            stat.winRate >= 60
                              ? 'bg-emerald-400'
                              : stat.winRate >= 35
                              ? 'bg-amber-400'
                              : 'bg-rose-400'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, stat.winRate))}%` }}
                        />
                      </div>
                      <span
                        className={`font-mono font-black text-xs md:text-sm ${
                          stat.winRate >= 60
                            ? 'text-emerald-400'
                            : stat.winRate >= 35
                            ? 'text-amber-400'
                            : 'text-stone-400'
                        }`}
                      >
                        {stat.winRate.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {onClearRankings && rankings.length > 0 && !compact && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClearRankings}
            className="text-[11px] text-stone-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>🗑️</span>
            <span>Limpar Histórico de Estatísticas</span>
          </button>
        </div>
      )}
    </div>
  );
};
