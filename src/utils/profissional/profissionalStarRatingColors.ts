export type ProfissionalStarLevel = 1 | 2 | 3 | 4 | 5

export type ProfissionalStarColorSet = {
  from: string
  to: string
  stroke: string
  starClass: string
  dotClass: string
  trackClass: string
  badgeClass: string
  ringClass: string
  topBarClass: string
}

/** 5 laranja · 4 azul · 3 amarelo · 2 transição amarelo→vermelho · 1 vermelho */
export const PROFISSIONAL_STAR_RATING_COLORS: Record<ProfissionalStarLevel, ProfissionalStarColorSet> =
  {
    5: {
      from: '#ff6b00',
      to: '#ffb347',
      stroke: '#ff6b00',
      starClass:
        'fill-orange-500 text-orange-500 drop-shadow-[0_1px_2px_rgba(255,107,0,0.4)]',
      dotClass: 'bg-orange-500',
      trackClass: 'from-orange-500 to-orange-300',
      badgeClass: 'bg-orange-500',
      ringClass: 'ring-orange-100',
      topBarClass: 'from-orange-500 via-orange-400 to-orange-300',
    },
    4: {
      from: '#2563eb',
      to: '#60a5fa',
      stroke: '#2563eb',
      starClass: 'fill-blue-500 text-blue-500 drop-shadow-[0_1px_2px_rgba(37,99,235,0.35)]',
      dotClass: 'bg-blue-500',
      trackClass: 'from-blue-500 to-blue-300',
      badgeClass: 'bg-blue-500',
      ringClass: 'ring-blue-100',
      topBarClass: 'from-blue-500 via-blue-400 to-blue-300',
    },
    3: {
      from: '#eab308',
      to: '#fde047',
      stroke: '#ca8a04',
      starClass:
        'fill-yellow-400 text-yellow-500 drop-shadow-[0_1px_2px_rgba(234,179,8,0.35)]',
      dotClass: 'bg-yellow-500',
      trackClass: 'from-yellow-400 to-yellow-300',
      badgeClass: 'bg-yellow-500',
      ringClass: 'ring-yellow-100',
      topBarClass: 'from-yellow-500 via-yellow-400 to-yellow-300',
    },
    2: {
      from: '#fbbf24',
      to: '#ef4444',
      stroke: '#f97316',
      starClass:
        'fill-orange-500 text-red-500 drop-shadow-[0_1px_2px_rgba(249,115,22,0.35)]',
      dotClass: 'bg-orange-500',
      trackClass: 'from-yellow-400 to-red-400',
      badgeClass: 'bg-orange-500',
      ringClass: 'ring-orange-100',
      topBarClass: 'from-yellow-400 via-orange-500 to-red-400',
    },
    1: {
      from: '#dc2626',
      to: '#f87171',
      stroke: '#dc2626',
      starClass: 'fill-red-500 text-red-600 drop-shadow-[0_1px_2px_rgba(220,38,38,0.35)]',
      dotClass: 'bg-red-600',
      trackClass: 'from-red-600 to-red-400',
      badgeClass: 'bg-red-600',
      ringClass: 'ring-red-100',
      topBarClass: 'from-red-600 via-red-500 to-red-400',
    },
  }

export function resolveProfissionalStarLevel(rating: number): ProfissionalStarLevel {
  return Math.min(5, Math.max(1, Math.round(rating))) as ProfissionalStarLevel
}

export function getProfissionalStarColors(rating: number): ProfissionalStarColorSet {
  return PROFISSIONAL_STAR_RATING_COLORS[resolveProfissionalStarLevel(rating)]
}

export function getProfissionalStarGradient(stars: ProfissionalStarLevel): { from: string; to: string } {
  const colors = PROFISSIONAL_STAR_RATING_COLORS[stars]
  return { from: colors.from, to: colors.to }
}
