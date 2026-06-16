# POV — Fundação (refator + arquitetura) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reestruturar o POV de "uma tela só" (`Playground.svelte`) para a arquitetura de telas da spec — store central + lógica pura testada + componentes extraídos — **sem mudar o que o jogador vê** (o jogo roda igual a hoje, em uma rodada).

**Architecture:** Eleva os tokens de tema para escopo global; introduz um store de runes (`src/lib/game/`) com a lógica pura num módulo testável (`rules.ts`, `scoring.ts`); extrai os efeitos/visuais do Playground para componentes (`Background`, `Console`, `Logo`, `Segmented`, `TopBar`, `Sheet`, `PrivacyHandoff`); adiciona um modo decorativo ao `Meter`; e refatora `Playground` em `InRound.svelte` dirigido pelo store. Telas novas vêm nos Planos 2 e 3.

**Tech Stack:** Svelte 5 (runes) + Vite 6 + TypeScript. Novo: **Vitest** para a lógica pura. Verificação de UI: `svelte-check` + `vite build` + smoke no browser.

**Convenção de verificação (este projeto não tem testes de UI):**
- **Lógica pura** (`rules.ts`, `scoring.ts`, `geometry.drawTarget`): TDD com Vitest.
- **Componentes/UI**: `npm run check` (0 erros) + `npm run build` (ok) + **smoke no browser** (skill `verify`/agent-browser) confirmando comportamento e ausência de erro no console.
- **Commits frequentes** após cada tarefa verde.

---

## Mapa de arquivos

| Arquivo | Responsabilidade | Ação |
|---|---|---|
| `src/lib/game/rules.ts` | Lógica pura de partida (rodízio, totais, sintonia, selos) | criar |
| `src/lib/game/rules.test.ts` | Testes da lógica pura | criar |
| `src/lib/game/scoring.ts` | `tierCopy` por-rodada (distinto dos selos), `tierVar` | criar (mover do Playground) |
| `src/lib/game/scoring.test.ts` | Testes de scoring/tierCopy | criar |
| `src/lib/game/store.svelte.ts` | Estado de runes + ações (envolve `rules.ts`) | criar |
| `src/lib/meter/geometry.ts` | + `drawTarget()` | modificar |
| `src/lib/meter/geometry.test.ts` | Testes de `drawTarget`/`scoreFor` | criar |
| `src/app.css` | + tokens de tema elevados (`.theme-dark`/`.theme-light`) | modificar |
| `src/lib/ui/Background.svelte` | sunburst + ripples + grain + dim-veil | criar (extrair) |
| `src/lib/ui/Console.svelte` | tray + console-band + bandCells (a "cara de tabuleiro") | criar (extrair) |
| `src/lib/ui/Logo.svelte` | wordmark P◉V (currentColor + aria-label) | criar (extrair) |
| `src/lib/ui/Segmented.svelte` | segmented control + pílula deslizante | criar (extrair) |
| `src/lib/ui/TopBar.svelte` | logo + tema/som + gatilho de menu | criar |
| `src/lib/ui/Sheet.svelte` | base de overlay: focus-trap + Esc + retorno de foco | criar |
| `src/lib/ui/PrivacyHandoff.svelte` | interstício parametrizado (usa Sheet) | criar (extrair) |
| `src/lib/meter/Meter.svelte` | + `interactive=false` (modo decorativo) | modificar |
| `src/lib/screens/InRound.svelte` | a rodada, dirigida pelo store (Playground refatorado) | criar (renomear/refatorar) |
| `src/App.svelte` | renderiza via `store.screen` (por ora só `inRound`) | modificar |
| `vitest.config.ts`, `package.json` | infraestrutura de teste | criar/modificar |

**Ordem obrigatória:** infra de teste → lógica pura → tokens de tema → extrações → modo decorativo → refator do Playground. Cada extração mantém `check` 0/0 + build + smoke.

---

## Task 0: Baseline + git

**Files:** nenhum (verificação)

- [ ] **Step 1: Inicializar git (se ainda não houver)**

Run:
```bash
git init && git add -A && git commit -m "chore: baseline antes do refator de telas"
```
Expected: repositório criado, commit inicial. (Se já for repo, só commitar o estado atual.)

- [ ] **Step 2: Confirmar que o baseline está verde**

Run:
```bash
npm run check && npm run build
```
Expected: `svelte-check` 0 erros/0 warnings; `vite build` conclui sem erro. (Se houver erro pré-existente, parar e reportar — o refator assume baseline limpo.)

---

## Task 1: Infraestrutura de teste (Vitest)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/game/smoke.test.ts` (teste-sentinela)

- [ ] **Step 1: Instalar o Vitest**

Run:
```bash
npm i -D vitest
```
Expected: `vitest` adicionado a `devDependencies`.

- [ ] **Step 2: Adicionar o script de teste em `package.json`**

No bloco `"scripts"`, adicionar:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
```

- [ ] **Step 4: Escrever um teste-sentinela que falha**

`src/lib/game/smoke.test.ts`:
```ts
import { test, expect } from 'vitest'

test('vitest está rodando', () => {
  expect(1 + 1).toBe(3) // proposital: deve FALHAR
})
```

- [ ] **Step 5: Rodar e ver falhar**

Run: `npm test`
Expected: 1 teste falhando (`expected 2 to be 3`). Confirma que o runner funciona.

- [ ] **Step 6: Corrigir para verde e rodar**

Trocar `toBe(3)` por `toBe(2)`. Run: `npm test`
Expected: 1 passando.

- [ ] **Step 7: Commit**

```bash
git add package.json vitest.config.ts src/lib/game/smoke.test.ts package-lock.json
git commit -m "test: adiciona vitest para a lógica pura"
```

---

## Task 2: `rules.ts` — lógica pura de partida (TDD)

**Files:**
- Create: `src/lib/game/rules.ts`
- Create: `src/lib/game/rules.test.ts`

- [ ] **Step 1: Escrever os testes (falhando)**

`src/lib/game/rules.test.ts`:
```ts
import { test, expect, describe } from 'vitest'
import {
  VOLTAS, totalRounds, donoIndexFor, nextDonoIndex,
  maxPossibleTotal, maxPossibleSoFar, sintoniaPct, selo, type Selo,
} from './rules'

describe('totais e rodízio', () => {
  test('totalRounds = voltas × jogadores', () => {
    expect(totalRounds(2, 4)).toBe(8)   // Média, 4 jogadores
    expect(totalRounds(1, 2)).toBe(2)
    expect(totalRounds(3, 8)).toBe(24)
  })
  test('donoIndexFor cicla pela ordem e cobre cada jogador `voltas` vezes', () => {
    const n = 4
    const seen = Array.from({ length: totalRounds(2, n) }, (_, r) => donoIndexFor(r, n))
    expect(seen).toEqual([0, 1, 2, 3, 0, 1, 2, 3])
  })
  test('nextDonoIndex envolve no fim', () => {
    expect(nextDonoIndex(3, 4)).toBe(0)
    expect(nextDonoIndex(0, 4)).toBe(1)
  })
})

describe('pontuação acumulada', () => {
  test('maxPossibleTotal e maxPossibleSoFar são grandezas diferentes', () => {
    expect(maxPossibleTotal(8)).toBe(32)        // jogo todo
    expect(maxPossibleSoFar(3)).toBe(12)        // após 3 resultados
  })
  test('sintoniaPct é inteiro arredondado', () => {
    expect(sintoniaPct(10, 12)).toBe(83)
    expect(sintoniaPct(26, 32)).toBe(81)
    expect(sintoniaPct(0, 4)).toBe(0)
  })
})

describe('selos (faixas exaustivas, sem buraco/sobreposição)', () => {
  const cases: Array<[number, Selo]> = [
    [100, 'Telepatas'], [90, 'Telepatas'],
    [89, 'Quase telepatas'], [75, 'Quase telepatas'],
    [74, 'Em boa sintonia'], [50, 'Em boa sintonia'],
    [49, 'Pegando o ritmo'], [25, 'Pegando o ritmo'],
    [24, 'Frequências diferentes'], [0, 'Frequências diferentes'],
  ]
  for (const [pct, expected] of cases) {
    test(`${pct}% → ${expected}`, () => expect(selo(pct)).toBe(expected))
  }
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: falha de import (`rules` não existe).

- [ ] **Step 3: Implementar `rules.ts`**

```ts
// Lógica pura da partida cooperativa local. Sem runes — testável isoladamente.

export const VOLTAS = { curta: 1, media: 2, longa: 3 } as const
export type Voltas = 1 | 2 | 3

export const totalRounds = (voltas: number, players: number) => voltas * players
export const donoIndexFor = (roundIndex: number, players: number) => roundIndex % players
export const nextDonoIndex = (donoIndex: number, players: number) => (donoIndex + 1) % players

export const maxPossibleTotal = (rounds: number) => rounds * 4
export const maxPossibleSoFar = (resultsCount: number) => resultsCount * 4
export const sintoniaPct = (score: number, max: number) => (max <= 0 ? 0 : Math.round((100 * score) / max))

export type Selo = 'Telepatas' | 'Quase telepatas' | 'Em boa sintonia' | 'Pegando o ritmo' | 'Frequências diferentes'
export function selo(pct: number): Selo {
  if (pct >= 90) return 'Telepatas'
  if (pct >= 75) return 'Quase telepatas'
  if (pct >= 50) return 'Em boa sintonia'
  if (pct >= 25) return 'Pegando o ritmo'
  return 'Frequências diferentes'
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: todos os testes de `rules` passam.

- [ ] **Step 5: Commit**

```bash
git add src/lib/game/rules.ts src/lib/game/rules.test.ts
git commit -m "feat: rules.ts — rodízio, totais e selos (testado)"
```

---

## Task 3: `drawTarget()` em `geometry.ts` (TDD)

**Files:**
- Modify: `src/lib/meter/geometry.ts` (adicionar export ao fim)
- Create: `src/lib/meter/geometry.test.ts`

- [ ] **Step 1: Escrever os testes (falhando)**

`src/lib/meter/geometry.test.ts`:
```ts
import { test, expect } from 'vitest'
import { drawTarget, STEPS, STEP_P, stepIndex, scoreFor } from './geometry'

test('drawTarget cai na grade de detentes com margem ≥3 (cunhas não clipam)', () => {
  for (let i = 0; i < 500; i++) {
    const t = drawTarget()
    const idx = stepIndex(t)
    expect(idx).toBeGreaterThanOrEqual(3)
    expect(idx).toBeLessThanOrEqual(STEPS - 3)
    expect(t).toBeCloseTo(idx * STEP_P, 6) // já está "snapado"
  }
})

test('scoreFor nunca retorna 1 (sanity)', () => {
  const vals = new Set<number>()
  for (let g = 0; g <= 24; g++) vals.add(scoreFor(g * STEP_P, 12 * STEP_P))
  expect(vals.has(1 as never)).toBe(false)
  expect([...vals].every((v) => [0, 2, 3, 4].includes(v))).toBe(true)
})
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test`
Expected: falha (`drawTarget` não existe).

- [ ] **Step 3: Adicionar `drawTarget` ao fim de `geometry.ts`**

```ts
// Sorteio do alvo da rodada: detente com margem ≥3 de cada ponta, para as 5 cunhas
// (2-3-4-3-2, ±2.5 detentes) caberem sem clipping. Substitui o inline do Playground.
export function drawTarget(): number {
  const ti = 3 + Math.floor(Math.random() * (STEPS - 5)) // ti ∈ [3, STEPS-3]
  return ti * STEP_P
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test`
Expected: passa.

- [ ] **Step 5: Commit**

```bash
git add src/lib/meter/geometry.ts src/lib/meter/geometry.test.ts
git commit -m "feat: geometry.drawTarget — sorteio do alvo com margem das cunhas (testado)"
```

---

## Task 4: `scoring.ts` — cópia por-rodada (TDD) + extração do Playground

**Files:**
- Create: `src/lib/game/scoring.ts`
- Create: `src/lib/game/scoring.test.ts`
- Modify: `src/routes/Playground.svelte` (passa a importar de `scoring.ts`)

- [ ] **Step 1: Escrever os testes (falhando)**

`src/lib/game/scoring.test.ts`:
```ts
import { test, expect } from 'vitest'
import { tierCopy, tierVar } from './scoring'
import { selo } from './rules'

test('tierCopy cobre os tiers 0/2/3/4', () => {
  for (const tier of [0, 2, 3, 4] as const) {
    expect(Array.isArray(tierCopy[tier])).toBe(true)
    expect(tierCopy[tier].length).toBeGreaterThan(0)
  }
})

test('as frases por-rodada NÃO colidem com os selos finais', () => {
  const selos = new Set(['Telepatas', 'Quase telepatas', 'Em boa sintonia', 'Pegando o ritmo', 'Frequências diferentes'])
  const phrases = Object.values(tierCopy).flat()
  for (const p of phrases) expect(selos.has(p)).toBe(false)
})

test('tierVar mapeia tier→cor', () => {
  expect(tierVar(4)).toContain('var(')
  expect(tierVar(0)).toContain('var(')
})
```

> Nota: se a frase de `tierCopy[4]` for "Na mesma frequência!", ela **não** colide com o selo ≥90% ("Telepatas") — ok. Garantir que nenhuma frase seja idêntica a um nome de selo.

- [ ] **Step 2: Rodar e ver falhar** — Run: `npm test` → falha de import.

- [ ] **Step 3: Implementar `scoring.ts`** (movendo do Playground, sem colisão com selos)

```ts
// Cópia e cor da pontuação POR RODADA (distinta dos selos finais em rules.ts).
export const tierCopy: Record<0 | 2 | 3 | 4, string[]> = {
  4: ['Na mesma frequência!', 'Sintonia perfeita.', 'Leu a mente, hein?'],
  3: ['Quase perfeito.', 'Faltou um triz.', 'Quase na mosca.'],
  2: ['Chegaram perto.', 'Tá na vibe.', 'No caminho certo.'],
  0: ['Fora de sintonia.', 'Outro universo, hein?', 'Frequências opostas.'],
}

export function tierVar(tier: 0 | 2 | 3 | 4): string {
  return tier === 4 ? 'var(--pov-bullseye)'
    : tier === 3 ? 'var(--pov-mostarda)'
    : tier === 2 ? 'var(--pov-laranja)'
    : 'var(--pov-coral)'
}
```

- [ ] **Step 4: Rodar e ver passar** — Run: `npm test` → passa.

- [ ] **Step 5: Trocar o Playground para importar de `scoring.ts`**

Em `src/routes/Playground.svelte`: remover a definição local `tierCopy` (linhas ~219-224) e o `tierVar` derivado (linhas ~231-236), e no topo adicionar:
```ts
import { tierCopy, tierVar } from '../lib/game/scoring'
```
Ajustar o uso: `const tierVar = $derived(...)` vira `const tierVarValue = $derived(tierVar(revealScore))` (e o template usa `tierVarValue`). Manter `revealPhrase` usando `tierCopy[revealScore]`.

- [ ] **Step 6: Verificar UI**

Run: `npm run check && npm run build`
Expected: 0 erros, build ok. Smoke: `npm run dev`, jogar até a revelação, confirmar frase + cor do chip iguais a antes, sem erro no console.

- [ ] **Step 7: Commit**

```bash
git add src/lib/game/scoring.ts src/lib/game/scoring.test.ts src/routes/Playground.svelte
git commit -m "refactor: extrai tierCopy/tierVar para scoring.ts (testado)"
```

---

## Task 5: Elevar os tokens de TEMA para `app.css`

**Files:**
- Modify: `src/app.css` (adicionar os blocos de tema)
- Modify: `src/routes/Playground.svelte` (remover os tokens locais; manter `.theme-dark/.theme-light` como classe na raiz)

> Por quê: hoje `--bg-base`, `--console-*`, `--text`, `--result-*`, `--sun-op`, `--ripple-op`, `--dock-bg` etc. vivem **só** no `<style>` do Playground (linhas ~523-572). Nenhum componente novo os enxerga. Este passo é pré-requisito de TODAS as extrações.

- [ ] **Step 1: Copiar os blocos de tema para `app.css`**

Em `src/app.css`, adicionar os seletores `.theme-dark { … }` e `.theme-light { … }` **exatamente** com o conteúdo das linhas 523-572 de `Playground.svelte` (todas as variáveis `--bg-base`, `--console-top/bot/skirt/edge/slot`, `--tray-shadow`, `--text`, `--text-soft`, `--header-grad`, `--footer-grad`, `--ctrl-*`, `--icon-*`, `--ripple-op`, `--result-bg`, `--result-border`, `--dock-bg`, `--sun-op`).

- [ ] **Step 2: Remover os blocos de tema duplicados do Playground**

Em `src/routes/Playground.svelte` `<style>`, apagar os blocos `.theme-dark {…}` e `.theme-light {…}` (linhas ~523-572). A classe `class:theme-dark`/`class:theme-light` na `.scene` permanece — agora resolve pelas vars de `app.css`.

- [ ] **Step 3: Verificar UI**

Run: `npm run check && npm run build`
Expected: 0 erros, build ok. Smoke: alternar tema claro/escuro no jogo — cores **idênticas** a antes em ambos. Sem erro no console.

- [ ] **Step 4: Commit**

```bash
git add src/app.css src/routes/Playground.svelte
git commit -m "refactor: eleva tokens de tema do Playground para app.css"
```

---

## Task 6: Extrair `Background.svelte`

**Files:**
- Create: `src/lib/ui/Background.svelte`
- Modify: `src/routes/Playground.svelte`

- [ ] **Step 1: Criar `Background.svelte`**

Mover para o componente: o `<svg class="sunburst">`, `<svg class="ripples">`, `<svg class="grain">` e `<div class="dim-veil">` (Playground linhas ~328-359) **e** o JS que os alimenta (`SUN_*`, `sunColors`, `sunburst` IIFE, `ripples`, `ripplePalette`, `rings`, linhas ~42-71) **e** o CSS correspondente (`.sunburst/.ripples/.grain/.dim-veil`, linhas ~584-620). Props:
```ts
type Props = { theme: 'dark' | 'light'; dim?: boolean }
let { theme, dim = false }: Props = $props()
```
`dim` controla `.dim-veil.on`. As vars `--sun-op`/`--ripple-op` agora vêm de `app.css` (Task 5), então o `.theme-*` precisa estar num ancestral (a `.scene` do Playground).

- [ ] **Step 2: Usar no Playground**

Substituir os 4 SVGs/div inline por `<Background {theme} dim={revealDim} />` e remover o JS/CSS movidos. Import no topo.

- [ ] **Step 3: Verificar UI**

Run: `npm run check && npm run build`
Expected: 0 erros, build ok. Smoke: sunburst, ripples, grain e o escurecimento da revelação idênticos a antes, nos dois temas.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ui/Background.svelte src/routes/Playground.svelte
git commit -m "refactor: extrai Background.svelte (sunburst/ripples/grain/dim-veil)"
```

---

## Task 7: Extrair `Console.svelte`

**Files:**
- Create: `src/lib/ui/Console.svelte`
- Modify: `src/routes/Playground.svelte`

- [ ] **Step 1: Criar `Console.svelte`**

Encapsular a "cara de tabuleiro": a `.tray` (gradiente de console + sombras + `overflow:hidden`) e a `.console-band` com `bandCells` (Playground: array linhas ~93-98, markup ~433-437, CSS `.tray` ~702-713 e `.console-band` ~715-725). Conteúdo via slot:
```svelte
<div class="console">
  <div class="console-body"><slot /></div>
  <div class="console-band" aria-hidden="true">
    {#each bandCells as c}<span style:background={c}></span>{/each}
  </div>
</div>
```
`bandCells` vira const interna do componente. As vars `--console-*` vêm de `app.css`.

- [ ] **Step 2: Usar no Playground**

Envolver o conteúdo do medidor com `<Console>…</Console>` no lugar da `.tray` atual; remover `bandCells` e o CSS movido.

- [ ] **Step 3: Verificar UI** — `npm run check && npm run build` + smoke: console azul moldado + faixa quadriculada idênticos, lever não cortado.

- [ ] **Step 4: Commit**
```bash
git add src/lib/ui/Console.svelte src/routes/Playground.svelte
git commit -m "refactor: extrai Console.svelte (tray + faixa quadriculada)"
```

---

## Task 8: Extrair `Logo.svelte`

**Files:**
- Create: `src/lib/ui/Logo.svelte`
- Modify: `src/routes/Playground.svelte`

- [ ] **Step 1: Criar `Logo.svelte`**

Mover o markup do logo (Playground `.logo` + `.logo-o` SVG, linhas ~362-372) e o CSS (`.logo`, `.logo-o`, ~635-649). **Correções da revisão:** trocar `color: var(--text)` por `color: currentColor` (a var de tema some fora do escopo) e dar rótulo acessível único:
```svelte
<span class="logo" role="img" aria-label="POV">
  <span aria-hidden="true">P</span>
  <svg class="logo-o" aria-hidden="true">…</svg>
  <span aria-hidden="true">V</span>
</span>
```
Prop opcional `size?` (font-size).

- [ ] **Step 2: Usar no Playground** — substituir o markup do logo por `<Logo />` dentro do `.topbar` (a cor herda de `--text` via `currentColor` no ancestral).

- [ ] **Step 3: Verificar UI** — `check && build` + smoke: logo idêntico; leitor de tela anuncia "POV" (não "P V").

- [ ] **Step 4: Commit**
```bash
git add src/lib/ui/Logo.svelte src/routes/Playground.svelte
git commit -m "refactor: extrai Logo.svelte (currentColor + aria-label POV)"
```

---

## Task 9: Extrair `Segmented.svelte`

**Files:**
- Create: `src/lib/ui/Segmented.svelte`
- Modify: `src/routes/Playground.svelte`

- [ ] **Step 1: Criar `Segmented.svelte`**

Generalizar o segmented control com pílula deslizante (Playground `.segment`/`.segment.states` + a pílula, CSS ~1103-1174; markup das fases ~465-470). API genérica:
```ts
type Option<T> = { id: T; label: string }
type Props<T> = { options: Option<T>[]; value: T; onChange: (id: T) => void; ariaLabel: string }
```
Renderiza `role="group"` + `aria-label`, botões com `aria-pressed`, `:focus-visible` (`--pov-mostarda`), pílula deslizante via `--count`/`--active` (índice de `value`). Reduced-motion: pílula sem transição (já há `@media` no original).

- [ ] **Step 2: Usar no Playground** — o segmented de fases na gaveta dev vira `<Segmented … />`. Remover o CSS movido.

- [ ] **Step 3: Verificar UI** — `check && build` + smoke: pílula desliza, foco visível, aria-pressed correto.

- [ ] **Step 4: Commit**
```bash
git add src/lib/ui/Segmented.svelte src/routes/Playground.svelte
git commit -m "refactor: extrai Segmented.svelte (pílula deslizante + a11y)"
```

---

## Task 10: Extrair `TopBar.svelte`

**Files:**
- Create: `src/lib/ui/TopBar.svelte`
- Modify: `src/routes/Playground.svelte`

- [ ] **Step 1: Criar `TopBar.svelte`**

Mover a `<header class="topbar">` (logo + botões tema/som, Playground ~361-403) e o CSS (`.topbar/.top-actions/.iconbtn`, ~622-688). Props/callbacks:
```ts
type Props = {
  theme: 'dark' | 'light'; sound: boolean
  onToggleTheme: () => void; onToggleSound: () => void
  onMenu?: () => void // futuro: abre a Pausa (Plano 3). Botão só aparece se passado.
}
```
Usa `<Logo />`. Mantém `aria-label`/`aria-pressed`/`:focus-visible` dos ícones; ícones ≥44px (já são 44).

- [ ] **Step 2: Usar no Playground** — substituir o header inline por `<TopBar … />`.

- [ ] **Step 3: Verificar UI** — `check && build` + smoke: tema e som funcionam, foco visível, layout idêntico.

- [ ] **Step 4: Commit**
```bash
git add src/lib/ui/TopBar.svelte src/routes/Playground.svelte
git commit -m "refactor: extrai TopBar.svelte"
```

---

## Task 11: `Sheet.svelte` — overlay base com focus-trap

**Files:**
- Create: `src/lib/ui/Sheet.svelte`

> Trabalho NOVO (o `.privacy` atual não tem trap/Esc/retorno de foco). Será a base de PrivacyHandoff (Task 12) e dos sheets do Plano 3.

- [ ] **Step 1: Implementar `Sheet.svelte`**

```svelte
<script lang="ts">
  import { onMount, tick } from 'svelte'
  type Props = { open: boolean; onClose: () => void; ariaLabel: string; variant?: 'sheet' | 'modal'; children?: import('svelte').Snippet }
  let { open, onClose, ariaLabel, variant = 'modal', children }: Props = $props()
  let dialogEl: HTMLDivElement | null = $state(null)
  let opener: Element | null = null

  function focusables(): HTMLElement[] {
    if (!dialogEl) return []
    return [...dialogEl.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'
    )]
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
    if (e.key !== 'Tab') return
    const f = focusables(); if (!f.length) return
    const first = f[0], last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  $effect(() => {
    if (open) {
      opener = document.activeElement
      tick().then(() => focusables()[0]?.focus())
    } else if (opener instanceof HTMLElement) {
      opener.focus(); opener = null
    }
  })
</script>

{#if open}
  <div class="scrim {variant}" onclick={(e) => { if (e.target === e.currentTarget) onClose() }}>
    <div class="dialog {variant}" bind:this={dialogEl} role="dialog" aria-modal="true" aria-label={ariaLabel} onkeydown={onKeydown} tabindex="-1">
      {#if variant === 'sheet'}<div class="grip" aria-hidden="true"></div>{/if}
      {@render children?.()}
    </div>
  </div>
{/if}

<style>
  .scrim { position: fixed; inset: 0; z-index: 20; background: rgba(7,13,28,.6); backdrop-filter: blur(4px); display: grid; }
  .scrim.modal { place-items: center; padding: var(--sp-5); }
  .scrim.sheet { align-items: end; }
  .dialog { background: linear-gradient(180deg, var(--console-top), var(--console-bot)); color: var(--text); box-shadow: var(--elev-3); }
  .dialog.modal { width: min(380px, 92vw); border-radius: var(--r-5); padding: var(--sp-5); }
  .dialog.sheet { width: 100%; border-radius: var(--r-5) var(--r-5) 0 0; padding: var(--sp-3) var(--sp-5) max(var(--sp-5), env(safe-area-inset-bottom)); }
  .grip { width: 40px; height: 5px; border-radius: 3px; background: rgba(255,255,255,.22); margin: 0 auto var(--sp-3); }
  @media (prefers-reduced-motion: no-preference) { .scrim { animation: fade .18s ease both } }
  @keyframes fade { from { opacity: 0 } to { opacity: 1 } }
</style>
```

- [ ] **Step 2: Verificar tipos/build** — Run: `npm run check && npm run build` → 0 erros.

- [ ] **Step 3: Smoke do focus-trap (browser)**

Montar `Sheet` temporariamente numa página de teste (ou validar via Task 12). Verificar: ao abrir, foco vai ao 1º controle; Tab cicla dentro; Shift+Tab no 1º vai ao último; Esc chama `onClose`; ao fechar, foco volta ao gatilho. (Usar a skill `verify`/agent-browser.)

- [ ] **Step 4: Commit**
```bash
git add src/lib/ui/Sheet.svelte
git commit -m "feat: Sheet.svelte — overlay base com focus-trap + Esc + retorno de foco"
```

---

## Task 12: `PrivacyHandoff.svelte` (usa Sheet) + substituir o `.privacy` inline

**Files:**
- Create: `src/lib/ui/PrivacyHandoff.svelte`
- Modify: `src/routes/Playground.svelte`

- [ ] **Step 1: Criar `PrivacyHandoff.svelte`**

```svelte
<script lang="ts">
  import Sheet from './Sheet.svelte'
  type Props = { open: boolean; donoName?: string; onConfirm: () => void; onCancel: () => void }
  let { open, donoName, onConfirm, onCancel }: Props = $props()
</script>
<Sheet {open} onClose={onCancel} ariaLabel="Passar o aparelho para o Dono do POV" variant="modal">
  <div class="ph">
    <svg class="ph-icon" viewBox="0 0 48 48" aria-hidden="true"><!-- mesmo ícone do .privacy atual --></svg>
    <p class="ph-title">{donoName ? `Passe o POV pra ${donoName}` : 'Passe o POV para o Dono'}</p>
    <p class="ph-sub">Só o Dono do POV pode ver o alvo secreto. Quando estiver com o aparelho, toque abaixo.</p>
    <button class="btn-primary" onclick={onConfirm}>Sou o Dono — ver o alvo</button>
    <button class="ph-cancel" onclick={onCancel}>Voltar</button>
  </div>
</Sheet>
<style>/* mover de .privacy-card/.privacy-title/.privacy-sub/.privacy-cancel do Playground */</style>
```

- [ ] **Step 2: Substituir no Playground**

Trocar o bloco `{#if showPrivacy}…{/if}` (linhas ~503-518) por `<PrivacyHandoff open={showPrivacy} onConfirm={confirmPrivacy} onCancel={cancelPrivacy} />`. Manter `confirmPrivacy`/`cancelPrivacy` por ora (o store assume isso no Task 14). Remover o CSS `.privacy*` movido.

- [ ] **Step 3: Verificar UI** — `check && build` + smoke: abrir o interstício, confirmar → vê alvo; Voltar/Esc → fecha sem avançar; foco preso e retorna ao gatilho.

- [ ] **Step 4: Commit**
```bash
git add src/lib/ui/PrivacyHandoff.svelte src/routes/Playground.svelte
git commit -m "refactor: PrivacyHandoff via Sheet (focus-trap, nome do Dono parametrizável)"
```

---

## Task 13: Modo decorativo do `Meter` (`interactive=false`)

**Files:**
- Modify: `src/lib/meter/Meter.svelte`

> A revisão provou que `lockGestures` NÃO basta: ponteiro/tampa/disco continuam arrastáveis e o SVG é `role="slider"`/`tabindex="0"` fixos. Necessário para a Abertura/tutorial (Plano 2).

- [ ] **Step 1: Adicionar a prop**

No `type Props` e no `$props()` de `Meter.svelte` (linhas ~39-67), adicionar `interactive?: boolean` (default `true`).

- [ ] **Step 2: Inertizar quando `!interactive`**

- Gatear todos os handlers de pointer/keydown para retornar cedo quando `!interactive`: `needleDown` (~144), `coverDown` (~460), `discDown`/disco em reveal (~216), e o `onkeydown` do slider. Forma: `if (!interactive) return` no início de cada handler.
- No `<svg>` raiz (linhas ~646-647): tornar condicionais — `role={interactive ? 'slider' : undefined}`, `tabindex={interactive ? 0 : undefined}`, `aria-hidden={!interactive || undefined}`, e remover os `aria-valuenow/valuetext` quando `!interactive`.
- Silenciar sons no modo decorativo: como o áudio só dispara a partir de gestos (agora bloqueados), basta os gates acima; confirmar que nenhum `$effect` decorativo chama som.

- [ ] **Step 3: Verificar UI**

Run: `npm run check && npm run build`
Expected: 0 erros. Smoke: no Playground normal, tudo funciona como antes (`interactive` default true). Montar um `<Meter interactive={false} phase="reveal" showTarget />` numa página de teste: não arrasta, não emite som, e o leitor de tela não anuncia um slider.

- [ ] **Step 4: Commit**
```bash
git add src/lib/meter/Meter.svelte
git commit -m "feat: Meter modo decorativo (interactive=false) inerte + sem role=slider"
```

---

## Task 14: Store de partida + `InRound.svelte` + `App` dirigido pelo store

**Files:**
- Create: `src/lib/game/store.svelte.ts`
- Create: `src/lib/screens/InRound.svelte` (refator do Playground)
- Modify: `src/App.svelte`

> Fim do Plano 1: o jogo roda **uma rodada** igual a hoje, mas o estado vem do store e a rodada é `InRound`. A máquina de telas completa entra no Plano 2 — aqui o store nasce com `screen='inRound'` e um `config` mínimo (1 Dono fictício) só para destravar o refator sem regressão visível.

- [ ] **Step 1: Criar `store.svelte.ts`**

```ts
import { drawTarget, STEP_P } from '../meter/geometry'
import { donoIndexFor, totalRounds, maxPossibleTotal, maxPossibleSoFar, sintoniaPct, selo } from './rules'
import type { MeterState } from '../meter/Meter.svelte'

export type Screen = 'home' | 'howToPlay' | 'setup' | 'roundIntro' | 'inRound' | 'scoreboard' | 'gameOver'
export type PlayerColor = 'coral' | 'piscina' | 'lilas' | 'menta' | 'mostarda' | 'rosa' | 'laranja' | 'petroleo'
export type Player = { id: string; name: string; color: PlayerColor }
export type RoundResult = { donoId: string; cardIndex: number; target: number; value: number; score: 0 | 2 | 3 | 4 }

const CARDS = [
  { left: 'Frio', right: 'Quente' }, { left: 'Normal', right: 'Estranho' },
  { left: 'Barato', right: 'Caro' }, { left: 'Mal feito', right: 'Bem feito' },
] // Plano 2/R2: mover para decks.ts e ampliar

function makeStore() {
  // Config mínimo para o Plano 1 (Plano 2 substitui via setup)
  let config = $state({ players: [{ id: 'p1', name: 'Dono', color: 'coral' as PlayerColor }], voltas: 2 as 1 | 2 | 3, deck: 'classico' as const })
  let screen = $state<Screen>('inRound')
  let phase = $state<MeterState>('hidden')
  let roundIndex = $state(0)
  let target = $state(drawTarget())
  let value = $state(12 * STEP_P)
  let cardIndex = $state(0)
  let results = $state<RoundResult[]>([])

  return {
    get screen() { return screen }, set screen(s) { screen = s },
    get phase() { return phase }, set phase(p) { phase = p },
    get config() { return config },
    get target() { return target }, get cardIndex() { return cardIndex },
    get value() { return value }, set value(v) { value = v },
    get card() { return CARDS[cardIndex % CARDS.length] },
    get totalRounds() { return totalRounds(config.voltas, config.players.length) },
    get donoIndex() { return donoIndexFor(roundIndex, config.players.length) },
    get dono() { return config.players[this.donoIndex] },
    get groupScore() { return results.reduce((s, r) => s + r.score, 0) },
    get maxSoFar() { return maxPossibleSoFar(results.length) },
    get maxTotal() { return maxPossibleTotal(this.totalRounds) },
    get sintoniaPct() { return sintoniaPct(this.groupScore, this.maxSoFar) },
    get selo() { return selo(sintoniaPct(this.groupScore, this.maxTotal)) },
    get results() { return results },
    // ações (Plano 2 amplia)
    recordRound(score: 0 | 2 | 3 | 4) {
      results.push({ donoId: this.dono.id, cardIndex, target, value, score })
    },
    nextRound() {
      roundIndex++; target = drawTarget(); value = 12 * STEP_P; cardIndex++; phase = 'hidden'
    },
    playAgain() { roundIndex = 0; results = []; target = drawTarget(); value = 12 * STEP_P; cardIndex = 0; phase = 'hidden' },
  }
}
export const game = makeStore()
```

- [ ] **Step 2: Renomear o Playground para `InRound.svelte` e ligar ao store**

`git mv src/routes/Playground.svelte src/lib/screens/InRound.svelte`. Trocar o estado local da RODADA (`phase`, `target`, `value`, `cardIndex`) por leitura/escrita do `game` store (`bind:value={game.value}`, `phase={game.phase}`, `target={game.target}`, carta de `game.card`). O sorteio interno (`setupNewRound`) passa a chamar `game.nextRound()`; a revelação chama `game.recordRound(revealScore)`. Tema/som permanecem por ora (saem no Plano 2 para o TopBar/store). Manter `onRoundComplete` como o ponto onde, no Plano 2, o app vai para `scoreboard`.

- [ ] **Step 3: Apontar o `App` para o store**

`src/App.svelte`:
```svelte
<script lang="ts">
  import { game } from './lib/game/store.svelte'
  import InRound from './lib/screens/InRound.svelte'
</script>
{#if game.screen === 'inRound'}<InRound />{/if}
```

- [ ] **Step 4: Verificar UI (regressão completa)**

Run: `npm run check && npm run build && npm test`
Expected: 0 erros, build ok, todos os testes passam. Smoke completo: jogar uma rodada (esconder → ver → palpitar → travar → revelar → nova rodada via roleta), física/som/tema/reduced-motion idênticos a hoje, sem erro no console.

- [ ] **Step 5: Commit**
```bash
git add -A
git commit -m "refactor: Playground -> InRound dirigido pelo store de partida"
```

---

## Self-review (cobertura da spec → tarefas)

- §5 store/derivados → Task 14 (store) + Task 2 (rules) ✓
- §5 `donoIndex` derivado, `maxPossibleSoFar` vs `Total` → Task 2 (testado) ✓
- §6 selos exaustivos + `drawTarget` margem → Tasks 2, 3 (testados) ✓
- §6 cópia por-rodada distinta dos selos → Task 4 (teste de não-colisão) ✓
- §8 passo 0 (tokens de tema) → Task 5 ✓
- §8 componentes Background/Console/Logo/Segmented/TopBar/Sheet/PrivacyHandoff → Tasks 6–12 ✓
- §7.1 Meter decorativo → Task 13 ✓
- §12 focus-trap (novo) → Task 11 ✓
- §1/§8 refator Playground→InRound sem regressão → Task 14 ✓

**Fora deste plano (vão para os Planos 2/3, por design):** telas Home/Setup/RoundIntro/Scoreboard/GameOver/HowToPlay, sheets Configurações/Pausa, máquina de telas completa, breakpoint 2-col, packs de cartas, e o passe de polimento com as skills de design. Cada um desses produz software testável por conta própria sobre esta fundação.
