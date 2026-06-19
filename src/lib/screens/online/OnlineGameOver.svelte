<script lang="ts">
  import PlayerToken from '../../ui/PlayerToken.svelte'
  import { selo, sintoniaPct } from '../../game/rules'
  import { palette } from '../../design/tokens'
  import { press, celebrate, unlockAudio } from '../../audio/clicks'
  import { game, type PlayerColor } from '../../game/store.svelte'
  import type { RoomConnection } from '../../online/room.svelte'
  import { fly } from 'svelte/transition'

  type Props = { conn: RoomConnection; onLeave: () => void }
  let { conn, onLeave }: Props = $props()

  // ── reduced motion ──
  let reduce = $state(false)
  $effect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduce = mq.matches
    const on = () => (reduce = mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  })
  const D = $derived(reduce ? 0 : 1)

  // ── derived score / seal ──
  const room = $derived(conn.room)
  const players = $derived(conn.players)
  const groupScore = $derived(room?.groupScore ?? 0)
  // maxTotal = voltas * players * 4 (each guesser can score up to 4 per round;
  // mirrors the room's total = voltas*players rounds × 4 group points/round).
  const maxTotal = $derived((room?.voltas ?? 1) * players.length * 4)
  const pct = $derived(sintoniaPct(groupScore, maxTotal))
  const seal = $derived(selo(pct))

  // ── celebrate once ──
  let celebrated = $state(false)
  $effect(() => {
    if (!reduce && !celebrated) {
      celebrated = true
      celebrate()
    }
  })

  // ── confetti + bloom (same palette as local GameOver) ──
  const bloomRings = [
    { r: 32, c: palette.bullseye },
    { r: 50, c: palette.menta },
    { r: 68, c: palette.mostarda },
    { r: 86, c: palette.coral },
    { r: 104, c: palette.lilas },
  ]
  const confettiDots = Array.from({ length: 24 }, (_, i) => {
    const ang = (i / 24) * Math.PI * 2
    return {
      dx: Math.cos(ang),
      dy: Math.sin(ang) - 0.3,
      c: [palette.bullseye, palette.mostarda, palette.coral, palette.menta, palette.lilas][i % 5],
      delay: (i % 7) * 0.025,
      r: 5 + (i % 4) * 2,
    }
  })

  // ── actions ──
  let restarting = $state(false)
  async function playAgain() {
    if (restarting) return
    unlockAudio()
    press()
    restarting = true
    try {
      await conn.restartGame() // host-only; room.status flips to 'lobby' → shell re-routes
    } finally {
      restarting = false
    }
  }
  function leave() {
    press()
    onLeave()
  }
</script>

<p class="sr-only" aria-live="polite">
  Fim de jogo. {seal}. {groupScore} de {maxTotal} pontos, {pct}% de sintonia.
</p>

<div class="sunburst" aria-hidden="true"></div>
<div class="scrim" aria-hidden="true"></div>

<div class="poster">
  <p class="eyebrow" aria-hidden="true">Fim de jogo · sala online</p>

  <div class="emblem-wrap" in:fly={{ y: 14 * D, duration: 360 * D }}>
    <svg class="emblem-svg" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="94" fill="none" stroke={palette.coral}    stroke-width="7" />
      <circle cx="100" cy="100" r="80" fill="none" stroke={palette.mostarda} stroke-width="7" />
      <circle cx="100" cy="100" r="66" fill="none" stroke={palette.menta}    stroke-width="7" />
      <circle cx="100" cy="100" r="52" fill="none" stroke={palette.piscina}  stroke-width="7" />
      <circle cx="100" cy="100" r="43" fill={palette.creme} />
    </svg>
    <div class="emblem-score" aria-label="{groupScore} de {maxTotal} pontos">
      <span class="score-num">{groupScore}</span>
      <span class="score-denom">de {maxTotal}</span>
    </div>
  </div>

  <div class="seal-block" in:fly={{ y: 12 * D, duration: 360 * D, delay: reduce ? 0 : 90 }}>
    <h1 class="seal-name">{seal}</h1>
    <p class="seal-sub">{pct}% de sintonia · {players.length} jogadores</p>
  </div>

  <!-- full player list -->
  <ul class="players" role="list" in:fly={{ y: 10 * D, duration: 340 * D, delay: reduce ? 0 : 170 }}>
    {#each players as p (p.playerId)}
      <li class="player" role="listitem">
        <span class="player-av">
          {#if p.avatarUrl}
            <img class="player-photo" src={p.avatarUrl} alt="" style:outline-color={`var(--pov-${p.color})`} />
          {:else}
            <PlayerToken color={p.color as PlayerColor} name={p.name} size={28} />
          {/if}
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
</div>

<footer class="cta-footer">
  {#if conn.isHost}
    <button class="btn-primary" onclick={playAgain} disabled={restarting} aria-label="Jogar de novo na mesma sala">
      {restarting ? 'Reabrindo sala…' : 'Jogar de novo'}
    </button>
  {:else}
    <div class="waiting">
      <span class="pulse-dot" aria-hidden="true"></span>
      Aguardando o anfitrião reabrir a sala…
    </div>
  {/if}
  <button class="btn-ghost" onclick={leave} aria-label="Sair da sala e voltar ao início">Sair</button>
</footer>

{#if !reduce}
  <svg class="bloom" viewBox="-120 -120 240 240" aria-hidden="true">
    {#each bloomRings as br}
      <circle r={br.r} fill="none" stroke={br.c} stroke-width="6" />
    {/each}
  </svg>
  <div class="confetti" aria-hidden="true">
    {#each confettiDots as d}
      <span style="--dx:{d.dx};--dy:{d.dy};--c:{d.c};--delay:{d.delay}s;--r:{d.r}px"></span>
    {/each}
  </div>
{/if}

<style>
  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;
  }

  .sunburst {
    position: absolute; left: 50%; top: -10%;
    width: 820px; height: 820px; transform: translateX(-50%);
    background: conic-gradient(
      from 200deg at 50% 100%,
      #e25744, #e57a37, #e8b24a, #93cfa9, #4ea7c4, #b3a0dd, #e7aebf, #e25744
    );
    -webkit-mask: radial-gradient(circle at 50% 100%, #000 0%, rgba(0,0,0,.55) 42%, transparent 68%);
    mask: radial-gradient(circle at 50% 100%, #000 0%, rgba(0,0,0,.55) 42%, transparent 68%);
    opacity: 0.52; z-index: 0; pointer-events: none;
  }
  .scrim {
    position: absolute; inset: 0; z-index: 0; pointer-events: none;
    background: radial-gradient(
      ellipse 72% 56% at 50% 48%,
      rgba(22, 41, 78, 0.78) 0%, rgba(22, 41, 78, 0.52) 52%, transparent 100%
    );
  }

  .poster {
    position: relative; z-index: 1; flex: 1;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: var(--sp-3);
    padding: var(--sp-6) var(--sp-4) var(--sp-4); text-align: center;
    -webkit-font-smoothing: antialiased;
  }
  .eyebrow {
    margin: 0; font-family: 'Space Grotesk', system-ui, sans-serif;
    font-size: 0.625rem; font-weight: 700; letter-spacing: 0.24em;
    text-transform: uppercase; color: var(--pov-menta, #93cfa9);
  }

  .emblem-wrap { position: relative; width: 192px; height: 192px; margin: var(--sp-2) 0; flex: none; }
  .emblem-svg { width: 100%; height: 100%; filter: drop-shadow(0 12px 28px rgba(0, 0, 0, 0.45)); }
  .emblem-score {
    position: absolute; inset: 0; display: flex; flex-direction: column;
    align-items: center; justify-content: center; pointer-events: none;
  }
  .score-num {
    font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800; font-size: 3rem; line-height: 0.9; color: #16294e;
    font-variant-numeric: tabular-nums lining-nums;
  }
  .score-denom {
    font-family: 'Space Grotesk', system-ui, sans-serif;
    font-weight: 700; font-size: 0.8125rem; color: #5a6b86; margin-top: 2px;
  }

  .seal-block { display: flex; flex-direction: column; gap: var(--sp-1); }
  .seal-name {
    margin: 0; font-family: 'Bricolage Grotesque', system-ui, sans-serif;
    font-weight: 800; font-size: 2.125rem; line-height: 1.05; color: var(--text, #f7f1e3);
    text-wrap: balance;
  }
  .seal-sub {
    margin: 0; font-family: 'Fraunces', Georgia, serif; font-style: italic;
    font-weight: 500; font-size: 0.9375rem; color: rgba(241, 230, 203, 0.82);
  }

  /* ── player list ── */
  .players {
    list-style: none; margin: var(--sp-3) 0 0; padding: 0;
    display: flex; flex-direction: column; gap: var(--sp-2);
    width: min(360px, 92vw);
  }
  .player {
    display: flex; align-items: center; gap: var(--sp-3);
    padding: var(--sp-2) var(--sp-3);
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: var(--r-3);
  }
  .player-av { flex: none; display: grid; place-items: center; }
  .player-photo {
    width: 28px; height: 28px; border-radius: 50%; object-fit: cover;
    outline: 2px solid var(--pov-coral); outline-offset: 1px;
  }
  .player-name {
    flex: 1; min-width: 0; text-align: left;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; font-size: var(--fs-400); color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .host-tag, .you-tag {
    flex: none; font-family: 'Space Grotesk', sans-serif;
    font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 3px 7px; border-radius: 20px;
  }
  .host-tag { color: var(--pov-mostarda); background: rgba(232, 178, 74, 0.12); }
  .you-tag { color: var(--text-soft); background: rgba(255, 255, 255, 0.06); }

  /* ── footer CTAs ── */
  .cta-footer {
    position: sticky; bottom: 0; z-index: 5;
    display: flex; flex-direction: column; gap: var(--sp-3); width: 100%;
    padding: var(--sp-4) max(var(--sp-4), env(safe-area-inset-right))
      max(var(--sp-5), env(safe-area-inset-bottom)) max(var(--sp-4), env(safe-area-inset-left));
    background: linear-gradient(0deg, var(--footer-grad, rgba(12, 28, 57, 0.96)) 60%, transparent);
    backdrop-filter: blur(6px);
  }
  .btn-primary {
    border: 0; cursor: pointer; width: min(440px, 100%); align-self: center;
    min-height: 48px; border-radius: var(--r-4, 16px); padding: var(--sp-3) var(--sp-5);
    font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: var(--fs-600, 1.125rem);
    color: #fff; letter-spacing: 0.01em; background: var(--pov-coral-cta, #d4452f);
    border-bottom: 4px solid var(--pov-coral-lo, #a8302a);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.18), 0 4px 14px -4px rgba(200, 65, 47, 0.5);
    transition: transform 0.07s ease, box-shadow 0.08s ease, border-bottom-width 0.07s ease, filter 0.12s ease;
  }
  .btn-primary:hover:not(:disabled) { filter: brightness(1.05); }
  .btn-primary:active:not(:disabled) {
    transform: translateY(2px); border-bottom-width: 2px;
  }
  .btn-primary:focus-visible { outline: 3px solid var(--pov-mostarda, #e8b24a); outline-offset: 3px; }
  .btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

  .btn-ghost {
    border: 1px solid rgba(255, 255, 255, 0.12); cursor: pointer;
    width: min(440px, 100%); align-self: center; min-height: 48px;
    border-radius: var(--r-4, 14px); padding: var(--sp-3) var(--sp-4);
    font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: var(--fs-400, 0.875rem);
    color: rgba(241, 230, 203, 0.75); background: rgba(255, 255, 255, 0.06);
    transition: background 0.12s ease, color 0.12s ease, transform 0.08s ease;
  }
  .btn-ghost:hover { background: rgba(255, 255, 255, 0.1); color: rgba(241, 230, 203, 0.92); }
  .btn-ghost:active { transform: scale(0.98); }
  .btn-ghost:focus-visible { outline: 3px solid var(--pov-mostarda, #e8b24a); outline-offset: 3px; }

  .waiting {
    display: flex; align-items: center; justify-content: center; gap: var(--sp-2);
    min-height: 48px; align-self: center;
    font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: var(--fs-400); color: var(--text-soft);
  }
  .pulse-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--pov-menta); animation: pulse 1.4s ease-in-out infinite;
  }
  @keyframes pulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }

  /* ── bloom + confetti ── */
  .bloom {
    position: absolute; left: 50%; top: 38%; width: 360px; height: 360px;
    z-index: 6; pointer-events: none; transform: translate(-50%, -50%);
    animation: bloom-out 1s cubic-bezier(0.15, 0.7, 0.3, 1) both;
  }
  @keyframes bloom-out {
    0% { transform: translate(-50%, -50%) scale(0.18); opacity: 0; }
    16% { opacity: 0.88; }
    100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
  }
  .confetti { position: absolute; inset: 0; z-index: 7; pointer-events: none; }
  .confetti span {
    position: absolute; left: 50%; top: 38%; width: var(--r); height: var(--r);
    border-radius: 50%; background: var(--c);
    animation: confetti-fly 0.9s cubic-bezier(0.15, 0.65, 0.28, 1) var(--delay) forwards;
  }
  @keyframes confetti-fly {
    0% { transform: translate(-50%, -50%) scale(0.4); opacity: 0; }
    15% { opacity: 1; }
    100% { transform: translate(calc(-50% + var(--dx) * 210px), calc(-50% + var(--dy) * 210px + 160px)) scale(1); opacity: 0; }
  }

  @media (min-width: 900px) {
    .sunburst { width: 1200px; height: 1200px; top: -14%; opacity: 0.48; }
    .emblem-wrap { width: 228px; height: 228px; }
    .score-num { font-size: 3.5rem; }
    .seal-name { font-size: 2.625rem; }
    .seal-sub { font-size: 1.0625rem; }
    .poster { gap: var(--sp-4); }
  }

  @media (prefers-reduced-motion: reduce) {
    .bloom, .confetti span { animation: none; display: none; }
    .pulse-dot { animation: none; opacity: 0.8; }
  }
</style>
