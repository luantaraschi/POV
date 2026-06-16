<script lang="ts">
  import PlayerToken from '../ui/PlayerToken.svelte'
  import Console from '../ui/Console.svelte'
  import { press } from '../audio/clicks'
  import { game } from '../game/store.svelte'
  import { tierCopy, tierVar } from '../game/scoring'
  import { isLastRound } from '../game/rules'
  import { stepIndex } from '../meter/geometry'

  // Last round result — guard for undefined (e.g. render nothing if accessed before results exist)
  const last = $derived(game.results[game.results.length - 1])

  // Gap in meter steps between the guess and target
  const gap = $derived(
    last ? Math.abs(stepIndex(last.value) - stepIndex(last.target)) : 0
  )

  // Human-readable gap string
  const gapLabel = $derived(
    gap === 0
      ? 'no alvo'
      : gap === 1
        ? 'a 1 casa do alvo'
        : `a ${gap} casas do alvo`
  )

  // Tier phrase — deterministic per round
  const phrase = $derived(
    last
      ? tierCopy[last.score][game.roundIndex % tierCopy[last.score].length]
      : ''
  )

  // Group score percentage
  const pct = $derived(
    game.maxSoFar > 0 ? Math.round((game.groupScore / game.maxSoFar) * 100) : 0
  )

  // Next dono (only meaningful when not last round)
  const nextDono = $derived(
    game.config.players[(game.donoIndex + 1) % game.config.players.length]
  )

  const isLast = $derived(isLastRound(game.roundIndex, game.totalRounds))

  // Tier colour for the round chip
  const chipColor = $derived(last ? tierVar(last.score) : 'var(--pov-menta)')

  // Ink colour inside history tiles (same logic as mockup: dark ink on bright colours)
  function tileInk(score: 0 | 2 | 3 | 4): string {
    // bullseye (4) is a dark teal → light ink; others are bright → dark ink
    return score === 4 ? '#eaf6fa' : '#0a1320'
  }

  function handleAdvance() {
    press()
    game.advance()
  }
</script>

{#if last}
  <!-- Live region: single consolidated a11y announcement -->
  <div
    class="sr-only"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    Rodada {game.roundIndex + 1} concluída. +{last.score} pontos, {gapLabel}. Sintonia do grupo {game.groupScore} de {game.maxSoFar} possíveis, {pct}%.
  </div>

  <!-- ═══ MOBILE layout ═══ -->
  <div class="mobile-wrap">
    <!-- Round label -->
    <div class="round-label">Rodada {game.roundIndex + 1} concluída</div>

    <!-- Score callout -->
    <div class="callout">
      <div class="chip" style:--tier={chipColor}>
        <span class="chip-score">+{last.score}</span>
      </div>
      <div class="callout-text">
        <div class="callout-phrase">{phrase}</div>
        <div class="callout-detail">{gapLabel}</div>
      </div>
    </div>

    <!-- Sintonia do grupo -->
    <div class="sintonia-panel">
      <div class="sintonia-header">
        <span class="label">Sintonia do grupo</span>
        <span class="sintonia-possible">de {game.maxSoFar} possíveis</span>
      </div>
      <div class="sintonia-score">
        {game.groupScore}<span class="pts-unit"> pts</span>
      </div>
      <div class="progress-track" aria-hidden="true">
        <div class="progress-fill" style:width="{pct}%"></div>
      </div>
    </div>

    <!-- History tiles -->
    <div class="history" aria-hidden="true">
      <div class="label history-label">Rodadas</div>
      <div class="tiles">
        {#each Array(game.totalRounds) as _, i}
          {@const played = i < game.results.length}
          {@const isCurrent = i === game.results.length - 1}
          {#if played}
            <div
              class="tile tile--played"
              class:tile--current={isCurrent}
              style:background={tierVar(game.results[i].score)}
              style:color={tileInk(game.results[i].score)}
              style:--ring-color={tierVar(game.results[i].score)}
            >
              {game.results[i].score}
            </div>
          {:else}
            <div class="tile tile--empty"></div>
          {/if}
        {/each}
      </div>
    </div>

    <!-- Next Dono (only when not last round) -->
    {#if !isLast}
      <div class="next-dono">
        <PlayerToken color={nextDono.color} name={nextDono.name} size={30} />
        <div class="next-dono-text">
          <span class="next-dono-prefix">Próximo Dono:</span>
          <strong class="next-dono-name">{nextDono.name}</strong>
        </div>
      </div>
    {/if}

    <!-- CTA -->
    <button class="btn-cta" onclick={handleAdvance}>
      {isLast ? 'Ver resultado' : 'Próxima rodada'}
    </button>
  </div>

  <!-- ═══ DESKTOP layout (≥900px) ═══ -->
  <div class="desktop-wrap">
    <Console>
      <!-- Round label -->
      <div class="round-label round-label--desk">Rodada {game.roundIndex + 1} concluída</div>

      <div class="grid-2col">
        <!-- Left column: callout + sintonia -->
        <div class="col-left">
          <!-- Score callout -->
          <div class="callout">
            <div class="chip chip--desk" style:--tier={chipColor}>
              <span class="chip-score chip-score--desk">+{last.score}</span>
            </div>
            <div class="callout-text">
              <div class="callout-phrase callout-phrase--desk">{phrase}</div>
              <div class="callout-detail">{gapLabel}</div>
            </div>
          </div>

          <!-- Sintonia do grupo -->
          <div class="sintonia-panel sintonia-panel--desk">
            <div class="sintonia-header">
              <span class="label">Sintonia do grupo</span>
              <span class="sintonia-possible">de {game.maxSoFar} possíveis</span>
            </div>
            <div class="sintonia-score sintonia-score--desk">
              {game.groupScore}<span class="pts-unit pts-unit--desk"> pts</span>
            </div>
            <div class="progress-track" aria-hidden="true">
              <div class="progress-fill" style:width="{pct}%"></div>
            </div>
          </div>
        </div>

        <!-- Right column: history + next dono + cta -->
        <div class="col-right">
          <!-- History tiles -->
          <div class="history" aria-hidden="true">
            <div class="label history-label">Rodadas</div>
            <div class="tiles">
              {#each Array(game.totalRounds) as _, i}
                {@const played = i < game.results.length}
                {@const isCurrent = i === game.results.length - 1}
                {#if played}
                  <div
                    class="tile tile--played"
                    class:tile--current={isCurrent}
                    style:background={tierVar(game.results[i].score)}
                    style:color={tileInk(game.results[i].score)}
                    style:--ring-color={tierVar(game.results[i].score)}
                  >
                    {game.results[i].score}
                  </div>
                {:else}
                  <div class="tile tile--empty"></div>
                {/if}
              {/each}
            </div>
          </div>

          <!-- Next Dono (only when not last round) -->
          {#if !isLast}
            <div class="next-dono next-dono--desk">
              <PlayerToken color={nextDono.color} name={nextDono.name} size={32} />
              <div class="next-dono-text">
                <span class="next-dono-prefix">Próximo Dono:</span>
                <strong class="next-dono-name">{nextDono.name}</strong>
              </div>
            </div>
          {/if}

          <!-- CTA -->
          <button class="btn-cta btn-cta--desk" onclick={handleAdvance}>
            {isLast ? 'Ver resultado' : 'Próxima rodada'}
          </button>
        </div>
      </div>
    </Console>
  </div>
{/if}

<style>
  /* ── Screen-reader only ── */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ── Layout visibility ── */
  .mobile-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-4);
    padding: var(--sp-5) var(--sp-4) var(--sp-6);
    width: 100%;
  }
  .desktop-wrap {
    display: none;
  }
  @media (min-width: 900px) {
    .mobile-wrap { display: none; }
    .desktop-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: var(--sp-6) var(--sp-4);
      width: 100%;
    }
  }

  /* ── Round label ── */
  .round-label {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-soft);
    text-align: center;
  }
  .round-label--desk {
    margin-bottom: var(--sp-3);
    text-align: left;
  }

  /* ── Score callout ── */
  .callout {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    width: 100%;
  }

  /* Round chip: circle coloured by tier */
  .chip {
    flex: none;
    width: 66px;
    height: 66px;
    border-radius: 50%;
    background: var(--pov-creme);
    border: 3px solid var(--tier);
    display: grid;
    place-items: center;
  }
  .chip--desk {
    width: 72px;
    height: 72px;
  }
  .chip-score {
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800;
    font-size: 28px;
    color: var(--tier);
    line-height: 1;
  }
  .chip-score--desk {
    font-size: 30px;
  }

  .callout-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .callout-phrase {
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 600;
    font-size: 19px;
    color: var(--pov-offwhite);
    line-height: 1.1;
  }
  .callout-phrase--desk {
    font-size: 22px;
  }
  .callout-detail {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 11px;
    color: rgba(241, 230, 203, 0.6);
  }

  /* ── Sintonia panel ── */
  .sintonia-panel {
    width: 100%;
    background: rgba(7, 16, 33, 0.34);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: var(--r-4);
    padding: 15px 16px;
    box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.25);
  }
  .sintonia-panel--desk {
    padding: 15px 17px;
    margin-top: 0;
  }

  .sintonia-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 3px;
  }
  .sintonia-possible {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 11px;
    color: rgba(241, 230, 203, 0.5);
  }

  .sintonia-score {
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800;
    font-size: 38px;
    color: var(--pov-offwhite);
    line-height: 1.1;
    margin: 3px 0 9px;
  }
  .sintonia-score--desk {
    font-size: 40px;
  }
  .pts-unit {
    font-size: 15px;
    color: var(--pov-menta);
    font-weight: 700;
  }
  .pts-unit--desk {
    font-size: 15px;
  }

  /* Progress bar */
  .progress-track {
    height: 12px;
    border-radius: 7px;
    background: rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--pov-menta), var(--pov-mostarda));
    border-radius: 7px;
    transition: width 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  }
  @media (prefers-reduced-motion: reduce) {
    .progress-fill { transition: none; }
  }

  /* ── History tiles ── */
  .history {
    width: 100%;
  }
  .history-label {
    margin-bottom: 8px;
  }
  .tiles {
    display: flex;
    gap: 6px;
  }
  .tile {
    flex: 1;
    aspect-ratio: 1;
    border-radius: 8px;
    display: grid;
    place-items: center;
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800;
    font-size: 13px;
  }
  .tile--current {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--ring-color) 30%, transparent);
  }
  .tile--empty {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: rgba(255, 255, 255, 0.25);
    font-weight: 600;
  }

  /* ── Shared label style ── */
  .label {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--text-soft);
  }

  /* ── Next Dono pill ── */
  .next-dono {
    display: flex;
    align-items: center;
    gap: 11px;
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.07);
    border-radius: 13px;
    padding: 9px 12px;
  }
  .next-dono--desk {
    margin-bottom: var(--sp-4);
    padding: 10px 13px;
  }
  .next-dono-text {
    flex: 1;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 13px;
    color: rgba(241, 230, 203, 0.85);
  }
  .next-dono--desk .next-dono-text {
    font-size: 14px;
  }
  .next-dono-prefix {
    color: rgba(241, 230, 203, 0.55);
  }
  .next-dono-name {
    color: var(--pov-offwhite);
    font-weight: 700;
  }

  /* ── CTA button ── */
  .btn-cta {
    border: 0;
    cursor: pointer;
    border-radius: var(--r-4);
    padding: var(--sp-3) var(--sp-5);
    min-height: 44px;
    width: min(440px, 100%);
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
    text-align: center;
  }
  .btn-cta--desk {
    width: 100%;
  }
  .btn-cta:hover {
    filter: brightness(1.05);
  }
  .btn-cta:active {
    transform: translateY(2px);
    border-bottom-width: 2px;
  }
  .btn-cta:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 3px;
  }

  /* ── Desktop Console grid ── */
  .grid-2col {
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 30px;
    align-items: start;
    padding: 0 var(--sp-2) var(--sp-4);
  }
  .col-left {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
  }
  .col-right {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
  }
</style>
