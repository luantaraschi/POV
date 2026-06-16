import { drawTarget, STEP_P } from '../meter/geometry'
import { donoIndexFor, totalRounds, maxPossibleTotal, maxPossibleSoFar, sintoniaPct, selo, isLastRound } from './rules'
import { setSoundEnabled } from '../audio/clicks'
import type { MeterState } from '../meter/Meter.svelte'

export type Screen = 'home' | 'howToPlay' | 'setup' | 'roundIntro' | 'inRound' | 'scoreboard' | 'gameOver'
export type PlayerColor = 'coral' | 'piscina' | 'lilas' | 'menta' | 'mostarda' | 'rosa' | 'laranja' | 'petroleo'
export type Player = { id: string; name: string; color: PlayerColor }
export type RoundResult = { donoId: string; cardIndex: number; target: number; value: number; score: 0 | 2 | 3 | 4 }

const CARDS = [
  { left: 'Frio', right: 'Quente' }, { left: 'Normal', right: 'Estranho' },
  { left: 'Barato', right: 'Caro' }, { left: 'Mal feito', right: 'Bem feito' },
]

function initTheme(): 'dark' | 'light' {
  if (typeof localStorage !== 'undefined') {
    const s = localStorage.getItem('pov-theme'); if (s === 'dark' || s === 'light') return s
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

function makeStore() {
  let config = $state({ players: [{ id: 'p1', name: 'Dono', color: 'coral' as PlayerColor }], voltas: 2 as 1 | 2 | 3, deck: 'classico' as const })
  let screen = $state<Screen>('home')
  let phase = $state<MeterState>('hidden')
  let roundIndex = $state(0)
  let target = $state(drawTarget())
  let value = $state(12 * STEP_P)
  let cardIndex = $state(0)
  let results = $state<RoundResult[]>([])
  let theme = $state<'dark' | 'light'>(initTheme())
  let sound = $state(true)

  return {
    get screen() { return screen }, set screen(s) { screen = s },
    get phase() { return phase }, set phase(p) { phase = p },
    get config() { return config },
    get roundIndex() { return roundIndex },
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
    get theme() { return theme },
    get sound() { return sound },
    toggleTheme() { theme = theme === 'dark' ? 'light' : 'dark'; if (typeof localStorage !== 'undefined') localStorage.setItem('pov-theme', theme) },
    toggleSound() { sound = !sound; setSoundEnabled(sound) },
    goHome() { screen = 'home' },
    openSetup() { screen = 'setup' },
    setupGame(players: Player[], voltas: 1 | 2 | 3, deck: 'classico' = 'classico') {
      config = { players, voltas, deck }
      roundIndex = 0; results = []
      target = drawTarget(); value = 12 * STEP_P; cardIndex = 0; phase = 'hidden'
      screen = 'roundIntro'
    },
    beginPeek() { phase = 'peek'; screen = 'inRound' },
    toScoreboard() { screen = 'scoreboard' },
    advance() {
      if (isLastRound(roundIndex, this.totalRounds)) { screen = 'gameOver' }
      else { this.nextRound(); screen = 'roundIntro' }
    },
    changePlayers() { screen = 'setup' },
    recordRound(score: 0 | 2 | 3 | 4) { results.push({ donoId: this.dono.id, cardIndex, target, value, score }) },
    nextRound() { roundIndex++; target = drawTarget(); value = 12 * STEP_P; cardIndex++; phase = 'hidden' },
    playAgain() { roundIndex = 0; results = []; target = drawTarget(); value = 12 * STEP_P; cardIndex = 0; phase = 'hidden'; screen = 'roundIntro' },
  }
}
export const game = makeStore()
