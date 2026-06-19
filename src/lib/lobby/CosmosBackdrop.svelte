<!-- Halo cósmico atrás do herói do lobby: arcos concêntricos + poeira de estrelas + holofote radial. -->
<!-- Puramente decorativo: aria-hidden, pointer-events:none, z-index bg. -->
<!-- Animações de partículas desligadas quando prefers-reduced-motion está ativo. -->
<div class="cosmos" aria-hidden="true">
  <svg viewBox="0 0 540 350" xmlns="http://www.w3.org/2000/svg">
    <!-- Holofote radial quente atrás do dial -->
    <radialGradient id="cosmos-spotlight" cx="50%" cy="100%" r="60%">
      <stop offset="0%" stop-color="#fffef4" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#fffef4" stop-opacity="0" />
    </radialGradient>
    <ellipse cx="270" cy="350" rx="240" ry="200" fill="url(#cosmos-spotlight)" />

    <!-- 5 arcos concêntricos finos (coral/rosa/sálvia/teal/mostarda) -->
    <!-- opacidade .13 no claro / .24 no escuro (via .theme-dark & no CSS) -->
    <g class="arcs" fill="none" stroke-width="13" stroke-linecap="round">
      <path d="M110 350 A158 158 0 0 1 430 350" stroke="var(--coral)" />
      <path d="M84 350 A184 184 0 0 1 456 350" stroke="var(--pink)" />
      <path d="M58 350 A210 210 0 0 1 482 350" stroke="var(--sage)" />
      <path d="M32 350 A236 236 0 0 1 508 350" stroke="var(--teal)" />
      <path d="M8 350 A260 260 0 0 1 532 350" stroke="var(--mustard)" />
    </g>

    <!-- ~9 estrelas esparsas (navy no claro, quase branco no escuro) -->
    <g class="stars">
      <circle cx="86" cy="116" r="1.6" />
      <circle cx="146" cy="68" r="1.3" />
      <circle cx="454" cy="116" r="1.6" />
      <circle cx="396" cy="68" r="1.3" />
      <circle cx="58" cy="210" r="1.4" />
      <circle cx="482" cy="210" r="1.4" />
      <circle cx="270" cy="38" r="1.5" />
      <circle cx="212" cy="104" r="1.1" />
      <circle cx="328" cy="104" r="1.1" />
    </g>
  </svg>
</div>

<style>
  .cosmos {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -46%);
    width: clamp(320px, 80vw, 540px);
    /* mantém proporção do viewBox 540×350 */
    aspect-ratio: 540 / 350;
    z-index: var(--z-bg);
    pointer-events: none;
  }

  .cosmos svg {
    width: 100%;
    height: 100%;
  }

  /* arcos: opacidade baixa no tema claro */
  .arcs {
    opacity: 0.13;
  }

  /* estrelas: navy opaco no tema claro */
  .stars {
    fill: var(--navy);
    opacity: 0.22;
  }

  /* tema escuro: arcos mais visíveis + estrelas claras */
  :global(.theme-dark) .arcs {
    opacity: 0.24;
  }
  :global(.theme-dark) .stars {
    fill: #fffdf7;
    opacity: 0.55;
  }

  /* reduz movimento: sem partículas/animações (elemento estático, já ok) */
  @media (prefers-reduced-motion: reduce) {
    .cosmos {
      /* sem animação de entrada */
      animation: none !important;
    }
  }
</style>
