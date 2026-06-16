import { test, expect, describe } from 'vitest'
import {
  VOLTAS, totalRounds, donoIndexFor, nextDonoIndex,
  maxPossibleTotal, maxPossibleSoFar, sintoniaPct, selo, type Selo,
} from './rules'

describe('totais e rodízio', () => {
  test('totalRounds = voltas × jogadores', () => {
    expect(totalRounds(2, 4)).toBe(8)
    expect(totalRounds(1, 2)).toBe(2)
    expect(totalRounds(3, 8)).toBe(24)
  })
  test('donoIndexFor cicla pela ordem e cobre cada jogador `voltas` vezes', () => {
    const n = 4
    const seen = Array.from({ length: totalRounds(2, n) }, (_, r) => donoIndexFor(r, n))
    expect(seen).toEqual([0, 1, 2, 3, 0, 1, 2, 3])
  })
  test('nextDonoIndex envolve no fim', () => {
    expect(nextDonoIndex(3, 4)).toBe(0)
    expect(nextDonoIndex(0, 4)).toBe(1)
  })
})

describe('pontuação acumulada', () => {
  test('maxPossibleTotal e maxPossibleSoFar são grandezas diferentes', () => {
    expect(maxPossibleTotal(8)).toBe(32)
    expect(maxPossibleSoFar(3)).toBe(12)
  })
  test('sintoniaPct é inteiro arredondado', () => {
    expect(sintoniaPct(10, 12)).toBe(83)
    expect(sintoniaPct(26, 32)).toBe(81)
    expect(sintoniaPct(0, 4)).toBe(0)
  })
})

describe('selos (faixas exaustivas, sem buraco/sobreposição)', () => {
  const cases: Array<[number, Selo]> = [
    [100, 'Telepatas'], [90, 'Telepatas'],
    [89, 'Quase telepatas'], [75, 'Quase telepatas'],
    [74, 'Em boa sintonia'], [50, 'Em boa sintonia'],
    [49, 'Pegando o ritmo'], [25, 'Pegando o ritmo'],
    [24, 'Frequências diferentes'], [0, 'Frequências diferentes'],
  ]
  for (const [pct, expected] of cases) {
    test(`${pct}% → ${expected}`, () => expect(selo(pct)).toBe(expected))
  }
})
