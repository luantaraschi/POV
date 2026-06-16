<script lang="ts">
  import Meter, { type MeterState } from '../lib/meter/Meter.svelte'
  import Card from '../lib/cards/Card.svelte'
  import Background from '../lib/ui/Background.svelte'
  import Console from '../lib/ui/Console.svelte'
  import Logo from '../lib/ui/Logo.svelte'
  import { STEPS, STEP_P, scoreFor, stepIndex } from '../lib/meter/geometry'
  import { treatments, palette, type Treatment } from '../lib/design/tokens'
  import { setSoundEnabled, unlockAudio, press, dock, scoreSting, celebrate, tick, thunk } from '../lib/audio/clicks'
  import { tierCopy, tierVar } from '../lib/game/scoring'

  type Theme = 'dark' | 'light'
  function initTheme(): Theme {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('pov-theme')
      if (saved === 'dark' || saved === 'light') return saved
    }
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
    return 'dark'
  }

  let theme = $state<Theme>(initTheme())
  let phase = $state<MeterState>('hidden')
  let target = $state(15 * STEP_P)
  let value = $state(12 * STEP_P)
  let treatment = $state<Treatment>('hibrido')
  let sound = $state(true)
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

  $effect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem('pov-theme', theme)
  })

  // Ondas de frequência (a identidade "sintonia") — substitui a linha pontilhada.
  function wavePath(w: number, midY: number, amp: number, len: number, phase: number): string {
    let d = ''
    for (let x = 0; x <= w; x += 3) {
      const y = midY + amp * Math.sin((2 * Math.PI * x) / len + phase)
      d += (x === 0 ? 'M ' : 'L ') + `${x} ${y.toFixed(2)}`
    }
    return d
  }

  const cards = [
    { left: 'Frio', right: 'Quente', lc: palette.piscina, rc: palette.coral },
    { left: 'Normal', right: 'Estranho', lc: palette.creme, rc: palette.lilas },
    { left: 'Barato', right: 'Caro', lc: palette.menta, rc: palette.mostarda },
    { left: 'Mal feito', right: 'Bem feito', lc: palette.creme, rc: palette.laranja },
  ]
  let cardIndex = $state(0)
  const card = $derived(cards[cardIndex])

  const states: Array<{ id: MeterState; label: string }> = [
    { id: 'hidden', label: 'Escondido' },
    { id: 'peek', label: 'Dono vê' },
    { id: 'guessing', label: 'Palpitar' },
    { id: 'reveal', label: 'Revelar' },
  ]
  const stateIndex = $derived(Math.max(0, states.findIndex((s) => s.id === phase)))

  function setState(s: MeterState) {
    unlockAudio()
    press()
    phase = s
  }
  function setupNewRound() {
    showPrivacy = false
    hasPeeked = false
    const ti = 3 + Math.floor(Math.random() * (STEPS - 5))
    target = ti * STEP_P
    value = 12 * STEP_P
    cardIndex = (cardIndex + 1) % cards.length // dispara dock() no $effect abaixo
    roundSeed++
    phase = 'hidden'
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
    if (open && phase === 'hidden') {
      phase = 'peek'
      hasPeeked = true
    } else if (!open && phase === 'peek' && hasPeeked) {
      phase = 'guessing'
      flashToast('Palpites liberados — arraste o ponteiro.')
    }
  }
  function toggleSound() {
    sound = !sound
    setSoundEnabled(sound)
    press() // se acabou de mutar, sai mudo (mas o haptic ainda confirma)
  }
  function toggleTheme() {
    unlockAudio()
    press()
    theme = theme === 'dark' ? 'light' : 'dark'
  }
  function setTreatment(id: Treatment) {
    unlockAudio()
    press()
    treatment = id
  }

  // ---- fluxo guiado da rodada: uma única ação primária por fase ----
  const primaryLabel = $derived(
    phase === 'hidden' ? 'Passar para o Dono do POV'
    : phase === 'peek' ? 'Já memorizei — esconder'
    : phase === 'guessing' ? 'Travar palpite'
    : 'Nova rodada',
  )
  function advancePrimary() {
    unlockAudio()
    if (phase === 'hidden') {
      press()
      showPrivacy = true // pede o hand-off de privacidade antes de revelar o alvo
    } else if (phase === 'peek') {
      press()
      phase = 'guessing'
    } else if (phase === 'guessing') {
      thunk() // TRAVA o palpite final: encaixe firme, depois a revelação dramática
      phase = 'reveal'
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
    phase = 'peek'
  }
  function cancelPrivacy() {
    press()
    showPrivacy = false
  }

  // som de encaixe da carta no suporte quando a rodada troca a carta
  let prevCardIndex: number | undefined
  $effect(() => {
    const ci = cardIndex
    if (prevCardIndex !== undefined && ci !== prevCardIndex) dock()
    prevCardIndex = ci
  })

  // theme-color do chrome do navegador acompanha o tema ativo
  $effect(() => {
    if (typeof document === 'undefined') return
    const m = document.querySelector('meta[name="theme-color"]')
    if (m) m.setAttribute('content', theme === 'dark' ? '#0c1d3b' : '#f3e7d2')
  })

  const hint = $derived(
    phase === 'hidden' ? 'Dono do POV: puxe a alavanca e veja onde está o alvo.'
    : phase === 'peek' ? 'Memorize o alvo e feche o medidor para liberar os palpites.'
    : phase === 'guessing' ? 'Arraste o ponteiro — sinta as travas e os cliques.'
    : 'Revelação! Compare o ponteiro com o alvo.',
  )

  // --- resultado da revelação: pontuação, frase com personalidade, distância ---
  let roundSeed = $state(0)
  const revealScore = $derived(scoreFor(value, target))
  const revealPhrase = $derived(tierCopy[revealScore][roundSeed % tierCopy[revealScore].length])
  const revealGap = $derived(Math.abs(stepIndex(value) - stepIndex(target)))
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
    const p = phase
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

  const showConfetti = $derived(phase === 'reveal' && showResult && revealScore === 4 && !reduce)
  // bloom de sunburst arco-íris no acerto perfeito (assinatura de identidade no pico de emoção)
  const bloomRings = [
    { r: 30, c: palette.bullseye },
    { r: 48, c: palette.menta },
    { r: 66, c: palette.mostarda },
    { r: 84, c: palette.coral },
    { r: 102, c: palette.lilas },
  ]
  // suspense: enquanto a tampa abre (antes do resultado), o fundo escurece e foca no medidor
  const revealDim = $derived(phase === 'reveal' && !showResult && !reduce)
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

<div class="scene" class:theme-dark={theme === 'dark'} class:theme-light={theme === 'light'}>
  <Background {theme} dim={revealDim} />

  <header class="topbar">
    <Logo />

    <div class="top-actions">
      <button class="iconbtn" onclick={toggleTheme} aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}>
        {#if theme === 'dark'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        {/if}
      </button>
      <button class="iconbtn" class:muted={!sound} onclick={toggleSound} aria-pressed={sound} aria-label={sound ? 'Desligar som' : 'Ligar som'}>
        {#if sound}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        {/if}
      </button>
    </div>
  </header>

  <main class="stage">
    <Console>
      <div class="screen">
        <Meter
          {target}
          bind:value
          {phase}
          {treatment}
          light={theme === 'light'}
          {roundSeed}
          scaleLeft={card.left}
          scaleRight={card.right}
          onCoverSettle={handleCoverSettle}
          onDiscSpin={handleDiscSpin}
          showTarget={phase === 'reveal' && showResult}
          {lockGestures}
        />
      </div>
      <svg class="wave-band" viewBox="0 0 600 34" preserveAspectRatio="none" aria-hidden="true">
        <path d={wavePath(600, 17, 7.5, 48, 0)} fill="none" stroke="var(--pov-coral)" stroke-width="3" vector-effect="non-scaling-stroke" />
        <path d={wavePath(600, 17, 7.5, 48, 2.1)} fill="none" stroke="var(--pov-mostarda)" stroke-width="3" vector-effect="non-scaling-stroke" />
        <path d={wavePath(600, 17, 7.5, 48, 4.2)} fill="none" stroke="var(--pov-bullseye)" stroke-width="3" vector-effect="non-scaling-stroke" />
      </svg>
      <div class="card-dock">
        {#key cardIndex}
          <Card left={card.left} right={card.right} leftColor={card.lc} rightColor={card.rc} />
        {/key}
      </div>
    </Console>

    {#if phase === 'reveal'}
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
    {#if phase === 'reveal'}
      <p class="spin-hint">↻ Gire a roleta para embaralhar — ou toque acima.</p>
    {/if}
    <details class="dev" bind:open={devOpen}>
      <summary>dev</summary>
      <div class="dev-controls">
        <div class="segment states" role="group" aria-label="Pular para fase" style:--count={states.length} style:--active={stateIndex}>
          <span class="pill" aria-hidden="true"></span>
          {#each states as s}
            <button aria-pressed={phase === s.id} onclick={() => setState(s.id)}>{s.label}</button>
          {/each}
        </div>
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

  {#if showPrivacy}
    <div class="privacy" role="dialog" aria-modal="true" aria-label="Passar o aparelho para o Dono do POV">
      <div class="privacy-card">
        <svg class="privacy-icon" viewBox="0 0 48 48" aria-hidden="true">
          <rect x="14" y="5" width="20" height="38" rx="4.5" fill="none" stroke="currentColor" stroke-width="2.5" />
          <circle cx="24" cy="37.5" r="1.7" fill="currentColor" />
          <path d="M23 14 a6.5 6.5 0 1 1 -4.5 11" fill="none" stroke="var(--pov-coral)" stroke-width="2.6" stroke-linecap="round" />
          <circle cx="29" cy="20" r="1.6" fill="var(--pov-coral)" />
        </svg>
        <p class="privacy-title">Passe o POV para o Dono</p>
        <p class="privacy-sub">Só o Dono do POV pode ver o alvo secreto. Quando ele estiver com o aparelho em mãos, toque abaixo.</p>
        <button class="btn-primary" onclick={confirmPrivacy}>Sou o Dono — ver o alvo</button>
        <button class="privacy-cancel" onclick={cancelPrivacy}>Voltar</button>
      </div>
    </div>
  {/if}
</div>

<style>
  .scene {
    position: relative;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-base);
    color: var(--text);
    transition: background 0.3s ease;
  }
  /* ---- HEADER ---- */
  .topbar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: max(var(--sp-3), env(safe-area-inset-top)) max(var(--sp-5), env(safe-area-inset-right)) var(--sp-3)
      max(var(--sp-5), env(safe-area-inset-left));
    background: linear-gradient(180deg, var(--header-grad), transparent);
    backdrop-filter: blur(3px);
  }
  .top-actions {
    display: flex;
    gap: var(--sp-2);
  }
  .iconbtn {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    color: var(--text);
    background: var(--icon-bg);
    border: 1px solid var(--icon-border);
    border-radius: var(--r-3);
    cursor: pointer;
    transition:
      background 0.12s ease,
      box-shadow 0.12s ease,
      transform 0.08s ease;
  }
  .iconbtn:hover {
    filter: brightness(1.1);
  }
  .iconbtn:active {
    transform: scale(0.94);
  }
  .iconbtn:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 3px;
  }
  /* som desligado = botão "afundado" (recessed), sente-se como um interruptor desligado */
  .iconbtn.muted {
    background: var(--ctrl-track);
    box-shadow: var(--inset-well);
    color: var(--text-soft);
  }
  .iconbtn svg {
    width: 20px;
    height: 20px;
  }

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

  /* interstício de privacidade: "passe o aparelho" antes de o Dono ver o alvo */
  .privacy {
    position: fixed;
    inset: 0;
    z-index: 20;
    display: grid;
    place-items: center;
    padding: var(--sp-5);
    background: rgba(8, 16, 33, 0.6);
    backdrop-filter: blur(8px);
    animation: privacy-fade 0.22s ease both;
  }
  .privacy-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    width: min(380px, 92vw);
    padding: var(--sp-6) var(--sp-5);
    text-align: center;
    border-radius: var(--r-5);
    background: var(--result-bg);
    border: 1px solid var(--result-border);
    box-shadow: var(--elev-3);
    animation: result-in 0.32s cubic-bezier(0.18, 0.89, 0.32, 1.05) both;
  }
  .privacy-icon {
    width: 48px;
    height: 48px;
    color: var(--text);
    margin-bottom: var(--sp-1);
  }
  .privacy-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-700);
    line-height: 1.1;
    color: var(--text);
  }
  .privacy-sub {
    margin: 0 0 var(--sp-2);
    max-width: 30ch;
    font-size: var(--fs-400);
    line-height: var(--lh-body);
    color: var(--text-soft);
  }
  .privacy-card .btn-primary {
    width: 100%;
  }
  .privacy-cancel {
    border: 0;
    background: transparent;
    cursor: pointer;
    min-height: 40px;
    padding: var(--sp-1) var(--sp-3);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-400);
    color: var(--text-soft);
    border-radius: var(--r-2);
  }
  .privacy-cancel:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
  }
  @keyframes privacy-fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
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

  /* segmento de fase: pílula deslizante (a casa ativa "salta" como um detente do dial) */
  .segment.states {
    position: relative;
    gap: 0;
  }
  .segment.states .pill {
    position: absolute;
    top: var(--sp-1);
    bottom: var(--sp-1);
    left: var(--sp-1);
    width: calc((100% - 2 * var(--sp-1)) / var(--count));
    border-radius: 16px;
    background: var(--ctrl-active-bg);
    transform: translateX(calc(var(--active) * 100%));
    transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 0;
    pointer-events: none;
  }
  .segment.states button {
    position: relative;
    z-index: 1;
  }
  .segment.states button[aria-pressed='true'] {
    background: transparent; /* a pílula é o fundo ativo */
  }
  @media (prefers-reduced-motion: reduce) {
    .segment.states .pill {
      transition: none;
    }
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
