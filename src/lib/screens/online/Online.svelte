<script lang="ts">
  import { createRoomConnection } from '../../online/room.svelte'
  import { getProfile } from '../../online/identity'
  import { game } from '../../game/store.svelte'
  import { press } from '../../audio/clicks'
  import CreateJoin from './CreateJoin.svelte'
  import Lobby from './Lobby.svelte'
  import OnlineRound from './OnlineRound.svelte'
  import OnlineGameOver from './OnlineGameOver.svelte'

  // ── Local pre-room state ─────────────────────────────────────────────────
  // roomCode drives the reactive Convex query (null => 'skip').
  let roomCode = $state<string | null>(null)

  // Perfil unificado: lido reativamente (re-lê ao salvar no ProfileSheet global via bumpProfile).
  const hasProfile = $derived.by(() => {
    game.profileVersion // dependência: re-avalia quando o perfil é salvo
    return getProfile() !== null
  })

  // Sem perfil ainda → abre o ProfileSheet global (montado no Shell) como onboarding.
  // Quando o usuário salvar, hasProfile re-deriva e a rota segue para create/join.
  $effect(() => {
    if (!hasProfile) game.openProfile()
  })

  // ── The single reactive room connection (component-scoped) ───────────────
  const conn = createRoomConnection(() => roomCode)

  function onJoined(code: string) {
    roomCode = code
  }

  async function leave() {
    press()
    await conn.leaveRoom().catch(() => {})
    roomCode = null
    game.goHome()
  }

  // ── Routing ──────────────────────────────────────────────────────────────
  // 1) no profile -> aguarda o ProfileSheet (prompt leve abaixo)
  // 2) no room (no code, or query hasn't resolved a room) -> CreateJoin
  // 3) in a room -> by status
  const route = $derived(
    !hasProfile
      ? 'profile'
      : !roomCode || !conn.room
        ? 'createjoin'
        : conn.room.status, // 'lobby' | 'playing' | 'ended'
  )
</script>

{#if route === 'profile'}
  <!-- Onboarding: o ProfileSheet global cobre a tela; aqui mostramos um prompt mínimo. -->
  <div class="profile-prompt">
    <p class="prompt-copy">Crie seu perfil para entrar numa sala.</p>
    <div class="prompt-actions">
      <button type="button" class="prompt-cta" onclick={() => game.openProfile()}>Criar perfil</button>
      <button type="button" class="prompt-ghost" onclick={() => game.goHome()}>Voltar</button>
    </div>
  </div>
{:else if route === 'createjoin'}
  <CreateJoin {conn} onJoined={onJoined} onBack={() => game.goHome()} onChangeProfile={() => game.openProfile()} />
{:else if route === 'lobby'}
  <Lobby {conn} onLeave={leave} />
{:else if route === 'playing'}
  <OnlineRound {conn} onLeave={leave} />
{:else}
  <!-- 'ended' -->
  <OnlineGameOver {conn} onLeave={leave} />
{/if}

<style>
  .profile-prompt {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-4);
    padding: var(--sp-5);
    text-align: center;
  }
  .prompt-copy {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-optical-sizing: auto;
    font-size: var(--fs-500);
    color: var(--ink-soft, var(--text-soft));
  }
  .prompt-actions { display: flex; gap: var(--sp-3); }
  .prompt-cta,
  .prompt-ghost {
    appearance: none;
    min-height: 48px;
    padding: 0 var(--sp-5);
    border-radius: 14px;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition: filter 160ms ease, border-color 160ms ease, transform 120ms ease;
  }
  .prompt-cta {
    border: none;
    background: var(--red);
    color: #fff;
    box-shadow: 0 6px 16px -5px rgba(221, 59, 46, 0.5);
  }
  .prompt-cta:hover { filter: brightness(1.05); }
  .prompt-cta:active { transform: translateY(1px); }
  .prompt-ghost {
    background: transparent;
    color: var(--ink, var(--text));
    border: 1.5px solid var(--hair, rgba(127, 127, 127, 0.3));
  }
  .prompt-ghost:hover { border-color: var(--ink-soft, var(--text-soft)); }
  .prompt-ghost:active { transform: translateY(1px); }
  .prompt-cta:focus-visible,
  .prompt-ghost:focus-visible {
    outline: 3px solid var(--mustard, var(--pov-mostarda));
    outline-offset: 3px;
  }
  @media (prefers-reduced-motion: reduce) {
    .prompt-cta, .prompt-ghost { transition: none; }
  }
</style>
