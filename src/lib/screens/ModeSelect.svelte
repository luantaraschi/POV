<script lang="ts">
  import Console from '../ui/Console.svelte'
  import { game } from '../game/store.svelte'
  import { press, confirm } from '../audio/clicks'

  function chooseLocal() {
    confirm()
    game.openSetup()
  }
  function chooseOnline() {
    confirm()
    game.openOnline()
  }
</script>

<div class="mode">
  <div class="mode-col">

    <!-- Header: back + title -->
    <div class="mode-header">
      <button
        class="back-btn"
        aria-label="Voltar"
        onclick={() => { press(); game.goHome() }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div class="title-block">
        <h1 class="mode-title">Como vão jogar?</h1>
        <p class="mode-sub">No mesmo lugar ou cada um no seu aparelho.</p>
      </div>
    </div>

    <Console>
      <div class="choices">

        <!-- Local: one device passed around the table -->
        <button class="choice" onclick={chooseLocal}>
          <span class="choice-art choice-art--local" aria-hidden="true">
            <svg viewBox="0 0 64 48" fill="none">
              <rect x="20" y="6" width="24" height="36" rx="4" fill="var(--pov-creme)" stroke="var(--pov-petroleo)" stroke-width="2"/>
              <circle cx="32" cy="20" r="6" fill="none" stroke="var(--pov-coral)" stroke-width="2.4"/>
              <line x1="32" y1="20" x2="36" y2="14" stroke="var(--pov-coral)" stroke-width="2" stroke-linecap="round"/>
              <circle cx="32" cy="20" r="1.6" fill="var(--pov-mostarda)"/>
              <path d="M10 40 q22 8 44 0" stroke="var(--pov-piscina)" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 5" fill="none"/>
            </svg>
          </span>
          <span class="choice-text">
            <span class="choice-title">No mesmo aparelho</span>
            <span class="choice-desc">Passem um celular pela mesa, juntos.</span>
          </span>
          <span class="choice-go" aria-hidden="true">→</span>
        </button>

        <!-- Online: each on their own device, live -->
        <button class="choice choice--online" onclick={chooseOnline}>
          <span class="choice-badge">Novo</span>
          <span class="choice-art choice-art--online" aria-hidden="true">
            <svg viewBox="0 0 64 48" fill="none">
              <rect x="6" y="12" width="16" height="26" rx="3" fill="var(--pov-creme)" stroke="var(--pov-petroleo)" stroke-width="2"/>
              <rect x="42" y="12" width="16" height="26" rx="3" fill="var(--pov-creme)" stroke="var(--pov-petroleo)" stroke-width="2"/>
              <path d="M24 25 h16" stroke="var(--pov-menta)" stroke-width="2.4" stroke-linecap="round" stroke-dasharray="2 4"/>
              <circle cx="14" cy="20" r="3" fill="var(--pov-coral)"/>
              <circle cx="50" cy="20" r="3" fill="var(--pov-piscina)"/>
            </svg>
          </span>
          <span class="choice-text">
            <span class="choice-title">Sala online</span>
            <span class="choice-desc">Cada um no seu celular, ao vivo.</span>
          </span>
          <span class="choice-go" aria-hidden="true">→</span>
        </button>

      </div>
    </Console>

  </div>
</div>

<style>
  .mode {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-5) var(--sp-4) var(--sp-7);
  }
  .mode-col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    width: 100%;
    max-width: min(560px, 92vw);
  }
  .mode-col :global(.console) {
    width: 100%;
  }

  /* Header */
  .mode-header {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
  }
  .back-btn {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: var(--r-2);
    background: var(--icon-bg);
    border: 1px solid var(--icon-border);
    color: var(--text);
    cursor: pointer;
    flex: none;
    transition: filter 0.12s ease, transform 0.08s ease;
  }
  .back-btn:hover { filter: brightness(1.1); }
  .back-btn:active { transform: scale(0.93); }
  .back-btn:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .back-btn svg { width: 18px; height: 18px; }

  .title-block { display: flex; flex-direction: column; gap: 2px; }
  .mode-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800;
    font-size: var(--fs-700);
    color: var(--text);
    line-height: var(--lh-tight);
  }
  .mode-sub {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: var(--fs-400);
    color: var(--text-soft);
    line-height: var(--lh-body);
    font-optical-sizing: auto;
  }

  /* Choice cards */
  .choices {
    display: flex;
    flex-direction: column;
    gap: var(--sp-3);
  }

  .choice {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
    text-align: left;
    padding: var(--sp-3) var(--sp-4);
    border-radius: var(--r-4);
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition:
      transform 0.1s ease,
      border-color 0.14s ease,
      box-shadow 0.14s ease,
      background 0.14s ease;
  }
  .choice:hover {
    border-color: rgba(255, 255, 255, 0.28);
    transform: translateY(-2px);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.08),
      0 8px 20px -10px rgba(0, 0, 0, 0.5);
  }
  .choice:active { transform: translateY(0) scale(0.99); }
  .choice:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 3px; }

  .choice-art {
    flex: none;
    display: grid;
    place-items: center;
    width: 64px;
    height: 48px;
    border-radius: var(--r-2);
    background: rgba(0, 0, 0, 0.18);
  }
  .choice-art svg { width: 56px; height: 42px; }

  .choice-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; flex: 1; }
  .choice-title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-600);
    color: var(--text);
    line-height: var(--lh-tight);
  }
  .choice-desc {
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-400);
    color: var(--text-soft);
    line-height: var(--lh-body);
  }

  .choice-go {
    flex: none;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    color: var(--text-soft);
    opacity: 0.6;
    transition: transform 0.16s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.14s ease;
  }
  .choice:hover .choice-go { transform: translateX(4px); opacity: 1; }

  /* Online card: a touch more inviting (menta accent) + "Novo" badge */
  .choice--online {
    background: linear-gradient(180deg, rgba(147, 207, 169, 0.08), var(--ctrl-track));
    border-color: rgba(147, 207, 169, 0.3);
  }
  .choice--online:hover { border-color: rgba(147, 207, 169, 0.5); }

  .choice-badge {
    position: absolute;
    top: -8px;
    right: var(--sp-4);
    font-family: 'Space Grotesk', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: #0a1320;
    background: var(--pov-menta);
    padding: 3px 8px;
    border-radius: 20px;
    box-shadow: 0 2px 6px -2px rgba(0, 0, 0, 0.5);
  }

  @media (prefers-reduced-motion: reduce) {
    .choice, .choice-go { transition: none; }
    .choice:hover { transform: none; }
    .choice:hover .choice-go { transform: none; }
  }

  @media (min-width: 900px) {
    .mode-title { font-size: var(--fs-800, 2rem); }
    .choice { padding: var(--sp-4) var(--sp-5); }
  }
</style>
