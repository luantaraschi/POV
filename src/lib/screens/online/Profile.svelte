<script lang="ts">
  import PlayerToken from '../../ui/PlayerToken.svelte'
  import Console from '../../ui/Console.svelte'
  import { game, type PlayerColor } from '../../game/store.svelte'
  import { getProfile, saveProfile } from '../../online/identity'
  import type { RoomConnection } from '../../online/room.svelte'
  import { press, confirm } from '../../audio/clicks'

  type Props = {
    conn: RoomConnection
    onContinue: () => void
    onBack: () => void
  }
  let { conn, onContinue, onBack }: Props = $props()

  const COLOR_ORDER: PlayerColor[] = [
    'coral', 'piscina', 'lilas', 'menta', 'mostarda', 'rosa', 'laranja', 'petroleo',
  ]

  // Seed from any saved profile (lets users edit later).
  const saved = getProfile()
  let name = $state(saved?.name ?? '')
  let color = $state<PlayerColor>(saved?.color ?? 'coral')
  let avatarStorageId = $state<string | null>(saved?.avatarStorageId ?? null)

  // Local preview URL for the chosen photo (revoked on replace/unmount).
  let avatarPreview = $state<string | null>(null)
  let uploading = $state(false)
  let uploadError = $state<string | null>(null)

  const canContinue = $derived(name.trim().length > 0)

  let fileInput = $state<HTMLInputElement | null>(null)

  async function onFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    uploadError = null

    // Show an instant local preview while we upload.
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    avatarPreview = URL.createObjectURL(file)

    uploading = true
    try {
      const url = await conn.generateUploadUrl()
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
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
        avatarPreview = null
      }
      avatarStorageId = saved?.avatarStorageId ?? null
    } finally {
      uploading = false
      // reset so re-picking the same file fires change again
      if (fileInput) fileInput.value = ''
    }
  }

  $effect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    }
  })

  function pickColor(c: PlayerColor) {
    press()
    color = c
  }

  function handleContinue() {
    if (!canContinue) return
    confirm()
    saveProfile({ name: name.trim(), color, avatarStorageId })
    onContinue()
  }
</script>

<div class="profile">
  <div class="profile-col">

    <div class="profile-header">
      <button class="back-btn" aria-label="Voltar" onclick={() => { press(); onBack() }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
      <div class="title-block">
        <h1 class="profile-title">Quem é você?</h1>
        <p class="profile-sub">É assim que o resto da sala vai te ver.</p>
      </div>
    </div>

    <Console>
      <div class="form">

        <!-- Live preview -->
        <div class="preview">
          {#if avatarPreview || avatarStorageId}
            <img
              class="preview-photo"
              src={avatarPreview ?? ''}
              alt=""
              style:outline-color={`var(--pov-${color})`}
            />
          {:else}
            <PlayerToken {color} name={name || '?'} size={64} ring />
          {/if}
          <span class="preview-name">{name.trim() || 'Sem nome'}</span>
        </div>

        <!-- Name -->
        <div class="field">
          <label class="section-label" for="profile-name">Seu nome</label>
          <input
            id="profile-name"
            class="name-input"
            type="text"
            bind:value={name}
            placeholder="Ex.: Ana"
            maxlength={24}
            autocomplete="off"
            enterkeyhint="done"
            onkeydown={(e) => { if (e.key === 'Enter') handleContinue() }}
          />
        </div>

        <!-- Color -->
        <div class="field">
          <span class="section-label">Sua cor</span>
          <div class="swatches" role="radiogroup" aria-label="Sua cor">
            {#each COLOR_ORDER as c (c)}
              <button
                class="swatch"
                class:swatch--active={color === c}
                role="radio"
                aria-checked={color === c}
                aria-label={c}
                style:--sw={`var(--pov-${c})`}
                onclick={() => pickColor(c)}
              ></button>
            {/each}
          </div>
        </div>

        <!-- Photo (optional) -->
        <div class="field">
          <span class="section-label">Foto <span class="optional">opcional</span></span>
          <input
            class="sr-only"
            type="file"
            accept="image/*"
            bind:this={fileInput}
            onchange={onFileChange}
          />
          <button
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

        <button class="cta" disabled={!canContinue} onclick={handleContinue}>
          Continuar
        </button>

      </div>
    </Console>

  </div>
</div>

<style>
  .profile {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--sp-5) var(--sp-4) var(--sp-7);
  }
  .profile-col {
    display: flex;
    flex-direction: column;
    gap: var(--sp-5);
    width: 100%;
    max-width: min(480px, 92vw);
  }
  .profile-col :global(.console) { width: 100%; }

  .profile-header { display: flex; align-items: center; gap: var(--sp-3); }
  .back-btn {
    display: grid; place-items: center;
    width: 44px; height: 44px;
    border-radius: var(--r-2);
    background: var(--icon-bg);
    border: 1px solid var(--icon-border);
    color: var(--text); cursor: pointer; flex: none;
    transition: filter 0.12s ease, transform 0.08s ease;
  }
  .back-btn:hover { filter: brightness(1.1); }
  .back-btn:active { transform: scale(0.93); }
  .back-btn:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .back-btn svg { width: 18px; height: 18px; }

  .title-block { display: flex; flex-direction: column; gap: 2px; }
  .profile-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800; font-size: var(--fs-700);
    color: var(--text); line-height: var(--lh-tight);
  }
  .profile-sub {
    margin: 0;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic; font-weight: 500;
    font-size: var(--fs-400); color: var(--text-soft);
    line-height: var(--lh-body); font-optical-sizing: auto;
  }

  .form { display: flex; flex-direction: column; gap: var(--sp-4); }

  /* Preview */
  .preview { display: flex; flex-direction: column; align-items: center; gap: var(--sp-2); }
  .preview-photo {
    width: 64px; height: 64px; border-radius: 50%;
    object-fit: cover;
    outline: 4px solid var(--pov-coral);
    outline-offset: 2px;
  }
  .preview-name {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700; font-size: var(--fs-500); color: var(--text);
  }

  .field { display: flex; flex-direction: column; gap: var(--sp-2); }

  .section-label {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 10px; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    color: #8aa0c8;
  }
  .optional {
    margin-left: 6px; letter-spacing: 0.08em;
    color: var(--text-soft); opacity: 0.7; font-weight: 600;
  }

  .name-input {
    background: var(--ctrl-track);
    border: 1px solid var(--ctrl-border);
    border-radius: var(--r-3);
    padding: var(--sp-3);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; font-size: var(--fs-500);
    color: var(--text); outline: none;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }
  .name-input::placeholder { color: var(--text-soft); opacity: 0.7; }
  .name-input:focus { border-color: rgba(255, 255, 255, 0.25); box-shadow: 0 0 0 2px rgba(232, 178, 74, 0.3); }

  /* Swatches */
  .swatches { display: flex; flex-wrap: wrap; gap: var(--sp-2); }
  .swatch {
    width: 38px; height: 38px; border-radius: 50%;
    background: var(--sw);
    border: 2px solid transparent;
    cursor: pointer;
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.25);
    transition: transform 0.1s ease, box-shadow 0.12s ease;
  }
  .swatch:hover { transform: scale(1.08); }
  .swatch:active { transform: scale(0.95); }
  .swatch:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .swatch--active {
    box-shadow:
      0 0 0 2px var(--bg-base),
      0 0 0 4px var(--sw),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  /* Photo button */
  .photo-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: var(--sp-2);
    align-self: flex-start;
    min-height: 44px;
    padding: var(--sp-2) var(--sp-4);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600; font-size: var(--fs-400);
    color: var(--text);
    background: var(--ctrl-track);
    border: 1px dashed rgba(255, 255, 255, 0.22);
    border-radius: var(--r-3);
    cursor: pointer;
    transition: border-color 0.12s ease, color 0.12s ease;
  }
  .photo-btn:hover:not(:disabled) { border-color: rgba(255, 255, 255, 0.4); }
  .photo-btn:focus-visible { outline: 3px solid var(--pov-mostarda); outline-offset: 2px; }
  .photo-btn:disabled { opacity: 0.6; cursor: progress; }

  .spinner {
    width: 14px; height: 14px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.25);
    border-top-color: var(--text);
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .spinner { animation-duration: 1.4s; }
    .swatch { transition: none; }
  }

  .upload-error {
    margin: 0;
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300); color: var(--pov-coral);
  }

  /* CTA */
  .cta {
    appearance: none; border: none; cursor: pointer;
    width: 100%; min-height: 52px; margin-top: var(--sp-1);
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

  .sr-only {
    position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border-width: 0;
  }
</style>
