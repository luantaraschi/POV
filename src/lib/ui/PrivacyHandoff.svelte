<script lang="ts">
  import Sheet from './Sheet.svelte'
  type Props = { open: boolean; donoName?: string; onConfirm: () => void; onCancel: () => void }
  let { open, donoName, onConfirm, onCancel }: Props = $props()
</script>

<!-- Sheet com superfície Studio Sinal (--surface/--ink, tema claro e escuro) -->
<Sheet {open} onClose={onCancel} ariaLabel="Passar o aparelho para o Dono do POV" variant="modal" surface="studio">
  <div class="ph">
    <!-- ícone de celular + cadeado — decorativo, aria-hidden -->
    <svg class="ph-icon" viewBox="0 0 48 48" aria-hidden="true" fill="none">
      <!-- corpo do celular -->
      <rect x="13" y="4" width="22" height="40" rx="5" stroke="currentColor" stroke-width="2.2" />
      <!-- botão home sutil -->
      <circle cx="24" cy="38" r="1.8" fill="currentColor" opacity="0.4" />
      <!-- cadeado: corpo + argola -->
      <rect x="18.5" y="20.5" width="11" height="9" rx="2.2" stroke="currentColor" stroke-width="2" />
      <path d="M20 20.5v-2.8a4 4 0 0 1 8 0v2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <!-- buraco da fechadura -->
      <circle cx="24" cy="24.8" r="1.2" fill="currentColor" />
    </svg>

    <!-- "Passe o aparelho para [Nome]" — nome em --red para destacar sem gritar -->
    <p class="ph-title">
      Passe o aparelho para
      {#if donoName}
        <span class="ph-name">{donoName}</span>
      {:else}
        <span class="ph-name">o Dono</span>
      {/if}
    </p>

    <!-- chip de confidencialidade: aviso discreto da privacidade do alvo -->
    <div class="ph-chip" aria-hidden="true">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.4" />
        <circle cx="7" cy="4.5" r="1" fill="currentColor" />
        <rect x="6.3" y="6.5" width="1.4" height="4" rx="0.7" fill="currentColor" />
      </svg>
      só você vê o alvo
    </div>

    <!-- dica de gesto: Fraunces itálico, sutil, ecoa o gesto físico de abrir a tampa -->
    <p class="ph-hint">Abra a tampa para espiar o alvo secreto.</p>

    <!-- ação primária: botão real (foco automático via Sheet) -->
    <button class="ph-primary" onclick={onConfirm}>Sou o Dono — ver o alvo</button>

    <!-- ação secundária: botão real, sem destaque -->
    <button class="ph-cancel" onclick={onCancel}>Voltar</button>
  </div>
</Sheet>

<style>
  /* ── Conteúdo do handoff ─────────────────────────────────────────────── */
  .ph {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    text-align: center;
  }

  /* ícone de celular+cadeado: toma a cor do texto atual (--ink) */
  .ph-icon {
    width: 52px;
    height: 52px;
    color: var(--ink-soft);
    margin-bottom: var(--sp-1);
  }

  /* título: "Passe o aparelho para" com o nome em --red */
  .ph-title {
    margin: 0;
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: var(--fs-700);
    line-height: 1.15;
    color: var(--ink);
    text-wrap: balance;
  }

  /* nome do dono em --red para evidência sem gritar */
  .ph-name {
    color: var(--red);
  }

  /* chip de confidencialidade: pílula discreta sunk */
  .ph-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 13px;
    border-radius: 999px;
    background: var(--sunk);
    color: var(--ink-soft);
    font-family: 'Space Grotesk', sans-serif;
    font-size: var(--fs-300);
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  /* dica Fraunces itálico: "abra a tampa para espiar" */
  .ph-hint {
    margin: 0 0 var(--sp-2);
    max-width: 26ch;
    font-family: 'Fraunces', Georgia, serif;
    font-style: italic;
    font-size: var(--fs-500);
    line-height: var(--lh-body);
    color: var(--ink-soft);
  }

  /* botão primário: --red com branco, 44px mínimo, :focus-visible obrigatório */
  .ph-primary {
    width: 100%;
    min-height: 52px;
    border: 0;
    cursor: pointer;
    border-radius: var(--r-4);
    padding: var(--sp-3) var(--sp-5);
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: var(--fs-600);
    color: #fff;
    letter-spacing: 0.01em;
    background: var(--red);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.16),
      0 4px 14px -4px color-mix(in srgb, var(--red) 55%, transparent);
    transition:
      transform 0.08s ease,
      filter 0.12s ease,
      box-shadow 0.12s ease;
  }
  .ph-primary:hover {
    filter: brightness(1.07);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 6px 18px -4px color-mix(in srgb, var(--red) 65%, transparent);
  }
  .ph-primary:active {
    transform: translateY(1px);
    filter: brightness(0.96);
  }
  .ph-primary:focus-visible {
    outline: 2px solid var(--mustard);
    outline-offset: 3px;
  }

  /* botão fantasma de cancelar: só texto, sem background, alvo 44px */
  .ph-cancel {
    min-height: 44px;
    border: 0;
    background: transparent;
    cursor: pointer;
    padding: var(--sp-1) var(--sp-3);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-400);
    color: var(--ink-soft);
    border-radius: var(--r-2);
    transition: color 0.12s ease;
  }
  .ph-cancel:hover {
    color: var(--ink);
  }
  .ph-cancel:focus-visible {
    outline: 2px solid var(--mustard);
    outline-offset: 2px;
  }

  /* sem animações extras para jogadores com reduced-motion */
  @media (prefers-reduced-motion: reduce) {
    .ph-primary,
    .ph-cancel {
      transition: none;
    }
  }
</style>
