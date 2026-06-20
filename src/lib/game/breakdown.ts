import type { RoundResult } from './store.svelte'

export type BreakdownRow = { round: number; score: 0 | 2 | 3 | 4 }

/**
 * Converte a lista de resultados de rodadas em linhas para o pôster de fim de jogo.
 * Cada linha tem o número da rodada (base 1) e o score obtido.
 */
export function breakdownRows(results: Pick<RoundResult, 'score'>[]): BreakdownRow[] {
  return results.map((r, i) => ({ round: i + 1, score: r.score }))
}
