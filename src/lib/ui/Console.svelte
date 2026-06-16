<script lang="ts">
  import { palette } from '../design/tokens'
  let { children }: { children?: import('svelte').Snippet } = $props()
  const bandCells = [
    palette.coral, palette.offwhite, palette.piscina, palette.mostarda,
    palette.menta, palette.lilas, palette.rosa, palette.laranja,
    palette.creme, palette.petroleo, palette.coral, palette.menta,
    palette.mostarda, palette.piscina, palette.offwhite, palette.lilas,
  ]
</script>

<div class="console">
  <div class="console-body">{@render children?.()}</div>
  <div class="console-band" aria-hidden="true">
    {#each bandCells as c}<span style:background={c}></span>{/each}
  </div>
</div>

<style>
  /* console de plástico azul moldado (opaco): bisel no topo, sombra interna embaixo, skirt + faixa */
  .console {
    position: relative;
    width: min(720px, 96vw);
    margin-inline: auto;
    padding: var(--sp-4) var(--sp-4) calc(var(--sp-5) + 16px);
    border-radius: var(--r-5);
    background: linear-gradient(180deg, var(--console-top), var(--console-bot));
    box-shadow:
      var(--tray-shadow),
      inset 0 1px 0 var(--console-edge),
      inset 0 -12px 26px rgba(7, 16, 33, 0.42);
    overflow: hidden;
  }
  /* passthrough wrapper — sem estilos extras; herda o layout do .console diretamente */
  .console-body {
    display: contents;
  }
  /* faixa quadriculada multicolor na borda inferior (assinatura do tabuleiro físico) */
  .console-band {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 14px;
    display: flex;
    box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.4);
  }
  .console-band span {
    flex: 1;
  }
</style>
