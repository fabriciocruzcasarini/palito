import React, { useState } from 'react';
import { RoundResult } from '../game/rules';

interface LogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: RoundResult[];
}

export const LogDrawer: React.FC<LogDrawerProps> = ({ isOpen, onClose, history }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const fullLog = history.map((h) => h.logText).join('\n\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLog).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-stone-950 border-2 border-amber-600/60 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-stone-900 border-b border-stone-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">📜</span>
            <div>
              <h3 className="text-base font-black text-amber-200">
                Histórico da Mesa (Terminal do Jogo)
              </h3>
              <p className="text-xs text-stone-400">
                Registro fiel e estruturado de todas as rodadas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold rounded-lg cursor-pointer transition-all"
            >
              {copied ? '✓ Copiado!' : 'Copiar Texto'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content Terminal */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 font-mono text-xs md:text-sm text-emerald-400 bg-stone-950/95 leading-relaxed whitespace-pre-wrap select-text">
          {history.length === 0 ? (
            <div className="text-stone-500 italic text-center py-10">
              Nenhuma rodada finalizada ainda. Jogue uma rodada para gerar os relatórios!
            </div>
          ) : (
            fullLog
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-stone-900/90 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
          <span>Total de rodadas registradas: {history.length}</span>
          <span>Pressione ESC ou clique no ✕ para fechar</span>
        </div>
      </div>
    </div>
  );
};
