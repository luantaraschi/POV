<script lang="ts">
  import { game } from '../game/store.svelte'
  import { palette as designPalette } from '../design/tokens'

  // ── Carousel state ──────────────────────────────────────────────────────
  let step = $state(0)
  const TOTAL = 3

  function goTo(n: number) {
    step = Math.max(0, Math.min(TOTAL - 1, n))
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(step - 1) }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(step + 1) }
  }

  // ── CTA action ────────────────────────────────────────────────────────
  function handleCta() {
    if (game.returnScreen === 'home') {
      game.openSetup()
    } else {
      game.closeHowToPlay()
    }
  }
</script>

<!-- ── Screen wrapper ──────────────────────────────────────────────── -->
<div class="how-to-play">

  <!-- ── Header ──────────────────────────────────────────────────── -->
  <div class="header">
    <h1 class="title">Como jogar</h1>
    <button
      class="close-btn"
      aria-label="Fechar"
      onclick={() => game.closeHowToPlay()}
    >×</button>
  </div>

  <!-- ── Mobile carousel (< 900px) ─────────────────────────────── -->
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div
    class="carousel"
    role="region"
    aria-label="Tutorial — passo a passo"
    onkeydown={handleKeyDown}
    tabindex="-1"
  >
    <!-- sr-only live region for step announcements -->
    <div class="sr-only" aria-live="polite">Passo {step + 1} de {TOTAL}</div>

    <!-- Step cards (only one visible at a time on mobile) -->

    <!-- Step 1: O segredo -->
    <div
      class="step-card"
      class:active={step === 0}
      aria-hidden={step !== 0}
    >
      <div class="step-eyebrow">
        <span class="stepnum" aria-hidden="true">1</span>
        <span class="step-label">O segredo</span>
      </div>

      <div class="illus" aria-hidden="true">
        <!-- Mini half-dial: highlighted target wedge + eye motif -->
        <div class="dial-wrap">
          <svg viewBox="0 0 200 115" class="mini-dial" aria-hidden="true">
            <!-- base arc — creme face -->
            <path d="M18 102 A84 84 0 0 1 182 102 Z" fill={designPalette.creme} />
            <!-- +2 wedge left outer -->
            <path d="M100 102 L108 20.5 A84 84 0 0 1 120 23.4 Z" fill={designPalette.laranja} opacity="0.35"/>
            <!-- +3 wedge left -->
            <path d="M100 102 L120 23.4 A84 84 0 0 1 131.5 28.5 Z" fill={designPalette.mostarda} opacity="0.5"/>
            <!-- +4 bullseye — highlighted target -->
            <path d="M100 102 L131.5 28.5 A84 84 0 0 1 142 35 Z" fill={designPalette.bullseye} opacity="0.85"/>
            <!-- +3 wedge right -->
            <path d="M100 102 L142 35 A84 84 0 0 1 151 43 Z" fill={designPalette.mostarda} opacity="0.5"/>
            <!-- +2 wedge right outer -->
            <path d="M100 102 L151 43 A84 84 0 0 1 160 53 Z" fill={designPalette.laranja} opacity="0.35"/>
            <!-- lid (taupe) — covers the face (represents the secret) -->
            <path d="M18 102 A84 84 0 0 1 182 102 Z" fill="#c9b88c" opacity="0.72"/>
            <!-- hub -->
            <circle cx="100" cy="102" r="10" fill={designPalette.coral} />
            <!-- eye motif — centred above hub (representing the hidden target) -->
            <text x="100" y="68" text-anchor="middle" dominant-baseline="central" font-size="28" aria-hidden="true">👁️</text>
          </svg>
        </div>
      </div>

      <div class="step-body">
        <p class="step-title">Só o Dono vê o alvo</p>
        <p class="step-text">Um jogador vira o <strong>Dono do POV</strong> e vê secretamente onde está o alvo na escala.</p>
      </div>
    </div>

    <!-- Step 2: A dica -->
    <div
      class="step-card"
      class:active={step === 1}
      aria-hidden={step !== 1}
    >
      <div class="step-eyebrow">
        <span class="stepnum" aria-hidden="true">2</span>
        <span class="step-label">A dica</span>
      </div>

      <div class="illus" aria-hidden="true">
        <div class="card-illus">
          <!-- Mini card (no hover/animate needed in tutorial — purely decorative) -->
          <div class="mini-card" aria-hidden="true">
            <div class="mini-half" style:background={designPalette.piscina} style:color="#f7f1e3">
              <span class="mini-chev">‹</span>
              <span class="mini-label">Frio</span>
            </div>
            <div class="mini-seam"></div>
            <div class="mini-half" style:background={designPalette.coral} style:color="#f7f1e3">
              <span class="mini-label">Quente</span>
              <span class="mini-chev">›</span>
            </div>
          </div>
          <!-- Speech bubble -->
          <div class="speech-bubble">
            <span class="bubble-text">"Comer pizza com ketchup"</span>
          </div>
        </div>
      </div>

      <div class="step-body">
        <p class="step-title">Ele dá uma dica</p>
        <p class="step-text">Uma dica curta e subjetiva que aponta pro alvo — <strong>sem entregar</strong> a posição.</p>
      </div>
    </div>

    <!-- Step 3: O palpite -->
    <div
      class="step-card"
      class:active={step === 2}
      aria-hidden={step !== 2}
    >
      <div class="step-eyebrow">
        <span class="stepnum" aria-hidden="true">3</span>
        <span class="step-label">O palpite</span>
      </div>

      <div class="illus" aria-hidden="true">
        <div class="dial-wrap">
          <svg viewBox="0 0 200 115" class="mini-dial" aria-hidden="true">
            <!-- base arc -->
            <path d="M18 102 A84 84 0 0 1 182 102 Z" fill={designPalette.creme} />
            <!-- wedges: slightly different position (needle near) -->
            <path d="M100 102 L108 20.5 A84 84 0 0 1 120 23.4 Z" fill={designPalette.laranja} opacity="0.35"/>
            <path d="M100 102 L120 23.4 A84 84 0 0 1 131.5 28.5 Z" fill={designPalette.mostarda} opacity="0.7"/>
            <path d="M100 102 L131.5 28.5 A84 84 0 0 1 142 35 Z" fill={designPalette.bullseye} opacity="0.8"/>
            <path d="M100 102 L142 35 A84 84 0 0 1 151 43 Z" fill={designPalette.mostarda} opacity="0.7"/>
            <path d="M100 102 L151 43 A84 84 0 0 1 160 53 Z" fill={designPalette.laranja} opacity="0.35"/>
            <!-- needle pointing into +3 zone (one step left of bullseye) -->
            <line x1="100" y1="102" x2="123" y2="28" stroke={designPalette.coral} stroke-width="5.5" stroke-linecap="round"/>
            <!-- needle tip dot (green — guessing mode) -->
            <circle cx="123" cy="28" r="6" fill={designPalette.menta} stroke="#0a1320" stroke-width="1.5"/>
            <!-- hub -->
            <circle cx="100" cy="102" r="10" fill={designPalette.coral} />
            <!-- +3 badge -->
            <rect x="148" y="4" width="30" height="24" rx="12" fill={designPalette.mostarda}/>
            <text x="163" y="16" text-anchor="middle" dominant-baseline="central" font-family="'Bricolage Grotesque', sans-serif" font-weight="800" font-size="11" fill="#3a2a06">+3</text>
          </svg>
        </div>
      </div>

      <div class="step-body">
        <p class="step-title">O grupo adivinha</p>
        <p class="step-text">Vocês movem o ponteiro, travam o palpite e revelam. Quanto mais perto, <strong>mais pontos — juntos</strong>.</p>
      </div>
    </div>
  </div><!-- /.carousel -->

  <!-- ── Mobile: dots + primary button ────────────────────────────── -->
  <div class="mobile-footer">
    <div class="dots" role="group" aria-label="Passos do tutorial">
      {#each { length: TOTAL } as _, i}
        <button
          class="dot"
          class:dot-active={i === step}
          aria-label="Passo {i + 1} de {TOTAL}"
          aria-current={i === step ? 'step' : undefined}
          onclick={() => goTo(i)}
        ></button>
      {/each}
    </div>

    <button class="cta-mobile" onclick={step < TOTAL - 1 ? () => goTo(step + 1) : handleCta}>
      {step < TOTAL - 1 ? 'Próximo ›' : 'Entendi — bora jogar'}
    </button>
  </div>

  <!-- ── Desktop: all 3 cards + CTA ───────────────────────────────── -->
  <div class="desktop-grid" aria-label="Tutorial — todos os passos">
    <!-- Desktop Step 1 -->
    <div class="step-card-d">
      <div class="step-eyebrow">
        <span class="stepnum" aria-hidden="true">1</span>
        <span class="step-label">O segredo</span>
      </div>
      <div class="illus" aria-hidden="true">
        <div class="dial-wrap">
          <svg viewBox="0 0 200 115" class="mini-dial" aria-hidden="true">
            <path d="M18 102 A84 84 0 0 1 182 102 Z" fill={designPalette.creme} />
            <path d="M100 102 L108 20.5 A84 84 0 0 1 120 23.4 Z" fill={designPalette.laranja} opacity="0.35"/>
            <path d="M100 102 L120 23.4 A84 84 0 0 1 131.5 28.5 Z" fill={designPalette.mostarda} opacity="0.5"/>
            <path d="M100 102 L131.5 28.5 A84 84 0 0 1 142 35 Z" fill={designPalette.bullseye} opacity="0.85"/>
            <path d="M100 102 L142 35 A84 84 0 0 1 151 43 Z" fill={designPalette.mostarda} opacity="0.5"/>
            <path d="M100 102 L151 43 A84 84 0 0 1 160 53 Z" fill={designPalette.laranja} opacity="0.35"/>
            <path d="M18 102 A84 84 0 0 1 182 102 Z" fill="#c9b88c" opacity="0.72"/>
            <circle cx="100" cy="102" r="10" fill={designPalette.coral} />
            <text x="100" y="68" text-anchor="middle" dominant-baseline="central" font-size="28" aria-hidden="true">👁️</text>
          </svg>
        </div>
      </div>
      <div class="step-body">
        <p class="step-title">Só o Dono vê o alvo</p>
        <p class="step-text">Um jogador vira o <strong>Dono do POV</strong> e vê secretamente onde está o alvo na escala.</p>
      </div>
    </div>

    <!-- Desktop Step 2 -->
    <div class="step-card-d">
      <div class="step-eyebrow">
        <span class="stepnum" aria-hidden="true">2</span>
        <span class="step-label">A dica</span>
      </div>
      <div class="illus" aria-hidden="true">
        <div class="card-illus">
          <div class="mini-card" aria-hidden="true">
            <div class="mini-half" style:background={designPalette.piscina} style:color="#f7f1e3">
              <span class="mini-chev">‹</span>
              <span class="mini-label">Frio</span>
            </div>
            <div class="mini-seam"></div>
            <div class="mini-half" style:background={designPalette.coral} style:color="#f7f1e3">
              <span class="mini-label">Quente</span>
              <span class="mini-chev">›</span>
            </div>
          </div>
          <div class="speech-bubble">
            <span class="bubble-text">"Comer pizza com ketchup"</span>
          </div>
        </div>
      </div>
      <div class="step-body">
        <p class="step-title">Ele dá uma dica</p>
        <p class="step-text">Uma dica curta e subjetiva que aponta pro alvo — <strong>sem entregar</strong> a posição.</p>
      </div>
    </div>

    <!-- Desktop Step 3 -->
    <div class="step-card-d">
      <div class="step-eyebrow">
        <span class="stepnum" aria-hidden="true">3</span>
        <span class="step-label">O palpite</span>
      </div>
      <div class="illus" aria-hidden="true">
        <div class="dial-wrap">
          <svg viewBox="0 0 200 115" class="mini-dial" aria-hidden="true">
            <path d="M18 102 A84 84 0 0 1 182 102 Z" fill={designPalette.creme} />
            <path d="M100 102 L108 20.5 A84 84 0 0 1 120 23.4 Z" fill={designPalette.laranja} opacity="0.35"/>
            <path d="M100 102 L120 23.4 A84 84 0 0 1 131.5 28.5 Z" fill={designPalette.mostarda} opacity="0.7"/>
            <path d="M100 102 L131.5 28.5 A84 84 0 0 1 142 35 Z" fill={designPalette.bullseye} opacity="0.8"/>
            <path d="M100 102 L142 35 A84 84 0 0 1 151 43 Z" fill={designPalette.mostarda} opacity="0.7"/>
            <path d="M100 102 L151 43 A84 84 0 0 1 160 53 Z" fill={designPalette.laranja} opacity="0.35"/>
            <line x1="100" y1="102" x2="123" y2="28" stroke={designPalette.coral} stroke-width="5.5" stroke-linecap="round"/>
            <circle cx="123" cy="28" r="6" fill={designPalette.menta} stroke="#0a1320" stroke-width="1.5"/>
            <circle cx="100" cy="102" r="10" fill={designPalette.coral} />
            <rect x="148" y="4" width="30" height="24" rx="12" fill={designPalette.mostarda}/>
            <text x="163" y="16" text-anchor="middle" dominant-baseline="central" font-family="'Bricolage Grotesque', sans-serif" font-weight="800" font-size="11" fill="#3a2a06">+3</text>
          </svg>
        </div>
      </div>
      <div class="step-body">
        <p class="step-title">O grupo adivinha</p>
        <p class="step-text">Vocês movem o ponteiro, travam o palpite e revelam. Quanto mais perto, <strong>mais pontos — juntos</strong>.</p>
      </div>
    </div>

    <!-- Desktop CTA -->
    <div class="desktop-cta-row">
      <button class="cta-desktop" onclick={handleCta}>Entendi — bora jogar</button>
    </div>
  </div><!-- /.desktop-grid -->

</div><!-- /.how-to-play -->

<style>
  /* ── Outer shell ─────────────────────────────────────────────────── */
  .how-to-play {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--sp-4) var(--sp-4) var(--sp-6);
    max-width: 600px;
    margin: 0 auto;
    width: 100%;
    gap: var(--sp-4);
  }

  /* ── Header ──────────────────────────────────────────────────────── */
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--sp-1);
  }

  .title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800;
    font-size: var(--fs-700);
    color: var(--text);
    line-height: var(--lh-tight);
  }

  .close-btn {
    /* reset */
    appearance: none;
    border: none;
    background: var(--icon-bg);
    border: 1px solid var(--icon-border);
    cursor: pointer;
    /* sizing — ≥44px tap target */
    width: 44px;
    height: 44px;
    border-radius: var(--r-2);
    /* type */
    font-family: inherit;
    font-size: 1.375rem;
    line-height: 1;
    color: var(--text-soft);
    /* layout */
    display: grid;
    place-items: center;
    flex-shrink: 0;
    transition: background 100ms ease, color 100ms ease;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text);
  }

  .close-btn:active {
    background: rgba(255, 255, 255, 0.05);
    transform: scale(0.95);
  }

  .close-btn:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
  }

  /* ── Carousel (mobile only) ──────────────────────────────────────── */
  .carousel {
    flex: 1;
    position: relative;
    outline: none;
  }

  .step-card {
    /* hidden by default */
    display: none;
    flex-direction: column;
    gap: var(--sp-4);
    background: linear-gradient(180deg, #1e3c66, #11294c);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--r-4);
    padding: var(--sp-5) var(--sp-4);
    box-shadow: 0 12px 28px -16px rgba(0, 0, 0, 0.55);
  }

  .step-card.active {
    display: flex;
  }

  /* ── Eyebrow (number + label) ────────────────────────────────────── */
  .step-eyebrow {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .stepnum {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--pov-coral);
    color: #fff;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800;
    font-size: var(--fs-300);
    display: grid;
    place-items: center;
    flex-shrink: 0;
  }

  .step-label {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: var(--fs-300);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--pov-menta);
  }

  /* ── Illustration area ───────────────────────────────────────────── */
  .illus {
    background: rgba(7, 16, 33, 0.38);
    border-radius: var(--r-3);
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.28);
    padding: var(--sp-3);
  }

  /* ── Mini dial ───────────────────────────────────────────────────── */
  .dial-wrap {
    width: 160px;
    flex-shrink: 0;
  }

  .mini-dial {
    display: block;
    width: 100%;
    height: auto;
  }

  /* ── Mini card (step 2 illustration) ────────────────────────────── */
  .card-illus {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--sp-2);
    width: 100%;
    max-width: 240px;
  }

  .mini-card {
    display: flex;
    width: 100%;
    border-radius: var(--r-2);
    overflow: hidden;
    box-shadow: var(--elev-2);
  }

  .mini-half {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sp-2) var(--sp-3);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: var(--fs-300);
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
  }

  .mini-seam {
    width: 1px;
    background: rgba(17, 35, 63, 0.25);
  }

  .mini-chev {
    opacity: 0.5;
    font-size: 0.875rem;
  }

  .mini-label {
    flex: 1;
    text-align: center;
  }

  /* ── Speech bubble ───────────────────────────────────────────────── */
  .speech-bubble {
    background: var(--pov-creme);
    color: var(--pov-night);
    border-radius: 12px 12px 12px 3px;
    padding: var(--sp-2) var(--sp-3);
    box-shadow: 0 6px 14px -8px rgba(0, 0, 0, 0.45);
    max-width: 100%;
  }

  .bubble-text {
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-size: var(--fs-400);
    line-height: var(--lh-body);
    color: var(--pov-night);
  }

  /* ── Step text ───────────────────────────────────────────────────── */
  .step-body {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  .step-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-600);
    color: var(--pov-offwhite);
    line-height: var(--lh-tight);
  }

  .step-text {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-400);
    line-height: var(--lh-body);
    color: var(--text-soft);
  }

  .step-text strong {
    color: var(--pov-offwhite);
    font-weight: 600;
  }

  /* ── Mobile footer (dots + CTA) ─────────────────────────────────── */
  .mobile-footer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-4);
  }

  .dots {
    display: flex;
    align-items: center;
    gap: var(--sp-2);
  }

  .dot {
    /* reset */
    appearance: none;
    border: none;
    cursor: pointer;
    /* ≥44px tap target, transparent background */
    width: 44px;
    height: 44px;
    padding: 0;
    border-radius: 50%;
    background: transparent;
    position: relative;
    transition: transform 150ms ease;
  }

  /* visual dot inside the button */
  .dot::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.22);
    transition: background 150ms ease, width 150ms ease, border-radius 150ms ease;
  }

  .dot-active::after {
    width: 20px;
    height: 8px;
    border-radius: 4px;
    background: var(--pov-coral);
  }

  .dot:hover::after {
    background: rgba(255, 255, 255, 0.4);
  }

  .dot-active:hover::after {
    background: #ff7d63;
  }

  .dot:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
    border-radius: 50%;
  }

  /* ── Primary CTA (mobile) ────────────────────────────────────────── */
  .cta-mobile {
    appearance: none;
    border: none;
    cursor: pointer;
    display: block;
    width: 100%;
    min-height: 52px;
    padding: var(--sp-3) var(--sp-5);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-600);
    letter-spacing: 0.01em;
    color: #fff;
    text-align: center;
    background: var(--pov-coral-cta);
    border-radius: var(--r-4);
    border-bottom: 4px solid var(--pov-coral-lo);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      0 4px 14px -4px rgba(200, 65, 47, 0.5);
    transition:
      transform 80ms ease,
      box-shadow 80ms ease,
      border-bottom-width 80ms ease;
  }

  .cta-mobile:hover {
    background: color-mix(in srgb, var(--pov-coral-cta) 92%, white 8%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 6px 18px -4px rgba(200, 65, 47, 0.6);
  }

  .cta-mobile:active {
    transform: translateY(2px);
    border-bottom-width: 2px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 2px 6px -2px rgba(200, 65, 47, 0.4);
  }

  .cta-mobile:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 3px;
  }

  /* ── Desktop grid (≥900px) ───────────────────────────────────────── */
  .desktop-grid {
    display: none;
  }

  /* ── Accessibility helpers ───────────────────────────────────────── */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  /* ── Desktop layout ─────────────────────────────────────────────── */
  @media (min-width: 900px) {
    .how-to-play {
      max-width: 960px;
      padding: var(--sp-6) var(--sp-6) var(--sp-7);
    }

    /* Hide mobile carousel + footer on desktop */
    .carousel,
    .mobile-footer {
      display: none;
    }

    /* Show desktop grid */
    .desktop-grid {
      display: flex;
      flex-direction: column;
      gap: var(--sp-5);
      flex: 1;
    }

    /* Reuse structure: wrap the 3 cards in a row via grid auto-layout */
    .desktop-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      grid-template-rows: 1fr auto;
      gap: var(--sp-4);
    }

    .step-card-d {
      display: flex;
      flex-direction: column;
      gap: var(--sp-3);
      background: linear-gradient(180deg, #1e3c66, #11294c);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: var(--r-4);
      padding: var(--sp-5) var(--sp-4);
      box-shadow: 0 12px 28px -16px rgba(0, 0, 0, 0.55);
    }

    .desktop-cta-row {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
    }

    /* Desktop CTA button (same style as mobile) */
    .cta-desktop {
      appearance: none;
      border: none;
      cursor: pointer;
      display: block;
      width: 300px;
      min-height: 52px;
      padding: var(--sp-3) var(--sp-6);
      font-family: 'Bricolage Grotesque', sans-serif;
      font-weight: 700;
      font-size: var(--fs-600);
      letter-spacing: 0.01em;
      color: #fff;
      text-align: center;
      background: var(--pov-coral-cta);
      border-radius: var(--r-4);
      border-bottom: 4px solid var(--pov-coral-lo);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        0 4px 14px -4px rgba(200, 65, 47, 0.5);
      transition:
        transform 80ms ease,
        box-shadow 80ms ease,
        border-bottom-width 80ms ease;
    }

    .cta-desktop:hover {
      background: color-mix(in srgb, var(--pov-coral-cta) 92%, white 8%);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.22),
        0 6px 18px -4px rgba(200, 65, 47, 0.6);
    }

    .cta-desktop:active {
      transform: translateY(2px);
      border-bottom-width: 2px;
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 2px 6px -2px rgba(200, 65, 47, 0.4);
    }

    .cta-desktop:focus-visible {
      outline: 3px solid var(--pov-mostarda);
      outline-offset: 3px;
    }

    /* ── Desktop step body typography ── */
    .step-card-d .step-title {
      font-size: var(--fs-500);
    }

    .step-card-d .step-text {
      font-size: var(--fs-300);
    }

    /* dial slightly smaller on desktop (3 side by side) */
    .step-card-d .dial-wrap {
      width: 140px;
    }
  }

  /* ── Light theme overrides ───────────────────────────────────────── */
  :global(.theme-light) .step-card,
  :global(.theme-light) .step-card-d {
    background: linear-gradient(180deg, #d4e4f7, #bdd0e8);
    border-color: rgba(27, 42, 74, 0.1);
  }

  :global(.theme-light) .step-title {
    color: #1b2a4a;
  }

  :global(.theme-light) .illus {
    background: rgba(27, 42, 74, 0.07);
  }
</style>
