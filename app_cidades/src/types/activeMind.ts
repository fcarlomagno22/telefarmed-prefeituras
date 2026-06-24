export type ActiveMindGameCategory =
  | 'all'
  | 'language'
  | 'logic'
  | 'math'
  | 'memory'
  | 'numbers'

export type ActiveMindGameId =
  | 'form-the-word'
  | 'calculations'
  | 'logic-sequence'
  | 'sudoku'
  | 'crosswords'
  | 'word-search'

export type ActiveMindGameIconId =
  | 'format-letter-case'
  | 'calculator-variant'
  | 'flow-sequence'
  | 'sudoku'
  | 'crossword'
  | 'word-search'

export type ActiveMindGameStatus = 'available' | 'coming-soon'

export type ActiveMindPlayDifficulty = 'facil' | 'medio' | 'dificil'

export type ActiveMindRouteParams = {
  gameId?: ActiveMindGameId
  difficulty?: ActiveMindPlayDifficulty
}

export type ActiveMindGame = {
  id: ActiveMindGameId
  title: string
  subtitle: string
  description: string
  category: Exclude<ActiveMindGameCategory, 'all'>
  icon: ActiveMindGameIconId
  iconGradient: readonly [string, string, string]
  shadowColor: string
  estimatedMinutes: number
  difficulty: 'facil' | 'medio' | 'dificil'
  status: ActiveMindGameStatus
}

export type ActiveMindCategoryChip = {
  id: ActiveMindGameCategory
  label: string
}
