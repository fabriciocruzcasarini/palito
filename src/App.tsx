/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Player,
  RoundResult,
  createPlayers,
  decideBotHand,
  decideBotBet,
  getTurnOrder,
  resolveRound,
  checkGameWinner,
} from './game/rules';
import { sound } from './utils/audio';
import { useMultiplayer } from './hooks/useMultiplayer';
import { TitleScreen } from './components/TitleScreen';
import { OnlineLobby } from './components/OnlineLobby';
import { TableBoard } from './components/TableBoard';
import { ActionDock } from './components/ActionDock';
import { LogDrawer } from './components/LogDrawer';
import { RulesModal } from './components/RulesModal';
import { VictoryModal } from './components/VictoryModal';

type AppState = 'title' | 'playing' | 'paused' | 'gameover';
type GamePhase = 'hand_selection' | 'betting' | 'reveal' | 'round_result';
type GameMode = 'bot' | 'online';

export default function App() {
  const [appState, setAppState] = useState<AppState>('title');
  const [gameMode, setGameMode] = useState<GameMode>('bot');
  const [gamePhase, setGamePhase] = useState<GamePhase>('hand_selection');

  // Singleplayer State
  const [players, setPlayers] = useState<Player[]>(() => createPlayers(3, 'Você'));
  const [roundNumber, setRoundNumber] = useState<number>(1);
  const [starterIndex, setStarterIndex] = useState<number>(0);
  const [currentTurnOrder, setCurrentTurnOrder] = useState<number[]>([]);
  const [currentTurnIndexInOrder, setCurrentTurnIndexInOrder] = useState<number>(0);
  const [realSum, setRealSum] = useState<number | null>(null);
  const [roundWinnerId, setRoundWinnerId] = useState<string | null>(null);
  const [gameWinner, setGameWinner] = useState<Player | null>(null);
  const [history, setHistory] = useState<RoundResult[]>([]);

  // UI Modals & Drawers
  const [showLogDrawer, setShowLogDrawer] = useState<boolean>(false);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  // Online Multiplayer Hook
  const {
    socketId,
    roomState,
    errorMessage: onlineError,
    createRoom,
    joinRoom,
    startOnlineGame,
    submitOnlineHand,
    submitOnlineBet,
    nextOnlineRound,
    leaveRoom,
  } = useMultiplayer();

  const botTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync document.body.dataset.state for Ultra-Mode and game craft
  useEffect(() => {
    document.body.dataset.state = appState;
  }, [appState]);

  // Autostart query parameter support (?autostart=1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autostart') === '1') {
        startBotGame(3, 'Você');
      }
    }
  }, []);

  /**
   * Starts a Single-Player match against Bots
   */
  const startBotGame = useCallback((playerCount: number = 3, humanName: string = 'Você') => {
    if (botTimerRef.current) clearTimeout(botTimerRef.current);

    setGameMode('bot');
    const initialPlayers = createPlayers(playerCount, humanName);
    setPlayers(initialPlayers);
    setRoundNumber(1);
    setStarterIndex(0);
    setRealSum(null);
    setRoundWinnerId(null);
    setGameWinner(null);
    setHistory([]);
    setGamePhase('hand_selection');
    setAppState('playing');

    const order = getTurnOrder(0, initialPlayers.length);
    setCurrentTurnOrder(order);
    setCurrentTurnIndexInOrder(0);
  }, []);

  /**
   * Human confirms their hidden hand count for Phase 1 (Singleplayer)
   */
  const handleConfirmHumanHand = useCallback(
    (handCount: number) => {
      if (gameMode === 'online') {
        submitOnlineHand(handCount);
        return;
      }

      // Secretly choose hands for all bots
      const updatedPlayers = players.map((p) => {
        if (p.isHuman) {
          return { ...p, currentHand: handCount, currentBet: null };
        }
        const botHand = decideBotHand(p);
        return { ...p, currentHand: botHand, currentBet: null };
      });

      setPlayers(updatedPlayers);
      setGamePhase('betting');

      const order = getTurnOrder(starterIndex, updatedPlayers.length);
      setCurrentTurnOrder(order);
      setCurrentTurnIndexInOrder(0);
    },
    [gameMode, players, starterIndex, submitOnlineHand]
  );

  /**
   * Advances the bet turn sequentially among players (Singleplayer)
   */
  const advanceBetting = useCallback(
    (currentPlayers: Player[], nextTurnOrderIndex: number) => {
      if (nextTurnOrderIndex >= currentTurnOrder.length) {
        sound.playRevealRattle();
        setGamePhase('reveal');

        const starterPlayerId = currentPlayers[starterIndex]?.id ?? currentPlayers[0].id;
        const outcome = resolveRound(roundNumber, starterPlayerId, currentPlayers);

        setRealSum(outcome.realSum);
        setRoundWinnerId(outcome.winner?.id ?? null);
        setHistory((prev) => [outcome.result, ...prev]);

        if (outcome.winner) {
          sound.playRoundWin();
          setTimeout(() => sound.playStickDiscard(), 400);
        } else {
          sound.playNobodyWon();
        }

        setPlayers(outcome.updatedPlayers);

        const finalWinner = checkGameWinner(outcome.updatedPlayers);
        if (finalWinner) {
          setGameWinner(finalWinner);
          setTimeout(() => {
            sound.playChampionFanfare();
            setAppState('gameover');
          }, 1800);
        } else {
          setGamePhase('round_result');
        }
        return;
      }

      setCurrentTurnIndexInOrder(nextTurnOrderIndex);
    },
    [currentTurnOrder, roundNumber, starterIndex]
  );

  // Clear bot timer immediately when game is paused
  useEffect(() => {
    if (appState === 'paused' && botTimerRef.current) {
      clearTimeout(botTimerRef.current);
    }
  }, [appState]);

  // Reactive bot betting loop for Phase 2 (Singleplayer)
  useEffect(() => {
    if (
      appState === 'playing' &&
      gameMode === 'bot' &&
      gamePhase === 'betting' &&
      currentTurnOrder.length > 0 &&
      currentTurnIndexInOrder < currentTurnOrder.length
    ) {
      const activePlayerIndex = currentTurnOrder[currentTurnIndexInOrder];
      const activePlayer = players[activePlayerIndex];

      if (activePlayer && !activePlayer.isHuman && activePlayer.currentBet === null) {
        if (botTimerRef.current) clearTimeout(botTimerRef.current);
        botTimerRef.current = setTimeout(() => {
          const botBet = decideBotBet(activePlayerIndex, players);
          sound.playBet(botBet);

          const afterBotPlayers = players.map((p, idx) =>
            idx === activePlayerIndex ? { ...p, currentBet: botBet } : p
          );

          setPlayers(afterBotPlayers);
          advanceBetting(afterBotPlayers, currentTurnIndexInOrder + 1);
        }, 650);
      }
    }
  }, [appState, gameMode, gamePhase, currentTurnIndexInOrder, currentTurnOrder, players, advanceBetting]);

  /**
   * Human confirms their bet in Phase 2
   */
  const handleConfirmHumanBet = useCallback(
    (bet: number) => {
      if (gameMode === 'online') {
        submitOnlineBet(bet);
        return;
      }

      const humanIdx = players.findIndex((p) => p.isHuman);
      const updatedPlayers = players.map((p, idx) =>
        idx === humanIdx ? { ...p, currentBet: bet } : p
      );

      setPlayers(updatedPlayers);
      advanceBetting(updatedPlayers, currentTurnIndexInOrder + 1);
    },
    [gameMode, players, currentTurnIndexInOrder, advanceBetting, submitOnlineBet]
  );

  /**
   * Advances to next round
   */
  const handleNextRound = useCallback(() => {
    if (gameMode === 'online') {
      nextOnlineRound();
      return;
    }

    if (gameWinner) return;

    const nextStarter = (starterIndex + 1) % players.length;
    setStarterIndex(nextStarter);
    setRoundNumber((r) => r + 1);
    setRealSum(null);
    setRoundWinnerId(null);

    setPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        currentHand: null,
        currentBet: null,
      }))
    );

    setGamePhase('hand_selection');
  }, [gameMode, gameWinner, starterIndex, players.length, nextOnlineRound]);

  /**
   * Online state synchronization & audio cues
   */
  useEffect(() => {
    if (gameMode === 'online' && roomState) {
      if (roomState.gamePhase === 'reveal') {
        sound.playRevealRattle();
        if (roomState.roundWinnerId) {
          sound.playRoundWin();
        } else {
          sound.playNobodyWon();
        }
      } else if (roomState.gamePhase === 'gameover') {
        sound.playChampionFanfare();
      }
    }
  }, [gameMode, roomState?.gamePhase, roomState?.roundWinnerId]);

  /**
   * Global keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        const muted = sound.toggleMute();
        setIsMuted(muted);
      } else if (e.key === 'l' || e.key === 'L') {
        setShowLogDrawer((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (showLogDrawer) setShowLogDrawer(false);
        else if (showRulesModal) setShowRulesModal(false);
        else if (appState === 'playing') setAppState('paused');
        else if (appState === 'paused') setAppState('playing');
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (appState === 'title') {
          startBotGame(3, 'Você');
        } else if (gamePhase === 'round_result' || gamePhase === 'reveal') {
          handleNextRound();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [appState, gamePhase, showLogDrawer, showRulesModal, handleNextRound, startBotGame]);

  // Online Room Flow Handler
  const handleCreateRoom = (hostName: string, maxPlayers: number) => {
    setGameMode('online');
    setAppState('playing');
    createRoom(hostName, maxPlayers);
  };

  const handleJoinRoom = (code: string, playerName: string) => {
    setGameMode('online');
    setAppState('playing');
    joinRoom(code, playerName);
  };

  const handleLeaveOnline = () => {
    leaveRoom();
    setGameMode('bot');
    setAppState('title');
  };

  // Online mode active view
  if (gameMode === 'online') {
    if (!roomState || roomState.gamePhase === 'lobby') {
      return (
        <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 font-sans">
          {roomState ? (
            <OnlineLobby
              roomState={roomState}
              socketId={socketId}
              onStartGame={startOnlineGame}
              onLeaveRoom={handleLeaveOnline}
            />
          ) : (
            <TitleScreen
              onStartSinglePlayer={startBotGame}
              onCreateOnlineRoom={handleCreateRoom}
              onJoinOnlineRoom={handleJoinRoom}
              onOpenRules={() => setShowRulesModal(true)}
              onlineError={onlineError}
            />
          )}

          <RulesModal
            isOpen={showRulesModal}
            onClose={() => setShowRulesModal(false)}
          />
        </div>
      );
    }

    // In-game online table
    const myId = socketId ? `player-${socketId}` : undefined;
    const myIndex = myId ? roomState.players.findIndex((p) => p.id === myId) : 0;
    const myPlayer = (myIndex >= 0 ? roomState.players[myIndex] : null) || roomState.players[0];

    return (
      <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col justify-between font-sans overflow-x-hidden">
        {/* Top Game Bar HUD */}
        <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 px-3 bg-stone-900/80 border border-stone-800 rounded-2xl shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌐</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-black text-amber-300">
                  RODADA {roomState.roundNumber}
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold uppercase tracking-wider">
                  Sala {roomState.code} (Sem Bots)
                </span>
              </div>
              <span className="text-[10px] text-stone-400 block">
                Abre a vez: <strong className="text-stone-200">{roomState.players[roomState.starterIndex]?.name}</strong>
              </span>
            </div>
          </div>

          {/* Top Right Utility Controls */}
          <div className="flex items-center gap-1.5 md:gap-2">
            <button
              type="button"
              onClick={() => {
                const muted = sound.toggleMute();
                setIsMuted(muted);
              }}
              title={isMuted ? 'Desmutar [M]' : 'Mutar som [M]'}
              className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center justify-center text-sm cursor-pointer transition-all"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            <button
              type="button"
              onClick={() => setShowRulesModal(true)}
              title="Regras do Jogo"
              className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center justify-center text-sm cursor-pointer transition-all"
            >
              📖
            </button>

            <button
              type="button"
              onClick={() => setShowLogDrawer(true)}
              title="Histórico da Mesa [L]"
              className="px-3 h-9 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <span>📜</span>
              <span className="hidden sm:inline">Histórico</span>
            </button>

            <button
              type="button"
              onClick={handleLeaveOnline}
              title="Sair da sala"
              className="px-3 h-9 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs flex items-center gap-1 cursor-pointer transition-all"
            >
              Sair
            </button>
          </div>
        </header>

        {/* Table Area */}
        <main className="flex-1 flex items-center justify-center w-full py-2">
          <TableBoard
            players={roomState.players}
            currentTurnPlayerIndex={roomState.currentTurnPlayerIndex}
            starterPlayerId={roomState.starterPlayerId}
            gamePhase={roomState.gamePhase === 'gameover' ? 'round_result' : roomState.gamePhase}
            realSum={roomState.realSum}
            roundWinnerId={roomState.roundWinnerId}
            roundNumber={roomState.roundNumber}
            myPlayerId={myId}
          />
        </main>

        {/* Bottom Action Dock */}
        <footer className="w-full py-1">
          <ActionDock
            humanPlayer={myPlayer}
            players={roomState.players}
            humanIndex={myIndex}
            gamePhase={roomState.gamePhase === 'gameover' ? 'round_result' : roomState.gamePhase}
            currentTurnPlayerIndex={roomState.currentTurnPlayerIndex}
            onConfirmHand={handleConfirmHumanHand}
            onConfirmBet={handleConfirmHumanBet}
            onNextRound={handleNextRound}
            isOnlineMode={true}
          />
        </footer>

        {/* Victory Modal */}
        {roomState.gamePhase === 'gameover' && roomState.gameWinner && (
          <VictoryModal
            winner={roomState.players.find((p) => p.id === roomState.gameWinner?.id) || myPlayer}
            players={roomState.players}
            history={roomState.history}
            onRestart={startOnlineGame}
            onLeave={handleLeaveOnline}
            isOnline={true}
            isHost={myPlayer.isHost}
            myPlayerId={myId}
          />
        )}

        <LogDrawer
          isOpen={showLogDrawer}
          onClose={() => setShowLogDrawer(false)}
          history={roomState.history}
        />

        <RulesModal
          isOpen={showRulesModal}
          onClose={() => setShowRulesModal(false)}
        />
      </div>
    );
  }

  // Singleplayer (Bot) Flow
  const humanIndex = players.findIndex((p) => p.isHuman);
  const humanPlayer = players[humanIndex] || players[0];
  const currentTurnPlayerIndex =
    gamePhase === 'betting' && currentTurnOrder.length > 0
      ? currentTurnOrder[currentTurnIndexInOrder]
      : null;

  return (
    <div className="relative min-h-screen w-full bg-stone-950 text-stone-100 flex flex-col justify-between font-sans overflow-x-hidden">
      {/* TITLE SCREEN */}
      {appState === 'title' && (
        <TitleScreen
          onStartSinglePlayer={startBotGame}
          onCreateOnlineRoom={handleCreateRoom}
          onJoinOnlineRoom={handleJoinRoom}
          onOpenRules={() => setShowRulesModal(true)}
          onlineError={onlineError}
        />
      )}

      {/* ACTIVE PLAYING / PAUSED GAME SHELL */}
      {(appState === 'playing' || appState === 'paused') && (
        <div className="relative min-h-screen w-full flex flex-col justify-between p-2 md:p-4">
          {/* Top Game Bar HUD */}
          <header className="w-full max-w-5xl mx-auto flex items-center justify-between py-2 px-3 bg-stone-900/80 border border-stone-800 rounded-2xl shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍺</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs md:text-sm font-black text-amber-300">
                    RODADA {roundNumber}
                  </span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold uppercase tracking-wider">
                    Modo Treino (com Bots)
                  </span>
                </div>
                <span className="text-[10px] text-stone-400 block">
                  Abre a vez: <strong className="text-stone-200">{players[starterIndex]?.name}</strong>
                </span>
              </div>
            </div>

            {/* Top Right Utility Controls */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                type="button"
                onClick={() => {
                  const muted = sound.toggleMute();
                  setIsMuted(muted);
                }}
                title={isMuted ? 'Desmutar [M]' : 'Mutar som [M]'}
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center justify-center text-sm cursor-pointer transition-all"
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              <button
                type="button"
                onClick={() => setShowRulesModal(true)}
                title="Regras do Jogo"
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center justify-center text-sm cursor-pointer transition-all"
              >
                📖
              </button>

              <button
                type="button"
                onClick={() => setShowLogDrawer(true)}
                title="Histórico da Mesa [L]"
                className="px-3 h-9 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>📜</span>
                <span className="hidden sm:inline">Histórico</span>
              </button>

              <button
                type="button"
                onClick={() => setAppState('paused')}
                title="Pausar jogo [Esc]"
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 flex items-center justify-center text-sm cursor-pointer transition-all"
              >
                ⏸
              </button>
            </div>
          </header>

          {/* Table Area */}
          <main className="flex-1 flex items-center justify-center w-full py-2">
            <TableBoard
              players={players}
              currentTurnPlayerIndex={currentTurnPlayerIndex}
              starterPlayerId={players[starterIndex]?.id ?? ''}
              gamePhase={gamePhase}
              realSum={realSum}
              roundWinnerId={roundWinnerId}
              roundNumber={roundNumber}
              myPlayerId="human-0"
            />
          </main>

          {/* Bottom Action Dock */}
          <footer className="w-full py-1">
            <ActionDock
              humanPlayer={humanPlayer}
              players={players}
              humanIndex={humanIndex}
              gamePhase={gamePhase}
              currentTurnPlayerIndex={currentTurnPlayerIndex}
              onConfirmHand={handleConfirmHumanHand}
              onConfirmBet={handleConfirmHumanBet}
              onNextRound={handleNextRound}
              isOnlineMode={false}
            />
          </footer>
        </div>
      )}

      {/* PAUSE MODAL */}
      {appState === 'paused' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-stone-900 border-2 border-stone-700 rounded-3xl p-6 text-center shadow-2xl">
            <span className="text-4xl mb-2 inline-block">⏸</span>
            <h3 className="text-xl font-black text-amber-200 mb-1">Partida Pausada</h3>
            <p className="text-xs text-stone-400 mb-6">
              A mesa de purrinha está aguardando você.
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setAppState('playing')}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl transition-all cursor-pointer"
              >
                Retomar Partida
              </button>
              <button
                type="button"
                onClick={() => startBotGame(players.length, humanPlayer.name)}
                className="w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl border border-stone-700 transition-all cursor-pointer text-sm"
              >
                Reiniciar do Zero
              </button>
              <button
                type="button"
                onClick={() => setAppState('title')}
                className="w-full py-2 text-stone-400 hover:text-stone-200 text-xs font-semibold cursor-pointer"
              >
                Sair para o Menu Inicial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VICTORY & GAME OVER MODAL */}
      {appState === 'gameover' && gameWinner && (
        <VictoryModal
          winner={gameWinner}
          players={players}
          history={history}
          onRestart={() => startBotGame(players.length, humanPlayer.name)}
          myPlayerId="human-0"
        />
      )}

      {/* HISTÓRICO DA MESA DRAWER */}
      <LogDrawer
        isOpen={showLogDrawer}
        onClose={() => setShowLogDrawer(false)}
        history={history}
      />

      {/* REGRAS MODAL */}
      <RulesModal
        isOpen={showRulesModal}
        onClose={() => setShowRulesModal(false)}
      />
    </div>
  );
}
