import { describe, it, expect } from 'vitest'
import { breakdownRows } from './breakdown'

describe('breakdownRows', () => {
  it('mapeia results em linhas {round, score}', () => {
    const rows = breakdownRows([{ score: 4 } as any, { score: 2 } as any])
    expect(rows).toEqual([{ round: 1, score: 4 }, { round: 2, score: 2 }])
  })
  it('lista vazia => []', () => {
    expect(breakdownRows([])).toEqual([])
  })
})
