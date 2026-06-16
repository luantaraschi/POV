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

// Cunhas de pontuação (ordem canônica do Sintonia): 2 = laranja, 3 = mostarda, 4 = teal profundo.
export const scoreColors = {
  two: palette.laranja, // faixa externa (2 pts) — laranja suave
  three: palette.mostarda, // faixa intermediária (3 pts) — mostarda/ocre
  four: palette.bullseye, // mira (4 pts) — azul-teal profundo
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
