# POV — Modo Online "Sala Jogável" (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Uma sala online jogável de ponta a ponta na visão do usuário — perfil leve → criar/entrar por código → lobby com presença ao vivo → rodadas com Dono rotativo, **cada jogador na sua própria roleta**, o **Dono vendo todas as roletas ao vivo + quem deu "pronto"**, **revelação com timer**, e **grid dinâmico** de resultados — tudo sincronizado via Convex, reusando o sistema visual/tátil/sonoro do local.

**Architecture:** Backend Convex (DB reativo + funções + storage) já configurado (`convex/`, deployment dev `stoic-toad-563`, `VITE_CONVEX_URL` no `.env.local`, `npx convex dev` rodando = publica funções ao vivo). Frontend = o SPA Svelte/Vite atual + `convex-svelte` (`setupConvex`/`useQuery`/`useConvexClient`). Identidade leve: `playerId` (UUID no localStorage). O alvo secreto fica no servidor e só é exposto ao Dono ou na revelação. Decks/cartas continuam client-side (`decks.ts`); o servidor lida só com **índices** de carta (ordem embaralhada sem-repetição, igual ao local). O modo **local continua intacto** (offline, sem Convex).

**Tech Stack:** Svelte 5 runes · Vite · Convex (TS) · convex-svelte. Verificação: `npm run check` 0/0 + `npm run build` + smoke **multi-cliente** (2 sessões de browser).

**Conventions:** branch `feat/online`. Lean review (implementer self-verifica typecheck/build; revisão profunda no backend de sincronização, na segurança do alvo, e no smoke multi-cliente). Use as **skills de design** nas tarefas de UI (frontend-design, make-interfaces-feel-better, interaction-design, animate, generating-sounds-with-ai, web-design-guidelines). Commits com trailer `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. **Backend valida com `npx convex codegen`** (gera `_generated` + checa as funções) — pode rodar ao lado do `convex dev`.

---

## Modelo da rodada (visão refinada — fonte da verdade)
- Rodada com **Dono rotativo** (`donoIndex = roundIndex % players.length`). O Dono **descreve a situação na call de voz externa** (sem dica digitada no MVP).
- **Fase `guessing`:** cada jogador (≠ Dono) mexe na **própria roleta** (`Meter`), com o valor sincronizado AO VIVO (throttle); marca **"pronto"** (`locked`). O **Dono** vê um **grid de mini-roletas**, uma por jogador, se mexendo em tempo real + quem já travou ("3 de 4").
- **Fase `reveal`:** quando todos os palpiteiros conectados travam (ou o host força), o servidor calcula os scores e soma no `groupScore`; todos os clientes entram em `reveal` ~juntos e rodam uma **revelação com timer** (beat de suspense), mostrando, para cada um, seu palpite vs o alvo (acertou/errou) e depois **todos lado a lado** num **grid dinâmico** (auto-fit pelo nº de jogadores).
- Próxima rodada → Dono rotaciona, nova carta (índice da ordem embaralhada sem-repetição), `phase='guessing'`. Após a última volta → fim de jogo (selo do grupo).

## File structure
| Arquivo | Responsabilidade |
|---|---|
| `convex/schema.ts` | tabelas `rooms`, `players`, `guesses` |
| `convex/rooms.ts` | lifecycle: createRoom, joinRoom, getRoomView, startGame, heartbeat, leaveRoom |
| `convex/round.ts` | rodada: updateGuess, lockGuess, reveal, nextRound |
| `convex/files.ts` | generateUploadUrl, saveAvatar |
| `convex/lib.ts` | helpers puros (gerar código de sala, shuffle de índices, etc.) |
| `src/lib/online/identity.ts` | `playerId` (localStorage) + perfil local |
| `src/lib/online/room.svelte.ts` | store online: `useQuery(getRoomView)` + ações (mutations) |
| `src/lib/meter/Meter.svelte` | + prop `markers[]` (pinos coloridos dos palpites) |
| `src/lib/screens/online/*` | ModeSelect, Profile, CreateJoin, Lobby, OnlineRound, OnlineGameOver |
| `src/App.svelte` | rota o online (`game.screen` ganha estados online) |

---

## Task 1: Convex schema
**Files:** `convex/schema.ts`
- [ ] **Step 1 — escrever o schema:**
```ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  rooms: defineTable({
    code: v.string(),                       // ex. "7Q2K"
    hostPlayerId: v.string(),
    status: v.union(v.literal('lobby'), v.literal('playing'), v.literal('ended')),
    deck: v.string(),                       // DeckId (client mapeia p/ as cartas)
    voltas: v.union(v.literal(1), v.literal(2), v.literal(3)),
    cardOrder: v.array(v.number()),         // índices embaralhados (sem-repetição)
    cardPos: v.number(),
    round: v.union(v.null(), v.object({
      index: v.number(),
      donoPlayerId: v.string(),
      cardIndex: v.number(),
      target: v.number(),                   // SEGREDO (ver getRoomView)
      phase: v.union(v.literal('guessing'), v.literal('reveal')),
    })),
    groupScore: v.number(),
    createdAt: v.number(),
  }).index('by_code', ['code']),

  players: defineTable({
    roomId: v.id('rooms'),
    playerId: v.string(),
    name: v.string(),
    color: v.string(),
    avatarStorageId: v.union(v.null(), v.id('_storage')),
    lastSeen: v.number(),
    joinedAt: v.number(),
  }).index('by_room', ['roomId']).index('by_room_player', ['roomId', 'playerId']),

  guesses: defineTable({
    roomId: v.id('rooms'),
    roundIndex: v.number(),
    playerId: v.string(),
    value: v.number(),                      // 0..100 (atualizado ao vivo)
    locked: v.boolean(),
  }).index('by_room_round', ['roomId', 'roundIndex']).index('by_room_round_player', ['roomId', 'roundIndex', 'playerId']),
})
```
- [ ] **Step 2 — validar:** `npx convex codegen` → sem erros; `convex/_generated` atualizado. (`npm run check` segue 0/0 — o app ainda não importa convex.)
- [ ] **Step 3 — commit** `feat(online): convex schema (rooms/players/guesses)`.

**DEEP REVIEW:** índices coerentes; `target` no schema mas protegido na query (Task 2).

## Task 2: Convex — lifecycle da sala (`convex/rooms.ts`, `convex/lib.ts`)
**Files:** `convex/lib.ts`, `convex/rooms.ts`
- [ ] **Step 1 — `lib.ts`:** helpers puros: `genCode()` (4-5 chars A-Z0-9 sem ambíguos), `shuffledOrder(n)` (Fisher-Yates), `now()`. `CONNECTED_MS = 15000`.
- [ ] **Step 2 — `rooms.ts` mutations/queries** (com `v` validators):
  - `createRoom({ profile, deck, voltas, deckSize })` → cria room (status 'lobby', cardOrder=shuffledOrder(deckSize), cardPos=0, round=null, groupScore=0), insere o host em `players`, retorna `{ code }`.
  - `joinRoom({ code, profile })` → acha a room por code; se status!=='lobby' permite entrar como espectador? (MVP: só em 'lobby'); upsert do player (por playerId). Retorna ok/erro ("sala não encontrada"/"já começou").
  - `getRoomView({ code, playerId })` (query) → `{ room, players (com connected derivado de lastSeen), guesses (da rodada atual), me }`. **OMITE `round.target`** a menos que `playerId === round.donoPlayerId` ou `round.phase === 'reveal'`.
  - `startGame({ code, playerId })` → só host; status='playing'; monta `round` (index 0, donoPlayerId = players[0].playerId ordenados por joinedAt, cardIndex=cardOrder[0], target=drawTarget(), phase='guessing'). (drawTarget: portar a lógica de `geometry.drawTarget` p/ o servidor em `lib.ts`, mesma margem ti∈[3,STEPS-3], STEPS=24.)
  - `heartbeat({ code, playerId })` → atualiza lastSeen. Promove host se o host atual está desconectado (lastSeen > CONNECTED_MS) → host = player conectado mais antigo.
  - `leaveRoom({ code, playerId })` → remove o player; se era host, promove outro; se a sala esvazia, deleta.
- [ ] **Step 3 — validar** `npx convex codegen` + reason sobre a secrecy do target.
- [ ] **Step 4 — commit** `feat(online): room lifecycle + presença + secrecy do alvo`.

**DEEP REVIEW (segurança/sincronização):** target nunca exposto a não-Dono fora do reveal; autoria (host/dono) validada; rotação de host correta.

## Task 3: Convex — rodada + upload (`convex/round.ts`, `convex/files.ts`)
**Files:** `convex/round.ts`, `convex/files.ts`
- [ ] **Step 1 — `round.ts`:**
  - `updateGuess({ code, playerId, value })` → upsert guess (value, locked=false se ainda não travou). (Chamado ao vivo, com throttle no cliente.)
  - `lockGuess({ code, playerId })` → marca locked=true. Se TODOS os palpiteiros conectados (≠ Dono) estão locked → chama a lógica de `reveal` internamente.
  - `reveal({ code, playerId })` → (host força OU auto) phase='reveal'; calcula score de cada guess (`scoreFor(value, target)` — portar p/ lib) e soma no `groupScore`. (Não duplicar soma se já revelou.)
  - `nextRound({ code, playerId })` → só host/dono; se última rodada (index+1 >= voltas*players) → status='ended', round=null; senão index++, donoPlayerId rotaciona, cardPos++ (reshuffle+avoid-repeat se esgotar), cardIndex=cardOrder[cardPos], target=drawTarget(), phase='guessing'; limpa os guesses da rodada nova (ou usa roundIndex pra isolar).
- [ ] **Step 2 — `files.ts`:** `generateUploadUrl()` (mutation) → url; `saveAvatar({ playerId, code, storageId })` → grava avatarStorageId. Exibição via `ctx.storage.getUrl` numa query (ou incluir url no getRoomView).
- [ ] **Step 3 — validar** `npx convex codegen`. **Commit** `feat(online): round (guess/lock/reveal/next) + upload de avatar`.

**DEEP REVIEW:** score somado UMA vez por rodada; auto-reveal só com todos os conectados travados; nextRound só host.

## Task 4: Cliente — convex-svelte + identidade + store online
**Files:** `src/lib/online/identity.ts`, `src/lib/online/room.svelte.ts`, `src/App.svelte` (setupConvex no root)
- [ ] **Step 1 — `identity.ts`:** `getPlayerId()` (cria/lê `pov-player-id` UUID), `getProfile()/saveProfile()` (`pov-profile`: {name, color, avatarStorageId?}).
- [ ] **Step 2 — setupConvex:** no topo do App (ou um wrapper), `setupConvex(import.meta.env.VITE_CONVEX_URL)`. (Confira a API atual de `convex-svelte` na doc — `setupConvex`, `useQuery`, `useConvexClient`.)
- [ ] **Step 3 — `room.svelte.ts`:** um módulo que expõe `useQuery(api.rooms.getRoomView, () => ({ code, playerId }))` reativo + ações que chamam `useConvexClient().mutation(...)` (create/join/start/updateGuess/lock/reveal/next/leave) + um heartbeat (`setInterval` chamando heartbeat enquanto numa sala). Derivados: `isHost`, `isDono`, `myGuess`, `everyoneLocked`, `connectedPlayers`.
- [ ] **Step 4 — verificar** `npm run check` (0/0 — agora o app importa convex/_generated; precisa existir, e existe pois `convex dev` rodou), `npm run build`. **Commit** `feat(online): convex-svelte + identidade + store de sala`.

**DEEP REVIEW:** a query reativa atualiza; o throttle do updateGuess (≤~8/s); heartbeat com cleanup.

## Task 5: Meter — prop `markers[]`
**Files:** `src/lib/meter/Meter.svelte`
- [ ] Adicionar prop opcional `markers?: { p: number; color: string }[]` que desenha pinos coloridos nas posições `p` (0..100) sobre o mostrador (usar `pointAt(p, r)` da geometria). Sem mexer na física/gestos. Usado: na revelação (palpite de cada jogador) e nas mini-roletas do preview do Dono. Default `[]` (sem mudança). `npm run check` 0/0. **Commit** `feat(online): Meter markers[] (pinos de palpite)`.

## Task 6: Telas — Escolher modo + Perfil
**Files:** `src/lib/screens/online/ModeSelect.svelte`, `Profile.svelte`; `App.svelte` (rotas), `Home.svelte` (CTA leva a ModeSelect)
- [ ] Invocar `frontend-design`. **ModeSelect:** Local / Online (cards bonitos). **Profile:** nome + avatar (cor/ficha) + **foto** (upload via generateUploadUrl→POST→saveAvatar); salvo no dispositivo. Reusa Shell/PlayerToken/tokens. a11y + responsivo. Verificar check/build + screenshot desktop+mobile. **Commit**.

## Task 7: Telas — Criar/Entrar + Lobby
**Files:** `src/lib/screens/online/CreateJoin.svelte`, `Lobby.svelte`
- [ ] Invocar `frontend-design`/`interaction-design`. **CreateJoin:** Criar sala (→ createRoom, vira host) | Entrar (input de código → joinRoom; erros claros). **Lobby:** código grande + "copiar link"; **lista de jogadores AO VIVO** (avatares + presença, entrando/saindo); host vê configs (voltas, **baralho** via os decks existentes) + "Iniciar"; outros veem "aguardando o host". Animações de entrada/saída de jogador. Verificar check/build + screenshots. **Commit**.

## Task 8: Tela — Rodada online + Fim de jogo
**Files:** `src/lib/screens/online/OnlineRound.svelte`, `OnlineGameOver.svelte`
- [ ] Invocar `frontend-design` + `make-interfaces-feel-better` + `animate` + `generating-sounds-with-ai`. A tela mais rica:
  - **Palpiteiro:** o `Meter` interativo (arrasta → `updateGuess` com throttle), botão **"Pronto"** (→ lockGuess); estado "travado" claro; vê "X de Y palpitaram".
  - **Dono:** NÃO palpita; vê um **grid de mini-roletas** (`Meter` decorativo + `markers` com o valor AO VIVO de cada palpiteiro) + `PlayerToken` + selo "pronto"/"pensando" por jogador. Reorganiza pelo nº de jogadores.
  - **Revelação (timer):** ao `phase==='reveal'`, todos rodam um beat de suspense com **countdown/timer** → o `Meter` abre com `markers` de todos + o alvo; cada um vê "você: +N · acertou/errou"; depois o **grid dinâmico** (auto-fit) com a roleta+marcador+score de cada jogador, lado a lado. Sons (`scoreSting`/`celebrate`) + reduced-motion.
  - **Avançar:** host avança (→ nextRound) — gesto/ботão; última → OnlineGameOver (selo do grupo, jogar de novo na mesma sala / sair).
  - Responsivo desktop+mobile; tátil; a11y. Verificar check/build + screenshots (desktop+mobile, perspectiva Dono e palpiteiro). **Commit**.

## Task 9: Smoke multi-cliente + review final + merge
- [ ] Invocar agent-browser com **DUAS sessões isoladas** (dois "jogadores"). Player A cria sala → Player B entra pelo código → ambos aparecem no lobby ao vivo → host inicia → A (Dono) vê a roleta de B se mexendo ao vivo; B move e dá "pronto"; A vê "1 de 1" → revelação sincronizada com timer + grid → próxima rodada (Dono rotaciona) → fim. Verificar: presença ao vivo, secrecy do alvo (B nunca recebe o target antes do reveal — checar no payload), scores, zero erro de console em ambos. Screenshots das duas perspectivas. **Final review** (segurança/sincronização/a11y/responsivo) → **finishing-a-development-branch** (merge na main).

---

## Self-review (cobertura)
- Visão: dials individuais (T8) · preview ao vivo pro Dono (T8 + markers T5 + updateGuess T3) · revelação com timer (T8) · grid dinâmico (T8) · Dono rotativo + sem-repetição server-side (T3) ✓
- Convex: schema (T1) · lifecycle+secrecy+presença (T2) · rodada+upload (T3) · client (T4) ✓
- Identidade leve (T4) · perfil+foto (T6) · lobby ao vivo (T7) ✓
- Fora de escopo (fase futura): chat, criador de baralhos, convites/e-mail, contas reais. (O criador de baralhos e as +100 cartas são trabalhos SEPARATE combinados com o usuário — ver conversa.)
