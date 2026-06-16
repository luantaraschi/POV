# POV — Telas de interface (modo local cooperativo) — Design Spec

- **Data:** 2026-06-16
- **Autor:** brainstorming POV (visual companion)
- **Status:** rascunho para revisão do usuário · **v2** (incorpora 47 achados da revisão adversarial `pov-spec-harden`)
- **Escopo:** a casca de telas em volta do medidor para o **modo local pass-and-play, cooperativo**. Online fica fora (fase futura).

> **Sobre os mockups:** as referências em `.superpowers/brainstorm/9366-1781587486/content/*.html` mostram **layout e direção visual**, não pixels nem números finais. Onde um mockup tem número (ex.: "27 pts"), a fonte canônica é a **§6** desta spec; placeholders ilustrativos não regem a implementação.

---

## 1. Objetivo

Hoje o POV é **uma tela só**: `App.svelte` renderiza `Playground.svelte` (o Medidor de POV, fases `hidden → peek → guessing → reveal`). Falta tudo em volta de uma partida.

Esta spec define as **telas de interface** que transformam o medidor isolado em um **jogo completo de mesa**, preservando a identidade já construída e reaproveitando os componentes existentes — sem regredir física, som, tema e acessibilidade do medidor.

Regra de ouro: **POV deve parecer um jogo físico dentro da tela.** As telas novas são "a caixa e o tabuleiro" em volta do medidor.

## 2. Decisões travadas (brainstorming)

| Decisão | Escolha | Por quê |
|---|---|---|
| Escopo | **Modo local primeiro** | MVP dos docs; hand-off de privacidade já existe; sem backend |
| Pontuação | **Cooperativo** (placar único) | Casa com o medidor único + "palpite final"; sem fricção; sem perdedor |
| Abertura | **A · Medidor herói** | O objeto do jogo como marca; tátil |
| Responsividade | **Mobile + desktop, um componente que reflui** | CSS reflui no breakpoint; não são telas separadas |
| Ritmo do sunburst | Utilidade = console contido; clímax = pôster | Gastar a ousadia em um lugar só |

## 3. Conjunto de telas

5 novas **essenciais** + 1 **plus** (Como jogar) + 2 **sheets**, encaixando na tela de jogo existente:

1. Abertura · 2. Como jogar (plus) · 3. Montar jogadores · 4. Vez de quem · 5. **Em jogo/Medidor (existe)** · 6. Placar entre rodadas · 7. Fim de jogo · 8. Sheets (Configurações + Pausa).

---

## 4. Arquitetura de navegação (state machine de telas)

```
home ──"Jogar"──────────────► setup
home ──"Como jogar"─────────► howToPlay ──(voltar→home | "bora jogar"→setup)
setup ──"Começar partida"───► roundIntro                (config.players fica IMUTÁVEL)
roundIntro ──"Passar pra X"─► [PrivacyHandoff overlay]
        PrivacyHandoff: confirmar ─► inRound (monta InRound, fase peek)
        PrivacyHandoff: Voltar/Esc ─► permanece em roundIntro (overlay fecha, nada avança)
inRound ──revelação travada (botão OU gesto da roleta)──► scoreboard
scoreboard ──"Próxima rodada"──► [resta rodada? roundIntro : "Ver resultado"→gameOver]
gameOver ──"Jogar de novo"───► roundIntro (reset: roundIndex=0, results=[], mesmos jogadores)
gameOver ──"Trocar jogadores"► setup (mantém nomes via pov-last-players)

Overlays (sobre qualquer tela de jogo): settings, pause, howToPlay, privacyHandoff
  pause:"Reiniciar partida" ─► roundIntro (roundIndex=0, results=[], mesmos jogadores)
  pause:"Sair pro início" ───► home (descarta GameState; pede confirmação leve)
  pause acessível de: roundIntro, inRound, scoreboard
```

**Regras de navegação (resolvendo achados da revisão):**
- **Caminho canônico é sempre o BOTÃO.** O gesto físico de girar a roleta é um **atalho redundante**; nenhuma transição obrigatória depende dele (ver §7.5).
- **Cancelar a privacidade** volta a `roundIntro`; só `confirmar` monta o `InRound` em `peek`.
- **"Jogar de novo"** e **"Reiniciar partida"** = `roundIndex=0`, `results=[]`, mesmos jogadores, rodízio reinicia no `players[0]`, novo sorteio de alvo/carta → `roundIntro` da rodada 1.
- **"Sair pro início"** descarta o `GameState` (sem retomada — §13) e pede confirmação leve.
- **Empilhamento de overlays:** abrir Configurações/Como-jogar a partir da Pausa **empilha** sobre ela; Esc fecha **só o topo** e devolve o foco ao item que abriu; "Como jogar" aberto pela Pausa retorna à Pausa, aberto pela Home retorna à Home.

## 5. Modelo de dados

Estado central novo (Svelte 5 runes), `src/lib/game/store.svelte.ts`:

```ts
type Screen = 'home' | 'howToPlay' | 'setup' | 'roundIntro' | 'inRound' | 'scoreboard' | 'gameOver'

// Subconjunto da paleta válido como ficha (NÃO ColorName inteiro — evita 'console'/'night' etc.)
type PlayerColor = 'coral' | 'piscina' | 'lilas' | 'menta' | 'mostarda' | 'rosa' | 'laranja' | 'petroleo'

type Player = { id: string; name: string; color: PlayerColor } // ordem = rodízio de Dono
type Volta = 1 | 2 | 3            // Curta | Média | Longa
type Deck = 'classico'           // 'picante' | 'familia' = futuros (locked no MVP)

type GameConfig = {
  players: Player[]              // 2..8, IMUTÁVEL após "Começar partida"
  voltas: Volta                  // cada jogador é Dono `voltas` vezes
  deck: Deck
}

type RoundResult = { donoId: string; cardIndex: number; target: number; value: number; score: 0|2|3|4 }
//  `value` = posição final TRAVADA do ponteiro (o bindable do Meter no lock-in). Mesmo nome do Meter.

type GameState = {
  screen: Screen
  config: GameConfig
  roundIndex: number             // 0-based; 0..totalRounds-1
  target: number; value: number; cardIndex: number
  results: RoundResult[]         // placar deriva daqui
}
```

**Derivados (sem estado redundante):**
- `totalRounds = config.voltas * players.length`
- `donoIndex = roundIndex % players.length`  ← **derivado, não estado** (garante rodízio exato; cada jogador é Dono `voltas` vezes; "Jogar de novo" só zera `roundIndex`)
- `dono = players[donoIndex]`; `nextDono = players[(donoIndex + 1) % players.length]`
- `groupScore = sum(results.score)`
- `maxPossibleTotal = totalRounds * 4`     ← usado no **Fim de jogo** e no `sintoniaPctFinal`
- `maxPossibleSoFar = results.length * 4`  ← usado na **barra do Scoreboard entre rodadas**
- `sintoniaPct = round(100 * groupScore / maxPossibleSoFar)` (inteiro) — no Fim usa `maxPossibleTotal`

`theme`('dark'|'light'), `sound`, `haptics`, `reduce` (de `matchMedia`, fonte única) também sobem ao store. Persistência em `localStorage` (§13).

## 6. Regras do modo cooperativo

- Cada rodada: 1 **Dono** (rodízio por `donoIndex`), o resto adivinha junto, **um** palpite final, pontuado por `scoreFor(value, target) → 0|2|3|4` (`geometry.ts:65` — d=0→4, d=1→3, d=2→2, d≥3→0; **nunca 1**). O **grupo** ganha esses pontos.
- **Duração:** Curta=1, Média=2, Longa=3 → `totalRounds = voltas × nºjogadores`. **Ex.: 4 jogadores, Média(2) → 8 rodadas, máx 32 pts.** (bate com os mockups: "de 8", "8 rodadas".)
- **Sorteio do alvo:** extrair para `geometry.ts` como `drawTarget(): number` (em vez de reimplementar). Margem **obrigatória** `ti ∈ [3, STEPS−3]` (hoje `3 + floor(rnd*(STEPS−5))`, STEPS=24 → ti∈[3,21]): as 5 cunhas 2-3-4-3-2 ocupam `tP ± 2.5·STEP_P`; margem <2.5 detentes faz a cunha externa ser **clipada** (`wedges()` filtra), distorcendo a pontuação visível. **Não regredir essa margem.**
- **Selo final** por `sintoniaPct` (inteiro arredondado; faixas exaustivas e sem sobreposição):

| Faixa (inteiro) | Selo |
|---|---|
| `pct ≥ 90` | Telepatas |
| `75 ≤ pct ≤ 89` | Quase telepatas |
| `50 ≤ pct ≤ 74` | Em boa sintonia |
| `25 ≤ pct ≤ 49` | Pegando o ritmo |
| `pct < 25` | Frequências diferentes |

- **Cópia distinta por nível:** as frases **por rodada** (`tierCopy` do Playground — "Na mesma frequência!", "Quase perfeito.", …) e os **selos finais** (tabela acima) são **conjuntos separados**. Renomeado o selo ≥90% para "Telepatas" justamente para **não colidir** com `tierCopy[4]`.
- **Rótulo do percentual:** usar "**X% de sintonia**" (não "X% em sintonia") para não colidir com o selo "Em boa sintonia".
- Jogadores: **2 a 8** (mín. 2 = 1 Dono + ≥1 palpiteiro). Nota de UX: Longa + 8 jogadores = 24 rodadas (partida longa num aparelho) — aceitável, sem bloqueio.

---

## 7. Especificação por tela

> Tudo herda fontes (Bricolage/Fraunces/Space Grotesk) e os tokens de **escala** de `app.css` (`--sp-*`, `--r-*`, `--fs-*`, `--elev-*`, `--inset-well`, `--pov-*` base, `--tracking-caps`). **Atenção (§8/§10):** os tokens de **tema** (`--bg-base`, `--console-*`, `--text`, `--result-bg`, `--sun-op`, `--ripple-op`, `--dock-bg`…) hoje vivem no `<style>` local do Playground e **precisam ser elevados** a um escopo compartilhado antes de qualquer tela nova usá-los.

### 7.1 Abertura (`home`)
- **Conteúdo:** medidor decorativo + logo `P◉V` + tagline serifada + CTA coral **Jogar** + link **Como jogar** + ações de topo.
- **Reuso/novo:** o medidor da Abertura exige um **modo decorativo NOVO no Meter** (`interactive=false`/`decorative`): hoje `lockGestures` só barra o avanço de fase — ponteiro/tampa/disco continuam arrastáveis e o SVG é `role="slider"` `tabindex="0"` fixo. O modo decorativo deve: desligar handlers de pointer/keydown, remover `role/tabindex`, marcar `aria-hidden`, e silenciar sons. `Logo.svelte` (extrair o gauge-O): trocar `var(--text)` por `currentColor`/prop (a var de tema não existe fora do Playground) e dar `aria-label="POV"` (hoje é lido como "P V" solto).
- **Som:** `unlockAudio()` + `press()` no Jogar (1º gesto destrava o áudio).
- **Bordas:** "Continuar partida" é **fora de escopo do MVP** (§16) — não criar gancho/estado morto.

### 7.2 Como jogar (`howToPlay`)
- **Conteúdo:** 3 passos (segredo → dica → palpite); CTA "Entendi — bora jogar".
- **Layout:** mobile = carrossel; desktop = 3 cartões.
- **A11y (obrigatório):** dots = `<button>` focáveis com `aria-label` ("Passo 2 de 3") + `aria-current`; setas ←/→ trocam passo; região com `aria-live="polite"` anuncia a troca; "Próximo" e "×" como `<button>` reais. **Sem auto-advance** com reduced-motion. Alvos ≥44×44 (o × e os dots dos mockups são menores — crescer a hit-area). Contraste: os rótulos de etapa em menta sobre o painel azul (~2.2:1 no mockup) **reprovam** — usar creme/offwhite ou escurecer o chip até ≥4.5:1 (texto normal) / ≥3:1 (≥18.66px bold).
- **Saídas:** aberto pela Home → "voltar"=home, "bora jogar"=setup; aberto pela Pausa → ambos retornam à Pausa.

### 7.3 Montar jogadores (`setup`)
- **Conteúdo:** lista (ficha colorida + inicial + nome + remover); "1º Dono" na ordem; "+ Adicionar" (2–8); Duração segmentada; Baralho (Clássico; Picante/Família 🔒); CTA "Começar partida · N".
- **Layout:** mobile = coluna única com **área de jogadores+opções rolável (`overflow-y:auto`) sob footer sticky** com o CTA (testar 8 jogadores na menor altura; `padding-bottom` = altura do footer + safe-area). Desktop (≥900px) = console, jogadores em **grade 2 col**, opções+CTA lateral, faixa quadriculada.
- **Reuso/novo:** segmented control vira **`Segmented.svelte`** (extrair CSS+markup+pílula deslizante do `<style>` dev do Playground — §8). `PlayerToken` (novo): cor da ficha = `PlayerColor`; **cor da inicial por luminância** (reusar `ink()` de `Card.svelte:16`), nunca `#fff` fixo (branco reprova sobre menta/mostarda/rosa/piscina). Validar `petroleo` (#1b5a72) como ficha sobre o console azul.
- **Estados/bordas:** mín. 2 (CTA off com 1); nomes vazios → "Jogador N"; cores não repetem (8 cores, 8 jogadores = 1:1); foco vai ao input recém-criado; `config.players` **imutável** após "Começar".

### 7.4 Vez de quem (`roundIntro`)
- **Conteúdo:** "Rodada X de Y" + pontos de rotação; ficha grande do **Dono** (termo neutro "Dono do POV") + nome + carta de escala (pública); CTA "Passar o POV pra {nome}".
- **Reuso/novo:** o interstício de privacidade vira **`PrivacyHandoff.svelte`** (overlay de nível de App, parametrizado com o nome do Dono + callbacks): hoje o `.privacy` é hardcoded e mexe direto em `phase/hasPeeked` do Playground. **`InRound` só monta após `confirmar`** (não antes). Cancelar/Esc → permanece em `roundIntro`.
- **A11y:** pontos de rotação com **reforço não-cromático** (preenchido vs vazio + `aria-label` "João — já foi Dono" / "Bia — Dono atual" / "vazio"); o anel da vez atual deve diferir por forma/tamanho, não só cor. Ícones de topo ≥44px. Glow do Dono off com reduced-motion.

### 7.5 Em jogo / Medidor (`inRound`) — refator do existente
- **Mudança:** extrair de `Playground` o que é **app-level** (tema, som, topbar, fundo, estado de partida) para store/TopBar; `InRound.svelte` recebe `target, cardIndex, dono` e emite **`onRoundComplete(value, score)`** na revelação travada. O fluxo guiado interno permanece.
- **Gesto da roleta (resolução do conflito):** dentro de uma partida real, `onDiscSpin` **NÃO** remonta a rodada (o `setupNewRound` atual furaria o Placar e o rodízio). Em `reveal`, o giro emite o **mesmo evento de "concluir rodada"** → vai para `scoreboard`. O **botão** ("Travar palpite" → reveal; depois o CTA do placar) é o **caminho canônico**; o giro é atalho redundante e tem **equivalente de teclado** garantido pelos botões.
- **Reduced-motion:** `discDraggable` exige `!reduce` (`Meter.svelte:216`) — com reduced-motion o gesto some; por isso nenhuma transição obrigatória pode depender dele. Manter a11y existente do Meter (role=slider, aria-valuetext, live regions de tampa).

### 7.6 Placar entre rodadas (`scoreboard`)
- **Conteúdo:** "Rodada X concluída"; callout "+score" (cor do tier) + frase (`tierCopy`); bloco "Sintonia do grupo" = `groupScore` + barra `groupScore/maxPossibleSoFar` (**não** `maxPossibleTotal`); histórico em tiles por tier; "Próximo Dono: {nome}"; CTA "Próxima rodada".
- **Reuso:** `tierCopy`/`tierVar` e o count-up (extrair para `src/lib/game/scoring.ts`). `PlayerToken`.
- **Última rodada:** CTA vira "Ver resultado" → `gameOver`. O gesto de girar no reveal da última rodada também conduz ao `scoreboard` final (nunca pula o placar).
- **A11y:** `aria-live="polite"` anuncia **só o resultado consolidado** ("Rodada concluída, +3 pontos, sintonia 78%"), **não** cada incremento do count-up; emblemas/tiles decorativos `aria-hidden` com resumo textual equivalente. Tiles do histórico já têm o número dentro (reforço não-cromático ok).

### 7.7 Fim de jogo (`gameOver`)
- **Conteúdo:** emblema-troféu (anéis + `groupScore/maxPossibleTotal`); selo (§6) + `sintoniaPct` final; histórico completo; destaque leve ("Mais afiados quando {Dono}…", só com ≥1 rodada por jogador); CTAs **Jogar de novo** + **Trocar jogadores · Início**.
- **Modo pôster:** sunburst dominante; confete/bloom/`celebrate()` reusados; **scrim/painel atrás do texto-herói** garantindo ≥4.5:1 sobre as faixas claras do gradiente (mostarda/menta/rosa/creme). Tudo off com reduced-motion.
- **Reset ("Jogar de novo"):** ver §4 (roundIndex=0, results=[], rodízio reinicia).

### 7.8 Sheets — Configurações + Pausa (overlays)
- **Configurações:** Som, Vibração, Movimento-reduzido como **`<button role="switch" aria-checked>`** (ou `<input type=checkbox>`) — não os `div` puramente visuais dos mockups; Tema via **`Segmented.svelte`** (role=group + aria-pressed + `:focus-visible`, padrão já existente no Playground). Rodapé "POV vX · Como jogar".
- **Pausa:** Retomar / Como jogar / Configurações / Reiniciar partida / **Sair pro início** (confirmação leve). Destinos em §4.
- **Layout:** mobile = bottom-sheet com alça; desktop = modal centrado; ambos sobre o jogo escurecido+desfocado.
- **A11y/foco:** o **focus-trap NÃO existe hoje** (o `.privacy` só tem `role=dialog aria-modal`). `Sheet.svelte` (novo, base de todos os overlays, inclusive `PrivacyHandoff`) deve: focar o 1º controle ao abrir, ciclar Tab/Shift+Tab, capturar **Esc** (fecha só o topo na pilha), e **restaurar `document.activeElement`** do gatilho ao fechar. Alvos ≥44px.

---

## 8. Arquitetura de componentes

**Pré-requisito (passo 0): elevar o sistema de tema.** Mover `--bg-base`, `--console-*`, `--text`, `--text-soft`, `--result-bg`, `--result-border`, `--dock-bg`, `--sun-op`, `--ripple-op`, etc. do `<style>` do Playground (`.theme-dark`/`.theme-light`, linhas ~523–572) para um **escopo compartilhado** (app.css ou um `<Theme>` wrapper aplicado na raiz). Sem isso, nenhuma tela nova nem o `Background`/`Logo` extraídos terão essas variáveis.

```
App.svelte                 → ROUTER: switch(store.screen) + overlays (Sheet stack)
src/lib/game/
  store.svelte.ts          → GameState + ações + derivados (§5) + persistência
  scoring.ts               → tierCopy (por-rodada), selos (§6), sintoniaPct, drawTarget? (ou em geometry)
src/lib/screens/
  Home · HowToPlay · Setup · RoundIntro · Scoreboard · GameOver
  InRound.svelte           → Playground refatorado (só a rodada; emite onRoundComplete)
src/lib/ui/                → extraídos/novos
  TopBar · Logo (aria-label POV, currentColor)
  Console.svelte           → tray + console-band + bandCells + tokens de console (a "cara de tabuleiro")
  Segmented.svelte         → segmented control + pílula deslizante (extrai do dev do Playground)
  PlayerToken.svelte       → ficha (PlayerColor) + inicial por luminância (ink())
  Background.svelte        → sunburst + ripples + grain + dim-veil (depende do passo 0)
  Sheet.svelte             → base de overlay com FOCUS-TRAP + Esc + retorno de foco (trabalho NOVO)
  PrivacyHandoff.svelte    → interstício parametrizado (usa Sheet)
geometry.ts                → + drawTarget() (margem ti∈[3,STEPS−3])
Meter.svelte               → + modo decorativo (interactive=false) ; redefinir onDiscSpin em partida
```

**Refator do Playground (maior risco):** hoje mistura (a) chrome do app, (b) estado de partida e (c) a rodada, com efeitos (sunburst/ripples/bloom/confetti) e tokens de tema acoplados ao `<style>` local. Plano incremental: **passo 0 (tema)** → extrair Background/Console/Logo/Segmented → lift de estado para o store → `InRound` enxuto. Manter `svelte-check` 0/0 + build + smoke test a cada passo.

## 9. Estratégia responsiva

- **Mobile-first.** Distinguir dois conceitos (não confundir como na v1):
  - **Largura máx. de conteúdo:** ~720–760px (coluna única centrada).
  - **Breakpoint de reflow p/ 2 colunas:** **≥ 900px** (bate com as janelas 760–960 dos mockups). Abaixo disso = coluna única, mais larga. 720px de viewport **não** comporta os grids 2-col descritos.
- Sheets: bottom-sheet < 900px, modal centrado ≥ 900px.
- `env(safe-area-inset-*)` em headers/footers/sheets (já praticado).

## 10. Sistema visual (reuso)

- **Paleta:** `tokens.ts`. Fichas = `PlayerColor` (subconjunto de 8).
- **Console azul moldado + faixa quadriculada** = assinatura de tabuleiro nas telas de utilidade → encapsulado em `Console.svelte` (§8); não é "só o array `bandCells`".
- **Sunburst** dominante só no Fim de jogo; atmosférico nas demais.
- **Tema dark/light:** os tokens precisam ser elevados (§8 passo 0); não vêm de app.css hoje.
- **Contraste:** alvo geral ≥4.5:1 (texto normal) / ≥3:1 (≥18.66px bold). CTA coral `--pov-coral-cta` (#c8412f ≈4.9:1) ok para o texto grande bold. **Medir e corrigir:** rótulos menta no tutorial, `.ghost`/`.danger` das sheets (`#f0a596` sobre fundo translúcido provavelmente reprova), iniciais sobre fichas claras, texto sobre sunburst.

## 11. Som & háptica

| Evento | API (`clicks.ts`) |
|---|---|
| Botão/aba | `press()` |
| Confirmar forte / lock-in | `confirm()` / `thunk()` |
| Carta encaixa (add jogador / nova carta) | `dock()` |
| Count-up de pontuação | `tick()` por ponto |
| Surgimento do resultado | `scoreSting(tier)` |
| Acerto perfeito / Fim de jogo | `celebrate()` |
| Roleta | `ratchet()` — **interno ao Meter** (disparado pelo gesto do disco), não chamado pelas telas; o CTA "Próxima rodada" usa `press()`/`confirm()` |

Háptica desacoplada via `haptic()` (respeita `setHapticsEnabled`). Áudio destrava no 1º gesto (`unlockAudio()`).

## 12. Acessibilidade (consolidado)

- **Overlays:** `role="dialog"`, `aria-modal`, **focus-trap + Esc + retorno de foco** via `Sheet.svelte` (trabalho novo; aplicar inclusive ao `PrivacyHandoff`). Empilhamento: Esc fecha só o topo.
- **Foco visível** (`:focus-visible` com `--pov-mostarda`) em todos os controles (padrão já no Playground).
- **Live regions:** anunciar **resultado consolidado** (não o count-up); decorativos `aria-hidden` + resumo textual.
- **Controles semânticos:** toggles = `role="switch" aria-checked`; segmented = `role="group" + aria-pressed`; dots do carrossel = `<button>`.
- **Reduced-motion — enumeração completa (off ou degradado):** sunburst dominante + conic-gradient do Fim, `.bloom`, `.confetti`, glow do Dono, `suspense-pulse`+`dim-veil` da revelação, count-up (já curto-circuitado), pílula deslizante do segmented, **gesto da roleta** (indisponível — nenhuma transição obrigatória depende dele), auto-advance do carrossel, e **transições de tela** (ver §14). Fonte única de `reduce` = o `$effect` de `matchMedia` (Playground:240) promovido ao store.
- **Distinção não-cromática** (WCAG 1.4.1): pontos de rotação e tiles com rótulo/forma além da cor.
- **Alvos de toque ≥ 44×44** (× , dots, ícones de topo, CTAs secundários — crescer hit-area).
- **Contraste** conforme §10. Cópia em **pt-BR** (glossário: Dono do POV, alvo, palpite final, sintonia).

## 13. Persistência

- `localStorage`: `pov-theme` (existe), `pov-sound`, `pov-haptics`, `pov-reduced`, `pov-last-players` (repreenche o Setup ao "Trocar jogadores"). Estado de partida só em memória (**sem retomar** no MVP).

## 14. Riscos & questões abertas

- **R1 — Refator do Playground** (alto): ver §8; passos pequenos + check + smoke test.
- **R2 — Conteúdo de cartas** (médio): hoje 4 cartas hardcoded. **Q1:** quantas cartas no "Clássico" e de onde vêm (lista fixa em `src/lib/cards/decks.ts` vs arquivo)? Sugestão: ≥40 cartas pt-BR num módulo de dados.
- **R3 — Linguagem de transição entre telas** (resolvida como default): **cross-fade ~180ms** normal; **troca instantânea** sob reduced-motion (não "fade ou nada"). Coreografia mais rica fica como polish opcional.
- **Q2 — "Trocar jogadores"** preserva nomes? **Sim** (via `pov-last-players`).
- **Q3 — Rótulo do Dono:** "Dono do POV" **neutro** (recomendado), sem flexão de gênero.

## 15. Critérios de sucesso

1. Partida cooperativa **completa** num aparelho: Abertura → Setup → (rodadas) → Fim → Jogar de novo.
2. Cada tela funciona e reflui em **mobile e desktop** (breakpoint 2-col ≥900px).
3. **Zero regressão** no medidor — `svelte-check` 0/0 + build + smoke test.
4. Identidade preservada (tátil, retrô-psicodélico, objeto de mesa).
5. **Acessível:** focus-trap, teclado, reduced-motion (enumeração §12), contraste ≥AA, alvos ≥44px, em todas as telas novas.

## 16. Fora de escopo (futuro)

- Modo **online** (salas/código/lobby/sync).
- Pontuação competitiva/por times; **packs** (Picante/Família).
- **Retomar partida** ("Continuar"); estatísticas/histórico persistente; marcadores por jogador no medidor.

---

## Apêndice — rastreabilidade da revisão adversarial

47 achados (`pov-spec-harden`): 14 alto · 18 médio · 15 baixo, em 4 lentes (Reuso 11 · Navegação 12 · Lógica 9 · A11y 15). Todos os de severidade **alta** e **média** foram incorporados acima (modo decorativo do Meter, elevação dos tokens de tema, componentização de Console/Segmented/Sheet/PrivacyHandoff/Background, conflito do gesto da roleta, `donoIndex` derivado, `maxPossibleSoFar` vs `Total`, focus-trap novo, semântica de toggles, contraste, alvos de toque, reset de "Jogar de novo", ramos de cancelar/Pausa, breakpoint 2-col, reduced-motion completo). Achados **baixos** viraram notas pontuais (logo aria-label, `ratchet` interno, sorteio documentado, cópia distinta por nível, overflow de 8 jogadores).
