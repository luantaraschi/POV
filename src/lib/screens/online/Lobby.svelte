<script lang="ts">
  import Console from '../../ui/Console.svelte'
  import PlayerToken from '../../ui/PlayerToken.svelte'
  import { game, type PlayerColor } from '../../game/store.svelte'
  import { decks, type DeckId } from '../../cards/decks'
  import type { RoomConnection } from '../../online/room.svelte'
  import { press, confirm } from '../../audio/clicks'
  import { fly, scale } from 'svelte/transition'
  import { flip } from 'svelte/animate'

  type Props = { conn: RoomConnection; onLeave: () => void }
  let { conn, onLeave }: Props = $props()

  const room = $derived(conn.room)
  const players = $derived(conn.players)
  const connectedCount = $derived(conn.connectedPlayers.length)
  const canStart = $derived(conn.isHost && connectedCount >= 2)

  const deckLabel = $derived(room ? (decks[room.deck as DeckId]?.label ?? room.deck) : '')
  const voltasLabel = $derived(
    room?.voltas === 1 ? 'Curta' : room?.voltas === 3 ? 'Longa' : 'Média',
  )

  // motion durations honor the global reduced-motion flag
  const D = $derived(game.reduce ? 0 : 1)

  let copied = $state(false)
  let copyTimer: ReturnType<typeof setTimeout> | null = null

  async function copyCode() {
    if (!room) return
    press()
    const link = `${location.origin}${location.pathname}?room=${room.code}`
    try {
      await navigator.clipboard.writeText(link)
    } catch {
      // clipboard blocked (insecure ctx / permissions) — fall back to the code
      try { await navigator.clipboard.writeText(room.code) } catch { /* noop */ }
    }
    copied = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied = false), 1600)
  }

  $effect(() => () => { if (copyTimer) clearTimeout(copyTimer) })

  let starting = $state(false)
  async function start() {
    if (!canStart || starting) return
    starting = true
    confirm()
    try {
      await conn.startGame()
    } catch {
      starting = false
    }
    // on success the room.status flips to 'playing' and the shell re-routes.
  }
</script>

<div class="lobby">
  <div class="lobby-col">

    <!-- Header -->
    <div class="lobby-header">
      <button class="back-btn" aria-label="Sair da sala" onclick={onLeave}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <span class="online-badge">Sala online</span>
    </div>

    <!-- Big room code + copy -->
    <div class="code-card">
      <span class="code-label">Código da sala</span>
      <span class="code-value" aria-label="Código da sala {room?.code}">{room?.code ?? '····'}</span>
      <button class="copy-btn" class:copy-btn--done={copied} onclick={copyCode}>
        {#if copied}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5" />
          </svg>
          Link copiado
        {:else}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
               stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </svg>
          Copiar link
        {/if}
      </button>
    </div>

    <!-- Players -->
    <Console>
      <div class="roster">
        <div class="roster-head">
          <h2 class="roster-title">Jogadores</h2>
          <span class="roster-count" aria-live="polite">{connectedCount} na sala</span>
        </div>

        <ul class="players" role="list">
          {#each players as p (p.playerId)}
            <li
              class="player"
              class:player--off={!p.connected}
              role="listitem"
              animate:flip={{ duration: 220 * D }}
              in:fly={{ y: 8 * D, duration: 200 * D }}
              out:scale={{ start: 0.92, duration: 160 * D }}
            >
              <span class="player-av">
                {#if p.avatarUrl}
                  <img class="player-photo" src={p.avatarUrl} alt="" style:outline-color={`var(--pov-${p.color})`} />
                {:else}
                  <PlayerToken color={p.color as PlayerColor} name={p.name} size={34} />
                {/if}
                <span class="dot" class:dot--on={p.connected} aria-hidden="true"></span>
              </span>
              <span class="player-name">{p.name}</span>
              {#if room && p.playerId === room.hostPlayerId}
                <span class="host-tag">Anfitrião</span>
              {/if}
              {#if p.playerId === conn.playerId}
                <span class="you-tag">você</span>
              {/if}
            </li>
          {/each}
        </ul>

        <!-- config summary -->
        <div class="config" aria-label="Configuração da partida">
          <span class="config-pill">{deckLabel}</span>
          <span class="config-sep" aria-hidden="true">·</span>
          <span class="config-pill">{voltasLabel}</span>
        </div>
      </div>
    </Console>

    <!-- Action -->
    {#if conn.isHost}
      <button class="cta" disabled={!canStart || starting} onclick={start}>
        {#if starting}
          Iniciando…
        {:else if connectedCount < 2}
          Aguardando jogadores…
        {:else}
          Iniciar partida
        {/if}
      </button>
      {#if connectedCount < 2}
        <p class="hint">Precisa de pelo menos 2 jogadores na sala.</p>
      {/if}
    {:else}
      <div class="waiting">
        <span class="pulse-dot" aria-hidden="true"></span>
        Aguardando o anfitrião iniciar…
      </div>
    {/if}

  </div>
</div>

<style>
  .lobby {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-5) var(--sp-4) var(--sp-7);
  }
  .lobby-col {
    display: flex; flex-direction: column; gap: var(--sp-4);
    width: 100%; max-width: min(480px, 92vw);
  }
  .lobby-col :global(.console) { width: 100%; }

  .lobby-header { display: flex; align-items: center; gap: var(--sp-3); }
  .back-btn {
    display: grid; place-items: center;
    width: 44px; height: 44px;
    border-radius: var(--r-2);
    background: var(--icon-bg); border: 1px solid var(--icon-border);
    color: var(--text); cursor: pointer; flex: none;
    transition: filter 0.12s ease, transform 0.08s ease;
  }
  .back-btn:hover { filter: brightness(1.1); }
  .back-btn:active { transform: scale(0.93); }
  .back-btn:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .back-btn svg { width: 18px; height: 18px; }

  .online-badge {
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); font-weight: 700;
    letter-spacing: var(--tracking-caps); text-transform: uppercase;
    color: var(--pov-menta);
    background: rgba(147, 207, 169, 0.12);
    border: 1px solid rgba(147, 207, 169, 0.35);
    padding: 5px 10px; border-radius: 20px;
  }

  /* big code card */
  .code-card {
    display: flex; flex-direction: column; align-items: center; gap: var(--sp-2);
    padding: var(--sp-5) var(--sp-4);
    background: linear-gradient(180deg, var(--console-top), var(--console-bot));
    border-radius: var(--r-5);
    box-shadow: var(--tray-shadow), inset 0 1px 0 var(--console-edge);
  }
  .code-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.18em; text-transform: uppercase; color: #8aa0c8;
  }
  .code-value {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800;
    font-size: clamp(2.75rem, 14vw, 4rem);
    letter-spacing: 0.16em;
    line-height: 1;
    color: var(--pov-creme);
    text-shadow: 0 2px 0 rgba(0, 0, 0, 0.25);
    /* show the code as evenly-spaced chars; trim trailing letter-spacing */
    padding-left: 0.16em;
  }
  .copy-btn {
    display: inline-flex; align-items: center; gap: var(--sp-2);
    margin-top: var(--sp-1);
    min-height: 40px;
    padding: var(--sp-2) var(--sp-4);
    font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: var(--fs-400);
    color: var(--text);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 999px;
    cursor: pointer;
    transition: color 0.16s ease, border-color 0.16s ease, background 0.16s ease;
  }
  .copy-btn svg { width: 16px; height: 16px; }
  .copy-btn:hover { border-color: rgba(255, 255, 255, 0.32); }
  .copy-btn:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .copy-btn--done {
    color: var(--pov-menta);
    border-color: rgba(147, 207, 169, 0.45);
    background: rgba(147, 207, 169, 0.12);
  }

  /* roster */
  .roster { display: flex; flex-direction: column; gap: var(--sp-3); }
  .roster-head { display: flex; align-items: baseline; justify-content: space-between; }
  .roster-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700; font-size: var(--fs-600); color: var(--text);
  }
  .roster-count {
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); font-weight: 600;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums;
  }

  .players { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: var(--sp-2); }
  .player {
    display: flex; align-items: center; gap: var(--sp-3);
    padding: var(--sp-2) var(--sp-3);
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
    border-radius: var(--r-3);
  }
  .player--off { opacity: 0.5; }

  .player-av { position: relative; flex: none; display: grid; place-items: center; }
  .player-photo {
    width: 34px; height: 34px; border-radius: 50%;
    object-fit: cover;
    outline: 3px solid var(--pov-coral); outline-offset: 1px;
  }
  .dot {
    position: absolute; right: -2px; bottom: -2px;
    width: 11px; height: 11px; border-radius: 50%;
    background: #6b7689;
    border: 2px solid var(--console-bot, #0e1f3c);
  }
  .dot--on { background: var(--pov-menta); }

  .player-name {
    flex: 1; min-width: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; font-size: var(--fs-500); color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .host-tag, .you-tag {
    flex: none;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 3px 7px; border-radius: 20px;
  }
  .host-tag { color: var(--pov-mostarda); background: rgba(232, 178, 74, 0.12); }
  .you-tag { color: var(--text-soft); background: rgba(255, 255, 255, 0.06); }

  .config { display: flex; align-items: center; gap: var(--sp-2); margin-top: 2px; }
  .config-pill {
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); font-weight: 600;
    color: var(--text-soft);
  }
  .config-sep { color: var(--text-soft); opacity: 0.5; }

  /* CTA */
  .cta {
    appearance: none; border: none; cursor: pointer;
    width: 100%; min-height: 56px;
    padding: var(--sp-3) var(--sp-5);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700; font-size: var(--fs-600); color: #fff;
    background: var(--pov-coral-cta);
    border-radius: var(--r-4);
    border-bottom: 4px solid var(--pov-coral-lo);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.18),
      0 4px 14px -4px rgba(200, 65, 47, 0.5);
    transition: transform 80ms ease, box-shadow 80ms ease, border-bottom-width 80ms ease;
  }
  .cta:hover:not(:disabled) {
    background: color-mix(in srgb, var(--pov-coral-cta) 92%, white 8%);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22), 0 6px 18px -4px rgba(200, 65, 47, 0.6);
  }
  .cta:active:not(:disabled) {
    transform: translateY(2px); border-bottom-width: 2px;
    border-bottom-color: var(--pov-coral-skirt);
  }
  .cta:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 3px; }
  .cta:disabled { opacity: 0.45; cursor: not-allowed; }

  .hint {
    margin: 0; text-align: center;
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); color: var(--text-soft);
  }

  .waiting {
    display: flex; align-items: center; justify-content: center; gap: var(--sp-2);
    min-height: 56px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; font-size: var(--fs-500); color: var(--text-soft);
  }
  .pulse-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--pov-menta);
    animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) {
    .pulse-dot { animation: none; opacity: 0.8; }
  }
</style>
