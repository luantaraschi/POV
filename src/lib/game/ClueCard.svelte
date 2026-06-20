<script lang="ts">
  // Carta de pista da rodada: dois polos com trilho entre eles.
  // Lê do store — sem props, monta sozinha quando montada no InRound.
  import { game } from './store.svelte'

  const c = $derived(game.card)
</script>

<div class="clue">
  <div class="label">A pista desta rodada</div>
  <div class="poles">
    <span class="pole left">
      <!-- ponto de cor sutil do polo esquerdo (vem do baralho) -->
      <i class="dot" style="background:{c.lc}" aria-hidden="true"></i>
      {c.left}
    </span>
    <!-- trilho decorativo entre os polos -->
    <span class="rail" aria-hidden="true"></span>
    <span class="pole right">
      {c.right}
      <i class="dot" style="background:{c.rc}" aria-hidden="true"></i>
    </span>
  </div>
</div>

<style>
  .clue {
    background: var(--surface);
    border: 1px solid var(--hair);
    border-radius: 16px;
    /* sombra de produto: leve base + halo mais difuso abaixo */
    box-shadow:
      0 1px 2px rgba(27, 35, 80, .06),
      0 10px 26px -14px rgba(27, 35, 80, .18);
    padding: 12px 16px;
    width: min(560px, 94vw);
  }

  /* rótulo discreto acima dos polos */
  .label {
    font-size: 10.5px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--ink-soft);
    text-align: center;
    margin-bottom: 6px;
  }

  /* fila com polo-esq · trilho · polo-dir */
  .poles {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    color: var(--ink);
    font-family: 'Clash Display', sans-serif;
    font-weight: 600;
    font-size: clamp(15px, 2.4vw, 19px);
  }

  .pole {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    /* impede texto longo de espremer o trilho */
    flex-shrink: 0;
    max-width: 42%;
  }

  /* pontinho de cor do polo — discreto, não domina */
  .dot {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  /* trilho gradiente entre os polos */
  .rail {
    flex: 1;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(
      90deg,
      var(--hair),
      var(--ink-soft) 50%,
      var(--hair)
    );
    opacity: .5;
    min-width: 24px;
  }

  /* redução de movimento: remove transições caso o usuário prefira */
  @media (prefers-reduced-motion: reduce) {
    .clue { transition: none; }
  }
</style>
