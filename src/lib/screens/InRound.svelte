<script lang="ts">
  import Meter, { type MeterState } from '../meter/Meter.svelte'
  import Card from '../cards/Card.svelte'
  import Console from '../ui/Console.svelte'
  import { scoreFor, stepIndex } from '../meter/geometry'
  import { treatments, palette, type Treatment } from '../design/tokens'
  import { unlockAudio, press, dock, scoreSting, celebrate, tick, thunk } from '../audio/clicks'
  import Segmented from '../ui/Segmented.svelte'
  import PrivacyHandoff from '../ui/PrivacyHandoff.svelte'
  import { tierCopy, tierVar } from '../game/scoring'
  import { game } from '../game/store.svelte'

  let treatment = $state<Treatment>('hibrido')
  let showPrivacy = $state(false) // interstício "passe o aparelho" antes de o Dono ver o alvo
  let devOpen = $state(false) // gaveta de controles de desenvolvimento (pular fases / tratamento)
  let lockGestures = $state(false) // modo teste: gestos mexem as peças mas NÃO avançam de fase
  let hasPeeked = $state(false) // o Dono já viu o alvo nesta rodada
  let toast = $state('') // aviso flutuante curto (feedback dos gestos físicos)
  let toastTimer: ReturnType<typeof setTimeout> | undefined
  function flashToast(msg: string) {
    toast = msg
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => (toast = ''), 2200)
  }

  // Ondas de frequência (a identidade "sintonia") — substitui a linha pontilhada.
  function wavePath(w: number, midY: number, amp: number, len: number, phase: number): string {
    let d = ''
    for (let x = 0; x <= w; x += 3) {
      const y = midY + amp * Math.sin((2 * Math.PI * x) / len + phase)
      d += (x === 0 ? 'M ' : 'L ') + `${x} ${y.toFixed(2)}`
    }
    return d
  }

  // Cores por carta (apresentação local; o texto/índice da carta vivem no store, na MESMA ordem).
  const cardColors = [
    { lc: palette.piscina, rc: palette.coral },
    { lc: palette.creme, rc: palette.lilas },
    { lc: palette.menta, rc: palette.mostarda },
    { lc: palette.creme, rc: palette.laranja },
  ]
  const cardColor = $derived(cardColors[game.cardIndex % cardColors.length])

  const states: Array<{ id: MeterState; label: string }> = [
    { id: 'hidden', label: 'Escondido' },
    { id: 'peek', label: 'Dono vê' },
    { id: 'guessing', label: 'Palpitar' },
    { id: 'reveal', label: 'Revelar' },
  ]
  function setState(s: MeterState) {
    unlockAudio()
    press()
    game.phase = s
  }
  function setupNewRound() {
    showPrivacy = false
    hasPeeked = false
    game.nextRound() // store: novo alvo, valor=12*STEP_P, cardIndex++, phase='hidden' (dispara dock() no $effect abaixo)
    roundSeed++
  }
  function novaRodada() {
    unlockAudio()
    press()
    setupNewRound()
  }
  // gesto físico: jogador agarrou e GIROU o disco na revelação (o giro/som rodam no Meter)
  function handleDiscSpin() {
    if (lockGestures) return // modo teste: só gira, não começa rodada
    setupNewRound()
  }
  // gesto físico: a tampa assentou aberta (Dono viu) / fechada (memorizou) -> avança de fase
  function handleCoverSettle(open: boolean) {
    if (lockGestures) return // modo teste: abre/fecha livre, sem mudar de fase
    if (open && game.phase === 'hidden') {
      game.phase = 'peek'
      hasPeeked = true
    } else if (!open && game.phase === 'peek' && hasPeeked) {
      game.phase = 'guessing'
      flashToast('Palpites liberados — arraste o ponteiro.')
    }
  }
  function setTreatment(id: Treatment) {
    unlockAudio()
    press()
    treatment = id
  }

  // ---- fluxo guiado da rodada: uma única ação primária por fase ----
  const primaryLabel = $derived(
    game.phase === 'hidden' ? 'Passar para o Dono do POV'
    : game.phase === 'peek' ? 'Já memorizei — esconder'
    : game.phase === 'guessing' ? 'Travar palpite'
    : 'Nova rodada',
  )
  function advancePrimary() {
    unlockAudio()
    if (game.phase === 'hidden') {
      press()
      showPrivacy = true // pede o hand-off de privacidade antes de revelar o alvo
    } else if (game.phase === 'peek') {
      press()
      game.phase = 'guessing'
    } else if (game.phase === 'guessing') {
      thunk() // TRAVA o palpite final: encaixe firme, depois a revelação dramática
      game.recordRound(scoreFor(game.value, game.target)) // contabiliza a pontuação cooperativa no travamento
      game.phase = 'reveal'
    } else {
      novaRodada()
    }
  }
  function confirmPrivacy() {
    // confirmado pelo Dono: agora sim o alvo aparece (cobertura abre na fase peek)
    unlockAudio()
    press()
    showPrivacy = false
    hasPeeked = true
    game.phase = 'peek'
  }
  function cancelPrivacy() {
    press()
    showPrivacy = false
  }

  // som de encaixe da carta no suporte quando a rodada troca a carta
  let prevCardIndex: number | undefined
  $effect(() => {
    const ci = game.cardIndex
    if (prevCardIndex !== undefined && ci !== prevCardIndex) dock()
    prevCardIndex = ci
  })

  const hint = $derived(
    game.phase === 'hidden' ? 'Dono do POV: puxe a alavanca e veja onde está o alvo.'
    : game.phase === 'peek' ? 'Memorize o alvo e feche o medidor para liberar os palpites.'
    : game.phase === 'guessing' ? 'Arraste o ponteiro — sinta as travas e os cliques.'
    : 'Revelação! Compare o ponteiro com o alvo.',
  )

  // --- resultado da revelação: pontuação, frase com personalidade, distância ---
  let roundSeed = $state(0)
  const revealScore = $derived(scoreFor(game.value, game.target))
  const revealPhrase = $derived(tierCopy[revealScore][roundSeed % tierCopy[revealScore].length])
  const revealGap = $derived(Math.abs(stepIndex(game.value) - stepIndex(game.target)))
  const gapLabel = $derived(
    revealGap === 0 ? 'no alvo' : revealGap === 1 ? '1 casa de distância' : `${revealGap} casas de distância`,
  )
  const tierVarValue = $derived(tierVar(revealScore))

  // --- revelação em beats (suspense -> resultado) + reduced-motion ---
  let reduce = $state(false)
  $effect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduce = mq.matches
    const on = () => (reduce = mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  })

  let showResult = $state(false)
  let displayScore = $state(0) // número exibido no chip — conta de 0 até a pontuação
  let scoreLanded = $state(false) // dispara o "pop" só quando a contagem termina
  let revealTimer: ReturnType<typeof setTimeout> | undefined
  let countTimer: ReturnType<typeof setInterval> | undefined

  // chamado quando o resultado SURGE na tela -> som de pontuação sincronizado + contagem com cliques
  function onResultShown() {
    if (revealScore === 4) celebrate()
    else scoreSting(revealScore)
    if (reduce || revealScore === 0) {
      displayScore = revealScore
      scoreLanded = true
      return
    }
    displayScore = 0
    scoreLanded = false
    let i = 0
    countTimer = setInterval(() => {
      i++
      displayScore = i
      tick(0.7) // cada ponto "encaixa" como um detente
      if (i >= revealScore) {
        clearInterval(countTimer)
        countTimer = undefined
        scoreLanded = true
      }
    }, 95)
  }

  $effect(() => {
    const p = game.phase
    clearTimeout(revealTimer)
    if (countTimer) {
      clearInterval(countTimer)
      countTimer = undefined
    }
    if (p === 'reveal') {
      if (reduce) {
        showResult = true
        onResultShown()
      } else {
        // espera a tampa terminar de abrir (AUTO_DUR ~680ms) -> o resultado entra no clímax
        revealTimer = setTimeout(() => {
          showResult = true
          onResultShown()
        }, 700)
      }
    } else {
      showResult = false
      displayScore = 0
      scoreLanded = false
    }
  })

  const showConfetti = $derived(game.phase === 'reveal' && showResult && revealScore === 4 && !reduce)
  // bloom de sunburst arco-íris no acerto perfeito (assinatura de identidade no pico de emoção)
  const bloomRings = [
    { r: 30, c: palette.bullseye },
    { r: 48, c: palette.menta },
    { r: 66, c: palette.mostarda },
    { r: 84, c: palette.coral },
    { r: 102, c: palette.lilas },
  ]
  const confettiDots = Array.from({ length: 16 }, (_, i) => {
    const ang = (i / 16) * Math.PI * 2
    return {
      dx: Math.cos(ang),
      dy: Math.sin(ang) - 0.25,
      c: [palette.bullseye, palette.mostarda, palette.coral, palette.menta][i % 4],
      delay: (i % 5) * 0.02,
      r: 5 + (i % 3) * 2,
    }
  })
</script>

<main class="stage">
    <Console>
      <div class="screen">
        <Meter
          target={game.target}
          bind:value={game.value}
          phase={game.phase}
          {treatment}
          light={game.theme === 'light'}
          {roundSeed}
          scaleLeft={game.card.left}
          scaleRight={game.card.right}
          onCoverSettle={handleCoverSettle}
          onDiscSpin={handleDiscSpin}
          showTarget={game.phase === 'reveal' && showResult}
          {lockGestures}
        />
      </div>
      <svg class="wave-band" viewBox="0 0 600 34" preserveAspectRatio="none" aria-hidden="true">
        <path d={wavePath(600, 17, 7.5, 48, 0)} fill="none" stroke="var(--pov-coral)" stroke-width="3" vector-effect="non-scaling-stroke" />
        <path d={wavePath(600, 17, 7.5, 48, 2.1)} fill="none" stroke="var(--pov-mostarda)" stroke-width="3" vector-effect="non-scaling-stroke" />
        <path d={wavePath(600, 17, 7.5, 48, 4.2)} fill="none" stroke="var(--pov-bullseye)" stroke-width="3" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="card-dock">
        {#key game.cardIndex}
          <Card left={game.card.left} right={game.card.right} leftColor={cardColor.lc} rightColor={cardColor.rc} />
        {/key}
      </div>
    </Console>

    {#if game.phase === 'reveal'}
      {#if showResult}
        <div class="result" style:--tier={tierVarValue} aria-live="polite">
          <div class="chip"><span class="num" class:pop={scoreLanded}>{displayScore}</span></div>
          <div class="result-text">
            <p class="phrase">{revealPhrase}</p>
            <p class="pts">{revealScore} pontos · {gapLabel}</p>
          </div>
        </div>
      {:else}
        <p class="hint suspense">Revelando o POV…</p>
      {/if}
    {:else}
      <p class="hint">{hint}</p>
    {/if}
  </main>

  <footer class="footer">
    <button class="btn-primary primary-action" onclick={advancePrimary}>{primaryLabel}</button>
    {#if game.phase === 'reveal'}
      <p class="spin-hint">↻ Gire a roleta para embaralhar — ou toque acima.</p>
    {/if}
    <details class="dev" bind:open={devOpen}>
      <summary>dev</summary>
      <div class="dev-controls">
        <Segmented options={states} value={game.phase} onChange={setState} ariaLabel="Pular para fase" />
        <div class="segment small" role="group" aria-label="Tratamento visual">
          {#each Object.entries(treatments) as [id]}
            <button aria-pressed={treatment === id} onclick={() => setTreatment(id as Treatment)}>
              {id === 'hibrido' ? 'Tátil' : 'Pôster'}
            </button>
          {/each}
        </div>
        <label class="dev-toggle">
          <input type="checkbox" bind:checked={lockGestures} />
          <span>Teste livre — gestos não avançam de fase</span>
        </label>
      </div>
    </details>
  </footer>

  {#if showConfetti}
    <svg class="bloom" viewBox="-120 -120 240 240" aria-hidden="true">
      {#each bloomRings as br}
        <circle r={br.r} fill="none" stroke={br.c} stroke-width="6" />
      {/each}
    </svg>
    <div class="confetti" aria-hidden="true">
      {#each confettiDots as d}
        <span style="--dx:{d.dx};--dy:{d.dy};--c:{d.c};--delay:{d.delay}s;--r:{d.r}px"></span>
      {/each}
    </div>
  {/if}

  {#if toast}
    <div class="toast" role="status">{toast}</div>
  {/if}

  <PrivacyHandoff open={showPrivacy} onConfirm={confirmPrivacy} onCancel={cancelPrivacy} />

<style>
  /* ---- STAGE ---- */
  .stage {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-4);
    padding: var(--sp-5) var(--sp-4) var(--sp-6);
  }
  .screen {
    border-radius: var(--r-4);
  }
  .wave-band {
    display: block;
    width: 100%;
    height: 30px;
    margin: var(--sp-4) 0 var(--sp-3);
    opacity: 0.92;
  }
  .card-dock {
    display: flex;
    justify-content: center;
    padding: var(--sp-3) var(--sp-3) var(--sp-2);
    border-radius: var(--r-4);
    background: var(--dock-bg);
    box-shadow: var(--inset-well);
  }
  .hint {
    align-self: flex-start;
    width: min(720px, 96vw);
    margin: 0 auto;
    padding-left: var(--sp-2);
    font-size: var(--fs-400);
    font-weight: 500;
    color: var(--text-soft);
  }
  .hint.suspense {
    align-self: center;
    text-align: center;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-size: var(--fs-600);
    color: var(--text);
    animation: suspense-pulse 1.1s ease-in-out infinite;
  }
  @keyframes suspense-pulse {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
  }

  /* confete (só no acerto perfeito) */
  .confetti {
    position: absolute;
    inset: 0;
    z-index: 8;
    pointer-events: none;
  }
  /* bloom de sunburst no acerto perfeito: onda de choque arco-íris a partir do centro do medidor */
  .bloom {
    position: absolute;
    left: 50%;
    top: 33%;
    width: 340px;
    height: 340px;
    z-index: 8;
    pointer-events: none;
    transform: translate(-50%, -50%);
    animation: bloom-out 0.85s cubic-bezier(0.15, 0.7, 0.3, 1) both;
  }
  @keyframes bloom-out {
    0% {
      transform: translate(-50%, -50%) scale(0.2);
      opacity: 0;
    }
    18% {
      opacity: 0.9;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.5);
      opacity: 0;
    }
  }
  .confetti span {
    position: absolute;
    left: 50%;
    top: 33%;
    width: var(--r);
    height: var(--r);
    border-radius: 50%;
    background: var(--c);
    animation: confetti-fly 0.8s cubic-bezier(0.15, 0.7, 0.3, 1) var(--delay) forwards;
  }
  @keyframes confetti-fly {
    0% {
      transform: translate(-50%, -50%) scale(0.4);
      opacity: 0;
    }
    18% {
      opacity: 1;
    }
    100% {
      transform: translate(calc(-50% + var(--dx) * 190px), calc(-50% + var(--dy) * 190px + 140px)) scale(1);
      opacity: 0;
    }
  }
  .result {
    align-self: center;
    width: fit-content;
    max-width: min(720px, 96vw);
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-4);
    padding: var(--sp-3) var(--sp-5);
    border-radius: var(--r-4);
    background: var(--result-bg);
    border: 1px solid var(--result-border);
    box-shadow: var(--elev-2);
    color: var(--text);
    animation: result-in 0.42s cubic-bezier(0.18, 0.89, 0.32, 1.05) both;
  }
  .chip {
    flex: none;
    display: grid;
    place-items: center;
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: var(--pov-offwhite);
    border: 3px solid var(--tier);
    box-shadow: var(--elev-1);
  }
  .chip .num {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800;
    font-size: 2.4rem;
    line-height: 1;
    color: var(--tier);
    font-variant-numeric: tabular-nums lining-nums;
  }
  /* o "pop" toca quando a contagem chega na pontuação final, não no início */
  .chip .num.pop {
    animation: num-pop 0.45s cubic-bezier(0.18, 0.89, 0.32, 1.28) both;
  }
  .result-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .result-text .phrase {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-size: var(--fs-700);
    line-height: 1.1;
    color: var(--text);
  }
  .result-text .pts {
    margin: 0;
    font-size: var(--fs-400);
    font-weight: 600;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
  }
  @keyframes result-in {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes num-pop {
    0% {
      transform: scale(0.4);
    }
    60% {
      transform: scale(1.15);
    }
    100% {
      transform: scale(1);
    }
  }

  /* ---- FOOTER ---- */
  .footer {
    position: sticky;
    bottom: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    width: 100%;
    padding: var(--sp-4) max(var(--sp-4), env(safe-area-inset-right)) max(var(--sp-5), env(safe-area-inset-bottom))
      max(var(--sp-4), env(safe-area-inset-left));
    background: linear-gradient(0deg, var(--footer-grad) 58%, transparent);
    backdrop-filter: blur(5px);
  }
  /* ação primária guiada: ocupa a largura, é o foco da rodada */
  .primary-action {
    width: min(440px, 100%);
    align-self: center;
  }
  /* dica do gesto de girar a roleta na revelação */
  .spin-hint {
    align-self: center;
    margin: calc(-1 * var(--sp-1)) 0 0;
    font-size: var(--fs-300);
    font-weight: 500;
    color: var(--text-soft);
    letter-spacing: 0.01em;
  }
  /* toast flutuante: feedback curto dos gestos físicos */
  .toast {
    position: fixed;
    left: 50%;
    bottom: calc(env(safe-area-inset-bottom) + 96px);
    transform: translateX(-50%);
    z-index: 18;
    max-width: 88vw;
    padding: var(--sp-2) var(--sp-4);
    border-radius: var(--r-4);
    background: var(--result-bg);
    border: 1px solid var(--result-border);
    box-shadow: var(--elev-2);
    font-size: var(--fs-400);
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
    animation: toast-in 0.22s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translate(-50%, 8px);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .toast {
      animation: none;
    }
  }
  /* gaveta dev: pular fases / trocar tratamento — de-emphasized, fora do fluxo do jogador */
  .dev {
    align-self: center;
    width: min(720px, 96vw);
  }
  .dev > summary {
    list-style: none;
    width: fit-content;
    margin: 0 auto;
    padding: var(--sp-1) var(--sp-3);
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300);
    font-weight: 600;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--text-soft);
    opacity: 0.55;
    cursor: pointer;
    border-radius: var(--r-2);
    transition: opacity 0.12s ease;
  }
  .dev > summary::-webkit-details-marker {
    display: none;
  }
  .dev[open] > summary,
  .dev > summary:hover {
    opacity: 0.9;
  }
  .dev > summary:focus-visible {
    outline: 2px solid var(--pov-mostarda);
    outline-offset: 2px;
  }
  .dev-controls {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    margin-top: var(--sp-3);
  }
  .dev-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-400);
    color: var(--text-soft);
    cursor: pointer;
  }
  .dev-toggle input {
    width: 18px;
    height: 18px;
    accent-color: var(--pov-coral);
    cursor: pointer;
  }

  /* ---- SEGMENTED CONTROL ---- */
  .segment {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: var(--sp-1);
    padding: var(--sp-1);
    border-radius: var(--r-4);
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
  }
  .segment.small {
    grid-auto-columns: auto;
  }
  .segment button {
    border: 0;
    background: transparent;
    cursor: pointer;
    min-height: 44px;
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--r-3);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-400);
    color: var(--ctrl-fg);
    transition:
      color 0.12s,
      background 0.12s,
      transform 0.08s ease;
  }
  .segment button[aria-pressed='true'] {
    color: var(--ctrl-active-fg);
    background: var(--ctrl-active-bg);
  }
  .segment button:active {
    transform: scale(0.96);
  }
  .segment button:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
  }

  /* ---- PRIMARY BUTTON ---- */
  .btn-primary {
    border: 0;
    cursor: pointer;
    border-radius: var(--r-4);
    padding: var(--sp-3) var(--sp-5);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-600);
    color: #fff;
    letter-spacing: 0.01em;
    background: var(--pov-coral-cta);
    border-bottom: 4px solid var(--pov-coral-lo);
    transition:
      transform 0.07s ease,
      filter 0.12s ease;
  }
  .btn-primary:hover {
    filter: brightness(1.05);
  }
  .btn-primary:active {
    transform: translateY(2px);
    border-bottom-width: 2px;
  }
  .btn-primary:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 3px;
  }
</style>
