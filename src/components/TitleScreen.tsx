import React, { useState, useEffect } from 'react';
import { Matchstick } from './Matchstick';
import { sound } from '../utils/audio';

interface TitleScreenProps {
  onStartSinglePlayer: (playerCount: number, playerName: string) => void;
  onCreateOnlineRoom: (hostName: string, maxPlayers: number) => void;
  onJoinOnlineRoom: (roomCode: string, playerName: string) => void;
  onOpenRules: () => void;
  onOpenRanking?: () => void;
  onlineError?: string | null;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartSinglePlayer,
  onCreateOnlineRoom,
  onJoinOnlineRoom,
  onOpenRules,
  onOpenRanking,
  onlineError,
}) => {
  const [mode, setMode] = useState<'bot' | 'online_create' | 'online_join'>('bot');

  // Single player settings
  const [playerCount, setPlayerCount] = useState<number>(3);
  const [playerName, setPlayerName] = useState<string>('Você');

  // Online settings
  const [onlineMaxPlayers, setOnlineMaxPlayers] = useState<number>(3);
  const [joinRoomCode, setJoinRoomCode] = useState<string>('');

  // Check URL param ?room=CODE
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const roomParam = params.get('room');
      if (roomParam) {
        setJoinRoomCode(roomParam.toUpperCase());
        setMode('online_join');
      }
    }
  }, []);

  const handleStartBot = () => {
    sound.playWoodTap(1.2);
    onStartSinglePlayer(playerCount, playerName.trim() || 'Você');
  };

  const handleCreateOnline = () => {
    sound.playWoodTap(1.2);
    onCreateOnlineRoom(playerName.trim() || 'Você', onlineMaxPlayers);
  };

  const handleJoinOnline = () => {
    if (!joinRoomCode.trim()) return;
    sound.playWoodTap(1.2);
    onJoinOnlineRoom(joinRoomCode.trim().toUpperCase(), playerName.trim() || 'Você');
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-8 overflow-hidden bg-stone-950 text-stone-100 select-none">
      {/* Background ambient tavern lighting & texture */}
      <div className="absolute inset-0 bg-radial-gradient from-amber-950/20 via-stone-950 to-stone-950 pointer-events-none" />
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

      {/* Atmospheric glowing warm pool of light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-amber-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎲</span>
          <span className="text-xs font-black uppercase tracking-widest text-amber-500/80">
            Tradição dos Botequins do Brasil
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenRanking && (
            <button
              type="button"
              onClick={onOpenRanking}
              className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 hover:text-white hover:bg-amber-500/30 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <span>🏆</span>
              <span>Ranking</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenRules}
            className="px-3.5 py-1.5 rounded-full bg-stone-900 border border-amber-600/40 text-amber-300 hover:text-white hover:border-amber-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📖</span>
            <span>Como Jogar</span>
          </button>
        </div>
      </header>

      {/* Hero Centerpiece: Bespoke Title Lockup */}
      <main className="relative z-10 flex flex-col items-center text-center my-auto max-w-2xl w-full">
        {/* Crossed matchsticks */}
        <div className="relative flex items-center justify-center w-28 h-16 mb-1">
          <Matchstick size="md" rotation={-35} className="absolute left-6" />
          <Matchstick size="md" rotation={35} className="absolute right-6" />
        </div>

        {/* Inline SVG Title Lockup */}
        <div className="w-full max-w-xs md:max-w-sm my-1">
          <svg
            viewBox="0 0 400 90"
            className="w-full h-auto drop-shadow-[0_10px_25px_rgba(245,158,11,0.35)]"
          >
            <defs>
              <linearGradient id="goldGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="45%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
            <text
              x="200"
              y="68"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="68"
              letterSpacing="8"
              fill="url(#goldGradient)"
              stroke="#78350f"
              strokeWidth="2"
              paintOrder="stroke fill"
            >
              PALITO
            </text>
          </svg>
        </div>

        <p className="text-xs md:text-sm font-medium text-amber-200/80 max-w-md mb-5">
          O clássico jogo de purrinha e blefe. Jogue contra robôs inteligentes ou abra uma mesa online com amigos reais!
        </p>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-stone-900 border border-amber-600/40 rounded-2xl w-full max-w-md mb-4">
          <button
            type="button"
            onClick={() => setMode('bot')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'bot'
                ? 'bg-amber-500 text-stone-950 shadow-md scale-[1.02]'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span>🤖</span>
            <span>Jogar com BOT</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('online_create')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'online_create'
                ? 'bg-amber-500 text-stone-950 shadow-md scale-[1.02]'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span>🌐</span>
            <span>Criar Sala Online</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('online_join')}
            className={`py-2 px-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              mode === 'online_join'
                ? 'bg-amber-500 text-stone-950 shadow-md scale-[1.02]'
                : 'text-stone-300 hover:text-white hover:bg-stone-800'
            }`}
          >
            <span>🚪</span>
            <span>Entrar em Sala</span>
          </button>
        </div>

        {/* Online Error Banner */}
        {onlineError && (
          <div className="w-full max-w-md mb-3 p-2 bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold rounded-xl text-center">
            ⚠️ {onlineError}
          </div>
        )}

        {/* Common Player Name Input */}
        <div className="w-full max-w-md bg-stone-900/90 border border-amber-600/40 rounded-3xl p-5 shadow-2xl backdrop-blur-sm mb-4 text-left">
          <div className="mb-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
              Seu Nome na Mesa
            </label>
            <input
              type="text"
              maxLength={15}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Ex: Zé, Você, Campeão"
              className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl text-stone-100 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm"
            />
          </div>

          {/* MODE: BOT */}
          {mode === 'bot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Total de Jogadores (Você + Bots)
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {playerCount} jogadores (1 Você + {playerCount - 1} Bots)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      sound.playWoodTap(1.0);
                      setPlayerCount(count);
                    }}
                    className={`py-2 rounded-xl font-mono text-sm font-bold border transition-all cursor-pointer ${
                      playerCount === count
                        ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md font-black scale-105'
                        : 'bg-stone-850 text-stone-300 border-stone-700 hover:border-amber-500/50 hover:bg-stone-800'
                    }`}
                  >
                    {count} {count === 3 ? '★' : ''}
                  </button>
                ))}
              </div>
              <span className="text-[11px] text-stone-400 block mt-1.5">
                ★ 3 jogadores é a regra clássica tradicional do botequim.
              </span>
            </div>
          )}

          {/* MODE: ONLINE CREATE ROOM */}
          {mode === 'online_create' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Capacidade da Sala (N Pessoas Reais)
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  Até {onlineMaxPlayers} pessoas (SEM BOTS)
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[2, 3, 4, 5, 6].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      sound.playWoodTap(1.0);
                      setOnlineMaxPlayers(count);
                    }}
                    className={`py-2 rounded-xl font-mono text-sm font-bold border transition-all cursor-pointer ${
                      onlineMaxPlayers === count
                        ? 'bg-amber-500 text-stone-950 border-amber-300 shadow-md font-black scale-105'
                        : 'bg-stone-850 text-stone-300 border-stone-700 hover:border-amber-500/50 hover:bg-stone-800'
                    }`}
                  >
                    {count}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 p-2.5 bg-amber-950/40 border border-amber-600/30 rounded-xl text-[11px] text-amber-200/80">
                🔒 <strong>Sem robôs:</strong> apenas os amigos que acessarem seu link ou código jogarão nesta sala!
              </div>
            </div>
          )}

          {/* MODE: ONLINE JOIN ROOM */}
          {mode === 'online_join' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Código da Sala (4 Caracteres)
              </label>
              <input
                type="text"
                maxLength={6}
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                placeholder="Ex: PALI"
                className="w-full px-4 py-2.5 bg-stone-950 border border-stone-700 focus:border-amber-400 rounded-xl text-amber-300 font-mono text-center text-lg font-black tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <span className="text-[11px] text-stone-400 block mt-1.5">
                Peça o código ou link da sala para quem criou a partida.
              </span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {mode === 'bot' && (
          <button
            type="button"
            data-start="true"
            onClick={handleStartBot}
            className="w-full max-w-md py-4 px-8 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xl rounded-2xl shadow-[0_8px_30px_rgba(245,158,11,0.4)] border-2 border-amber-200 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-3 tracking-wide"
          >
            <span>🤖</span>
            <span>Jogar contra Bots</span>
          </button>
        )}

        {mode === 'online_create' && (
          <button
            type="button"
            data-start="true"
            onClick={handleCreateOnline}
            className="w-full max-w-md py-4 px-8 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 hover:from-emerald-400 hover:to-emerald-300 text-stone-950 font-black text-xl rounded-2xl shadow-[0_8px_30px_rgba(16,185,129,0.4)] border-2 border-emerald-200 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-3 tracking-wide"
          >
            <span>🌐</span>
            <span>Criar Sala Online</span>
          </button>
        )}

        {mode === 'online_join' && (
          <button
            type="button"
            data-start="true"
            disabled={!joinRoomCode.trim()}
            onClick={handleJoinOnline}
            className={`w-full max-w-md py-4 px-8 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 tracking-wide shadow-xl ${
              joinRoomCode.trim()
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 text-stone-950 border-2 border-amber-200 cursor-pointer active:scale-95'
                : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
            }`}
          >
            <span>🚪</span>
            <span>Entrar na Sala Online</span>
          </button>
        )}
      </main>

      {/* Control Hint Line */}
      <footer className="relative z-10 w-full max-w-4xl text-center py-2 text-stone-400 text-xs font-medium tracking-wide">
        <span>Enter Iniciar · Barra de Espaço Ação · M Mutar Som · L Histórico da Mesa · Esc Pausar</span>
      </footer>
    </div>
  );
};
