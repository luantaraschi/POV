import { describe, it, expect } from 'vitest'
import { game } from './store.svelte'

describe('roteamento do lobby', () => {
  it('inicia no lobby', () => {
    expect(game.screen).toBe('lobby')
  })
  it('goHome volta ao lobby', () => {
    game.openOnline(); expect(game.screen).toBe('online')
    game.goHome(); expect(game.screen).toBe('lobby')
  })
  it('openSetup vai para setup', () => {
    game.openSetup(); expect(game.screen).toBe('setup'); game.goHome()
  })
})
