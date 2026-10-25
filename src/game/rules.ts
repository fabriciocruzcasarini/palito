/**
 * Core Game Engine and Pure Rules for "Jogo do Palito" (Purrinha / Porco)
 */

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  avatar: string;
  personality?: 'bluffer' | 'calculated' | 'greedy' | 'unpredictable';
  personalityLabel?: string;
  reserves: number; // sticks remaining (starts at 3, winner reaches 0)
  currentHand: number | null; // sticks chosen in closed hand for current round
  currentBet: number | null; // bet made in current round
}

export interface RoundResult {
  roundNumber: number;
  starterPlayerId: string;
  playersSnapshot: {
    id: string;
    name: string;
    isHuman: boolean;
    reserveBefore: number;
    reserveAfter: number;
    hand: number;
    bet: number | null;
  }[];
  realSum: number;
  winnerId: string | null;
  winnerName: string | null;
  logText: string;
}

export interface ValidBetRange {
  min: number;
  max: number;
  validOptions: number[];
  takenBets: { bet: number; playerId: string; playerName: string }[];
}

export const INITIAL_STICKS = 3;

import { BOT_ARCHETYPES } from '../config/bots.ts';
import type { BotArchetype, BotPersonality } from '../config/bots.ts';
export { BOT_ARCHETYPES };
export type { BotArchetype, BotPersonality };

/**
 * Creates initial players list for a game.
 */
export function createPlayers(totalPlayers: number = 3, humanName: string = 'Você'): Player[] {
  const count = Math.max(2, Math.min(6, totalPlayers));
  const players: Player[] = [
    {
      id: 'human-0',
      name: humanName,
      isHuman: true,
      avatar: '😎',
      reserves: INITIAL_STICKS,
      currentHand: null,
      currentBet: null,
    },
  ];

  for (let i = 1; i < count; i++) {
    const archetype = BOT_ARCHETYPES[(i - 1) % BOT_ARCHETYPES.length];
    players.push({
      id: `bot-${i}`,
      name: archetype.name,
      isHuman: false,
      avatar: archetype.avatar,
      personality: archetype.personality,
      personalityLabel: archetype.personalityLabel,
      reserves: INITIAL_STICKS,
      currentHand: null,
      currentBet: null,
    });
  }

  return players;
}

/**
 * Calculates the legal bet range for a specific player based on their hand and other players' reserves.
 */
export function calculateValidBetRange(
  playerIndex: number,
  players: Player[]
): ValidBetRange {
  const player = players[playerIndex];
  if (!player) {
    throw new Error('Jogador inválido');
  }

  const playerHand = player.currentHand ?? 0;

  // Sum of remaining sticks of all OTHER players
  let otherReservesSum = 0;
  for (let i = 0; i < players.length; i++) {
    if (i !== playerIndex) {
      otherReservesSum += players[i].reserves;
    }
  }

  const min = playerHand + 0;
  const max = playerHand + otherReservesSum;

  const takenBets: { bet: number; playerId: string; playerName: string }[] = [];
  const takenBetSet = new Set<number>();

  for (const p of players) {
    if (p.currentBet !== null) {
      takenBets.push({ bet: p.currentBet, playerId: p.id, playerName: p.name });
      takenBetSet.add(p.currentBet);
    }
  }

  const validOptions: number[] = [];
  for (let b = min; b <= max; b++) {
    if (!takenBetSet.has(b)) {
      validOptions.push(b);
    }
  }

  return {
    min,
    max,
    validOptions,
    takenBets,
  };
}

/**
 * Validates a player's proposed bet.
 * Returns null if valid, or an error message if invalid.
 */
export function validateBet(
  bet: number,
  playerIndex: number,
  players: Player[]
): string | null {
  if (!Number.isInteger(bet)) {
    return 'O palpite deve ser um número inteiro.';
  }

  const range = calculateValidBetRange(playerIndex, players);

  if (bet < range.min) {
    return `Palpite inválido! O mínimo possível para você é ${range.min} (seus ${players[playerIndex].currentHand} palitos na mão + 0 dos outros).`;
  }

  if (bet > range.max) {
    return `Palpite inválido! O máximo possível para você é ${range.max} (seus ${players[playerIndex].currentHand} palitos na mão + todos os palitos dos adversários).`;
  }

  const duplicate = range.takenBets.find((t) => t.bet === bet);
  if (duplicate) {
    return `O palpite ${bet} já foi feito por ${duplicate.playerName}! Escolha outro número.`;
  }

  return null;
}

/**
 * Validates the number of sticks chosen for the closed hand.
 */
export function validateHand(sticks: number, reserve: number): string | null {
  if (!Number.isInteger(sticks)) {
    return 'A quantidade de palitos deve ser um número inteiro.';
  }
  if (sticks < 0) {
    return 'Você não pode colocar um número negativo de palitos.';
  }
  if (sticks > reserve) {
    return `Você só possui ${reserve} palitos na reserva. Não pode colocar ${sticks} na mão!`;
  }
  return null;
}

/**
 * Decides how many sticks a bot puts in their hand based on their personality and current reserve.
 */
export function decideBotHand(bot: Player, rng: () => number = Math.random): number {
  const reserve = bot.reserves;
  if (reserve <= 0) return 0;
  if (reserve === 1) {
    // 0 or 1
    return rng() < 0.5 ? 0 : 1;
  }

  const personality = bot.personality || 'calculated';

  switch (personality) {
    case 'bluffer': {
      // Bluffer prefers extreme ends: 0 or full reserve, or occasionally middle
      const r = rng();
      if (r < 0.45) return 0; // Bluff with empty hand!
      if (r < 0.85) return reserve; // Bluff with full hand!
      return Math.floor(rng() * (reserve + 1));
    }
    case 'greedy': {
      // Tends to put more sticks
      const weights = Array.from({ length: reserve + 1 }, (_, i) => i + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let threshold = rng() * totalWeight;
      for (let i = 0; i <= reserve; i++) {
        threshold -= weights[i];
        if (threshold <= 0) return i;
      }
      return reserve;
    }
    case 'calculated': {
      // Prefers average (~reserve / 2) with normal-ish distribution
      const avg = reserve / 2;
      const choices = Array.from({ length: reserve + 1 }, (_, i) => i);
      // weight by distance from avg
      const weights = choices.map((c) => Math.max(0.5, 3 - Math.abs(c - avg)));
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      let threshold = rng() * totalWeight;
      for (let i = 0; i <= reserve; i++) {
        threshold -= weights[i];
        if (threshold <= 0) return i;
      }
      return Math.round(avg);
    }
    case 'unpredictable':
    default: {
      return Math.floor(rng() * (reserve + 1));
    }
  }
}

/**
 * Decides a bot's bet given their known hand, table state, and legal range.
 */
export function decideBotBet(
  botIndex: number,
  players: Player[],
  rng: () => number = Math.random
): number {
  const range = calculateValidBetRange(botIndex, players);
  const bot = players[botIndex];
  const botHand = bot.currentHand ?? 0;

  if (range.validOptions.length === 0) {
    // Edge case if all numbers in range were somehow taken (mathematically rare in Purrinha)
    return range.min;
  }

  // Calculate expected sum of other players' hands:
  // For each other player, expected hand is ~ reserves / 2
  let expectedOthers = 0;
  for (let i = 0; i < players.length; i++) {
    if (i !== botIndex) {
      expectedOthers += players[i].reserves / 2;
    }
  }

  // Personality bias
  let bias = 0;
  if (bot.personality === 'greedy') bias = +0.5;
  if (bot.personality === 'bluffer') bias = rng() < 0.5 ? -1 : +1;
  if (bot.personality === 'unpredictable') bias = (rng() - 0.5) * 2;

  const targetSum = Math.round(botHand + expectedOthers + bias);

  // Sort available valid options by distance to target sum, with slight noise
  const scoredOptions = range.validOptions.map((opt) => {
    const dist = Math.abs(opt - targetSum);
    const noise = rng() * 0.4; // slight jitter so bots aren't 100% deterministic
    return { opt, score: dist + noise };
  });

  scoredOptions.sort((a, b) => a.score - b.score);

  return scoredOptions[0].opt;
}

/**
 * Returns player turn order for the round given the starting player index.
 */
export function getTurnOrder(starterIndex: number, totalPlayers: number): number[] {
  const order: number[] = [];
  for (let i = 0; i < totalPlayers; i++) {
    order.push((starterIndex + i) % totalPlayers);
  }
  return order;
}

/**
 * Resolves a round after all hands and bets are locked.
 */
export function resolveRound(
  roundNumber: number,
  starterPlayerId: string,
  players: Player[]
): {
  realSum: number;
  winner: Player | null;
  updatedPlayers: Player[];
  result: RoundResult;
} {
  let realSum = 0;
  for (const p of players) {
    realSum += p.currentHand ?? 0;
  }

  let winner: Player | null = null;
  for (const p of players) {
    if (p.currentBet === realSum) {
      winner = p;
      break;
    }
  }

  const updatedPlayers = players.map((p) => {
    const isWinner = winner && p.id === winner.id;
    const newReserves = isWinner ? Math.max(0, p.reserves - 1) : p.reserves;
    return {
      ...p,
      reserves: newReserves,
    };
  });

  // Build formatted text log as requested in the specification
  const playersSnapshot = players.map((p, idx) => ({
    id: p.id,
    name: p.name,
    isHuman: p.isHuman,
    reserveBefore: p.reserves,
    reserveAfter: updatedPlayers[idx].reserves,
    hand: p.currentHand ?? 0,
    bet: p.currentBet,
  }));

  const logLines: string[] = [
    '==================================================',
    `RODADA [${roundNumber}]`,
    '==================================================',
    'Placar Atual de Palitos:',
  ];

  for (const p of players) {
    const label = p.isHuman ? `${p.name} (Humano)` : p.name;
    logLines.push(`- ${label}: [${p.reserves}] palitos restantes`);
  }

  logLines.push('');
  logLines.push('Palpites da Rodada:');
  for (const p of players) {
    const verb = p.isHuman ? 'palpitou' : 'palpita';
    logLines.push(`- ${p.name} ${verb}: [${p.currentBet ?? '-'}]`);
  }

  logLines.push('');
  logLines.push('--- REVELAÇÃO ---');
  logLines.push('Mãos na mesa:');
  for (const p of players) {
    logLines.push(`- ${p.name}: [${p.currentHand ?? 0}] palitos`);
  }
  logLines.push(`SOMA TOTAL REAL = [${realSum}]`);
  logLines.push('');

  if (winner) {
    logLines.push(`Resultado da Rodada: ${winner.name} acertou na mosca e descartou 1 palito!`);
  } else {
    logLines.push('Resultado da Rodada: Ninguém acertou!');
  }
  logLines.push('==================================================');

  const logText = logLines.join('\n');

  const result: RoundResult = {
    roundNumber,
    starterPlayerId,
    playersSnapshot,
    realSum,
    winnerId: winner?.id ?? null,
    winnerName: winner?.name ?? null,
    logText,
  };

  return {
    realSum,
    winner,
    updatedPlayers,
    result,
  };
}

/**
 * Checks if a game has concluded (a player reached 0 sticks).
 */
export function checkGameWinner(players: Player[]): Player | null {
  for (const p of players) {
    if (p.reserves === 0) {
      return p;
    }
  }
  return null;
}
