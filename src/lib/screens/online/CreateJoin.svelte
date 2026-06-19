<script lang="ts">
  import Console from '../../ui/Console.svelte'
  import Segmented from '../../ui/Segmented.svelte'
  import PlayerToken from '../../ui/PlayerToken.svelte'
  import { getProfile } from '../../online/identity'
  import type { RoomConnection } from '../../online/room.svelte'
  import { decks, DECK_IDS, type DeckId } from '../../cards/decks'
  import { press, confirm } from '../../audio/clicks'

  type Props = {
    conn: RoomConnection
    onJoined: (code: string) => void
    onBack: () => void
    onChangeProfile: () => void
  }
  let { conn, onJoined, onBack, onChangeProfile }: Props = $props()

  const profile = getProfile()!

  // Two stacked actions: create (with config) and join (with code).
  let busy = $state(false)
  let error = $state<string | null>(null)

  // ── Create config (host picks deck + duration here) ──────────────────────
  let deckId = $state<DeckId>('classico')

  type VoltasId = 'curta' | 'media' | 'longa'
  let voltasId = $state<VoltasId>('media')
  const voltasOptions = [
    { id: 'curta' as VoltasId, label: 'Curta' },
    { id: 'media' as VoltasId, label: 'Média' },
    { id: 'longa' as VoltasId, label: 'Longa' },
  ]
  const voltasNumber = $derived<1 | 2 | 3>(
    voltasId === 'curta' ? 1 : voltasId === 'longa' ? 3 : 2,
  )

  // ── Join code ─────────────────────────────────────────────────────────────
  let code = $state('')
  const normalizedCode = $derived(code.trim().toUpperCase())
  const canJoin = $derived(normalizedCode.length >= 4)

  async function createRoom() {
    if (busy) return
    busy = true
    error = null
    confirm()
    try {
      const res = await conn.createRoom({
        profile,
        deck: deckId,
        voltas: voltasNumber,
        deckSize: decks[deckId].cards.length,
      })
      if (res?.code) onJoined(res.code)
      else error = 'Não deu para criar a sala. Tente de novo.'
    } catch {
      error = 'Não deu para criar a sala. Tente de novo.'
    } finally {
      busy = false
    }
  }

  async function joinRoom() {
    if (busy || !canJoin) return
    busy = true
    error = null
    press()
    try {
      await conn.joinRoom(normalizedCode, profile)
      onJoined(normalizedCode)
    } catch (e) {
      const msg = e instanceof Error ? e.message : ''
      error = msg.includes('começou')
        ? 'Essa sala já começou.'
        : 'Sala não encontrada. Confira o código.'
    } finally {
      busy = false
    }
  }
</script>

<div class="cj">
  <div class="cj-col">

    <div class="cj-header">
      <button class="back-btn" aria-label="Voltar" onclick={() => { press(); onBack() }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div class="title-block">
        <h1 class="cj-title">Sala online</h1>
        <p class="cj-sub">Crie uma sala ou entre com um código.</p>
      </div>
    </div>

    <!-- Identity chip — who you are + edit -->
    <button class="me-chip" onclick={() => { press(); onChangeProfile() }}>
      <PlayerToken color={profile.color} name={profile.name} size={28} />
      <span class="me-name">{profile.name}</span>
      <span class="me-edit">Editar</span>
    </button>

    {#if error}
      <p class="error" role="alert">{error}</p>
    {/if}

    <Console>
      <div class="panel">

        <!-- ── Create ── -->
        <section class="block">
          <h2 class="block-title">Criar uma sala</h2>

          <div class="field">
            <span class="section-label">Baralho</span>
            <div class="deck-chips">
              {#each DECK_IDS as id (id)}
                <button
                  class="deck-chip"
                  class:deck-chip--active={deckId === id}
                  aria-pressed={deckId === id}
                  onclick={() => { press(); deckId = id }}
                >
                  <span class="deck-chip-label">{decks[id].label}</span>
                  <span class="deck-chip-count">{decks[id].cards.length} cartas</span>
                </button>
              {/each}
            </div>
          </div>

          <div class="field">
            <span class="section-label">Duração</span>
            <Segmented
              options={voltasOptions}
              value={voltasId}
              onChange={(id) => { voltasId = id }}
              ariaLabel="Duração da partida"
            />
          </div>

          <button class="cta" disabled={busy} onclick={createRoom}>
            {busy ? 'Criando…' : 'Criar sala'}
          </button>
        </section>

        <div class="divider"><span>ou</span></div>

        <!-- ── Join ── -->
        <section class="block">
          <h2 class="block-title">Entrar numa sala</h2>
          <div class="join-row">
            <label class="sr-only" for="room-code">Código da sala</label>
            <input
              id="room-code"
              class="code-input"
              type="text"
              bind:value={code}
              placeholder="CÓDIGO"
              maxlength={6}
              autocapitalize="characters"
              autocomplete="off"
              spellcheck="false"
              enterkeyhint="go"
              onkeydown={(e) => { if (e.key === 'Enter') joinRoom() }}
            />
            <button class="join-btn" disabled={busy || !canJoin} onclick={joinRoom}>
              {busy ? '…' : 'Entrar'}
            </button>
          </div>
        </section>

      </div>
    </Console>

  </div>
</div>

<style>
  .cj {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-5) var(--sp-4) var(--sp-7);
  }
  .cj-col {
    display: flex; flex-direction: column; gap: var(--sp-4);
    width: 100%; max-width: min(480px, 92vw);
  }
  .cj-col :global(.console) { width: 100%; }

  .cj-header { display: flex; align-items: center; gap: var(--sp-3); }
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

  .title-block { display: flex; flex-direction: column; gap: 2px; }
  .cj-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: var(--fs-700);
    color: var(--text); line-height: var(--lh-tight);
  }
  .cj-sub {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic; font-weight: 500;
    font-size: var(--fs-400); color: var(--text-soft);
    line-height: var(--lh-body); font-optical-sizing: auto;
  }

  /* identity chip */
  .me-chip {
    display: inline-flex; align-items: center; gap: var(--sp-2);
    align-self: flex-start;
    padding: 6px var(--sp-3) 6px 6px;
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
    border-radius: 999px;
    cursor: pointer;
    transition: border-color 0.12s ease;
  }
  .me-chip:hover { border-color: rgba(255, 255, 255, 0.28); }
  .me-chip:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .me-name {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; font-size: var(--fs-400); color: var(--text);
  }
  .me-edit {
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); font-weight: 600;
    color: var(--text-soft);
    padding-left: var(--sp-2);
    border-left: 1px solid var(--ctrl-border);
  }

  .error {
    margin: 0;
    padding: var(--sp-2) var(--sp-3);
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-400); font-weight: 600;
    color: var(--pov-coral);
    background: rgba(226, 87, 68, 0.1);
    border: 1px solid rgba(226, 87, 68, 0.3);
    border-radius: var(--r-3);
  }

  .panel { display: flex; flex-direction: column; gap: var(--sp-4); }

  .block { display: flex; flex-direction: column; gap: var(--sp-3); }
  .block-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700; font-size: var(--fs-600); color: var(--text);
  }

  .field { display: flex; flex-direction: column; gap: var(--sp-2); }
  .section-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase; color: #8aa0c8;
  }

  /* deck chips (matches Setup) */
  .deck-chips { display: flex; gap: var(--sp-2); }
  .deck-chip {
    flex: 1;
    display: flex; flex-direction: column; align-items: center; gap: 3px;
    text-align: center; border-radius: var(--r-3);
    padding: var(--sp-2) var(--sp-2) 10px; min-height: 56px;
    font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: var(--fs-300);
    user-select: none; cursor: pointer;
    border: 1px solid var(--ctrl-border); background: var(--ctrl-track); color: var(--text-soft);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
    transition: background 0.14s, color 0.14s, border-color 0.14s, box-shadow 0.14s, transform 0.08s;
  }
  .deck-chip:hover { border-color: rgba(255, 255, 255, 0.25); color: var(--text); transform: translateY(-1px); }
  .deck-chip:active { transform: scale(0.97); }
  .deck-chip:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .deck-chip--active {
    background: var(--pov-creme); color: #11233f; border-color: var(--pov-cream-hi);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.6),
      0 0 0 2px color-mix(in srgb, var(--pov-mostarda) 35%, transparent),
      0 4px 12px -6px rgba(0, 0, 0, 0.5);
  }
  .deck-chip--active:hover { transform: translateY(-1px); color: #11233f; }
  .deck-chip-label { font-weight: 700; font-size: var(--fs-400); }
  .deck-chip-count { font-weight: 600; font-size: 10px; opacity: 0.62; font-variant-numeric: tabular-nums; }
  .deck-chip--active .deck-chip-count { opacity: 0.75; }

  /* divider with "ou" */
  .divider {
    display: flex; align-items: center; gap: var(--sp-3);
    color: var(--text-soft);
    font-family: 'Space Grotesk', sans-serif; font-size: var(--fs-300);
    text-transform: uppercase; letter-spacing: 0.1em;
  }
  .divider::before, .divider::after {
    content: ''; flex: 1; height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  /* join row */
  .join-row { display: flex; gap: var(--sp-2); }
  .code-input {
    flex: 1; min-width: 0;
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
    border-radius: var(--r-3);
    padding: var(--sp-3);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: var(--fs-600);
    letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--text); outline: none;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }
  .code-input::placeholder { letter-spacing: 0.14em; color: var(--text-soft); opacity: 0.6; }
  .code-input:focus { border-color: rgba(255, 255, 255, 0.25); box-shadow: 0 0 0 2px rgba(232, 178, 74, 0.3); }

  .join-btn {
    flex: none;
    padding: 0 var(--sp-5); min-height: 52px;
    font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: var(--fs-500);
    color: var(--text);
    background: var(--ctrl-track);
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: var(--r-3);
    cursor: pointer;
    transition: border-color 0.12s ease, background 0.12s ease, transform 0.08s ease;
  }
  .join-btn:hover:not(:disabled) { border-color: rgba(255, 255, 255, 0.35); }
  .join-btn:active:not(:disabled) { transform: scale(0.97); }
  .join-btn:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .join-btn:disabled { opacity: 0.45; cursor: not-allowed; }

  /* primary CTA (create) */
  .cta {
    appearance: none; border: none; cursor: pointer;
    width: 100%; min-height: 52px;
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
  .cta:disabled { opacity: 0.6; cursor: progress; }

  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;
  }
</style>
