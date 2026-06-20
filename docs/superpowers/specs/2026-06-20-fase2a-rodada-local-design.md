# POV — Fase 2a: Rodada Local + Fim de Jogo · Design

**Data:** 2026-06-20
**Branch:** `feat/fase2a-rodada-local`
**Status:** design aprovado (base/layout validados no companion); pendente revisão do spec → plano.

---

## 1. Contexto e objetivo

Segundo bloco do redesign faseado do POV (a Fase 1, o lobby, já está na `main`). A **Fase 2** redesenha as telas DE JOGO na linguagem **Studio Sinal**; é grande demais para um spec só, então foi decomposta:

- **2a (este spec):** **rodada local** (`InRound`) + **fim de jogo** (`GameOver`), com um pôster de fim de jogo **unificado** que servirá também o online.
- **2b (depois):** telas online (sala de espera, rodada online, fim de jogo online).
- **2c (depois):** Setup + tutorial Como Jogar.

**Decisões já travadas com o usuário:**
- **Encenação = "Palco" (dial-herói):** o dial é o herói no saguão calmo (igual ao lobby); a carta de pista é um elemento limpo acima do dial; chrome quieto no topo; revelação focada no dial.
- **Loop mantido (meter-native, sem botões):** espiar → arrastar/travar a agulha → revelar → girar o disco pra próxima rodada. **Não introduzir botões de avançar** (gestos no medidor continuam sendo o avanço; os botões fallback existentes permanecem como acessibilidade).
- **⚠️ A ROLETA FICA EXATAMENTE COMO HOJE — INTOCADA.** O componente `Meter.svelte` **não é modificado** (nem visual, nem física, nem a `palette` JS interna). O dial achatado que apareceu no MOCKUP do companion era só um **stand-in estático**; o build usa o `<Meter>` real, que já tem a aparência que o usuário quer. **Só o layout AO REDOR do dial é reinventado.**

---

## 2. Direção visual (herdada da Fase 1)

Linguagem **Studio Sinal + toque cósmico** (tokens já na `main`, `app.css:9-30`): base minimalista branco-osso (claro) / meia-noite-azul (escuro), superfícies flat, muito respiro, halo cósmico em **dose baixa** atrás do dial, acento de ação `--red`. Tipografia: Clash Display (numerais/títulos), Inter (UI), Space Grotesk (numerais técnicos), Fraunces itálico (frases). **O usuário rejeita versões pesadas/carregadas — errar para a contenção.**

> Coerência: a rodada deve "parecer o lobby em movimento". O dial clássico (face creme, agulha/hub coral, disco navy) convive sobre o saguão limpo — é o único elemento "material" da cena, e isso é proposital (ele é o herói).

---

## 3. Telas e o que muda

### 3.1 `InRound` — a rodada local

Máquina de fases atual **preservada** (`hidden→peek→guessing→reveal→spin`, `game.phase`), com o `<Meter>` montado igual a hoje (`bind:value`, `phase`, `treatment`, `light`, `roundSeed`, `scaleLeft/Right`, `onCoverSettle`, `onDiscSpin`). **Reinventa-se só o redor:**

- **Chrome de topo (quieto):** à esquerda POV-mark + **"Rodada X / Y"**; à direita **"Sintonia NN%"** (do grupo até agora) + **chip "Vez de [Dono]"** (avatar + cor) + botão de **pausa** (abre a PauseSheet existente). Tudo em tokens novos; superfície clara/navy por tema; 44px de alvo.
- **Carta de pista (acima do dial):** um card limpo `--surface` mostrando os dois polos da carta da rodada (ex.: "Inocente ○———○ Traição"), com um rótulo discreto ("A pista desta rodada"). Substitui a apresentação atual da carta. Cores dos polos podem usar o par de cores da carta (do baralho), de forma sóbria.
- **Dica de fase (Fraunces itálico, sutil):** "arraste a agulha e trave" (guessing) / "abra a tampa para espiar" (peek) etc. — reforço do gesto, sem virar botão.
- **Revelação:** quando `reveal`, um **chip de resultado** limpo acima/junto do dial — frase de tier em Fraunces + os **pontos em Clash** ("Na mesma sintonia! · 4 pontos") — e a dica "gire o disco para a próxima rodada" com o glifo de giro. As **cunhas de pontuação** e o alvo são desenhadas pelo **próprio Meter** (intocado) — o redesign não mexe nelas.
- **Fundo:** backdrop calmo Studio Sinal + **halo cósmico sutil** atrás do dial (reutilizar `CosmosBackdrop` ou variante; dose baixa; `aria-hidden`; guard reduced-motion).
- **PrivacyHandoff (fase hidden):** reinventar o overlay de "passe o aparelho" para o estilo Palco — "Passe o aparelho **para [Dono]**" + "só você vê o alvo" + a tampa do dial fechada (cadeado) + "abra a tampa para espiar". Premium, focado, em tokens novos.

**Tokens:** migrar o CSS de `InRound` (e do `PrivacyHandoff`) dos tokens ANTIGOS (`--text`/`--ctrl-*`/`--console-*`/`--pov-*`) para os NOVOS (`--ink`/`--ink-soft`/`--sunk`/`--hair`/`--surface`/`--bone`/`--red`...). **Atenção ao alias-trap:** `--coral`(novo `#e8674a`) ≠ `--pov-coral`(antigo `#e25744`); `--cream` ≠ `--pov-creme`. **O `<Meter>` e a `palette` JS NÃO são tocados** — só o chassi da tela.

> A banda de ondas (`wavePath`) e qualquer cor que o `Meter` pinta continuam como estão (parte da roleta intocada). Se a banda de ondas for desenhada DENTRO do InRound (e não do Meter), mantê-la como está visualmente, só tokenizando se necessário sem mudar a aparência.

### 3.2 `GameOver` (local) + pôster unificado

- Criar um componente **`<GameOverPoster>`** compartilhado (Studio Sinal), parametrizado por dados (pontos, total, sintonia%, breakdown por rodada, selo/título) + **slot/props de CTA**. Substitui o pôster atual (sunburst arco-íris + emblema antigo).
- Conteúdo: **selo POV tipográfico** (monograma, sem mini-dial), título grande ("Telepatas"/o selo conforme a sintonia), **"NN / MM pontos"**, **"NN% sintonia"**, **breakdown por rodada** (mini-indicadores de pontos por rodada), e CTAs.
- `GameOver` local usa o pôster com CTAs **"Jogar de novo"** (`playAgain()`, `--red`) e **"Trocar jogadores"** (`changePlayers()`, contorno).
- O pôster fica pronto para o **OnlineGameOver** (2b) reusar (dados via `conn`, CTA com gate de host) — mas 2a só entrega o uso local. Migrar a dívida de hex (sunburst/scrim/`#16294e`/`#5a6b86`/rgba) para tokens **dentro do novo componente** (não retokenizar o componente antigo que será removido).

---

## 4. Componentes (2a)

**Novos:**
- `src/lib/game/RoundChrome.svelte` — o chrome de topo da rodada (Rodada X/Y · Sintonia · Vez de · pausa).
- `src/lib/game/ClueCard.svelte` — a carta de pista (dois polos) acima do dial.
- `src/lib/game/RevealChip.svelte` — o chip de resultado da revelação (frase de tier + pontos).
- `src/lib/game/GameOverPoster.svelte` — pôster unificado (dados por prop + CTAs por slot).

**Reformular (sem tocar no Meter):**
- `src/lib/screens/InRound.svelte` — novo layout/chassi usando os componentes acima + tokens novos; o `<Meter>` montado igual.
- `src/lib/screens/GameOver.svelte` — passa a renderizar `<GameOverPoster>` com os CTAs locais.
- `PrivacyHandoff` (confirmar caminho via Grep) — reinventado no estilo Palco.

**Intocado:** `src/lib/meter/Meter.svelte`, `src/lib/meter/geometry.ts`, `src/lib/design/tokens.ts` (`palette` JS). Reusar `CosmosBackdrop`, `Sheet`/`PauseSheet`, `clicks` (áudio).

---

## 5. Responsivo, a11y, movimento

- **Responsivo:** `InRound` hoje é 100% fluido (sem media query de largura) — manter esse modelo (`clamp`/`min`). O pôster é responsivo (sem duplicar DOM; um layout que reflowa). Verificar no viewport real (desktop + mobile), claro e escuro.
- **a11y:** `<button>` reais, labels, `:focus-visible`, foco preservado nas transições de fase, `aria-live` discreto para o resultado da revelação, decorativos `aria-hidden`.
- **Movimento:** transições Studio Sinal (160–220ms); a coreografia de revelação (beats/contagem) e os sons (`scoreSting`/`celebrate`/`tick`) **preservados** — só re-emoldurados visualmente. Tudo sob `prefers-reduced-motion`/`game.reduce`. **Não alterar o timing de áudio-visual da revelação** (contrato existente).

---

## 6. Fora de escopo (2a)

- Qualquer mudança no `<Meter>` / na aparência da roleta (decisão: intocada).
- Telas online (2b) e Setup/tutorial (2c).
- Mudar a mecânica/fases/loop da rodada (mantidos).

---

## 7. Critérios de sucesso (2a)

1. `InRound` reinventado no estilo Palco (chrome + carta + revelação + handoff), em tokens novos, claro+escuro, 100% responsivo, com a **roleta exatamente como hoje** (Meter intocado).
2. `<GameOverPoster>` unificado substitui o pôster local, premium e minimalista; `GameOver` local usa-o com os CTAs corretos.
3. Loop meter-native e o contrato de áudio-visual da revelação preservados (uma partida local joga ponta a ponta sem regressão).
4. `npm run check` 0/0, `npm run build` ok, testes verdes; verificação visual nos dois temas/larguras com o **Meter real**.
