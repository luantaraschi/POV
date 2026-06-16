import { test, expect } from 'vitest'
import { drawTarget, STEPS, STEP_P, stepIndex, scoreFor } from './geometry'

test('drawTarget cai na grade de detentes com margem ≥3 (cunhas não clipam)', () => {
  for (let i = 0; i < 500; i++) {
    const t = drawTarget()
    const idx = stepIndex(t)
    expect(idx).toBeGreaterThanOrEqual(3)
    expect(idx).toBeLessThanOrEqual(STEPS - 3)
    expect(t).toBeCloseTo(idx * STEP_P, 6) // já está "snapado"
  }
})

test('scoreFor nunca retorna 1 (sanity)', () => {
  const vals = new Set<number>()
  for (let g = 0; g <= 24; g++) vals.add(scoreFor(g * STEP_P, 12 * STEP_P))
  expect(vals.has(1 as never)).toBe(false)
  expect([...vals].every((v) => [0, 2, 3, 4].includes(v))).toBe(true)
})
