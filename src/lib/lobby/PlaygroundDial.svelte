<script lang="ts">
  // Roleta-brinquedo do lobby: o Meter REAL em modo playground (tampa+agulha+disco interativos ao
  // mesmo tempo), com som/háptico, mas SEM nenhuma consequência de jogo (callbacks no-op). Os botões
  // "embaralhar"/"travar" são atalhos opcionais — o gesto direto no dial já faz tudo.
  import Meter from '../meter/Meter.svelte'

  // estado local descartável (nada disto toca o store/jogo)
  let value = $state(50)
  let shuffleSpin = $state(0)
  let locked = $state(false)

  function shuffle() {
    shuffleSpin++ // bump -> o Meter gira o disco (embaralha), sem efeito de rodada
  }
  function toggleLock() {
    locked = !locked
  }
</script>

<div class="playground" role="group" aria-label="Roleta de demonstração — brinque à vontade">
  <Meter
    bind:value
    playground
    {shuffleSpin}
    {locked}
    onCoverSettle={() => {}}
    onDiscSpin={() => {}}
  />

  <div class="toys">
    <button type="button" class="toy" onclick={shuffle} aria-label="Embaralhar a roleta">
      Embaralhar
    </button>
    <button
      type="button"
      class="toy"
      onclick={toggleLock}
      aria-pressed={locked}
      aria-label={locked ? 'Soltar a agulha' : 'Travar a agulha'}
    >
      {locked ? 'Soltar' : 'Travar'}
    </button>
  </div>
</div>

<style>
  .playground {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  .toys {
    display: flex;
    gap: 0.5rem;
  }

  /* botões "brinquedo": discretos, secundários — o protagonista é o gesto no próprio dial */
  .toy {
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--ink-soft);
    background: var(--surface);
    border: 1px solid var(--hair);
    border-radius: 999px;
    padding: 0.5rem 0.9rem;
    min-height: 2.25rem;
    cursor: pointer;
    transition:
      color 160ms ease,
      border-color 160ms ease,
      transform 120ms ease;
  }
  .toy:hover {
    color: var(--ink);
    border-color: var(--ink-soft);
  }
  .toy:active {
    transform: translateY(1px);
  }
  .toy[aria-pressed='true'] {
    color: var(--ink);
    border-color: var(--coral);
  }
  .toy:focus-visible {
    outline: 3px solid var(--mustard);
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    .toy {
      transition: none;
    }
  }
</style>
