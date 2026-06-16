<script lang="ts">
  import PlayerToken from '../ui/PlayerToken.svelte'
  import Segmented from '../ui/Segmented.svelte'
  import Console from '../ui/Console.svelte'
  import { game, type Player, type PlayerColor } from '../game/store.svelte'
  import { dock, press } from '../audio/clicks'

  // ── Color order (fixed by index) ──────────────────────────────────────────
  const COLOR_ORDER: PlayerColor[] = [
    'coral', 'piscina', 'lilas', 'menta', 'mostarda', 'rosa', 'laranja', 'petroleo',
  ]

  // ── Draft player state ─────────────────────────────────────────────────────
  // Simple incrementing id counter — no Math.random, no Date
  let idCounter = $state(2)

  type DraftPlayer = { id: string; name: string; color: PlayerColor }

  let players = $state<DraftPlayer[]>([
    { id: 'p0', name: '', color: 'coral' },
    { id: 'p1', name: '', color: 'piscina' },
  ])

  // ── Duration (voltas) ─────────────────────────────────────────────────────
  type VoltasId = 'curta' | 'media' | 'longa'
  let voltasId = $state<VoltasId>('media')

  const voltasOptions = [
    { id: 'curta' as VoltasId, label: 'Curta' },
    { id: 'media' as VoltasId, label: 'Média' },
    { id: 'longa' as VoltasId, label: 'Longa' },
  ]

  const voltasNumber = $derived<1 | 2 | 3>(
    voltasId === 'curta' ? 1 : voltasId === 'longa' ? 3 : 2
  )

  const totalRounds = $derived(voltasNumber * players.length)

  // ── Derived guards ────────────────────────────────────────────────────────
  const canAddMore = $derived(players.length < 8)
  const canStart   = $derived(players.length >= 2)

  // ── Refs array for focusing new inputs ───────────────────────────────────
  let inputRefs = $state<(HTMLInputElement | null)[]>([])

  // ── Actions ───────────────────────────────────────────────────────────────
  function addPlayer() {
    if (!canAddMore) return
    dock()
    const idx = players.length
    const newPlayer: DraftPlayer = {
      id: `p${idCounter}`,
      name: '',
      color: COLOR_ORDER[idx % COLOR_ORDER.length],
    }
    idCounter++
    players = [...players, newPlayer]
    // Focus the new input on the next tick
    const newIdx = players.length - 1
    // $effect will pick this up if we set a pending focus index
    pendingFocusIdx = newIdx
  }

  let pendingFocusIdx = $state<number | null>(null)

  $effect(() => {
    if (pendingFocusIdx !== null) {
      const ref = inputRefs[pendingFocusIdx]
      if (ref) {
        ref.focus()
        pendingFocusIdx = null
      }
    }
  })

  function removePlayer(i: number) {
    if (players.length <= 2) return // clamp at 2
    press()
    players = players.filter((_, idx) => idx !== i)
  }

  function startGame() {
    if (!canStart) return
    press()
    const finalPlayers: Player[] = players.map((p, i) => ({
      id: p.id,
      name: p.name.trim() || `Jogador ${i + 1}`,
      color: p.color,
    }))
    game.setupGame(finalPlayers, voltasNumber)
  }
</script>

<!-- ────────────────────────────────── MOBILE LAYOUT ─────────────────── -->
<div class="setup">

  <!-- ── Screen header (back + badge + title) ── -->
  <div class="setup-header">
    <div class="header-row">
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
      <span class="coop-badge">Cooperativo</span>
    </div>
    <h1 class="setup-title">Quem vai jogar?</h1>
    <p class="setup-sub">Vocês jogam juntos rumo à sintonia do grupo.</p>
  </div>

  <!-- ── Scroll area (players + options) ── -->
  <div class="setup-scroll">

    <!-- Desktop: Console wrapper wraps everything inside -->
    <div class="console-wrap">
      <Console>
        <div class="console-inner">

          <!-- Desktop: title inside console -->
          <div class="console-header">
            <div class="console-title-row">
              <h2 class="console-title">Quem vai jogar?</h2>
              <span class="coop-badge coop-badge--desktop">Cooperativo</span>
            </div>
            <p class="console-sub">Vocês jogam juntos rumo à sintonia do grupo.</p>
          </div>

          <!-- Two-column desktop grid -->
          <div class="desktop-grid">

            <!-- Col A: Players list -->
            <div class="col-players">
              <p class="section-label">Jogadores · {players.length}</p>

              <div class="players-grid" role="list">
                {#each players as p, i (p.id)}
                  <div class="player-row" role="listitem">
                    <PlayerToken color={p.color} name={p.name || `Jogador ${i + 1}`} />

                    <!-- visually-hidden label for the input -->
                    <label class="sr-only" for="player-input-{p.id}">
                      Nome do jogador {i + 1}
                    </label>
                    <input
                      id="player-input-{p.id}"
                      class="player-input"
                      type="text"
                      bind:value={p.name}
                      placeholder="Jogador {i + 1}"
                      maxlength={24}
                      autocomplete="off"
                      bind:this={inputRefs[i]}
                    />

                    {#if i === 0}
                      <span class="owner-badge" aria-label="Primeiro Dono">1º Dono</span>
                    {:else}
                      <button
                        class="remove-btn"
                        aria-label="Remover {p.name || `Jogador ${i + 1}`}"
                        onclick={() => removePlayer(i)}
                        disabled={players.length <= 2}
                      >×</button>
                    {/if}
                  </div>
                {/each}

                <!-- Add player row -->
                {#if canAddMore}
                  <button
                    class="add-row"
                    onclick={addPlayer}
                    aria-label="Adicionar jogador"
                  >
                    <span class="add-circle" aria-hidden="true">+</span>
                    <span>Adicionar jogador</span>
                    <span class="add-hint" aria-hidden="true">(até 8)</span>
                  </button>
                {/if}
              </div>
            </div>

            <!-- Col B: Options + CTA (desktop side panel / mobile inline) -->
            <div class="col-options">

              <!-- Duração -->
              <div class="option-block">
                <p class="section-label">Duração</p>
                <Segmented
                  options={voltasOptions}
                  value={voltasId}
                  onChange={(id) => { voltasId = id }}
                  ariaLabel="Duração da partida"
                />
                <p class="duration-hint">
                  {voltasNumber} volta{voltasNumber > 1 ? 's' : ''} · cada um é Dono {voltasNumber}× · {totalRounds} rodadas
                </p>
              </div>

              <!-- Baralho -->
              <div class="option-block">
                <p class="section-label">Baralho</p>
                <div class="deck-chips">
                  <div class="deck-chip deck-chip--active" aria-current="true">Clássico</div>
                  <div class="deck-chip deck-chip--locked" aria-disabled="true">Picante 🔒</div>
                  <div class="deck-chip deck-chip--locked" aria-disabled="true">Família 🔒</div>
                </div>
              </div>

              <!-- CTA (desktop only — mobile lives in sticky footer) -->
              <button
                class="cta cta--desktop"
                disabled={!canStart}
                onclick={startGame}
              >
                Começar partida · {players.length} jogadores
              </button>

            </div>
          </div>

        </div>
      </Console>
    </div>

  </div>

  <!-- ── Sticky footer CTA (mobile only) ── -->
  <div class="footer" aria-hidden="false">
    <button
      class="cta cta--mobile"
      disabled={!canStart}
      onclick={startGame}
    >
      Começar partida · {players.length} jogadores
    </button>
  </div>

</div>

<style>
  /* ─── Outer shell ───────────────────────────────────────────────────────── */
  .setup {
    flex: 1;
    display: flex;
    flex-direction: column;
    /* account for sticky footer on mobile */
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }

  /* ─── Screen header (mobile) ────────────────────────────────────────────── */
  .setup-header {
    padding: var(--sp-3) var(--sp-5) var(--sp-2);
  }

  .header-row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    margin-bottom: var(--sp-2);
  }

  .back-btn {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: var(--r-2);
    background: var(--icon-bg);
    border: 1px solid var(--icon-border);
    color: var(--text);
    cursor: pointer;
    flex: none;
    transition: background 0.12s ease, transform 0.08s ease;
  }
  .back-btn:hover { filter: brightness(1.1); }
  .back-btn:active { transform: scale(0.93); }
  .back-btn:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
  }
  .back-btn svg { width: 18px; height: 18px; }

  /* ─── Cooperative badge ─────────────────────────────────────────────────── */
  .coop-badge {
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300);
    font-weight: 700;
    letter-spacing: var(--tracking-caps);
    text-transform: uppercase;
    color: var(--pov-menta);
    background: rgba(147, 207, 169, 0.12);
    border: 1px solid rgba(147, 207, 169, 0.35);
    padding: 5px 10px;
    border-radius: 20px;
  }

  .setup-title {
    margin: 0 0 var(--sp-1);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800;
    font-size: var(--fs-700);
    color: var(--text);
    line-height: var(--lh-tight);
  }

  .setup-sub {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: var(--fs-400);
    color: var(--text-soft);
    line-height: var(--lh-body);
    font-optical-sizing: auto;
  }

  /* ─── Scroll area ───────────────────────────────────────────────────────── */
  .setup-scroll {
    flex: 1;
    overflow-y: auto;
    padding: var(--sp-3) var(--sp-5) var(--sp-5);
    /* hide scrollbar on webkit while still scrollable */
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.15) transparent;
  }

  /* ─── Console interior ──────────────────────────────────────────────────── */
  .console-inner {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
  }

  /* Desktop title inside Console — hidden on mobile (we use the screen header) */
  .console-header { display: none; }

  .console-title-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--sp-4);
    margin-bottom: var(--sp-1);
  }

  .console-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800;
    font-size: var(--fs-700);
    color: var(--text);
    line-height: var(--lh-tight);
  }

  .coop-badge--desktop { flex: none; }

  .console-sub {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-size: var(--fs-400);
    color: var(--text-soft);
    line-height: var(--lh-body);
    font-optical-sizing: auto;
  }

  /* ─── Section label ─────────────────────────────────────────────────────── */
  .section-label {
    margin: 0 0 var(--sp-2);
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #8aa0c8;
  }

  /* ─── Players grid ──────────────────────────────────────────────────────── */
  .players-grid {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  /* ─── Player row ────────────────────────────────────────────────────────── */
  .player-row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
    border-radius: var(--r-3);
    padding: var(--sp-2) var(--sp-3);
    /* subtle entry */
    animation: row-in 160ms ease both;
  }

  @keyframes row-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @media (prefers-reduced-motion: reduce) {
    .player-row { animation: none; }
  }

  .player-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-500);
    color: var(--text);
    min-width: 0;
    /* placeholder */
    &::placeholder { color: var(--text-soft); opacity: 0.7; }
  }
  .player-row:focus-within {
    border-color: rgba(255, 255, 255, 0.25);
    box-shadow: 0 0 0 2px rgba(232, 178, 74, 0.3);
  }

  /* ─── Owner badge ───────────────────────────────────────────────────────── */
  .owner-badge {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--pov-mostarda);
    white-space: nowrap;
    flex: none;
  }

  /* ─── Remove button ─────────────────────────────────────────────────────── */
  .remove-btn {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: transparent;
    border: none;
    color: rgba(255, 255, 255, 0.35);
    font-size: 20px;
    line-height: 1;
    cursor: pointer;
    flex: none;
    transition: color 0.1s ease, transform 0.08s ease;
    padding: 0;
  }
  .remove-btn:hover { color: rgba(255, 255, 255, 0.7); }
  .remove-btn:active { transform: scale(0.9); }
  .remove-btn:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
    border-radius: 50%;
  }
  .remove-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  /* ─── Add player row ────────────────────────────────────────────────────── */
  .add-row {
    display: flex;
    align-items: center;
    gap: var(--sp-3);
    border: 1.5px dashed rgba(255, 255, 255, 0.18);
    border-radius: var(--r-3);
    padding: var(--sp-2) var(--sp-3);
    color: var(--text-soft);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-400);
    background: transparent;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: border-color 0.12s ease, color 0.12s ease;
  }
  .add-row:hover {
    border-color: rgba(255, 255, 255, 0.32);
    color: var(--text);
  }
  .add-row:active { transform: scale(0.99); }
  .add-row:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
  }

  .add-circle {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1.5px dashed rgba(255, 255, 255, 0.3);
    font-size: 18px;
    line-height: 1;
    color: var(--text-soft);
    flex: none;
  }

  .add-hint {
    opacity: 0.55;
    font-size: var(--fs-300);
    margin-left: auto;
  }

  /* ─── Options column ────────────────────────────────────────────────────── */
  .col-options {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
  }

  .option-block {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .duration-hint {
    margin: 6px 0 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 11px;
    color: var(--text-soft);
    opacity: 0.75;
  }

  /* ─── Deck chips ─────────────────────────────────────────────────────────── */
  .deck-chips {
    display: flex;
    gap: var(--sp-2);
    margin-top: var(--sp-2);
  }

  .deck-chip {
    flex: 1;
    text-align: center;
    border-radius: var(--r-2);
    padding: var(--sp-2) var(--sp-2);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: var(--fs-300);
    user-select: none;
  }

  .deck-chip--active {
    background: var(--pov-creme);
    color: #11233f;
  }

  .deck-chip--locked {
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
    color: var(--text-soft);
    opacity: 0.7;
    cursor: not-allowed;
  }

  /* ─── Desktop CTA (hidden on mobile) ────────────────────────────────────── */
  .cta--desktop { display: none; }

  /* ─── CTA shared styles ─────────────────────────────────────────────────── */
  .cta {
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
  .cta:hover:not(:disabled) {
    background: color-mix(in srgb, var(--pov-coral-cta) 92%, white 8%);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.22),
      0 6px 18px -4px rgba(200, 65, 47, 0.6);
  }
  .cta:active:not(:disabled) {
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
  .cta:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
  }

  /* ─── Mobile sticky footer ───────────────────────────────────────────────── */
  .footer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 10;
    padding: var(--sp-3) var(--sp-5) max(var(--sp-4), env(safe-area-inset-bottom));
    background: linear-gradient(0deg, var(--footer-grad) 65%, transparent);
  }

  /* ─── Accessibility: visually hidden ────────────────────────────────────── */
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

  /* ─── Desktop layout (≥900px) ───────────────────────────────────────────── */
  @media (min-width: 900px) {
    /* On desktop the whole screen centres and wraps in Console */
    .setup {
      padding-bottom: 0; /* no sticky footer */
      align-items: center;
      padding: var(--sp-5) var(--sp-6) var(--sp-8);
    }

    /* Hide mobile-only elements */
    .setup-header { display: none; }
    .footer { display: none; }

    .setup-scroll {
      width: 100%;
      max-width: 860px;
      overflow-y: visible;
      padding: 0;
    }

    /* Console is visible on desktop */
    .console-header { display: block; }

    /* Desktop grid: players on left (wider), options+CTA on right */
    .desktop-grid {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      gap: var(--sp-6);
      align-items: start;
    }

    /* Players grid → 2-column on desktop */
    .players-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--sp-2);
    }

    /* Add row spans both columns */
    .add-row {
      grid-column: 1 / -1;
    }

    /* Show desktop CTA, hide mobile */
    .cta--desktop {
      display: block;
      min-height: 48px;
      font-size: var(--fs-500);
    }
  }

  /* ─── Mobile default: single-column, no Console visual ─────────────────── */
  @media (max-width: 899px) {
    /* Console on mobile: remove its visual treatment by stripping the tray look */
    /* Console renders as a pass-through on mobile — its children flow normally */
    .console-wrap :global(.console) {
      background: none;
      box-shadow: none;
      border-radius: 0;
      padding: 0;
      width: auto;
    }
    .console-wrap :global(.console-band) {
      display: none;
    }

    .desktop-grid {
      display: flex;
      flex-direction: column;
      gap: var(--sp-5);
    }
  }
</style>
