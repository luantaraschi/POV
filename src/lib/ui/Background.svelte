<script lang="ts">
  // Backdrop calmo por token: o saguão usa --bone (branco-osso no claro / meia-noite-azul no
  // escuro) + um holofote radial quente discreto no topo + grão de papel sutil. O halo cósmico
  // pesado do herói é responsabilidade do CosmosBackdrop (montado pelo Lobby), não daqui.
  // Removidos o sunburst arco-íris e as ondas concêntricas berrantes do design antigo (§2 do spec:
  // "toda a cor concentrada no dial"; o usuário rejeitou versões pesadas).
  type Props = { dim?: boolean }
  let { dim = false }: Props = $props()
</script>

<!-- Holofote radial quente no topo (sutil): dá foco ao herói sem virar pôster. aria-hidden. -->
<div class="spotlight" aria-hidden="true"></div>

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
  .spotlight,
  .grain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  /* holofote quente bem suave no topo (dose baixa de calor) */
  .spotlight {
    z-index: var(--z-bg, 0);
    background: radial-gradient(58% 42% at 50% 30%, #fffdf7 0%, rgba(255, 253, 247, 0) 60%);
    opacity: 0.5;
  }
  :global(.theme-dark) .spotlight {
    background: radial-gradient(58% 42% at 50% 30%, rgba(255, 233, 196, 0.1) 0%, rgba(255, 233, 196, 0) 55%);
    opacity: 1;
  }
  /* grão de papel sutil para o toque retrô-tátil */
  .grain {
    z-index: 9;
    mix-blend-mode: multiply;
    opacity: 0.05;
  }
  :global(.theme-dark) .grain {
    mix-blend-mode: screen;
    opacity: 0.05;
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
