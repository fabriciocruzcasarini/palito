import React, { useState, useEffect } from 'react';
import { Player, calculateValidBetRange, validateBet, validateHand } from '../game/rules';
import { Matchstick } from './Matchstick';
import { sound } from '../utils/audio';

interface ActionDockProps {
  humanPlayer: Player;
  players: Player[];
  humanIndex: number;
  gamePhase: 'hand_selection' | 'betting' | 'reveal' | 'round_result';
  currentTurnPlayerIndex: number | null;
  onConfirmHand: (count: number) => void;
  onConfirmBet: (bet: number) => void;
  onNextRound: () => void;
  isOnlineMode?: boolean;
}

export const ActionDock: React.FC<ActionDockProps> = ({
  humanPlayer,
  players,
  humanIndex,
  gamePhase,
  currentTurnPlayerIndex,
  onConfirmHand,
  onConfirmBet,
  onNextRound,
  isOnlineMode = false,
}) => {
  const [selectedHand, setSelectedHand] = useState<number>(0);
  const [selectedBet, setSelectedBet] = useState<number | null>(null);
  const [manualBetInput, setManualBetInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAdvancingRound, setIsAdvancingRound] = useState<boolean>(false);

  // Reset local state when phase changes
  useEffect(() => {
    if (gamePhase === 'hand_selection') {
      setSelectedHand(Math.min(1, humanPlayer.reserves));
      setSelectedBet(null);
      setManualBetInput('');
      setErrorMessage(null);
      setIsAdvancingRound(false);
    } else if (gamePhase !== 'reveal' && gamePhase !== 'round_result') {
      setIsAdvancingRound(false);
    }
  }, [gamePhase, humanPlayer.reserves]);

  const isHumanTurn =
    gamePhase === 'betting' && currentTurnPlayerIndex === humanIndex;

  // Compute bet range when it's human's turn (safeguard against humanIndex < 0 or out of bounds)
  const betRange =
    (isHumanTurn || gamePhase === 'betting') && humanIndex >= 0 && humanIndex < players.length
      ? calculateValidBetRange(humanIndex, players)
      : null;

  const handleSelectHandCount = (count: number) => {
    sound.playWoodTap(0.9 + count * 0.1);
    setSelectedHand(count);
    setErrorMessage(null);
  };

  const handleSubmitHand = () => {
    const error = validateHand(selectedHand, humanPlayer.reserves);
    if (error) {
      setErrorMessage(error);
      return;
    }
    sound.playWoodTap(1.4);
    onConfirmHand(selectedHand);
  };

  const handleSelectBetOption = (bet: number) => {
    const error = validateBet(bet, humanIndex, players);
    if (error) {
      setErrorMessage(error);
      return;
    }
    sound.playBet(bet);
    setSelectedBet(bet);
    setManualBetInput(String(bet));
    setErrorMessage(null);
  };

  const handleSubmitBet = () => {
    const betNum = selectedBet !== null ? selectedBet : parseInt(manualBetInput, 10);
    if (isNaN(betNum)) {
      setErrorMessage('Por favor, digite ou selecione um número de palpite.');
      return;
    }

    const error = validateBet(betNum, humanIndex, players);
    if (error) {
      setErrorMessage(error);
      return;
    }

    sound.playBet(betNum);
    onConfirmBet(betNum);
  };

  const hasAlreadySubmittedHandOnline = isOnlineMode && humanPlayer.currentHand !== null && gamePhase === 'hand_selection';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-3 bg-stone-900/95 border-t-2 border-amber-600/50 rounded-2xl md:rounded-3xl shadow-2xl backdrop-blur-md">
      {/* Error notification banner */}
      {errorMessage && (
        <div className="mb-3 p-2 bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs md:text-sm font-semibold rounded-xl flex items-center justify-between gap-2 animate-in fade-in">
          <span>⚠️ {errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white font-bold px-2 py-0.5 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* PHASE 1: Escolha Secreta de Palitos */}
      {gamePhase === 'hand_selection' && (
        hasAlreadySubmittedHandOnline ? (
          <div className="flex flex-col items-center justify-center py-4 gap-2 text-center">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm md:text-base">
              <span>✓ Mão secreta confirmada ({humanPlayer.currentHand} {humanPlayer.currentHand === 1 ? 'palito' : 'palitos'})!</span>
            </div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              <span>Aguardando os outros jogadores fecharem as mãos...</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="text-center">
              <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                --- SUA VEZ ---
              </span>
              <h4 className="text-base md:text-lg font-black text-amber-100">
                Quantos palitos você deseja colocar na mão? (0 a {humanPlayer.reserves})
              </h4>
              <p className="text-xs text-stone-400">
                Os adversários não saberão sua escolha até a fase de revelação!
              </p>
            </div>

            {/* Stick Selector Buttons */}
            <div className="flex items-center justify-center gap-2 md:gap-3 flex-wrap">
              {Array.from({ length: humanPlayer.reserves + 1 }).map((_, count) => {
                const isSelected = selectedHand === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleSelectHandCount(count)}
                    className={`flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 border-amber-300 ring-4 ring-amber-400/40 font-black scale-105 shadow-lg'
                        : 'bg-stone-800 text-stone-200 border-stone-700 hover:border-amber-500/60 hover:bg-stone-750'
                    }`}
                  >
                    <span className="text-lg md:text-xl font-mono">{count}</span>
                    <div className="flex items-center gap-0.5 h-6 mt-1">
                      {count === 0 ? (
                        <span className="text-[10px] uppercase font-semibold text-stone-400">
                          Vazia
                        </span>
                      ) : (
                        Array.from({ length: count }).map((_, i) => (
                          <Matchstick key={i} size="sm" rotation={(i - (count - 1) / 2) * 10} />
                        ))
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Confirm Button */}
            <button
              type="button"
              data-testid="confirm-hand-btn"
              onClick={handleSubmitHand}
              className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black text-base rounded-xl shadow-lg border border-amber-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2"
            >
              <span>✊ Fechar a Mão ({selectedHand} {selectedHand === 1 ? 'palito' : 'palitos'})</span>
            </button>
          </div>
        )
      )}

      {/* PHASE 2: Coleta de Palpites (Apostas) */}
      {gamePhase === 'betting' && (
        <div className="flex flex-col items-center gap-3">
          {isHumanTurn ? (
            <>
              <div className="text-center">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  --- SEU PALPITE ---
                </span>
                <h4 className="text-base md:text-lg font-black text-amber-100">
                  Qual é a soma total de palitos na mesa?
                </h4>
                {betRange && (
                  <p className="text-xs text-amber-300/80">
                    Com base nos seus {humanPlayer.currentHand} palitos na mão, o total deve estar entre{' '}
                    <strong className="text-amber-200 font-mono">{betRange.min}</strong> e{' '}
                    <strong className="text-amber-200 font-mono">{betRange.max}</strong>.
                  </p>
                )}
              </div>

              {/* Number Chips Picker */}
              {betRange && (
                <div className="flex items-center justify-center gap-1.5 md:gap-2 flex-wrap max-w-xl">
                  {Array.from({ length: betRange.max - betRange.min + 1 }).map((_, idx) => {
                    const val = betRange.min + idx;
                    const taken = betRange.takenBets.find((t) => t.bet === val);
                    const isSelected = selectedBet === val;

                    if (taken) {
                      return (
                        <div
                          key={val}
                          title={`Já palpitado por ${taken.playerName}`}
                          className="flex flex-col items-center justify-center w-11 h-12 rounded-xl bg-stone-950/50 border border-stone-800 text-stone-600 cursor-not-allowed opacity-60"
                        >
                          <span className="text-sm font-mono line-through">{val}</span>
                          <span className="text-[9px] font-bold truncate max-w-[36px]">
                            {taken.playerName.split(' ')[0]}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleSelectBetOption(val)}
                        className={`flex flex-col items-center justify-center w-11 h-12 rounded-xl border font-mono text-base font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-400 text-stone-950 border-amber-200 ring-4 ring-amber-400/40 scale-105 shadow-md'
                            : 'bg-stone-800 text-amber-200 border-amber-600/40 hover:bg-amber-900/40 hover:border-amber-400'
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Manual input / Confirm */}
              <div className="flex items-center gap-2 w-full max-w-xs">
                <input
                  type="number"
                  placeholder="Palpite"
                  value={manualBetInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setManualBetInput(val);
                    const n = parseInt(val, 10);
                    setSelectedBet(!isNaN(n) ? n : null);
                  }}
                  className="w-32 px-3 py-2 bg-stone-950 border border-amber-600/60 rounded-xl text-center text-amber-200 font-mono text-lg font-bold focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  data-testid="confirm-bet-btn"
                  onClick={handleSubmitBet}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-black rounded-xl shadow-md border border-amber-300 transition-all cursor-pointer active:scale-95"
                >
                  Confirmar Palpite
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-2 flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>
                  Vez de {currentTurnPlayerIndex !== null ? players[currentTurnPlayerIndex]?.name : 'Adversário'} palpitar...
                </span>
              </div>
              <p className="text-xs text-stone-400">
                Os jogadores apostam em sentido horário a cada rodada.
              </p>
            </div>
          )}
        </div>
      )}

      {/* PHASE 3 & 4: Revelação e Próxima Rodada */}
      {(gamePhase === 'reveal' || gamePhase === 'round_result') && (
        <div className="flex flex-col items-center justify-center gap-3">
          <button
            type="button"
            data-testid="next-round-btn"
            disabled={isAdvancingRound}
            onClick={() => {
              if (isAdvancingRound) return;
              setIsAdvancingRound(true);
              sound.playWoodTap(1.1);
              onNextRound();
            }}
            className={`px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-stone-950 font-black text-base md:text-lg rounded-2xl shadow-xl border border-emerald-300 transition-all cursor-pointer active:scale-95 flex items-center gap-2 ${
              isAdvancingRound ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
            }`}
          >
            <span>🎲 Iniciar Próxima Rodada</span>
          </button>
          <span className="text-xs text-stone-400">
            Pressione <kbd className="px-1.5 py-0.5 bg-stone-800 rounded border border-stone-700 text-amber-300">Espaço</kbd> ou clique para continuar
          </span>
        </div>
      )}
    </div>
  );
};
