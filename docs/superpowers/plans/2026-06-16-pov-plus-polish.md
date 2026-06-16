# POV — Plus & Polish (Plano 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** Finish the local cooperative game — add the "Como jogar" tutorial and the Configurações/Pausa sheets, clear the deferred a11y items, and run a design-skill polish pass (screen transitions, micro-interactions, sound, final a11y/UX audit) so it feels production-premium.

**Architecture:** Builds on Planos 1+2 (on `main`). New `howToPlay` screen via the existing router + a `returnScreen` in the store; `Sheet`-based `SettingsSheet`/`PauseSheet` whose open-state lives in `Shell`, with the Pause opened from a TopBar menu button (in-game screens only) and overlay stacking (Esc closes the top). Polish tasks invoke the design skills and apply concrete changes; the bar stays 0/0 + build + smoke.

**Tech Stack:** Svelte 5 runes + Vite + TS. Vitest for logic. UI = check + build + browser smoke.

**Reference mockups:** `.superpowers/brainstorm/9366-1781587486/content/como-jogar.html`, `sheets-config-pausa.html`. Spec: `docs/superpowers/specs/2026-06-16-telas-interface-local-design.md` §7.2/§7.8/§12.

**Design skills (invoke in the relevant tasks):** frontend-design, make-interfaces-feel-better, interaction-design, animate / transitions-dev / mastering-animate-presence, generating-sounds-with-ai, web-design-guidelines, 12-principles-of-animation / to-spring-or-not-to-spring (motion audits).

**Conventions:** lean review (implementer self-verifies; deeper review on the Shell/overlay-stacking task and the final audit); 0/0 bar; commit per task with the `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>` trailer. Branch `feat/telas-polish` off `main`.

---

## File structure

| File | Responsibility | Action |
|---|---|---|
| `src/lib/game/store.svelte.ts` | + haptics, + reduce (single matchMedia source), + returnScreen/openHowToPlay/closeHowToPlay | modify |
| `src/lib/screens/InRound.svelte` | a11y: move aria-live off the count-up | modify |
| `src/lib/ui/Background.svelte` | reduced-motion guard on `.dim-veil` | modify |
| `src/lib/screens/HowToPlay.svelte` | tutorial (3 steps) | create |
| `src/lib/screens/Home.svelte` | add "Como jogar" link | modify |
| `src/App.svelte` | route `howToPlay` | modify |
| `src/lib/ui/SettingsSheet.svelte` | settings overlay (uses Sheet) | create |
| `src/lib/ui/PauseSheet.svelte` | pause menu (uses Sheet) | create |
| `src/lib/ui/TopBar.svelte` | menu button (when onMenu provided) | modify |
| `src/lib/ui/Shell.svelte` | owns overlay state; renders sheets; passes onMenu in-game | modify |
| `src/lib/transitions/` or screen CSS | screen cross-fade (reduced-motion aware) | create/modify (Task 4) |

---

## Task 0: Branch
- [ ] `git checkout main && git checkout -b feat/telas-polish`; verify baseline `npm run check` (0/0), `npm test` (22 green), `npm run build` (OK).

---

## Task 1: Store (haptics + reduce + howToPlay nav) + the two deferred a11y fixes

**Files:** `store.svelte.ts`, `InRound.svelte`, `Background.svelte`.

- [ ] **Step 1 — store additions.** In `src/lib/game/store.svelte.ts`:
  - Import `setHapticsEnabled` from `../audio/clicks`. Add `let haptics = $state(true)` + `get haptics(){return haptics}` + `toggleHaptics(){ haptics = !haptics; setHapticsEnabled(haptics) }`.
  - Add a single reduced-motion source:
```ts
let reduce = $state(false)
if (typeof window !== 'undefined' && window.matchMedia) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
  reduce = mq.matches
  mq.addEventListener('change', () => (reduce = mq.matches))
}
// getter:
get reduce() { return reduce },
```
  - Add `howToPlay` navigation with a return target:
```ts
let returnScreen = $state<Screen>('home')
// actions:
openHowToPlay() { returnScreen = screen; screen = 'howToPlay' },
closeHowToPlay() { screen = returnScreen },
```
  - (`returnScreen` lets "Como jogar" return to Home or to the in-game screen it was opened from.)
- [ ] **Step 2 — a11y fix in `InRound.svelte`:** the reveal result currently has `aria-live="polite"` on the visible `.result` element that wraps the animating count-up (`displayScore`). Move the live announcement to a SEPARATE `sr-only` element that contains ONLY the final consolidated sentence (e.g. `{revealScore} pontos, {gapLabel}`), and remove `aria-live` from the visible/animating `.result` (mark the visible count-up `aria-hidden="true"`). Match the pattern Scoreboard/GameOver already use.
- [ ] **Step 3 — a11y fix in `Background.svelte`:** wrap the `.dim-veil { transition: opacity .55s ease }` so the transition is removed under reduced motion: add `@media (prefers-reduced-motion: reduce) { .dim-veil { transition: none } }`.
- [ ] **Step 4 — verify** `npm run check` (0/0), `npm test` (22 green), `npm run build` (OK).
- [ ] **Step 5 — commit** `feat: store haptics/reduce/howToPlay nav + a11y (live region, dim-veil reduced-motion)`.

---

## Task 2: HowToPlay.svelte (tutorial) + router + Home link

**Files:** create `src/lib/screens/HowToPlay.svelte`; modify `src/App.svelte`, `src/lib/screens/Home.svelte`. **Match `como-jogar.html`.**

- [ ] **Step 1 — build `HowToPlay.svelte`** (rendered in Shell; shown when `game.screen === 'howToPlay'`). Contract:
  - 3 steps (segredo → dica → palpite) with the mini-illustrations from the mockup (reuse a small decorative `<Meter decorative .../>` OR simplified inline SVG for steps 1 & 3; a `<Card>` + a speech bubble for step 2). Use real tokens/components.
  - **Mobile = carousel:** one step visible, `<button>` dots (aria-label "Passo N de 3", aria-current), ArrowLeft/ArrowRight change step, a `<div aria-live="polite">` announces "Passo N de 3", a "Próximo ›" button; last step shows "Entendi — bora jogar". NO auto-advance when `game.reduce`.
  - **Desktop (≥900px) = 3 cards side by side**, with "Entendi — bora jogar" below.
  - Header: title "Como jogar" + a close `<button aria-label="Fechar">×</button>` (≥44px hit-area) → `game.closeHowToPlay()`.
  - "Entendi — bora jogar": if opened from Home → `game.openSetup()`; else (opened from Pause / in-game) → `game.closeHowToPlay()`. (Simplest: always `game.closeHowToPlay()` returns to where you came from; on Home that returns to Home — acceptable. OR check `game.returnScreen === 'home'` → openSetup. Pick the latter for a nicer Home flow.)
  - a11y: dots are real buttons; keyboard arrows; close ≥44px; reduced-motion no auto-advance; the illustrations `aria-hidden`.
- [ ] **Step 2 — router:** add to `src/App.svelte` switch: `{:else if game.screen === 'howToPlay'}<HowToPlay />`.
- [ ] **Step 3 — Home link:** in `src/lib/screens/Home.svelte`, add a secondary text link/button **"Como jogar"** below the "Jogar" CTA → `game.openHowToPlay()` (real `<button>`, focus-visible, ≥44px hit area).
- [ ] **Step 4 — verify** check (0/0), build, test (22).
- [ ] **Step 5 — commit** `feat: HowToPlay.svelte tutorial + Home link + router`.

---

## Task 3: SettingsSheet + PauseSheet (Sheet-based) + TopBar menu + Shell overlay state

**Files:** create `SettingsSheet.svelte`, `PauseSheet.svelte`; modify `TopBar.svelte`, `Shell.svelte`. **Match `sheets-config-pausa.html`. DEEP REVIEW (overlay stacking/focus).**

- [ ] **Step 1 — `SettingsSheet.svelte`** (uses `Sheet variant="..."`). Contract:
  - Props `{ open, onClose }`. Renders inside `<Sheet open={open} onClose={onClose} ariaLabel="Configurações" variant={...}>`.
  - Rows: **Som** (`<button role="switch" aria-checked={game.sound}>` pill → `game.toggleSound()`), **Vibração** (`role="switch" aria-checked={game.haptics}` → `game.toggleHaptics()`), **Movimento reduzido** (`role="switch" aria-checked={game.reduce}` — note: this reflects the system pref; toggling it is an app override → add a store `reduceOverride` if you want it user-settable, OR make it read-only reflecting the system and labeled "(do sistema)"; choose read-only reflect to avoid scope creep, and SAY so), **Tema** via `<Segmented options={[{id:'dark',label:'Escuro'},{id:'light',label:'Claro'}]} value={game.theme} onChange={...} ariaLabel="Tema" />` (calls `game.toggleTheme()` when the choice differs).
  - Footer microcopy "POV v0.1".
  - Pill switch = a real `<button role="switch" aria-checked>` styled as a track+knob, ≥44px, focus-visible.
- [ ] **Step 2 — `PauseSheet.svelte`** (uses Sheet). Contract:
  - Props `{ open, onClose, onSettings, onHowToPlay }`. Title "Pausado". Buttons: **Retomar** (coral → onClose), **Como jogar** (→ onHowToPlay), **Configurações** (→ onSettings), **Reiniciar partida** (→ `game.playAgain()` then onClose), **Sair pro início** (danger tone → a light confirm, then `game.goHome()`). All real `<button>` ≥44px, focus-visible.
- [ ] **Step 3 — `TopBar.svelte`:** when `onMenu` is provided, render a menu (⋯) icon `<button aria-label="Menu">` before the theme/sound icons → calls `onMenu()`. ≥44px, focus-visible. (When `onMenu` is undefined, render nothing extra — Home/Setup stay menu-less.)
- [ ] **Step 4 — `Shell.svelte`:** own overlay state `let showPause = $state(false); let showSettings = $state(false)`. Pass `onMenu` to TopBar ONLY on in-game screens: `onMenu={['roundIntro','inRound','scoreboard'].includes(game.screen) ? () => (showPause = true) : undefined}`. Render `<PauseSheet open={showPause} onClose={() => showPause=false} onSettings={() => { showSettings = true }} onHowToPlay={() => { showPause = false; game.openHowToPlay() }} />` and `<SettingsSheet open={showSettings} onClose={() => showSettings=false} />`. **Stacking:** Settings opens ON TOP of Pause (both rendered; Settings's Sheet has higher stacking/last in DOM); Esc closes the topmost (Sheet's own Esc handler closes whichever has focus — verify Settings closes first, Pause remains). Closing Pause via Como jogar navigates away (game screen change unmounts the sheets cleanly).
- [ ] **Step 5 — verify** check (0/0), build, test. 
- [ ] **Step 6 — commit** `feat: Settings + Pause sheets (Sheet-based) + TopBar menu + Shell overlay state`.

**DEEP REVIEW:** focus-trap works in each sheet; Esc closes the top sheet only; switches have role=switch/aria-checked; Pause only reachable in-game; no focus leak; reduced-motion respected.

---

## Task 4: Polish pass — screen transitions + micro-interactions + sound

**Files:** `App.svelte`/`Shell.svelte` (transitions), various screens/components (micro-interactions), `clicks.ts` usage. **Invoke the design skills.**

- [ ] **Step 1 — screen transitions.** Invoke `animate` (and/or `transitions-dev` / `to-spring-or-not-to-spring`). Add a subtle cross-fade (or slide-up) between screens in the router: wrap the screen in a keyed block keyed by `game.screen` with a Svelte `transition:fade`/`fly` (short, ~180ms, ease). **Under `game.reduce` → no transition (instant swap).** Verify it doesn't break the Shell layout or double-mount the round.
- [ ] **Step 2 — micro-interactions.** Invoke `make-interfaces-feel-better` + `interaction-design`. Apply a CONSISTENT press/hover/focus treatment across all CTAs and icon buttons (the existing `.btn-primary` depth pattern is the reference): ensure every interactive element has `:active` press feedback, `:hover` (where pointer), `:focus-visible` outline (`--pov-mostarda`), and ≥44px hit area. Tighten any obvious spacing/optical-alignment issues the skill surfaces on the new screens (Home/Setup/RoundIntro/Scoreboard/GameOver/HowToPlay/sheets). Keep changes tasteful and tokenized; do NOT redesign.
- [ ] **Step 3 — sound.** Invoke `generating-sounds-with-ai` to audit. Wire appropriate existing `clicks.ts` sounds to the new interactions that lack them: screen-advance CTAs use `press()`/`confirm()`; sheet open/close a soft `press()`; Setup add already uses `dock()`; the GameOver already calls `celebrate()`. Ensure NO double-sounds and that mute/haptics toggles are respected. (Re-add the per-round Meter "embaralhar" spin if low-risk: increment a `roundSeed` on `nextRound` and pass to Meter — OPTIONAL; skip if it risks regression.)
- [ ] **Step 4 — verify** check (0/0), build, test, and a quick browser sanity (transitions feel right, reduced-motion instant, no console errors).
- [ ] **Step 5 — commit** `feat: polish pass — screen transitions, micro-interactions, sound (reduced-motion aware)`.

---

## Task 5: Final a11y/UX audit (web-design-guidelines) + fixes

**Files:** various (apply findings).

- [ ] **Step 1 — invoke `web-design-guidelines`** and audit the whole app (all screens + sheets + tutorial) against the Web Interface Guidelines: focus management, keyboard nav, contrast, target sizes, reduced-motion, semantics, labels, headings, live regions. Produce a findings list (file:line).
- [ ] **Step 2 — fix** the must-fix findings inline (defer only genuinely cosmetic ones, listing them). Keep 0/0.
- [ ] **Step 3 — verify** check (0/0), build, test.
- [ ] **Step 4 — commit** `fix: a11y/UX audit findings (web interface guidelines)`.

---

## Task 6: Full smoke + final review + finishing

- [ ] **Step 1 — FULL browser smoke** (agent-browser): the whole loop INCLUDING the new bits — Home → Como jogar (carousel, keyboard arrows, close) → back → Jogar → Setup → … play a round … → in-game open the **menu → Pausa** → open **Configurações** (toggle som/vibração/tema; Esc closes Settings then Pause) → Retomar → finish a game → GameOver. Verify screen transitions, reduced-motion (toggle OS setting or the in-app reflect) disables transitions/confetti, zero console errors. Screenshots.
- [ ] **Step 2 — final holistic review** (`main..HEAD`): tutorial + sheets reachable/exitable, overlay stacking correct, a11y of new components, no regression of the round/loop, success criteria green.
- [ ] **Step 3 — finishing-a-development-branch:** merge `feat/telas-polish` → `main`.

---

## Self-review (spec coverage)
- §7.2 Como jogar (carousel + keyboard + reduced-motion) → Task 2 ✓
- §7.8 Configurações + Pausa sheets (role=switch, Segmented tema, overlay stacking, focus-trap via Sheet, Pause in-game only, Sair confirm) → Task 3 ✓
- §12 deferred a11y (live region off count-up, reduced-motion completeness) → Tasks 1, 4, 5 ✓
- §14 R3 transition language (cross-fade ~180ms / instant under reduced-motion) → Task 4 ✓
- Design-skill polish (motion, micro-interactions, sound, final audit) → Tasks 4, 5 ✓
- **Out of scope (still future per spec §16):** online mode, card packs, persistent stats, per-player meter markers.
