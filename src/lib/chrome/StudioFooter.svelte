<!-- Rodapé de estúdio do lobby: marca LUANTARASCHI + Apoiar + links legais + ícones sociais. -->
<!-- Presente apenas no lobby, não nas telas de jogo. -->
<footer class="studio-foot">
  <div class="foot-inner">
    <span class="brand">LUANTARASCHI</span>

    <span class="sep" aria-hidden="true">·</span>

    <a
      href="https://apoia.se/pov"
      class="foot-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      Apoiar
    </a>

    <span class="sep" aria-hidden="true">·</span>

    <a
      href="/privacidade"
      class="foot-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      Privacidade
    </a>

    <span class="sep" aria-hidden="true">·</span>

    <a
      href="/termos"
      class="foot-link"
      target="_blank"
      rel="noopener noreferrer"
    >
      Termos
    </a>

    <span class="sep" aria-hidden="true">·</span>

    <a
      href="mailto:contato@luantaraschi.com"
      class="foot-link"
      rel="noopener noreferrer"
    >
      Contato
    </a>

    <span class="sep" aria-hidden="true">·</span>

    <!-- Ícones sociais: pontinhos coloridos simples (dose baixa de acento) -->
    <nav class="socials" aria-label="Redes sociais">
      <a
        href="https://discord.gg/pov"
        class="social-dot"
        style="background:var(--teal)"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Discord"
        title="Discord"
      ></a>
      <a
        href="https://instagram.com/luantaraschi"
        class="social-dot"
        style="background:var(--mustard)"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
        title="Instagram"
      ></a>
      <a
        href="https://x.com/luantaraschi"
        class="social-dot"
        style="background:var(--coral)"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="X (Twitter)"
        title="X"
      ></a>
      <a
        href="https://tiktok.com/@luantaraschi"
        class="social-dot"
        style="background:var(--sage)"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="TikTok"
        title="TikTok"
      ></a>
    </nav>
  </div>
</footer>

<style>
  .studio-foot {
    margin-top: 0.8rem;
    padding-top: 0.7rem;
    border-top: 1px solid var(--hair);
    position: relative;
    z-index: var(--z-chrome);
  }

  .foot-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0.4rem 0.5rem;
    font-size: 0.6875rem; /* 11px */
    color: var(--ink-soft);
    font-family: 'Inter', system-ui, sans-serif;
  }

  .brand {
    font-family: 'Clash Display', 'Space Grotesk', sans-serif;
    font-weight: 600;
    color: var(--ink);
    letter-spacing: 0.02em;
    font-size: 0.75rem;
  }

  .sep {
    opacity: 0.4;
    user-select: none;
  }

  .foot-link {
    color: var(--ink-soft);
    text-decoration: none;
    transition: color 160ms ease;
  }

  .foot-link:hover {
    color: var(--ink);
  }

  .foot-link:focus-visible {
    outline: 2px solid var(--mustard);
    outline-offset: 2px;
    border-radius: 2px;
  }

  .socials {
    display: flex;
    gap: 0.44rem;
    align-items: center;
  }

  .social-dot {
    display: block;
    width: 15px;
    height: 15px;
    border-radius: 5px;
    opacity: 0.72;
    transition:
      opacity 160ms ease,
      transform 120ms ease;
    text-decoration: none;
  }

  .social-dot:hover {
    opacity: 1;
  }

  .social-dot:active {
    transform: scale(0.9);
  }

  .social-dot:focus-visible {
    outline: 2px solid var(--mustard);
    outline-offset: 2px;
    border-radius: 4px;
  }

  /* mobile: texto menor, gaps menores */
  @media (max-width: 480px) {
    .foot-inner {
      font-size: 0.625rem; /* 10px */
      gap: 0.3rem 0.4rem;
    }
    .brand {
      font-size: 0.6875rem;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .foot-link,
    .social-dot {
      transition: none;
    }
  }
</style>
