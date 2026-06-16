<script lang="ts">
  import Meter from '../meter/Meter.svelte'
  import Console from '../ui/Console.svelte'
  import Logo from '../ui/Logo.svelte'
  import { STEP_P } from '../meter/geometry'
  import { game } from '../game/store.svelte'
  import { unlockAudio, press } from '../audio/clicks'

  // Needle near p=15 (wedge cluster, well inside scoring band) — composed "on-target" look
  const decorTarget = 15 * STEP_P   // ~62.5  (right-of-center, mira zone)
  const decorValue  = 14 * STEP_P   // ~58.3  (one step left: arc + dot show)

  function handlePlay() {
    unlockAudio()
    press()
    game.openSetup()
  }
</script>

<div class="home">
  <div class="hero-col">

    <!-- Decorative dial — aria-hidden, inert, no sound -->
    <div class="dial-wrap">
      <Console>
        <Meter
          decorative
          phase="reveal"
          showTarget
          target={decorTarget}
          value={decorValue}
          treatment="hibrido"
          light={game.theme === 'light'}
        />
      </Console>
    </div>

    <!-- Identity block: logo + tagline -->
    <div class="id-block">
      <Logo size="46px" />
      <p class="tagline">Acerte o ponto de vista dos seus amigos.</p>
    </div>

    <!-- Primary CTA -->
    <button class="cta" onclick={handlePlay}>Jogar</button>

  </div>
</div>

<style>
  /* ── Outer centering shell ── */
  .home {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-6) var(--sp-4) var(--sp-7);
  }

  /* ── Hero column ── */
  .hero-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-6);
    width: 100%;
    max-width: min(720px, 92vw);
  }

  /* ── Dial wrapper: let the Console fill the column width ── */
  .dial-wrap {
    width: 100%;
  }

  /* ── Logo + tagline ── */
  .id-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
  }

  .tagline {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: clamp(1rem, 3.5vw, 1.1875rem);
    line-height: var(--lh-body);
    color: var(--text-soft);
    text-align: center;
    max-width: 28ch;
    /* optical sizing from Fraunces variable axis */
    font-optical-sizing: auto;
  }

  /* ── Primary CTA ── */
  .cta {
    /* Reset */
    appearance: none;
    border: none;
    cursor: pointer;
    /* Layout */
    display: block;
    width: 100%;
    max-width: 360px;
    min-height: 52px;
    padding: var(--sp-4) var(--sp-6);
    /* Type */
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-600);
    letter-spacing: 0.01em;
    color: #fff;
    text-align: center;
    /* Shape + depth */
    background: var(--pov-coral-cta);
    border-radius: var(--r-4);
    border-bottom: 4px solid var(--pov-coral-lo);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      0 4px 14px -4px rgba(200, 65, 47, 0.5);
    /* Transition */
    transition:
      transform 80ms ease,
      box-shadow 80ms ease,
      border-bottom-width 80ms ease,
      border-bottom-color 80ms ease;
  }

  .cta:hover {
    background: color-mix(in srgb, var(--pov-coral-cta) 92%, white 8%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 6px 18px -4px rgba(200, 65, 47, 0.6);
  }

  .cta:active {
    transform: translateY(2px);
    border-bottom-width: 2px;
    border-bottom-color: var(--pov-coral-skirt);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 2px 6px -2px rgba(200, 65, 47, 0.4);
  }

  .cta:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 3px;
  }

  /* ── Desktop bump (≥900px) ── */
  @media (min-width: 900px) {
    .home {
      padding: var(--sp-8) var(--sp-6);
    }
    .hero-col {
      gap: var(--sp-7);
    }
    .tagline {
      font-size: var(--fs-700);
      max-width: 32ch;
    }
    .cta {
      font-size: var(--fs-700);
      min-height: 60px;
      max-width: 400px;
    }
  }
</style>
