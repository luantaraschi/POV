// Lógica pura da partida cooperativa local. Sem runes — testável isoladamente.

export const VOLTAS = { curta: 1, media: 2, longa: 3 } as const
export type Voltas = 1 | 2 | 3

export const totalRounds = (voltas: number, players: number) => voltas * players
export const donoIndexFor = (roundIndex: number, players: number) => roundIndex % players
export const nextDonoIndex = (donoIndex: number, players: number) => (donoIndex + 1) % players

export const maxPossibleTotal = (rounds: number) => rounds * 4
export const maxPossibleSoFar = (resultsCount: number) => resultsCount * 4
export const sintoniaPct = (score: number, max: number) => (max <= 0 ? 0 : Math.round((100 * score) / max))

export type Selo = 'Telepatas' | 'Quase telepatas' | 'Em boa sintonia' | 'Pegando o ritmo' | 'Frequências diferentes'
export function selo(pct: number): Selo {
  if (pct >= 90) return 'Telepatas'
  if (pct >= 75) return 'Quase telepatas'
  if (pct >= 50) return 'Em boa sintonia'
  if (pct >= 25) return 'Pegando o ritmo'
  return 'Frequências diferentes'
}

export const isLastRound = (roundIndex: number, totalRounds: number) => roundIndex >= totalRounds - 1
