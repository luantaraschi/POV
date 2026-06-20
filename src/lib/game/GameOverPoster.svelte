<script lang="ts">
  import type { Snippet } from 'svelte'
  import type { BreakdownRow } from './breakdown'
  import { scoreColors } from '../design/tokens'

  // Mapeia score (0/2/3/4) para cor de acento; 0 = sem ponto (--ink-soft)
  const scoreColorMap: Record<number, string> = scoreColors as Record<number, string>

  let { title, points, total, sintoniaPct, breakdown, cta }:
    { title: string; points: number; total: number; sintoniaPct: number;
      breakdown: BreakdownRow[]; cta: Snippet } = $props()
</script>

<!-- Pôster unificado de fim de jogo (Studio Sinal) -->
<section class="poster">
  <!-- Selo tipográfico POV -->
  <div class="seal" aria-hidden="true"><span>POV</span></div>

  <p class="kicker">Fim de jogo</p>

  <h1 class="title">{title}</h1>

  <!-- Placar compacto: pontos + sintonia -->
  <div class="score" aria-label="Placar">
    <b class="pts-value">{points}</b>
    <span class="pts-denom">/ {total} pontos</span>
    <em class="sintonia-badge">{sintoniaPct}% sintonia</em>
  </div>

  <!-- Breakdown por rodada -->
  <ol class="breakdown" aria-label="Pontos por rodada">
    {#each breakdown as row (row.round)}
      <li>
        <span
          class="n"
          style="color:{scoreColorMap[row.score] ?? 'var(--ink-soft)'}"
          aria-label="{row.score} pontos"
        >{row.score}</span>
        <span class="r" aria-hidden="true">R{row.round}</span>
      </li>
    {/each}
  </ol>

  <!-- CTAs injetados por snippet (local: Jogar de novo / Trocar jogadores) -->
  <div class="cta">
    {@render cta()}
  </div>
</section>

<style>
  .poster {
    background: var(--surface);
    border: 1px solid var(--hair);
    border-radius: 26px;
    box-shadow:
      0 1px 2px rgba(27, 35, 80, .06),
      0 24px 60px -24px rgba(27, 35, 80, .3);
    padding: 28px;
    width: min(440px, 92vw);
    margin-inline: auto;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }

  /* Selo tipográfico */
  .seal {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: 2px solid var(--hair);
    display: grid;
    place-items: center;
  }

  .seal span {
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: .06em;
    color: var(--ink);
  }

  /* Kicker "Fim de jogo" */
  .kicker {
    font-size: 10.5px;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--ink-soft);
    margin: 0;
  }

  /* Título do selo (ex.: "Telepatas") */
  .title {
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: clamp(2rem, 7vw, 2.8rem);
    color: var(--ink);
    line-height: 1;
    margin: 0;
  }

  /* Placar compacto */
  .score {
    display: flex;
    align-items: baseline;
    gap: 8px;
    color: var(--ink-soft);
    flex-wrap: wrap;
    justify-content: center;
  }

  .pts-value {
    font-family: 'Clash Display', sans-serif;
    font-size: 2.2rem;
    color: var(--ink);
    font-weight: 700;
  }

  .pts-denom {
    font-size: 15px;
  }

  .sintonia-badge {
    margin-left: 6px;
    font-style: normal;
    color: var(--teal);
    font-weight: 600;
    font-size: 14px;
  }

  /* Breakdown por rodada */
  .breakdown {
    display: flex;
    gap: 10px;
    list-style: none;
    padding: 8px 0;
    margin: 0;
    flex-wrap: wrap;
    justify-content: center;
  }

  .breakdown li {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    min-width: 28px;
  }

  /* Número de pontos da rodada (cor indica tier) */
  .breakdown .n {
    font-family: 'Space Grotesk', monospace;
    font-weight: 700;
    font-size: 16px;
  }

  /* Rótulo "R1", "R2" … */
  .breakdown .r {
    font-size: 9px;
    color: var(--ink-soft);
    letter-spacing: .04em;
  }

  /* Área de CTAs (injetada por snippet) */
  .cta {
    display: flex;
    gap: 10px;
    margin-top: 8px;
    width: 100%;
  }

  @media (min-width: 900px) {
    .poster {
      padding: 36px;
    }
  }
</style>
