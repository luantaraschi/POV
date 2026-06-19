<script lang="ts" module>
  export type MeterState = 'hidden' | 'peek' | 'guessing' | 'reveal'
</script>

<script lang="ts">
  import { onDestroy } from 'svelte'
  import {
    VIEW_W,
    VIEW_H,
    CX,
    CY,
    R_OUTER,
    R_FACE,
    R_COVER,
    R_SCALLOP_INNER,
    POINTER_LEN,
    HUB_R,
    STEP_P,
    STEPS,
    halfDiskPath,
    fullDiskPath,
    fullScallopPath,
    frontPlatePath,
    topClipPath,
    detentTicks,
    pointAt,
    pToRad,
    SPAN,
    pAtPoint,
    stepIndex,
    scoreFor,
    wedges,
    arcBetween,
  } from './geometry'
  import { rimStars } from './textures'
  import { treatments, palette, type Treatment } from '../design/tokens'
  import { tick as soundTick, thunk, slide, friction, reveal as soundReveal, ratchet, unlockAudio } from '../audio/clicks'

  type Marker = { p: number; color: string; label?: string }

  type Props = {
    target?: number
    value?: number
    phase?: MeterState
    treatment?: Treatment
    light?: boolean
    roundSeed?: number // muda a cada nova rodada -> dispara o giro de "embaralhar"
    scaleLeft?: string // polo esquerdo da carta (p/ aria-valuetext "mais perto de ...")
    scaleRight?: string // polo direito da carta
    onCoverSettle?: (open: boolean) => void // gesto físico: tampa assentou aberta/fechada
    onDiscSpin?: () => void // gesto físico: jogador girou o disco na revelação -> nova rodada
    showTarget?: boolean // revela o marcador do alvo + arco (sincronizado ao resultado na tela)
    lockGestures?: boolean // modo teste: peças se mexem livremente, mas NÃO disparam nova rodada
    decorative?: boolean // modo VITRINE: dial inerte (sem ponteiro/teclado/som, oculto ao leitor de tela)
    markers?: Marker[] // pinos coloridos de palpite (online): { p, color, label? }; default []
  }

  let {
    target = 50,
    value = $bindable(50),
    phase = 'guessing',
    treatment = 'hibrido',
    light = false,
    roundSeed = 0,
    scaleLeft = '',
    scaleRight = '',
    onCoverSettle,
    onDiscSpin,
    showTarget = false,
    lockGestures = false,
    decorative = false,
    markers = [],
  }: Props = $props()

  const t = $derived(treatments[treatment])
  const interactive = $derived(phase === 'guessing')

  // disco navy CÍRCULO COMPLETO (gira limpo; a metade de baixo some sob a placa da frente)
  const nightPath = fullDiskPath(R_SCALLOP_INNER + 4)
  const facePath = halfDiskPath(R_FACE) // leque (fecha pelo eixo)
  const coverPath = halfDiskPath(R_COVER)
  const scallopRing = fullScallopPath(44)
  const frontPlate = frontPlatePath()
  const topClip = topClipPath()
  const stars = rimStars()
  const ticks = detentTicks()
  // pega física: alavanca de plástico no lado p=100, do CENTRO do eixo até passar do aro.
  // a ponta interna fica no centro (coberta pela tampa coral do eixo = pivô); o punho sai pra fora.
  const hInner: [number, number] = [CX, CY]
  const hOuter = pointAt(100, R_OUTER + 16)
  const hKnob = pointAt(100, R_OUTER + 16)

  const rays = $derived(wedges(target))
  const targetTip = $derived(pointAt(target, R_FACE - 16))
  const score = $derived(scoreFor(value, target))
  // cor por faixa (4=teal mira, 3=mostarda, 2=laranja, 0=coral) — fonte única
  const tierColor = $derived(
    score === 4 ? palette.bullseye : score === 3 ? palette.mostarda : score === 2 ? palette.laranja : palette.coral,
  )

  // a agulha aponta para cima; a rotação segue o arco (já com a margem "fechadinha").
  const rot = $derived(90 - (pToRad(value) * 180) / Math.PI)

  let svgEl: SVGSVGElement
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

  // pivô de todas as rotações = eixo do dial (CX,CY). Dirigido pela geometria via CSS var,
  // assim o transform-origin nunca dessincroniza da matemática se o medidor for reescalado.
  const pivot = `${CX}px ${CY}px`

  // acessibilidade: o slider precisa se autodescrever em função dos polos da carta.
  const ariaLabel = $derived(scaleLeft && scaleRight ? `Ponteiro: ${scaleLeft} a ${scaleRight}` : 'Medidor de POV')
  const valueText = $derived.by(() => {
    const pct = Math.round(value)
    if (!scaleLeft || !scaleRight) return `${pct}%`
    if (value < 48) return `${pct}% — mais perto de ${scaleLeft}`
    if (value > 52) return `${pct}% — mais perto de ${scaleRight}`
    return `${pct}% — no meio`
  })

  // ===== PONTEIRO (agulha) — ativo só no palpite; encaixa em casa exata, transição CSS suaviza =====
  let dragging = $state(false)
  let lastIdx = stepIndex(value)
  let lastStepAt = 0 // instante do último detente cruzado (p/ velocidade do arraste -> som)

  function toSvgP(e: PointerEvent): number | null {
    if (!svgEl) return null
    const pt = svgEl.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const m = svgEl.getScreenCTM()
    if (!m) return null
    const sp = pt.matrixTransform(m.inverse())
    return pAtPoint(sp.x, sp.y)
  }
  function needleApply(e: PointerEvent) {
    if (decorative) return
    const p = toSvgP(e)
    if (p == null) return
    const idx = stepIndex(p)
    if (idx !== lastIdx) {
      // velocidade do arraste: detente cruzado rápido = clique mais forte/brilhante; lento = suave
      const tnow = now()
      const vel = clamp01((170 - (tnow - lastStepAt)) / 150)
      lastStepAt = tnow
      soundTick(0.35 + 0.65 * vel, (idx / STEPS) * 1.2 - 0.6) // pan estéreo pela posição (esq->dir)
      lastIdx = idx
      value = idx * STEP_P
    }
  }
  function needleDown(e: PointerEvent) {
    if (decorative) return
    unlockAudio()
    dragging = true
    lastIdx = stepIndex(value)
    lastStepAt = now()
    svgEl.setPointerCapture?.(e.pointerId)
    needleApply(e)
  }

  // teclado: o medidor é um role="slider" — precisa ser operável sem ponteiro (WCAG 2.1.1)
  function onKeyDown(e: KeyboardEvent) {
    if (decorative) return
    if (interactive) {
      let idx = stepIndex(value)
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') idx = Math.min(STEPS, idx + 1)
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') idx = Math.max(0, idx - 1)
      else if (e.key === 'Home') idx = 0
      else if (e.key === 'End') idx = STEPS
      else return
      e.preventDefault()
      if (idx !== lastIdx) {
        unlockAudio()
        soundTick(0.8, (idx / STEPS) * 1.2 - 0.6)
        lastIdx = idx
        value = idx * STEP_P
      }
    } else if (coverDraggable && (e.key === ' ' || e.key === 'Enter')) {
      e.preventDefault()
      unlockAudio()
      startAuto(coverPos >= 0.5 ? 0 : 1) // alterna abre/fecha (automático suave)
    }
  }

  // ===== COBERTURA FÍSICA (meia-lua que gira no eixo) — peso + gravidade =====
  const coverDraggable = $derived(phase === 'hidden' || phase === 'peek')
  let coverPos = $state(1) // 0 aberto, 1 fechado (sincronizado à fase no $effect abaixo)
  let coverDragging = $state(false)
  // cobertura E pega giram JUNTAS pelo ângulo entre os cantos do "V" (SPAN, ~170°), não 180°:
  // a pega fica grudada na borda da cobertura durante todo o arraste E encaixa nos cantos do V nos
  // extremos (sem cair abaixo do V). A cobertura ainda revela 100% (vai pro fundo, sob a placa).
  const SPAN_DEG = (SPAN * 180) / Math.PI
  const coverAngle = $derived((coverPos - 1) * SPAN_DEG) // fechado(1)->0°, aberto(0)->-SPAN°

  let hubX = 0
  let hubY = 0
  let cAlphaPrev = 0
  let cAngleGrab = 0
  let cAccum = 0
  let cLastDet = -1
  let lastFricAt = 0 // instante da última fricção (p/ velocidade do arraste da cobertura -> som)
  let coverTarget = 1 // alvo que o spring/queda persegue (0 aberto, 1 fechado)
  let coverVel = 0
  let coverRaf = 0
  let coverMode: 'spring' | 'gravity' | 'auto' = 'spring'
  let reduceMotion = $state(false) // prefers-reduced-motion -> cobertura sem animação (encaixa direto)
  let coverBusy = $state(false) // peça em movimento (drag/spring/auto/queda) -> liga will-change
  let coverOpenAnnounce = $state('') // aria-live: anuncia quando a tampa assenta (aberta/fechada)

  // AUTO: abertura/fechamento por botão/fase — tween suave e lento (o manual continua responsivo)
  const AUTO_DUR = 680 // ms da animação automática da tampa (mais lenta e satisfatória que o spring)
  let autoFrom = 0
  let autoTo = 0
  let autoStart = 0
  const now = () => (typeof performance !== 'undefined' ? performance.now() : 0)
  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

  // GIRO de "embaralhar" os pontos ao iniciar uma nova rodada (gira o corpo do disco + dentes)
  let spinDeg = $state(0)
  let spinRaf = 0
  let spinning = $state(false) // disco realmente girando -> will-change (não fica preso em repouso)
  let suppressAutoSpin = false // o giro MANUAL do disco já anima -> pular o startSpin automático

  // ===== ARRASTAR O DISCO na revelação para GIRAR a roleta e começar a próxima rodada =====
  const discDraggable = $derived(phase === 'reveal' && !reduceMotion)
  let discDragging = $state(false)
  let discAlphaPrev = 0
  let discTotal = 0 // rotação acumulada (graus) -> limiar de "girou de verdade"
  let discVel = 0 // velocidade angular recente (graus/frame) -> momentum ao soltar
  let discCommitted = false // já passou do limiar e disparou a nova rodada
  let discLastTooth = 0 // p/ os estalos de catraca (um por dente cruzado)
  let discLastClickAt = 0
  const SPIN_CLICK_STEP = 15 // graus por "dente" sonoro (24 por volta = casas de pontuação)
  const SPIN_MIN_GAP = 34 // ms — limita o início para dar cliques DISTINTOS, não um zumbido
  const SPIN_COMMIT_DEG = 22 // girou mais que isto -> dispara a nova rodada

  // --- ÍMÃ CONTÍNUO nos extremos (lei do inverso do quadrado, como um ímã real) ---
  // A força cresce SUAVE conforme a peça se aproxima do extremo (forte de perto, fraca de longe);
  // ao puxar para fora, o ímã enfraquece sozinho com a distância -> em algum ponto a mola do dedo
  // vence e a peça SE SOLTA e vem à sua mão. Sem limiar liga/desliga.
  const STIFF = 0.2 // mola DENTRO da zona magnética (segura suave, sem travar/flicar)
  const STIFF_FREE = 0.36 // mola FORA da zona: ao soltar, a pega "pula" pro dedo com mais intensidade
  const DAMP = 0.72 // amortecimento (<1 = leve overshoot, mas assenta — sem ciclo-limite)
  const MAG_RANGE = 0.22 // zona magnética perto de cada extremo (fração do curso) = área de atuação
  const STICK = 3 // "grude": ↑ segura mais perto do extremo antes de soltar (expoente da curva)
  const MAX_V = 0.1 // teto de velocidade por frame (folga p/ a soltura vir mais intensa)
  const GRAVITY = 0.0014 // tombamento no meio quando solto (equilíbrio instável no topo)
  const FLING = 0.006 // velocidade que "lança" a peça pro lado ao soltar
  let coverSeated = false // a peça está assentada num extremo? -> clique seco ao grudar/desgrudar

  // ALVO magnético da peça em função do DEDO (cursor 0..1). Perto de um extremo, o alvo "gruda" nele
  // e só caminha até o dedo conforme você puxa (curva pow STICK: resiste suave e CRESCENTE, depois
  // SOLTA). Fora da zona, o alvo é o próprio dedo (segue livre). Por ser uma função SUAVE do dedo +
  // mola amortecida, não há força no contato nem singularidade -> sem flicker / idas-e-voltas.
  function magneticTarget(cursor: number): number {
    const E = cursor < 0.5 ? 0 : 1
    const dc = Math.abs(cursor - E)
    if (dc >= MAG_RANGE) return cursor // fora da zona -> segue o dedo
    return E + (cursor - E) * Math.pow(dc / MAG_RANGE, STICK)
  }
  const clampV = (v: number) => (v > MAX_V ? MAX_V : v < -MAX_V ? -MAX_V : v)

  function springLoop() {
    if (coverDragging) {
      // alvo = posição "magnética" do dedo: perto do extremo o alvo gruda e resiste (forte de perto,
      // afrouxando conforme você puxa) até soltar e vir à mão. Uma só mola amortecida persegue o alvo.
      const cursor = coverTarget
      const E = cursor < 0.5 ? 0 : 1
      const inZone = Math.abs(cursor - E) < MAG_RANGE
      const aim = magneticTarget(cursor)
      // DENTRO da zona a mola é suave (segura); FORA dela é mais forte (a pega vem ao dedo com intensidade)
      const k = inZone ? STIFF : STIFF_FREE
      coverVel = clampV((coverVel + (aim - coverPos) * k) * DAMP)
      coverPos += coverVel
      // a PAREDE absorve a velocidade (batente real) -> sem quicar no contato do extremo
      if (coverPos <= 0) {
        coverPos = 0
        coverVel = 0
      } else if (coverPos >= 1) {
        coverPos = 1
        coverVel = 0
      }
      // clique seco ao GRUDAR num extremo e ao DESGRUDAR (transição REAL de posição, com histerese)
      const dmin = Math.min(coverPos, 1 - coverPos)
      const seatedNow = coverSeated ? dmin < 0.05 : dmin < 0.02
      if (seatedNow !== coverSeated) {
        coverSeated = seatedNow
        soundTick()
      }
      coverRaf = requestAnimationFrame(springLoop)
      return
    }
    if (coverMode === 'auto') {
      // tween por tempo, com easing — a tampa abre/fecha devagar e suave (não é o usuário puxando)
      const k = Math.min(1, (now() - autoStart) / AUTO_DUR)
      coverPos = autoFrom + (autoTo - autoFrom) * easeInOut(k)
      if (k >= 1) {
        // impacto na parede + micro-rebote pelo spring -> mesmo "peso" do arraste manual
        // (antes o auto morria num ease seco; agora bate, recua um triz e assenta com thunk)
        coverPos = autoTo
        notifyCoverSettled(autoTo < 0.5)
        thunk()
        coverVel = (autoTo >= 0.5 ? -1 : 1) * 0.01 // recua na direção oposta à parede; a mola traz de volta
        coverMode = 'spring'
        coverRaf = requestAnimationFrame(springLoop) // continua o loop -> spring assenta (landing silencioso)
        return
      }
      coverRaf = requestAnimationFrame(springLoop)
      return
    }
    if (coverMode === 'spring') {
      coverVel += (coverTarget - coverPos) * STIFF // botões / assentar no extremo preso
      coverVel *= DAMP
    } else {
      // QUEDA: gravidade pura — tomba até o alvo, ACELERANDO (rápido no fim, slam + thunk)
      coverVel += coverTarget > coverPos ? GRAVITY : -GRAVITY
      coverVel = clampV(coverVel)
    }
    coverPos = clamp01(coverPos + coverVel)
    {
      const atWall =
        (coverTarget <= 0 && coverPos <= 0.0006) || (coverTarget >= 1 && coverPos >= 1 - 0.0006)
      const landed =
        coverMode === 'gravity'
          ? coverTarget >= 1
            ? coverPos >= 1 - 0.0004
            : coverPos <= 0.0004
          : atWall || (Math.abs(coverTarget - coverPos) < 0.0008 && Math.abs(coverVel) < 0.0008)
      if (landed) {
        const slam = coverMode === 'gravity'
        coverPos = coverTarget
        coverVel = 0
        coverRaf = 0
        coverMode = 'spring'
        coverBusy = false
        notifyCoverSettled(coverTarget < 0.5)
        if (slam) thunk()
        return
      }
    }
    coverRaf = requestAnimationFrame(springLoop)
  }
  function kickSpring() {
    // reduced-motion: nada de loop/overshoot — encaixa direto no alvo
    if (reduceMotion) {
      coverPos = coverTarget
      coverVel = 0
      coverMode = 'spring'
      coverBusy = false
      if (coverRaf) {
        cancelAnimationFrame(coverRaf)
        coverRaf = 0
      }
      return
    }
    coverBusy = true
    if (!coverRaf) coverRaf = requestAnimationFrame(springLoop)
  }

  // abre/fecha AUTOMÁTICO (botão/fase): tween suave. Reduced-motion encaixa direto.
  function startAuto(to: number) {
    coverTarget = to
    if (reduceMotion) {
      coverPos = to
      coverVel = 0
      coverMode = 'spring'
      coverBusy = false
      notifyCoverSettled(to < 0.5)
      return
    }
    autoFrom = coverPos
    autoTo = to
    autoStart = now()
    coverMode = 'auto'
    coverBusy = true
    if (!coverRaf) coverRaf = requestAnimationFrame(springLoop)
  }

  // catraca da roleta: UM estalo por dente cruzado, com gap mínimo -> deceleração = cliques
  // ficam mais espaçados (treque… treque… treque). velFactor (0..1) controla o brilho do clique.
  function spinRatchet(deg: number, tnow: number, velFactor: number) {
    const tooth = Math.floor(deg / SPIN_CLICK_STEP)
    if (tooth !== discLastTooth) {
      if (tnow - discLastClickAt >= SPIN_MIN_GAP) {
        ratchet(0.5 + 0.5 * clamp01(velFactor))
        discLastClickAt = tnow
      }
      discLastTooth = tooth
    }
  }

  // GIRO de embaralhar (nova rodada): gira o disco a partir do ângulo ATUAL, desacelera (easeOutQuart)
  // e estala como roleta. Normaliza sem snap (qualquer múltiplo de 360 ≡ mesma orientação).
  function startSpin() {
    if (reduceMotion) return
    const from = spinDeg
    const start = now()
    const dur = 1500
    const totalDeg = 360 * 3
    spinning = true
    discLastTooth = Math.floor(from / SPIN_CLICK_STEP)
    discLastClickAt = start
    if (spinRaf) cancelAnimationFrame(spinRaf)
    const step = () => {
      const tnow = now()
      const k = Math.min(1, (tnow - start) / dur)
      const e = 1 - Math.pow(1 - k, 4) // easeOutQuart -> desacelera como roleta parando
      spinDeg = from + totalDeg * e
      spinRatchet(spinDeg, tnow, Math.pow(1 - k, 2)) // taxa/brilho caem com a deceleração
      if (k < 1) spinRaf = requestAnimationFrame(step)
      else {
        spinDeg %= 360
        spinRaf = 0
        spinning = false
        thunk()
      }
    }
    spinRaf = requestAnimationFrame(step)
  }

  // momentum ao SOLTAR o disco girado à mão: gira como ROLETA DE VERDADE — amplia o impulso, garante
  // um mínimo (e um teto), atrito BAIXO -> roda várias voltas, estalando e desacelerando até parar.
  function startMomentum() {
    spinning = true
    const dir = (discVel !== 0 ? discVel : discTotal) < 0 ? -1 : 1
    let v = Math.abs(discVel) * 2.8 // amplia a "girada" do arraste
    if (v < 24) v = 24 // mínimo: mesmo um giro lento dá ~3 voltas
    else if (v > 50) v = 50 // teto: um flick forte não vira loucura
    discVel = dir * v
    if (spinRaf) cancelAnimationFrame(spinRaf)
    const step = () => {
      const tnow = now()
      discVel *= 0.981 // atrito BAIXO -> roda VÁRIAS voltas antes de parar (antes parava cedo)
      spinDeg += discVel
      spinRatchet(spinDeg, tnow, clamp01(Math.abs(discVel) / 8))
      if (Math.abs(discVel) > 0.3) spinRaf = requestAnimationFrame(step)
      else {
        spinDeg = ((spinDeg % 360) + 360) % 360
        spinRaf = 0
        spinning = false
        thunk()
      }
    }
    spinRaf = requestAnimationFrame(step)
  }

  // soltou sem girar o suficiente: volta suave ao repouso (sem começar rodada nova)
  function settleSpinBack() {
    const from = spinDeg
    const to = Math.round(from / 360) * 360
    const start = now()
    const dur = 240
    spinning = true
    if (spinRaf) cancelAnimationFrame(spinRaf)
    const step = () => {
      const k = Math.min(1, (now() - start) / dur)
      const e = 1 - Math.pow(1 - k, 3)
      spinDeg = from + (to - from) * e
      if (k < 1) spinRaf = requestAnimationFrame(step)
      else {
        spinDeg = ((spinDeg % 360) + 360) % 360
        spinRaf = 0
        spinning = false
      }
    }
    spinRaf = requestAnimationFrame(step)
  }

  function coverDown(e: PointerEvent) {
    if (decorative) return
    unlockAudio()
    coverDragging = true
    const rect = svgEl.getBoundingClientRect()
    hubX = rect.left + (CX / VIEW_W) * rect.width
    hubY = rect.top + (CY / VIEW_H) * rect.height
    cAlphaPrev = Math.atan2(e.clientY - hubY, e.clientX - hubX)
    cAngleGrab = (coverPos - 1) * SPAN_DEG
    cAccum = 0
    coverTarget = coverPos
    coverVel = 0
    coverSeated = Math.min(coverPos, 1 - coverPos) < 0.025 // estado inicial p/ o som de grudar/desgrudar
    cLastDet = Math.round(coverPos / 0.06)
    lastFricAt = now()
    svgEl.setPointerCapture?.(e.pointerId)
    kickSpring()
  }
  function coverMove(e: PointerEvent) {
    // TRACKING ANGULAR: o alvo segue o ângulo do cursor em torno do eixo.
    // É só o cursor — quem resiste/suga perto dos extremos é o poço magnético no loop (uma força só).
    const alpha = Math.atan2(e.clientY - hubY, e.clientX - hubX)
    let d = alpha - cAlphaPrev
    if (d > Math.PI) d -= 2 * Math.PI
    else if (d < -Math.PI) d += 2 * Math.PI
    cAccum += d
    cAlphaPrev = alpha
    coverTarget = clamp01((cAngleGrab + cAccum * (180 / Math.PI)) / SPAN_DEG + 1)
    const det = Math.round(coverTarget / 0.06)
    if (det !== cLastDet) {
      const tnow = now()
      const vel = clamp01((140 - (tnow - lastFricAt)) / 130)
      lastFricAt = tnow
      friction(0.3 + 0.7 * vel, 0.25) // alavanca fica no lado direito -> leve pan à direita
      cLastDet = det
    }
    kickSpring()
  }
  function coverUp() {
    coverDragging = false
    // destino pelo impulso do arraste, senão pro extremo mais próximo; o ímã+gravidade levam até lá
    coverTarget = coverVel > FLING ? 1 : coverVel < -FLING ? 0 : coverPos >= 0.5 ? 1 : 0
    coverMode = 'gravity'
    if (reduceMotion) notifyCoverSettled(coverTarget < 0.5) // sem animação -> avisa agora
    kickSpring()
  }

  // avisa o pai (e o leitor de tela) que a tampa assentou — vira gesto físico de avançar de fase
  function notifyCoverSettled(open: boolean) {
    coverOpenAnnounce = open ? 'Alvo descoberto.' : 'Alvo coberto.'
    onCoverSettle?.(open)
  }

  // ===== arraste do DISCO (revelação): gira a roleta e, passando do limiar, começa a próxima rodada =====
  function discDown(e: PointerEvent) {
    if (decorative) return
    unlockAudio()
    discDragging = true
    const rect = svgEl.getBoundingClientRect()
    hubX = rect.left + (CX / VIEW_W) * rect.width
    hubY = rect.top + (CY / VIEW_H) * rect.height
    discAlphaPrev = Math.atan2(e.clientY - hubY, e.clientX - hubX)
    discTotal = 0
    discVel = 0
    discCommitted = false
    discLastTooth = Math.floor(spinDeg / SPIN_CLICK_STEP)
    discLastClickAt = now()
    if (spinRaf) {
      cancelAnimationFrame(spinRaf)
      spinRaf = 0
    }
    spinning = true
    svgEl.setPointerCapture?.(e.pointerId)
  }
  function discMove(e: PointerEvent) {
    const alpha = Math.atan2(e.clientY - hubY, e.clientX - hubX)
    let d = alpha - discAlphaPrev
    if (d > Math.PI) d -= 2 * Math.PI
    else if (d < -Math.PI) d += 2 * Math.PI
    discAlphaPrev = alpha
    const deltaDeg = d * (180 / Math.PI) // segue o dedo NO MESMO sentido do arraste (antes invertia)
    spinDeg += deltaDeg
    discTotal += deltaDeg
    discVel = discVel * 0.5 + deltaDeg * 0.5 // EMA -> velocidade estável p/ o momentum
    spinRatchet(spinDeg, now(), clamp01(Math.abs(deltaDeg) / 6))
    if (!discCommitted && Math.abs(discTotal) > SPIN_COMMIT_DEG) {
      discCommitted = true // passou do limiar -> roda por inércia ao soltar (sempre, p/ sentir o giro)
      if (!lockGestures) {
        suppressAutoSpin = true // a nova rodada NÃO deve re-disparar o startSpin (o manual já anima)
        onDiscSpin?.() // o pai monta a nova rodada (alvo/carta/fase=hidden) — a tampa fecha sozinha
      }
    }
  }
  function discUp(e: PointerEvent) {
    discDragging = false
    svgEl.releasePointerCapture?.(e.pointerId)
    if (discCommitted) startMomentum() // girou de verdade -> roda por inércia até parar
    else settleSpinBack() // toque/giro pequeno -> volta ao repouso, sem nova rodada
  }

  // ===== roteamento: cobertura (hidden/peek) > agulha (guessing) > disco (reveal) =====
  function onPointerDown(e: PointerEvent) {
    if (decorative) return
    if (coverDraggable) coverDown(e)
    else if (interactive) needleDown(e)
    else if (discDraggable) discDown(e)
  }
  function onPointerMove(e: PointerEvent) {
    if (decorative) return
    if (coverDragging) coverMove(e)
    else if (dragging) needleApply(e)
    else if (discDragging) discMove(e)
  }
  function onPointerUp(e: PointerEvent) {
    if (decorative) return
    if (coverDragging) {
      coverUp()
      svgEl.releasePointerCapture?.(e.pointerId)
    } else if (dragging) {
      dragging = false
      thunk()
      svgEl.releasePointerCapture?.(e.pointerId)
    } else if (discDragging) {
      discUp(e)
    }
  }

  // reduced-motion: cobertura encaixa SEM animação (matchMedia com limpeza no destroy)
  $effect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduceMotion = mq.matches
    const onChange = () => (reduceMotion = mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  })

  // cancela qualquer frame em voo quando o componente é destruído (sem leak / sobrevive ao HMR)
  onDestroy(() => {
    if (coverRaf) {
      cancelAnimationFrame(coverRaf)
      coverRaf = 0
    }
    if (spinRaf) {
      cancelAnimationFrame(spinRaf)
      spinRaf = 0
    }
  })

  // nova rodada (roundSeed muda) -> gira o disco/dentes pra "embaralhar" a pontuação.
  // Se a rodada veio do giro MANUAL do disco, o momentum já anima -> pula o startSpin automático.
  let prevSeed: number | undefined
  $effect(() => {
    const rs = roundSeed
    if (prevSeed !== undefined && rs !== prevSeed) {
      if (suppressAutoSpin) suppressAutoSpin = false
      else if (!decorative) startSpin() // decorativo: sem giro/som ao trocar de rodada
    }
    prevSeed = rs
  })

  // fase muda -> cobertura vai pro alvo da fase (sem interromper arraste) + sons
  let prevState: MeterState | undefined // p/ os sons: avança SEMPRE (não dupla na troca)
  let coverPhase: MeterState | undefined // p/ o alvo: só avança quando REALMENTE sincroniza
  $effect(() => {
    const s = phase
    const wantOpen = s === 'peek' || s === 'reveal'
    const want = wantOpen ? 0 : 1
    // se o usuário JÁ moveu a tampa na mão até a posição da nova fase, não re-anima nem re-toca som
    const coverWillMove = Math.abs(coverPos - want) > 0.02
    // sons: disparam na troca de fase, independem do arraste (mudos no modo decorativo)
    if (!decorative && prevState !== undefined && s !== prevState) {
      const wasOpen = prevState === 'peek' || prevState === 'reveal'
      if (wasOpen !== wantOpen && coverWillMove) slide()
      if (s === 'reveal') soundReveal()
    }
    prevState = s
    // alvo da cobertura: só fora do arraste e só se ela REALMENTE precisa se mover.
    if (!coverDragging && s !== coverPhase) {
      // decorativo: encaixa direto (sem tween/thunk); interativo: tween suave automático
      if (coverWillMove) decorative ? (coverPos = want) : startAuto(want)
      coverPhase = s
    }
  })
</script>

<!-- tabindex e role=slider são ligados ao MESMO flag `decorative`: o SVG só é focável quando
     também é role=slider (interativo). No modo decorativo ambos somem juntos (aria-hidden). O
     analisador estático não correlaciona os dois ternários -> falso positivo de tabindex. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<svg
  bind:this={svgEl}
  class="meter"
  class:grab={!decorative && (interactive || coverDraggable || discDraggable)}
  class:grabbing={!decorative && (dragging || coverDragging || discDragging)}
  viewBox="0 0 {VIEW_W} {VIEW_H}"
  role={decorative ? undefined : 'slider'}
  tabindex={decorative ? undefined : 0}
  aria-hidden={decorative ? true : undefined}
  aria-label={decorative ? undefined : ariaLabel}
  aria-valuemin={decorative ? undefined : 0}
  aria-valuemax={decorative ? undefined : 100}
  aria-valuenow={decorative ? undefined : Math.round(value)}
  aria-valuetext={decorative ? undefined : valueText}
  style:--pivot={pivot}
  style:touch-action={!decorative && (interactive || coverDraggable || discDraggable) ? 'none' : 'auto'}
  onpointerdown={onPointerDown}
  onpointermove={onPointerMove}
  onpointerup={onPointerUp}
  onpointercancel={onPointerUp}
  onkeydown={onKeyDown}
>
  <defs>
    <linearGradient id="nightGrad" x1="0" y1={CY - R_SCALLOP_INNER} x2="0" y2={CY} gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#1c3766" />
      <stop offset="100%" stop-color="#13284c" />
    </linearGradient>
    <linearGradient id="lidGrad" x1="0" y1={CY - R_COVER} x2="0" y2={CY} gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#dccba4" />
      <stop offset="100%" stop-color="#c9b88c" />
    </linearGradient>
    <filter id="grainF">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>
    <filter id="dialShadow" x="-12%" y="-12%" width="124%" height="124%">
      <feDropShadow dx="0" dy="3" stdDeviation="7" flood-color="#2a2410" flood-opacity="0.16" />
    </filter>
    <clipPath id="faceClip"><path d={facePath} /></clipPath>
    <clipPath id="plateClip"><path d={frontPlate} /></clipPath>
    <clipPath id="topClip"><path d={topClip} /></clipPath>
  </defs>

  <!-- CORPO DO DISCO (navy + estrelas + serrilhado): círculo completo que gira ao embaralhar.
       O recorte do "V" fica no grupo EXTERNO (fixo); o giro no INTERNO -> a linha do V não gira. -->
  <g clip-path="url(#topClip)">
    <g class="dialSpin" class:moving={spinning} style:transform={spinDeg ? `rotate(${spinDeg}deg)` : undefined}>
      <!-- disco azul-noite (chapado) -->
      <path d={nightPath} fill="url(#nightGrad)" />

      <!-- estrelas (as brilhantes piscam) -->
      <g class="stars">
        {#each stars as s, i}
          <circle cx={s.x} cy={s.y} r={s.r} fill="#fdfcf6" opacity={s.o} class:tw={s.tw} style={s.tw ? `animation-delay:${(i % 11) * 0.3}s` : ''} />
        {/each}
      </g>
      <!-- serrilhado (dentes creme). No dark, contrasta com o fundo navy; no light precisa de um
           contorno mais escuro pra a "engrenagem" não sumir contra o fundo claro. -->
      <g class="scallopBezel" filter="url(#dialShadow)">
        <path d={scallopRing} fill={light ? '#efe2c4' : '#fbfaf4'} />
        {#if light}
          <path d={scallopRing} fill="none" stroke="#b39a66" stroke-width="2" opacity="0.9" />
        {:else}
          <path d={scallopRing} fill="none" stroke={palette.cremeLo} stroke-width="1.25" opacity="0.45" />
        {/if}
      </g>
    </g>
  </g>

  <!-- face creme + raios + cobertura -->
  <g clip-path="url(#faceClip)">
    <path d={facePath} fill={palette.creme} />

    <g class="rays">
      {#each rays as w}
        <path d={w.d} fill={w.color} stroke="#0c1c38" stroke-width="1.25" stroke-opacity="0.18" />
      {/each}
      {#each rays as w}
        <text x={w.label[0]} y={w.label[1]} class="raynum" text-anchor="middle" dominant-baseline="central" fill={w.points === 4 ? palette.cremeHi : '#11233f'}>{w.points}</text>
      {/each}
    </g>

    <!-- granulação sutil -->
    <rect x="0" y={CY - R_FACE} width={VIEW_W} height={R_FACE} fill="#fff" filter="url(#grainF)" opacity={0.06 * t.grain} style="mix-blend-mode:multiply" />

    <!-- cobertura física: meia-lua que gira no eixo (taupe, distinta da face creme) -->
    <g class="lid" class:moving={coverDragging || coverBusy} style:transform={`rotate(${coverAngle}deg)`}>
      <path d={coverPath} fill="url(#lidGrad)" />
      <path d={coverPath} filter="url(#grainF)" opacity="0.05" style="mix-blend-mode:multiply" />
    </g>

  </g>

  <!-- PLACA DA FRENTE (plástico): tampa tudo abaixo da linha do "V". Esconde a metade de baixo do
       disco girando, os dentes de baixo e a cobertura quando ela "afunda" ao abrir. Mesmas estrelas
       (seed fixa) do disco -> emenda invisível no repouso. -->
  <g clip-path="url(#plateClip)">
    <path d={frontPlate} fill="#13284c" />
    <g class="stars">
      {#each stars as s}
        <circle cx={s.x} cy={s.y} r={s.r} fill="#fdfcf6" opacity={s.o} />
      {/each}
    </g>
    <path d={frontPlate} fill="url(#grainF)" opacity="0.04" style="mix-blend-mode:overlay" />
  </g>

  <!-- PEGA: alavanca de plástico do CENTRO até passar do aro (gira junto com a cobertura).
       Desenhada ANTES do eixo coral -> a ponta interna fica sob a tampa = parece um pivô real. -->
  <g class="lidHandle" class:moving={coverDragging || coverBusy} style:transform={`rotate(${coverAngle}deg)`}>
    <!-- alavanca CHAPADA de plástico TEAL/menta (pop frio da referência) — borda moldada + face lisa -->
    <line x1={hInner[0]} y1={hInner[1]} x2={hOuter[0]} y2={hOuter[1]} stroke="#5fae86" stroke-width="20" stroke-linecap="round" />
    <line x1={hInner[0]} y1={hInner[1]} x2={hOuter[0]} y2={hOuter[1]} stroke={palette.menta} stroke-width="15" stroke-linecap="round" />
    <circle cx={hKnob[0]} cy={hKnob[1]} r="17" fill={palette.menta} stroke="#5fae86" stroke-width="2.5" />
  </g>

  <!-- régua de marcas: fora do clip da face (a cobertura tem transform e cria stacking context) -->
  <g class="ticks">
    {#each ticks as tk}
      <line x1={tk.x1} y1={tk.y1} x2={tk.x2} y2={tk.y2} stroke="#cfe0f0" stroke-width={tk.major ? 4 : 2.2} stroke-linecap="round" opacity={tk.major ? 0.95 : 0.5} />
    {/each}
  </g>

  <!-- marcador do alvo (revelação) — aparece SINCRONIZADO ao resultado (após a tampa abrir) -->
  {#if showTarget}
    <g class="targetMark">
      {#if stepIndex(value) !== stepIndex(target)}
        <path d={arcBetween(value, target, R_FACE - 78)} fill="none" stroke={tierColor} stroke-width="4" stroke-linecap="round" stroke-dasharray="2 11" opacity="0.55" />
      {/if}
      <line x1={CX} y1={CY} x2={targetTip[0]} y2={targetTip[1]} stroke={tierColor} stroke-width="3.5" stroke-dasharray="5 7" opacity="0.7" />
      <g class="targetDot">
        <circle cx={targetTip[0]} cy={targetTip[1]} r="13" fill="#0e2148" />
        <circle cx={targetTip[0]} cy={targetTip[1]} r="6.5" fill={tierColor} />
      </g>
    </g>
  {/if}

  <!-- pinos de palpite (online): um círculo colorido por jogador, na borda da face creme.
       aria-hidden: decorativos — os resultados são anunciados em texto fora do SVG.
       Renderizados ANTES da agulha para não obstruí-la. -->
  {#if markers.length > 0}
    <g aria-hidden="true" class="markerPins">
      {#each markers as m, i (i)}
        {@const [mx, my] = pointAt(m.p, R_FACE - 22)}
        <g class="pin">
          <circle cx={mx} cy={my} r="14" fill={m.color} stroke="#0e2148" stroke-width="2.5" />
          <circle cx={mx} cy={my} r="5" fill="#fff" opacity="0.55" />
        </g>
      {/each}
    </g>
  {/if}

  <!-- agulha grossa com mira (chapada) — rotaciona suavemente em torno do eixo -->
  <g class="pointer" class:dragging class:moving={dragging} style:transform={`rotate(${rot}deg)`}>
    <line x1={CX} y1={CY} x2={CX} y2={CY - POINTER_LEN} stroke={palette.coral} stroke-width="9" stroke-linecap="round" />
    <circle cx={CX} cy={CY - POINTER_LEN} r="10" fill={palette.coral} />
    <circle cx={CX} cy={CY - POINTER_LEN} r="4" fill={palette.creme} />
  </g>

  <!-- eixo central (botão coral chapado) -->
  <g class="hub">
    <circle cx={CX} cy={CY} r={HUB_R} fill={palette.coral} />
    <circle cx={CX} cy={CY} r={HUB_R} fill="none" stroke={palette.coralLo} stroke-width="3" />
    <circle cx={CX} cy={CY} r={HUB_R * 0.38} fill={palette.coralLo} opacity="0.35" />
  </g>

</svg>

<!-- leitor de tela: anuncia quando a tampa assenta aberta/fechada (toggle por Espaço/Enter) -->
<span class="sr-only" aria-live="polite">{coverOpenAnnounce}</span>

<style>
  .meter {
    display: block;
    width: 100%;
    height: auto;
    user-select: none;
    -webkit-user-select: none;
    overflow: visible;
  }
  .meter.grab {
    cursor: grab;
  }
  .meter.grab.grabbing {
    cursor: grabbing;
  }
  /* foco de teclado visível no SVG focável (igual ao botão primário) */
  .meter:focus-visible {
    outline: 3px solid var(--pov-mostarda);
    outline-offset: 4px;
    border-radius: 16px;
  }

  /* agulha: encaixa em casa exata. No ARRASTE acompanha o cursor 1:1 (rápido, sem overshoot);
     o assentamento com pequeno overshoot fica só na SOLTURA e no teclado (passos discretos). */
  .pointer {
    transform-box: view-box;
    transform-origin: var(--pivot);
    transition: transform 170ms cubic-bezier(0.34, 1.26, 0.5, 1);
  }
  .pointer.dragging {
    transition: transform 70ms ease-out;
  }

  /* cobertura: gira no eixo. A animação é feita por um SPRING em JS (sem transition CSS). */
  .lid,
  .lidHandle {
    transform-box: view-box;
    transform-origin: var(--pivot);
  }

  /* corpo do disco que gira ao embaralhar (rotação dirigida por JS em torno do eixo) */
  .dialSpin {
    transform-box: view-box;
    transform-origin: var(--pivot);
  }

  /* GPU hint só enquanto a peça realmente se move (evita manter camadas vivas em repouso) */
  .pointer.moving,
  .lid.moving,
  .lidHandle.moving,
  .dialSpin.moving {
    will-change: transform;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
    border: 0;
  }

  .stars .tw {
    animation: twinkle 3.4s ease-in-out infinite;
  }
  @keyframes twinkle {
    0%,
    100% {
      opacity: 0.45;
    }
    50% {
      opacity: 1;
    }
  }
  .raynum {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 26px;
    font-weight: 500;
    font-variant-numeric: tabular-nums lining-nums;
  }

  /* pinos de palpite dos outros jogadores (online) */
  .pin {
    transform-box: fill-box;
    transform-origin: center;
    animation: pin-pop 0.45s cubic-bezier(0.18, 0.89, 0.32, 1.4) both;
  }
  @keyframes pin-pop {
    0% {
      transform: scale(0);
      opacity: 0;
    }
    60% {
      transform: scale(1.2);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pin {
      animation: none;
    }
  }

  .targetMark {
    animation: fadein 360ms ease both;
  }
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  /* o alvo "salta" ao ser revelado (sincronizado ao resultado) */
  .targetDot {
    transform-box: fill-box;
    transform-origin: center;
    animation: target-pop 0.5s cubic-bezier(0.18, 0.89, 0.32, 1.4) both;
  }
  @keyframes target-pop {
    0% {
      transform: scale(0);
    }
    60% {
      transform: scale(1.25);
    }
    100% {
      transform: scale(1);
    }
  }
</style>
