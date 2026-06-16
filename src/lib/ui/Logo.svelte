<script lang="ts">
  let { size, onActivate }: { size?: string; onActivate?: () => void } = $props()
</script>

{#snippet mark()}
  <span aria-hidden="true">P</span>
  <svg class="logo-o" viewBox="0 0 40 40" aria-hidden="true">
    <circle cx="20" cy="22" r="15" fill="none" stroke="var(--pov-coral)" stroke-width="4" />
    <path d="M7 22 A13 13 0 0 1 33 22" fill="none" stroke="var(--pov-bullseye)" stroke-width="3" />
    <line x1="20" y1="22" x2="27" y2="11" stroke="var(--pov-coral)" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="20" cy="22" r="3.4" fill="var(--pov-mostarda)" />
    <path d="M31 7 L32 10 L35 11 L32 12 L31 15 L30 12 L27 11 L30 10 Z" fill="var(--pov-piscina)" />
  </svg>
  <span aria-hidden="true">V</span>
{/snippet}

{#if onActivate}
  <button
    type="button"
    class="logo logo-btn"
    aria-label="Voltar ao início"
    style:font-size={size}
    onclick={onActivate}
  >
    {@render mark()}
  </button>
{:else}
  <span class="logo" role="img" aria-label="POV" style:font-size={size}>
    {@render mark()}
  </span>
{/if}

<style>
  .logo {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: 30px;
    letter-spacing: 0.06em;
    color: currentColor;
  }
  .logo-o {
    width: 30px;
    height: 30px;
    margin: 0 1px;
  }

  /* clickable variant (back-to-home) — reset native button chrome */
  .logo-btn {
    appearance: none;
    background: none;
    border: none;
    padding: 4px 6px;
    margin: -4px -6px;
    border-radius: var(--r-2);
    cursor: pointer;
    transition: background 0.12s ease, transform 0.08s ease;
  }
  .logo-btn:hover {
    background: var(--icon-bg);
  }
  .logo-btn:active {
    transform: scale(0.96);
  }
  .logo-btn:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
  }
</style>
