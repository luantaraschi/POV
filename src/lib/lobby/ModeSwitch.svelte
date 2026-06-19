<script lang="ts">
  // Segmentado controlado Local | Online para o card de entrada do lobby.
  import { press } from '../audio/clicks'

  let { value = $bindable<'local' | 'online'>('local') }: { value?: 'local' | 'online' } = $props()

  function pick(v: 'local' | 'online') {
    if (v !== value) {
      value = v
      press()
    }
  }
</script>

<div class="seg" role="radiogroup" aria-label="Modo de jogo">
  <button
    type="button"
    role="radio"
    aria-checked={value === 'local'}
    class:on={value === 'local'}
    onclick={() => pick('local')}
  >
    Local
  </button>
  <button
    type="button"
    role="radio"
    aria-checked={value === 'online'}
    class:on={value === 'online'}
    onclick={() => pick('online')}
  >
    Online
  </button>
</div>

<style>
  .seg {
    display: flex;
    background: var(--sunk);
    border-radius: 999px;
    padding: 4px;
    font-size: 0.8125rem; /* 13px */
    font-weight: 600;
    font-family: 'Inter', system-ui, sans-serif;
    gap: 0;
  }

  .seg button {
    flex: 1;
    text-align: center;
    padding: 8px 0;
    border-radius: 999px;
    border: none;
    background: transparent;
    color: var(--ink-soft);
    font-weight: 600;
    font-size: inherit;
    font-family: inherit;
    cursor: pointer;
    min-height: 44px;
    transition:
      background 160ms ease,
      color 160ms ease,
      box-shadow 160ms ease;
  }

  /* pílula ativa: superfície com sombra sutil */
  .seg button.on {
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 1px 3px rgba(27, 35, 80, 0.16);
  }

  :global(.theme-dark) .seg button.on {
    background: #28335c;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  }

  .seg button:hover:not(.on) {
    color: var(--ink);
  }

  .seg button:active {
    transform: scale(0.97);
  }

  .seg button:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .seg button {
      transition: none;
    }
  }
</style>
