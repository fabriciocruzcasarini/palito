# Auditoria de QA & Segurança - Jogo do Palito (Purrinha & Blefe)

Auditoria minuciosa de Qualidade e Segurança (QA/QU) com mapeamento de vulnerabilidades por criticidade (Crítica, Alta, Média, Baixa) e plano de correções cirúrgicas e não disruptivas para o servidor WebSocket e clientes.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> As correções propostas são estritamente **não disruptivas** para as regras do jogo, interface visual ou jogabilidade existente. O foco é blindar a infraestrutura e a integridade das partidas contra ataques, falhas de sincronização e travamentos.

- **Foco Confirmado**: Resolução integral de todas as falhas críticas e vulnerabilidades de segurança.
- **Proteção de Rede Confirmada**: Implementação de Rate Limiting por IP/Socket e limite rígido de payload no WebSocket Server (`maxPayload: 64KB`).
- **Preservação de UI/UX**: Nenhuma alteração nas mecânicas de apostas ou na apresentação visual do jogo; as correções operam na camada de validação e resiliência.

---

## 1. Mapeamento de Falhas e Vulnerabilidades por Criticidade

### 🔴 CRÍTICA (Severidade Alta / Risco de Queda de Serviço)

1. **Vulnerabilidade de Negação de Serviço por Exaustão de Memória (DoS / OOM via Payload)**
   - **Localização**: `server.ts` na instanciação do `WebSocketServer({ server })`.
   - **Problema**: O servidor não define `maxPayload`. Um agente malicioso pode transmitir pacotes JSON de dezenas de megabytes, forçando o Node.js a estourar o limite de heap (`JavaScript heap out of memory`) e derrubar a aplicação para todos os jogadores.
   - **Solução**: Configurar `maxPayload: 64 * 1024` (64 KB) na criação do `WebSocketServer` e rejeitar conexões que excedam esse limite.

2. **Ausência de Rate Limiting no WebSocket (Flood Attack)**
   - **Localização**: `server.ts` no evento `ws.on('message')`.
   - **Problema**: Não há controle de taxa de mensagens por segundo. Um cliente ou bot pode disparar 1.000 requisições por segundo, bloqueando a fila de eventos do Node.js (*Event Loop starvation*).
   - **Solução**: Implementar um limitador de janela deslizante em memória (máximo de 20 mensagens por segundo por conexão socket). Ao exceder a cota, descartar as mensagens excedentes e enviar aviso com cooldown.

---

### 🟠 ALTA (Integridade do Jogo & Condição de Corrida)

3. **Condição de Corrida (Race Condition) no Gatilho `next_round`**
   - **Localização**: `server.ts` (`type === 'next_round'`) e `ActionDock.tsx`.
   - **Problema**: Qualquer cliente pode emitir o sinal `next_round`, e cliques repetidos rápidos (ou múltiplos jogadores clicando simultaneamente) incrementam `roundNumber` e alternam `starterIndex` várias vezes por segundo, pulando rodadas e desincronizando os jogadores.
   - **Solução**: Implementar uma trava atômica de transição de fase: a sala só aceita a transição se `room.gamePhase === 'round_result'`, transacionando imediatamente para `hand_selection` e ignorando chamadas duplicadas no mesmo ciclo de vida. Adicionar debounce visual no botão do cliente.

4. **Vazamento de Memória por Salas Abandonadas (Memory Leak / Room Bombing)**
   - **Localização**: `server.ts` (`rooms` Map).
   - **Problema**: Se salas forem criadas e os jogadores perderem a conexão abruptamente antes de entrar na lista de descarte, ou se houver clientes gerando salas sem jogadores, as estruturas permanecem vivas no Map `rooms` indefinidamente.
   - **Solução**: Implementar rotina de limpeza periódica (TTL de inatividade de 30 minutos) e expurgar salas com 0 jogadores ativos imediatamente.

---

### 🟡 MÉDIA (Validação de Dados & Robustez do Cliente)

5. **Injeção de Caracteres Especiais e Caracteres Invisíveis nos Nomes de Jogadores**
   - **Localização**: `server.ts` (`create_room` e `join_room`).
   - **Problema**: O nome do jogador apenas sofre corte de 15 caracteres (`substring(0, 15)`), permitindo caracteres Unicode zero-width, sequências ANSI ou quebras de linha (`\n`), que desformatam os logs da mesa e a exibição de rankings.
   - **Solução**: Sanitização com regex estrita: remover caracteres de controle e aceitar apenas letras, números, espaços e acentos usuais (`/^[a-zA-Z0-9À-ÿ _-]+$/`).

6. **Validação Estrita de Códigos de Sala (`roomCode`)**
   - **Localização**: `server.ts` em todos os manipuladores de mensagem.
   - **Problema**: Se um payload for enviado com `roomCode` malformado (tipo diferente de string ou mais de 4 caracteres), operações de busca no Map podem gerar comportamento inesperado.
   - **Solução**: Validador utilitário `isValidRoomCode(code): boolean` garantindo string de exatamente 4 caracteres alfanuméricos em maiúsculas (`/^[A-Z0-9]{4}$/`).

7. **Sincronização de Estado no Cliente após Reconexão (`useMultiplayer.ts`)**
   - **Localização**: `src/hooks/useMultiplayer.ts`.
   - **Problema**: Quando a conexão cai e o `auto-reconnect` reconecta, o socket recebe um novo `socketId`, mas o jogador ainda exibe o estado da partida anterior até receber novo pacote. Se a sala tiver sido excluída enquanto ele estava offline, ele fica em um estado travado na UI.
   - **Solução**: Ao restabelecer conexão física após queda, emitir verificação de status ou resetar para a tela do lobby caso a sala não exista mais.

---

### 🟢 BAIXA (Polimento de Código & Tratamento Defensivo)

8. **Proteção defensiva no Parser de Mensagens WebSocket**
   - **Localização**: `server.ts` e `useMultiplayer.ts`.
   - **Problema**: Payloads sem objeto `payload` (`data.payload === undefined`) causam leitura de propriedades em undefined.
   - **Solução**: Normalização de payload seguro: `const payload = (data && typeof data.payload === 'object' && data.payload !== null) ? data.payload : {};`.

---

## 2. Arquitetura das Soluções Propostas

```
┌─────────────────────────────────────────────────────────────┐
│                       Cliente Web                           │
│  - Limpeza de estado stale em reconexões                     │
│  - Prevenção de múltiplos cliques em 'Próxima Rodada'       │
└──────────────────────────────▲──────────────────────────────┘
                               │ WebSocket Seguro (WSS)
                               │ (Rate Limit: 20 msg/s | Payload <= 64KB)
┌──────────────────────────────▼──────────────────────────────┐
│                    Servidor WebSocket Node                  │
│                                                             │
│  [Guard de Segurança]                                       │
│  ├── Validação de Payload Size (maxPayload: 64KB)           │
│  ├── Sliding Window Rate Limiter por Socket                 │
│  └── Sanitizador de Nomes & Códigos Regex                   │
│                                                             │
│  [Motor de Salas & Partidas]                                │
│  ├── Transições Atômicas de Fase (Idempotência next_round)   │
│  ├── Validação Estrita de Vez e Apostas Legais              │
│  └── Garbage Collector com TTL para Salas Abandonadas       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Plano de Implementação e Verificação

### Fase 1: Blindagem do Servidor WebSocket (`server.ts`)
1. Adicionar `maxPayload: 65536` no construtor do `WebSocketServer`.
2. Implementar middleware de rate limit (20 req/s por conexão com advertência antes de bloqueio temporário).
3. Adicionar funções auxiliares de sanitização:
   - `sanitizePlayerName(name: string): string`
   - `sanitizeRoomCode(code: string): string | null`
4. Proteger o handler `next_round` com verificação de transição atômica (só permite 1 execução por rodada finalizada).
5. Adicionar mecanismo de descarte de salas inativas (intervalo a cada 10 minutos para salas sem jogadores ou há mais de 1 hora sem atividade).

### Fase 2: Resiliência do Cliente (`useMultiplayer.ts` & `ActionDock.tsx`)
1. Implementar flag de `isAdvancingRound` no botão de próxima rodada para evitar múltiplos envios por impaciência do usuário.
2. Adicionar limpeza segura do estado da sala se o socket reconectar e receber notificação de sala inexistente.

### Fase 3: Validação de Qualidade (QA Testing)
1. Executar os testes unitários das regras do jogo (`node --test src/game/rules.test.ts`).
2. Executar `lint_applet` e `compile_applet` para assegurar integridade de build.
3. Simular e validar integridade do fluxo sem impactar visual ou regras existentes.
