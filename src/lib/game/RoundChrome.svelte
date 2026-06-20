<script lang="ts">
  import { game } from './store.svelte'
  import { playerColors } from '../design/tokens'

  let { onPause }: { onPause: () => void } = $props()

  const dono = $derived(game.dono)
  // Cor hex do avatar — fonte canônica é tokens.playerColors
  const donoColor = $derived(playerColors[dono.color as keyof typeof playerColors] ?? playerColors.coral)
  const donoInitial = $derived(dono.name.slice(0, 1).toUpperCase())
</script>

<!-- Chrome de topo da rodada: rodada X/Y · sintonia% · vez de [dono] · pausa -->
<header class="chrome" aria-label="Status da rodada">
  <div class="left">
    <!-- POV-mark: LED + marca -->
    <span class="mark" aria-hidden="true">
      <span class="led"></span>
      POV
    </span>
    <span class="round" aria-label="Rodada {game.roundIndex + 1} de {game.totalRounds}">
      Rodada <b>{game.roundIndex + 1}</b><span class="of"> / {game.totalRounds}</span>
    </span>
  </div>

  <div class="right">
    <!-- Sintonia acumulada do grupo -->
    <span class="sintonia" aria-label="Sintonia {game.sintoniaPct} por cento">
      <b>{game.sintoniaPct}%</b> sintonia
    </span>

    <!-- Chip "Vez de [Dono]" com avatar -->
    <span class="turn" aria-label="Vez de {dono.name}">
      <span
        class="av"
        style="background:{donoColor}"
        aria-hidden="true"
      >{donoInitial}</span>
      Vez de {dono.name}
    </span>

    <!-- Botão de pausa: ícone SVG inline, estilo TopBar -->
    <button
      type="button"
      class="pause"
      onclick={onPause}
      aria-label="Pausar partida"
    >
      <!-- Ícone pausa (duas barras verticais), mesmo traço dos ícones do TopBar -->
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.75"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
        <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none" />
      </svg>
    </button>
  </div>
</header>

<style>
  .chrome {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    color: var(--ink-soft);
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
    /* sem background próprio — usa o do estágio */
  }

  /* ── Lado esquerdo: POV-mark + Rodada X/Y ── */
  .left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .mark {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: 0.9375rem; /* 15px, igual ao TopBar */
    letter-spacing: 0.04em;
    color: var(--ink);
    user-select: none;
  }

  /* LED pulsante — mesmo estilo do TopBar */
  .led {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--red);
    flex-shrink: 0;
    animation: led-pulse 3s ease-in-out infinite;
  }

  @keyframes led-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  .round {
    font-family: 'Space Grotesk', monospace, system-ui;
    font-size: 13px;
    font-weight: 600;
    font-variant-numeric: tabular-nums lining-nums;
    color: var(--ink-soft);
    letter-spacing: 0.01em;
  }

  .round b {
    font-weight: 700;
    color: var(--ink);
  }

  .of {
    opacity: 0.6;
  }

  /* ── Lado direito: sintonia · chip de vez · pausa ── */
  .right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .sintonia {
    font-family: 'Space Grotesk', monospace, system-ui;
    font-size: 13px;
    font-weight: 500;
    font-variant-numeric: tabular-nums;
    color: var(--ink-soft);
    /* ocultar em telas muito estreitas (< 380px) */
    display: none;
  }

  .sintonia b {
    font-weight: 700;
    color: var(--ink);
  }

  @media (min-width: 380px) {
    .sintonia {
      display: inline;
    }
  }

  /* Chip "Vez de [Dono]": pílula com avatar */
  .turn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    background: var(--surface);
    color: var(--ink);
    border: 1px solid var(--hair);
    border-radius: 999px;
    padding: 4px 12px 4px 4px;
    font-weight: 600;
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
    white-space: nowrap;
    /* sombra de produto sutil */
    box-shadow: 0 1px 2px rgba(27, 35, 80, 0.08);
  }

  /* Avatar com inicial do Dono */
  .av {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    color: #fff;
    font-weight: 700;
    font-size: 11px;
    font-family: 'Inter', system-ui, sans-serif;
    flex-shrink: 0;
  }

  /* Botão de pausa: ícone quadrado, mesmo estilo .iconbtn do TopBar */
  .pause {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    min-height: 36px; /* alvo de toque complementado pelo padding do chrome */
    border: 1px solid var(--hair);
    border-radius: 11px;
    background: var(--surface);
    color: var(--ink-soft);
    cursor: pointer;
    box-shadow: 0 1px 2px rgba(27, 35, 80, 0.08);
    transition:
      background 160ms ease,
      box-shadow 160ms ease,
      transform 120ms ease;
    flex-shrink: 0;
  }

  .pause svg {
    width: 16px;
    height: 16px;
  }

  .pause:hover {
    filter: brightness(1.08);
  }

  .pause:active {
    transform: scale(0.92);
  }

  .pause:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 2px;
  }

  /* Sem animação para prefers-reduced-motion */
  @media (prefers-reduced-motion: reduce) {
    .led {
      animation: none;
    }
    .pause {
      transition: none;
    }
  }
</style>
