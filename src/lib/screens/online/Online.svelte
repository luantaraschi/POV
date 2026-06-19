<script lang="ts">
  import { createRoomConnection } from '../../online/room.svelte'
  import { getProfile } from '../../online/identity'
  import { game } from '../../game/store.svelte'
  import { press } from '../../audio/clicks'
  import Profile from './Profile.svelte'
  import CreateJoin from './CreateJoin.svelte'
  import Lobby from './Lobby.svelte'
  import OnlineRound from './OnlineRound.svelte'
  import OnlineGameOver from './OnlineGameOver.svelte'

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
  <Profile {conn} onContinue={onProfileSaved} onBack={() => game.goHome()} />
{:else if route === 'createjoin'}
  <CreateJoin {conn} onJoined={onJoined} onBack={() => { if (hasProfile) step = 'profile'; else game.goHome() }} onChangeProfile={() => (step = 'profile')} />
{:else if route === 'lobby'}
  <Lobby {conn} onLeave={leave} />
{:else if route === 'playing'}
  <OnlineRound {conn} onLeave={leave} />
{:else}
  <!-- 'ended' -->
  <OnlineGameOver {conn} onLeave={leave} />
{/if}
