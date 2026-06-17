export type RunWalkChallengeCategoryId =
  | 'walk'
  | 'run'
  | 'active-minutes'
  | 'steps'
  | 'consistency'
  | 'personal'
  | 'municipal'
  | 'neighborhood'
  | 'group'
  | 'seasonal'
  | 'health'

export type RunWalkChallengeRankingTabId =
  | 'consistency'
  | 'participation'
  | 'evolution'
  | 'active-minutes'
  | 'distance-walk'
  | 'distance-run'
  | 'teams'
  | 'neighborhoods'

export type RunWalkChallengeRules = {
  period: string
  validModalities: string
  dailyLimit: string
  criteria: string
  privacy: string
  reward: string
}

export type RunWalkChallenge = {
  id: string
  title: string
  subtitle: string
  categories: RunWalkChallengeCategoryId[]
  completedUnits: number
  totalUnits: number
  unitLabel: string
  remainingDays: number
  participantsCount: number
  rules: RunWalkChallengeRules
}

export type RunWalkChallengeRankingEntry = {
  id: string
  rank: number
  name: string
  detail: string
  scoreLabel: string
  avatarUri?: string | null
  highlight?: boolean
}

export type RunWalkChallengeRankingBoard = {
  top10: RunWalkChallengeRankingEntry[]
  currentUser: RunWalkChallengeRankingEntry
  periodLabel: string
}

export const RUN_WALK_CHALLENGE_CATEGORIES: {
  id: RunWalkChallengeCategoryId | 'all'
  label: string
}[] = [
  { id: 'all', label: 'Todos' },
  { id: 'walk', label: 'Caminhada' },
  { id: 'run', label: 'Corrida' },
  { id: 'active-minutes', label: 'Minutos ativos' },
  { id: 'steps', label: 'Passos' },
  { id: 'consistency', label: 'Consistência' },
  { id: 'personal', label: 'Pessoais' },
  { id: 'municipal', label: 'Municipais' },
  { id: 'neighborhood', label: 'Por bairro' },
  { id: 'group', label: 'Por grupo' },
  { id: 'seasonal', label: 'Sazonais' },
  { id: 'health', label: 'Saúde e bem-estar' },
]

export const RUN_WALK_CHALLENGE_RANKING_TABS: {
  id: RunWalkChallengeRankingTabId
  label: string
  hint?: string
}[] = [
  { id: 'consistency', label: 'Consistência' },
  { id: 'participation', label: 'Participação' },
  { id: 'evolution', label: 'Evolução' },
  { id: 'active-minutes', label: 'Minutos ativos' },
  {
    id: 'distance-walk',
    label: 'Distância · caminhada',
    hint: 'Ranking separado para caminhantes.',
  },
  {
    id: 'distance-run',
    label: 'Distância · corrida',
    hint: 'Ranking separado para corredores.',
  },
  { id: 'teams', label: 'Equipes' },
  { id: 'neighborhoods', label: 'Bairros' },
]
