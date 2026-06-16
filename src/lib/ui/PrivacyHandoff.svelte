<script lang="ts">
  import Sheet from './Sheet.svelte'
  type Props = { open: boolean; donoName?: string; onConfirm: () => void; onCancel: () => void }
  let { open, donoName, onConfirm, onCancel }: Props = $props()
</script>

<Sheet {open} onClose={onCancel} ariaLabel="Passar o aparelho para o Dono do POV" variant="modal">
  <div class="ph">
    <svg class="ph-icon" viewBox="0 0 48 48" aria-hidden="true">
      <rect x="14" y="5" width="20" height="38" rx="4.5" fill="none" stroke="currentColor" stroke-width="2.5" />
      <circle cx="24" cy="37.5" r="1.7" fill="currentColor" />
      <path d="M23 14 a6.5 6.5 0 1 1 -4.5 11" fill="none" stroke="var(--pov-coral)" stroke-width="2.6" stroke-linecap="round" />
      <circle cx="29" cy="20" r="1.6" fill="var(--pov-coral)" />
    </svg>
    <p class="ph-title">{donoName ? `Passe o POV pra ${donoName}` : 'Passe o POV para o Dono'}</p>
    <p class="ph-sub">Só o Dono do POV pode ver o alvo secreto. Quando ele estiver com o aparelho em mãos, toque abaixo.</p>
    <button class="ph-primary" onclick={onConfirm}>Sou o Dono — ver o alvo</button>
    <button class="ph-cancel" onclick={onCancel}>Voltar</button>
  </div>
</Sheet>

<style>
  .ph {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--sp-3);
    text-align: center;
  }
  .ph-icon {
    width: 48px;
    height: 48px;
    color: var(--text);
    margin-bottom: var(--sp-1);
  }
  .ph-title {
    margin: 0;
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-700);
    line-height: 1.1;
    color: var(--text);
  }
  .ph-sub {
    margin: 0 0 var(--sp-2);
    max-width: 30ch;
    font-size: var(--fs-400);
    line-height: var(--lh-body);
    color: var(--text-soft);
  }
  .ph-primary {
    width: 100%;
    border: 0;
    cursor: pointer;
    border-radius: var(--r-4);
    padding: var(--sp-3) var(--sp-5);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-600);
    color: #fff;
    letter-spacing: 0.01em;
    background: var(--pov-coral-cta);
    border-bottom: 4px solid var(--pov-coral-lo);
    transition:
      transform 0.07s ease,
      filter 0.12s ease;
  }
  .ph-primary:hover {
    filter: brightness(1.05);
  }
  .ph-primary:active {
    transform: translateY(2px);
    border-bottom-width: 2px;
  }
  .ph-primary:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 3px;
  }
  .ph-cancel {
    border: 0;
    background: transparent;
    cursor: pointer;
    min-height: 44px;
    padding: var(--sp-1) var(--sp-3);
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 600;
    font-size: var(--fs-400);
    color: var(--text-soft);
    border-radius: var(--r-2);
  }
  .ph-cancel:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 2px;
  }
</style>
