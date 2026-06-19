import { describe, it, expect } from 'vitest'
import { playerColors, scoreColors } from './tokens'

describe('tokens', () => {
  it('expõe 8 cores de jogador com hex válido', () => {
    const names = Object.keys(playerColors)
    expect(names).toHaveLength(8)
    for (const hex of Object.values(playerColors)) {
      expect(hex).toMatch(/^#[0-9a-fA-F]{6}$/)
    }
  })
  it('mapeia score 2/3/4 para cores', () => {
    expect(scoreColors[2]).toMatch(/^#/)
    expect(scoreColors[3]).toMatch(/^#/)
    expect(scoreColors[4]).toMatch(/^#/)
  })
})
