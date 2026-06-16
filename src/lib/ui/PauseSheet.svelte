<script lang="ts">
  import Sheet from './Sheet.svelte'
  import { game } from '../game/store.svelte'

  type Props = {
    open: boolean
    onClose: () => void
    onSettings: () => void
    onHowToPlay: () => void
  }
  let { open, onClose, onSettings, onHowToPlay }: Props = $props()

  let confirmExit = $state(false)

  function handleRestart() {
    game.playAgain()
    onClose()
  }

  function handleExitClick() {
    if (!confirmExit) {
      confirmExit = true
      return
    }
    // confirmed
    game.goHome()
    onClose()
  }

  function cancelExit() {
    confirmExit = false
  }

  // Reset confirmExit whenever sheet closes
  $effect(() => {
    if (!open) confirmExit = false
  })
</script>

<Sheet {open} {onClose} ariaLabel="Pausado" variant="modal">
  <h2 class="title">Pausado</h2>

  <div class="btn-stack">
    <!-- Retomar: coral primary -->
    <button class="mbtn coral" onclick={onClose}>Retomar</button>

    <!-- Como jogar: ghost -->
    <button class="mbtn ghost" onclick={onHowToPlay}>Como jogar</button>

    <!-- Configurações: ghost -->
    <button class="mbtn ghost" onclick={onSettings}>Configurações</button>

    <!-- Reiniciar: ghost -->
    <button class="mbtn ghost" onclick={handleRestart}>Reiniciar partida</button>

    <!-- Sair pro início: danger with confirm -->
    {#if confirmExit}
      <div class="confirm-row">
        <button class="mbtn confirm-yes" onclick={handleExitClick}>Confirmar saída?</button>
        <button class="mbtn confirm-no" onclick={cancelExit}>Cancelar</button>
      </div>
    {:else}
      <button class="mbtn danger" onclick={handleExitClick}>Sair pro início</button>
    {/if}
  </div>
</Sheet>

<style>
  .title {
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 800;
    font-size: var(--fs-700);
    color: var(--text);
    text-align: center;
    margin: 0 0 var(--sp-4);
    line-height: var(--lh-tight);
  }

  .btn-stack {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
  }

  .mbtn {
    width: 100%;
    min-height: 44px;
    padding: var(--sp-3) var(--sp-4);
    border-radius: var(--r-3);
    font-family: 'Bricolage Grotesque', sans-serif;
    font-weight: 700;
    font-size: var(--fs-500);
    text-align: center;
    cursor: pointer;
    transition:
      background 0.12s ease,
      transform 0.08s ease,
      box-shadow 0.12s ease;
    border: none;
  }

  .mbtn:active {
    transform: scale(0.97);
  }

  .mbtn:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 3px;
  }

  /* Coral primary */
  .mbtn.coral {
    background: var(--pov-coral-cta);
    color: #fff;
    box-shadow: 0 4px 0 var(--pov-coral-lo);
  }
  .mbtn.coral:hover {
    filter: brightness(1.08);
  }

  /* Ghost */
  .mbtn.ghost {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-soft);
  }
  .mbtn.ghost:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  /* Danger-tinted */
  .mbtn.danger {
    background: rgba(226, 87, 68, 0.1);
    border: 1px solid rgba(226, 87, 68, 0.3);
    color: #f0a596;
  }
  .mbtn.danger:hover {
    background: rgba(226, 87, 68, 0.18);
  }

  /* Confirm row: two side-by-side buttons */
  .confirm-row {
    display: flex;
    gap: var(--sp-2);
  }
  .confirm-row .mbtn {
    flex: 1;
  }

  .mbtn.confirm-yes {
    background: rgba(226, 87, 68, 0.2);
    border: 1px solid rgba(226, 87, 68, 0.45);
    color: #f0a596;
    font-size: var(--fs-400);
  }
  .mbtn.confirm-yes:hover {
    background: rgba(226, 87, 68, 0.3);
  }

  .mbtn.confirm-no {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-soft);
    font-size: var(--fs-400);
  }
  .mbtn.confirm-no:hover {
    background: rgba(255, 255, 255, 0.1);
  }
</style>
