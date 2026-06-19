export const STEPS = 24
export const STEP_P = 100 / STEPS
export const CONNECTED_MS = 15000
export const now = () => Date.now()

export function genCode(): string {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // sem 0/O/1/I/L ambíguos
  let s = ''
  for (let i = 0; i < 5; i++) s += A[Math.floor(Math.random() * A.length)]
  return s
}

export function shuffledOrder(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function drawTarget(): number {
  const ti = 3 + Math.floor(Math.random() * (STEPS - 5)) // ti ∈ [3, STEPS-3]
  return ti * STEP_P
}

const stepIndex = (p: number) => Math.round(p / STEP_P)

export function scoreFor(guess: number, target: number): 0 | 2 | 3 | 4 {
  const d = Math.abs(stepIndex(guess) - stepIndex(target))
  return d === 0 ? 4 : d === 1 ? 3 : d === 2 ? 2 : 0
}
