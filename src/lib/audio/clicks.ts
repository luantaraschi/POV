// Sons mecânicos sintetizados (Web Audio) + vibração. Sem assets — tudo gerado em runtime.
//
// Grafo: cada som -> MASTER GAIN -> LIMITER (DynamicsCompressor) -> destination.
// O limiter segura os picos quando vários ticks se sobrepõem num arraste rápido (sem clipping),
// e o master vira o único botão de volume (mute por rampa, sem estalo).
let ctx: AudioContext | null = null
let master: GainNode | null = null
let enabled = true
let hapticsEnabled = true

const MASTER_LEVEL = 0.6

function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    // grafo mestre (uma vez): gain -> limiter -> saída
    const g = ctx.createGain()
    g.gain.value = enabled ? MASTER_LEVEL : 0.0001
    const limiter = ctx.createDynamicsCompressor()
    limiter.threshold.value = -6
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.002
    limiter.release.value = 0.1
    g.connect(limiter).connect(ctx.destination)
    master = g
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

// Deve ser chamado a partir de um gesto do usuário (clique/toque) para liberar o áudio.
export function unlockAudio() {
  const c = ac()
  if (c && c.state === 'suspended') void c.resume()
}

export function setSoundEnabled(v: boolean) {
  enabled = v
  const c = ac()
  if (c && master) {
    // mute/unmute por rampa curta -> sem clique, e qualquer cauda em voo deduz suavemente
    const now = c.currentTime
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(Math.max(0.0001, master.gain.value), now)
    master.gain.linearRampToValueAtTime(v ? MASTER_LEVEL : 0.0001, now + 0.02)
  }
}

// Haptics são um canal SEPARADO do som: um jogador no mudo ainda pode querer vibração.
export function setHapticsEnabled(v: boolean) {
  hapticsEnabled = v
}

function vibrate(ms: number | number[]) {
  if (!hapticsEnabled) return
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(ms)
    } catch {
      /* ignora */
    }
  }
}

// Helper de vibração avulso — para os momentos em HTML (botões, vitória) que não têm som de dial.
export function haptic(pattern: number | number[]) {
  vibrate(pattern)
}

// ---- síntese ----

// Conecta um nó ao master, opcionalmente passando por um StereoPanner (espacializa o dial).
// Devolve o panner (p/ desconectar no onended) ou null.
function chainToMaster(node: AudioNode, c: AudioContext, pan = 0): StereoPannerNode | null {
  if (pan && typeof c.createStereoPanner === 'function') {
    const p = c.createStereoPanner()
    p.pan.value = Math.max(-1, Math.min(1, pan))
    node.connect(p).connect(master!)
    return p
  }
  node.connect(master!)
  return null
}

type BurstOpts = {
  freq: number
  q: number
  dur: number
  gain: number
  type?: BiquadFilterType
  variation?: number // 0..1 — quanto de jitter por disparo (timbre vivo, não metralhadora)
  velocity?: number // 0..1 — 1 = neutro/forte, <1 = mais suave e grave
  pan?: number // -1..1 — posição estéreo (o dial é um objeto largo no espaço)
}

// Estouro curto de ruído filtrado — um "tic" de peça plástica.
function noiseBurst(o: BurstOpts) {
  const c = ac()
  if (!c || !enabled || !master) return
  const variation = o.variation ?? 0
  const vel = o.velocity ?? 1
  const jit = (amt: number) => 1 + (Math.random() * 2 - 1) * amt * variation
  const velGain = 0.6 + 0.4 * vel // vel=1 -> 1.0, vel=0 -> 0.6
  const velFreq = 0.9 + 0.1 * vel // vel=1 -> 1.0, vel=0 -> 0.9 (mais grave/abafado quando suave)

  const freq = o.freq * jit(0.08) * velFreq
  const gain = o.gain * jit(0.12) * velGain
  const dur = Math.max(0.001, o.dur * (1 + (Math.random() * 2 - 1) * 0.1 * variation))
  const type = o.type ?? 'bandpass'

  const frames = Math.max(1, Math.floor(c.sampleRate * dur))
  const buffer = c.createBuffer(1, frames, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1

  const src = c.createBufferSource()
  src.buffer = buffer

  const filter = c.createBiquadFilter()
  filter.type = type
  filter.frequency.value = freq
  filter.Q.value = o.q

  const g = c.createGain()
  const now = c.currentTime
  g.gain.setValueAtTime(gain, now)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)

  src.connect(filter).connect(g)
  const panner = chainToMaster(g, c, o.pan ?? 0)
  src.onended = () => {
    src.disconnect()
    filter.disconnect()
    g.disconnect()
    panner?.disconnect()
  }
  src.start()
  src.stop(now + dur)
}

// Clique ao encaixar numa casa — encorpado, com corpo grave para sensação de trava.
// vel (0..1) vem da velocidade do arraste: rápido = mais forte e brilhante; lento = suave.
export function tick(vel = 1, pan = 0) {
  noiseBurst({ freq: 3400, q: 4, dur: 0.006, gain: 0.12, variation: 1, velocity: vel, pan }) // transiente crocante
  noiseBurst({ freq: 1900, q: 5, dur: 0.02, gain: 0.24, variation: 1, velocity: vel, pan }) // corpo
  noiseBurst({ freq: 320, q: 2, dur: 0.03, gain: 0.14, type: 'lowpass', variation: 1, velocity: vel, pan }) // grave (trava)
  haptic(14)
}

// Fricção: peça deslizando sobre peça (ridge curto) — disparado a cada incremento do arraste.
export function friction(vel = 1, pan = 0) {
  noiseBurst({ freq: 1300, q: 3.5, dur: 0.016, gain: 0.1, type: 'bandpass', variation: 1, velocity: vel, pan })
  noiseBurst({ freq: 420, q: 1.5, dur: 0.02, gain: 0.06, type: 'lowpass', variation: 1, velocity: vel, pan })
  haptic(4)
}

// Encaixe firme ao soltar o ponteiro / travar a cobertura.
export function thunk() {
  noiseBurst({ freq: 1100, q: 3, dur: 0.05, gain: 0.34, variation: 1 })
  noiseBurst({ freq: 260, q: 2, dur: 0.07, gain: 0.26, type: 'lowpass', variation: 1 })
  haptic(26)
}

// Catraca de roleta: UM estalo por dente cruzado. A deceleração vem da TAXA (não do volume) —
// como a palheta do "wheel of fortune": treque… treque… treque… até parar. Sem haptic por clique
// (vibração contínua viraria zumbido); o baque final fica no thunk() de quem chama.
export function ratchet(vel = 1, pan = 0) {
  noiseBurst({ freq: 3200, q: 4, dur: 0.008, gain: 0.16, variation: 1, velocity: vel, pan }) // transiente crocante
  noiseBurst({ freq: 1200, q: 3, dur: 0.015, gain: 0.12, type: 'bandpass', variation: 1, velocity: vel, pan }) // corpo (palheta)
}

// Peça deslizando (cobertura) — agora com envelope (sem clique no início) e roteada pelo master.
export function slide() {
  haptic([10, 30, 10])
  const c = ac()
  if (!c || !enabled || !master) return
  const dur = 0.32
  const frames = Math.floor(c.sampleRate * dur)
  const buffer = c.createBuffer(1, frames, c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = 700
  filter.Q.value = 1.2
  const g = c.createGain()
  const now = c.currentTime
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.16, now + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  src.connect(filter).connect(g).connect(master)
  src.onended = () => {
    src.disconnect()
    filter.disconnect()
    g.disconnect()
  }
  src.start()
  src.stop(now + dur)
}

// Riser curto de SUSPENSE quando a tampa começa a abrir. A RESOLUÇÃO vem depois, no scoreSting/
// celebrate, sincronizada ao resultado na tela (antes o acorde tocava 620ms antes do resultado).
export function reveal() {
  haptic([0, 20, 30])
  const c = ac()
  if (!c || !enabled || !master) return
  const now = c.currentTime
  const o = c.createOscillator()
  const f = c.createBiquadFilter()
  const g = c.createGain()
  o.type = 'sawtooth'
  o.frequency.setValueAtTime(180, now)
  o.frequency.exponentialRampToValueAtTime(360, now + 0.5)
  f.type = 'lowpass'
  f.frequency.setValueAtTime(500, now)
  f.frequency.exponentialRampToValueAtTime(1600, now + 0.5)
  f.Q.value = 6
  g.gain.setValueAtTime(0.0001, now)
  g.gain.exponentialRampToValueAtTime(0.06, now + 0.1)
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55)
  o.connect(f).connect(g).connect(master)
  o.onended = () => {
    o.disconnect()
    f.disconnect()
    g.disconnect()
  }
  o.start(now)
  o.stop(now + 0.6)
}

// Toque leve em botões/abas — micro-clique de plástico (o "som de botão" do brief).
export function press() {
  noiseBurst({ freq: 2200, q: 2, dur: 0.008, gain: 0.12, variation: 1 })
  noiseBurst({ freq: 520, q: 1.5, dur: 0.02, gain: 0.07, type: 'lowpass', variation: 1 })
  haptic(8)
}

// Confirmação curta e quente (ação concluída) — duas notas ascendentes.
export function confirm() {
  const c = ac()
  if (!c || !enabled || !master) return
  const now = c.currentTime
  ;[330, 494].forEach((freq, i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'triangle'
    o.frequency.value = freq
    const t0 = now + i * 0.07
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18)
    o.connect(g)
    const panner = chainToMaster(g, c, (i - 0.5) * 0.2)
    o.onended = () => {
      o.disconnect()
      g.disconnect()
      panner?.disconnect()
    }
    o.start(t0)
    o.stop(t0 + 0.2)
  })
  haptic(10)
}

// Encaixe da carta no suporte — "tok-tok" amadeirado/grave de duas camadas + batida seca da borda.
export function dock() {
  noiseBurst({ freq: 240, q: 2, dur: 0.05, gain: 0.3, type: 'lowpass', variation: 1 })
  noiseBurst({ freq: 180, q: 1.6, dur: 0.07, gain: 0.22, type: 'lowpass', variation: 1 })
  noiseBurst({ freq: 1400, q: 3, dur: 0.008, gain: 0.06, variation: 1 })
  haptic(20)
}

// Sting de pontuação por faixa (toca quando o resultado aparece na tela).
// 4 = tríade brilhante; 3 = duas notas; 2 = uma nota quente; 0 = "womp" grave e dessintonizado.
export function scoreSting(tier: 0 | 2 | 3 | 4) {
  const c = ac()
  if (!c || !enabled || !master) return
  const now = c.currentTime
  const sets: Record<0 | 2 | 3 | 4, { notes: number[]; type: OscillatorType; detune: number }> = {
    4: { notes: [523.25, 659.25, 783.99], type: 'triangle', detune: 0 },
    3: { notes: [523.25, 659.25], type: 'triangle', detune: 0 },
    2: { notes: [440], type: 'triangle', detune: 0 },
    0: { notes: [196, 185], type: 'sawtooth', detune: -14 },
  }
  const s = sets[tier]
  s.notes.forEach((freq, i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = s.type
    o.frequency.value = freq
    o.detune.value = s.detune
    const t0 = now + i * 0.08
    const peak = tier === 0 ? 0.12 : 0.16
    const tail = tier === 0 ? 0.5 : 0.4
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + tail)
    o.connect(g)
    const pan = s.notes.length > 1 ? (i - (s.notes.length - 1) / 2) * 0.4 : 0
    const panner = chainToMaster(g, c, pan)
    o.onended = () => {
      o.disconnect()
      g.disconnect()
      panner?.disconnect()
    }
    o.start(t0)
    o.stop(t0 + tail + 0.1)
  })
  haptic(tier === 4 ? [0, 40, 40, 60] : tier === 0 ? 30 : 18)
}

// Celebração do acerto perfeito — arpejo ascendente + brilho, sincronizado ao confete.
export function celebrate() {
  const c = ac()
  if (!c || !enabled || !master) return
  const now = c.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
  notes.forEach((freq, i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'triangle'
    o.frequency.value = freq
    o.detune.value = (Math.random() * 2 - 1) * 6
    const t0 = now + i * 0.05
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(0.14, t0 + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.4)
    o.connect(g)
    const panner = chainToMaster(g, c, (i - (notes.length - 1) / 2) * 0.2)
    o.onended = () => {
      o.disconnect()
      g.disconnect()
      panner?.disconnect()
    }
    o.start(t0)
    o.stop(t0 + 0.45)
  })
  noiseBurst({ freq: 6000, q: 1.2, dur: 0.25, gain: 0.04, type: 'highpass' }) // shimmer agudo
  haptic([0, 40, 40, 60])
}
