# POV — Modo Online "Sala Jogável" (MVP) — Design Spec

- **Data:** 2026-06-17
- **Status:** rascunho para revisão · subprojeto 1 do modo online (de uma plataforma maior)
- **Escopo:** a PRIMEIRA fatia jogável do online — perfil leve + sala por código + presença + **uma rodada cooperativa sincronizada**. Chat, criador de cartões, configs avançadas, convites/"e-mail" e contas reais = fases futuras.

---

## 1. Visão & escopo

Hoje o POV é um SPA Svelte/Vite 100% local (sem backend). Este subprojeto adiciona o **modo online**: vários aparelhos jogam a mesma rodada em tempo real, mantendo a identidade visual/tátil/sonora já construída.

**MVP = "Sala jogável":** escolher modo (Local/Online) → criar perfil (nome + avatar + foto opcional) → criar/entrar em sala por código → lobby com presença ao vivo → jogar rodadas cooperativas sincronizadas → fim de jogo. O modo **local continua intacto** (offline, sem depender do Convex).

**Fases futuras (fora deste MVP):** chat na sala, convites (link e/ou e-mail), criador de cartões personalizados, configs de modo de jogo, contas reais/perfis persistentes entre dispositivos, ranking/histórico.

## 2. Decisões travadas (brainstorming)

| Decisão | Escolha |
|---|---|
| Stack backend/realtime | **Convex** (DB reativo + funções + storage + presença) + **Vercel** (hospeda o SPA) |
| Identidade | **Leve, sem login** — `playerId` (UUID no localStorage); perfil no dispositivo; sem Convex Auth no MVP |
| Modelo da rodada | **Dica digitada** (in-app) · **palpites individuais** (cada um seu marcador) · **placar cooperativo** (soma do grupo) |
| Cliente Svelte | **`convex-svelte`** (`setupConvex` + `useQuery` + `useConvexClient`), Svelte 5 runes |

## 3. Modelo da rodada online (game design)

1. **Lobby:** host cria a sala (código curto + link), jogadores entram com seu perfil, host inicia (define voltas + baralho).
2. **Dono da rodada** (rotaciona por `roundIndex`): só o aparelho do Dono recebe o `target`. O Dono **digita uma dica curta** e envia → a dica aparece para todos; a fase vira `guessing`.
3. **Palpiteiros:** veem a dica, movem o **próprio ponteiro** no `Meter`, e **travam**. Indicador ao vivo "X de Y palpitaram".
4. **Revelação** (sincronizada): quando todos travam (ou o host força), `phase='reveal'` → todos os aparelhos abrem o medidor mostrando **o alvo + os marcadores de cada jogador** (cor de cada um) + a pontuação por proximidade. O `groupScore` sobe (soma dos palpites).
5. **Próxima rodada:** host avança (ou auto) → rotaciona o Dono, novo alvo/carta, `phase='clue'`. Após a última volta → fim de jogo (selo de sintonia do grupo).

Pontuação por palpite = `scoreFor(value, target)` (reusa `geometry.ts`: 0/2/3/4). O `groupScore` acumula a soma dos palpites de todas as rodadas; o selo final usa as faixas de `rules.ts`.

## 4. Arquitetura

### 4.1 Identidade (sem login)
- Primeiro acesso ao online: gera `playerId = crypto.randomUUID()` salvo em `localStorage` (`pov-player-id`). O perfil (nome, cor, `avatarStorageId`) também fica em `localStorage` (`pov-profile`) e é replicado no Convex ao entrar numa sala. Sem Convex Auth; as funções recebem `playerId` como argumento e validam autoria por ele.

### 4.2 Convex — schema (`convex/schema.ts`)
```ts
rooms: defineTable({
  code: v.string(),                 // curto, ex. "POV-7Q2K"
  hostPlayerId: v.string(),
  status: v.union(v.literal('lobby'), v.literal('playing'), v.literal('ended')),
  config: v.object({ voltas: v.union(v.literal(1), v.literal(2), v.literal(3)), deck: v.literal('classico') }),
  round: v.union(v.null(), v.object({
    index: v.number(),
    donoPlayerId: v.string(),
    cardIndex: v.number(),
    target: v.number(),             // SEGREDO — nunca exposto a não-Donos antes do reveal (ver 4.4)
    clue: v.union(v.null(), v.string()),
    phase: v.union(v.literal('clue'), v.literal('guessing'), v.literal('reveal')),
  })),
  groupScore: v.number(),
  createdAt: v.number(),
}).index('by_code', ['code']),

players: defineTable({
  roomId: v.id('rooms'),
  playerId: v.string(),
  name: v.string(),
  color: v.string(),                // PlayerColor
  avatarStorageId: v.union(v.null(), v.id('_storage')),
  lastSeen: v.number(),             // heartbeat (presença)
}).index('by_room', ['roomId']).index('by_room_player', ['roomId', 'playerId']),

guesses: defineTable({
  roomId: v.id('rooms'),
  roundIndex: v.number(),
  playerId: v.string(),
  value: v.number(),                // 0..100
  locked: v.boolean(),
}).index('by_room_round', ['roomId', 'roundIndex']),
```

### 4.3 Fluxo reativo
O cliente assina **`getRoomView(code, playerId)`** (query) → devolve `{ room, players, guesses, me }`, derivando presença (`connected = now - lastSeen < 15s`). O Convex re-emite a query a cada mudança → lobby ao vivo, "X de Y palpitaram", revelação sincronizada — **sem polling**. (Ref: [Convex realtime](https://stack.convex.dev/building-a-multiplayer-game).)

### 4.4 Segredo do alvo (server-side)
`getRoomView` **omite `round.target`** a menos que `playerId === round.donoPlayerId` **ou** `round.phase === 'reveal'`. O alvo nunca trafega para palpiteiros antes da revelação → impossível trapacear via devtools.

### 4.5 Funções Convex
- **Queries:** `getRoomView(code, playerId)`.
- **Mutations:** `createRoom(profile)→{code}` · `joinRoom(code, profile)` · `updateProfile(playerId, profile)` · `startGame(code, playerId)` · `setClue(code, playerId, clue)` · `submitGuess(code, playerId, value)` · `revealRound(code, playerId)` (host ou auto quando todos travam; calcula scores, soma `groupScore`) · `nextRound(code, playerId)` (rotaciona/encerra) · `heartbeat(code, playerId)` · `leaveRoom(code, playerId)`.
- **Actions/upload:** `generateUploadUrl()→string` (avatar). Fluxo: gerar URL → POST do arquivo → `storageId` → `updateProfile`. `getUrl(storageId)` para exibir. (Ref: [file storage](https://docs.convex.dev/file-storage/upload-files).)
- **Autoria:** mutations sensíveis (setClue/startGame/etc.) validam `playerId` contra `donoPlayerId`/`hostPlayerId`.

### 4.6 Presença, reconexão, host
- **Presença:** `heartbeat` a cada ~8s atualiza `lastSeen`; a query deriva `connected`. (Opcional: trocar pelo [componente Presence oficial](https://www.convex.dev/components/presence) depois.)
- **Reconexão:** `playerId` é estável → o jogador volta à mesma cadeira.
- **Host saiu:** se o host fica desconectado, promove o jogador conectado mais antigo a `hostPlayerId` (em `heartbeat`/`getRoomView`).

### 4.7 Cliente (convex-svelte) + reuso
- `npm i convex convex-svelte`. No root: `setupConvex(import.meta.env.VITE_CONVEX_URL)`. `useQuery(api.rooms.getRoomView, { code, playerId })` → `{ data, isLoading, error }` ligado a runes. Mutations via `useConvexClient().mutation(...)`. (Ref: [convex-svelte](https://docs.convex.dev/client/svelte).)
- **Reusa o jogo local:** `Meter`, `Console`, `Background`, `TopBar`, `PlayerToken`, `Logo`, `geometry.ts` (`scoreFor`, `drawTarget`, `STEP_P`), `rules.ts`/`scoring.ts`, sons (`clicks.ts`), o sistema de tema/transições/reduced-motion. A rodada online é o `Meter` dirigido pelo estado da sala (target/clue/marcadores) em vez do store local.
- **Marcadores múltiplos:** o `Meter` ganha um prop `markers?: {p:number,color:string}[]` (já previsto na auditoria de design) para mostrar o palpite de cada jogador na revelação. (Trabalho novo no Meter.)

### 4.8 Deploy
- **Local:** `npx convex dev` (cria projeto, salva `VITE_CONVEX_URL` no `.env.local`) — **exige login do usuário no Convex** (passo manual).
- **Prod:** Vercel, Build Command `npx convex deploy --cmd 'npm run build'`, `CONVEX_DEPLOY_KEY` no Vercel. (Ref: [Vercel hosting](https://docs.convex.dev/production/hosting/vercel).)

## 5. Telas / fluxo
Reusa o sistema visual (Shell, Console, Meter, PlayerToken, fundo, fontes, sons, transições, reduced-motion). Novas/adaptadas:
1. **Escolher modo** — Home → Local / Online.
2. **Perfil** — nome + avatar (cor/ilustração) + foto opcional (upload). Salvo no dispositivo; editável.
3. **Criar / Entrar** — Criar sala (vira host) | Entrar (código).
4. **Lobby** — código grande + "copiar link"; lista de jogadores ao vivo (avatares + presença); host: configs (voltas/baralho) + "Iniciar"; outros: "aguardando o host".
5. **Rodada online** — `Meter` sincronizado: Dono digita dica; palpiteiros movem ponteiro + travam ("X de Y palpitaram"); revelação com alvo + marcadores + scores; placar do grupo.
6. **Fim de jogo** — sintonia final + selo + "jogar de novo" (mesma sala) / "sair".

## 6. Reuso & isolamento
- Estado do jogo LOCAL (`store.svelte.ts`) fica intocado; o modo online tem seu próprio "store" derivado da query Convex (`src/lib/online/`).
- Lógica pura compartilhada (`geometry`, `rules`, `scoring`) é a fonte única de verdade da pontuação nos dois modos.
- `convex/` é um diretório isolado (backend); o frontend só fala com ele via `api`.

## 7. Pré-requisitos (do usuário)
1. Conta grátis no **Convex** (github/google) + rodar `npx convex dev` uma vez (login no navegador) → gera `convex/_generated` + `VITE_CONVEX_URL`.
2. (Prod, depois) conta Vercel + `CONVEX_DEPLOY_KEY`.
Sem o passo 1, o online não roda localmente (o local continua funcionando normalmente).

## 8. Riscos & questões abertas
- **R1 — `convex-svelte` maturidade** (médio): menos rodado que o cliente React; verificar a API exata na doc ao implementar; ter fallback (assinatura manual via `ConvexClient.onUpdate`) se algum hook não couber em runes.
- **R2 — Setup do Convex depende do usuário** (login). Mitigar: Task 0 guiada; o resto do build não bloqueia.
- **R3 — Sincronização de fase/`reveal`**: definir bem quem dispara `revealRound` (host vs auto-quando-todos-travam) para não travar a sala se alguém sai no meio. MVP: auto quando todos os *conectados* travam, + botão do host "revelar agora".
- **R4 — Abuso/limites**: sala pública por código pode receber entradas indevidas; MVP aceita (código é a barreira); rate-limit/expiração de sala = futuro.
- **Q1 — "envio de e-mails"**: a definir na fase social (convite por link vs e-mail real vs recados in-app) — fora deste MVP.
- **Q2 — Markers no Meter**: confirmar visual (pinos coloridos na revelação) ao implementar.

## 9. Critérios de sucesso
1. Dois+ aparelhos entram na mesma sala por código e **veem uns aos outros ao vivo** (presença).
2. Uma **rodada cooperativa completa** roda sincronizada: Dono dá dica digitada, palpiteiros palpitam, revelação simultânea com marcadores + alvo + placar do grupo.
3. Rodízio de Dono e fim de jogo (selo) funcionam.
4. O **modo local não regride** (continua offline, sem Convex).
5. Identidade leve: entrar é rápido (nome+avatar), reconexão volta à mesma cadeira.
6. Mesmo nível de polimento visual/tátil/sonoro do local (transições, sons, reduced-motion, a11y).

## 10. Fora de escopo (fases futuras)
Chat; convites/"e-mail"; criador de cartões personalizados; configs avançadas de modo de jogo; contas reais/perfis persistentes entre dispositivos; ranking/histórico; moderação/anti-abuso.
