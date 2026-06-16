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
</script>

<div class="card" role="img" aria-label="{left} a {right}">
  <div class="half" style:background={leftColor} style:color={li.color} style:--ts={li.shadow}>
    <svg class="chev" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M10 3 L5 8 L10 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="label">{left}</span>
  </div>
  <div class="seam" aria-hidden="true"></div>
  <div class="half right" style:background={rightColor} style:color={ri.color} style:--ts={ri.shadow}>
    <svg class="chev" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M6 3 L11 8 L6 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    </svg>
    <span class="label">{right}</span>
  </div>
</div>

<style>
  .card {
    display: flex;
    position: relative;
    width: min(440px, 86vw);
    height: 112px;
    border-radius: var(--r-3);
    overflow: hidden;
    box-shadow:
      var(--elev-2),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
    transition:
      transform 0.16s cubic-bezier(0.18, 0.89, 0.32, 1.05),
      box-shadow 0.16s ease;
    /* a carta "cai" no suporte a cada rodada (remontada via {#key} no Playground) */
    animation: dock-in 0.28s cubic-bezier(0.18, 0.89, 0.32, 1.05);
  }
  /* parece pegável mesmo sem ser arrastável: leve elevação no hover, afunda no toque */
  .card:hover {
    transform: translateY(-2px);
    box-shadow:
      var(--elev-3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }
  .card:active {
    transform: translateY(0);
  }
  @keyframes dock-in {
    from {
      transform: translateY(10px) scale(0.98);
      opacity: 0;
    }
    to {
      transform: translateY(0) scale(1);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .card {
      animation: none;
    }
    .card:hover {
      transform: none;
    }
  }
  .half {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-2);
    padding: var(--sp-3) var(--sp-3);
    background-image: radial-gradient(rgba(0, 0, 0, 0.045) 1px, transparent 1px);
    background-size: 4px 4px;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.35),
      inset 0 -4px 10px rgba(60, 45, 20, 0.16);
  }
  .seam {
    width: 1px;
    background: rgba(17, 35, 63, 0.25);
    box-shadow:
      inset 2px 0 3px rgba(0, 0, 0, 0.18),
      inset -2px 0 3px rgba(0, 0, 0, 0.18);
  }
  .chev {
    width: 17px;
    height: 17px;
    opacity: 0.42;
  }
  .label {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: clamp(13px, 3.8vw, 17px);
    line-height: 1.1;
    text-align: center;
    text-wrap: balance;
    text-transform: uppercase;
    letter-spacing: var(--tracking-caps);
    color: inherit;
    text-shadow: var(--ts, none);
  }
</style>
