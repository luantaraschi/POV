// Estrelas do disco azul-noite (CÍRCULO COMPLETO) do medidor. RNG com seed fixa => layout estável.
import { CX, CY, R_SCALLOP_INNER } from './geometry'

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Star = { x: number; y: number; r: number; o: number; tw: boolean }

// Estrelas espalhadas pelo disco INTEIRO (gira junto; o centro-topo fica coberto pela face creme,
// a metade de baixo pela placa da frente). Seed fixa => mesmo céu na placa e no disco (sem emenda).
export function rimStars(count = 130, seed = 7): Star[] {
  const rnd = mulberry32(seed)
  const inner = 70
  const span = R_SCALLOP_INNER - inner - 6
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    const a = rnd() * 2 * Math.PI // círculo completo
    const r = inner + rnd() * span
    const o = 0.3 + rnd() * 0.65
    stars.push({
      x: CX + r * Math.cos(a),
      y: CY - r * Math.sin(a),
      r: 0.7 + rnd() * 1.6,
      o,
      tw: o > 0.82,
    })
  }
  return stars
}
