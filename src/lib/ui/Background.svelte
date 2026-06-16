<script lang="ts">
  import { palette } from '../design/tokens'

  type Props = { theme: 'dark' | 'light'; dim?: boolean }
  let { theme, dim = false }: Props = $props()

  // ---- fundo de IDENTIDADE: sunburst arco-íris (coroa acima do console) + duas cabeças (a arte da
  // caixa: dois pontos de vista, o espectro entre eles). Atmosférico, sob o grão, atrás do console. ----
  const SUN_CX = 500
  const SUN_CY = 760 // base do leque bem embaixo -> os raios sobem e a "coroa" aparece acima do console
  const SUN_R = 1250
  const sunColors = [palette.coral, palette.laranja, palette.mostarda, palette.menta, palette.piscina, palette.lilas, palette.rosa]
  const sunburst = (() => {
    const out: { d: string; color: string }[] = []
    const a0 = 184, a1 = 356, n = 22 // leque do lado esquerdo (184°) ao direito (356°), passando pelo topo
    for (let i = 0; i < n; i++) {
      const aa = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180
      const ab = ((a0 + ((a1 - a0) * (i + 1)) / n) * Math.PI) / 180
      const x1 = (SUN_CX + SUN_R * Math.cos(aa)).toFixed(1)
      const y1 = (SUN_CY + SUN_R * Math.sin(aa)).toFixed(1)
      const x2 = (SUN_CX + SUN_R * Math.cos(ab)).toFixed(1)
      const y2 = (SUN_CY + SUN_R * Math.sin(ab)).toFixed(1)
      out.push({ d: `M ${SUN_CX} ${SUN_CY} L ${x1} ${y1} L ${x2} ${y2} Z`, color: sunColors[i % sunColors.length] })
    }
    return out
  })()

  // Ondas concêntricas discretas (tons próximos do fundo -> textura sutil, não faixas berrantes).
  const ripples: Record<'dark' | 'light', string[]> = {
    dark: ['#122a4c', '#0f2748', '#16334f', '#1a2c4e', '#0e2444', '#143049'],
    light: ['#ecdcc4', '#e4e6d9', '#f0e3c7', '#ecdade', '#dee6e2', '#e9e0d3'],
  }
  const ripplePalette = $derived(ripples[theme])
  const rings = $derived.by(() => {
    const out: { r: number; color: string }[] = []
    for (let i = 0, r = 1360; r > 64; i++, r -= 66) out.push({ r, color: ripplePalette[i % ripplePalette.length] })
    return out
  })
</script>

<svg class="sunburst" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <radialGradient id="sunFade" cx="50%" cy="76%" r="62%">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.9" />
      <stop offset="50%" stop-color="#fff" stop-opacity="0.42" />
      <stop offset="100%" stop-color="#fff" stop-opacity="0" />
    </radialGradient>
    <mask id="sunMask"><rect width="1000" height="1000" fill="url(#sunFade)" /></mask>
  </defs>
  <g mask="url(#sunMask)">
    {#each sunburst as w}
      <path d={w.d} fill={w.color} />
    {/each}
  </g>
</svg>

<svg class="ripples" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  {#each rings as ring}
    <circle cx="500" cy="345" r={ring.r} fill={ring.color} />
  {/each}
</svg>

<svg class="grain" aria-hidden="true">
  <filter id="paperGrain">
    <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
    <feColorMatrix type="saturate" values="0" />
    <feComponentTransfer><feFuncA type="linear" slope="0.5" /></feComponentTransfer>
  </filter>
  <rect width="100%" height="100%" filter="url(#paperGrain)" />
</svg>

<div class="dim-veil" class:on={dim} aria-hidden="true"></div>

<style>
  .sunburst,
  .ripples,
  .grain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  .sunburst {
    z-index: 0;
    opacity: var(--sun-op);
  }
  .ripples {
    z-index: 1;
    opacity: var(--ripple-op);
    filter: blur(2.5px);
    mix-blend-mode: soft-light;
  }
  .grain {
    z-index: 9;
    mix-blend-mode: soft-light;
    opacity: 0.32;
  }
  /* suspense da revelação: vinheta que escurece a periferia e foca no medidor */
  .dim-veil {
    position: fixed;
    inset: 0;
    z-index: 7;
    pointer-events: none;
    background: radial-gradient(ellipse 72% 62% at 50% 40%, transparent 34%, rgba(5, 10, 22, 0.62) 100%);
    opacity: 0;
    transition: opacity 0.55s ease;
  }
  .dim-veil.on {
    opacity: 1;
  }
  @media (prefers-reduced-motion: reduce) {
    .dim-veil {
      transition: none;
    }
  }
</style>
