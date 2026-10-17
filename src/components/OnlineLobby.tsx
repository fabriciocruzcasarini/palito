import React, { useState } from 'react';
import { OnlineRoomState } from '../hooks/useMultiplayer';
import { sound } from '../utils/audio';

interface OnlineLobbyProps {
  roomState: OnlineRoomState;
  socketId: string | null;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export const OnlineLobby: React.FC<OnlineLobbyProps> = ({
  roomState,
  socketId,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);

  const me = roomState.players.find((p) => p.id === `player-${socketId}`);
  const isHost = me?.isHost || false;
  const canStart = roomState.players.length >= 2;

  const roomLink = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname.replace(/\/$/, '')}?room=${roomState.code}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(roomLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-between p-4 md:p-8 bg-stone-950 text-stone-100 select-none">
      {/* Background glow */}
      <div className="absolute inset-0 bg-radial-gradient from-amber-950/25 via-stone-950 to-stone-950 pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-3xl flex items-center justify-between">
        <button
          type="button"
          onClick={onLeaveRoom}
          className="px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-700 text-stone-300 hover:text-white hover:border-amber-400 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>←</span>
          <span>Sair da Sala</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            Servidor Online Conectado
          </span>
        </div>
      </header>

      {/* Main Lobby Box */}
      <main className="relative z-10 w-full max-w-xl my-auto bg-stone-900/90 border-2 border-amber-500/50 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-sm text-center">
        {/* Room Code Badge */}
        <div className="mb-4">
          <span className="text-xs uppercase font-bold text-amber-400/80 tracking-widest block mb-1">
            Código da Mesa
          </span>
          <div className="inline-flex items-center gap-3 bg-stone-950 px-5 py-2.5 rounded-2xl border border-amber-600/50 shadow-inner">
            <span className="font-mono text-3xl md:text-4xl font-black text-amber-300 tracking-widest">
              {roomState.code}
            </span>
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1"
            >
              <span>{copied ? '✓ Link Copiado!' : '🔗 Copiar Link'}</span>
            </button>
          </div>
        </div>

        {/* Notice: No bots! */}
        <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-xl mb-6">
          <span className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
            <span>👥</span>
            <span>Sala 100% Humana — Nenhum BOT participa desta mesa!</span>
          </span>
          <span className="text-[11px] text-amber-200/70 block mt-0.5">
            Capacidade para até {roomState.maxPlayers} pessoas reais. Mínimo de 2 para começar.
          </span>
        </div>

        {/* Connected Players List */}
        <div className="mb-6 text-left">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
              Pessoas Conectadas na Mesa
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {roomState.players.length} / {roomState.maxPlayers}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {roomState.players.map((p) => {
              const isThisMe = p.id === `player-${socketId}`;
              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    isThisMe
                      ? 'bg-amber-500/15 border-amber-400 shadow-md ring-2 ring-amber-400/20'
                      : 'bg-stone-950/80 border-stone-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1 bg-stone-900 rounded-xl border border-stone-800">
                      {p.avatar}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-stone-100">
                          {p.name}
                        </span>
                        {isThisMe && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40 font-bold">
                            Você
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400">
                        {p.isHost ? '👑 Anfitrião' : 'Convidado'}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-emerald-400 font-bold">Pronto</span>
                </div>
              );
            })}

            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, roomState.maxPlayers - roomState.players.length) }).map((_, idx) => (
              <div
                key={`empty-${idx}`}
                className="flex items-center gap-2.5 p-3 rounded-2xl border border-dashed border-stone-800 bg-stone-950/30 text-stone-600"
              >
                <span className="text-xl opacity-40">👤</span>
                <span className="text-xs italic">Aguardando jogador...</span>
              </div>
            ))}
          </div>
        </div>

        {/* Start Game Action */}
        {isHost ? (
          <div className="space-y-2">
            <button
              type="button"
              disabled={!canStart}
              onClick={() => {
                sound.playWoodTap(1.3);
                onStartGame();
              }}
              className={`w-full py-4 px-6 rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-2 shadow-xl ${
                canStart
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 border border-amber-200 cursor-pointer active:scale-95'
                  : 'bg-stone-800 text-stone-500 border border-stone-700 cursor-not-allowed opacity-60'
              }`}
            >
              <span>🎲</span>
              <span>Começar Partida Online</span>
            </button>
            {!canStart && (
              <span className="text-xs text-amber-300/80 block">
                Envie o link para ao menos 1 amigo para poder iniciar a partida.
              </span>
            )}
          </div>
        ) : (
          <div className="p-3 bg-stone-950/70 border border-stone-800 rounded-xl text-stone-400 text-xs flex items-center justify-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>Aguardando o anfitrião iniciar a partida...</span>
          </div>
        )}
      </main>

      <footer className="relative z-10 w-full max-w-3xl text-center text-xs text-stone-500">
        Jogo do Palito Multijogador Online em Tempo Real via WebSockets
      </footer>
    </div>
  );
};
