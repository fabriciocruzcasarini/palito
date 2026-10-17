import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col bg-stone-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-stone-850 border-b border-stone-800">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📖</span>
            <h3 className="text-lg font-black text-amber-200">
              Regras do Jogo do Palito (Purrinha)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Rules Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-stone-300 text-sm leading-relaxed">
          <div className="p-3 bg-amber-950/40 border border-amber-600/30 rounded-xl">
            <h4 className="text-amber-300 font-black text-sm uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <span>🎯</span>
              <span>Objetivo Principal</span>
            </h4>
            <p>
              O objetivo no Palito é o oposto da maioria dos jogos: <strong>vence quem zerar seus palitos primeiro!</strong> Todos começam com 3 palitos na reserva. Quem acertar a soma da rodada descarta 1 palito.
            </p>
          </div>

          <div>
            <h4 className="text-amber-400 font-bold text-sm mb-1">1. Escolha Secreta da Mão</h4>
            <p className="text-stone-400">
              Na primeira fase de cada rodada, cada jogador esconde em sua mão fechada entre <strong>0 e N palitos</strong> (onde N é a quantidade que ele ainda tem na reserva). Você pode blefar colocando a mão completamente vazia ou com todos os seus palitos!
            </p>
          </div>

          <div>
            <h4 className="text-amber-400 font-bold text-sm mb-1">2. Rodada de Palpites (Apostas)</h4>
            <p className="text-stone-400">
              Seguindo a ordem do turno (que gira no sentido horário a cada rodada), cada um dá o seu palpite sobre a soma total de palitos na mesa.
            </p>
            <ul className="list-disc list-inside mt-1.5 text-xs text-stone-400 space-y-1">
              <li><strong>Sem repetição:</strong> Não é permitido repetir um palpite já feito por outro jogador na mesma rodada.</li>
              <li><strong>Limites matemáticos:</strong> Seu palpite mínimo é o que você colocou na mão + 0. Seu palpite máximo é o que você tem na mão + a soma de todos os palitos restantes dos adversários.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-amber-400 font-bold text-sm mb-1">3. Revelação e Descarte</h4>
            <p className="text-stone-400">
              Todos abrem as mãos simultaneamente e a soma real é calculada:
            </p>
            <p className="mt-1 font-mono text-xs text-amber-200 bg-stone-950 p-2 rounded-lg border border-stone-800">
              Soma Real = Palitos de Jogador 1 + Jogador 2 + ... + Jogador N
            </p>
            <ul className="list-disc list-inside mt-1.5 text-xs text-stone-400 space-y-1">
              <li>Se alguém acertou na mosca: este jogador <strong>descarta 1 palito</strong> da sua reserva!</li>
              <li>Se ninguém acertou: ninguém descarta nada e o jogo segue para a próxima rodada.</li>
            </ul>
          </div>

          <div>
            <h4 className="text-amber-400 font-bold text-sm mb-1">4. Vitória</h4>
            <p className="text-stone-400">
              O primeiro jogador a descartar seu último palito (chegar a zero) é declarado o grande <strong>Campeão da Mesa</strong>!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-850 border-t border-stone-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black rounded-xl cursor-pointer"
          >
            Entendido, vamos ao jogo!
          </button>
        </div>
      </div>
    </div>
  );
};
