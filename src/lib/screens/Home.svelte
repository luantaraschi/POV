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
    game.openModeSelect()
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
      <!-- h1 is sr-only: the Logo is the visual heading for this screen -->
      <h1 class="sr-only">POV</h1>
      <p class="tagline">Acerte o ponto de vista dos seus amigos.</p>
    </div>

    <!-- Primary CTA -->
    <button class="cta" onclick={handlePlay}>Jogar</button>

    <!-- Secondary: tutorial link -->
    <button class="how-link" onclick={() => game.openHowToPlay()}>Como jogar</button>

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
  /* Console follows the column width instead of its own min(720px,96vw),
     so capping .hero-col actually shrinks the decorative dial. */
  .dial-wrap :global(.console) {
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

  /* ── Secondary "Como jogar" link-button ── */
  .how-link {
    /* reset */
    appearance: none;
    border: none;
    background: transparent;
    cursor: pointer;
    /* sizing — ≥44px tap target with padding */
    min-height: 44px;
    padding: var(--sp-2) var(--sp-4);
    /* type */
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-500);
    color: var(--text-soft);
    text-align: center;
    letter-spacing: 0.01em;
    /* subtle underline hint */
    text-decoration: underline;
    text-decoration-color: transparent;
    text-underline-offset: 3px;
    transition: color 120ms ease, text-decoration-color 120ms ease;
  }

  .how-link:hover {
    color: var(--text);
    text-decoration-color: currentColor;
  }

  .how-link:active {
    color: var(--pov-menta);
  }

  .how-link:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 3px;
    border-radius: var(--r-1);
  }

  /* ── Accessibility: visually hidden ── */
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

  /* ── Desktop bump (≥900px) ── */
  @media (min-width: 900px) {
    .home {
      /* trimmed vertical padding so the hero fits the viewport (no dead scroll) */
      padding: var(--sp-5) var(--sp-6);
    }
    .hero-col {
      gap: var(--sp-6);
      /* cap so the decorative dial doesn't push content past 100dvh */
      max-width: min(560px, 92vw);
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

  /* On short desktops, keep everything inside the viewport */
  @media (min-width: 900px) and (max-height: 820px) {
    .home {
      padding: var(--sp-4) var(--sp-6);
    }
    .hero-col {
      gap: var(--sp-5);
      max-width: min(480px, 88vw);
    }
  }
</style>
