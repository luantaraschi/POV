<script lang="ts">
  import { game } from '../game/store.svelte'
  import GameOverPoster from '../game/GameOverPoster.svelte'
  import { breakdownRows } from '../game/breakdown'
  import CosmosBackdrop from '../lobby/CosmosBackdrop.svelte'
  import { press, celebrate, unlockAudio } from '../audio/clicks'

  // ---- Reduced-motion (espelha o padrão do InRound) ----
  let reduce = $state(false)
  $effect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduce = mq.matches
    const on = () => (reduce = mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  })

  // ---- Celebra uma única vez ao montar (som + háptico) ----
  let celebrated = $state(false)
  $effect(() => {
    if (!reduce && !celebrated) {
      celebrated = true
      celebrate()
    }
  })

  // ---- CTAs ----
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

<!-- Resumo para leitores de tela -->
<p class="sr-only" aria-live="polite">
  Fim de jogo. {game.selo}. {game.groupScore} de {game.maxTotal} pontos, {game.sintoniaPct}% de sintonia.
</p>

<!-- Palco calmo do pôster: halo cósmico em dose baixa atrás do pôster -->
<div class="stage">
  <div class="halo" aria-hidden="true"><CosmosBackdrop /></div>

  <GameOverPoster
    title={game.selo}
    points={game.groupScore}
    total={game.maxTotal}
    sintoniaPct={game.sintoniaPct}
    breakdown={breakdownRows(game.results)}
  >
    {#snippet cta()}
      <button class="cta-primary" onclick={handlePlayAgain} aria-label="Jogar de novo">
        Jogar de novo
      </button>
      <button class="cta-ghost" onclick={handleChangePlayers} aria-label="Trocar jogadores e voltar ao início">
        Trocar jogadores
      </button>
    {/snippet}
  </GameOverPoster>
</div>

<style>
  /* ---- SR-only ---- */
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

  /* ---- Palco do pôster (saguão calmo Studio Sinal) ---- */
  .stage {
    position: relative;
    z-index: 1;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--sp-6) var(--sp-4);
  }
  /* halo cósmico atrás do pôster: dose baixa, decorativo */
  .halo {
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  }
  /* o pôster flutua acima do halo */
  .stage :global(.poster) {
    position: relative;
    z-index: 1;
    animation: poster-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  @keyframes poster-in {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.985);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* ---- CTA primário (--red, branco) ---- */
  .cta-primary {
    flex: 1;
    border: 0;
    cursor: pointer;
    min-height: 52px;
    border-radius: var(--r-4, 16px);
    padding: var(--sp-3) var(--sp-4);
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: var(--fs-500, 1rem);
    color: #fff;
    letter-spacing: 0.01em;
    background: var(--red);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.16),
      0 4px 14px -4px color-mix(in srgb, var(--red) 55%, transparent);
    transition:
      transform 0.08s ease,
      box-shadow 0.12s ease,
      filter 0.12s ease;
  }
  .cta-primary:hover {
    filter: brightness(1.06);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 6px 18px -4px color-mix(in srgb, var(--red) 65%, transparent);
  }
  .cta-primary:active {
    transform: translateY(2px);
    filter: brightness(0.96);
  }
  .cta-primary:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 3px;
  }

  /* ---- CTA fantasma (contorno --hair) ---- */
  .cta-ghost {
    flex: 1;
    cursor: pointer;
    min-height: 52px;
    border: 1px solid var(--hair);
    border-radius: var(--r-4, 16px);
    padding: var(--sp-3) var(--sp-4);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-400, 0.875rem);
    color: var(--ink-soft);
    background: var(--surface);
    transition:
      background 0.12s ease,
      color 0.12s ease,
      transform 0.08s ease;
  }
  .cta-ghost:hover {
    background: var(--sunk);
    color: var(--ink);
  }
  .cta-ghost:active {
    transform: scale(0.98);
  }
  .cta-ghost:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 3px;
  }

  /* Empilha os CTAs no mobile estreito para alvos confortáveis */
  @media (max-width: 380px) {
    .stage :global(.poster .cta) {
      flex-direction: column;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .stage :global(.poster) {
      animation: none;
    }
  }
</style>
