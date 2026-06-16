// Cópia e cor da pontuação POR RODADA (distinta dos selos finais em rules.ts).
export const tierCopy: Record<0 | 2 | 3 | 4, string[]> = {
  4: ['Na mesma frequência!', 'Sintonia perfeita.', 'Leu a mente, hein?'],
  3: ['Quase perfeito.', 'Faltou um triz.', 'Quase na mosca.'],
  2: ['Chegaram perto.', 'Tá na vibe.', 'No caminho certo.'],
  0: ['Fora de sintonia.', 'Outro universo, hein?', 'Frequências opostas.'],
}

export function tierVar(tier: 0 | 2 | 3 | 4): string {
  return tier === 4 ? 'var(--pov-bullseye)'
    : tier === 3 ? 'var(--pov-mostarda)'
    : tier === 2 ? 'var(--pov-laranja)'
    : 'var(--pov-coral)'
}
