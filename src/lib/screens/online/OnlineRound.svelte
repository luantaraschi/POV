<script lang="ts">
  import Meter from '../../meter/Meter.svelte'
  import Card from '../../cards/Card.svelte'
  import Console from '../../ui/Console.svelte'
  import PlayerToken from '../../ui/PlayerToken.svelte'
  import { decks, cardColors, type DeckId } from '../../cards/decks'
  import { scoreFor, stepIndex } from '../../meter/geometry'
  import { palette } from '../../design/tokens'
  import { tierCopy, tierVar } from '../../game/scoring'
  import { game, type PlayerColor } from '../../game/store.svelte'
  import {
    unlockAudio,
    press,
    thunk,
    scoreSting,
    celebrate,
    tick,
  } from '../../audio/clicks'
  import type { RoomConnection } from '../../online/room.svelte'
  import { fly, scale } from 'svelte/transition'
  import { flip } from 'svelte/animate'

  type Props = { conn: RoomConnection; onLeave: () => void }
  let { conn, onLeave }: Props = $props()

  // ── reduced-motion (own listener; mirrors the meter/InRound pattern) ──────
  let reduce = $state(false)
  $effect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduce = mq.matches
    const on = () => (reduce = mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  })
  const D = $derived(reduce ? 0 : 1) // motion multiplier for svelte transitions

  // ── room-derived state ────────────────────────────────────────────────────
  const room = $derived(conn.room)
  const round = $derived(room?.round ?? null)
  const phase = $derived(round?.phase ?? 'guessing')
  const isDono = $derived(conn.isDono)
  const players = $derived(conn.players)

  // current card (client-side deck; server holds only the index)
  const card = $derived.by(() => {
    if (!room || !round) return null
    return decks[room.deck as DeckId]?.cards[round.cardIndex] ?? null
  })
  const cardCol = $derived.by(() => {
    if (!round || !card) return { lc: palette.menta, rc: palette.coral }
    return cardColors(round.cardIndex, card)
  })

  // player lookup helpers
  const byId = $derived(new Map(players.map((p) => [p.playerId, p])))
  const dono = $derived(round ? (byId.get(round.donoPlayerId) ?? null) : null)
  const guesserList = $derived(
    round ? players.filter((p) => p.playerId !== round.donoPlayerId) : [],
  )
  const guessByPlayer = $derived(new Map(conn.guesses.map((g) => [g.playerId, g])))

  const lockedCount = $derived(conn.lockedCount)
  const guesserCount = $derived(conn.guesserCount)

  // ── guesser: my local dial value, synced live ────────────────────────────
  // The Meter mutates `value` via bind:value as the player drags. A push $effect
  // mirrors every LOCAL change to the server (updateGuess is throttled in the
  // composable). A sync $effect seeds `value` from the server on a new round (and
  // before the player has touched the dial). `applyingServer` guards the push so
  // a server-driven set never echoes back as a new guess.
  let value = $state(50)
  let touched = $state(false)
  let applyingServer = false
  let lastPushed = 50
  let lastRoundIndex: number | undefined
  $effect(() => {
    const idx = round?.index
    const serverVal = conn.myGuess?.value ?? 50
    if (idx !== lastRoundIndex) {
      // new round: reset to my server value (or 50) and clear local touch
      applyingServer = true
      value = serverVal
      touched = false
      lastRoundIndex = idx
      lastPushed = serverVal
      applyingServer = false
    } else if (!touched) {
      // before I've dragged, mirror the server (e.g. a value from another device)
      applyingServer = true
      value = serverVal
      applyingServer = false
    }
  })

  // push local drags to the server (throttled). Skips server-driven sets.
  $effect(() => {
    const v = value // track
    if (isDono || phase !== 'guessing') return
    if (applyingServer) return
    if (v === lastPushed) return
    lastPushed = v
    touched = true
    conn.updateGuess(v)
  })

  const myLocked = $derived(conn.myGuess?.locked ?? false)

  let locking = $state(false)
  async function lock() {
    if (myLocked || locking) return
    unlockAudio()
    thunk()
    locking = true
    try {
      // make sure the latest value is on the server before locking
      conn.updateGuess(value)
      await conn.lockGuess()
    } finally {
      locking = false
    }
  }

  // ── dono: force reveal ────────────────────────────────────────────────────
  let revealing = $state(false)
  async function forceReveal() {
    if (revealing) return
    unlockAudio()
    press()
    revealing = true
    try {
      await conn.reveal()
    } finally {
      revealing = false
    }
  }

  // ── host: next round / leave on game end ──────────────────────────────────
  let advancing = $state(false)
  async function next() {
    if (advancing) return
    unlockAudio()
    press()
    advancing = true
    try {
      await conn.nextRound()
    } finally {
      advancing = false
    }
  }

  // ════════════════════════════════════════════════════════════════════════
  //  REVELATION SEQUENCE — suspense beat → result, synchronized across clients
  // ════════════════════════════════════════════════════════════════════════
  // The server flips phase to 'reveal' for everyone ~together. Each client then
  // runs a short countdown beat, THEN opens the dial + shows the grid + plays
  // the score sting. Reduced-motion skips straight to the result.
  let showResult = $state(false)
  let countdown = $state(0) // 3,2,1 — the visible suspense beat
  let revealTimers: ReturnType<typeof setTimeout>[] = []
  function clearRevealTimers() {
    for (const t of revealTimers) clearTimeout(t)
    revealTimers = []
  }

  // my own result (only meaningful for guessers; target is live in reveal)
  const myScore = $derived(
    round && round.target != null && !isDono
      ? scoreFor(conn.myGuess?.value ?? 50, round.target)
      : 0,
  )
  const myGap = $derived(
    round && round.target != null && !isDono
      ? Math.abs(stepIndex(conn.myGuess?.value ?? 50) - stepIndex(round.target))
      : 0,
  )
  const myPhrase = $derived(
    tierCopy[myScore][(round?.index ?? 0) % tierCopy[myScore].length],
  )

  // played-once guard so the sting/celebrate fire exactly once per reveal
  let stungRound: number | null = null
  function playRevealSound() {
    if (isDono) {
      // Dono doesn't score; play a soft, neutral reveal confirmation
      scoreSting(3)
      return
    }
    if (myScore === 4) celebrate()
    else scoreSting(myScore)
  }

  $effect(() => {
    const p = phase
    const idx = round?.index ?? -1
    clearRevealTimers()
    if (p !== 'reveal') {
      showResult = false
      countdown = 0
      return
    }
    // entering reveal for this round
    if (reduce) {
      showResult = true
      countdown = 0
      if (stungRound !== idx) {
        stungRound = idx
        playRevealSound()
      }
      return
    }
    // suspense beat: 3 → 2 → 1 → result (~1.9s)
    showResult = false
    countdown = 3
    if (typeof window !== 'undefined') {
      revealTimers.push(setTimeout(() => { countdown = 2; tick(0.6) }, 620))
      revealTimers.push(setTimeout(() => { countdown = 1; tick(0.6) }, 1240))
      revealTimers.push(
        setTimeout(() => {
          countdown = 0
          showResult = true
          if (stungRound !== idx) {
            stungRound = idx
            playRevealSound()
          }
        }, 1860),
      )
    }
  })

  $effect(() => () => clearRevealTimers())

  // markers for the big dial on reveal: every guesser's pin in their color
  const allMarkers = $derived(
    round
      ? guesserList
          .map((p) => {
            const g = guessByPlayer.get(p.playerId)
            return g
              ? { p: g.value, color: `var(--pov-${p.color})` }
              : null
          })
          .filter((m): m is { p: number; color: string } => m !== null)
      : [],
  )

  // group seal numbers for the live status
  const groupScore = $derived(room?.groupScore ?? 0)

  const isLast = $derived.by(() => {
    if (!room || !round) return false
    const total = room.voltas * players.length
    return round.index + 1 >= total
  })

  // per-player result rows (dynamic grid on reveal)
  type ResultRow = {
    playerId: string
    name: string
    color: PlayerColor
    avatarUrl: string | null
    value: number
    score: 0 | 2 | 3 | 4
    gap: number
    isMe: boolean
  }
  const resultRows = $derived.by((): ResultRow[] => {
    if (!round || round.target == null) return []
    return guesserList.map((p) => {
      const g = guessByPlayer.get(p.playerId)
      const val = g?.value ?? 50
      const sc = scoreFor(val, round.target as number)
      return {
        playerId: p.playerId,
        name: p.name,
        color: p.color as PlayerColor,
        avatarUrl: p.avatarUrl,
        value: val,
        score: sc,
        gap: Math.abs(stepIndex(val) - stepIndex(round.target as number)),
        isMe: p.playerId === conn.playerId,
      }
    })
  })

  function gapLabel(gap: number): string {
    return gap === 0 ? 'no alvo' : gap === 1 ? '1 casa' : `${gap} casas`
  }
</script>

<div class="round" role="region" aria-label="Rodada online">
  <!-- ── status bar: round / dono / group sintonia ── -->
  <div class="topline">
    <button class="back-btn" aria-label="Sair da sala" onclick={onLeave}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
           stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
    <div class="meta" aria-live="polite">
      <span class="rm-round">Rodada <b>{(round?.index ?? 0) + 1}</b></span>
      <span class="sep" aria-hidden="true"></span>
      <span class="rm-score">Sintonia <b>{groupScore}</b></span>
    </div>
    {#if dono}
      <span class="dono-chip" class:dono-chip--me={isDono}>
        <PlayerToken color={dono.color as PlayerColor} name={dono.name} size={22} />
        <span class="dono-name">{isDono ? 'Você descreve' : dono.name}</span>
      </span>
    {/if}
  </div>

  {#if card}
    <div class="card-dock">
      {#key round?.cardIndex}
        <Card left={card.left} right={card.right} leftColor={cardCol.lc} rightColor={cardCol.rc} />
      {/key}
    </div>
  {/if}

  <!-- ════════════════ DONO VIEW (guessing only; reveal is shared below) ════ -->
  {#if isDono && phase === 'guessing'}
      <Console>
        <div class="dono-head">
          <h2 class="dono-title">Você dá o POV</h2>
          <p class="dono-sub">Descreva a situação na chamada. Veja os palpites surgirem ao vivo.</p>
        </div>

        <!-- the secret target, only the Dono sees it -->
        <div class="screen mini-target">
          <Meter
            target={round?.target ?? 50}
            value={round?.target ?? 50}
            phase="reveal"
            decorative
            showTarget
            light={game.theme === 'light'}
            scaleLeft={card?.left}
            scaleRight={card?.right}
          />
          <span class="target-tag">o alvo · só você vê</span>
        </div>

        <div class="lockline" aria-live="polite">
          <span class="lockcount"><b>{lockedCount}</b> de <b>{guesserCount}</b> palpitaram</span>
          <div class="lockbar" aria-hidden="true">
            <div class="lockbar-fill" style:width="{guesserCount ? (lockedCount / guesserCount) * 100 : 0}%"></div>
          </div>
        </div>

        <!-- LIVE preview wall — one mini-dial per guesser, breathing in real time -->
        <div class="preview-grid" role="list" aria-label="Palpites ao vivo">
          {#each guesserList as p (p.playerId)}
            {@const g = guessByPlayer.get(p.playerId)}
            {@const ready = g?.locked ?? false}
            <div
              class="preview-cell"
              class:preview-cell--ready={ready}
              role="listitem"
              animate:flip={{ duration: 220 * D }}
              in:fly={{ y: 8 * D, duration: 200 * D }}
            >
              <div class="preview-dial">
                <Meter
                  decorative
                  phase="guessing"
                  light={game.theme === 'light'}
                  markers={g ? [{ p: g.value, color: `var(--pov-${p.color})` }] : []}
                />
              </div>
              <div class="preview-foot">
                <span class="preview-av">
                  {#if p.avatarUrl}
                    <img class="preview-photo" src={p.avatarUrl} alt="" style:outline-color={`var(--pov-${p.color})`} />
                  {:else}
                    <PlayerToken color={p.color as PlayerColor} name={p.name} size={26} />
                  {/if}
                </span>
                <span class="preview-name">{p.name}</span>
                <span class="badge" class:badge--ready={ready}>
                  {#if ready}
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
                    pronto
                  {:else}
                    pensando…
                  {/if}
                </span>
              </div>
            </div>
          {/each}
        </div>
      </Console>

  <!-- ════════════════ GUESSER VIEW ════════════════ -->
  {:else if phase === 'guessing'}
    <Console>
      <div class="screen">
        <Meter
          bind:value
          phase="guessing"
          light={game.theme === 'light'}
          scaleLeft={card?.left}
          scaleRight={card?.right}
          onCoverSettle={() => {}}
        />
      </div>

      <div class="guess-foot">
        <div class="lockline" aria-live="polite">
          <span class="lockcount"><b>{lockedCount}</b> de <b>{guesserCount}</b> palpitaram</span>
          <div class="lockbar" aria-hidden="true">
            <div class="lockbar-fill" style:width="{guesserCount ? (lockedCount / guesserCount) * 100 : 0}%"></div>
          </div>
        </div>

        {#if myLocked}
          <div class="locked-state" in:scale={{ start: 0.94, duration: 220 * D }}>
            <span class="locked-pill">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"
                   stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
              Travado
            </span>
            <p class="locked-hint">Arraste o ponteiro para mudar de ideia.</p>
          </div>
        {:else}
          <button class="cta cta-ready" onclick={lock} disabled={locking}>
            {locking ? 'Travando…' : 'Pronto'}
          </button>
        {/if}
      </div>
    </Console>

  <!-- ════════════════ REVEAL VIEW (both perspectives) ════════════════ -->
  {:else}
    <Console>
      <!-- suspense beat: dim veil + countdown -->
      {#if countdown > 0}
        <div class="suspense" aria-hidden="true">
          {#key countdown}
            <span class="count" in:scale={{ start: 1.5, duration: 280, opacity: 0 }}>{countdown}</span>
          {/key}
          <p class="suspense-label">Revelando…</p>
        </div>
      {/if}

      <div class="screen" class:dimmed={countdown > 0}>
        <Meter
          target={round?.target ?? 50}
          value={isDono ? (round?.target ?? 50) : (conn.myGuess?.value ?? 50)}
          phase="reveal"
          decorative
          showTarget={showResult}
          markers={showResult ? allMarkers : []}
          light={game.theme === 'light'}
          scaleLeft={card?.left}
          scaleRight={card?.right}
        />
      </div>

      {#if showResult}
        <!-- "you" line (guessers) -->
        {#if !isDono}
          <div class="you-result" style:--tier={tierVar(myScore)} in:fly={{ y: 10 * D, duration: 320 * D }}>
            <div class="you-chip"><span class="you-num">+{myScore}</span></div>
            <div class="you-text">
              <p class="you-phrase">{myPhrase}</p>
              <p class="you-pts">{myScore} pontos · {myGap === 0 ? 'no alvo' : `${gapLabel(myGap)} do alvo`}</p>
            </div>
          </div>
          <p class="sr-only" role="status" aria-live="polite" aria-atomic="true">
            Você: {myScore} pontos, {myGap === 0 ? 'no alvo' : `${gapLabel(myGap)} do alvo`}.
          </p>
        {:else}
          <div class="you-result you-result--dono" in:fly={{ y: 10 * D, duration: 320 * D }}>
            <p class="you-phrase">Resultado da sua dica</p>
            <p class="you-pts">O grupo somou +{resultRows.reduce((s, r) => s + r.score, 0)} pontos.</p>
          </div>
        {/if}

        <!-- dynamic results grid: one card per guesser -->
        <div class="results-grid" role="list" aria-label="Resultados da rodada">
          {#each resultRows as r, i (r.playerId)}
            <div
              class="result-cell"
              class:result-cell--me={r.isMe}
              style:--tier={tierVar(r.score)}
              role="listitem"
              in:fly={{ y: 12 * D, duration: 300 * D, delay: (reduce ? 0 : 60 + i * 70) }}
            >
              <div class="result-dial">
                <Meter
                  decorative
                  phase="reveal"
                  showTarget
                  target={round?.target ?? 50}
                  value={r.value}
                  light={game.theme === 'light'}
                  markers={[{ p: r.value, color: `var(--pov-${r.color})` }]}
                />
              </div>
              <div class="result-foot">
                <span class="result-av">
                  {#if r.avatarUrl}
                    <img class="result-photo" src={r.avatarUrl} alt="" style:outline-color={`var(--pov-${r.color})`} />
                  {:else}
                    <PlayerToken color={r.color} name={r.name} size={26} />
                  {/if}
                </span>
                <span class="result-name">{r.isMe ? 'você' : r.name}</span>
                <span class="result-score">+{r.score}<span class="result-gap"> · {gapLabel(r.gap)}</span></span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </Console>

    <!-- advance -->
    {#if showResult}
      <div class="advance" in:fly={{ y: 8 * D, duration: 280 * D, delay: reduce ? 0 : 120 }}>
        {#if conn.isHost}
          <button class="cta" onclick={next} disabled={advancing}>
            {advancing ? '…' : isLast ? 'Ver placar final' : 'Próxima rodada'}
          </button>
        {:else}
          <div class="waiting">
            <span class="pulse-dot" aria-hidden="true"></span>
            Aguardando o anfitrião…
          </div>
        {/if}
      </div>
    {/if}
  {/if}

  <!-- Dono's force-reveal lives in the footer during guessing -->
  {#if isDono && phase === 'guessing'}
    <div class="advance">
      <button class="cta cta-reveal" onclick={forceReveal} disabled={revealing || guesserCount === 0}>
        {revealing ? 'Revelando…' : 'Revelar agora'}
      </button>
      <p class="hint-sub">Revela mesmo que nem todos tenham travado.</p>
    </div>
  {/if}
</div>

<style>
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
  }

  .round {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-4);
    padding: var(--sp-4) var(--sp-4) var(--sp-7);
    -webkit-font-smoothing: antialiased;
  }
  .round :global(.console) { width: 100%; max-width: min(560px, 96vw); }

  /* ── topline ── */
  .topline {
    display: flex; align-items: center; gap: var(--sp-3);
    width: 100%; max-width: min(560px, 96vw);
  }
  .back-btn {
    display: grid; place-items: center; flex: none;
    width: 40px; height: 40px; border-radius: var(--r-2);
    background: var(--icon-bg); border: 1px solid var(--icon-border);
    color: var(--text); cursor: pointer;
    transition: filter 0.12s ease, transform 0.08s ease;
  }
  .back-btn:hover { filter: brightness(1.1); }
  .back-btn:active { transform: scale(0.93); }
  .back-btn:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .back-btn svg { width: 17px; height: 17px; }

  .meta {
    flex: 1; display: inline-flex; align-items: center; gap: var(--sp-3);
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); font-weight: 600;
    color: var(--text-soft);
    font-variant-numeric: tabular-nums lining-nums;
  }
  .meta b { color: var(--text); font-weight: 700; }
  .rm-score b { color: var(--pov-mostarda); }
  .sep { width: 1px; height: 0.95em; background: currentColor; opacity: 0.28; }

  .dono-chip {
    flex: none; display: inline-flex; align-items: center; gap: var(--sp-2);
    padding: 4px 10px 4px 4px; border-radius: 999px;
    background: var(--ctrl-track); border: 1px solid var(--ctrl-border);
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); font-weight: 600; color: var(--text-soft);
  }
  .dono-chip--me {
    color: var(--pov-mostarda);
    border-color: rgba(232, 178, 74, 0.4);
    background: rgba(232, 178, 74, 0.1);
  }
  .dono-name { white-space: nowrap; }

  /* ── card dock ── */
  .card-dock {
    display: flex; justify-content: center;
    padding: var(--sp-3) var(--sp-3) var(--sp-2);
    border-radius: var(--r-4);
    background: var(--dock-bg);
    box-shadow: var(--inset-well);
    width: fit-content; max-width: 96vw;
  }

  /* ── meter surfaces ── */
  .screen { border-radius: var(--r-4); position: relative; }
  .screen.dimmed { filter: brightness(0.5) saturate(0.7); transition: filter 0.3s ease; }
  .mini-target { display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); }
  .mini-target :global(.meter) { max-width: 320px; }
  .target-tag {
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); font-weight: 700;
    letter-spacing: var(--tracking-caps); text-transform: uppercase;
    color: var(--pov-mostarda);
  }

  /* ── dono head ── */
  .dono-head { text-align: center; margin-bottom: var(--sp-3); }
  .dono-title {
    margin: 0; font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: var(--fs-700); color: var(--text);
    text-wrap: balance;
  }
  .dono-sub {
    margin: var(--sp-1) 0 0; font-size: var(--fs-400);
    color: var(--text-soft); text-wrap: pretty; line-height: var(--lh-body);
  }

  /* ── lock progress ── */
  .lockline {
    display: flex; flex-direction: column; gap: var(--sp-2);
    margin: var(--sp-4) 0 var(--sp-3);
  }
  .lockcount {
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-400); font-weight: 600; color: var(--text-soft);
    font-variant-numeric: tabular-nums;
  }
  .lockcount b { color: var(--text); }
  .lockbar {
    height: 6px; border-radius: 999px; overflow: hidden;
    background: var(--ctrl-track); border: 1px solid var(--ctrl-border);
  }
  .lockbar-fill {
    height: 100%; border-radius: inherit;
    background: linear-gradient(90deg, var(--pov-menta), var(--pov-bullseye));
    transition: width 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }

  /* ── DONO preview wall ── */
  .preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--sp-3);
  }
  .preview-cell {
    display: flex; flex-direction: column; gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-2) var(--sp-3);
    border-radius: var(--r-4);
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
    transition: border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .preview-cell--ready {
    border-color: rgba(147, 207, 169, 0.5);
    box-shadow: 0 0 0 1px rgba(147, 207, 169, 0.3), 0 6px 16px -8px rgba(147, 207, 169, 0.5);
  }
  .preview-dial {
    border-radius: var(--r-3); overflow: hidden;
    background: var(--dock-bg);
    box-shadow: var(--inset-well);
    padding: var(--sp-1);
  }
  .preview-foot {
    display: flex; align-items: center; gap: var(--sp-2); min-width: 0;
  }
  .preview-av { flex: none; display: grid; place-items: center; }
  .preview-photo {
    width: 26px; height: 26px; border-radius: 50%; object-fit: cover;
    outline: 2px solid var(--pov-coral); outline-offset: 1px;
  }
  .preview-name {
    flex: 1; min-width: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; font-size: var(--fs-300); color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .badge {
    flex: none; display: inline-flex; align-items: center; gap: 3px;
    font-family: 'Space Grotesk', sans-serif;
    font-size: 9px; font-weight: 700;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 3px 7px; border-radius: 20px;
    color: var(--text-soft); background: rgba(255, 255, 255, 0.06);
  }
  .badge svg { width: 9px; height: 9px; }
  .badge--ready { color: var(--pov-menta); background: rgba(147, 207, 169, 0.14); }

  /* ── GUESSER footer ── */
  .guess-foot { display: flex; flex-direction: column; gap: var(--sp-3); margin-top: var(--sp-3); }
  .locked-state { display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); }
  .locked-pill {
    display: inline-flex; align-items: center; gap: var(--sp-2);
    min-height: 44px; padding: var(--sp-2) var(--sp-5);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700; font-size: var(--fs-500);
    color: var(--pov-menta);
    background: rgba(147, 207, 169, 0.12);
    border: 1px solid rgba(147, 207, 169, 0.45);
    border-radius: 999px;
  }
  .locked-pill svg { width: 18px; height: 18px; }
  .locked-hint {
    margin: 0; font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); color: var(--text-soft); text-align: center;
  }

  /* ── suspense beat ── */
  .suspense {
    position: absolute; inset: 0; z-index: 4;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: var(--sp-2); pointer-events: none;
  }
  .count {
    display: block;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: clamp(4rem, 18vw, 7rem); line-height: 1;
    color: var(--pov-mostarda);
    text-shadow: 0 4px 24px rgba(232, 178, 74, 0.5);
    font-variant-numeric: tabular-nums;
  }
  .suspense-label {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif; font-style: italic;
    font-size: var(--fs-500); color: var(--text); opacity: 0.9;
  }

  /* ── "you" result ── */
  .you-result {
    display: flex; align-items: center; justify-content: center; gap: var(--sp-3);
    margin: var(--sp-4) auto var(--sp-2);
    padding: var(--sp-3) var(--sp-4);
    width: fit-content; max-width: 96%;
    border-radius: var(--r-4);
    background: var(--result-bg); border: 1px solid var(--result-border);
    box-shadow: var(--elev-2);
  }
  .you-result--dono { flex-direction: column; gap: 2px; text-align: center; }
  .you-chip {
    flex: none; display: grid; place-items: center;
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--pov-offwhite);
    border: 3px solid var(--tier);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--tier) 18%, transparent),
                inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
  .you-num {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: 1.7rem; line-height: 1; color: var(--tier);
    font-variant-numeric: tabular-nums;
  }
  .you-text { display: flex; flex-direction: column; gap: 2px; }
  .you-phrase {
    margin: 0; font-family: 'Fraunces', Georgia, serif; font-style: italic;
    font-weight: 600; font-size: var(--fs-600); line-height: 1.1;
    color: var(--text); text-wrap: balance;
  }
  .you-pts {
    margin: 0; font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-400); font-weight: 600; color: var(--text-soft);
    font-variant-numeric: tabular-nums;
  }

  /* ── results grid ── */
  .results-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: var(--sp-3); margin-top: var(--sp-2);
  }
  .result-cell {
    display: flex; flex-direction: column; gap: var(--sp-2);
    padding: var(--sp-2) var(--sp-2) var(--sp-3);
    border-radius: var(--r-4);
    background: var(--ctrl-track); border: 1px solid var(--ctrl-border);
  }
  .result-cell--me {
    border-color: color-mix(in srgb, var(--tier) 55%, transparent);
    box-shadow: 0 0 0 1px color-mix(in srgb, var(--tier) 35%, transparent),
                0 8px 20px -10px color-mix(in srgb, var(--tier) 60%, transparent);
  }
  .result-dial {
    border-radius: var(--r-3); overflow: hidden;
    background: var(--dock-bg); box-shadow: var(--inset-well); padding: var(--sp-1);
  }
  .result-foot { display: flex; align-items: center; gap: var(--sp-2); min-width: 0; }
  .result-av { flex: none; display: grid; place-items: center; }
  .result-photo {
    width: 26px; height: 26px; border-radius: 50%; object-fit: cover;
    outline: 2px solid var(--pov-coral); outline-offset: 1px;
  }
  .result-name {
    flex: 1; min-width: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; font-size: var(--fs-300); color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .result-score {
    flex: none; font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: var(--fs-400); color: var(--tier);
    font-variant-numeric: tabular-nums;
  }
  .result-gap {
    font-family: 'Space Grotesk', sans-serif; font-weight: 600;
    font-size: 10px; color: var(--text-soft);
  }

  /* ── advance / CTA / waiting ── */
  .advance {
    display: flex; flex-direction: column; align-items: center; gap: var(--sp-2);
    width: 100%; max-width: min(560px, 96vw);
    margin-top: var(--sp-2);
  }
  .cta {
    appearance: none; border: none; cursor: pointer;
    width: 100%; min-height: 54px;
    padding: var(--sp-3) var(--sp-5);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700; font-size: var(--fs-600); color: #fff;
    background: var(--pov-coral-cta);
    border-radius: var(--r-4);
    border-bottom: 4px solid var(--pov-coral-lo);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 4px 14px -4px rgba(200, 65, 47, 0.5);
    transition: transform 80ms ease, box-shadow 80ms ease, border-bottom-width 80ms ease, filter 0.12s ease;
  }
  .cta:hover:not(:disabled) { filter: brightness(1.05); }
  .cta:active:not(:disabled) {
    transform: translateY(2px); border-bottom-width: 2px; border-bottom-color: var(--pov-coral-skirt);
  }
  .cta:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 3px; }
  .cta:disabled { opacity: 0.5; cursor: not-allowed; }

  /* "Pronto" reads as the affirmative action — teal, not coral */
  .cta-ready {
    background: var(--pov-bullseye);
    border-bottom-color: #154f63;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 4px 14px -4px rgba(31, 111, 139, 0.55);
  }
  .cta-ready:active:not(:disabled) { border-bottom-color: #0f3b4b; }
  .cta-reveal {
    background: var(--pov-mostarda); color: #2a1f06;
    border-bottom-color: #b6862f;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.3), 0 4px 14px -4px rgba(232, 178, 74, 0.55);
  }
  .cta-reveal:active:not(:disabled) { border-bottom-color: #9c7228; }

  .hint-sub {
    margin: 0; font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); color: var(--text-soft); text-align: center;
  }
  .waiting {
    display: flex; align-items: center; justify-content: center; gap: var(--sp-2);
    min-height: 54px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; font-size: var(--fs-500); color: var(--text-soft);
  }
  .pulse-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--pov-menta); animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }

  @media (prefers-reduced-motion: reduce) {
    .pulse-dot { animation: none; opacity: 0.8; }
    .lockbar-fill { transition: none; }
    .screen.dimmed { transition: none; }
  }
</style>
