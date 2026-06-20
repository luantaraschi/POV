<script lang="ts">
  // RevealChip — chip de resultado da revelação (frase de tier + pontos)
  // phrase vem de tierCopy (scoring.ts), score é 0|2|3|4
  let { score, phrase }: { score: 0 | 2 | 3 | 4; phrase: string } = $props()
</script>

<div class="chip" role="status" aria-live="polite">
  <span class="phrase">{phrase}</span>
  <span class="pts"><b>{score}</b> pontos</span>
</div>

<style>
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: var(--surface);
    border: 1px solid var(--hair);
    border-radius: 999px;
    padding: 8px 8px 8px 18px;
    box-shadow: 0 6px 20px -10px rgba(27, 35, 80, 0.3);
  }

  .phrase {
    font-family: 'Fraunces', serif;
    font-style: italic;
    color: var(--ink);
    font-size: clamp(15px, 2.6vw, 20px);
  }

  .pts {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    background: var(--sunk);
    color: var(--ink);
    border-radius: 999px;
    padding: 5px 13px;
    font-size: 13px;
  }

  .pts b {
    font-family: 'Clash Display', sans-serif;
    font-weight: 700;
    font-size: 20px;
    color: var(--ink);
  }

  /* Dose mínima de animação de entrada; suspensa em reduced-motion */
  @media (prefers-reduced-motion: no-preference) {
    .chip {
      animation: chip-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }

    @keyframes chip-in {
      from {
        opacity: 0;
        transform: translateY(6px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
  }
</style>
