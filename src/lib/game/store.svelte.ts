import { drawTarget, STEP_P } from '../meter/geometry'
import { donoIndexFor, totalRounds, maxPossibleTotal, maxPossibleSoFar, sintoniaPct, selo, isLastRound } from './rules'
import { setSoundEnabled, setHapticsEnabled } from '../audio/clicks'
import type { MeterState } from '../meter/Meter.svelte'
import { decks, cardColors, type DeckId } from '../cards/decks'

export type Screen = 'lobby' | 'howToPlay' | 'online' | 'setup' | 'inRound' | 'gameOver'
export type PlayerColor = 'coral' | 'piscina' | 'lilas' | 'menta' | 'mostarda' | 'rosa' | 'laranja' | 'petroleo'
export type Player = { id: string; name: string; color: PlayerColor }
export type RoundResult = { donoId: string; cardIndex: number; target: number; value: number; score: 0 | 2 | 3 | 4 }

function initTheme(): 'dark' | 'light' {
  if (typeof localStorage !== 'undefined') {
    const s = localStorage.getItem('pov-theme'); if (s === 'dark' || s === 'light') return s
  }
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

function makeStore() {
  let config = $state<{ players: Player[]; voltas: 1 | 2 | 3; deck: DeckId }>({ players: [{ id: 'p1', name: 'Dono', color: 'coral' as PlayerColor }], voltas: 2, deck: 'classico' })
  let screen = $state<Screen>('lobby')
  let phase = $state<MeterState>('hidden')
  let roundIndex = $state(0)
  let target = $state(drawTarget())
  let value = $state(12 * STEP_P)
  let cardIndex = $state(0)
  let cardOrder = $state<number[]>([])
  let cardPos = $state(0)
  let results = $state<RoundResult[]>([])
  let theme = $state<'dark' | 'light'>(initTheme())
  let sound = $state(true)
  let haptics = $state(true)
  // contador reativo: bumpado ao salvar o perfil para o chip do TopBar / prévia do Lobby
  // (que leem getProfile() de forma não-reativa) reagirem e re-lerem o localStorage.
  let profileVersion = $state(0)
  // ProfileSheet é global (montado no Shell); estado de abertura no store para abrir de qualquer
  // lugar (chip do lobby via TopBar, ou onboarding do fluxo online).
  let profileOpen = $state(false)

  let reduce = $state(false)
  if (typeof window !== 'undefined' && window.matchMedia) {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    reduce = mq.matches
    mq.addEventListener('change', () => (reduce = mq.matches))
  }

  let returnScreen = $state<Screen>('lobby')

  function shuffleDeck(avoidFirst?: number) {
    const n = decks[config.deck].cards.length
    const arr = Array.from({ length: n }, (_, i) => i)
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]] }
    // na virada do baralho, não deixa a 1ª carta do novo ciclo ser a mesma que acabou de sair
    if (n > 1 && avoidFirst !== undefined && arr[0] === avoidFirst) { [arr[0], arr[1]] = [arr[1], arr[0]] }
    cardOrder = arr
  }

  return {
    get screen() { return screen }, set screen(s) { screen = s },
    get phase() { return phase }, set phase(p) { phase = p },
    get config() { return config },
    get roundIndex() { return roundIndex },
    get target() { return target }, get cardIndex() { return cardIndex },
    get value() { return value }, set value(v) { value = v },
    get card() {
      const deck = decks[config.deck]
      const idx = cardOrder.length ? cardOrder[cardPos % cardOrder.length] : 0
      const c = deck.cards[idx]
      const { lc, rc } = cardColors(idx, c)
      return { left: c.left, right: c.right, lc, rc }
    },
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
    get haptics() { return haptics },
    get reduce() { return reduce },
    get profileVersion() { return profileVersion },
    bumpProfile() { profileVersion++ },
    get profileOpen() { return profileOpen },
    openProfile() { profileOpen = true },
    closeProfile() { profileOpen = false },
    get returnScreen() { return returnScreen },
    toggleTheme() { theme = theme === 'dark' ? 'light' : 'dark'; if (typeof localStorage !== 'undefined') localStorage.setItem('pov-theme', theme) },
    toggleSound() { sound = !sound; setSoundEnabled(sound) },
    toggleHaptics() { haptics = !haptics; setHapticsEnabled(haptics) },
    goHome() { screen = 'lobby' },
    openSetup() { screen = 'setup' },
    openOnline() { screen = 'online' },
    openHowToPlay() { returnScreen = screen; screen = 'howToPlay' },
    closeHowToPlay() { screen = returnScreen },
    setupGame(players: Player[], voltas: 1 | 2 | 3, deck: DeckId = 'classico') {
      config = { players, voltas, deck }
      roundIndex = 0; results = []
      shuffleDeck(); cardPos = 0; cardIndex = 0
      target = drawTarget(); value = 12 * STEP_P; phase = 'hidden'
      // a primeira rodada já começa NO medidor; o overlay de privacidade aparece pq phase='hidden'
      screen = 'inRound'
    },
    beginPeek() { phase = 'peek'; screen = 'inRound' },
    // revelação concluída -> próxima rodada NO MESMO medidor (ou fim de jogo na última)
    advanceFromReveal() {
      if (isLastRound(roundIndex, this.totalRounds)) { screen = 'gameOver' }
      else { this.nextRound() } // nextRound já faz roundIndex++, novo alvo/carta, value reset, phase='hidden'; screen continua 'inRound'
    },
    changePlayers() { screen = 'setup' },
    recordRound(score: 0 | 2 | 3 | 4) { results.push({ donoId: this.dono.id, cardIndex, target, value, score }) },
    nextRound() {
      roundIndex++; target = drawTarget(); value = 12 * STEP_P; phase = 'hidden'
      cardIndex++
      cardPos++
      if (cardPos >= cardOrder.length) { shuffleDeck(cardOrder[cardOrder.length - 1]); cardPos = 0 }
    },
    playAgain() { roundIndex = 0; results = []; shuffleDeck(); cardPos = 0; cardIndex = 0; target = drawTarget(); value = 12 * STEP_P; phase = 'hidden'; screen = 'inRound' },
  }
}
export const game = makeStore()
