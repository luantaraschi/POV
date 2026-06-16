# POV — Telas da partida (Plano 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the local cooperative game playable end-to-end — Home → Montar jogadores → (loop: Vez de quem → Medidor → Placar) → Fim de jogo — by adding the screens and the screen-state machine on top of the Plano 1 foundation.

**Architecture:** A thin **app shell** (theme/sound lifted to the store, shared `Background` + `TopBar`, themed root) renders the current screen by `game.screen`. New screen components live in `src/lib/screens/`. The store gains the navigation/lifecycle actions. `InRound` is slimmed to the round content (the shell owns chrome) and, after reveal, hands off to the Scoreboard. Visual components reproduce the **approved mockups** with real tokens/components.

**Tech Stack:** Svelte 5 runes + Vite + TS. Logic tested with Vitest; UI verified with `npm run check` (0/0) + `npm run build` + browser smoke.

**Reference mockups (the visual contract, persisted):** `.superpowers/brainstorm/9366-1781587486/content/` → `home-directions.html` (direction A), `montar-jogadores.html` + `montar-jogadores-desktop.html`, `vez-de-quem.html`, `placar-entre-rodadas.html`, `fim-de-jogo.html`. Spec: `docs/superpowers/specs/2026-06-16-telas-interface-local-design.md`.

**Design skills:** screen tasks MUST invoke the relevant design skills (frontend-design / frontend-ui-engineering / make-interfaces-feel-better) to hit production quality; deeper motion/sound/a11y polish is Plano 3.

**Conventions:** lean review (rely on implementer typecheck+build+self-review for routine UI; deep review for the shell refactor, InRound rewire, and the final smoke). Bar = 0 errors/0 warnings. Commit per task with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer. Work on a new branch `feat/telas-partida` off `main`.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `src/lib/game/store.svelte.ts` | + theme/sound state, + nav/lifecycle actions | modify |
| `src/lib/game/rules.ts` | + `isLastRound` helper (tested) | modify |
| `src/lib/game/rules.test.ts` | + tests for end-of-game boundary | modify |
| `src/lib/ui/Shell.svelte` | themed root: Background + TopBar + screen slot | create |
| `src/lib/ui/PlayerToken.svelte` | colored player chip + luminance-based initial | create |
| `src/App.svelte` | router: `game.screen` → screen component, inside Shell | modify |
| `src/lib/screens/Home.svelte` | abertura (decorative Meter hero) | create |
| `src/lib/screens/Setup.svelte` | montar jogadores | create |
| `src/lib/screens/RoundIntro.svelte` | vez de quem + privacy handoff | create |
| `src/lib/screens/InRound.svelte` | slim to round content; reveal → scoreboard | modify |
| `src/lib/screens/Scoreboard.svelte` | placar entre rodadas | create |
| `src/lib/screens/GameOver.svelte` | fim de jogo | create |

**Order:** store/rules + Shell + PlayerToken first (foundation), then InRound slim+rewire, then screens (Home, Setup, RoundIntro, Scoreboard, GameOver), then router + smoke.

---

## Task 0: Branch

- [ ] **Step 1:** `git checkout main && git checkout -b feat/telas-partida`
- [ ] **Step 2:** Confirm baseline green: `npm run check` (0/0), `npm test` (21 green), `npm run build` (OK).

---

## Task 1: Store — nav/lifecycle actions + theme/sound (TDD where pure)

**Files:** `src/lib/game/rules.ts` (+`isLastRound`), `src/lib/game/rules.test.ts` (+tests), `src/lib/game/store.svelte.ts` (modify)

- [ ] **Step 1 — rules: failing test.** Append to `src/lib/game/rules.test.ts`:
```ts
import { isLastRound } from './rules'
describe('fim de jogo', () => {
  test('isLastRound true só na última rodada (0-based)', () => {
    expect(isLastRound(7, 8)).toBe(true)   // round index 7 of 8 total
    expect(isLastRound(6, 8)).toBe(false)
    expect(isLastRound(0, 2)).toBe(false)
    expect(isLastRound(1, 2)).toBe(true)
  })
})
```
- [ ] **Step 2 — run `npm test` → fail** (no `isLastRound`).
- [ ] **Step 3 — implement** in `src/lib/game/rules.ts` (append):
```ts
export const isLastRound = (roundIndex: number, totalRounds: number) => roundIndex >= totalRounds - 1
```
- [ ] **Step 4 — run `npm test` → 22 green.**
- [ ] **Step 5 — extend the store.** In `src/lib/game/store.svelte.ts`:
  - Change initial screen: `let screen = $state<Screen>('home')`.
  - Add theme/sound/haptics state lifted from InRound (with localStorage init + persistence) and `reduce`:
```ts
import { setSoundEnabled } from '../audio/clicks'

function initTheme(): 'dark' | 'light' {
  if (typeof localStorage !== 'undefined') {
    const s = localStorage.getItem('pov-theme'); if (s === 'dark' || s === 'light') return s
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}
// inside makeStore():
let theme = $state<'dark' | 'light'>(initTheme())
let sound = $state(true)
// getters/actions:
get theme() { return theme },
get sound() { return sound },
toggleTheme() { theme = theme === 'dark' ? 'light' : 'dark'; if (typeof localStorage !== 'undefined') localStorage.setItem('pov-theme', theme) },
toggleSound() { sound = !sound; setSoundEnabled(sound) },
```
  - Add navigation/lifecycle actions (import `isLastRound`):
```ts
goHome() { screen = 'home' },
openSetup() { screen = 'setup' },
setupGame(players: Player[], voltas: 1 | 2 | 3, deck: 'classico' = 'classico') {
  config = { players, voltas, deck }
  roundIndex = 0; results = []
  target = drawTarget(); value = 12 * STEP_P; cardIndex = 0; phase = 'hidden'
  screen = 'roundIntro'
},
beginPeek() { phase = 'peek'; screen = 'inRound' },   // called after privacy confirm in RoundIntro
toScoreboard() { screen = 'scoreboard' },             // called by InRound after reveal lock
advance() {                                           // Scoreboard "Próxima rodada"
  if (isLastRound(roundIndex, this.totalRounds)) { screen = 'gameOver' }
  else { this.nextRound(); screen = 'roundIntro' }
},
playAgain() { roundIndex = 0; results = []; target = drawTarget(); value = 12 * STEP_P; cardIndex = 0; phase = 'hidden'; screen = 'roundIntro' },
changePlayers() { screen = 'setup' },
```
  - Keep existing `recordRound`/`nextRound`. `nextRound()` already does target/value/cardIndex/phase reset (used by `advance`).
- [ ] **Step 6 — verify** `npm run check` (0/0), `npm test` (22 green), `npm run build` (OK).
- [ ] **Step 7 — commit** `feat: store nav/lifecycle actions + theme/sound (isLastRound testado)`.

**DEEP REVIEW** (logic correctness): verify `advance` boundary (last round → gameOver, else nextRound+roundIntro), `setupGame` resets everything, theme/sound persistence.

---

## Task 2: Shell.svelte (themed root: Background + TopBar) + slim InRound

**Files:** Create `src/lib/ui/Shell.svelte`; Modify `src/lib/screens/InRound.svelte`. **(Riskiest Plano 2 task — deep review + smoke.)**

Today `InRound.svelte` owns the themed `.scene`, the `<Background>`, the `<TopBar>`, and local `theme`/`sound`. For multiple screens we lift that chrome to a shell so EVERY screen is themed and shares one TopBar/Background.

- [ ] **Step 1 — create `src/lib/ui/Shell.svelte`:**
```svelte
<script lang="ts">
  import Background from './Background.svelte'
  import TopBar from './TopBar.svelte'
  import { game } from '../game/store.svelte'
  let { dim = false, children }: { dim?: boolean; children?: import('svelte').Snippet } = $props()
  // theme-color chrome + reduced-motion live region can stay per-screen or here later
</script>

<div class="scene" class:theme-dark={game.theme === 'dark'} class:theme-light={game.theme === 'light'}>
  <Background theme={game.theme} {dim} />
  <TopBar theme={game.theme} sound={game.sound} onToggleTheme={() => game.toggleTheme()} onToggleSound={() => game.toggleSound()} />
  <main class="screen-main">{@render children?.()}</main>
</div>

<style>
  /* MOVE the `.scene` rule from InRound here (position:relative; min-height:100dvh; flex column; overflow:hidden; background var(--bg-base); color var(--text); transition). */
  .screen-main { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; }
</style>
```
- [ ] **Step 2 — slim `InRound.svelte`:** remove its `.scene` wrapper, the `<Background>`, the `<TopBar>` (and the local `theme`/`sound`/`toggleTheme`/`toggleSound`/`initTheme` + the theme-color/`pov-theme` `$effect`s — these now live in the store/Shell). InRound renders ONLY the round content (the `<Console>` with Meter + wave-band + card-dock, the hint/result, the footer primary action, the dev drawer, toast, PrivacyHandoff stays? — NO: privacy moves to RoundIntro in Task 4; for now keep InRound compiling). Read the current file and keep the round-specific logic (reveal beats, `roundSeed`, `lockGestures`, `treatment`, toast, the guided `advancePrimary`). Pass `light={game.theme === 'light'}` to Meter from `game.theme`.
- [ ] **Step 3 — App temporarily renders InRound in the shell to verify parity:** set `App.svelte` to:
```svelte
<script lang="ts">
  import { game } from './lib/game/store.svelte'
  import Shell from './lib/ui/Shell.svelte'
  import InRound from './lib/screens/InRound.svelte'
</script>
<Shell><InRound /></Shell>
```
  and TEMPORARILY set store initial `screen` back to `'inRound'`? No — keep `screen='home'` from Task 1 but for THIS task's smoke, render `<InRound/>` unconditionally inside Shell to confirm the chrome lift didn't regress the round. (The real router comes in Task 8.)
- [ ] **Step 4 — verify** `npm run check` (0/0), `npm run build`, and a **browser smoke**: the round still renders with TopBar (theme/sound work from the store now) + Background + console, plays through peek→guessing→reveal, no console errors, both themes.
- [ ] **Step 5 — commit** `refactor: Shell.svelte owns theme/Background/TopBar; InRound slimmed to round content`.

**DEEP REVIEW + SMOKE**: theme/sound now driven by store; no duplicate `.scene`/Background/TopBar; round behavior identical.

---

## Task 3: PlayerToken.svelte

**Files:** Create `src/lib/ui/PlayerToken.svelte`.

- [ ] **Step 1 — implement** (luminance-based initial color, reusing the approach from `Card.svelte`'s `ink()`):
```svelte
<script lang="ts">
  import { palette, type ColorName } from '../design/tokens'
  type Props = { color: 'coral'|'piscina'|'lilas'|'menta'|'mostarda'|'rosa'|'laranja'|'petroleo'; name: string; size?: number; ring?: boolean }
  let { color, name, size = 30, ring = false }: Props = $props()
  const hex = $derived(palette[color as ColorName])
  function ink(h: string): string {
    const c = h.replace('#',''); if (c.length < 6) return '#11233f'
    const ch = (i: number) => parseInt(c.slice(i, i+2), 16) / 255
    const lin = (v: number) => (v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4))
    const L = 0.2126*lin(ch(0)) + 0.7152*lin(ch(2)) + 0.0722*lin(ch(4))
    return L < 0.46 ? '#f7f1e3' : '#11233f'
  }
  const initial = $derived((name.trim()[0] || '?').toUpperCase())
</script>
<span class="tok" class:ring style:--bg={hex} style:--fg={ink(hex)} style:width="{size}px" style:height="{size}px" style:font-size="{size*0.46}px" role="img" aria-label={name}>{initial}</span>
<style>
  .tok { display:grid; place-items:center; border-radius:50%; background:var(--bg); color:var(--fg); font-family:'Bricolage Grotesque',sans-serif; font-weight:800; flex:none; line-height:1; }
  .tok.ring { box-shadow: 0 0 0 4px color-mix(in srgb, var(--bg) 30%, transparent); }
</style>
```
- [ ] **Step 2 — verify** `npm run check` (0/0), `npm run build`.
- [ ] **Step 3 — commit** `feat: PlayerToken.svelte (ficha + inicial por luminância)`.

---

## Task 4: Home.svelte (Abertura — direction A)

**Files:** Create `src/lib/screens/Home.svelte`. **Match mockup `home-directions.html` card A ("Medidor herói").**

- [ ] **Step 1 — invoke the `frontend-design` skill** for aesthetic guidance, then implement `Home.svelte` rendered INSIDE the Shell (App provides Shell). Contract:
  - A **decorative** Meter as the hero: `<Meter decorative phase="reveal" showTarget target={someStaticTarget} value={someStaticValue} treatment="hibrido" light={game.theme==='light'} />` wrapped in `<Console>` (so it reads as the object on the board). Pick fixed pleasant target/value (e.g. target=15*STEP_P, value≈13*STEP_P) so the dial looks composed and "on target".
  - `<Logo size="46px" />` (or larger) + tagline (Fraunces italic): "Acerte o ponto de vista dos seus amigos."
  - Primary CTA "Jogar" → `game.openSetup()` (coral `--pov-coral-cta`, depth, `:active`, `:focus-visible`). On first tap also call `unlockAudio()` + `press()` from `../audio/clicks`.
  - (Defer "Como jogar" link to Plano 3.)
  - Layout: mobile = centered column; desktop (≥900px) = same composition, larger, more breathing room. Use existing tokens (`--sp-*`, `--r-*`, `--fs-*`, fonts).
  - a11y: CTA is a real `<button>`, ≥44px; decorative Meter announces nothing (it's `decorative`); tagline not a heading-level issue.
- [ ] **Step 2 — verify** `npm run check` (0/0), `npm run build`. Smoke deferred to Task 8.
- [ ] **Step 3 — commit** `feat: Home.svelte (abertura, medidor herói decorativo)`.

---

## Task 5: Setup.svelte (Montar jogadores)

**Files:** Create `src/lib/screens/Setup.svelte`. **Match `montar-jogadores.html` (mobile) + `montar-jogadores-desktop.html` (desktop).**

- [ ] **Step 1 — invoke `frontend-design`/`frontend-ui-engineering`, then implement.** Contract:
  - Local draft state: `players: {id,name,color}[]` starting with 2 default players; a fixed color order `['coral','piscina','lilas','menta','mostarda','rosa','laranja','petroleo']` assigned by index. Add (up to 8) / remove (down to 2). Editable names (`<input>`; empty → placeholder "Jogador N"). Use `<PlayerToken>` for each chip; mark `players[0]` "1º Dono".
  - **Duração** via `<Segmented options={[{id:'curta',label:'Curta'},{id:'media',label:'Média'},{id:'longa',label:'Longa'}]} value={voltasId} onChange={...} ariaLabel="Duração" />` + computed line "N voltas · cada um é Dono N× · {voltas×players.length} rodadas".
  - **Baralho**: "Clássico" active; "Picante 🔒"/"Família 🔒" disabled chips (visual only).
  - CTA "Começar partida · {n} jogadores" → `game.setupGame(draft, voltasNumber)` (disabled when <2). `dock()` on add.
  - Header: back chevron → `game.goHome()`; "Cooperativo" badge.
  - Layout: mobile = single column, **players list scrollable (`overflow-y:auto`) under a sticky footer CTA** (test 8 players on short viewport, padding-bottom = footer+safe-area); desktop (≥900px) = `<Console>` centered, players in a **2-col grid**, options+CTA in a side panel, checkered band at base.
  - a11y: inputs labeled; remove buttons have aria-label "Remover {name}"; CTA ≥44px; segmented reuses its built-in role=group/aria-pressed.
- [ ] **Step 2 — verify** `npm run check` (0/0), `npm run build`.
- [ ] **Step 3 — commit** `feat: Setup.svelte (montar jogadores, responsivo)`.

---

## Task 6: RoundIntro.svelte (Vez de quem) + privacy handoff

**Files:** Create `src/lib/screens/RoundIntro.svelte`. **Match `vez-de-quem.html`.**

- [ ] **Step 1 — implement.** Contract:
  - Reads the store: "Rodada {roundIndex+1} de {totalRounds}", rotation dots (filled for indices < donoIndex done-this-volta — simplest: dot i filled if `i < (roundIndex % players.length)`, ring on `donoIndex`), big `<PlayerToken color={game.dono.color} name={game.dono.name} size={84} ring />` + name + "é o Dono do POV", the scale card `<Card left={game.card.left} right={game.card.right} leftColor=… rightColor=… />` (reuse the cardColors lookup or pass palette colors), CTA "Passar o POV pra {game.dono.name}".
  - CTA opens `<PrivacyHandoff open={showPrivacy} donoName={game.dono.name} onConfirm={() => { game.beginPeek() }} onCancel={() => showPrivacy=false} />` (local `showPrivacy` state). On confirm → `game.beginPeek()` (sets phase=peek, screen=inRound).
  - Layout: mobile column; desktop (≥900px) `<Console>` 2-col (Dono | card+CTA), checkered band.
  - a11y: PlayerToken aria-label; dots have aria-labels (done/current/upcoming); reduced-motion → no glow pulse on the ring.
- [ ] **Step 2 — verify** check/build.
- [ ] **Step 3 — commit** `feat: RoundIntro.svelte (vez de quem + privacy handoff)`.

---

## Task 7: InRound rewire — reveal → Scoreboard

**Files:** Modify `src/lib/screens/InRound.svelte`. **(Behavior change — deep review.)**

InRound is now ENTERED at `phase='peek'` (from RoundIntro's privacy confirm). Its flow shrinks to peek → guessing → reveal → hand off to Scoreboard.

- [ ] **Step 1 — adjust the guided flow.** In InRound's `advancePrimary` (and labels/hints):
  - Remove the `'hidden'` case (RoundIntro owns hand-off now). The first state InRound sees is `peek`.
  - `peek` → primary "Já memorizei — esconder" → `game.phase = 'guessing'`.
  - `guessing` → primary "Travar palpite" → `thunk(); game.recordRound(scoreFor(game.value, game.target)); game.phase = 'reveal'`.
  - `reveal` → after the reveal beat, primary becomes **"Ver placar"** → `game.toScoreboard()`. The **disc-spin gesture** in reveal (`onDiscSpin`/`handleDiscSpin`) must NOT start a new round locally anymore — it should also call `game.toScoreboard()` (resolves the spec's gesture/scoreboard conflict). Remove the old `setupNewRound`/`novaRodada` local round-restart path (the store owns round lifecycle now).
  - The cover-settle gesture (`handleCoverSettle`): peek close → guessing stays (toast), as before.
- [ ] **Step 2 — remove now-dead local round-restart code** (`setupNewRound`, `novaRodada` if only used for the in-InRound loop). Keep reveal-beat logic, `roundSeed`, `lockGestures`, `treatment`, toast.
- [ ] **Step 3 — verify** check (0/0), build, and reason: locking the guess records exactly one result then reveals; "Ver placar" / disc-spin both go to scoreboard; reduced-motion users use the button (gesture is a redundant shortcut).
- [ ] **Step 4 — commit** `refactor: InRound reveal hands off to Scoreboard (no local round restart)`.

**DEEP REVIEW**: exactly one `recordRound` per round; no path skips the scoreboard; reduced-motion has a button path.

---

## Task 8: Scoreboard.svelte (Placar entre rodadas)

**Files:** Create `src/lib/screens/Scoreboard.svelte`. **Match `placar-entre-rodadas.html`.**

- [ ] **Step 1 — implement.** Contract (reads store + `scoring`):
  - The just-finished result = `game.results[game.results.length-1]`. Callout chip "+{score}" colored `tierVar(score)` + a phrase from `tierCopy[score]` (pick deterministically, e.g. by `roundIndex`). Detail "{score} pontos · {gap} casas".
  - "Sintonia do grupo": `game.groupScore` + bar `groupScore / game.maxSoFar` (NOT maxTotal). Label "de {maxSoFar} possíveis".
  - History tiles: one per played round (from `game.results`) colored by tier, the latest ringed; upcoming rounds as empty tiles up to `game.totalRounds`.
  - "Próximo Dono: {game.nextDono?.name}" with a small `<PlayerToken>`.
  - CTA: if `isLastRound(game.roundIndex, game.totalRounds)` → "Ver resultado", else "Próxima rodada" → `game.advance()`. (Optional spin-hint text; the actual spin gesture lives in InRound's reveal, not here.)
  - Layout: mobile column; desktop (≥900px) `<Console>` 2-col, checkered band.
  - a11y: a single `aria-live="polite"` announcing the consolidated result ("Rodada concluída, +3 pontos, sintonia X%"), NOT the count-up; decorative tiles `aria-hidden` with a text equivalent.
- [ ] **Step 2 — verify** check/build.
- [ ] **Step 3 — commit** `feat: Scoreboard.svelte (placar entre rodadas)`.

---

## Task 9: GameOver.svelte (Fim de jogo)

**Files:** Create `src/lib/screens/GameOver.svelte`. **Match `fim-de-jogo.html` (pôster mode).**

- [ ] **Step 1 — invoke `frontend-design`, then implement.** Contract:
  - Emblem: concentric palette rings (SVG) with `game.groupScore` / `game.maxTotal` centered. Selo = `game.selo` (big, Bricolage) + "{game.sintoniaPct}% de sintonia" (note: "de sintonia", per spec, to avoid the "Em boa sintonia" name clash). (For the final %, sintoniaPct should use maxTotal — confirm the store's `sintoniaPct` getter or compute `sintoniaPct(groupScore, maxTotal)` locally for the final screen.)
  - Full history tiles (all rounds). A light highlight stat (e.g. "Mais afiados quando {dono} deu as dicas") computed from results, only if ≥1 round per player.
  - Sunburst dominant (the Shell's Background is subtle; GameOver can render its OWN stronger sunburst or pass a prop — simplest: a local stronger sunburst layer scoped to this screen). **Confetti + bloom + `celebrate()`** reused, guarded by reduced-motion. A scrim/veil behind the hero text to guarantee ≥4.5:1 over the bright sunburst.
  - CTAs: "Jogar de novo" → `game.playAgain()`; "Trocar jogadores · Início" → `game.changePlayers()`.
  - a11y: emblem `aria-hidden` + a text summary; reduced-motion disables confetti/bloom; CTAs ≥44px and labeled.
- [ ] **Step 2 — verify** check/build.
- [ ] **Step 3 — commit** `feat: GameOver.svelte (fim de jogo, pôster + celebração)`.

---

## Task 10: App router + full-loop smoke + final review

**Files:** Modify `src/App.svelte`.

- [ ] **Step 1 — wire the router** inside the Shell:
```svelte
<script lang="ts">
  import { game } from './lib/game/store.svelte'
  import Shell from './lib/ui/Shell.svelte'
  import Home from './lib/screens/Home.svelte'
  import Setup from './lib/screens/Setup.svelte'
  import RoundIntro from './lib/screens/RoundIntro.svelte'
  import InRound from './lib/screens/InRound.svelte'
  import Scoreboard from './lib/screens/Scoreboard.svelte'
  import GameOver from './lib/screens/GameOver.svelte'
  const dim = $derived(game.screen === 'inRound' && game.phase === 'reveal')
</script>
<Shell {dim}>
  {#if game.screen === 'home'}<Home />
  {:else if game.screen === 'setup'}<Setup />
  {:else if game.screen === 'roundIntro'}<RoundIntro />
  {:else if game.screen === 'inRound'}<InRound />
  {:else if game.screen === 'scoreboard'}<Scoreboard />
  {:else if game.screen === 'gameOver'}<GameOver />
  {/if}
</Shell>
```
  (`howToPlay` screen is added in Plano 3; until then Home doesn't link to it.)
- [ ] **Step 2 — verify** `npm run check` (0/0), `npm run build`, `npm test` (22 green).
- [ ] **Step 3 — FULL browser smoke** (deep): Home → Jogar → Setup (add a 3rd player, name them, pick Média) → Começar → RoundIntro shows Dono + card → Passar → privacy → confirm → InRound peek → memorizei → guessing → drag/lock → reveal → Ver placar → Scoreboard (+score, sintonia bar, next Dono) → Próxima rodada → next RoundIntro (Dono rotated) … play through all rounds → GameOver (emblem, selo, celebration) → Jogar de novo resets. Verify both themes, reduced-motion (no confetti), zero console errors. Screenshot each screen.
- [ ] **Step 4 — commit** `feat: App router for the full local game loop`.
- [ ] **Step 5 — final holistic review** (whole `main..HEAD` diff): screen-machine completeness (every transition reachable, no dead-end), store consumed correctly, a11y/responsive per spec, no regression of the round. Then `finishing-a-development-branch`.

---

## Self-review (spec coverage)
- §4 screen machine → Tasks 1 (actions) + 10 (router) ✓ ; privacy cancel branch → Task 6 ✓ ; advance/last-round → Tasks 1,8 ✓ ; playAgain/changePlayers reset → Tasks 1,9 ✓
- §7.1 Home (decorative Meter) → Task 4 ✓ ; §7.3 Setup → Task 5 ✓ ; §7.4 RoundIntro+privacy → Task 6 ✓ ; §7.5 InRound rewire → Task 7 ✓ ; §7.6 Scoreboard (maxSoFar) → Task 8 ✓ ; §7.7 GameOver (maxTotal, % "de sintonia", celebrate) → Task 9 ✓
- §8 Shell/theme lift + PlayerToken → Tasks 2,3 ✓ ; §9 responsive (≥900px 2-col) → each screen task ✓ ; §12 a11y (PlayerToken luminance, live region, ≥44px, reduced-motion) → each task ✓
- **Deferred to Plano 3 (by design):** Como jogar tutorial + the `howToPlay` screen, Settings/Pause sheets, and the deep motion/sound/interaction polish pass.
