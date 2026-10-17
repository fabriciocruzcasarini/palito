import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlayers,
  calculateValidBetRange,
  validateBet,
  validateHand,
  decideBotHand,
  decideBotBet,
  getTurnOrder,
  resolveRound,
  checkGameWinner,
  INITIAL_STICKS,
} from './rules.ts';

test('createPlayers initializes correct defaults and sticks', () => {
  const players = createPlayers(3, 'Você');
  assert.equal(players.length, 3);
  assert.equal(players[0].isHuman, true);
  assert.equal(players[0].reserves, INITIAL_STICKS);
  assert.equal(players[1].isHuman, false);
  assert.equal(players[1].reserves, INITIAL_STICKS);
  assert.equal(players[2].isHuman, false);
  assert.equal(players[2].reserves, INITIAL_STICKS);
});

test('calculateValidBetRange enforces hand min and other reserves max', () => {
  const players = createPlayers(3, 'Você');
  // Human has 3 reserves, puts 2 in hand
  players[0].reserves = 3;
  players[0].currentHand = 2;
  // Bot 1 has 3 reserves
  players[1].reserves = 3;
  // Bot 2 has 2 reserves
  players[2].reserves = 2;

  const range = calculateValidBetRange(0, players);
  // Min is player's hand (2) + 0 = 2
  assert.equal(range.min, 2);
  // Max is player's hand (2) + sum of others reserves (3 + 2 = 5) = 7
  assert.equal(range.max, 7);
  // Valid options should be 2, 3, 4, 5, 6, 7
  assert.deepEqual(range.validOptions, [2, 3, 4, 5, 6, 7]);
});

test('calculateValidBetRange excludes already taken bets', () => {
  const players = createPlayers(3, 'Você');
  players[0].reserves = 3;
  players[0].currentHand = 1;
  players[1].reserves = 3;
  players[2].reserves = 3;

  // Bot 1 already bet 4
  players[1].currentBet = 4;

  const range = calculateValidBetRange(0, players);
  // Range is [1, 1 + 6] = [1, 7]
  assert.equal(range.min, 1);
  assert.equal(range.max, 7);
  // 4 should be excluded from validOptions
  assert.ok(!range.validOptions.includes(4));
  assert.deepEqual(range.validOptions, [1, 2, 3, 5, 6, 7]);
  assert.equal(range.takenBets.length, 1);
  assert.equal(range.takenBets[0].bet, 4);
});

test('validateBet rejects out of range and duplicates', () => {
  const players = createPlayers(3, 'Você');
  players[0].reserves = 3;
  players[0].currentHand = 2;
  players[1].reserves = 3;
  players[2].reserves = 3;
  players[1].currentBet = 5;

  // Too low (player has 2 in hand, cannot bet 1)
  const tooLow = validateBet(1, 0, players);
  assert.ok(tooLow !== null);
  assert.match(tooLow!, /mínimo possível/i);

  // Too high (max is 2 + 6 = 8, cannot bet 9)
  const tooHigh = validateBet(9, 0, players);
  assert.ok(tooHigh !== null);
  assert.match(tooHigh!, /máximo possível/i);

  // Duplicate (5 is already taken by Bot 1)
  const duplicate = validateBet(5, 0, players);
  assert.ok(duplicate !== null);
  assert.match(duplicate!, /já foi feito/i);

  // Valid bet (e.g. 6)
  const valid = validateBet(6, 0, players);
  assert.equal(valid, null);
});

test('validateHand checks boundaries against current reserve', () => {
  assert.ok(validateHand(-1, 3) !== null);
  assert.ok(validateHand(4, 3) !== null);
  assert.equal(validateHand(0, 3), null);
  assert.equal(validateHand(2, 3), null);
  assert.equal(validateHand(3, 3), null);
});

test('decideBotHand respects current reserve', () => {
  const players = createPlayers(3);
  const bot = players[1];
  bot.reserves = 2;

  for (let i = 0; i < 20; i++) {
    const hand = decideBotHand(bot);
    assert.ok(hand >= 0 && hand <= 2);
  }
});

test('decideBotBet picks an untaken value within range', () => {
  const players = createPlayers(3);
  players[0].currentHand = 1;
  players[1].currentHand = 2;
  players[2].currentHand = 0;

  // Player 0 bet 3
  players[0].currentBet = 3;

  // Bot 1 picks a bet
  const bet = decideBotBet(1, players);
  const range = calculateValidBetRange(1, players);
  assert.ok(bet >= range.min && bet <= range.max);
  assert.notEqual(bet, 3); // Must not duplicate player 0's bet
});

test('getTurnOrder rotates starting player each round', () => {
  // 3 players
  const round1 = getTurnOrder(0, 3);
  assert.deepEqual(round1, [0, 1, 2]);

  const round2 = getTurnOrder(1, 3);
  assert.deepEqual(round2, [1, 2, 0]);

  const round3 = getTurnOrder(2, 3);
  assert.deepEqual(round3, [2, 0, 1]);

  const round4 = getTurnOrder(3 % 3, 3);
  assert.deepEqual(round4, [0, 1, 2]);
});

test('resolveRound calculates real sum, decrements winner stick, leaves others unchanged', () => {
  const players = createPlayers(3, 'Você');
  players[0].reserves = 3;
  players[0].currentHand = 2;
  players[0].currentBet = 4;

  players[1].reserves = 3;
  players[1].currentHand = 1;
  players[1].currentBet = 3;

  players[2].reserves = 2;
  players[2].currentHand = 1;
  players[2].currentBet = 5;

  // Real sum: 2 + 1 + 1 = 4. Player 0 bet 4, so Player 0 wins!
  const outcome = resolveRound(1, players[0].id, players);
  assert.equal(outcome.realSum, 4);
  assert.equal(outcome.winner?.id, players[0].id);

  assert.equal(outcome.updatedPlayers[0].reserves, 2); // 3 - 1 = 2
  assert.equal(outcome.updatedPlayers[1].reserves, 3); // unchanged
  assert.equal(outcome.updatedPlayers[2].reserves, 2); // unchanged
  assert.match(outcome.result.logText, /Você acertou na mosca/);
});

test('resolveRound with no winner changes no reserves', () => {
  const players = createPlayers(3, 'Você');
  players[0].currentHand = 0;
  players[0].currentBet = 2;

  players[1].currentHand = 0;
  players[1].currentBet = 3;

  players[2].currentHand = 0;
  players[2].currentBet = 4;

  // Real sum: 0. Nobody bet 0.
  const outcome = resolveRound(1, players[0].id, players);
  assert.equal(outcome.realSum, 0);
  assert.equal(outcome.winner, null);
  assert.equal(outcome.updatedPlayers[0].reserves, 3);
  assert.equal(outcome.updatedPlayers[1].reserves, 3);
  assert.equal(outcome.updatedPlayers[2].reserves, 3);
  assert.match(outcome.result.logText, /Ninguém acertou/);
});

test('checkGameWinner detects when any player reaches 0 sticks', () => {
  const players = createPlayers(3, 'Você');
  assert.equal(checkGameWinner(players), null);

  players[1].reserves = 0;
  const winner = checkGameWinner(players);
  assert.equal(winner?.id, players[1].id);
});
