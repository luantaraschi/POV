<script lang="ts">
  type Props = {
    left: string
    right: string
    leftColor?: string
    rightColor?: string
  }
  let {
    left,
    right,
    leftColor = '#9ad9b0',
    rightColor = '#e25744',
  }: Props = $props()

  // cor de texto legível conforme a luminância da metade (WCAG relative luminance)
  function ink(hex: string): { color: string; shadow: string } {
    const c = hex.replace('#', '')
    if (c.length < 6) return { color: '#11233f', shadow: 'none' }
    const ch = (i: number) => parseInt(c.slice(i, i + 2), 16) / 255
    const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
    const L = 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(2)) + 0.0722 * lin(ch(4))
    return L < 0.46
      ? { color: '#f7f1e3', shadow: '0 1px 1px rgba(0,0,0,0.28)' }
      : { color: '#11233f', shadow: 'none' }
  }
  const li = $derived(ink(leftColor))
  const ri = $derived(ink(rightColor))

  // Sizing por comprimento: a fonte encolhe um degrau conforme o polo MAIS longo cresce,
  // para que rótulos como "Tranquilo no date" / "Casa com a pessoa" caibam sem cortar.
  // (clamp() ainda escala com a viewport; a classe só escolhe a faixa de tamanho.)
  const longest = $derived(Math.max(left.length, right.length))
  const sizeClass = $derived(
    longest <= 9 ? 'sz-l' // "Quente", "Difícil" — uma palavra curta
    : longest <= 16 ? 'sz-m' // "Inaceitável", "Casa com a" — média
    : 'sz-s', // "Tranquilo no date", "Negócio do ano" — longa, multi-palavra
  )
</script>

<div class="card {sizeClass}" role="img" aria-label="{left} a {right}">
  <div class="half" style:background={leftColor} style:color={li.color} style:--ts={li.shadow}>
    <svg class="chev" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M10.5 3 L5.5 8 L10.5 13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="label">{left}</span>
  </div>
  <div class="seam" aria-hidden="true"></div>
  <div class="half right" style:background={rightColor} style:color={ri.color} style:--ts={ri.shadow}>
    <svg class="chev" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M5.5 3 L10.5 8 L5.5 13" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="label">{right}</span>
  </div>
</div>

<style>
  .card {
    display: flex;
    position: relative;
    width: min(440px, 86vw);
    /* min-height (não height fixa) — rótulos longos crescem a carta em vez de cortar */
    min-height: 116px;
    border-radius: var(--r-3);
    overflow: hidden;
    /* moldura impressa: aro escuro + verniz de topo, sobre a elevação em camadas */
    box-shadow:
      var(--elev-2),
      0 0 0 1px rgba(17, 35, 63, 0.14),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.16);
    transition:
      transform 0.18s cubic-bezier(0.18, 0.89, 0.32, 1.05),
      box-shadow 0.18s ease;
    /* a carta "cai" no suporte a cada rodada (remontada via {#key} no InRound) */
    animation: dock-in 0.34s cubic-bezier(0.2, 0.9, 0.28, 1.08) both;
    will-change: transform;
  }
  /* verniz de topo: faixa de brilho diagonal sutil, como laca de carta de jogo */
  .card::after {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    border-radius: inherit;
    background: linear-gradient(
      125deg,
      rgba(255, 255, 255, 0.16) 0%,
      rgba(255, 255, 255, 0.04) 22%,
      transparent 42%
    );
    mix-blend-mode: soft-light;
  }
  /* parece pegável mesmo sem ser arrastável: leve elevação no hover, afunda no toque */
  .card:hover {
    transform: translateY(-3px) scale(1.012);
    box-shadow:
      var(--elev-3),
      0 0 0 1px rgba(17, 35, 63, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.5),
      inset 0 0 0 1px rgba(255, 255, 255, 0.16);
  }
  .card:active {
    transform: translateY(-1px) scale(0.992);
    box-shadow:
      var(--elev-1),
      0 0 0 1px rgba(17, 35, 63, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.45),
      inset 0 2px 6px rgba(60, 45, 20, 0.18);
    transition:
      transform 0.08s ease,
      box-shadow 0.08s ease;
  }
  @keyframes dock-in {
    0% {
      transform: translateY(12px) scale(0.965) rotate(-0.4deg);
      opacity: 0;
    }
    60% {
      opacity: 1;
    }
    100% {
      transform: translateY(0) scale(1) rotate(0deg);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .card {
      animation: none;
    }
    .card:hover,
    .card:active {
      transform: none;
    }
  }
  .half {
    position: relative;
    flex: 1;
    /* permite a coluna encolher abaixo do conteúdo p/ que balance/wrap funcionem */
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    padding: var(--sp-3) clamp(var(--sp-2), 3.2vw, var(--sp-4));
    /* grão de impressão em 2 camadas: pontos finos + fibra de papel diagonal */
    background-image:
      radial-gradient(rgba(0, 0, 0, 0.05) 0.5px, transparent 0.6px),
      repeating-linear-gradient(
        58deg,
        rgba(255, 255, 255, 0.035) 0 1px,
        transparent 1px 3px
      );
    background-size:
      4px 4px,
      6px 6px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -5px 12px rgba(60, 45, 20, 0.18);
  }
  /* vinheta suave nas bordas internas dá profundidade de carta impressa */
  .half::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      120% 90% at 50% 38%,
      transparent 58%,
      rgba(40, 28, 12, 0.14) 100%
    );
  }
  /* costura central debossada — sulco escuro entre duas quinas de luz */
  .seam {
    width: 2px;
    flex: none;
    background: linear-gradient(
      90deg,
      rgba(0, 0, 0, 0.16),
      rgba(17, 35, 63, 0.4) 50%,
      rgba(0, 0, 0, 0.16)
    );
    box-shadow:
      -1px 0 0 rgba(255, 255, 255, 0.28),
      1px 0 0 rgba(255, 255, 255, 0.28),
      inset 0 0 4px rgba(0, 0, 0, 0.3);
  }
  .chev {
    width: 16px;
    height: 16px;
    opacity: 0.34;
    flex: none;
    filter: drop-shadow(0 1px 0 rgba(255, 255, 255, 0.18));
  }
  .label {
    position: relative;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    line-height: 1.08;
    text-align: center;
    text-wrap: balance;
    text-transform: uppercase;
    letter-spacing: var(--tracking-caps);
    /* segurança extra: quebra palavras enormes em vez de estourar a coluna */
    overflow-wrap: anywhere;
    hyphens: auto;
    color: inherit;
    text-shadow: var(--ts, none);
  }
  /* faixas de tamanho por comprimento do rótulo mais longo (definidas no script) */
  .sz-l .label {
    font-size: clamp(14px, 4.4vw, 18px);
    letter-spacing: 0.06em;
  }
  .sz-m .label {
    font-size: clamp(12.5px, 3.7vw, 16px);
    letter-spacing: 0.03em;
  }
  .sz-s .label {
    font-size: clamp(11px, 3vw, 13.5px);
    letter-spacing: 0.015em;
    line-height: 1.12;
  }
  /* cartas com rótulo longo ganham um respiro vertical extra */
  .sz-s,
  .sz-m {
    min-height: 124px;
  }
</style>
