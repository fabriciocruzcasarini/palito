import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateWinRate,
  sortRankings,
  updateRankingsWithMatch,
} from './ranking.ts';
import type { PlayerRankingStat } from './ranking.ts';

test('calculateWinRate computes correct rounded percentage', () => {
  assert.equal(calculateWinRate(0, 0), 0);
  assert.equal(calculateWinRate(1, 2), 50.0);
  assert.equal(calculateWinRate(1, 3), 33.3);
  assert.equal(calculateWinRate(2, 3), 66.7);
  assert.equal(calculateWinRate(5, 5), 100.0);
});

test('updateRankingsWithMatch initializes new players and records match and winner', () => {
  const current: PlayerRankingStat[] = [];
  const players = [
    { name: 'Fabricio', avatar: '😎' },
    { name: 'Seu Zé', avatar: '🍺' },
    { name: 'Dona Cida', avatar: '👵' },
  ];

  const updated = updateRankingsWithMatch(current, players, 'Fabricio');

  assert.equal(updated.length, 3);
  const fabricio = updated.find((p) => p.name === 'Fabricio');
  assert.ok(fabricio);
  assert.equal(fabricio.gamesPlayed, 1);
  assert.equal(fabricio.wins, 1);
  assert.equal(fabricio.winRate, 100.0);

  const ze = updated.find((p) => p.name === 'Seu Zé');
  assert.ok(ze);
  assert.equal(ze.gamesPlayed, 1);
  assert.equal(ze.wins, 0);
  assert.equal(ze.winRate, 0);

  // Top rank is Fabricio
  assert.equal(updated[0].name, 'Fabricio');
});

test('updateRankingsWithMatch accumulates subsequent matches correctly', () => {
  let stats: PlayerRankingStat[] = [];
  const players = [
    { name: 'Fabricio', avatar: '😎' },
    { name: 'Seu Zé', avatar: '🍺' },
  ];

  // Match 1: Fabricio wins
  stats = updateRankingsWithMatch(stats, players, 'Fabricio');
  // Match 2: Seu Zé wins
  stats = updateRankingsWithMatch(stats, players, 'Seu Zé');

  const fabricio = stats.find((p) => p.name === 'Fabricio');
  const ze = stats.find((p) => p.name === 'Seu Zé');

  assert.equal(fabricio?.gamesPlayed, 2);
  assert.equal(fabricio?.wins, 1);
  assert.equal(fabricio?.winRate, 50.0);

  assert.equal(ze?.gamesPlayed, 2);
  assert.equal(ze?.wins, 1);
  assert.equal(ze?.winRate, 50.0);
});

test('sortRankings orders primarily by win rate, then wins, then games played', () => {
  const list: PlayerRankingStat[] = [
    { name: 'Jogador C', avatar: '🎩', gamesPlayed: 4, wins: 2, winRate: 50.0, lastPlayed: 1 },
    { name: 'Jogador A', avatar: '😎', gamesPlayed: 2, wins: 2, winRate: 100.0, lastPlayed: 2 },
    { name: 'Jogador B', avatar: '🤠', gamesPlayed: 5, wins: 3, winRate: 60.0, lastPlayed: 3 },
  ];

  const sorted = sortRankings(list);
  assert.equal(sorted[0].name, 'Jogador A'); // 100%
  assert.equal(sorted[1].name, 'Jogador B'); // 60%
  assert.equal(sorted[2].name, 'Jogador C'); // 50%
});
