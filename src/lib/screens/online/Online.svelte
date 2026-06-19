<script lang="ts">
  import { createRoomConnection } from '../../online/room.svelte'
  import { getProfile } from '../../online/identity'
  import { game } from '../../game/store.svelte'
  import { press } from '../../audio/clicks'
  import Profile from './Profile.svelte'
  import CreateJoin from './CreateJoin.svelte'
  import Lobby from './Lobby.svelte'

  // ── Local pre-room state ─────────────────────────────────────────────────
  // roomCode drives the reactive Convex query (null => 'skip').
  let roomCode = $state<string | null>(null)
  // step gates the pre-room flow (profile -> create/join). Once in a room,
  // routing is driven by conn.room.status instead.
  let step = $state<'profile' | 'createjoin'>('createjoin')

  // Reactive snapshot of the saved profile (re-read after Profile saves).
  let hasProfile = $state(getProfile() !== null)

  // ── The single reactive room connection (component-scoped) ───────────────
  const conn = createRoomConnection(() => roomCode)

  // Resume: if a profile already exists we skip straight to create/join.
  $effect(() => {
    if (!hasProfile) step = 'profile'
  })

  function onProfileSaved() {
    hasProfile = true
    step = 'createjoin'
  }

  function onJoined(code: string) {
    roomCode = code
  }

  async function leave() {
    press()
    await conn.leaveRoom().catch(() => {})
    roomCode = null
    step = hasProfile ? 'createjoin' : 'profile'
    game.goHome()
  }

  // ── Routing ──────────────────────────────────────────────────────────────
  // 1) no profile -> Profile
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
  <Profile {conn} onContinue={onProfileSaved} onBack={() => game.openModeSelect()} />
{:else if route === 'createjoin'}
  <CreateJoin {conn} onJoined={onJoined} onBack={() => { if (hasProfile) step = 'profile'; else game.openModeSelect() }} onChangeProfile={() => (step = 'profile')} />
{:else if route === 'lobby'}
  <Lobby {conn} onLeave={leave} />
{:else if route === 'playing'}
  <!-- TEMP placeholder — substituído pela OnlineRound na Task 7 -->
  <div class="placeholder" data-testid="online-playing">
    <p>Partida iniciada — tela de jogo em construção (Task 7)</p>
    <button class="ghost-btn" onclick={leave}>Sair da sala</button>
  </div>
{:else}
  <!-- 'ended' — TEMP placeholder -->
  <div class="placeholder" data-testid="online-ended">
    <p>Partida encerrada — placar final em construção (Task 7)</p>
    <button class="ghost-btn" onclick={leave}>Sair da sala</button>
  </div>
{/if}

<style>
  .placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--sp-4);
    padding: var(--sp-6);
    text-align: center;
  }
  .placeholder p {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-500);
    color: var(--text-soft);
    max-width: 30ch;
  }
  .ghost-btn {
    appearance: none;
    cursor: pointer;
    min-height: 44px;
    padding: var(--sp-2) var(--sp-5);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-400);
    color: var(--text-soft);
    background: transparent;
    border: 1px solid var(--ctrl-border);
    border-radius: var(--r-3);
    transition: color 0.12s ease, border-color 0.12s ease;
  }
  .ghost-btn:hover { color: var(--text); border-color: rgba(255, 255, 255, 0.3); }
  .ghost-btn:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
</style>
