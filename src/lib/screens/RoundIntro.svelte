<script lang="ts">
  import PlayerToken from '../ui/PlayerToken.svelte'
  import Card from '../cards/Card.svelte'
  import Console from '../ui/Console.svelte'
  import PrivacyHandoff from '../ui/PrivacyHandoff.svelte'
  import { palette } from '../design/tokens'
  import { press } from '../audio/clicks'
  import { game } from '../game/store.svelte'

  let showPrivacy = $state(false)

  // Card colour lookup mirrors InRound (acceptable local duplication — same CARDS order).
  const cardColors = [
    { lc: palette.piscina, rc: palette.coral },
    { lc: palette.creme,   rc: palette.lilas },
    { lc: palette.menta,   rc: palette.mostarda },
    { lc: palette.creme,   rc: palette.laranja },
  ]
  const cardColor = $derived(cardColors[game.cardIndex % cardColors.length])

  function openPrivacy() {
    press()
    showPrivacy = true
  }
</script>

<!-- Mobile: stacked column. Desktop (≥900px): Console with 2-column grid. -->

<!-- MOBILE layout -->
<div class="mobile-wrap" aria-hidden="false">
  <div class="top-block">
    <!-- round label -->
    <div class="round-label" aria-label="Rodada {game.roundIndex + 1} de {game.totalRounds}">
      Rodada {game.roundIndex + 1}
      <span class="muted">de {game.totalRounds}</span>
    </div>

    <!-- rotation dots -->
    <div class="dots" role="group" aria-label="Ordem de Donos nesta volta">
      {#each game.config.players as _p, i}
        {@const past    = i < game.donoIndex}
        {@const current = i === game.donoIndex}
        {@const dotColor = current
          ? game.config.players[i].color
          : past
            ? game.config.players[i].color
            : 'faint'}
        <span
          class="dot"
          class:dot--past={past}
          class:dot--current={current}
          class:dot--future={!past && !current}
          style:--dot-color={current || past ? palette[game.config.players[i].color] : 'rgba(255,255,255,0.13)'}
          aria-label="{game.config.players[i].name} — {past ? 'já foi Dono' : current ? 'Dono atual' : 'ainda não'}"
          role="img"
        ></span>
      {/each}
    </div>
  </div>

  <!-- dono hero -->
  <div class="dono-hero">
    <PlayerToken color={game.dono.color} name={game.dono.name} size={84} ring />
    <div class="dono-name">{game.dono.name}</div>
    <div class="dono-role">é o Dono do POV</div>
  </div>

  <!-- card + microcopy + CTA -->
  <div class="bottom-block">
    <div class="card-label">Carta desta rodada</div>
    <Card
      left={game.card.left}
      right={game.card.right}
      leftColor={cardColor.lc}
      rightColor={cardColor.rc}
    />
    <p class="microcopy">
      Só {game.dono.name} vê o alvo secreto. O resto tenta ler o ponto de vista dela.
    </p>
    <button class="btn-primary" onclick={openPrivacy}>
      Passar o POV pra {game.dono.name}
    </button>
  </div>
</div>

<!-- DESKTOP layout (≥900px) — Console shell with 2-column grid -->
<div class="desktop-wrap" aria-hidden="false">
  <Console>
    <div class="grid-2col">
      <!-- left: round label + dono hero + dots -->
      <div class="col-left">
        <div class="round-label" aria-label="Rodada {game.roundIndex + 1} de {game.totalRounds}">
          Rodada {game.roundIndex + 1}
          <span class="muted">de {game.totalRounds}</span>
        </div>
        <div class="dono-hero dono-hero--desk">
          <PlayerToken color={game.dono.color} name={game.dono.name} size={96} ring />
          <div class="dono-name dono-name--desk">{game.dono.name}</div>
          <div class="dono-role dono-role--desk">é o Dono do POV</div>
        </div>
        <!-- rotation dots -->
        <div class="dots" role="group" aria-label="Ordem de Donos nesta volta">
          {#each game.config.players as _p, i}
            <span
              class="dot"
              class:dot--past={i < game.donoIndex}
              class:dot--current={i === game.donoIndex}
              class:dot--future={i > game.donoIndex}
              style:--dot-color={i <= game.donoIndex ? palette[game.config.players[i].color] : 'rgba(255,255,255,0.13)'}
              aria-label="{game.config.players[i].name} — {i < game.donoIndex ? 'já foi Dono' : i === game.donoIndex ? 'Dono atual' : 'ainda não'}"
              role="img"
            ></span>
          {/each}
        </div>
      </div>

      <!-- right: card + microcopy + CTA -->
      <div class="col-right">
        <div class="card-label">Carta desta rodada</div>
        <Card
          left={game.card.left}
          right={game.card.right}
          leftColor={cardColor.lc}
          rightColor={cardColor.rc}
        />
        <p class="microcopy microcopy--desk">
          Só {game.dono.name} vê o alvo secreto. O resto tenta ler o ponto de vista dela.
        </p>
        <button class="btn-primary btn-primary--desk" onclick={openPrivacy}>
          Passar o POV pra {game.dono.name}
        </button>
      </div>
    </div>
  </Console>
</div>

<PrivacyHandoff
  open={showPrivacy}
  donoName={game.dono.name}
  onConfirm={() => game.beginPeek()}
  onCancel={() => (showPrivacy = false)}
/>

<style>
  /* ─── Visibility: one layout visible per breakpoint ─── */
  .mobile-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-5);
    padding: var(--sp-5) var(--sp-4) var(--sp-6);
    width: 100%;
  }
  .desktop-wrap {
    display: none;
  }
  @media (min-width: 900px) {
    .mobile-wrap  { display: none; }
    .desktop-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100%;
      padding: var(--sp-6) var(--sp-4);
      width: 100%;
    }
  }

  /* ─── Round label ─── */
  .round-label {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-soft);
  }
  .muted {
    color: rgba(138, 160, 200, 0.5);
  }

  /* ─── Rotation dots ─── */
  .dots {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
  }
  .dot {
    display: inline-block;
    border-radius: 50%;
    background: var(--dot-color);
    /* size set by modifier classes below */
  }
  .dot--past {
    width: 9px;
    height: 9px;
    opacity: 0.75;
  }
  .dot--current {
    width: 11px;
    height: 11px;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--dot-color) 28%, transparent);
  }
  /* Pulse animation on current dot — guarded for reduced-motion */
  @media (prefers-reduced-motion: no-preference) {
    .dot--current {
      animation: dot-pulse 2s ease-in-out infinite;
    }
  }
  @keyframes dot-pulse {
    0%, 100% { box-shadow: 0 0 0 3px color-mix(in srgb, var(--dot-color) 28%, transparent); }
    50%       { box-shadow: 0 0 0 5px color-mix(in srgb, var(--dot-color) 14%, transparent); }
  }
  .dot--future {
    width: 9px;
    height: 9px;
    opacity: 0.5;
  }

  /* ─── Top block (mobile) ─── */
  .top-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 9px;
  }

  /* ─── Dono hero ─── */
  .dono-hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
  }
  .dono-hero--desk {
    flex: none;
    margin: var(--sp-4) 0 var(--sp-3);
  }
  .dono-name {
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800;
    font-size: 30px;
    color: var(--text);
    margin-top: 6px;
    line-height: 1.1;
  }
  .dono-name--desk {
    font-size: 34px;
    margin-top: 14px;
  }
  .dono-role {
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-size: 16px;
    color: rgba(241, 230, 203, 0.82);
    line-height: 1.3;
  }
  .dono-role--desk {
    font-size: 17px;
  }

  /* ─── Card section ─── */
  .card-label {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-soft);
    margin-bottom: var(--sp-2);
  }

  /* ─── Bottom block (mobile) ─── */
  .bottom-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    width: 100%;
  }

  /* ─── Microcopy ─── */
  .microcopy {
    margin: 0;
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 11.5px;
    font-weight: 500;
    line-height: 1.4;
    color: var(--text-soft);
    text-align: center;
    max-width: 240px;
  }
  .microcopy--desk {
    font-size: 12.5px;
    max-width: 100%;
    text-align: left;
    margin: var(--sp-3) 0 var(--sp-4);
  }

  /* ─── Primary CTA button ─── */
  .btn-primary {
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
  .btn-primary--desk {
    width: 100%;
  }

  /* ─── Desktop 2-column grid inside Console ─── */
  .grid-2col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 34px;
    align-items: center;
    padding: var(--sp-4) var(--sp-3) var(--sp-5);
  }
  .col-left {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }
  .col-right {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
</style>
