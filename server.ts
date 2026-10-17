import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
// QA & Security: Limit maximum payload to 64KB to prevent OOM / DoS attacks
const wss = new WebSocketServer({ server, maxPayload: 64 * 1024 });

const PORT = Number(process.env.PORT) || 3000;

interface OnlinePlayer {
  socketId: string;
  id: string;
  name: string;
  avatar: string;
  reserves: number;
  currentHand: number | null;
  currentBet: number | null;
  isReady: boolean;
  isHost: boolean;
}

interface OnlineRoom {
  code: string;
  hostSocketId: string;
  maxPlayers: number;
  started: boolean;
  roundNumber: number;
  starterIndex: number;
  gamePhase: 'lobby' | 'hand_selection' | 'betting' | 'reveal' | 'round_result' | 'gameover';
  players: OnlinePlayer[];
  turnOrder: number[];
  currentTurnIndexInOrder: number;
  realSum: number | null;
  roundWinnerId: string | null;
  gameWinner: { id: string; name: string } | null;
  history: any[];
  lastActivity: number;
}

const rooms = new Map<string, OnlineRoom>();
const socketToRoom = new Map<string, string>();
const socketMap = new Map<string, WebSocket>();

// Rate Limiting: Max 25 messages per second per socket connection
const socketMessageTimestamps = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 1000;
const MAX_MESSAGES_PER_WINDOW = 25;

function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const timestamps = socketMessageTimestamps.get(socketId) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  validTimestamps.push(now);
  socketMessageTimestamps.set(socketId, validTimestamps);
  return validTimestamps.length > MAX_MESSAGES_PER_WINDOW;
}

// Security: Sanitization helpers for names and codes
function sanitizePlayerName(name: unknown, fallback: string): string {
  if (typeof name !== 'string') return fallback;
  // Strip control characters, keep unicode letters, numbers, spaces, hyphens and underscores
  const cleaned = name.replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s+/g, ' ').trim();
  return cleaned.slice(0, 15) || fallback;
}

function sanitizeRoomCode(code: unknown): string | null {
  if (typeof code !== 'string') return null;
  const upper = code.trim().toUpperCase();
  return /^[A-Z0-9]{4}$/.test(upper) ? upper : null;
}

// Memory Leak Prevention: Cleanup inactive/abandoned rooms every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms.entries()) {
    if (room.players.length === 0 || now - room.lastActivity > 60 * 60 * 1000) {
      rooms.delete(code);
    }
  }
}, 5 * 60 * 1000);

const AVATARS = ['😎', '🤠', '🧐', '🍺', '🎲', '👵', '🦁', '🎭', '🎩', '⚡'];

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function getSanitizedRoomState(room: OnlineRoom, targetSocketId: string) {
  const isSecretPhase = room.gamePhase === 'hand_selection' || room.gamePhase === 'betting';

  const sanitizedPlayers = room.players.map((p) => {
    const isMe = p.socketId === targetSocketId;
    return {
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      reserves: p.reserves,
      // Hide other players' secret hands until reveal phase
      currentHand: isSecretPhase ? (isMe ? p.currentHand : null) : p.currentHand,
      hasChosenHand: p.currentHand !== null,
      currentBet: p.currentBet,
      isReady: p.isReady,
      isHost: p.isHost,
      isHuman: true,
    };
  });

  return {
    code: room.code,
    maxPlayers: room.maxPlayers,
    started: room.started,
    roundNumber: room.roundNumber,
    starterIndex: room.starterIndex,
    starterPlayerId: room.players[room.starterIndex]?.id ?? '',
    gamePhase: room.gamePhase,
    players: sanitizedPlayers,
    turnOrder: room.turnOrder,
    currentTurnIndexInOrder: room.currentTurnIndexInOrder,
    currentTurnPlayerIndex:
      room.gamePhase === 'betting' && room.turnOrder.length > 0
        ? room.turnOrder[room.currentTurnIndexInOrder]
        : null,
    realSum: room.realSum,
    roundWinnerId: room.roundWinnerId,
    gameWinner: room.gameWinner,
    history: room.history,
  };
}

function broadcastToRoom(roomCode: string, type: string, payloadFactory: (socketId: string) => any) {
  const room = rooms.get(roomCode);
  if (!room) return;

  for (const player of room.players) {
    const ws = socketMap.get(player.socketId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload: payloadFactory(player.socketId) }));
    }
  }
}

function broadcastRoomUpdate(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;
  broadcastToRoom(roomCode, 'room_state', (socketId) => getSanitizedRoomState(room, socketId));
}

function calculateLegalBetRange(playerIndex: number, players: OnlinePlayer[]) {
  const player = players[playerIndex];
  if (!player) return { min: 0, max: 0, takenBets: [] };

  const hand = player.currentHand ?? 0;
  let otherReserves = 0;
  for (let i = 0; i < players.length; i++) {
    if (i !== playerIndex) {
      otherReserves += players[i].reserves;
    }
  }

  const min = hand + 0;
  const max = hand + otherReserves;
  const takenBets = players
    .filter((p) => p.currentBet !== null)
    .map((p) => ({ bet: p.currentBet!, playerId: p.id, playerName: p.name }));

  return { min, max, takenBets };
}

function resolveOnlineRound(room: OnlineRoom) {
  let realSum = 0;
  for (const p of room.players) {
    realSum += p.currentHand ?? 0;
  }

  let winner: OnlinePlayer | null = null;
  for (const p of room.players) {
    if (p.currentBet === realSum) {
      winner = p;
      break;
    }
  }

  // Update reserves
  if (winner) {
    winner.reserves = Math.max(0, winner.reserves - 1);
  }

  room.realSum = realSum;
  room.roundWinnerId = winner?.id ?? null;

  // Build structured log
  const logLines: string[] = [
    '==================================================',
    `RODADA [${room.roundNumber}] (SALA ONLINE ${room.code})`,
    '==================================================',
    'Placar Atual de Palitos:',
  ];

  for (const p of room.players) {
    const reserveBefore = p.reserves + (winner?.id === p.id ? 1 : 0);
    logLines.push(`- ${p.name}: [${reserveBefore}] palitos restantes`);
  }

  logLines.push('');
  logLines.push('Palpites da Rodada:');
  for (const p of room.players) {
    logLines.push(`- ${p.name} palpitou: [${p.currentBet ?? '-'}]`);
  }

  logLines.push('');
  logLines.push('--- REVELAÇÃO ---');
  logLines.push('Mãos na mesa:');
  for (const p of room.players) {
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

  room.history.unshift({
    roundNumber: room.roundNumber,
    starterPlayerId: room.players[room.starterIndex]?.id ?? '',
    playersSnapshot: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHuman: true,
      reserveBefore: p.reserves + (winner?.id === p.id ? 1 : 0),
      reserveAfter: p.reserves,
      hand: p.currentHand ?? 0,
      bet: p.currentBet,
    })),
    realSum,
    winnerId: winner?.id ?? null,
    winnerName: winner?.name ?? null,
    logText,
  });

  // Check victory
  const champion = room.players.find((p) => p.reserves === 0);
  if (champion) {
    room.gameWinner = { id: champion.id, name: champion.name };
    room.gamePhase = 'gameover';
  } else {
    room.gamePhase = 'round_result';
  }
}

// WebSocket Connection Management
wss.on('connection', (ws) => {
  const socketId = Math.random().toString(36).substring(2, 9);
  socketMap.set(socketId, ws);

  ws.send(JSON.stringify({ type: 'connected', payload: { socketId } }));

  ws.on('message', (messageRaw) => {
    try {
      // Security: Rate Limit checking per socket connection
      if (isRateLimited(socketId)) {
        ws.send(JSON.stringify({ type: 'error', payload: 'Muitas requisições enviadas. Aguarde um segundo.' }));
        return;
      }

      // Defensive Parsing
      const parsed = JSON.parse(messageRaw.toString());
      if (!parsed || typeof parsed !== 'object') return;
      const type = parsed.type;
      const payload = (parsed.payload && typeof parsed.payload === 'object') ? parsed.payload : {};

      if (type === 'create_room') {
        const { hostName, maxPlayers } = payload;
        const code = generateRoomCode();
        const initialPlayer: OnlinePlayer = {
          socketId,
          id: `player-${socketId}`,
          name: sanitizePlayerName(hostName, 'Anfitrião'),
          avatar: AVATARS[0],
          reserves: 3,
          currentHand: null,
          currentBet: null,
          isReady: true,
          isHost: true,
        };

        const newRoom: OnlineRoom = {
          code,
          hostSocketId: socketId,
          maxPlayers: Math.max(2, Math.min(6, Number(maxPlayers) || 3)),
          started: false,
          roundNumber: 1,
          starterIndex: 0,
          gamePhase: 'lobby',
          players: [initialPlayer],
          turnOrder: [],
          currentTurnIndexInOrder: 0,
          realSum: null,
          roundWinnerId: null,
          gameWinner: null,
          history: [],
          lastActivity: Date.now(),
        };

        rooms.set(code, newRoom);
        socketToRoom.set(socketId, code);

        broadcastRoomUpdate(code);
      } else if (type === 'join_room') {
        const { code, playerName } = payload;
        const roomCode = sanitizeRoomCode(code);

        if (!roomCode) {
          ws.send(JSON.stringify({ type: 'error', payload: 'Código de sala inválido. Deve ter 4 caracteres alfanuméricos.' }));
          return;
        }

        const room = rooms.get(roomCode);

        if (!room) {
          ws.send(JSON.stringify({ type: 'error', payload: 'Sala não encontrada. Verifique o código.' }));
          return;
        }

        room.lastActivity = Date.now();

        if (room.started) {
          ws.send(JSON.stringify({ type: 'error', payload: 'Esta partida já foi iniciada.' }));
          return;
        }

        if (room.players.length >= room.maxPlayers) {
          ws.send(JSON.stringify({ type: 'error', payload: `A sala já atingiu a lotação de ${room.maxPlayers} jogadores.` }));
          return;
        }

        const existingPlayer = room.players.find((p) => p.socketId === socketId);
        if (!existingPlayer) {
          const newPlayer: OnlinePlayer = {
            socketId,
            id: `player-${socketId}`,
            name: sanitizePlayerName(playerName, `Jogador ${room.players.length + 1}`),
            avatar: AVATARS[room.players.length % AVATARS.length],
            reserves: 3,
            currentHand: null,
            currentBet: null,
            isReady: true,
            isHost: false,
          };
          room.players.push(newPlayer);
        }

        socketToRoom.set(socketId, roomCode);
        broadcastRoomUpdate(roomCode);
      } else if (type === 'start_game') {
        const roomCode = socketToRoom.get(socketId);
        const room = roomCode ? rooms.get(roomCode) : null;
        if (!room || room.hostSocketId !== socketId) return;

        if (room.players.length < 2) {
          ws.send(JSON.stringify({ type: 'error', payload: 'Necessário pelo menos 2 jogadores para iniciar.' }));
          return;
        }

        room.lastActivity = Date.now();
        room.started = true;
        room.roundNumber = 1;
        room.starterIndex = 0;
        room.gamePhase = 'hand_selection';
        room.realSum = null;
        room.roundWinnerId = null;
        room.gameWinner = null;
        for (const p of room.players) {
          p.currentHand = null;
          p.currentBet = null;
          p.reserves = 3;
        }

        if (roomCode) broadcastRoomUpdate(roomCode);
      } else if (type === 'submit_hand') {
        const roomCode = socketToRoom.get(socketId);
        const room = roomCode ? rooms.get(roomCode) : null;
        if (!room || !roomCode || room.gamePhase !== 'hand_selection') return;

        const player = room.players.find((p) => p.socketId === socketId);
        if (!player) return;

        const count = parseInt(String(payload.count), 10);
        if (isNaN(count) || count < 0 || count > player.reserves) {
          ws.send(JSON.stringify({ type: 'error', payload: 'Quantidade inválida de palitos na mão.' }));
          return;
        }

        room.lastActivity = Date.now();
        player.currentHand = count;

        // Check if all players have submitted hand
        const allSubmitted = room.players.every((p) => p.currentHand !== null);
        if (allSubmitted) {
          room.gamePhase = 'betting';
          const order: number[] = [];
          for (let i = 0; i < room.players.length; i++) {
            order.push((room.starterIndex + i) % room.players.length);
          }
          room.turnOrder = order;
          room.currentTurnIndexInOrder = 0;
        }

        broadcastRoomUpdate(roomCode);
      } else if (type === 'submit_bet') {
        const roomCode = socketToRoom.get(socketId);
        const room = roomCode ? rooms.get(roomCode) : null;
        if (!room || !roomCode || room.gamePhase !== 'betting') return;

        const currentTurnPlayerIndex = room.turnOrder[room.currentTurnIndexInOrder];
        const activePlayer = room.players[currentTurnPlayerIndex];

        if (!activePlayer || activePlayer.socketId !== socketId) {
          ws.send(JSON.stringify({ type: 'error', payload: 'Não é sua vez de palpitar!' }));
          return;
        }

        const bet = parseInt(String(payload.bet), 10);
        if (isNaN(bet)) return;

        const range = calculateLegalBetRange(currentTurnPlayerIndex, room.players);
        if (bet < range.min || bet > range.max) {
          ws.send(JSON.stringify({ type: 'error', payload: `Palpite fora do intervalo permitido (${range.min} a ${range.max}).` }));
          return;
        }

        const isDuplicate = range.takenBets.some((t) => t.bet === bet);
        if (isDuplicate) {
          ws.send(JSON.stringify({ type: 'error', payload: `O palpite ${bet} já foi feito por outro jogador!` }));
          return;
        }

        room.lastActivity = Date.now();
        activePlayer.currentBet = bet;

        const nextIndex = room.currentTurnIndexInOrder + 1;
        if (nextIndex >= room.turnOrder.length) {
          // All bets collected -> Resolve round
          room.gamePhase = 'reveal';
          resolveOnlineRound(room);
        } else {
          room.currentTurnIndexInOrder = nextIndex;
        }

        broadcastRoomUpdate(roomCode);
      } else if (type === 'next_round') {
        const roomCode = socketToRoom.get(socketId);
        const room = roomCode ? rooms.get(roomCode) : null;
        // Atomic check: only advance if room is in round_result or reveal phase
        if (!room || !roomCode || (room.gamePhase !== 'round_result' && room.gamePhase !== 'reveal')) return;

        // Verify that the caller is a participant in this room
        const isParticipant = room.players.some((p) => p.socketId === socketId);
        if (!isParticipant) return;

        // Atomic lock: immediately switch phase to prevent race conditions from concurrent clicks
        room.gamePhase = 'hand_selection';
        room.lastActivity = Date.now();
        room.starterIndex = (room.starterIndex + 1) % room.players.length;
        room.roundNumber += 1;
        room.realSum = null;
        room.roundWinnerId = null;
        for (const p of room.players) {
          p.currentHand = null;
          p.currentBet = null;
        }

        broadcastRoomUpdate(roomCode);
      } else if (type === 'leave_room') {
        handlePlayerDisconnect(socketId);
      }
    } catch (e) {
      console.error('WS Error:', e);
    }
  });

  ws.on('close', () => {
    handlePlayerDisconnect(socketId);
    socketMap.delete(socketId);
    socketMessageTimestamps.delete(socketId);
  });
});

function handlePlayerDisconnect(socketId: string) {
  const roomCode = socketToRoom.get(socketId);
  if (!roomCode) return;

  socketToRoom.delete(socketId);
  const room = rooms.get(roomCode);
  if (!room) return;

  room.players = room.players.filter((p) => p.socketId !== socketId);

  if (room.players.length === 0) {
    rooms.delete(roomCode);
    return;
  }

  // Transfer host if host left
  if (room.hostSocketId === socketId) {
    room.hostSocketId = room.players[0].socketId;
    room.players[0].isHost = true;
  }

  // If game in progress and fewer than 2 players remain, reset to lobby
  if (room.started && room.players.length < 2) {
    room.started = false;
    room.gamePhase = 'lobby';
    room.roundNumber = 1;
    for (const p of room.players) {
      p.reserves = 3;
      p.currentHand = null;
      p.currentBet = null;
    }
  } else if (room.started) {
    // Keep game flow intact if 2 or more players remain
    room.starterIndex = room.starterIndex % room.players.length;

    // Recalculate turn order for remaining players
    const order: number[] = [];
    for (let i = 0; i < room.players.length; i++) {
      order.push((room.starterIndex + i) % room.players.length);
    }
    room.turnOrder = order;
    room.currentTurnIndexInOrder = Math.min(room.currentTurnIndexInOrder, Math.max(0, order.length - 1));

    if (room.gamePhase === 'hand_selection') {
      const allSubmitted = room.players.every((p) => p.currentHand !== null);
      if (allSubmitted) {
        room.gamePhase = 'betting';
        room.currentTurnIndexInOrder = 0;
      }
    } else if (room.gamePhase === 'betting') {
      const allBet = room.players.every((p) => p.currentBet !== null);
      if (allBet) {
        room.gamePhase = 'reveal';
        resolveOnlineRound(room);
      } else {
        const pendingTurn = room.turnOrder.findIndex(
          (playerIdx) => room.players[playerIdx]?.currentBet === null
        );
        if (pendingTurn !== -1) {
          room.currentTurnIndexInOrder = pendingTurn;
        }
      }
    }
  }

  broadcastRoomUpdate(roomCode);
}

// Vite integration / Static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production' && !fs.existsSync(path.resolve(__dirname, 'dist'))) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Palito Game Engine Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
