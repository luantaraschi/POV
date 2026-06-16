<script lang="ts" generics="T extends string">
  type Option = { id: T; label: string }
  type Props = { options: Option[]; value: T; onChange: (id: T) => void; ariaLabel: string }
  let { options, value, onChange, ariaLabel }: Props = $props()
  const activeIndex = $derived(Math.max(0, options.findIndex((o) => o.id === value)))
</script>

<div class="segment states" role="group" aria-label={ariaLabel} style:--count={options.length} style:--active={activeIndex}>
  <span class="pill" aria-hidden="true"></span>
  {#each options as o}
    <button aria-pressed={value === o.id} onclick={() => onChange(o.id)}>{o.label}</button>
  {/each}
</div>

<style>
  /* base segmented control */
  .segment {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: 1fr;
    gap: var(--sp-1);
    padding: var(--sp-1);
    border-radius: var(--r-4);
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
  }
  .segment button {
    border: 0;
    background: transparent;
    cursor: pointer;
    min-height: 44px;
    padding: var(--sp-2) var(--sp-3);
    border-radius: var(--r-3);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-400);
    color: var(--ctrl-fg);
    transition:
      color 0.12s,
      background 0.12s,
      transform 0.08s ease;
  }
  .segment button[aria-pressed='true'] {
    color: var(--ctrl-active-fg);
    background: var(--ctrl-active-bg);
  }
  .segment button:active {
    transform: scale(0.96);
  }
  .segment button:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
  }

  /* pílula deslizante (a casa ativa "salta" como um detente do dial) */
  .segment.states {
    position: relative;
    gap: 0;
  }
  .segment.states .pill {
    position: absolute;
    top: var(--sp-1);
    bottom: var(--sp-1);
    left: var(--sp-1);
    width: calc((100% - 2 * var(--sp-1)) / var(--count));
    border-radius: 16px;
    background: var(--ctrl-active-bg);
    transform: translateX(calc(var(--active) * 100%));
    transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
    z-index: 0;
    pointer-events: none;
  }
  .segment.states button {
    position: relative;
    z-index: 1;
  }
  .segment.states button[aria-pressed='true'] {
    background: transparent; /* a pílula é o fundo ativo */
  }
  @media (prefers-reduced-motion: reduce) {
    .segment.states .pill {
      transition: none;
    }
  }
</style>
