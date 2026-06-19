<script lang="ts">
  import Sheet from './Sheet.svelte'
  import Segmented from '../ui/Segmented.svelte'
  import { game } from '../game/store.svelte'

  type Props = { open: boolean; onClose: () => void }
  let { open, onClose }: Props = $props()
</script>

<Sheet {open} {onClose} ariaLabel="Configurações" variant="sheet" surface="studio">
  <h2 class="title">Configurações</h2>

  <!-- Som -->
  <div class="row">
    <div class="label-col">
      <span class="rlabel">Som</span>
      <span class="rsub">cliques, travas, revelação</span>
    </div>
    <button
      class="sw"
      class:on={game.sound}
      role="switch"
      aria-checked={game.sound}
      aria-label="Som"
      onclick={() => game.toggleSound()}
    ><span class="knob"></span></button>
  </div>

  <!-- Vibração -->
  <div class="row">
    <div class="label-col">
      <span class="rlabel">Vibração</span>
      <span class="rsub">feedback tátil no toque</span>
    </div>
    <button
      class="sw"
      class:on={game.haptics}
      role="switch"
      aria-checked={game.haptics}
      aria-label="Vibração"
      onclick={() => game.toggleHaptics()}
    ><span class="knob"></span></button>
  </div>

  <!-- Tema -->
  <div class="row">
    <span class="rlabel">Tema</span>
    <Segmented
      options={[{ id: 'dark', label: 'Escuro' }, { id: 'light', label: 'Claro' }]}
      value={game.theme}
      onChange={(id) => { if (id !== game.theme) game.toggleTheme() }}
      ariaLabel="Tema"
    />
  </div>

  <!-- Movimento reduzido (read-only, do sistema) -->
  <div class="row">
    <div class="label-col">
      <span class="rlabel">Movimento reduzido</span>
      <span class="rsub">(do sistema) menos animações</span>
    </div>
    <!-- svelte-ignore a11y_interactive_supports_focus -->
    <button
      class="sw"
      class:on={game.reduce}
      role="switch"
      aria-checked={game.reduce}
      aria-label="Movimento reduzido (definido pelo sistema)"
      disabled
    ><span class="knob"></span></button>
  </div>

  <!-- Idioma — andaime para i18n futuro; apenas PT-BR funcional na Fase 1 -->
  <div class="row no-border">
    <div class="label-col">
      <span class="rlabel">Idioma</span>
      <span class="rsub">interface do jogo</span>
    </div>
    <div class="lang-select-wrap">
      <select
        class="lang-select"
        aria-label="Idioma da interface"
        value="pt-BR"
        disabled
      >
        <option value="pt-BR">🇧🇷 PT-BR</option>
      </select>
    </div>
  </div>

  <p class="footer-copy">POV v0.1</p>
</Sheet>

<style>
  .title {
    font-family: 'Clash Display', 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: var(--fs-700);
    color: var(--ink);
    margin: 0 0 var(--sp-2);
    line-height: var(--lh-tight);
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--sp-3) 0;
    border-bottom: 1px solid var(--hair);
    gap: var(--sp-4);
  }
  .row.no-border {
    border-bottom: none;
  }

  .label-col {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .rlabel {
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 600;
    font-size: var(--fs-500);
    color: var(--ink);
    line-height: 1.2;
  }

  .rsub {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: var(--fs-300);
    color: var(--ink-soft); /* ≥4.5:1 sobre --surface nos dois temas */
  }

  /* Pill switch */
  .sw {
    /* ensure ≥44px tap target */
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 52px;
    height: 44px;
    flex-shrink: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 0;
  }
  .sw::before {
    /* The track (off): poço no tom --sunk com hairline --hair, visível em branco e navy */
    content: '';
    position: absolute;
    left: 4px;
    top: 50%;
    transform: translateY(-50%);
    width: 44px;
    height: 26px;
    border-radius: 20px;
    background: var(--sunk);
    box-shadow: inset 0 0 0 1px var(--hair);
    transition: background 0.18s ease, box-shadow 0.18s ease;
  }
  .sw.on::before {
    /* on: acento de ação Studio Sinal */
    background: var(--red);
    box-shadow: none;
  }
  .sw:disabled::before {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .sw:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .knob {
    position: absolute;
    left: 7px; /* 4px track offset + 3px inset */
    top: 50%;
    transform: translateY(-50%) translateX(0);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    transition:
      transform 0.18s cubic-bezier(0.16, 1, 0.3, 1),
      background 0.18s ease;
    pointer-events: none;
  }
  .sw.on .knob {
    transform: translateY(-50%) translateX(18px);
  }

  .sw:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 3px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    .sw::before,
    .knob {
      transition: none;
    }
  }

  /* Seletor de idioma — andaime PT-BR (desabilitado na Fase 1; estilo por tokens) */
  .lang-select-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .lang-select {
    appearance: none;
    background: var(--sunk);
    border: 1px solid var(--hair);
    border-radius: 10px;
    color: var(--ink);
    font-family: 'Inter', system-ui, sans-serif;
    font-size: var(--fs-400);
    font-weight: 500;
    padding: 7px 12px;
    cursor: not-allowed;
    opacity: 0.7;
    min-height: 40px;
  }
  .lang-select:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 3px;
  }

  .footer-copy {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: var(--fs-300);
    color: var(--ink-soft);
    text-align: center;
    margin: var(--sp-4) 0 0;
  }
</style>
