# PROJECT_CONTEXT.md

# POV

## Visão geral do projeto

**POV** é um party game web social sobre percepção, comunicação e ponto de vista.

O jogo é inspirado de forma forte no jogo **Sintonia**, tanto na lógica visual quanto na sensação física e sensorial. A proposta é criar uma experiência digital que pareça um jogo de tabuleiro físico, com medidor, ponteiro, alvo escondido, cartas bicolores, revelação dramática, sons mecânicos e sensação tátil.

O objetivo não é criar uma interface genérica de app, nem um jogo visualmente distante da referência. O objetivo é construir uma versão web com alma de jogo físico, mantendo uma estética retrô psicodélica, cósmica, colorida e tátil.

A frase central do projeto é:

**POV é um jogo onde você tenta acertar como outra pessoa enxerga o mundo.**

---

## Conceito do jogo

Em POV, os jogadores tentam descobrir onde uma dica se encaixa dentro de uma escala entre dois extremos.

Cada rodada apresenta uma carta com dois conceitos opostos.

Exemplos:

* Barato / Caro
* Normal / Estranho
* Fácil de fazer / Difícil de fazer
* Frio / Quente
* Romântico / Nada romântico
* Saudável / Nada saudável
* Simples / Complexo
* Bonito / Feio
* Seguro / Arriscado
* Infantil / Adulto

Um jogador é escolhido como **Dono do POV**. Ele vê secretamente a posição de um alvo dentro da escala e precisa dar uma dica curta para que os outros jogadores tentem acertar onde esse alvo está.

Os outros jogadores discutem, interpretam a dica e posicionam o ponteiro no lugar onde acreditam que o alvo esteja.

O jogo não é sobre encontrar uma verdade absoluta. O jogo é sobre entender o ponto de vista da pessoa que deu a dica.

---

## Objetivo emocional do jogo

O objetivo principal é gerar conversa, debate e risadas.

O jogo deve provocar frases como:

* “Você acha isso tão caro assim?”
* “Para mim isso é muito mais estranho.”
* “Agora eu entendi o que você quis dizer.”
* “Eu nunca colocaria isso tão perto do extremo.”
* “Isso depende muito do contexto.”
* “Você realmente pensa assim?”

A diversão está na diferença entre interpretações. Cada rodada deve revelar como as pessoas pensam de formas diferentes sobre situações simples.

---

## Estrutura básica de uma rodada

### 1. Sorteio da carta

O jogo apresenta uma carta com dois extremos opostos.

Exemplo:

**Normal / Estranho**

Essa escala será usada durante a rodada.

### 2. Escolha do Dono do POV

Um jogador é escolhido para ser o **Dono do POV** da rodada.

Esse jogador será a referência mental da rodada. Os outros jogadores precisam tentar entender como ele pensou.

### 3. Revelação secreta do alvo

Somente o Dono do POV vê a posição secreta do alvo dentro do medidor.

O alvo pode estar em qualquer ponto entre os dois extremos.

### 4. Dica

O Dono do POV dá uma dica curta, subjetiva e interpretativa.

Exemplo:

Escala: **Normal / Estranho**
Alvo: próximo de “Estranho”
Dica: **Comer pizza com ketchup**

### 5. Palpites

Os outros jogadores analisam a dica e tentam posicionar o ponteiro o mais próximo possível do alvo secreto.

No modo online, cada jogador pode fazer um palpite individual antes da discussão final.

### 6. Debate

Os jogadores discutem entre si.

Eles podem defender posições, discordar, revisar o palpite e tentar chegar a um consenso.

Essa é a parte mais importante do jogo.

### 7. Resposta final

O grupo define a posição final do ponteiro.

### 8. Revelação

O jogo revela a posição real do alvo.

Esse deve ser o momento mais dramático e satisfatório da rodada.

A tela deve mostrar:

* posição do alvo
* posição do palpite final
* distância entre os dois
* pontuação conquistada

### 9. Pontuação

A pontuação depende da proximidade entre o palpite final e o alvo secreto.

Quanto mais perto, mais pontos.

---

## Modos de jogo

### Modo online

Pensado para jogar com amigos à distância.

Fluxo esperado:

1. Um jogador cria uma sala.
2. O sistema gera um código ou link.
3. Os outros jogadores entram.
4. Cada jogador escolhe um nome.
5. O host inicia a partida.
6. A cada rodada, uma pessoa diferente vira Dono do POV.
7. O Dono do POV vê o alvo secreto.
8. Ele dá uma dica.
9. Os outros jogadores fazem palpites.
10. O grupo discute por voz externa ou chamada.
11. O grupo define o palpite final.
12. O alvo é revelado.
13. A pontuação é atualizada.
14. Uma nova rodada começa.

O jogo não precisa ter chat ou voz próprios no MVP. Ele deve funcionar como o tabuleiro digital da experiência.

### Modo local

Pensado para jogar presencialmente usando apenas um dispositivo.

Fluxo esperado:

1. Os jogadores escolhem modo local.
2. O jogo define quem será o Dono do POV.
3. A tela avisa que apenas essa pessoa pode olhar.
4. O Dono do POV toca para revelar o alvo secreto.
5. Ele memoriza a posição do alvo.
6. Ele oculta o alvo.
7. O dispositivo volta para a mesa.
8. O Dono do POV dá a dica em voz alta.
9. O outro jogador ou grupo posiciona o ponteiro.
10. O alvo é revelado.
11. A pontuação é registrada.
12. A vez passa para outro jogador.

Esse modo é essencial para jogar presencialmente com uma pessoa ou com pequenos grupos usando apenas um celular, tablet ou computador.

---

## Terminologia do jogo

Usar preferencialmente estes termos:

* **POV**: nome do jogo
* **Dono do POV**: jogador que vê o alvo secreto e dá a dica
* **Medidor de POV**: dispositivo principal da rodada
* **Carta de escala**: carta com dois conceitos opostos
* **Alvo secreto**: posição correta escondida no medidor
* **Ponteiro**: marcador movido pelos jogadores
* **Palpite final**: posição oficial escolhida pelo grupo
* **Revelação**: momento em que o alvo aparece
* **Rodada**: ciclo completo de carta, dica, palpite e revelação

Evitar usar “psíquico” como termo principal. O jogo deve falar mais sobre ponto de vista do que telepatia.

---

## Regras de dica

A dica deve ser curta, subjetiva e interpretativa.

Boas dicas:

* representam uma ideia única
* fazem sentido dentro da escala
* não entregam diretamente a posição
* geram conversa
* podem ser objetos, situações, pessoas, lugares ou referências culturais

Exemplos:

Escala: **Barato / Caro**
Dica: **Jantar japonês no fim de semana**

Escala: **Normal / Estranho**
Dica: **Guardar sacolas dentro de outra sacola**

Escala: **Romântico / Nada romântico**
Dica: **Mensagem de bom dia**

Escala: **Fácil de fazer / Difícil de fazer**
Dica: **Pedir desculpas primeiro**

Evitar dicas que entreguem a resposta diretamente:

* números
* porcentagens
* “muito”
* “pouco”
* “quase no máximo”
* “mais para a direita”
* “perto do meio”
* palavras iguais ou muito próximas dos extremos da carta

---

## Direção estética geral

O POV deve seguir uma estética fortemente inspirada no Sintonia original.

A aparência deve ser:

* retrô psicodélica
* cósmica
* colorida
* granulada
* tátil
* lúdica
* social
* premium
* com aparência de jogo de tabuleiro físico

A interface deve parecer um objeto de mesa digitalizado, não um app comum.

A regra principal de design é:

**POV deve parecer um jogo físico dentro da tela.**

---

## Referência visual dominante

A referência visual dominante é o Sintonia original.

Manter forte inspiração em:

* medidor semicircular
* ponteiro central
* alvo escondido
* cobertura que abre e fecha
* segmentos coloridos de pontuação
* cartas bicolores com extremos opostos
* fundo azul escuro estrelado
* textura granulada
* padrões psicodélicos
* aparência de componentes físicos
* sensação de tabuleiro premium

A proposta não é se afastar muito da referência. A ideia é criar uma experiência bem próxima em espírito, adaptada para web e com o nome POV.

---

## Elemento visual central

O elemento mais importante da interface é o **Medidor de POV**.

Ele deve ocupar posição de destaque e ser o coração de cada rodada.

O medidor deve conter:

* arco semicircular grande
* área superior clara ou creme
* base azul escura ou estrelada
* ponteiro central grande
* alvo colorido escondido
* cobertura visual que oculta o alvo
* segmentos de pontuação revelados no final
* aparência de peça plástica ou tabuleiro físico

O medidor não deve parecer um slider comum.

Ele deve parecer uma roleta, disco, painel ou mecanismo físico.

---

## Composição da tela principal

A tela principal de rodada deve seguir esta lógica:

1. Fundo escuro estrelado.
2. Painel central com aparência de tabuleiro.
3. Medidor semicircular grande.
4. Carta de escala encaixada na base do painel.
5. Ponteiro central manipulável.
6. Área do alvo escondida por cobertura.
7. Botões grandes e táteis.
8. Elementos de pontuação integrados ao painel.

Sempre priorizar uma composição clara e teatral.

A interface precisa ser simples o bastante para jogar no celular, mas visualmente rica o suficiente para parecer um jogo de tabuleiro premium.

---

## Paleta de cores

A paleta deve combinar tons escuros, cremes e cores vibrantes.

Cores recomendadas:

* azul noite
* azul petróleo
* azul piscina
* creme
* off-white
* vermelho coral
* amarelo mostarda
* laranja vibrante
* verde menta
* rosa pastel
* lilás suave
* preto azulado

O fundo escuro deve segurar a composição. As cores vibrantes devem aparecer nos cards, segmentos, padrões, botões e detalhes.

A paleta deve lembrar impressão gráfica retrô, cartazes psicodélicos e componentes de jogo físico.

---

## Textura e acabamento visual

Evitar visual limpo demais.

Usar sempre que possível:

* granulação leve
* ruído sutil
* textura de papel
* textura de impressão
* pontos brancos simulando estrelas
* sombras suaves
* pequenos desgastes ou irregularidades visuais
* bordas arredondadas
* profundidade leve nos componentes

A interface deve ter materialidade.

O usuário deve sentir que está olhando para peças físicas, não apenas elementos HTML planos.

---

## Cartas de escala

As cartas devem ser componentes importantes da identidade visual.

Características:

* formato retangular
* cantos arredondados
* duas metades coloridas
* cada metade representa um extremo
* texto centralizado
* setas discretas apontando para esquerda e direita
* aparência de carta física
* textura de papel
* encaixe visual em um suporte na base do medidor

Exemplo visual conceitual:

**Natural | Artificial**

A carta deve parecer colocada no painel, não apenas renderizada como texto.

---

## Botões e elementos interativos

Botões devem parecer pressionáveis.

Características:

* grandes
* arredondados
* com leve sombra
* com sensação de profundidade
* com resposta visual ao toque
* com pequena animação de pressionar
* com cores fortes e bem definidas

Evitar botões minimalistas ou corporativos.

Todo elemento interativo deve parecer uma peça do jogo.

---

## Direção tátil

A experiência do POV deve herdar características táteis de jogos físicos.

A interface deve simular:

* peso
* atrito
* encaixe
* travamento
* clique
* rotação
* deslizamento
* pressão
* revelação

O jogo deve parecer mecânico e satisfatório.

A regra principal é:

**nada importante deve parecer liso demais.**

---

## Comportamento do ponteiro

O ponteiro é uma das partes mais importantes da experiência.

Ele deve se comportar como uma peça mecânica ou roleta.

Características desejadas:

* movimento com pequenos passos discretos
* sensação de dentes internos
* microtravamentos ao passar por posições
* clique em cada posição
* leve peso visual
* pequena inércia
* encaixe no ponto válido mais próximo ao soltar
* clique final mais firme ao travar

O ponteiro não deve deslizar livremente como um slider comum.

A sensação ideal é:

**arrastar, sentir travas, ouvir cliques, soltar e encaixar.**

---

## Sensação de roleta

O medidor deve funcionar como uma roleta mecânica digital.

O usuário deve sentir que está girando ou posicionando uma peça que passa por pontos definidos.

Ao mover o ponteiro:

* cada ponto deve parecer uma casa possível
* cada casa deve gerar feedback
* o movimento deve ser preciso
* o encaixe final deve ser claro
* a ação deve ser satisfatória

Isso é parte central da identidade do POV.

---

## Cobertura do alvo

A cobertura que esconde o alvo deve parecer uma peça física deslizante.

Ao fechar:

* deve cobrir o alvo visualmente
* deve deslizar com peso
* deve terminar com um som de trava
* deve comunicar segredo

Ao abrir:

* deve criar suspense
* deve revelar o alvo de forma teatral
* deve parecer uma tampa sendo puxada
* deve reforçar o momento de descoberta

A revelação é um dos momentos mais importantes da rodada.

---

## Direção sonora

O som é parte essencial da experiência.

O POV deve usar sons de objeto físico, não sons genéricos de aplicativo.

Sons desejados:

* clique curto ao mover o ponteiro
* clique mais firme ao travar o ponteiro
* som de peça plástica deslizando
* som de cobertura abrindo
* som de cobertura fechando
* som de carta encaixando
* som de botão pressionado
* som de confirmação
* som de revelação
* som de pontuação

Os sons devem ser curtos, satisfatórios e materiais.

A experiência sonora deve lembrar:

* plástico
* carta
* roleta
* trava
* ficha
* mecanismo

Quando possível, usar também vibração leve em dispositivos móveis.

---

## Animações

As animações devem reforçar a sensação de jogo físico.

Animações desejadas:

* carta entrando no suporte
* ponteiro encaixando em posições
* cobertura deslizando
* alvo sendo revelado
* segmentos coloridos aparecendo
* botão afundando ao toque
* pontuação saltando ou pulsando
* pequenos brilhos ou confetes em acertos bons

Evitar animações excessivamente futuristas ou digitais demais.

Tudo deve parecer físico, tátil e mecânico.

---

## Momento de revelação

A revelação deve ser o ponto alto da rodada.

Sequência ideal:

1. O grupo trava o palpite final.
2. O jogo cria uma pequena pausa de suspense.
3. A cobertura começa a abrir.
4. Um som de peça deslizando toca.
5. O alvo colorido aparece.
6. O ponteiro e o alvo são comparados.
7. A pontuação é exibida.
8. O jogo mostra uma reação textual curta.

Frases possíveis:

* **Revelando o POV...**
* **Abrindo o medidor...**
* **Quase perfeito.**
* **Vocês chegaram muito perto.**
* **Esse POV ficou distante.**
* **Na mesma frequência.**
* **Fora de sintonia.**

---

## Personalidade do jogo

O tom do POV deve ser:

* divertido
* social
* leve
* provocativo
* direto
* fácil de entender
* com humor sutil
* sem parecer infantil

O jogo deve parecer uma conversa entre amigos.

Frases que combinam:

* **Acerte o ponto de vista dos seus amigos.**
* **Todo mundo viu a mesma dica. Ninguém entendeu igual.**
* **O problema não é saber a resposta. É entender como o outro pensou.**
* **Entre dois extremos, existe uma discussão inteira.**
* **Seu palpite diz mais sobre você do que sobre a dica.**

---

## Diretrizes de experiência

Sempre priorizar:

1. Clareza da rodada.
2. Sensação de jogo físico.
3. Debate entre jogadores.
4. Revelação dramática.
5. Feedback tátil e sonoro.
6. Visual retrô psicodélico.
7. Uso confortável no celular.
8. Poucas fricções para começar a jogar.

O usuário deve conseguir entender rapidamente o que fazer, mas a interface deve continuar rica e memorável.

---

## O que evitar

Evitar:

* aparência de dashboard
* interface corporativa
* visual minimalista frio
* sliders comuns
* botões genéricos
* cards sem personalidade
* sons digitais genéricos
* estética futurista demais
* excesso de limpeza visual
* telas parecidas com formulário
* elementos planos sem profundidade
* afastamento excessivo da referência Sintonia

O POV deve parecer um party game físico, não um app de produtividade.

---

## MVP recomendado

A primeira versão deve focar em ser jogável e divertida.

Priorizar:

* modo local
* sistema de rodada
* cartas de escala
* Dono do POV
* alvo secreto
* dica
* ponteiro
* palpite final
* revelação
* pontuação simples
* sons básicos de interação
* sensação de roleta no ponteiro

Depois, evoluir para:

* salas online
* múltiplos jogadores
* palpites individuais
* ranking
* histórico de rodadas
* pacotes de cartas
* polimento visual e sonoro

---

## Regra de ouro do projeto

Sempre que houver dúvida sobre design, interação, som ou comportamento da interface, escolher a opção que mais se aproxima de:

**um jogo de tabuleiro físico digitalizado, fortemente inspirado em Sintonia, com estética retrô psicodélica, medidor semicircular, alvo escondido, cartas bicolores, sons de clique, travas mecânicas e sensação tátil de roleta.**

O POV deve ter identidade própria no nome, no tema de ponto de vista e na experiência social, mas deve herdar muito claramente a alma visual e sensorial do Sintonia original.

---

## Resumo final para qualquer IA ou desenvolvedor

Construa o POV como um party game web sobre ponto de vista. Em cada rodada, uma pessoa vê secretamente um alvo dentro de uma escala entre dois extremos e dá uma dica. Os outros jogadores discutem e movem um ponteiro em um medidor semicircular tentando acertar onde o alvo está. O jogo revela o alvo e pontua conforme a proximidade.

Visualmente, o jogo deve ser fortemente inspirado no Sintonia original: medidor semicircular, ponteiro central, cobertura escondendo alvo, segmentos coloridos, cartas bicolores, fundo estrelado, textura granulada, paleta retrô psicodélica e sensação de jogo de tabuleiro premium.

Sensorialmente, o jogo deve parecer físico: ponteiro com cliques, travas, atrito, encaixe e sensação de roleta; cobertura com som de abrir e fechar; cartas com som de encaixe; botões pressionáveis; feedback visual, sonoro e tátil em ações importantes.

O resultado esperado é uma experiência digital que pareça um objeto real de mesa, divertida, social, colorida e satisfatória de manipular.
