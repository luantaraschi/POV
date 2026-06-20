# Fase 2a — Rodada Local + Fim de Jogo · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reinventar o LAYOUT ao redor da rodada local (`InRound`) e o fim de jogo (`GameOver`) na linguagem Studio Sinal (encenação "Palco"), **sem tocar na roleta** (`Meter` intocado), com um pôster de fim de jogo unificado.

**Architecture:** Extrair o "redor" da rodada em componentes focados (RoundChrome, ClueCard, RevealChip) + um `GameOverPoster` compartilhado; remontar `InRound`/`GameOver` com esses componentes e migrar o CSS do chassi dos tokens antigos para os novos. O `<Meter>` é montado exatamente como hoje. O loop meter-native e o contrato de áudio-visual da revelação são preservados.

**Tech Stack:** Svelte 5 (runes), TypeScript, CSS custom properties (sem Tailwind), Vitest, svelte-check.

**Spec:** `docs/superpowers/specs/2026-06-20-fase2a-rodada-local-design.md`
**Alvo visual (mock aprovado, local):** `.superpowers/brainstorm/123311-1781899393/content/round-palco.html`
**Branch:** `feat/fase2a-rodada-local`

**INVARIANTE CRÍTICA:** Nenhuma task pode modificar `src/lib/meter/Meter.svelte`, `src/lib/meter/geometry.ts`, nem a `palette` JS de `src/lib/design/tokens.ts`. A roleta fica idêntica. Alias-trap: `--coral`(novo `#e8674a`) ≠ `--pov-coral`(antigo `#e25744`); `--cream` ≠ `--pov-creme` — ao migrar, **não troque cores que pertencem ao desenho da roleta/banda de ondas**; só o chassi da tela.

---

## File Structure

**Criar:**
- `src/lib/game/RoundChrome.svelte` — barra de topo da rodada (Rodada X/Y · Sintonia% · Vez de [Dono] · pausa).
- `src/lib/game/ClueCard.svelte` — carta de pista (dois polos) acima do dial.
- `src/lib/game/RevealChip.svelte` — chip de resultado da revelação (frase de tier + pontos).
- `src/lib/game/GameOverPoster.svelte` — pôster de fim de jogo unificado (dados por props + CTAs por snippet).
- `src/lib/game/breakdown.ts` — helper puro `breakdownRows(results)` (dados do pôster) + seu teste.
- `src/lib/game/breakdown.test.ts`.

**Modificar:**
- `src/lib/screens/InRound.svelte` — remonta o chassi com os componentes novos + tokens novos; `<Meter>` igual.
- `src/lib/screens/GameOver.svelte` — passa a renderizar `<GameOverPoster>` com CTAs locais.
- `src/lib/screens/PrivacyHandoff.svelte` (confirmar caminho com Grep) — reinventado no estilo Palco.

**Intocado:** `Meter.svelte`, `geometry.ts`, `tokens.ts` (`palette`). Reusar `CosmosBackdrop.svelte`, `Sheet`/`PauseSheet`, `clicks.ts`.

> **Antes de tudo:** rode `Grep` por `tierCopy`, `gapLabel`, `wavePath`, `PrivacyHandoff`, e pelos getters do store (`sintoniaPct`, `totalRounds`, `dono`, `donoIndex`, `results`, `card`, `phase`, `selo`, `groupScore`, `maxTotal`) para confirmar nomes/assinaturas reais antes de consumir.

---

## Task 1: `breakdown.ts` (helper de dados do pôster) — TDD

**Files:**
- Create: `src/lib/game/breakdown.ts`, `src/lib/game/breakdown.test.ts`

- [ ] **Step 1: Confirmar o shape de `results`**

`Grep` por `RoundResult` em `src/lib/game/store.svelte.ts`. É `{ donoId, cardIndex, target, value, score: 0|2|3|4 }`. O pôster precisa de uma linha por rodada com o nº e o score.

- [ ] **Step 2: Escrever o teste falho**

`src/lib/game/breakdown.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { breakdownRows } from './breakdown'

describe('breakdownRows', () => {
  it('mapeia results em linhas {round, score}', () => {
    const rows = breakdownRows([{ score: 4 } as any, { score: 2 } as any])
    expect(rows).toEqual([{ round: 1, score: 4 }, { round: 2, score: 2 }])
  })
  it('lista vazia => []', () => {
    expect(breakdownRows([])).toEqual([])
  })
})
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npm test -- breakdown` → FAIL (`breakdownRows` não existe).

- [ ] **Step 4: Implementar**

`src/lib/game/breakdown.ts`:

```ts
import type { RoundResult } from './store.svelte'

export type BreakdownRow = { round: number; score: 0 | 2 | 3 | 4 }

export function breakdownRows(results: Pick<RoundResult, 'score'>[]): BreakdownRow[] {
  return results.map((r, i) => ({ round: i + 1, score: r.score }))
}
```

> Se `RoundResult` não for exportado pelo store, exporte-o (`export type RoundResult = …`) — mudança aditiva.

- [ ] **Step 5: Rodar e ver passar**

Run: `npm test -- breakdown` → PASS. Run: `npm run check` → 0/0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/game/breakdown.ts src/lib/game/breakdown.test.ts src/lib/game/store.svelte.ts
git commit -m "feat(2a): helper breakdownRows p/ o poster de fim de jogo"
```

---

## Task 2: `RoundChrome.svelte` (barra de topo da rodada)

**Files:**
- Create: `src/lib/game/RoundChrome.svelte`

- [ ] **Step 1: Construir o componente**

Lê do store (`import { game } from './store.svelte'`) e expõe um callback de pausa. Markup: à esquerda POV-mark + "Rodada {n}/{total}"; à direita "Sintonia {pct}%" + chip "Vez de {dono}" (avatar com inicial+cor) + botão de pausa. Use SÓ tokens novos.

```svelte
<script lang="ts">
  import { game } from './store.svelte'
  import { playerColors } from '../design/tokens'
  let { onPause }: { onPause: () => void } = $props()
  const dono = $derived(game.dono)
</script>

<header class="chrome">
  <div class="left">
    <span class="mark"><span class="led"></span>POV</span>
    <span class="round">Rodada {game.roundIndex + 1} / {game.totalRounds}</span>
  </div>
  <div class="right">
    <span class="sintonia"><b>{game.sintoniaPct}%</b> sintonia</span>
    <span class="turn">
      <span class="av" style="background:{playerColors[dono.color]}">{dono.name.slice(0,1)}</span>
      Vez de {dono.name}
    </span>
    <button class="pause" onclick={onPause} aria-label="Pausar">⏸</button>
  </div>
</header>

<style>
  .chrome { display:flex; align-items:center; justify-content:space-between; gap:12px;
    padding:10px 14px; color:var(--ink-soft); font-size:13px; }
  .mark { font-family:'Clash Display',sans-serif; font-weight:700; color:var(--ink); display:inline-flex; align-items:center; gap:7px; }
  .led { width:7px; height:7px; border-radius:50%; background:var(--red); }
  .round { margin-left:10px; }
  .right { display:flex; align-items:center; gap:12px; }
  .sintonia b { color:var(--ink); font-family:'Space Grotesk',monospace; }
  .turn { display:inline-flex; align-items:center; gap:7px; background:var(--surface); color:var(--ink);
    border:1px solid var(--hair); border-radius:999px; padding:4px 12px 4px 4px; font-weight:600; }
  .av { width:24px; height:24px; border-radius:50%; display:grid; place-items:center; color:#fff; font-weight:700; font-size:12px; }
  .pause { width:36px; height:36px; border:none; border-radius:11px; background:var(--surface); color:var(--ink-soft);
    box-shadow:0 1px 2px rgba(27,35,80,.08); display:grid; place-items:center; }
  .pause:focus-visible, .turn:focus-visible { outline:2px solid var(--mustard); outline-offset:2px; }
</style>
```

> Substituir o glifo ⏸ por um ícone SVG de pausa (inline, `stroke=currentColor`) no estilo dos ícones do TopBar do lobby. Confirme o ícone real usado no lobby e reuse.

- [ ] **Step 2: Verificar**

Run: `npm run check` → 0/0; `npm run build` → ok. (Verificação visual na Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/lib/game/RoundChrome.svelte
git commit -m "feat(2a): RoundChrome (topo da rodada — rodada/sintonia/vez/pausa)"
```

---

## Task 3: `ClueCard.svelte` (carta de pista)

**Files:**
- Create: `src/lib/game/ClueCard.svelte`

- [ ] **Step 1: Construir**

Lê `game.card` (`{ left, right, lc, rc }`). Card limpo `--surface` com rótulo "A pista desta rodada" e os dois polos com um trilho entre eles. As cores `lc`/`rc` (do baralho) marcam discretamente cada polo (pontinho), sem dominar.

```svelte
<script lang="ts">
  import { game } from './store.svelte'
  const c = $derived(game.card)
</script>

<div class="clue">
  <div class="label">A pista desta rodada</div>
  <div class="poles">
    <span class="pole left"><i style="background:{c.lc}"></i>{c.left}</span>
    <span class="rail" aria-hidden="true"></span>
    <span class="pole right">{c.right}<i style="background:{c.rc}"></i></span>
  </div>
</div>

<style>
  .clue { background:var(--surface); border:1px solid var(--hair); border-radius:16px;
    box-shadow:0 1px 2px rgba(27,35,80,.06), 0 10px 26px -14px rgba(27,35,80,.18);
    padding:12px 16px; width:min(560px,94vw); }
  .label { font-size:10.5px; letter-spacing:.14em; text-transform:uppercase; color:var(--ink-soft); text-align:center; margin-bottom:6px; }
  .poles { display:flex; align-items:center; justify-content:space-between; gap:12px; color:var(--ink);
    font-family:'Clash Display',sans-serif; font-weight:600; font-size:clamp(15px,2.4vw,19px); }
  .pole { display:inline-flex; align-items:center; gap:8px; }
  .pole i { width:10px; height:10px; border-radius:50%; }
  .rail { flex:1; height:2px; border-radius:2px; background:linear-gradient(90deg, var(--hair), var(--ink-soft) 50%, var(--hair)); opacity:.5; min-width:24px; }
</style>
```

> Confirme os campos reais de `game.card` (o getter monta `{ left, right, lc, rc }` via `cardColors`). Se `lc`/`rc` forem tokens `var(--…)` string em vez de hex, o `style:background` ainda resolve.

- [ ] **Step 2: Verificar + commit**

Run: `npm run check` 0/0; `npm run build` ok.
```bash
git add src/lib/game/ClueCard.svelte
git commit -m "feat(2a): ClueCard (carta de pista com dois polos)"
```

---

## Task 4: `RevealChip.svelte` (resultado da revelação)

**Files:**
- Create: `src/lib/game/RevealChip.svelte`

- [ ] **Step 1: Confirmar a cópia de tier existente**

`Grep` por `tierCopy` / frases de tier em `InRound.svelte`. Reutilize as mesmas frases (não invente novas). Mapeamento esperado: `4`→"Na mesma sintonia!", `3`→"Quase lá!", `2`→"Deu pra sentir", `0`→"Sinais trocados" (use as frases REAIS achadas no código).

- [ ] **Step 2: Construir**

```svelte
<script lang="ts">
  let { score, phrase }: { score: 0 | 2 | 3 | 4; phrase: string } = $props()
</script>

<div class="chip" role="status" aria-live="polite">
  <span class="phrase">{phrase}</span>
  <span class="pts"><b>{score}</b> {score === 1 ? 'ponto' : 'pontos'}</span>
</div>

<style>
  .chip { display:inline-flex; align-items:center; gap:12px; background:var(--surface);
    border:1px solid var(--hair); border-radius:999px; padding:8px 8px 8px 18px;
    box-shadow:0 6px 20px -10px rgba(27,35,80,.3); }
  .phrase { font-family:'Fraunces',serif; font-style:italic; color:var(--ink); font-size:clamp(15px,2.6vw,20px); }
  .pts { display:inline-flex; align-items:baseline; gap:5px; background:var(--sunk); color:var(--ink);
    border-radius:999px; padding:5px 13px; font-size:13px; }
  .pts b { font-family:'Clash Display',sans-serif; font-weight:700; font-size:20px; color:var(--ink); }
</style>
```

> A cor do tier (laranja/mostarda/teal) é DESENHADA PELO MeTER (cunhas) — o chip fica neutro de propósito para não competir. A `phrase` vem do InRound (que já tem `tierCopy`).

- [ ] **Step 3: Verificar + commit**

Run: `npm run check` 0/0; `npm run build` ok.
```bash
git add src/lib/game/RevealChip.svelte
git commit -m "feat(2a): RevealChip (frase de tier + pontos da revelacao)"
```

---

## Task 5: `GameOverPoster.svelte` (pôster unificado)

**Files:**
- Create: `src/lib/game/GameOverPoster.svelte`

- [ ] **Step 1: Construir o pôster (dados por props + CTAs por snippet)**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { BreakdownRow } from './breakdown'
  import { scoreColors } from '../design/tokens'
  let { title, points, total, sintoniaPct, breakdown, cta }:
    { title: string; points: number; total: number; sintoniaPct: number;
      breakdown: BreakdownRow[]; cta: Snippet } = $props()
</script>

<section class="poster">
  <div class="seal" aria-hidden="true"><span>POV</span></div>
  <div class="kicker">Fim de jogo</div>
  <h1 class="title">{title}</h1>
  <div class="score"><b>{points}</b><span>/ {total} pontos</span><em>{sintoniaPct}% sintonia</em></div>
  <ol class="breakdown" aria-label="Pontos por rodada">
    {#each breakdown as row (row.round)}
      <li><span class="n" style="color:{scoreColors[row.score] ?? 'var(--ink-soft)'}">{row.score}</span><span class="r">R{row.round}</span></li>
    {/each}
  </ol>
  <div class="cta">{@render cta()}</div>
</section>

<style>
  .poster { background:var(--surface); border:1px solid var(--hair); border-radius:26px;
    box-shadow:0 1px 2px rgba(27,35,80,.06), 0 24px 60px -24px rgba(27,35,80,.3);
    padding:28px; width:min(440px,92vw); margin-inline:auto; text-align:center;
    display:flex; flex-direction:column; align-items:center; gap:10px; }
  .seal { width:64px; height:64px; border-radius:50%; border:2px solid var(--hair); display:grid; place-items:center; }
  .seal span { font-family:'Clash Display',sans-serif; font-weight:700; color:var(--ink); }
  .kicker { font-size:10.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--ink-soft); }
  .title { font-family:'Clash Display',sans-serif; font-weight:700; font-size:clamp(2rem,7vw,2.8rem); color:var(--ink); line-height:1; }
  .score { display:flex; align-items:baseline; gap:8px; color:var(--ink-soft); }
  .score b { font-family:'Clash Display',sans-serif; font-size:2.2rem; color:var(--ink); }
  .score em { margin-left:6px; font-style:normal; color:var(--teal); font-weight:600; }
  .breakdown { display:flex; gap:10px; list-style:none; padding:8px 0; margin:0; flex-wrap:wrap; justify-content:center; }
  .breakdown li { display:flex; flex-direction:column; align-items:center; gap:2px; }
  .breakdown .n { font-family:'Space Grotesk',monospace; font-weight:700; }
  .breakdown .r { font-size:9px; color:var(--ink-soft); }
  .cta { display:flex; gap:10px; margin-top:8px; width:100%; }
  @media (min-width:900px) { .poster { padding:36px; } }
</style>
```

> O `selo`/título conforme a sintonia (ex.: "Telepatas") vem por prop `title` (calculada por quem monta, via `game.selo`). Nada de sunburst arco-íris/hex antigo — só tokens.

- [ ] **Step 2: Verificar + commit**

Run: `npm run check` 0/0; `npm run build` ok.
```bash
git add src/lib/game/GameOverPoster.svelte
git commit -m "feat(2a): GameOverPoster unificado (Studio Sinal)"
```

---

## Task 6: `PrivacyHandoff` reinventado (estilo Palco)

**Files:**
- Modify: `src/lib/screens/PrivacyHandoff.svelte` (confirmar caminho com Grep — pode estar em `src/lib/game/` ou `src/lib/ui/`)

- [ ] **Step 1: Localizar e ler**

`Grep` por `PrivacyHandoff` (import e arquivo). Leia o componente: props atuais (provável `{ name, onReady }` ou similar) e o gatilho (`beginPeek`).

- [ ] **Step 2: Reestilizar no estilo Palco**

Mantenha a API/props e o gatilho EXATOS (não mude o fluxo). Troque o visual para: superfície `--surface`/`--bone` por tema, "Passe o aparelho **para [Nome]**" (nome em `--red`), chip "só você vê o alvo", e a dica "abra a tampa para espiar" (Fraunces itálico). Migre todos os tokens antigos → novos. `<button>` real para confirmar/iniciar, `:focus-visible`, focus-trap se for overlay (reusar `Sheet` se aplicável).

- [ ] **Step 3: Verificar + commit**

Run: `npm run check` 0/0; `npm run build` ok.
```bash
git add src/lib/screens/PrivacyHandoff.svelte
git commit -m "feat(2a): PrivacyHandoff reinventado (estilo Palco)"
```

---

## Task 7: `InRound.svelte` — remontar o chassi (integração)

**Files:**
- Modify: `src/lib/screens/InRound.svelte`

- [ ] **Step 1: Ler o `InRound` atual por completo**

Entenda: como monta `<Meter>` (props/callbacks), a máquina de fases, `tierCopy`/`gapLabel`, o `wavePath`, a contagem de score na revelação, o `roundSeed`, o fallback de botões, e quais tokens usa.

- [ ] **Step 2: Inserir o chassi novo SEM tocar no `<Meter>`**

- Topo: `<RoundChrome onPause={() => /* abre PauseSheet como hoje */} />`.
- Acima do dial: `<ClueCard />`.
- Mantenha o `<Meter ... />` EXATAMENTE como está (mesmas props/bind/callbacks). Adicione `<CosmosBackdrop />` atrás dele (dose baixa, aria-hidden) se ainda não houver halo.
- Na revelação: renderize `<RevealChip score={scoreAtual} phrase={tierCopy(scoreAtual)} />` (reusando o `tierCopy` existente) + a dica "gire o disco para a próxima rodada" com o glifo de giro. **Não mude** os beats/contagem/sons da revelação — só re-emoldure o visual.
- Substitua o overlay de privacidade pela versão reinventada (Task 6), mantendo o gatilho.
- Migre o CSS do chassi (não-Meter) dos tokens antigos → novos (cuidado com o alias-trap; a banda de ondas e tudo que é "desenho da roleta" fica como está).

- [ ] **Step 3: Verificar build + testes + check**

Run: `npm run check` → 0/0; `npm run build` → ok; `npm test` → verde (suite atual não deve regredir).

- [ ] **Step 4: Commit**

```bash
git add src/lib/screens/InRound.svelte
git commit -m "feat(2a): InRound remontado no estilo Palco (Meter intocado)"
```

---

## Task 8: `GameOver.svelte` usa o pôster + polimento + verificação visual

**Files:**
- Modify: `src/lib/screens/GameOver.svelte`

- [ ] **Step 1: Renderizar o `GameOverPoster` com dados locais**

```svelte
<script lang="ts">
  import { game } from '../game/store.svelte'
  import GameOverPoster from '../game/GameOverPoster.svelte'
  import { breakdownRows } from '../game/breakdown'
  import { onMount } from 'svelte'
  import { celebrate } from '../audio/clicks'
  onMount(() => { if (!game.reduce) celebrate() })
</script>

<GameOverPoster
  title={game.selo}
  points={game.groupScore}
  total={game.maxTotal}
  sintoniaPct={game.sintoniaPct}
  breakdown={breakdownRows(game.results)}>
  {#snippet cta()}
    <button class="cta-primary" onclick={() => game.playAgain()}>Jogar de novo</button>
    <button class="cta-ghost" onclick={() => game.changePlayers()}>Trocar jogadores</button>
  {/snippet}
</GameOverPoster>
```

> Confirme os getters reais (`game.selo` retorna o título/selo? senão calcule o título a partir de `selo`/`sintoniaPct`). Estilize `.cta-primary` (`--red`, branco) e `.cta-ghost` (contorno `--hair`) com `flex:1`, `:focus-visible`. Preserve o `celebrate()`-once.

- [ ] **Step 2: Polimento premium (skill frontend-design)**

Use a skill `frontend-design` para elevar InRound + pôster ao nível do mock aprovado (espaçamento, sombras de produto, micro-interações hover/press, stagger de entrada), **dose baixa do cósmico**, sem tocar no Meter.

- [ ] **Step 3: Verificação visual (viewport real, dois temas) — você mesmo**

`npm run dev`. Com browser headless, jogue uma rodada local e capture: **handoff, palpite, revelação, fim de jogo**, em **1440×900** e **390×844**, **claro e escuro**. Confirme: a **roleta idêntica à de hoje** (Meter intocado, rico), chrome/carta/chip/pôster na linguagem nova e legíveis, halo cósmico sutil, nada cortado, console limpo. Salve screenshots e **revise você mesmo** (memória `feedback-verify-real-viewport`).

- [ ] **Step 4: Smoke do loop**

Jogue a rodada ponta a ponta: handoff → espiar (abrir tampa) → arrastar/travar → revelação (chip + cunhas do Meter) → **girar o disco** → próxima rodada → fim de jogo. Confirme que o loop meter-native e os sons da revelação **não regrediram**.

- [ ] **Step 5: Suite + commit**

Run: `npm run check` 0/0; `npm run build` ok; `npm test` verde.
```bash
git add -A
git commit -m "feat(2a): GameOver usa GameOverPoster + polimento premium + verificacao visual"
```

---

## Task 9: Limpeza + revisão final

- [ ] **Step 1: Remover código morto**

`Grep` por usos do pôster/overlay antigos. Remova CSS/markup antigos do `GameOver`/`InRound` que ficaram órfãos (sunburst hex, emblema antigo, tokens antigos não usados). Confirme que nada mais referencia o que for removido.

- [ ] **Step 2: Revisão final (lean)**

Revisão holística do diff `main..feat/fase2a-rodada-local`: **regressão zero no Meter/loop** (a roleta deve estar byte-a-byte igual — confirmar que `Meter.svelte`/`geometry.ts` NÃO aparecem no diff), a11y, responsivo nos dois temas, dead code. Reserve revisor profundo só se algo arriscado (memória `feedback-lean-review-ceremony`).

- [ ] **Step 3: Suite final**

Run: `npm run check` 0/0; `npm run build` ok; `npm test` verde.

- [ ] **Step 4: Commit + finalizar**

```bash
git add -A
git commit -m "chore(2a): limpeza + revisao final"
```

Depois: skill `finishing-a-development-branch` para merge na `main` (após verificação visual nos dois temas + smoke do loop).

---

## Self-Review (cobertura do spec)

- §3.1 InRound (chrome/carta/dica/revelação/fundo/handoff + tokens) → Tasks 2,3,4,6,7. ✓
- §3.2 GameOver + pôster unificado → Tasks 1,5,8. ✓
- §4 componentes → Tasks 1-7 (todos os 4 novos + breakdown). ✓
- §5 responsivo/a11y/movimento → Tasks 7,8 (verificação) + componentes (focus-visible/aria). ✓
- §6 fora-de-escopo (Meter intocado) → **INVARIANTE** reforçada em todas as tasks + Task 9 confirma o diff. ✓
- §7 critérios → Tasks 8,9. ✓

**Consistência de tipos:** `breakdownRows`/`BreakdownRow` (T1) consumidos por GameOverPoster (T5) e GameOver (T8); `RoundChrome` props `{onPause}` (T2); `RevealChip` props `{score, phrase}` (T4) montado por InRound com `tierCopy` (T7); `GameOverPoster` props `{title,points,total,sintoniaPct,breakdown,cta}` (T5) usados por GameOver (T8). Sem placeholders proibidos; nenhum toque no Meter em nenhuma task.
