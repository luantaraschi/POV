import { drawTarget, STEP_P } from '../meter/geometry'
import { donoIndexFor, totalRounds, maxPossibleTotal, maxPossibleSoFar, sintoniaPct, selo } from './rules'
import type { MeterState } from '../meter/Meter.svelte'

export type Screen = 'home' | 'howToPlay' | 'setup' | 'roundIntro' | 'inRound' | 'scoreboard' | 'gameOver'
export type PlayerColor = 'coral' | 'piscina' | 'lilas' | 'menta' | 'mostarda' | 'rosa' | 'laranja' | 'petroleo'
export type Player = { id: string; name: string; color: PlayerColor }
export type RoundResult = { donoId: string; cardIndex: number; target: number; value: number; score: 0 | 2 | 3 | 4 }

const CARDS = [
  { left: 'Frio', right: 'Quente' }, { left: 'Normal', right: 'Estranho' },
  { left: 'Barato', right: 'Caro' }, { left: 'Mal feito', right: 'Bem feito' },
]

function makeStore() {
  let config = $state({ players: [{ id: 'p1', name: 'Dono', color: 'coral' as PlayerColor }], voltas: 2 as 1 | 2 | 3, deck: 'classico' as const })
  let screen = $state<Screen>('inRound')
  let phase = $state<MeterState>('hidden')
  let roundIndex = $state(0)
  let target = $state(drawTarget())
  let value = $state(12 * STEP_P)
  let cardIndex = $state(0)
  let results = $state<RoundResult[]>([])

  return {
    get screen() { return screen }, set screen(s) { screen = s },
    get phase() { return phase }, set phase(p) { phase = p },
    get config() { return config },
    get target() { return target }, get cardIndex() { return cardIndex },
    get value() { return value }, set value(v) { value = v },
    get card() { return CARDS[cardIndex % CARDS.length] },
    get totalRounds() { return totalRounds(config.voltas, config.players.length) },
    get donoIndex() { return donoIndexFor(roundIndex, config.players.length) },
    get dono() { return config.players[this.donoIndex] },
    get groupScore() { return results.reduce((s, r) => s + r.score, 0) },
    get maxSoFar() { return maxPossibleSoFar(results.length) },
    get maxTotal() { return maxPossibleTotal(this.totalRounds) },
    get sintoniaPct() { return sintoniaPct(this.groupScore, this.maxSoFar) },
    get selo() { return selo(sintoniaPct(this.groupScore, this.maxTotal)) },
    get results() { return results },
    recordRound(score: 0 | 2 | 3 | 4) { results.push({ donoId: this.dono.id, cardIndex, target, value, score }) },
    nextRound() { roundIndex++; target = drawTarget(); value = 12 * STEP_P; cardIndex++; phase = 'hidden' },
    playAgain() { roundIndex = 0; results = []; target = drawTarget(); value = 12 * STEP_P; cardIndex = 0; phase = 'hidden' },
  }
}
export const game = makeStore()
