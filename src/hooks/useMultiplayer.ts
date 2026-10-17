import { useState, useEffect, useRef, useCallback } from 'react';
import { Player, RoundResult } from '../game/rules';

export interface OnlineRoomState {
  code: string;
  maxPlayers: number;
  started: boolean;
  roundNumber: number;
  starterIndex: number;
  starterPlayerId: string;
  gamePhase: 'lobby' | 'hand_selection' | 'betting' | 'reveal' | 'round_result' | 'gameover';
  players: (Player & { hasChosenHand: boolean; isHost: boolean; isReady: boolean })[];
  turnOrder: number[];
  currentTurnIndexInOrder: number;
  currentTurnPlayerIndex: number | null;
  realSum: number | null;
  roundWinnerId: string | null;
  gameWinner: { id: string; name: string } | null;
  history: RoundResult[];
}

export function useMultiplayer() {
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [roomState, setRoomState] = useState<OnlineRoomState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Clean pathname: e.g. '/palito/index.html' -> '/palito', or '/' -> ''
    const cleanPath = window.location.pathname.replace(/(\/index\.html|\/)$/, '');
    const wsUrl = `${protocol}//${window.location.host}${cleanPath}/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const { type, payload } = JSON.parse(event.data);
          if (type === 'connected') {
            setSocketId(payload.socketId);
          } else if (type === 'room_state') {
            setRoomState(payload);
            setErrorMessage(null);
          } else if (type === 'error') {
            setErrorMessage(payload);
            if (typeof payload === 'string' && payload.toLowerCase().includes('sala não encontrada')) {
              setRoomState(null);
            }
          }
        } catch (e) {
          console.error('Error parsing WS message:', e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Automatic reconnection attempt after 2.5s with cleanup
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 2500);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      setErrorMessage('Falha ao conectar ao servidor WebSocket.');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const createRoom = useCallback((hostName: string, maxPlayers: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'create_room',
          payload: { hostName, maxPlayers },
        })
      );
    } else {
      setErrorMessage('Não conectado ao servidor WebSocket. Reconectando...');
      connect();
    }
  }, [connect]);

  const joinRoom = useCallback((code: string, playerName: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'join_room',
          payload: { code, playerName },
        })
      );
    } else {
      setErrorMessage('Não conectado ao servidor WebSocket. Reconectando...');
      connect();
    }
  }, [connect]);

  const startOnlineGame = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_game' }));
    }
  }, []);

  const submitOnlineHand = useCallback((count: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'submit_hand',
          payload: { count },
        })
      );
    }
  }, []);

  const submitOnlineBet = useCallback((bet: number) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'submit_bet',
          payload: { bet },
        })
      );
    }
  }, []);

  const nextOnlineRound = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'next_round' }));
    }
  }, []);

  const leaveRoom = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
    }
    setRoomState(null);
  }, []);

  return {
    isConnected,
    socketId,
    roomState,
    errorMessage,
    clearError: () => setErrorMessage(null),
    createRoom,
    joinRoom,
    startOnlineGame,
    submitOnlineHand,
    submitOnlineBet,
    nextOnlineRound,
    leaveRoom,
  };
}
