<script lang="ts">
  import { game } from '../game/store.svelte'
  import { sintoniaPct } from '../game/rules'
  import { tierVar } from '../game/scoring'
  import { palette } from '../design/tokens'
  import { press, celebrate, unlockAudio } from '../audio/clicks'

  // ---- Reduced-motion (mirrors InRound pattern) ----
  let reduce = $state(false)
  $effect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduce = mq.matches
    const on = () => (reduce = mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  })

  // ---- Celebrate once on mount (sound + haptic) ----
  let celebrated = $state(false)
  $effect(() => {
    if (!reduce && !celebrated) {
      celebrated = true
      celebrate()
    }
  })

  // ---- Derived values ----
  const pct = $derived(sintoniaPct(game.groupScore, game.maxTotal))

  // ---- Highlight stat: player whose rounds-as-Dono had highest total ----
  // Only shown if every player was Dono at least once (totalRounds >= players.length)
  const highlightPlayer = $derived((): string | null => {
    if (game.totalRounds < game.config.players.length) return null
    const byDono: Record<string, number> = {}
    for (const r of game.results) {
      byDono[r.donoId] = (byDono[r.donoId] ?? 0) + r.score
    }
    // Check every player appeared at least once as Dono
    for (const p of game.config.players) {
      if (byDono[p.id] === undefined) return null
    }
    let bestId = ''
    let bestScore = -1
    for (const [id, score] of Object.entries(byDono)) {
      if (score > bestScore) { bestScore = score; bestId = id }
    }
    return game.config.players.find(p => p.id === bestId)?.name ?? null
  })

  // ---- Confetti + bloom: same palette as InRound ----
  const bloomRings = [
    { r: 32, c: palette.bullseye },
    { r: 50, c: palette.menta },
    { r: 68, c: palette.mostarda },
    { r: 86, c: palette.coral },
    { r: 104, c: palette.lilas },
  ]
  const confettiDots = Array.from({ length: 24 }, (_, i) => {
    const ang = (i / 24) * Math.PI * 2
    return {
      dx: Math.cos(ang),
      dy: Math.sin(ang) - 0.3,
      c: [palette.bullseye, palette.mostarda, palette.coral, palette.menta, palette.lilas][i % 5],
      delay: (i % 7) * 0.025,
      r: 5 + (i % 4) * 2,
    }
  })

  // ---- Button handlers ----
  function handlePlayAgain() {
    unlockAudio()
    press()
    game.playAgain()
  }
  function handleChangePlayers() {
    unlockAudio()
    press()
    game.changePlayers()
  }
</script>

<!-- Screen-reader summary (sr-only) -->
<p class="sr-only" aria-live="polite">
  Fim de jogo. {game.selo}. {game.groupScore} de {game.maxTotal} pontos, {pct}% de sintonia.
</p>

<!-- Sunburst (static — always rendered, no animation required) -->
<div class="sunburst" aria-hidden="true"></div>
<!-- Scrim: radial veil over the sunburst so text stays readable -->
<div class="scrim" aria-hidden="true"></div>

<!-- Main content -->
<main class="poster">
  <!-- Eyebrow -->
  <p class="eyebrow" aria-hidden="true">Fim de jogo</p>

  <!-- Emblem: concentric palette rings + score overlay -->
  <div class="emblem-wrap">
    <svg
      class="emblem-svg"
      viewBox="0 0 200 200"
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="94" fill="none" stroke={palette.coral}    stroke-width="7" />
      <circle cx="100" cy="100" r="80" fill="none" stroke={palette.mostarda} stroke-width="7" />
      <circle cx="100" cy="100" r="66" fill="none" stroke={palette.menta}    stroke-width="7" />
      <circle cx="100" cy="100" r="52" fill="none" stroke={palette.piscina}  stroke-width="7" />
      <circle cx="100" cy="100" r="43" fill={palette.creme} />
    </svg>
    <div class="emblem-score" aria-label="{game.groupScore} de {game.maxTotal} pontos">
      <span class="score-num">{game.groupScore}</span>
      <span class="score-denom">de {game.maxTotal}</span>
    </div>
  </div>

  <!-- Seal name + subtitle -->
  <div class="seal-block">
    <p class="seal-name">{game.selo}</p>
    <p class="seal-sub">
      {pct}% de sintonia
      · {game.config.players.length} jogadores
      · {game.totalRounds} rodadas
    </p>
  </div>

  <!-- History tiles -->
  <div class="history" aria-hidden="true">
    {#each game.results as r}
      <span
        class="tile"
        style="background: {tierVar(r.score)}; color: {r.score === 4 ? palette.creme : palette.black};"
      >{r.score}</span>
    {/each}
  </div>

  <!-- Highlight stat pill (optional) -->
  {#if highlightPlayer()}
    <p class="highlight-pill">
      ⚡ Mais afiados quando <strong>{highlightPlayer()}</strong> deu as dicas
    </p>
  {/if}
</main>

<!-- Footer CTAs -->
<footer class="cta-footer">
  <button class="btn-primary cta-play" onclick={handlePlayAgain} aria-label="Jogar de novo">
    Jogar de novo
  </button>
  <button class="btn-ghost cta-change" onclick={handleChangePlayers} aria-label="Trocar jogadores e voltar ao início">
    Trocar jogadores · Início
  </button>
</footer>

<!-- Confetti + bloom: only when !reduce -->
{#if !reduce}
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

<style>
  /* ---- SR-only utility ---- */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  /* ---- Sunburst layer (pôster) ---- */
  /* Stronger than Shell's Background; scoped to this screen */
  .sunburst {
    position: absolute;
    left: 50%;
    top: -10%;
    width: 820px;
    height: 820px;
    transform: translateX(-50%);
    background: conic-gradient(
      from 200deg at 50% 100%,
      #e25744, #e57a37, #e8b24a, #93cfa9, #4ea7c4, #b3a0dd, #e7aebf, #e25744
    );
    -webkit-mask: radial-gradient(circle at 50% 100%, #000 0%, rgba(0,0,0,.55) 42%, transparent 68%);
    mask: radial-gradient(circle at 50% 100%, #000 0%, rgba(0,0,0,.55) 42%, transparent 68%);
    opacity: 0.52;
    z-index: 0;
    pointer-events: none;
  }

  /* ---- Scrim: keeps hero text ≥4.5:1 over the sunburst ---- */
  .scrim {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background: radial-gradient(
      ellipse 72% 56% at 50% 48%,
      rgba(22, 41, 78, 0.78) 0%,
      rgba(22, 41, 78, 0.52) 52%,
      transparent 100%
    );
  }

  /* ---- Main poster layout ---- */
  .poster {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-3);
    padding: var(--sp-6) var(--sp-4) var(--sp-4);
    text-align: center;
  }

  /* ---- Eyebrow ---- */
  .eyebrow {
    margin: 0;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 0.625rem; /* 10px */
    font-weight: 700;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--pov-menta, #93cfa9);
  }

  /* ---- Emblem ---- */
  .emblem-wrap {
    position: relative;
    width: 192px;
    height: 192px;
    margin: var(--sp-2) 0;
    flex: none;
  }
  .emblem-svg {
    width: 100%;
    height: 100%;
    filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.45));
  }
  .emblem-score {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0;
    /* pointer passthrough so SVG is cleanly aria-hidden */
    pointer-events: none;
  }
  .score-num {
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800;
    font-size: 3rem; /* 48px */
    line-height: 0.9;
    color: #16294e; /* night — over creme disc, always good contrast */
    font-variant-numeric: tabular-nums lining-nums;
  }
  .score-denom {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-weight: 700;
    font-size: 0.8125rem; /* 13px */
    color: #5a6b86;
    margin-top: 2px;
  }

  /* ---- Seal block ---- */
  .seal-block {
    display: flex;
    flex-direction: column;
    gap: var(--sp-1);
  }
  .seal-name {
    margin: 0;
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800;
    font-size: 2.125rem; /* 34px */
    line-height: 1.05;
    color: var(--text, #f7f1e3);
  }
  .seal-sub {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: 0.9375rem; /* 15px */
    color: rgba(241, 230, 203, 0.82);
  }

  /* ---- History tiles ---- */
  .history {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--sp-1);
    width: min(340px, 96vw);
    margin-top: var(--sp-3);
  }
  .tile {
    flex: none;
    width: 36px;
    height: 36px;
    border-radius: var(--r-2, 8px);
    display: grid;
    place-items: center;
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800;
    font-size: 0.8125rem;
  }

  /* ---- Highlight pill ---- */
  .highlight-pill {
    margin: var(--sp-2) 0 0;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 0.6875rem; /* 11px */
    font-weight: 600;
    color: rgba(241, 230, 203, 0.65);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 20px;
    padding: 6px 14px;
  }
  .highlight-pill strong {
    color: var(--text, #f7f1e3);
    font-weight: 700;
  }

  /* ---- CTA footer ---- */
  .cta-footer {
    position: sticky;
    bottom: 0;
    z-index: 5;
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
    width: 100%;
    padding:
      var(--sp-4)
      max(var(--sp-4), env(safe-area-inset-right))
      max(var(--sp-5), env(safe-area-inset-bottom))
      max(var(--sp-4), env(safe-area-inset-left));
    background: linear-gradient(0deg, var(--footer-grad, rgba(12, 28, 57, 0.96)) 60%, transparent);
    backdrop-filter: blur(6px);
  }

  /* Primary CTA */
  .btn-primary {
    border: 0;
    cursor: pointer;
    width: min(440px, 100%);
    align-self: center;
    min-height: 48px;
    border-radius: var(--r-4, 16px);
    padding: var(--sp-3) var(--sp-5);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-600, 1.125rem);
    color: #fff;
    letter-spacing: 0.01em;
    background: var(--pov-coral-cta, #d4452f);
    border-bottom: 4px solid var(--pov-coral-lo, #a8302a);
    transition:
      transform 0.07s ease,
      filter 0.12s ease;
  }
  .btn-primary:hover {
    filter: brightness(1.06);
  }
  .btn-primary:active {
    transform: translateY(2px);
    border-bottom-width: 2px;
  }
  .btn-primary:focus-visible {
    outline: 3px solid var(--pov-mostarda, #e8b24a);
    outline-offset: 3px;
  }

  /* Ghost CTA */
  .btn-ghost {
    border: 1px solid rgba(255, 255, 255, 0.12);
    cursor: pointer;
    width: min(440px, 100%);
    align-self: center;
    min-height: 48px;
    border-radius: var(--r-4, 14px);
    padding: var(--sp-3) var(--sp-4);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-400, 0.875rem);
    color: rgba(241, 230, 203, 0.75);
    background: rgba(255, 255, 255, 0.06);
    transition:
      background 0.12s ease,
      color 0.12s ease;
  }
  .btn-ghost:hover {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(241, 230, 203, 0.92);
  }
  .btn-ghost:active {
    background: rgba(255, 255, 255, 0.04);
  }
  .btn-ghost:focus-visible {
    outline: 3px solid var(--pov-mostarda, #e8b24a);
    outline-offset: 3px;
  }

  /* ---- Bloom (center of emblem) ---- */
  .bloom {
    position: absolute;
    left: 50%;
    /* Bloom originates from emblem center: roughly 30% from top of screen area */
    top: 38%;
    width: 360px;
    height: 360px;
    z-index: 6;
    pointer-events: none;
    transform: translate(-50%, -50%);
    animation: bloom-out 1s cubic-bezier(0.15, 0.7, 0.3, 1) both;
  }
  @keyframes bloom-out {
    0% {
      transform: translate(-50%, -50%) scale(0.18);
      opacity: 0;
    }
    16% {
      opacity: 0.88;
    }
    100% {
      transform: translate(-50%, -50%) scale(1.6);
      opacity: 0;
    }
  }

  /* ---- Confetti ---- */
  .confetti {
    position: absolute;
    inset: 0;
    z-index: 7;
    pointer-events: none;
  }
  .confetti span {
    position: absolute;
    left: 50%;
    top: 38%;
    width: var(--r);
    height: var(--r);
    border-radius: 50%;
    background: var(--c);
    animation: confetti-fly 0.9s cubic-bezier(0.15, 0.65, 0.28, 1) var(--delay) forwards;
  }
  @keyframes confetti-fly {
    0% {
      transform: translate(-50%, -50%) scale(0.4);
      opacity: 0;
    }
    15% {
      opacity: 1;
    }
    100% {
      transform: translate(
        calc(-50% + var(--dx) * 210px),
        calc(-50% + var(--dy) * 210px + 160px)
      ) scale(1);
      opacity: 0;
    }
  }

  /* ---- Desktop layout (≥900px) ---- */
  @media (min-width: 900px) {
    .sunburst {
      width: 1200px;
      height: 1200px;
      top: -14%;
      opacity: 0.48;
    }
    .emblem-wrap {
      width: 228px;
      height: 228px;
    }
    .score-num {
      font-size: 3.5rem;
    }
    .seal-name {
      font-size: 2.625rem; /* 42px */
    }
    .seal-sub {
      font-size: 1.0625rem; /* 17px */
    }
    .history {
      width: min(480px, 96vw);
    }
    .tile {
      width: 42px;
      height: 42px;
      font-size: 0.9375rem;
    }
    .poster {
      gap: var(--sp-4);
    }
  }

  /* ---- Reduced-motion: disable all animations ---- */
  @media (prefers-reduced-motion: reduce) {
    .bloom,
    .confetti span {
      animation: none;
      display: none;
    }
  }
</style>
