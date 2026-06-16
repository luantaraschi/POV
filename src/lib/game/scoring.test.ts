import { test, expect } from 'vitest'
import { tierCopy, tierVar } from './scoring'

test('tierCopy cobre os tiers 0/2/3/4', () => {
  for (const tier of [0, 2, 3, 4] as const) {
    expect(Array.isArray(tierCopy[tier])).toBe(true)
    expect(tierCopy[tier].length).toBeGreaterThan(0)
  }
})

test('as frases por-rodada NÃO colidem com os selos finais', () => {
  const selos = new Set(['Telepatas', 'Quase telepatas', 'Em boa sintonia', 'Pegando o ritmo', 'Frequências diferentes'])
  const phrases = Object.values(tierCopy).flat()
  for (const p of phrases) expect(selos.has(p)).toBe(false)
})

test('tierVar mapeia tier→cor', () => {
  expect(tierVar(4)).toContain('var(')
  expect(tierVar(0)).toContain('var(')
})
