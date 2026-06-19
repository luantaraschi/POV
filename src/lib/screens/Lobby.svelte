<script lang="ts">
  // Tela de entrada integrada do POV: herói (wordmark + tagline + roleta-playground) sobre o halo
  // cósmico, card de entrada (segmentado Local|Online), e rodapé de estúdio. O cluster de topo
  // (som/tema/perfil/como-jogar) é montado pelo Shell/TopBar — aqui cuidamos só do miolo.
  // Alvo visual: .superpowers/brainstorm/.../lobby-sinal-themes.html (mock aprovado).
  import { game } from '../game/store.svelte'
  import { getProfile } from '../online/identity'
  import { playerColors } from '../design/tokens'
  import { press, confirm } from '../audio/clicks'
  import CosmosBackdrop from '../lobby/CosmosBackdrop.svelte'
  import PlaygroundDial from '../lobby/PlaygroundDial.svelte'
  import ModeSwitch from '../lobby/ModeSwitch.svelte'
  import StudioFooter from '../ui/StudioFooter.svelte'

  // Modo selecionado no segmentado (controlado). Online é o destaque do mock.
  let mode = $state<'local' | 'online'>('online')

  // Perfil salvo (nome/cor) para a prévia no campo "Seu nome" do modo online.
  const profile = $derived(getProfile())
  const avatarColor = $derived(profile?.color ?? 'coral')
  const avatarHex = $derived(
    playerColors[avatarColor as keyof typeof playerColors] ?? playerColors.coral,
  )
  const profileName = $derived(profile?.name ?? 'Convidado')

  // Modo local → abre o Setup atual (defaults cravados no review do spec).
  function startLocal() {
    confirm()
    game.openSetup()
  }

  // Modo online → a tela online cuida de perfil/criar/entrar; aqui só roteamos para lá.
  function goOnline() {
    game.openOnline()
  }
</script>

<div class="lobby">
  <!-- ── Herói ──────────────────────────────────────────────────────────── -->
  <section class="hero">
    <CosmosBackdrop />
    <h1 class="wordmark">POV</h1>
    <p class="tagline">o jogo de ler a mente do grupo</p>
    <div class="dialwrap">
      <PlaygroundDial />
    </div>
  </section>

  <!-- ── Entrada ───────────────────────────────────────────────────────── -->
  <section class="entry" aria-label="Entrar no jogo">
    <ModeSwitch bind:value={mode} />

    {#if mode === 'local'}
      <p class="hint-line">Passe o aparelho entre amigos, na mesma sala.</p>
      <button type="button" class="cta" onclick={startLocal}>Começar</button>
    {:else}
      <span class="lbl">Seu nome</span>
      <button type="button" class="field name-field" onclick={goOnline}>
        <span
          class="av"
          style="background:{avatarHex}"
          aria-hidden="true"
        >
          {profileName.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <span class="name-text">{profileName}</span>
        <span class="swatch" style="background:{avatarHex}" aria-hidden="true"></span>
      </button>

      <span class="lbl">Código da sala</span>
      <button type="button" class="field code-field" onclick={goOnline}>
        <span class="code-text">— — — — —</span>
        <span class="hint">5 caracteres</span>
      </button>

      <div class="actions">
        <button type="button" class="cta" onclick={goOnline}>Criar sala</button>
        <button type="button" class="ghost" onclick={goOnline}>Entrar</button>
      </div>
    {/if}
  </section>

  <StudioFooter />
</div>

<style>
  .lobby {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    /* o saguão pinta o próprio --bone (base do token), independente do --bg-base do jogo */
    padding: 0 max(var(--sp-5), env(safe-area-inset-right)) max(var(--sp-4), env(safe-area-inset-bottom))
      max(var(--sp-5), env(safe-area-inset-left));
    color: var(--ink);
    position: relative;
    z-index: var(--z-hero, 1);
    /* saguão calmo: holofote quente sutil no topo + --bone (cobre o --bg-base do jogo) */
    background:
      radial-gradient(58% 42% at 50% 32%, #fffdf7 0%, rgba(255, 253, 247, 0) 60%),
      var(--bone);
  }
  :global(.theme-dark) .lobby {
    background:
      radial-gradient(58% 42% at 50% 30%, rgba(255, 233, 196, 0.1) 0%, rgba(255, 233, 196, 0) 55%),
      radial-gradient(120% 92% at 50% 28%, #18234e 0%, var(--bone) 62%);
  }

  /* ── Herói ── */
  .hero {
    flex: 1;
    min-height: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    position: relative;
    /* respiro: o cosmos vive aqui (absoluto), o conteúdo fica acima */
    padding: var(--sp-4) 0;
  }

  .wordmark {
    margin: 0;
    font-family: 'Clash Display', 'Space Grotesk', sans-serif;
    font-weight: 700;
    line-height: 0.9;
    letter-spacing: 0.01em;
    color: var(--ink);
    font-size: clamp(3rem, 11vw, 4.25rem); /* 48 → 68px */
    position: relative;
    z-index: var(--z-hero, 1);
  }

  .tagline {
    margin: 0 0 0.5rem;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-optical-sizing: auto;
    font-size: clamp(0.84rem, 2.6vw, 0.9375rem); /* ~13.5 → 15px */
    color: var(--ink-soft);
    position: relative;
    z-index: var(--z-hero, 1);
  }

  .dialwrap {
    margin-top: 0.25rem;
    width: 100%;
    max-width: clamp(240px, 70vw, 320px);
    position: relative;
    z-index: var(--z-hero, 1);
  }

  /* ── Card de entrada ── */
  .entry {
    width: 100%;
    max-width: 420px;
    background: var(--surface);
    border-radius: 22px;
    padding: 17px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    /* sombra dupla de produto (claro: sem borda, separação por sombra) */
    box-shadow:
      0 1px 2px rgba(27, 35, 80, 0.06),
      0 18px 40px -16px rgba(27, 35, 80, 0.2);
    position: relative;
    z-index: var(--z-hero, 1);
  }

  :global(.theme-dark) .entry {
    border: 1px solid rgba(255, 255, 255, 0.07);
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.3),
      0 18px 40px -16px rgba(0, 0, 0, 0.6);
  }

  .lbl {
    font-size: 0.65625rem; /* 10.5px */
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ink-soft);
    margin: 2px 0 -4px 3px;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600;
  }

  .hint-line {
    margin: 2px 0 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-optical-sizing: auto;
    font-size: 0.84rem;
    color: var(--ink-soft);
    text-align: center;
  }

  /* campos: recuo inset no tom --sunk; aqui são botões (atalho para a tela online) */
  .field {
    appearance: none;
    width: 100%;
    background: var(--sunk);
    border: none;
    border-radius: 13px;
    min-height: 46px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 13px;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 500;
    font-size: 0.9375rem; /* 15px */
    cursor: pointer;
    text-align: left;
    transition:
      box-shadow 160ms ease,
      transform 120ms ease;
  }
  .field:hover {
    box-shadow:
      inset 0 1px 2px rgba(0, 0, 0, 0.1),
      0 0 0 1.5px var(--hair);
  }
  .field:active {
    transform: translateY(1px);
  }
  .field:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 2px;
  }

  .av {
    display: grid;
    place-items: center;
    width: 27px;
    height: 27px;
    border-radius: 50%;
    flex: none;
    font-size: 0.75rem;
    font-weight: 700;
    color: #fff;
  }

  .name-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .swatch {
    width: 18px;
    height: 18px;
    border-radius: 6px;
    margin-left: auto;
    flex: none;
    box-shadow: 0 0 0 2px var(--surface) inset;
    border: 1px solid rgba(127, 127, 127, 0.25);
  }

  /* campo de código: monoespaçado técnico (Space Grotesk), tracking largo */
  .code-field {
    font-family: 'Space Grotesk', monospace;
    letter-spacing: 0.18em;
    font-weight: 600;
    font-size: 1.0625rem; /* ~17px */
  }
  .code-text {
    color: var(--ink-soft);
  }
  .code-field .hint {
    margin-left: auto;
    font-family: 'Inter', system-ui, sans-serif;
    letter-spacing: 0.04em;
    font-size: 0.65625rem; /* 10.5px */
    font-weight: 600;
    color: var(--ink-soft);
    background: var(--bone);
    padding: 4px 9px;
    border-radius: 999px;
  }
  :global(.theme-dark) .code-field .hint {
    background: rgba(255, 255, 255, 0.07);
  }

  .actions {
    display: flex;
    gap: 10px;
    margin-top: 3px;
  }

  /* CTA primário (--red): ação principal de entrada */
  .cta {
    appearance: none;
    flex: 1.3;
    min-height: 48px;
    border: none;
    border-radius: 14px;
    background: var(--red);
    color: #fff;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    box-shadow: 0 6px 16px -5px rgba(221, 59, 46, 0.5);
    transition:
      filter 160ms ease,
      box-shadow 160ms ease,
      transform 120ms ease;
  }
  .cta:hover {
    filter: brightness(1.05);
    box-shadow: 0 8px 20px -5px rgba(221, 59, 46, 0.6);
  }
  .cta:active {
    transform: translateY(1px);
  }
  .cta:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 3px;
  }

  /* botão secundário (contorno) */
  .ghost {
    appearance: none;
    flex: 1;
    min-height: 48px;
    border-radius: 14px;
    background: var(--surface);
    color: var(--ink);
    border: 1.5px solid rgba(27, 35, 80, 0.16);
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600;
    font-size: 0.9375rem;
    cursor: pointer;
    transition:
      border-color 160ms ease,
      transform 120ms ease;
  }
  :global(.theme-dark) .ghost {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.2);
  }
  .ghost:hover {
    border-color: var(--ink-soft);
  }
  .ghost:active {
    transform: translateY(1px);
  }
  .ghost:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    .field,
    .cta,
    .ghost {
      transition: none;
    }
  }

  /* ── Desktop: respiro maior, dial maior ── */
  @media (min-width: 720px) {
    .dialwrap {
      max-width: 320px;
    }
  }
</style>
