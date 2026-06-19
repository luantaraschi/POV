// Geometria do Medidor de POV.
// Semicírculo voltado para cima. p ∈ [0,100]: p=0 = extremo esquerdo, p=100 = extremo direito.
import { scoreColors } from '../design/tokens'

export const VIEW_W = 1000
export const VIEW_H = 640 // espaço extra embaixo para o disco passar do eixo (disco "redondo")
export const CX = 500
export const CY = 520
export const R_OUTER = 470 // borda do disco
export const R_FACE = 412 // face creme grande -> anel azul-noite FINO na borda (como no original)
export const R_RAY_OUTER = 416 // raios vão ATÉ a borda da face (clipados pela face -> preenchem o final)
export const R_RAY_INNER = 44 // convergem sob o eixo coral (slight overlap escondido) — "até o meio"
export const R_COVER = 416 // cobertura >= face (clipada): tapa a face INTEIRA, sem anel/linha sobrando
export const TICK_INNER = 420 // marcas das casas: no anel azul fino (fora da face)
export const TICK_OUTER = 440
export const POINTER_LEN = 360 // termina folgado antes dos números (não os tapa em ângulo nenhum)
export const HUB_R = 56

// Detentes do ponteiro: poucos, para dar sensação de roleta real
// e para que o ponteiro NUNCA pare na divisa entre faixas — sempre no centro de uma.
export const STEPS = 24
export const STEP_P = 100 / STEPS

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v))

// arco levemente "fechado" (< 180°): "V bem aberto" — os extremos sobem um tiquinho acima da
// horizontal e a placa da frente tampa o resto embaixo. A pega encaixa nessas pontas.
export const MARGIN = 0.09 // rad (~5°/lado) -> leque ~170° ("quase 100% aberto, leve ângulinho")
export const SPAN = Math.PI - 2 * MARGIN

// p (0..100) -> ângulo em radianos (MARGIN = direita, π-MARGIN = esquerda).
export const pToRad = (p: number) => MARGIN + (1 - clamp(p) / 100) * SPAN

// --- DISCO "redondo": passa abaixo do eixo (> 180°), com base curva. Só o disco navy +
// serrilhado usam isso; a face/cobertura/escala ficam no semicírculo (pToRad acima). ---
export const DISC_EXTRA = 0.2 // rad (~11.5°) que o disco desce abaixo da horizontal de cada lado
export const discAngle = (p: number) => (1 - clamp(p) / 100) * (Math.PI + 2 * DISC_EXTRA) - DISC_EXTRA
export function discPointAt(p: number, r: number): [number, number] {
  const a = discAngle(p)
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)]
}

// Ponto no medidor para uma posição p e um raio r.
export function pointAt(p: number, r: number): [number, number] {
  const a = pToRad(p)
  return [CX + r * Math.cos(a), CY - r * Math.sin(a)]
}

// Inverso: a partir de uma coordenada SVG, devolve a posição p (0..100).
export function pAtPoint(x: number, y: number): number {
  const dx = x - CX
  const dy = CY - y // para cima é positivo
  let a = Math.atan2(dy, dx) // [-π, π]
  // abaixo da linha de base: cai no extremo do LADO mais próximo (pelo sinal de dx).
  if (dy < 0) a = dx < 0 ? Math.PI - MARGIN : MARGIN
  a = Math.max(MARGIN, Math.min(Math.PI - MARGIN, a))
  return clamp(100 * (1 - (a - MARGIN) / SPAN))
}

// Encaixe na casa discreta mais próxima.
export const stepIndex = (p: number) => Math.round(clamp(p) / STEP_P)
export const snap = (p: number) => clamp(stepIndex(p) * STEP_P)

// Pontuação pela distância em DETENTES (o palpite sempre cai no centro de uma faixa).
export function scoreFor(guess: number, target: number): 0 | 2 | 3 | 4 {
  const d = Math.abs(stepIndex(guess) - stepIndex(target))
  if (d === 0) return 4
  if (d === 1) return 3
  if (d === 2) return 2
  return 0
}

// --- Construtores de path (amostragem por pontos: robusto, sem dor de cabeça com flags de arco) ---

const SAMPLES = 140

function fmt(x: number, y: number) {
  return `${x.toFixed(2)} ${y.toFixed(2)}`
}

// LEQUE preenchido de raio r: arco (extremos levantados pelo MARGIN) fechado pelo EIXO (as duas
// bordas de baixo formam o "V"). Usado na face e na cobertura.
export function halfDiskPath(r: number): string {
  let d = ''
  for (let i = 0; i <= SAMPLES; i++) {
    const p = (i / SAMPLES) * 100
    const [x, y] = pointAt(p, r)
    d += (i === 0 ? 'M ' : 'L ') + fmt(x, y)
  }
  return d + ` L ${fmt(CX, CY)} Z` // fecha pelo eixo -> leque (não corda reta)
}

// Círculo COMPLETO de raio r — o corpo do disco que gira (a metade de baixo some sob a placa).
export function fullDiskPath(r: number): string {
  let d = ''
  const N = SAMPLES * 2
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * 2 * Math.PI
    d += (i === 0 ? 'M ' : 'L ') + fmt(CX + r * Math.cos(a), CY - r * Math.sin(a))
  }
  return d + ' Z'
}

// Serrilhado em CÍRCULO COMPLETO (dentes ao redor de toda a circunferência).
export function fullScallopPath(count = 44): string {
  const SAMP = 8
  const N = count * SAMP
  let d = ''
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * 2 * Math.PI
    const phase = (i / SAMP) * Math.PI * 2 // uma onda por dente
    const k = (1 - Math.cos(phase)) / 2
    const r = R_SCALLOP_BASE + (R_SCALLOP_CREST - R_SCALLOP_BASE) * k
    d += (i === 0 ? 'M ' : 'L ') + fmt(CX + r * Math.cos(a), CY - r * Math.sin(a))
  }
  for (let i = N; i >= 0; i--) {
    const a = (i / N) * 2 * Math.PI
    d += ' L ' + fmt(CX + R_SCALLOP_INNER * Math.cos(a), CY - R_SCALLOP_INNER * Math.sin(a))
  }
  return d + ' Z'
}

// PLACA DA FRENTE: tampa tudo abaixo da linha do "V" (as duas bordas do leque estendidas até as
// laterais). Esconde a metade de baixo do disco girando, os dentes de baixo e a cobertura aberta.
export const PLATE_DROP = CX * Math.tan(MARGIN) // quanto a borda do V sobe nas laterais
export function frontPlatePath(): string {
  const yEdge = (CY - PLATE_DROP).toFixed(2)
  return `M 0 ${yEdge} L ${CX} ${CY} L ${VIEW_W} ${yEdge} L ${VIEW_W} ${VIEW_H} L 0 ${VIEW_H} Z`
}
// Região ACIMA da linha do "V" — recorta o disco que gira (a metade de baixo é escondida).
export function topClipPath(): string {
  const yEdge = (CY - PLATE_DROP).toFixed(2)
  return `M 0 0 L ${VIEW_W} 0 L ${VIEW_W} ${yEdge} L ${CX} ${CY} L 0 ${yEdge} Z`
}

// Disco "redondo": arco estendido (>180°) fechado por uma base CURVA (não reta) abaixo do eixo.
export function discDiskPath(r: number): string {
  let d = ''
  for (let i = 0; i <= SAMPLES; i++) {
    const p = (i / SAMPLES) * 100
    const [x, y] = discPointAt(p, r)
    d += (i === 0 ? 'M ' : 'L ') + fmt(x, y)
  }
  // fecha do canto direito (p=100) ao esquerdo (p=0) com uma curva que projeta a base pra baixo
  const [lx, ly] = discPointAt(0, r)
  const cornerY = CY + r * Math.sin(DISC_EXTRA)
  d += ` Q ${CX.toFixed(2)} ${(cornerY + r * 0.16).toFixed(2)} ${lx.toFixed(2)} ${ly.toFixed(2)}`
  return d + ' Z'
}

// Setor (cunha) entre pA e pB, do raio interno ao externo.
export function sectorPath(pA: number, pB: number, rInner: number, rOuter: number): string {
  const a = clamp(pA)
  const b = clamp(pB)
  if (b <= a) return ''
  const n = Math.max(2, Math.round((SAMPLES * (b - a)) / 100))
  let d = ''
  // arco externo a -> b
  for (let i = 0; i <= n; i++) {
    const p = a + ((b - a) * i) / n
    const [x, y] = pointAt(p, rOuter)
    d += (i === 0 ? 'M ' : 'L ') + fmt(x, y)
  }
  // arco interno b -> a
  for (let i = 0; i <= n; i++) {
    const p = b - ((b - a) * i) / n
    const [x, y] = pointAt(p, rInner)
    d += 'L ' + fmt(x, y)
  }
  return d + ' Z'
}

export type Wedge = { d: string; color: string; points: 2 | 3 | 4; mid: number; label: [number, number] }

// Arco entre duas posições p (liga o palpite ao alvo na revelação).
export function arcBetween(pA: number, pB: number, r: number): string {
  const a = clamp(Math.min(pA, pB))
  const b = clamp(Math.max(pA, pB))
  const n = Math.max(2, Math.round((SAMPLES * (b - a)) / 100))
  let d = ''
  for (let i = 0; i <= n; i++) {
    const p = a + ((b - a) * i) / n
    const [x, y] = pointAt(p, r)
    d += (i === 0 ? 'M ' : 'L ') + `${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return d
}

// As 5 cunhas 2-3-4-3-2 centradas no alvo.
export function wedges(target: number): Wedge[] {
  // Alinhadas à grade de detentes e centradas no detente do alvo; fronteiras em meio-passo,
  // de modo que cada detente fique exatamente no MEIO de uma faixa (nunca na divisa).
  const tP = stepIndex(target) * STEP_P
  const s = STEP_P
  const defs: Array<[number, number, string, 2 | 3 | 4]> = [
    [tP - 2.5 * s, tP - 1.5 * s, scoreColors[2], 2],
    [tP - 1.5 * s, tP - 0.5 * s, scoreColors[3], 3],
    [tP - 0.5 * s, tP + 0.5 * s, scoreColors[4], 4],
    [tP + 0.5 * s, tP + 1.5 * s, scoreColors[3], 3],
    [tP + 1.5 * s, tP + 2.5 * s, scoreColors[2], 2],
  ]
  return defs
    .map(([pa, pb, color, points]) => {
      const mid = clamp((pa + pb) / 2)
      return {
        d: sectorPath(pa, pb, R_RAY_INNER, R_RAY_OUTER),
        color,
        points,
        mid,
        label: pointAt(mid, R_RAY_OUTER - 28) as [number, number],
      }
    })
    .filter((w) => w.d !== '')
}

// Borda serrilhada como UM path contínuo (sem círculos empilhados que escurecem nas junções).
// Fica na BORDA EXTERNA (dentes brancos), com o anel azul-noite fino logo por dentro.
export const R_SCALLOP_CREST = 470 // pontas externas dos dentes
export const R_SCALLOP_BASE = 450 // vale entre dentes
export const R_SCALLOP_INNER = 444 // borda interna lisa (limite externo do anel azul fino)

// Marcas (ticks) em cada casa do ponteiro — a "régua" do mostrador.
export type Tick = { x1: number; y1: number; x2: number; y2: number; major: boolean }
export function detentTicks(): Tick[] {
  const out: Tick[] = []
  for (let i = 0; i <= STEPS; i++) {
    const p = (i / STEPS) * 100
    const [x1, y1] = pointAt(p, TICK_INNER)
    const [x2, y2] = pointAt(p, TICK_OUTER)
    out.push({ x1, y1, x2, y2, major: i % 5 === 0 })
  }
  return out
}

export function scallopRingPath(count = 22): string {
  const SAMP = 8 // amostras por dente
  const N = count * SAMP
  let d = ''
  // borda externa ondulada (esquerda→direita): raio oscila vale↔crista (cosseno)
  for (let i = 0; i <= N; i++) {
    const p = (i / N) * 100
    const phase = (i / SAMP) * Math.PI * 2 // uma onda completa por dente
    const k = (1 - Math.cos(phase)) / 2 // 0 no vale, 1 na crista
    const r = R_SCALLOP_BASE + (R_SCALLOP_CREST - R_SCALLOP_BASE) * k
    const [x, y] = discPointAt(p, r) // segue o disco redondo (estendido)
    d += (i === 0 ? 'M ' : 'L ') + `${x.toFixed(2)} ${y.toFixed(2)}`
  }
  // arco interno liso de volta (direita→esquerda) em R_SCALLOP_INNER, fechando o anel
  for (let i = 0; i <= 60; i++) {
    const p = 100 - (i / 60) * 100
    const [x, y] = discPointAt(p, R_SCALLOP_INNER)
    d += ' L ' + `${x.toFixed(2)} ${y.toFixed(2)}`
  }
  return d + ' Z'
}

// Sorteio do alvo da rodada: detente com margem ≥3 de cada ponta, para as 5 cunhas
// (2-3-4-3-2, ±2.5 detentes) caberem sem clipping. Substitui o inline do Playground.
export function drawTarget(): number {
  const ti = 3 + Math.floor(Math.random() * (STEPS - 5)) // ti ∈ [3, STEPS-3]
  return ti * STEP_P
}
