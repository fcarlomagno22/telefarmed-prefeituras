import type {
  ActiveMindCategoryChip,
  ActiveMindGame,
  ActiveMindGameCategory,
} from '../types/activeMind'

export const ACTIVE_MIND_CATEGORIES: ActiveMindCategoryChip[] = [
  { id: 'all', label: 'Todos' },
  { id: 'language', label: 'Linguagem' },
  { id: 'logic', label: 'Lógica' },
  { id: 'math', label: 'Matemática' },
  { id: 'memory', label: 'Memória' },
  { id: 'numbers', label: 'Números' },
]

export const ACTIVE_MIND_GAMES: ActiveMindGame[] = [
  {
    id: 'form-the-word',
    title: 'Forme a palavra',
    subtitle: 'Vocabulário e ortografia',
    description:
      'Monte palavras com letras embaralhadas\ne treine vocabulário, ortografia e agilidade.',
    category: 'language',
    icon: 'format-letter-case',
    iconGradient: ['#fde68a', '#f59e0b', '#d97706'],
    shadowColor: 'rgba(245, 158, 11, 0.38)',
    estimatedMinutes: 5,
    difficulty: 'facil',
    status: 'available',
  },
  {
    id: 'calculations',
    title: 'Cálculos',
    subtitle: 'Raciocínio numérico',
    description:
      'Resolva operações com tempo limitado\ne treine concentração, velocidade e precisão.',
    category: 'math',
    icon: 'calculator-variant',
    iconGradient: ['#93c5fd', '#2563eb', '#1d4ed8'],
    shadowColor: 'rgba(37, 99, 235, 0.38)',
    estimatedMinutes: 5,
    difficulty: 'medio',
    status: 'available',
  },
  {
    id: 'logic-sequence',
    title: 'Sequência lógica',
    subtitle: 'Padrões e dedução',
    description:
      'Identifique o próximo item em sequências\nde formas, números ou símbolos.',
    category: 'logic',
    icon: 'flow-sequence',
    iconGradient: ['#c4b5fd', '#8b5cf6', '#6d28d9'],
    shadowColor: 'rgba(139, 92, 246, 0.38)',
    estimatedMinutes: 7,
    difficulty: 'medio',
    status: 'available',
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    subtitle: 'Lógica numérica',
    description:
      'Complete a grade de 1 a 9 sem repetir\nlinhas, colunas ou blocos. Treino de foco.',
    category: 'numbers',
    icon: 'sudoku',
    iconGradient: ['#67e8f9', '#0891b2', '#0e7490'],
    shadowColor: 'rgba(8, 145, 178, 0.38)',
    estimatedMinutes: 10,
    difficulty: 'dificil',
    status: 'available',
  },
  {
    id: 'crosswords',
    title: 'Palavras cruzadas',
    subtitle: 'Associação e cultura',
    description:
      'Preencha cruzamentos com dicas curtas\ne exercite memória verbal e concentração.',
    category: 'language',
    icon: 'crossword',
    iconGradient: ['#f9a8d4', '#f472b6', '#db2777'],
    shadowColor: 'rgba(244, 114, 182, 0.38)',
    estimatedMinutes: 12,
    difficulty: 'medio',
    status: 'available',
  },
  {
    id: 'word-search',
    title: 'Caça-palavras',
    subtitle: 'Atenção e vocabulário',
    description:
      'Encontre palavras escondidas na grade\ne treine atenção visual e concentração.',
    category: 'language',
    icon: 'word-search',
    iconGradient: ['#86efac', '#22c55e', '#15803d'],
    shadowColor: 'rgba(34, 197, 94, 0.38)',
    estimatedMinutes: 8,
    difficulty: 'facil',
    status: 'available',
  },
]

export function getActiveMindGameById(id: ActiveMindGame['id']): ActiveMindGame | undefined {
  return ACTIVE_MIND_GAMES.find((game) => game.id === id)
}

export function filterActiveMindGames(
  category: ActiveMindGameCategory,
  query: string,
): ActiveMindGame[] {
  const normalizedQuery = query.trim().toLowerCase()

  return ACTIVE_MIND_GAMES.filter((game) => {
    if (category !== 'all' && game.category !== category) {
      return false
    }

    if (!normalizedQuery) {
      return true
    }

    const haystack = [game.title, game.subtitle, game.description].join(' ').toLowerCase()
    return haystack.includes(normalizedQuery)
  })
}
