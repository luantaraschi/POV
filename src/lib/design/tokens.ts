// Paleta retrô-psicodélica do POV, retunada para o "dusty-saturado" do Sintonia
// (espelha as variáveis CSS em app.css). Hexes usados também no SVG via JS.
export const palette = {
  night: '#16294e',
  petroleo: '#1b5a72',
  piscina: '#4ea7c4',
  creme: '#f1e6cb',
  offwhite: '#f7f1e3',
  coral: '#e25744',
  mostarda: '#e8b24a',
  laranja: '#e57a37',
  menta: '#93cfa9',
  rosa: '#e7aebf',
  lilas: '#b3a0dd',
  black: '#0a1320',

  // tons de material (luz/sombra) e cores de cena
  coralHi: '#ff7d63',
  coralLo: '#a8302a',
  coralSkirt: '#7d1f1b',
  cremeHi: '#fbf5e6',
  cremeLo: '#ddceac',
  bullseye: '#1f6f8b',
  console: '#1a3358',
  consoleLo: '#102240',
  brass: '#cda253',
} as const

export type ColorName = keyof typeof palette

// ── Paleta-acento retrô (igual nos dois temas) ──────────────────────────────
// Espelha os tokens CSS --red/--teal/--sage/--mustard/--pink/--coral/--navy/--cream.
// ATENÇÃO: app.css é a fonte canônica dessas cores; esses hex devem ser mantidos
// em sincronia manualmente. Duplicação intencional: SVG inline e canvas precisam
// de hex via JS (não conseguem ler custom properties CSS diretamente).
export const accent = {
  red: '#dd3b2e', teal: '#56b0aa', sage: '#8fce9f',
  mustard: '#e0a92e', pink: '#e7a6bf', coral: '#e8674a',
  navy: '#1b2350', cream: '#efe6cf',
} as const

// ── Cores de identidade do jogador (8 nomes canônicos, hex retrô) ─────────
// Alvo: substituir a união do store (type PlayerColor) e os usos de `palette` em
// PlayerToken, Setup e Profile nas próximas tasks. Por ora é a referência canônica;
// os componentes ainda consomem `palette` diretamente.
export const playerColors = {
  coral: '#e8674a', piscina: '#56b0aa', menta: '#8fce9f', mostarda: '#e0a92e',
  rosa: '#e7a6bf', lilas: '#9a86c4', laranja: '#e0892e', petroleo: '#2f6f74',
} as const

export type PlayerColorName = keyof typeof playerColors

// ── Cunhas de pontuação (chaves numéricas: 2/3/4) ───────────────────────────
// Faixa externa = 2 pts (laranja), intermediária = 3 (mostarda), mira = 4 (teal).
export const scoreColors = {
  2: '#e0892e', // laranja retrô
  3: '#e0a92e', // mostarda retrô
  4: '#2f6f74', // petróleo retrô (mira)
} as const

// Tratamentos visuais para comparar no playground (híbrido tátil + ilustrado é o padrão).
export type Treatment = 'hibrido' | 'ilustrado'

export const treatments: Record<
  Treatment,
  { label: string; faceTop: string; depth: number; grain: number; gloss: number }
> = {
  hibrido: {
    label: 'Híbrido tátil + ilustrado',
    faceTop: palette.creme, // tom médio da face (cream-hi/lo entram no gradiente)
    depth: 1, // intensidade das sombras/profundidade
    grain: 0.5,
    gloss: 0.6,
  },
  ilustrado: {
    label: 'Ilustrado retrô (pôster)',
    faceTop: palette.creme,
    depth: 0.35,
    grain: 0.95,
    gloss: 0.15,
  },
}
