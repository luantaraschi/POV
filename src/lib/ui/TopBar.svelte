<script lang="ts">
  import Logo from './Logo.svelte'
  import { press } from '../audio/clicks'
  import { getProfile } from '../online/identity'
  import { playerColors } from '../design/tokens'
  import { game } from '../game/store.svelte'

  type Props = {
    theme: 'dark' | 'light'
    sound: boolean
    onToggleTheme: () => void
    onToggleSound: () => void
    onMenu?: () => void
    onHome?: () => void
    /** Modo lobby: exibe cluster com perfil + "Como jogar" em vez do hambúrguer */
    isLobby?: boolean
    onOpenProfile?: () => void
    onOpenHowToPlay?: () => void
  }

  let {
    theme,
    sound,
    onToggleTheme,
    onToggleSound,
    onMenu,
    onHome,
    isLobby = false,
    onOpenProfile,
    onOpenHowToPlay,
  }: Props = $props()

  // Perfil lido do localStorage para o chip de lobby.
  // game.profileVersion entra como dependência reativa: ao salvar no ProfileSheet o chip re-lê.
  const profile = $derived.by(() => {
    game.profileVersion // dependência: re-lê o localStorage quando o perfil é salvo
    return isLobby ? getProfile() : null
  })
  // Iniciais para avatar fallback (primeira letra do nome)
  const initials = $derived(profile?.name ? profile.name.trim().charAt(0).toUpperCase() : '?')
  // Cor do avatar (da identidade do jogador)
  const avatarColor = $derived(profile?.color ?? 'coral')

  // Cor hex do avatar lida do mapa canônico de identidade do jogador (tokens.ts)
  // Evita duplicação de valores — tokens.ts é a única fonte de verdade.
</script>

<header class="topbar" class:topbar-lobby={isLobby}>
  <!-- POV-mark: no lobby é o mark com LED, fora do lobby é o Logo navegável -->
  {#if isLobby}
    <div class="brand" aria-label="POV">
      <span class="led" aria-hidden="true"></span>
      <span class="brand-text" aria-hidden="true">POV</span>
    </div>
  {:else}
    <Logo onActivate={onHome ? () => { press(); onHome?.() } : undefined} />
  {/if}

  <div class="top-actions">
    {#if isLobby}
      <!-- Cluster do lobby: Som | Tema | Como jogar | Chip de perfil -->

      <!-- Botão Som -->
      <button
        type="button"
        class="iconbtn"
        class:muted={!sound}
        onclick={() => { press(); onToggleSound() }}
        aria-pressed={sound}
        aria-label={sound ? 'Desligar som' : 'Ligar som'}
      >
        {#if sound}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        {/if}
      </button>

      <!-- Botão Tema -->
      <button
        type="button"
        class="iconbtn"
        onclick={() => { press(); onToggleTheme() }}
        aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {#if theme === 'dark'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        {/if}
      </button>

      <!-- Botão Como jogar -->
      <button
        type="button"
        class="iconbtn howtoplay-btn"
        onclick={() => { press(); onOpenHowToPlay?.() }}
        aria-label="Como jogar"
        title="Como jogar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>

      <!-- Chip de Perfil: avatar + nome (só avatar no mobile) -->
      <button
        type="button"
        class="profile-chip"
        onclick={() => { press(); onOpenProfile?.() }}
        aria-label={profile?.name ? `Perfil de ${profile.name}` : 'Abrir perfil'}
      >
        <span
          class="profile-av"
          style="background:{playerColors[avatarColor as keyof typeof playerColors] ?? playerColors.coral}"
          aria-hidden="true"
        >
          {initials}
        </span>
        {#if profile?.name}
          <span class="profile-name">{profile.name}</span>
        {/if}
      </button>
    {:else}
      <!-- Modo in-game: hambúrguer (em rodada) + Tema + Som -->
      {#if onMenu}
        <button
          type="button"
          class="iconbtn"
          aria-label="Menu"
          onclick={() => { press(); onMenu?.() }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>
      {/if}
      <button
        type="button"
        class="iconbtn"
        onclick={onToggleTheme}
        aria-label={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
      >
        {#if theme === 'dark'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        {/if}
      </button>
      <button
        type="button"
        class="iconbtn"
        class:muted={!sound}
        onclick={onToggleSound}
        aria-pressed={sound}
        aria-label={sound ? 'Desligar som' : 'Ligar som'}
      >
        {#if sound}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none" />
            <line x1="22" y1="9" x2="16" y2="15" />
            <line x1="16" y1="9" x2="22" y2="15" />
          </svg>
        {/if}
      </button>
    {/if}
  </div>
</header>

<style>
  .topbar {
    position: sticky;
    top: 0;
    z-index: var(--z-chrome, 5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: max(var(--sp-3), env(safe-area-inset-top)) max(var(--sp-5), env(safe-area-inset-right)) var(--sp-3)
      max(var(--sp-5), env(safe-area-inset-left));
    background: linear-gradient(180deg, var(--header-grad, transparent), transparent);
    backdrop-filter: blur(3px);
  }

  /* No lobby: fundo transparente (o cosmos está atrás) */
  .topbar-lobby {
    background: transparent;
    backdrop-filter: none;
  }

  .top-actions {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
  }

  /* ── POV-mark do lobby ── */
  .brand {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'Clash Display', 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 0.9375rem; /* 15px */
    letter-spacing: 0.04em;
    color: var(--ink);
    user-select: none;
  }

  .led {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--red);
    flex-shrink: 0;
    /* respiração sutil — desligada com reduce */
    animation: led-pulse 3s ease-in-out infinite;
  }

  @keyframes led-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  @media (prefers-reduced-motion: reduce) {
    .led {
      animation: none;
    }
  }

  /* ── Botões ícone (Som, Tema, Como jogar) ── */
  .iconbtn {
    display: grid;
    place-items: center;
    /* 44px: alvo mínimo de toque (Task 4 §9 — mobile) */
    width: 44px;
    height: 44px;
    color: var(--ink-soft, var(--text));
    background: var(--surface);
    border: none;
    border-radius: 11px;
    cursor: pointer;
    box-shadow:
      0 1px 2px rgba(27, 35, 80, 0.08),
      0 4px 10px -6px rgba(27, 35, 80, 0.18);
    transition:
      background 160ms ease,
      box-shadow 160ms ease,
      transform 120ms ease;
    flex-shrink: 0;
  }

  /* modo in-game: visual diferenciado (tamanho já é 44px na base) */
  :not(.topbar-lobby) .iconbtn {
    border-radius: var(--r-3, 14px);
    background: var(--icon-bg);
    border: 1px solid var(--icon-border);
    box-shadow: none;
    color: var(--text);
  }

  .iconbtn:hover {
    filter: brightness(1.08);
  }

  .iconbtn:active {
    transform: scale(0.92);
  }

  .iconbtn:focus-visible {
    outline: 3px solid var(--mustard, var(--pov-mostarda));
    outline-offset: 3px;
  }

  /* Som desligado: botão recuado (interruptor desligado) */
  .iconbtn.muted {
    background: var(--ctrl-track, rgba(255, 255, 255, 0.06));
    box-shadow: var(--inset-well, inset 0 2px 4px rgba(0, 0, 0, 0.2));
    color: var(--text-soft, var(--ink-soft));
  }

  .iconbtn svg {
    width: 18px;
    height: 18px;
  }

  /* ── Chip de perfil ── */
  .profile-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px 5px 5px;
    /* 44px: alvo mínimo de toque (Task 4 §9 — mobile) */
    min-height: 44px;
    border-radius: 999px;
    background: var(--surface);
    border: none;
    color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600;
    font-size: 0.8125rem; /* 13px */
    cursor: pointer;
    box-shadow:
      0 1px 2px rgba(27, 35, 80, 0.08),
      0 4px 10px -6px rgba(27, 35, 80, 0.18);
    transition:
      box-shadow 160ms ease,
      transform 120ms ease;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .profile-chip:hover {
    box-shadow:
      0 1px 2px rgba(27, 35, 80, 0.12),
      0 6px 14px -6px rgba(27, 35, 80, 0.24);
  }

  .profile-chip:active {
    transform: scale(0.95);
  }

  .profile-chip:focus-visible {
    outline: 3px solid var(--mustard, var(--pov-mostarda));
    outline-offset: 3px;
  }

  /* Círculo de avatar com inicial */
  .profile-av {
    display: grid;
    place-items: center;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    font-size: 0.6875rem; /* 11px */
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    /* borda anel duplo para o toque premium */
    box-shadow:
      0 0 0 2px var(--surface),
      0 0 0 3px currentColor;
  }

  /* Nome oculto em mobile (até 480px) */
  .profile-name {
    display: block;
  }

  @media (max-width: 480px) {
    .profile-name {
      display: none;
    }
    /* chip sem padding lateral quando não tem nome */
    .profile-chip {
      padding: 5px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .iconbtn,
    .profile-chip {
      transition: none;
    }
  }
</style>
