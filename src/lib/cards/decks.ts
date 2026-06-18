// Baralhos de cartas do POV. Cada carta é um ESPECTRO entre dois polos: o Dono descreve
// algo (objeto, situação, referência) e o grupo adivinha onde cai entre os extremos.
// Cores: polos iconográficos têm cor própria (lc/rc); o resto usa a rotação PAIRS (sempre
// bonita e variada). A cor do texto sobre a metade é resolvida no Card.svelte por luminância.
import { palette, type ColorName } from '../design/tokens'

export type Card = { left: string; right: string; lc?: ColorName; rc?: ColorName }
export type DeckId = 'classico' | 'moderno' | 'misto'

// Pares de cor agradáveis (esquerda → direita) para cartas sem cor própria.
const PAIRS: [ColorName, ColorName][] = [
  ['piscina', 'coral'],
  ['menta', 'mostarda'],
  ['lilas', 'laranja'],
  ['creme', 'petroleo'],
  ['rosa', 'piscina'],
  ['mostarda', 'lilas'],
  ['menta', 'coral'],
  ['laranja', 'piscina'],
  ['petroleo', 'rosa'],
  ['coral', 'menta'],
]

// Resolve as cores hex de uma carta (usa lc/rc se houver, senão um par da rotação pelo índice).
export function cardColors(globalIndex: number, card: Card): { lc: string; rc: string } {
  if (card.lc && card.rc) return { lc: palette[card.lc], rc: palette[card.rc] }
  const [l, r] = PAIRS[((globalIndex % PAIRS.length) + PAIRS.length) % PAIRS.length]
  return { lc: palette[l], rc: palette[r] }
}

// ── CLÁSSICO ── espectros amplos e seguros, no espírito do Sintonia. ──────────────
export const CLASSICO: Card[] = [
  { left: 'Frio', right: 'Quente', lc: 'piscina', rc: 'coral' },
  { left: 'Barato', right: 'Caro', lc: 'menta', rc: 'mostarda' },
  { left: 'Normal', right: 'Estranho', lc: 'creme', rc: 'lilas' },
  { left: 'Fácil', right: 'Difícil' },
  { left: 'Feio', right: 'Bonito' },
  { left: 'Seguro', right: 'Arriscado' },
  { left: 'Não saudável', right: 'Saudável' },
  { left: 'Comum', right: 'Raro' },
  { left: 'Inútil', right: 'Útil' },
  { left: 'Fraco', right: 'Forte' },
  { left: 'Devagar', right: 'Rápido' },
  { left: 'Silencioso', right: 'Barulhento' },
  { left: 'Velho', right: 'Novo' },
  { left: 'Minúsculo', right: 'Gigante' },
  { left: 'Simples', right: 'Complexo' },
  { left: 'Chato', right: 'Divertido' },
  { left: 'Leve', right: 'Pesado' },
  { left: 'Perto', right: 'Longe' },
  { left: 'Seco', right: 'Molhado' },
  { left: 'Suave', right: 'Intenso' },
  { left: 'Infantil', right: 'Adulto' },
  { left: 'Pobre', right: 'Rico' },
  { left: 'Subestimado', right: 'Superestimado' },
  { left: 'Temporário', right: 'Eterno' },
  { left: 'Realista', right: 'Fantasioso' },
  { left: 'Saideira', right: 'Vou ficar até o fim' },
]

// ── MODERNO / ENGRAÇADO ── situacionais brasileiros: descreva uma situação e adivinhem
// onde cai. (O Dono explica algo; o grupo julga "o quão...".) ──────────────────────
export const MODERNO: Card[] = [
  { left: 'Inocente', right: 'Traição', lc: 'menta', rc: 'coral' },
  { left: 'Red flag', right: 'Green flag', lc: 'coral', rc: 'menta' },
  { left: 'De boa', right: 'Treta', lc: 'menta', rc: 'coral' },
  { left: 'Mico', right: 'Lendário' },
  { left: 'Tranquilo', right: 'Cancelável' },
  { left: 'Brega', right: 'Chique' },
  { left: 'Pão-duro', right: 'Gastão' },
  { left: 'Cringe', right: 'Icônico' },
  { left: 'Furada', right: 'Vale a pena' },
  { left: 'Climão', right: 'Climinha bom' },
  { left: 'Floparia', right: 'Viralizaria' },
  { left: 'Cafona', right: 'Estiloso' },
  { left: 'Tranquilo no date', right: 'Inaceitável no date' },
  { left: 'Exagero', right: 'Justo' },
  { left: 'Nada a ver', right: 'Faz total sentido' },
  { left: 'Discreto', right: 'Stalkeável' },
  { left: 'Básico', right: 'Extravagante' },
  { left: 'Vergonha alheia', right: 'Respeito' },
  { left: 'Forçado', right: 'Natural' },
  { left: 'Overrated', right: 'Merece o hype' },
  { left: 'Antiquado', right: 'Futurista' },
  { left: 'Tô de boa', right: 'Tô passando mal' },
  { left: 'Pra zoeira', right: 'Pra levar a sério' },
  { left: 'Roubada', right: 'Negócio do ano' },
  { left: 'Constrangedor', right: 'Charmoso' },
  { left: 'Preguiça', right: 'Bora pra night' },
  { left: 'Mão de vaca', right: 'Pai/mãe de todos' },
  { left: 'Sai dessa', right: 'Casa com a pessoa' },
]

export const decks: Record<DeckId, { label: string; cards: Card[] }> = {
  classico: { label: 'Clássico', cards: CLASSICO },
  moderno: { label: 'Moderno', cards: MODERNO },
  misto: { label: 'Misto', cards: [...CLASSICO, ...MODERNO] },
}

export const DECK_IDS: DeckId[] = ['classico', 'moderno', 'misto']
