# Redesign do Lobby (Fase 1) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a entrada do POV (Home + escolha-de-modo + entrada online) por um **lobby único premium** (claro/escuro) com uma **roleta-playground funcional** no centro, mais Perfil e Configurações, na direção "Studio Sinal + toque cósmico".

**Architecture:** Refactor de fundação de tokens (layer único + temas + paleta nova) → roteamento do store para uma tela `lobby` → extensão do `Meter` para um modo playground concorrente (sem consequência) → chrome (cluster de topo, rodapé, segmentado) → montagem do `Lobby.svelte` → Perfil/Configurações como sheets. Reusa `Meter`/`geometry.ts`/`clicks.ts`/`Sheet.svelte` e a identidade Convex. As telas de jogo e o tutorial **não** mudam nesta fase (só são roteadas).

**Tech Stack:** Svelte 5 (runes), Vite, TypeScript, CSS custom properties (sem Tailwind), Vitest, svelte-check. Fontes: Clash Display (Fontshare), Inter, Space Grotesk, Fraunces.

**Spec:** `docs/superpowers/specs/2026-06-19-lobby-redesign-design.md`
**Alvo visual (mock aprovado, local/gitignored):** `.superpowers/brainstorm/10063-1781870560/content/lobby-sinal-themes.html`
**Branch:** `feat/lobby-redesign`

**Defaults cravados (do review do spec):** modo **Local** abre o `Setup` atual; **Perfil** e **Configurações** são **sheets** (sobre o lobby).

---

## File Structure

**Criar:**
- `src/lib/screens/Lobby.svelte` — a tela de entrada integrada (orquestra tudo).
- `src/lib/lobby/PlaygroundDial.svelte` — wrapper do `Meter` em modo brinquedo.
- `src/lib/lobby/ModeSwitch.svelte` — segmentado Local|Online (controlado).
- `src/lib/lobby/CosmosBackdrop.svelte` — halo de arcos + estrelas atrás do dial (decorativo, aria-hidden, reduce-aware).
- `src/lib/chrome/StudioFooter.svelte` — rodapé de estúdio.
- `src/lib/profile/ProfileSheet.svelte` — Perfil (foto+cor+nome) como sheet.
- `tests/lobby.routing.test.ts` — testes do roteamento do store.
- `tests/tokens.test.ts` — testes da paleta/cores de jogador.

**Modificar:**
- `src/app.css` — layer de tokens único, paleta clara/escura nova, z-index nomeado, @import de fontes.
- `src/lib/design/tokens.ts` — paleta derivada + cores de jogador retrô + scoreColors.
- `src/lib/game/store.svelte.ts` — `Screen` ganha `'lobby'` (inicial), remove `home`/`modeSelect`, ajusta navegação.
- `src/App.svelte` — rota `lobby` → `Lobby.svelte`; remove `home`/`modeSelect`.
- `src/lib/chrome/TopBar.svelte` — repaginado: cluster (som/tema/perfil) e ponto de entrada "Como jogar"; aceita modo "lobby".
- `src/lib/chrome/Shell.svelte` — monta `ProfileSheet`; expõe abertura de Perfil/Config a partir do lobby.
- `src/lib/chrome/SettingsSheet.svelte` — acessível no lobby + controle de idioma (PT-BR).
- `src/lib/chrome/Background.svelte` — backdrop calmo por token (sem rainbow/sunburst pesado).
- `src/lib/screens/online/Online.svelte` — `onBack` volta para o lobby; Perfil online usa o Perfil unificado.

**Remover (após migração):** `src/lib/screens/Home.svelte`, `src/lib/screens/ModeSelect.svelte` (e o `Console.svelte` decorativo se ficar órfão — checar antes).

> Caminhos de chrome (`TopBar`, `Shell`, `SettingsSheet`, `Background`) são referência do mapa do front-end; **confirme os caminhos reais** (`Grep`) antes de editar, pois podem estar em `src/lib/chrome/` ou `src/lib/components/`.

---

## Task 1: Fundação de tokens + temas + fontes

**Files:**
- Modify: `src/app.css`
- Modify: `src/lib/design/tokens.ts`
- Test: `tests/tokens.test.ts`

- [ ] **Step 1: Localizar os arquivos e o estado atual**

Run: `Grep` por `--pov-` em `src/app.css` e leia `src/lib/design/tokens.ts` inteiro. Anote os nomes de `PlayerColor` usados no store e em `tokens.ts`.

- [ ] **Step 2: Escrever teste falho das cores de jogador e scoreColors**

Crie `tests/tokens.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { playerColors, scoreColors } from '../src/lib/design/tokens'

describe('tokens', () => {
  it('expõe 8 cores de jogador com hex válido', () => {
    const names = Object.keys(playerColors)
    expect(names).toHaveLength(8)
    for (const hex of Object.values(playerColors)) {
      expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
  it('mapeia score 2/3/4 para cores', () => {
    expect(scoreColors[2]).toMatch(/^#/)
    expect(scoreColors[3]).toMatch(/^#/)
    expect(scoreColors[4]).toMatch(/^#/)
  })
})
```

- [ ] **Step 3: Rodar o teste e ver falhar**

Run: `npm test -- tokens` → Expected: FAIL (`playerColors` não exportado / contagem errada).

- [ ] **Step 4: Atualizar `tokens.ts`**

Substitua a `palette`/cores por valores retrô e exporte `playerColors` (8 nomes, hex retrô) e `scoreColors`:

```ts
// Paleta-acento retrô (igual nos dois temas)
export const accent = {
  red: '#dd3b2e', teal: '#56b0aa', sage: '#8fce9f',
  mustard: '#e0a92e', pink: '#e7a6bf', coral: '#e8674a',
  navy: '#1b2350', cream: '#efe6cf',
} as const

// Cores de identidade do jogador — mantém os 8 NOMES atuais, hex retrô
export const playerColors = {
  coral: '#e8674a', piscina: '#56b0aa', menta: '#8fce9f', mostarda: '#e0a92e',
  rosa: '#e7a6bf', lilas: '#9a86c4', laranja: '#e0892e', petroleo: '#2f6f74',
} as const

export const scoreColors = { 2: '#e0892e', 3: '#e0a92e', 4: '#2f6f74' } as const
```

> Mantenha quaisquer outros exports que componentes atuais importam (`treatments` etc.) — só remapeie hex. Verifique consumidores com `Grep` por `from '.*design/tokens'`.

- [ ] **Step 5: Reescrever o layer de tokens em `app.css`**

No `:root` (tema base/claro) defina os tokens neutros + acento + dial + z-index; em `.theme-dark` faça o override dos neutros. Use exatamente os valores do spec §2.1:

```css
:root{
  --bone:#f6f4ee; --surface:#ffffff; --sunk:#ece9e0;
  --ink:#1b2350; --ink-soft:#5b6275; --hair:#e6e3d9;
  --red:#dd3b2e; --teal:#56b0aa; --sage:#8fce9f; --mustard:#e0a92e;
  --pink:#e7a6bf; --coral:#e8674a; --navy:#1b2350; --cream:#efe6cf;
  --z-bg:0; --z-hero:1; --z-chrome:5; --z-sheet:40;
}
.theme-dark{
  --bone:#0e1530; --surface:#18213f; --sunk:#121a34;
  --ink:#eef1f8; --ink-soft:#9aa6c4; --hair:rgba(255,255,255,.08);
}
```

Atualize o `@import` de fontes para incluir **Inter** e **Clash Display** (Fontshare) além de Space Grotesk + Fraunces. Remova tokens órfãos antigos só depois de confirmar que nada os usa (`Grep`).

- [ ] **Step 6: Rodar testes + check**

Run: `npm test -- tokens` → PASS. Run: `npm run check` → 0/0. Run: `npm run build` → ok.

- [ ] **Step 7: Commit**

```bash
git add src/app.css src/lib/design/tokens.ts tests/tokens.test.ts
git commit -m "feat(redesign): fundação de tokens (paleta retrô, temas claro/escuro, z-index, fontes)"
```

---

## Task 2: Roteamento do store para `lobby`

**Files:**
- Modify: `src/lib/game/store.svelte.ts`
- Modify: `src/App.svelte`
- Modify: `src/lib/screens/online/Online.svelte` (onBack)
- Test: `tests/lobby.routing.test.ts`

- [ ] **Step 1: Escrever teste falho do roteamento**

Crie `tests/lobby.routing.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { game } from '../src/lib/game/store.svelte'

describe('roteamento do lobby', () => {
  it('inicia no lobby', () => {
    expect(game.screen).toBe('lobby')
  })
  it('goHome volta ao lobby', () => {
    game.openOnline(); expect(game.screen).toBe('online')
    game.goHome(); expect(game.screen).toBe('lobby')
  })
  it('openSetup vai para setup', () => {
    game.openSetup(); expect(game.screen).toBe('setup'); game.goHome()
  })
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- lobby.routing` → FAIL (`game.screen` inicial é `'home'`).

- [ ] **Step 3: Editar o `Screen` type e a navegação no store**

Em `store.svelte.ts`:
- `export type Screen = 'lobby' | 'howToPlay' | 'online' | 'setup' | 'inRound' | 'gameOver'` (remova `'home'` e `'modeSelect'`).
- `let screen = $state<Screen>('lobby')`.
- `goHome() { screen = 'lobby' }`.
- Remova `openModeSelect()`; mantenha `openSetup()`, `openOnline()`, `openHowToPlay()`/`closeHowToPlay()`.
- Garanta que `returnScreen` default e quaisquer transições que apontavam para `'home'`/`'modeSelect'` agora apontem para `'lobby'`.

- [ ] **Step 4: Atualizar `App.svelte`**

- Remova os imports e os ramos `{:else if game.screen === 'home'}`/`'modeSelect'`.
- Adicione o ramo `{#if game.screen === 'lobby'}<Lobby />` (import de `Lobby.svelte` — será criado na Task 5; por ora pode importar um stub que renderiza um `<h1>POV</h1>` para destravar o teste, e completar na Task 5).
- Mantenha o `{#key game.screen}` + fade.

- [ ] **Step 5: Atualizar `Online.svelte` onBack**

Troque a chamada `openModeSelect` por `goHome` no `onBack` do fluxo online.

- [ ] **Step 6: Rodar testes + check**

Run: `npm test -- lobby.routing` → PASS. Run: `npm run check` → 0/0 (o stub de Lobby evita erro de import).

- [ ] **Step 7: Commit**

```bash
git add src/lib/game/store.svelte.ts src/App.svelte src/lib/screens/online/Online.svelte tests/lobby.routing.test.ts
git commit -m "feat(redesign): store roteia para tela 'lobby' (remove home/modeSelect)"
```

---

## Task 3: Modo playground no `Meter` + `PlaygroundDial`

**Files:**
- Modify: `src/lib/meter/Meter.svelte`
- Create: `src/lib/lobby/PlaygroundDial.svelte`

- [ ] **Step 1: Ler o `Meter.svelte` e mapear o gating por `phase`**

Leia `src/lib/meter/Meter.svelte` e `src/lib/meter/geometry.ts`. Identifique: `coverDraggable` (`hidden||peek`), `interactive` (`phase==='guessing'`), `discDraggable` (`reveal && !reduceMotion`), `lockGestures`, `decorative`, `onCoverSettle`, `onDiscSpin`, `roundSeed`/`startSpin`.

- [ ] **Step 2: Adicionar a prop `playground` ao `Meter`**

Adicione `playground?: boolean = false`. Quando `true`, **relaxe o gating** para que tampa, agulha e disco fiquem todos interativos ao mesmo tempo:
- `coverDraggable = playground || phase==='hidden' || phase==='peek'`
- `interactive = playground || phase==='guessing'`
- `discDraggable = (playground || phase==='reveal') && !reduceMotion`
- Em modo playground, **`onCoverSettle`/`onDiscSpin` não disparam efeito de jogo** (o wrapper passa no-ops); mantenha os sons/háptico (`tick`/`thunk`/`ratchet`/`slide`) que já tocam internamente.

Não toque na física (mola/momentum) — só nas condições de habilitação.

- [ ] **Step 3: Expor shuffle sob demanda e travar/soltar**

- Adicione um método imperativo ou prop reativa para **embaralhar**: ex. `shuffleSpin?: number` (bump → dispara `startSpin` 3 voltas, como o `roundSeed` faz hoje) **desacoplado de `roundSeed`**. O wrapper bumpa esse número ao clicar "embaralhar".
- Adicione **travar/soltar**: uma prop `locked?: boolean` que, quando `true`, fixa a agulha (ignora needle-drag) e toca `thunk`+háptico ao travar; quando volta a `false`, reabilita o arraste. Sem efeito de pontuação.

- [ ] **Step 4: Criar `PlaygroundDial.svelte` (wrapper no-op)**

```svelte
<script lang="ts">
  import Meter from '../meter/Meter.svelte'
  import { game } from '../game/store.svelte'
  let value = $state(50)
  let shuffleSpin = $state(0)
  let locked = $state(false)
  function shuffle() { shuffleSpin++ }
  function toggleLock() { locked = !locked }
</script>

<div class="playground">
  <Meter bind:value playground {shuffleSpin} {locked}
         onCoverSettle={() => {}} onDiscSpin={() => {}} />
  <div class="toys">
    <button onclick={shuffle} aria-label="Embaralhar a roleta">Embaralhar</button>
    <button onclick={toggleLock} aria-pressed={locked} aria-label="Travar a agulha">{locked ? 'Soltar' : 'Travar'}</button>
  </div>
</div>
```

Estilize os botões "brinquedo" com os tokens (discretos, `--ink-soft`, `:focus-visible`). Eles são opcionais (gestos diretos já funcionam); mantenha-os pequenos.

- [ ] **Step 5: Verificar (manual/visual)**

Não há teste unitário de gesto. Run: `npm run check` → 0/0; `npm run build` → ok. Verificação visual fica na Task 8 (girar/arrastar/abrir/embaralhar/travar no lobby, com som). Confirme que `prefers-reduced-motion` desliga spin/momentum (o `Meter` já guarda).

- [ ] **Step 6: Commit**

```bash
git add src/lib/meter/Meter.svelte src/lib/lobby/PlaygroundDial.svelte
git commit -m "feat(redesign): modo playground concorrente no Meter + PlaygroundDial (no-op, com som/háptico)"
```

---

## Task 4: Chrome — CosmosBackdrop, ModeSwitch, StudioFooter, TopBar

**Files:**
- Create: `src/lib/lobby/CosmosBackdrop.svelte`, `src/lib/lobby/ModeSwitch.svelte`, `src/lib/chrome/StudioFooter.svelte`
- Modify: `src/lib/chrome/TopBar.svelte`

- [ ] **Step 1: `CosmosBackdrop.svelte`**

SVG decorativo `aria-hidden="true"`: 5 arcos concêntricos finos nas cores `--coral/--pink/--sage/--teal/--mustard` (opacidade .13 claro / .24 escuro via `.theme-dark &`), + ~9 estrelas (navy no claro, `#fffdf7` no escuro) + um holofote radial quente. Posição absoluta atrás do herói (`z-index:var(--z-bg)`), `pointer-events:none`. Markup/SVG: use os paths do mock aprovado (`lobby-sinal-themes.html`, `<template id="cosmos">`). **Sem animação de partículas quando `prefers-reduced-motion`.**

- [ ] **Step 2: `ModeSwitch.svelte` (segmentado controlado)**

```svelte
<script lang="ts">
  let { value = $bindable('online') }: { value?: 'local' | 'online' } = $props()
  import { press } from '../audio/clicks'
  function pick(v: 'local'|'online'){ if (v!==value){ value=v; press() } }
</script>
<div class="seg" role="tablist" aria-label="Modo de jogo">
  <button role="tab" aria-selected={value==='local'} class:on={value==='local'} onclick={() => pick('local')}>Local</button>
  <button role="tab" aria-selected={value==='online'} class:on={value==='online'} onclick={() => pick('online')}>Online</button>
</div>
```

CSS: trilho `--sunk`, pílula ativa `--surface` com sombra, texto `--ink`/`--ink-soft`, `:focus-visible`, radius 999px (ver mock).

- [ ] **Step 3: `StudioFooter.svelte`**

Marca `LUANTARASCHI` (Clash) + `Apoiar` + Privacidade/Termos/Contato (links externos/placeholder `<a>` com `rel="noopener"`) + ícones sociais (Discord/Instagram/X/TikTok). Hairline `--hair` acima; cor `--ink-soft`; pontos sociais com cores-acento. Responsivo (encolhe no mobile).

- [ ] **Step 4: Repaginar `TopBar.svelte`**

Adicione um modo/uso "lobby": à esquerda o POV-mark (LED `--red`); à direita o **cluster**: botão **Som** (`game.toggleSound`), botão **Tema** (`game.toggleTheme`), botão **Como jogar** (chama `game.openHowToPlay()` — rota pro tutorial atual), e **chip de Perfil** (foto+nome; só foto no mobile) que dispara abrir o `ProfileSheet` (via callback/prop vinda do Shell — Task 6/7). Mantenha 44px de alvo e `:focus-visible`. Não quebre o uso in-game existente (hambúrguer só em `inRound`).

- [ ] **Step 5: Check + build**

Run: `npm run check` → 0/0; `npm run build` → ok.

- [ ] **Step 6: Commit**

```bash
git add src/lib/lobby/CosmosBackdrop.svelte src/lib/lobby/ModeSwitch.svelte src/lib/chrome/StudioFooter.svelte src/lib/chrome/TopBar.svelte
git commit -m "feat(redesign): chrome do lobby (cosmos backdrop, segmentado, rodapé, top cluster)"
```

---

## Task 5: `Lobby.svelte` (montagem) + Background

**Files:**
- Create: `src/lib/screens/Lobby.svelte`
- Modify: `src/App.svelte` (troca o stub pela tela real)
- Modify: `src/lib/chrome/Background.svelte`

- [ ] **Step 1: `Background.svelte` calmo**

Reduza o backdrop a um fundo por token (`--bone`) + (no lobby) o `CosmosBackdrop` cuida do herói. Remova/atenue rainbow/sunburst/ripple pesados (mantenha grão sutil opcional). `aria-hidden`.

- [ ] **Step 2: Montar `Lobby.svelte`**

Estrutura (alvo visual = mock `lobby-sinal-themes.html`):
- `<section class="hero">`: `<CosmosBackdrop />`, wordmark `POV` (Clash), tagline (Fraunces itálico), `<PlaygroundDial />`.
- `<section class="entry">` (card `--surface`, radius 22, sombra de produto): `<ModeSwitch bind:value={mode} />`; quando `mode==='local'` → um botão **Começar / Montar jogo** que chama `game.openSetup()`; quando `mode==='online'` → campo nome (foto+cor do perfil), campo CÓDIGO (5 caracteres, Space Grotesk), `Criar sala` (`--red`, primário) + `Entrar`. O Criar/Entrar chamam `game.openOnline()` (a tela online cuida de criar/entrar; ou passe a intenção via store — decidir conforme a API de `Online.svelte`).
- `<StudioFooter />`.

Use os tokens e o CSS do mock como referência fiel (espaçamento, sombras, radii). Layout: coluna central no desktop, empilhada no mobile; `clamp()` no dial e na tipografia.

- [ ] **Step 3: Trocar o stub no `App.svelte`**

Importe e renderize `Lobby.svelte` no ramo `game.screen === 'lobby'`.

- [ ] **Step 4: Check + build**

Run: `npm run check` → 0/0; `npm run build` → ok.

- [ ] **Step 5: Commit**

```bash
git add src/lib/screens/Lobby.svelte src/App.svelte src/lib/chrome/Background.svelte
git commit -m "feat(redesign): tela Lobby (herói + dial-playground + entrada + rodapé)"
```

---

## Task 6: `ProfileSheet` (foto + cor + nome) unificado

**Files:**
- Create: `src/lib/profile/ProfileSheet.svelte`
- Modify: `src/lib/chrome/Shell.svelte` (montar o sheet + estado de abertura)
- Modify: `src/lib/screens/online/Online.svelte` (usar o perfil unificado)

- [ ] **Step 1: Ler identidade existente**

Leia `src/lib/online/identity.ts` (`getProfile`/`saveProfile`, `Profile = {name,color,avatarStorageId}`) e o fluxo de upload (`convex/files.ts`, uso no `Profile` online atual).

- [ ] **Step 2: Construir `ProfileSheet.svelte`**

Usa o primitivo `Sheet.svelte` (focus-trap/Escape/restore). Conteúdo: input **nome** (maxlength), seletor de **cor** entre `playerColors` (prévia da cor + contraste do ink), **foto** (upload com fallback iniciais+cor; prévia circular com anel da cor). Salva via `saveProfile` (local) e, quando online, sobe a foto pro storage Convex (reusar a mesma lógica do `Profile` online atual). Botão "Salvar"/"Pronto" com `confirm()`.

- [ ] **Step 3: Montar no `Shell` + abrir pelo cluster**

No `Shell.svelte`, monte `<ProfileSheet bind:open={profileOpen} />` globalmente (como já faz com Pause/Settings). O chip de Perfil do `TopBar` (Task 4) abre `profileOpen=true`.

- [ ] **Step 4: Online usa o perfil unificado**

`Online.svelte`: em vez da sub-tela `Profile` própria, usar o `ProfileSheet`/identidade unificada (se já há perfil, pula direto pra CreateJoin/Lobby). Não quebrar o fluxo online existente.

- [ ] **Step 5: Check + build + smoke local**

Run: `npm run check` → 0/0; `npm run build` → ok. Smoke: abrir o sheet, editar nome/cor/foto, fechar e reabrir → persistiu.

- [ ] **Step 6: Commit**

```bash
git add src/lib/profile/ProfileSheet.svelte src/lib/chrome/Shell.svelte src/lib/screens/online/Online.svelte
git commit -m "feat(redesign): ProfileSheet unificado (foto+cor+nome) acessível do lobby"
```

---

## Task 7: `SettingsSheet` acessível no lobby + idioma

**Files:**
- Modify: `src/lib/chrome/SettingsSheet.svelte`
- Modify: `src/lib/chrome/TopBar.svelte` (ou Shell) para abrir do lobby

- [ ] **Step 1: Tornar Configurações acessível fora do jogo**

Garanta que o `SettingsSheet` possa ser aberto a partir do cluster do lobby (hoje só via PauseSheet in-game). Adicione um caminho de abertura (botão de engrenagem no cluster OU dentro do Perfil — escolha um e seja consistente; recomendo um item no menu do chip de Perfil OU um 4º botão no cluster).

- [ ] **Step 2: Conteúdo**

Controles existentes: **Som** (`toggleSound`), **Vibração** (`toggleHaptics`), **Tema claro/escuro** (`toggleTheme`). Adicione **Idioma**: um seletor com a opção **Português (BR)** selecionada (andaime para i18n futuro; **não** traduzir o app agora). Estilize com tokens; reusa `Sheet`.

- [ ] **Step 3: Check + build + smoke**

Run: `npm run check` → 0/0; `npm run build` → ok. Smoke: abrir Config do lobby, alternar tema (claro↔escuro) e ver a página inteira reagir; alternar som/vibração.

- [ ] **Step 4: Commit**

```bash
git add src/lib/chrome/SettingsSheet.svelte src/lib/chrome/TopBar.svelte
git commit -m "feat(redesign): Configurações acessíveis no lobby + seletor de idioma (PT-BR)"
```

---

## Task 8: Polimento premium + responsivo + a11y + verificação visual

**Files:** vários (ajustes finos), sem novas APIs.

- [ ] **Step 1: Aplicar a skill de design**

Use a skill `frontend-design` para elevar o acabamento do `Lobby`/chrome ao nível premium do mock (sombras, espaçamento, micro-interações de hover/press espelhando a tátil do dial, stagger de entrada, grão sutil). Mantenha a **dose baixa** do cósmico (memória `feedback-minimalist-over-skeuomorphic`).

- [ ] **Step 2: Reduced-motion central**

Garanta que toda animação nova (entrada, cosmos, respiração do dial) respeite `game.reduce`/`prefers-reduced-motion`. (Opcional: consolidar num provider — só se não arriscar regressão.)

- [ ] **Step 3: A11y**

`:focus-visible` em todos os controles; `<button>` reais; labels nos ícones/inputs; sheets com focus-trap; cosmos/grão `aria-hidden`; contraste ink/ink-soft conferido nos dois temas. O dial-playground: rotular o grupo ("roleta de demonstração") e não roubar foco/rota; sem som se `sound` off.

- [ ] **Step 4: Verificação visual (viewport real, dois temas)**

Inicie `npm run dev`. Com um browser headless, capture o **lobby real** em **1440×900** e **390×844**, nos temas **claro e escuro** (toggle pelo cluster). Confirme: nada cortado/sobreposto, dial proeminente e jogável, entrada legível, rodapé visível, sem overflow horizontal. Salve screenshots e **revise você mesmo** (memória `feedback-verify-real-viewport`). Teste a roleta: girar/arrastar/abrir-fechar/embaralhar/travar com som — e **zero** efeito de jogo.

- [ ] **Step 5: Caminhos jogáveis ponta a ponta**

Do lobby: **Local** → `Setup` → uma rodada local roda. **Online** → criar/entrar → cai nas telas online atuais e joga. Confirme que a troca `home`→`lobby` não quebrou nada.

- [ ] **Step 6: Suite + build**

Run: `npm run check` → 0/0; `npm run build` → ok; `npm test` → verde (incl. `tokens` e `lobby.routing`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "polish(redesign): acabamento premium do lobby, a11y, responsivo (claro/escuro) + verificação visual"
```

---

## Task 9: Limpeza + revisão final

- [ ] **Step 1: Remover telas órfãs**

Após confirmar que nada referencia `Home.svelte`/`ModeSelect.svelte` (`Grep`), remova-os. Cheque se `Console.svelte` ficou órfão; remova se sim. Remova tokens/CSS mortos.

- [ ] **Step 2: Revisão final (lean)**

Uma revisão holística do diff `main..feat/lobby-redesign` (segurança não se aplica; foco em: regressões de rota, a11y, responsivo nos dois temas, dead code). Reserve revisor profundo só se algo arriscado (memória `feedback-lean-review-ceremony`).

- [ ] **Step 3: Suite final + build + check**

Run: `npm run check` 0/0; `npm run build` ok; `npm test` verde.

- [ ] **Step 4: Commit + finalizar branch**

```bash
git add -A
git commit -m "chore(redesign): remove Home/ModeSelect órfãos + limpeza"
```

Depois: usar a skill `finishing-a-development-branch` para merge em `main` (após verificação visual nos dois temas).

---

## Self-Review (cobertura do spec)

- §2 direção de arte → Tasks 1 (tokens/fontes), 4 (cosmos), 8 (polimento). ✓
- §3 token system → Task 1. ✓
- §4 IA/lobby/roteamento → Tasks 2 (rota), 5 (montagem). ✓
- §5 roleta-playground (todas as interações) → Task 3. ✓
- §6 Perfil → Task 6. ✓
- §7 Configurações + idioma → Task 7. ✓
- §8 rodapé → Task 4. ✓
- §9 responsivo / §10 som-háptico / §11 a11y → Task 8. ✓
- §13 fora-de-escopo respeitado (telas de jogo/tutorial só roteadas; i18n só PT). ✓
- §15 critérios de sucesso → Tasks 8 e 9. ✓

**Consistência de tipos:** `playerColors`/`scoreColors`/`accent` (Task 1) usados em 6/7; `Screen='lobby'…` (Task 2) usado em App/Online; props do `Meter` (`playground`,`shuffleSpin`,`locked`) (Task 3) consumidas pelo `PlaygroundDial`; `ModeSwitch` value `'local'|'online'` (Task 4) usado no `Lobby` (Task 5). Sem placeholders proibidos.
