# 🪵 Jogo do Palito (Purrinha Tradicional) 🍺

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--Time-010101?logo=socket.io&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![License](https://img.shields.io/badge/License-Apache--2.0-blue.svg)](LICENSE)

> Uma recriação digital autêntica, moderna e imersiva do clássico **Jogo do Palito** (também conhecido nacionalmente como **Purrinha**), tradicional passatempo de botecos e mesas brasileiras. Jogue sozinho contra bots inteligentes ou crie salas online com amigos em tempo real!

---

## 📸 Visão Geral

O jogo combina estratégia, cálculo de probabilidades, blefe e psicologia de mesa. Cada participante esconde em sua mão fechada de **0 a 3 palitos** (ou até o limite de palitos que ainda possui na reserva). Em seguida, cada jogador dá um palpite sequencial sobre qual será a soma total de palitos revelados na mesa. Quem acertar a soma exata descarta um palito. **O primeiro a zerar todos os palitos é o grande campeão!**

---

## ✨ Funcionalidades Principais

### 1. 🤖 Modo Treino / Solo (contra Bots Inteligentes)
- Enfrente até 5 adversários controlados por inteligência artificial com personalidades e estilos únicos:
  - **Seu Zé** 🍺: Experiente de boteco, aposta na média e observa as mãos dos adversários.
  - **Dona Cida** 👵: Prudente e observadora, nunca arrisca palpites improváveis.
  - **Tião** 🤠: Blefador nato, costuma colocar 0 na mão e chutar alto para confundir a mesa.
  - **Tonho** 🧐: Calculista metódico, aposta estritamente nas probabilidades matemáticas.
- Cálculo dinâmico em tempo real do intervalo válido de apostas (mínimo e máximo possíveis considerando os palitos em jogo).

### 2. 🌐 Modo Multiplayer Online em Tempo Real
- **Salas Privadas**: Crie salas de jogo com códigos fáceis de 4 letras/dígitos para convidar amigos.
- **Entrada Rápida via Link ou Código**: Compartilhe a URL ou apenas o código da sala.
- **WebSocket Nativo**: Comunicação bidirecional de baixa latência, sem atrasos nas revelações e apostas.
- **Proteção de Segredo**: As mãos escolhidas pelos adversários permanecem 100% ocultas no backend até a fase de revelação oficial, impedindo inspeções no console ou trapaças no tráfego de rede.

### 3. 🏆 Novo Sistema de Ranking e Estatísticas de Carreira
- Apresentado automaticamente na tela de **Fim de Jogo** ao concluir cada partida!
- Acessível também a qualquer momento através do botão **"🏆 Ranking"** no cabeçalho ou tela inicial.
- Métricas detalhadas por jogador:
  - **Nome e Avatar** do jogador.
  - **Quantidade de Jogos** (partidas disputadas).
  - **Quantidade de Vitórias** (partidas vencidas).
  - **% de Aproveitamento** (taxa de vitórias com barra visual e cores indicativas).
- Persistência automática em `localStorage` para manter o histórico acumulado ao longo das partidas.
- Opção para zerar ou resetar as estatísticas quando desejar.

### 4. 🎵 Efeitos Sonoros Procedurais (Web Audio API)
- Sintetizados diretamente no navegador, sem necessidade de arquivos MP3 externos pesados:
  - Estalo e impacto seco de madeira ao bater a mão fechada na mesa.
  - Chocalhar e estalo de palitos ao revelar a soma.
  - Fanfarra triunfal do campeão ao zerar os palitos.
  - Sons de tensão, erros de rodada e descarte de palito.
  - Controle de áudio com botão mudo e atalho de teclado `M`.

### 5. 🎨 Interface Temática e Responsiva de Boteco
- Ambientação visual acolhedora com mesa redonda em tom amadeirado e feltro escuro.
- Visualização física e tátil dos palitos de fósforo com pontas vermelhas sulfuradas e textura de madeira.
- **Dock de Ações Rápido**: Botões intuitivos para seleção da mão (0, 1, 2, 3 palitos) e grade de palpites com desativação automática de números já escolhidos.
- **Gaveta de Histórico (Log Drawer)**: Acompanhe cada rodada anterior, quem apostou o quê e quem levou o ponto.

### 6. ⌨️ Atalhos de Teclado
- <kbd>Espaço</kbd> ou <kbd>Enter</kbd>: Iniciar partida / Avançar para a próxima rodada.
- <kbd>M</kbd>: Mutar / Desmutar áudio do jogo.
- <kbd>L</kbd>: Abrir / Fechar gaveta de histórico de rodadas.
- <kbd>Esc</kbd>: Pausar partida ou fechar modais.

### 7. 🛡️ Segurança e Robustez no Servidor
- **Rate Limiting**: Janela deslizante de requisições por socket WebSocket para proteção contra flooding.
- **Limite de Payload (64KB)**: Prevenção contra estouro de memória (OOM) e Denial of Service (DoS).
- **Sanitização Estrita**: Proteção de inputs de nomes de jogadores e códigos de sala contra injeções.
- **Atomicidade de Rodadas**: Bloqueio de cliques múltiplos e race conditions no avanço de fases do jogo.

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Build Tool**: [Vite](https://vite.dev/)
- **Backend / WebSocket**: [Node.js](https://nodejs.org/), [Express](https://expressjs.com/), [ws](https://github.com/websockets/ws)
- **Áudio**: Web Audio API (Síntese Procedural)
- **Testes**: Node.js Test Runner nativo (`node:test`, `node:assert/strict`)

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- **Node.js** v20 ou superior instalado
- **npm** (incluso com o Node.js)

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/jogo-do-palito.git
   cd jogo-do-palito
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento (Front + WebSocket):**
   ```bash
   npm run dev
   ```
   O servidor iniciará em `http://localhost:3000`.

4. **Para executar os testes unitários de regras e ranking:**
   ```bash
   node --test src/game/rules.test.ts src/utils/ranking.test.ts
   ```

5. **Para compilar o build de produção:**
   ```bash
   npm run build
   ```

6. **Para iniciar em produção:**
   ```bash
   npm start
   ```

---

## 🌐 Configuração de Servidor Web (Apache Reverse Proxy)

Caso queira hospedar o jogo em um servidor Linux com **Apache**, como sob o subcaminho `/palito` com suporte a WebSocket, utilize o modelo de configuração abaixo:

```apache
# Habilite os módulos necessários do Apache:
# sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers

<VirtualHost *:443>
    ServerName seu-dominio.com.br
    ServerAdmin seu-email@exemplo.com

    # Mapeamento do subdiretório do Jogo do Palito
    Alias /palito /var/www/html/palito/dist

    <Directory /var/www/html/palito/dist>
        Options -Indexes +FollowSymLinks
        DirectoryIndex index.html
        AllowOverride All
        Require all granted

        # Fallback SPA para roteamento do React
        RewriteEngine On
        RewriteBase /palito/
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /palito/index.html [L]
    </Directory>

    # Proxy para WebSocket do servidor do Palito (porta 3000)
    RewriteEngine On
    RewriteCond %{HTTP:Upgrade} =websocket [NC]
    RewriteRule /palito/ws(.*) ws://127.0.0.1:3000/$1 [P,L]

    # Proxy reverso para APIs e servidor Node.js
    ProxyPass /palito/api http://127.0.0.1:3000/api
    ProxyPassReverse /palito/api http://127.0.0.1:3000/api
</VirtualHost>
```

---

## 📖 Regras Tradicionais da Purrinha

1. **Início do Jogo**: Cada jogador recebe **3 palitos**.
2. **Fase 1 - Mão Secreta**: Cada jogador escolhe em segredo quantos palitos colocará na mão fechada (de 0 até a quantidade que possui).
3. **Fase 2 - Rodada de Apostas**:
   - O jogador que abre a rodada dá seu palpite sobre a soma total de palitos na mesa.
   - Os palpites seguem no sentido horário.
   - **Regra de Ouro**: Nenhum jogador pode repetir um palpite que já foi feito na mesma rodada!
   - O palpite mínimo possível é a quantidade de palitos na sua própria mão. O palpite máximo é a sua mão somada ao máximo que todos os outros jogadores poderiam ter.
4. **Fase 3 - Revelação**: Todos os jogadores abrem as mãos simultaneamente e a soma total é calculada.
5. **Resultado**:
   - Se algum jogador acertou a soma exata, ele descarta um palito para fora da mesa!
   - Se ninguém acertou, ninguém descarta palitos.
6. **Rotação da Vez**: Na rodada seguinte, quem começa apostando é o próximo jogador da ordem.
7. **Vitória**: O primeiro jogador a descartar todos os seus 3 palitos (ficando com 0) vence o jogo!

---

## 📁 Estrutura de Arquivos

```
├── .aistudio/                  # Configurações e artefatos de IA
├── src/
│   ├── components/             # Componentes React de interface
│   │   ├── ActionDock.tsx      # Dock inferior de ações (mão, apostas, avançar)
│   │   ├── HandDisplay.tsx     # Exibição visual da mão fechada/aberta
│   │   ├── LogDrawer.tsx       # Histórico de rodadas e palpites
│   │   ├── Matchstick.tsx      # Renderização realista dos palitos de fósforo
│   │   ├── OnlineLobby.tsx     # Sala de espera multiplayer
│   │   ├── RankingModal.tsx    # Modal de consulta ao ranking geral
│   │   ├── RankingTable.tsx    # Tabela com nome, jogos, vitórias e %
│   │   ├── RulesModal.tsx      # Manual ilustrado de regras
│   │   ├── TableBoard.tsx      # Mesa principal do boteco com os jogadores
│   │   ├── TitleScreen.tsx     # Tela inicial com seleção de modos e ranking
│   │   └── VictoryModal.tsx    # Tela de fim de jogo com campeão e ranking
│   ├── game/                   # Regras de negócio desacopladas
│   │   ├── rules.ts            # Lógica pura da purrinha, bots e validações
│   │   └── rules.test.ts       # Testes unitários das regras
│   ├── hooks/                  # Hooks personalizados
│   │   └── useMultiplayer.ts   # Conexão WebSocket e sincronização online
│   ├── utils/                  # Utilitários
│   │   ├── audio.ts            # Efeitos sonoros procedurais (Web Audio API)
│   │   ├── ranking.ts          # Gerenciamento de ranking e estatísticas
│   │   └── ranking.test.ts     # Testes unitários do ranking
│   ├── App.tsx                 # Componente principal do jogo
│   ├── main.tsx                # Entrada React
│   └── index.css               # Estilos globais e Tailwind
├── server.ts                   # Servidor Node.js + Express + WebSocket ws
├── package.json
└── README.md
```

---

## 📄 Licença

Distribuído sob a licença **Apache-2.0**. Consulte o arquivo [LICENSE](LICENSE) para obter mais informações.

Desenvolvido com carinho para preservar uma das brincadeiras mais queridas do folclore urbano dos botecos brasileiros! 🍻
