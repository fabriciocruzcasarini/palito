/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PlayerRankingStat {
  name: string;
  avatar: string;
  gamesPlayed: number;
  wins: number;
  winRate: number; // Percentage rounded to 1 decimal, e.g. 66.7
  lastPlayed: number; // Unix timestamp
}

export const RANKING_STORAGE_KEY = 'purrinha_player_rankings_v1';

import { BOT_ARCHETYPES } from '../config/bots.ts';

/**
 * Calculates win percentage rounded to 1 decimal place.
 */
export function calculateWinRate(wins: number, gamesPlayed: number): number {
  if (!gamesPlayed || gamesPlayed <= 0) return 0;
  return Number(((wins / gamesPlayed) * 100).toFixed(1));
}

/**
 * Sorts ranking records by win rate (desc), wins (desc), games played (desc), and name.
 */
export function sortRankings(rankings: PlayerRankingStat[]): PlayerRankingStat[] {
  return [...rankings].sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    if (b.wins !== a.wins) {
      return b.wins - a.wins;
    }
    if (b.gamesPlayed !== a.gamesPlayed) {
      return b.gamesPlayed - a.gamesPlayed;
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Updates ranking statistics given a finished match's roster and winner name.
 */
export function updateRankingsWithMatch(
  currentRankings: PlayerRankingStat[],
  matchPlayers: Array<{ name: string; avatar?: string }>,
  winnerName: string,
  now: number = Date.now()
): PlayerRankingStat[] {
  const map = new Map<string, PlayerRankingStat>();

  for (const r of currentRankings) {
    map.set(r.name.trim().toLowerCase(), { ...r });
  }

  for (const p of matchPlayers) {
    const trimmedName = p.name.trim();
    if (!trimmedName) continue;
    const key = trimmedName.toLowerCase();
    const existing = map.get(key) || {
      name: trimmedName,
      avatar: p.avatar || '🤠',
      gamesPlayed: 0,
      wins: 0,
      winRate: 0,
      lastPlayed: now,
    };

    const isWinner = trimmedName.toLowerCase() === winnerName.trim().toLowerCase();
    const newGames = existing.gamesPlayed + 1;
    const newWins = existing.wins + (isWinner ? 1 : 0);

    map.set(key, {
      ...existing,
      name: trimmedName,
      avatar: p.avatar || existing.avatar,
      gamesPlayed: newGames,
      wins: newWins,
      winRate: calculateWinRate(newWins, newGames),
      lastPlayed: now,
    });
  }

  return sortRankings(Array.from(map.values()));
}

const DEFAULT_BOT_PRESET_STATS = [
  { gamesPlayed: 6, wins: 4 },
  { gamesPlayed: 5, wins: 2 },
  { gamesPlayed: 4, wins: 1 },
  { gamesPlayed: 3, wins: 1 },
  { gamesPlayed: 3, wins: 0 },
];

/**
 * Rankings iniciais padrão gerados automaticamente a partir do arquivo central de IAs.
 */
export const DEFAULT_INITIAL_RANKINGS: PlayerRankingStat[] = BOT_ARCHETYPES.map((bot, index) => {
  const preset = DEFAULT_BOT_PRESET_STATS[index % DEFAULT_BOT_PRESET_STATS.length];
  return {
    name: bot.name,
    avatar: bot.avatar,
    gamesPlayed: preset.gamesPlayed,
    wins: preset.wins,
    winRate: calculateWinRate(preset.wins, preset.gamesPlayed),
    lastPlayed: Date.now() - (index + 1) * 7200000,
  };
});

/**
 * Loads rankings from localStorage with safe fallback to initial tavern bots.
 */
export function loadStoredRankings(): PlayerRankingStat[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_INITIAL_RANKINGS;
  }
  try {
    const raw = window.localStorage.getItem(RANKING_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_INITIAL_RANKINGS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return sortRankings(
        parsed.map((item) => ({
          name: String(item.name || 'Jogador'),
          avatar: String(item.avatar || '🤠'),
          gamesPlayed: Math.max(0, Number(item.gamesPlayed) || 0),
          wins: Math.max(0, Number(item.wins) || 0),
          winRate: calculateWinRate(Number(item.wins) || 0, Number(item.gamesPlayed) || 0),
          lastPlayed: Number(item.lastPlayed) || Date.now(),
        }))
      );
    }
  } catch (err) {
    console.warn('Erro ao carregar ranking do localStorage:', err);
  }
  return DEFAULT_INITIAL_RANKINGS;
}

/**
 * Persists rankings to localStorage.
 */
export function saveStoredRankings(rankings: PlayerRankingStat[]): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(RANKING_STORAGE_KEY, JSON.stringify(rankings));
  } catch (err) {
    console.warn('Erro ao salvar ranking no localStorage:', err);
  }
}

/**
 * Records a match outcome and saves the updated rankings.
 */
export function recordMatchOutcome(
  matchPlayers: Array<{ name: string; avatar?: string }>,
  winnerName: string
): PlayerRankingStat[] {
  const current = loadStoredRankings();
  const updated = updateRankingsWithMatch(current, matchPlayers, winnerName);
  saveStoredRankings(updated);
  return updated;
}

/**
 * Clears stored rankings.
 */
export function clearStoredRankings(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.removeItem(RANKING_STORAGE_KEY);
  } catch (err) {
    console.warn('Erro ao limpar ranking:', err);
  }
}
