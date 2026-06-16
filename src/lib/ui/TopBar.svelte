<script lang="ts">
  import Logo from './Logo.svelte'
  import { press } from '../audio/clicks'

  type Props = {
    theme: 'dark' | 'light'
    sound: boolean
    onToggleTheme: () => void
    onToggleSound: () => void
    onMenu?: () => void
  }

  let { theme, sound, onToggleTheme, onToggleSound, onMenu }: Props = $props()
</script>

<header class="topbar">
  <Logo />

  <div class="top-actions">
    {#if onMenu}
      <button class="iconbtn" aria-label="Menu" onclick={() => { press(); onMenu?.() }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="4" y1="7" x2="20" y2="7" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="17" x2="20" y2="17" />
        </svg>
      </button>
    {/if}
    <button class="iconbtn" onclick={onToggleTheme} aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}>
      {#if theme === 'dark'}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      {/if}
    </button>
    <button class="iconbtn" class:muted={!sound} onclick={onToggleSound} aria-pressed={sound} aria-label={sound ? 'Desligar som' : 'Ligar som'}>
      {#if sound}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
          <line x1="22" y1="9" x2="16" y2="15" />
          <line x1="16" y1="9" x2="22" y2="15" />
        </svg>
      {/if}
    </button>
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: max(var(--sp-3), env(safe-area-inset-top)) max(var(--sp-5), env(safe-area-inset-right)) var(--sp-3)
      max(var(--sp-5), env(safe-area-inset-left));
    background: linear-gradient(180deg, var(--header-grad), transparent);
    backdrop-filter: blur(3px);
  }
  .top-actions {
    display: flex;
    gap: var(--sp-2);
  }
  .iconbtn {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    color: var(--text);
    background: var(--icon-bg);
    border: 1px solid var(--icon-border);
    border-radius: var(--r-3);
    cursor: pointer;
    transition:
      background 0.12s ease,
      box-shadow 0.12s ease,
      transform 0.08s ease;
  }
  .iconbtn:hover {
    filter: brightness(1.1);
  }
  .iconbtn:active {
    transform: scale(0.94);
  }
  .iconbtn:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 3px;
  }
  /* som desligado = botão "afundado" (recessed), sente-se como um interruptor desligado */
  .iconbtn.muted {
    background: var(--ctrl-track);
    box-shadow: var(--inset-well);
    color: var(--text-soft);
  }
  .iconbtn svg {
    width: 20px;
    height: 20px;
  }
</style>
