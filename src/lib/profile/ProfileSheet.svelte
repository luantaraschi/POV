<script lang="ts">
  // Perfil unificado (foto + cor + nome) — serve tanto o chip do lobby quanto as salas online.
  // Reusa a identidade local (getProfile/saveProfile, localStorage 'pov-profile') e o upload de
  // foto do Convex (files.generateUploadUrl). A foto vai pro storage; o storageId é persistido no
  // perfil local e reaproveitado quando o jogador cria/entra numa sala (createRoom/joinRoom).
  import Sheet from '../ui/Sheet.svelte'
  import { useMutation } from 'convex-svelte'
  import { api } from '../../../convex/_generated/api'
  import { game, type PlayerColor } from '../game/store.svelte'
  import { getProfile, saveProfile } from '../online/identity'
  import { playerColors } from '../design/tokens'
  import { press, confirm } from '../audio/clicks'

  type Props = { open: boolean; onClose: () => void }
  let { open, onClose }: Props = $props()

  // Ordem das cores de identidade (8 nomes canônicos, hex retrô em tokens.ts).
  const COLOR_ORDER: PlayerColor[] = [
    'coral', 'piscina', 'lilas', 'menta', 'mostarda', 'rosa', 'laranja', 'petroleo',
  ]

  // Upload de foto: a mutation usa o singleton de cliente Convex (funciona fora de uma sala).
  const mGenerateUploadUrl = useMutation(api.files.generateUploadUrl)

  // Estado do formulário — re-semeado a cada abertura para refletir o perfil salvo.
  let name = $state('')
  let color = $state<PlayerColor>('coral')
  let avatarStorageId = $state<string | null>(null)

  // Prévia local da foto escolhida (revogada ao trocar/desmontar). Quando há storageId mas sem
  // prévia local (perfil carregado do disco), caímos no token de iniciais — a exibição com URL do
  // storage só acontece nas telas online (que têm o getUrl da sala).
  let avatarPreview = $state<string | null>(null)
  let uploading = $state(false)
  let uploadError = $state<string | null>(null)

  let fileInput = $state<HTMLInputElement | null>(null)

  const trimmed = $derived(name.trim())
  const canSave = $derived(trimmed.length > 0)
  const colorHex = $derived(playerColors[color] ?? playerColors.coral)
  const initial = $derived((trimmed[0] || '?').toUpperCase())

  // (Re)semeia o formulário sempre que o sheet abre.
  $effect(() => {
    if (!open) return
    const saved = getProfile()
    name = saved?.name ?? ''
    color = saved?.color ?? 'coral'
    avatarStorageId = saved?.avatarStorageId ?? null
    if (avatarPreview) { URL.revokeObjectURL(avatarPreview); avatarPreview = null }
    uploadError = null
  })

  // Limpa a object-URL ao desmontar.
  $effect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview) })

  // Cor da inicial por luminância (ink sobre a cor) — espelha PlayerToken.ink().
  function ink(h: string): string {
    const lum = (hex: string) => {
      const s = hex.replace('#', '')
      const ch = (i: number) => parseInt(s.slice(i, i + 2), 16) / 255
      const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))
      return 0.2126 * lin(ch(0)) + 0.7152 * lin(ch(2)) + 0.0722 * lin(ch(4))
    }
    const bg = lum(h)
    const ratio = (fg: number) => { const a = Math.max(bg, fg) + 0.05, b = Math.min(bg, fg) + 0.05; return a / b }
    const LIGHT = '#f7f1e3', DARK = '#0a1320'
    return ratio(lum(LIGHT)) >= ratio(lum(DARK)) ? LIGHT : DARK
  }
  const inkOnColor = $derived(ink(colorHex))

  function pickColor(c: PlayerColor) {
    if (c === color) return
    press()
    color = c
  }

  async function onFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    uploadError = null

    // Prévia instantânea enquanto sobe.
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    avatarPreview = URL.createObjectURL(file)

    uploading = true
    try {
      const url = await mGenerateUploadUrl({})
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!res.ok) throw new Error('upload falhou')
      const { storageId } = (await res.json()) as { storageId: string }
      avatarStorageId = storageId
      confirm()
    } catch {
      uploadError = 'Não deu para enviar a foto. Tente outra.'
      if (avatarPreview) { URL.revokeObjectURL(avatarPreview); avatarPreview = null }
      avatarStorageId = getProfile()?.avatarStorageId ?? null
    } finally {
      uploading = false
      if (fileInput) fileInput.value = '' // re-escolher o mesmo arquivo dispara change de novo
    }
  }

  function save() {
    if (!canSave) return
    confirm()
    saveProfile({ name: trimmed, color, avatarStorageId })
    game.bumpProfile() // notifica chip do TopBar / prévia do Lobby
    onClose()
  }
</script>

<Sheet {open} {onClose} ariaLabel="Seu perfil" variant="sheet">
  <h2 class="title">Seu perfil</h2>
  <p class="sub">É assim que o resto da sala vai te ver.</p>

  <div class="form">
    <!-- Prévia -->
    <div class="preview">
      {#if avatarPreview}
        <img class="preview-photo" src={avatarPreview} alt="" style:outline-color={colorHex} />
      {:else}
        <span
          class="preview-token"
          style:background={colorHex}
          style:color={inkOnColor}
          style:outline-color={colorHex}
          aria-hidden="true"
        >{initial}</span>
      {/if}
      <span class="preview-name">{trimmed || 'Sem nome'}</span>
    </div>

    <!-- Nome -->
    <div class="field">
      <label class="lbl" for="profile-name">Seu nome</label>
      <input
        id="profile-name"
        class="name-input"
        type="text"
        bind:value={name}
        placeholder="Ex.: Ana"
        maxlength={24}
        autocomplete="off"
        enterkeyhint="done"
        onkeydown={(e) => { if (e.key === 'Enter') save() }}
      />
    </div>

    <!-- Cor -->
    <div class="field">
      <span class="lbl">Sua cor</span>
      <div class="swatches" role="radiogroup" aria-label="Sua cor">
        {#each COLOR_ORDER as c (c)}
          <button
            type="button"
            class="swatch"
            class:on={color === c}
            role="radio"
            aria-checked={color === c}
            aria-label={c}
            style:--sw={playerColors[c]}
            onclick={() => pickColor(c)}
          ></button>
        {/each}
      </div>
    </div>

    <!-- Foto (opcional) -->
    <div class="field">
      <span class="lbl">Foto <span class="optional">opcional</span></span>
      <input
        class="sr-only"
        type="file"
        accept="image/*"
        bind:this={fileInput}
        onchange={onFileChange}
      />
      <button
        type="button"
        class="photo-btn"
        onclick={() => { press(); fileInput?.click() }}
        disabled={uploading}
      >
        {#if uploading}
          <span class="spinner" aria-hidden="true"></span> Enviando…
        {:else if avatarStorageId || avatarPreview}
          Trocar foto
        {:else}
          Adicionar uma foto
        {/if}
      </button>
      {#if uploadError}
        <p class="upload-error" role="alert">{uploadError}</p>
      {/if}
    </div>

    <button type="button" class="cta" disabled={!canSave} onclick={save}>Pronto</button>
  </div>
</Sheet>

<style>
  .title {
    font-family: 'Clash Display', 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: var(--fs-700);
    color: var(--ink);
    margin: 0;
    line-height: var(--lh-tight);
  }
  .sub {
    margin: 4px 0 var(--sp-4);
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-weight: 500;
    font-optical-sizing: auto;
    font-size: var(--fs-400);
    color: var(--ink-soft);
  }

  .form { display: flex; flex-direction: column; gap: var(--sp-4); }

  /* Prévia */
  .preview { display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); }
  .preview-photo,
  .preview-token {
    width: 64px; height: 64px; border-radius: 50%;
    outline: 4px solid var(--coral);
    outline-offset: 2px;
  }
  .preview-photo { object-fit: cover; }
  .preview-token {
    display: grid; place-items: center;
    font-family: 'Clash Display', 'Space Grotesk', sans-serif;
    font-weight: 700; font-size: 1.75rem; line-height: 1;
  }
  .preview-name {
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600; font-size: var(--fs-500); color: var(--ink);
  }

  .field { display: flex; flex-direction: column; gap: var(--sp-2); }

  .lbl {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.65625rem; /* 10.5px */
    font-weight: 600;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--ink-soft);
  }
  .optional {
    margin-left: 6px; letter-spacing: 0.08em;
    color: var(--ink-soft); opacity: 0.7; font-weight: 600;
  }

  .name-input {
    background: var(--sunk);
    border: none;
    border-radius: 13px;
    padding: var(--sp-3);
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 500; font-size: 0.9375rem;
    color: var(--ink); outline: none;
    transition: box-shadow 160ms ease;
  }
  .name-input::placeholder { color: var(--ink-soft); opacity: 0.7; }
  .name-input:focus-visible {
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1), 0 0 0 2px var(--mustard);
  }

  /* Swatches */
  .swatches { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .swatch {
    width: 38px; height: 38px; border-radius: 50%;
    background: var(--sw);
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
    transition: transform 120ms ease, box-shadow 160ms ease;
  }
  .swatch:hover { transform: scale(1.08); }
  .swatch:active { transform: scale(0.95); }
  .swatch:focus-visible { outline: 3px solid var(--mustard); outline-offset: 2px; }
  .swatch.on {
    box-shadow:
      0 0 0 2px var(--surface),
      0 0 0 4px var(--sw),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  /* Botão de foto */
  .photo-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-2);
    align-self: flex-start;
    min-height: 44px;
    padding: var(--sp-2) var(--sp-4);
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600; font-size: var(--fs-400);
    color: var(--ink);
    background: var(--sunk);
    border: 1px dashed var(--hair);
    border-radius: 13px;
    cursor: pointer;
    transition: border-color 160ms ease;
  }
  .photo-btn:hover:not(:disabled) { border-color: var(--ink-soft); }
  .photo-btn:focus-visible { outline: 3px solid var(--mustard); outline-offset: 2px; }
  .photo-btn:disabled { opacity: 0.6; cursor: progress; }

  .spinner {
    width: 14px; height: 14px;
    border-radius: 50%;
    border: 2px solid color-mix(in srgb, var(--ink) 25%, transparent);
    border-top-color: var(--ink);
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .upload-error {
    margin: 0;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: var(--fs-300); color: var(--red);
  }

  /* CTA primário (--red) — espelha o lobby */
  .cta {
    appearance: none; border: none; cursor: pointer;
    width: 100%; min-height: 48px; margin-top: var(--sp-1);
    border-radius: 14px;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600; font-size: 0.9375rem; color: #fff;
    background: var(--red);
    box-shadow: 0 6px 16px -5px rgba(221, 59, 46, 0.5);
    transition: filter 160ms ease, box-shadow 160ms ease, transform 120ms ease;
  }
  .cta:hover:not(:disabled) {
    filter: brightness(1.05);
    box-shadow: 0 8px 20px -5px rgba(221, 59, 46, 0.6);
  }
  .cta:active:not(:disabled) { transform: translateY(1px); }
  .cta:focus-visible { outline: 3px solid var(--mustard); outline-offset: 3px; }
  .cta:disabled { opacity: 0.45; cursor: not-allowed; }

  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    .swatch, .name-input, .photo-btn, .cta { transition: none; }
    .spinner { animation-duration: 1.4s; }
  }
</style>
