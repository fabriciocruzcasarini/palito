/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ============================================================================
 * 🤖 CONFIGURAÇÃO CENTRALIZADA DAS IAs / BOTS (Jogo do Palito - Purrinha)
 * ============================================================================
 * 
 * ESTE É O ÚNICO LOCAL ONDE OS NOMES, AVATARES E PERSONALIDADES DAS IAs SÃO DEFINIDOS.
 * Ao alterar qualquer nome ou detalhe aqui, toda a aplicação (jogo solo, IA e ranking)
 * será atualizada automaticamente!
 */

export type BotPersonality = 'bluffer' | 'calculated' | 'greedy' | 'unpredictable';

export interface BotArchetype {
  name: string;
  avatar: string;
  personality: BotPersonality;
  personalityLabel: string;
}

export const BOT_ARCHETYPES: BotArchetype[] = [
  {
    name: 'Wilson Bradock',
    avatar: '🤠',
    personality: 'calculated',
    personalityLabel: 'Veterana dos botequins, raramente erra por mais de 1!',
  },
  {
    name: 'Zé da Purrinha',
    avatar: '🧐',
    personality: 'calculated',
    personalityLabel: 'Calculista frio da mesa de bar, joga na média probabilística.',
  },
  {
    name: 'Beto Gulosão',
    avatar: '🍺',
    personality: 'greedy',
    personalityLabel: 'Gosta de encher a mão de palito e puxar apostas altas.',
  },
  {
    name: 'Tonho Mandinga',
    avatar: '🎲',
    personality: 'unpredictable',
    personalityLabel: 'Imprevisível, nunca se sabe o que ele vai aprontar.',
  },
  {
    name: 'Dona Cida',
    avatar: '👵',
    personality: 'bluffer',
    personalityLabel: 'Blefador nato, adora esconder zero ou tudo!',
  },
];
