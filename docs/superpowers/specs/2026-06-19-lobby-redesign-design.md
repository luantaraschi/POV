# POV — Redesign do Lobby (Fase 1) · Design

**Data:** 2026-06-19
**Branch:** `feat/lobby-redesign`
**Status:** design aprovado (base visual validada no companion); pendente revisão do spec → plano de implementação.

---

## 1. Contexto e objetivo

POV é um jogo de festa de telepatia (estilo Wavelength/Sintonia), Svelte 5 + Vite + TS, com modo local (pass-and-play) e modo online (Convex, já em produção na `main`).

O usuário pediu um **redesign completo da interface com cara de web-game premium de estúdio** (referências de gênero: SUS, Funocracy, Gartic Phone — **não copiar**). O trabalho é **faseado**:

- **Fase 1 (este spec):** o **sistema de entrada** — um **lobby único integrado** (colapsa Home + escolha-de-modo + entrada online numa só tela), mais **Perfil**, **Configurações** e **rodapé de estúdio**. A peça central é uma **roleta-playground funcional**.
- **Fase 2 (depois, fora deste spec):** redesenho das telas de jogo (local `InRound`/`GameOver` e online `Lobby`/`OnlineRound`/`OnlineGameOver`) e do tutorial "Como jogar", na mesma linguagem.

**Princípio herdado de decisão do usuário:** arte **nova do zero**, preservando apenas a **mecânica** da roleta (o componente `Meter` + `geometry.ts` + a engine de áudio `clicks.ts`). Identidade do jogador = **foto + cor** (sem mascotes).

> Nota de gosto (memória `feedback-minimalist-over-skeuomorphic`): o usuário prefere **minimalista/flat/clean**; uma versão skeuomórfica pesada (latão/ouro) foi rejeitada por parecer "site de aposta". Errar sempre para o lado da contenção.

---

## 2. Direção de arte: **"Studio Sinal + toque retrô-cósmico"**

Base **minimalista**: saguão calmo (branco-osso no claro / meia-noite-azul no escuro), muito respiro, superfícies flat, sombras suaves de produto, **toda a cor concentrada no dial**. Sobre essa base, uma **camada de acento retrô-cósmico em dose baixa**, referenciando a arte original do POV (o cartaz do medidor cósmico + as duas faces em camadas): leque de raios multicor no dial, halo de arcos concêntricos + poeira de estrelas atrás do dial em opacidade baixa, grão de papel sutil, e uma paleta-acento retrô usada com conta-gotas. **Não vira pôster na página inteira.**

### 2.1 Paleta (tokens)

**Neutros / base — tema CLARO:**
| token | hex | uso |
|---|---|---|
| `--bone` (bg) | `#f6f4ee` | fundo do saguão (branco-osso quente) |
| `--surface` | `#ffffff` | cards/painéis flutuantes |
| `--sunk` | `#ece9e0` | campos/inputs (recuo inset) |
| `--ink` | `#1b2350` | texto principal (navy-tinta, ~12:1 no bone) |
| `--ink-soft` | `#5b6275` | labels/legendas (~5.4:1) |
| `--hair` | `#e6e3d9` | divisórias 1px |

**Neutros / base — tema ESCURO (override via `.theme-dark`):**
| token | hex | uso |
|---|---|---|
| `--bone` | `#0e1530` | fundo meia-noite-azul (nunca preto) |
| `--surface` | `#18213f` | cards (navy mais claro) + borda `rgba(255,255,255,.07)` |
| `--sunk` | `#121a34` | campos |
| `--ink` | `#eef1f8` | texto principal |
| `--ink-soft` | `#9aa6c4` | labels |
| `--hair` | `rgba(255,255,255,.08)` | divisórias |

**Acento retrô (igual nos dois temas):**
| token | hex | uso |
|---|---|---|
| `--red` | `#dd3b2e` | **ação primária** (CTA Criar sala), agulha + hub do dial, LED da marca |
| `--teal` | `#56b0aa` | secundário; alavanca do dial; cor de jogador |
| `--sage` | `#8fce9f` | acento; cunha de pontuação; cor de jogador |
| `--mustard` | `#e0a92e` | acento; raios; cor de jogador |
| `--pink` | `#e7a6bf` | acento; arco cósmico; cor de jogador |
| `--coral` | `#e8674a` | acento; raio; avatar default |
| `--navy` | `#1b2350` | disco do dial |
| `--cream` | `#efe6cf` | face do dial |

> A paleta-acento retrô também é o **conjunto de cores de identidade do jogador** (substitui as 8 cores atuais do store). Manter verificação de contraste do "ink sobre cor" para os tokens de jogador.

### 2.2 Tipografia

- **Display (wordmark POV + headings):** **Clash Display** (Fontshare). *Perf: self-host + `font-display:swap` na versão final; não depender do CDN da Fontshare em produção.*
- **Corpo/UI:** **Inter** (Google).
- **Código de sala / números técnicos:** **Space Grotesk** (já no projeto).
- **Tagline / toque editorial:** **Fraunces** itálico (já no projeto).

> Decisão de perf na implementação: subsetar + `preconnect`/`preload`. Total de 4 famílias é deliberado (parte do "premium"); reavaliar se pesar.

### 2.3 Superfícies, profundidade, textura

- Cards: radius ~22px, **sem borda** no claro (separação por sombra dupla suave de produto: `0 1px 2px rgba(27,35,80,.06), 0 18px 40px -16px rgba(27,35,80,.20)`); no escuro, borda hairline + sombra preta suave.
- Inputs: recuo (`inset`) no tom `--sunk`, radius ~13px.
- **Grão de papel** global sutil (~5% opacidade, `multiply` no claro / `screen` no escuro) para o toque retrô-tátil.
- **Zero glassmorphism/blur de fundo.** A clareza é o luxo.

### 2.4 Halo cósmico (atrás do dial, dose baixa)

- 5 arcos concêntricos finos nas cores retrô (coral/rosa/sálvia/teal/mostarda), opacidade ~.13 (claro) / ~.24 (escuro), irradiando de trás do dial.
- Poeira de estrelas esparsa (navy no claro, branca no escuro), opacidade baixa.
- Holofote radial quente atrás do dial. Tudo **contido na zona do herói**, sem cobrir a página.
- **Tudo `aria-hidden` e guardado por `prefers-reduced-motion`** (sem animação de partículas com reduce).

### 2.5 Movimento

- Transições de UI: 160–220ms ease padrão.
- Entrada do lobby: dial scale-in 0.94→1 com leve overshoot; wordmark + form em stagger curto de baixo p/ cima.
- Física do dial: a já existente no `Meter` (mola da agulha, gravidade/auto da tampa, spin/momentum do disco).
- Botões: micro elevação no hover / afundam no press (espelha a tátil do dial).
- **Reduced-motion:** desliga overshoot/respiração/partículas; estados finais permanecem.

---

## 3. Sistema de tokens (refactor de fundação)

Hoje a paleta está **duplicada** (`app.css` ↔ `tokens.ts`), com bridge-tokens presos nos temas e z-index em inteiros crus por componente (ver mapa do front-end).

**Decisões:**
1. **Fonte única** de tokens em `app.css` (`:root` + `.theme-dark`/`.theme-light`); `tokens.ts` passa a derivar/expor apenas o necessário ao JS (cores de jogador, scoreColors) — sem duplicar hex manualmente.
2. Promover os novos tokens (neutros por tema, acento retrô, tokens do dial) para o layer global.
3. **Escala de z-index** nomeada (`--z-bg`, `--z-chrome`, `--z-hero`, `--z-sheet`) substituindo inteiros ad-hoc.
4. Tema continua via classe na `.scene` (`Shell`), com toggle persistido (`pov-theme`) e `initTheme()` (localStorage → `prefers-color-scheme` → escuro). Atualizar `theme-color` meta por tema.

---

## 4. Arquitetura da informação (lobby único)

### 4.1 Nova entrada

Substitui o fluxo atual `home → modeSelect → (setup | online: profile→createJoin)` por **uma tela**: `lobby`.

- **Cluster de topo (direita):** botão **Som**, botão **Tema (claro/escuro)**, e **chip de Perfil** (foto + nome; só foto no mobile). POV-mark discreto à esquerda. Um ponto de entrada discreto para "Como jogar" pode existir aqui, **roteando para o tutorial atual** (o redesign do tutorial é Fase 2).
- **Herói (centro):** wordmark **POV** (Clash) + tagline (Fraunces itálico) + a **roleta-playground** (§5).
- **Entrada (card flutuante):** toggle segmentado **Local | Online**.
  - **Local:** controles de partida local (n.º de jogadores/duração/baralho) — pode abrir o `Setup` atual ou um resumo inline + CTA "Começar" (decidir no plano; manter `Setup` existente como destino na Fase 1 é aceitável).
  - **Online:** campo **nome** (com avatar + cor, vindos do Perfil), campo **CÓDIGO** (5 caracteres alfanuméricos — corrigir o "4 dígitos" do mock), e **Criar sala** (primário `--red`) + **Entrar** (secundário contorno).
- **Rodapé de estúdio:** **LUANTARASCHI** + **Apoiar** + Privacidade · Termos · Contato + ícones sociais (Discord/Instagram/X/TikTok). Links externos/placeholder; quieto, hairline acima.

### 4.2 Roteamento

- `store.svelte.ts`: `Screen` ganha `'lobby'` (vira a tela inicial). `home`/`modeSelect` são **removidos ou aliasados** para `lobby`. O lobby chama `openSetup()`/`openOnline()` conforme o modo escolhido na entrada.
- `App.svelte`/`Shell`: o lobby usa o shell existente; o **cluster de topo** do lobby substitui (no contexto do lobby) o `TopBar` atual, OU o `TopBar` é estendido. Decidir no plano; preferir reusar `Shell` + um `TopBar` repaginado.
- Modo online: a entrada do lobby cria/entra na sala e cai nas telas online **atuais** (`Lobby`/`OnlineRound`/… — Fase 2 redesenha). A entrada de Perfil online é absorvida pelo Perfil do lobby (§6).

> **Fronteira de fase:** Fase 1 entrega a entrada nova + Perfil + Config + rodapé. As telas de jogo (local e online) e o tutorial mantêm a aparência atual por enquanto; o lobby só precisa **rotear corretamente** para elas.

---

## 5. Roleta-playground (a peça central funcional)

Um **dial 100% interativo e sem nenhuma consequência de jogo** no herói do lobby — puro deleite tátil. Construído **sobre o `Meter` existente** (não reescrever a física).

### 5.1 Interações (todas com som + háptico, todas no-op)

| Interação | Origem | Observação |
|---|---|---|
| **Abrir/fechar a tampa** | gesto de arraste da tampa (já existe) | callback `onCoverSettle` vira no-op |
| **Girar o disco** (catraca + momentum) | spin-drag (já existe) | `onDiscSpin` no-op; usar `lockGestures` p/ girar sem "avançar rodada" |
| **Arrastar a agulha** | needle drag (já existe) | `bind:value` num estado local descartável |
| **Embaralhar** (giro automático multi-volta) | hoje só via `roundSeed` | **net-new:** gatilho de shuffle sob demanda (um contador local que bumpa `roundSeed`, ou novo método) |
| **Travar/soltar a agulha** ("selecionar") | **net-new** | crava a agulha no detente com `thunk` + háptico; soltar volta a arrastável; sem pontuação |

### 5.2 Trabalho novo no `Meter`

1. **Modo "playground" concorrente:** hoje cada afford. é gated por um único `phase` (tampa XOR agulha XOR disco). O playground precisa de **abrir/fechar E girar E arrastar simultaneamente** → um wrapper orquestrador (que troca `phase` no grab) ou um novo flag de modo que relaxa o gating. **Não usar `decorative`** (mata interação/som) — usar `lockGestures` + callbacks no-op.
2. **Gatilho de shuffle** desacoplado de `roundSeed`.
3. **Travar/soltar** (a "seleção") como nova afford. autônoma.
4. **Skin Studio Sinal cósmico:** face creme, agulha + hub vermelhos, cunhas/raios multicor, alavanca teal, disco navy com estrelas fracas. (A skin é via tokens/props, não nova geometria.)

### 5.3 A11y do playground

- Região rotulada ("roleta de demonstração — brinque à vontade") ou `aria-hidden` se for puramente decorativa para leitor de tela — **decidir**: como é interativa, expor como um grupo com instrução e suportar teclado (setas) é desejável, mas o playground não pode roubar foco/rota. Mínimo: respeitar reduced-motion e não emitir som se `sound` off.

---

## 6. Perfil (foto + cor + nome)

Painel/sheet aberto pelo chip de perfil no cluster. Reaproveita a identidade existente (`src/lib/online/identity.ts`: `getProfile`/`saveProfile`, `pov-profile`) e o upload de foto (Convex `files.ts` `generateUploadUrl`/`saveAvatar`) já usados no online.

- **Nome:** input (limite de caracteres).
- **Cor de identidade:** seletor entre as cores-acento retrô (§2.1), com prévia de contraste do "ink sobre cor".
- **Foto:** upload (com a foto ou as iniciais/cor como fallback), prévia circular com anel da cor.
- Perfil é **um só** e serve tanto o chip do lobby quanto as salas online (unifica o `Profile` online atual).
- Persistência local (localStorage `pov-profile` + `pov-player-id`); foto vai pro storage do Convex quando online.

---

## 7. Configurações

Sheet/painel aberto pelo cluster (ou dentro do Perfil). Controles:

- **Som** (existe: `toggleSound`).
- **Vibração/háptico** (existe: `toggleHaptics`).
- **Tema claro/escuro** (existe: `toggleTheme`).
- **Idioma:** seletor de UI **PT-BR** (estrutura pronta para i18n futuro). **Escopo:** apenas PT-BR funcional na Fase 1 — **i18n completo fica fora** (apenas o controle e o andaime, sem traduzir tudo agora).

Reusar o primitivo `Sheet` (focus-trap/Escape/restore). Hoje Configurações só é acessível em jogo; na Fase 1 passa a ser acessível **no lobby** (corrige a lacuna de chrome).

---

## 8. Rodapé de estúdio

Marca **LUANTARASCHI** (Clash) + bandeira BR opcional + **Apoiar** (link de apoio) + Privacidade · Termos · Contato (placeholders/externos) + ícones sociais. Discreto, hairline acima, presente no lobby (não nas telas de jogo). Pontos sociais podem usar as cores-acento retrô em baixa saturação.

---

## 9. Responsivo

- **Mobile-first**, fluido (`clamp()`/`min()`/`fr`); breakpoint principal mantido em ~900px.
- Lobby = **coluna central** generosa no desktop; empilhada no mobile com alvos ≥44px.
- `dvh` + safe-area (`max(token, env(safe-area-inset-*))`) — manter convenção atual.
- Cuidados conhecidos (do mapa): `min-width:0`/`minmax(0,…)` contra blow-out e clipping; rodapé/cluster não podem cobrir conteúdo; o dial escala por `clamp`.
- Verificar no **viewport real do usuário (desktop)**, visualmente (memória `feedback-verify-real-viewport`).

---

## 10. Movimento + som + háptico

- Reusar **integralmente** a engine `clicks.ts` (press/confirm/dock/tick/thunk/ratchet/slide/reveal/scoreSting/celebrate + haptics) — estender só se faltar algo pro playground (provavelmente reusa tick/thunk/ratchet/slide).
- Som do playground respeita o toggle `sound`; háptico respeita `haptics`.
- **Reduced-motion:** centralizar (hoje triplicado: `game.reduce` + matchMedia locais + CSS). Considerar um provider único — melhoria desejável neste refactor.

---

## 11. Acessibilidade

- Contraste: paleta atende AA (ink/ink-soft verificados nos dois temas; cores de jogador verificadas p/ ink sobre cor).
- `:focus-visible` em todos os controles; `<button>` reais; labels em ícones/inputs.
- Toggle de tema/som com estado acessível; sheets com focus-trap.
- Halo cósmico e grão `aria-hidden`; animações sob `prefers-reduced-motion`.

---

## 12. Inventário de componentes (Fase 1)

**Novos:**
- `Lobby.svelte` (tela de entrada integrada) — orquestra cluster + herói + entrada + rodapé.
- `PlaygroundDial.svelte` (wrapper do `Meter` em modo brinquedo concorrente).
- `ModeSwitch.svelte` (segmentado Local|Online).
- `StudioFooter.svelte`.
- `TopCluster` (repaginação do `TopBar` para o lobby: som/tema/perfil).

**Refatorar/estender:**
- `Meter.svelte` (modo playground concorrente + shuffle sob demanda + travar/soltar).
- `Profile` (unificar online + lobby; foto+cor+nome).
- `SettingsSheet` (acessível no lobby + idioma).
- `app.css`/`tokens.ts` (layer de tokens único; nova paleta; z-index; temas).
- `store.svelte.ts` (`Screen` 'lobby'; remover/aliasar home/modeSelect; cores de jogador novas).
- `App.svelte`/`Shell`/`Background` (rota do lobby; backdrop cósmico via tokens).

**Reusar como está:** `geometry.ts`, `clicks.ts`, `Sheet.svelte`, identidade/upload do Convex.

---

## 13. Fora de escopo (Fase 1)

- Redesign das telas de jogo (local `InRound`/`GameOver`; online `Lobby`/`OnlineRound`/`OnlineGameOver`) — **Fase 2**.
- Redesign do tutorial "Como jogar" — Fase 2 (lobby só linka pro atual).
- **i18n completo** — só o controle de idioma (PT-BR) na Fase 1.
- Mascotes/avatares ilustrados — identidade é foto+cor.
- Chat, convites por e-mail, contas reais, deep-link `?room=` — fora (como já era).

---

## 14. Riscos e notas

- O mockup do companion é **HTML descartável** (estático, minimalista) — serve só de **referência visual**. A versão final é Svelte 5 + `Meter` real + skill `frontend-design`, com acabamento premium e o dial **funcional**.
- **Clash Display** vem da Fontshare → self-host/licença na produção.
- Mudar a IA de entrada toca `App` + `store` (rotas) — testar que o caminho local e o online continuam funcionando ponta a ponta após a troca de `home`→`lobby`.
- Refactor de tokens é transversal — fazer cedo e validar `npm run check` + visual nos dois temas.
- Manter o jogo local e online **funcionando** durante a Fase 1 (a entrada muda, o miolo não).

---

## 15. Critérios de sucesso (Fase 1)

1. Lobby único premium (claro + escuro) substitui Home/ModeSelect/entrada-online, 100% responsivo (mobile + desktop), verificado visualmente nos dois temas e larguras.
2. Roleta-playground 100% funcional no lobby (abrir/fechar/girar/embaralhar/arrastar/travar) com som+háptico e **zero** efeito no jogo.
3. Perfil (foto+cor+nome) e Configurações (som/vibração/tema/idioma-PT) acessíveis do lobby.
4. Rodapé de estúdio presente.
5. Layer de tokens único + temas; `npm run check` 0/0, `npm run build` ok, testes verdes.
6. Caminhos **Local** e **Online** continuam jogáveis ponta a ponta a partir da nova entrada.
