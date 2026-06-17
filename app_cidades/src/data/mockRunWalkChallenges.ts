import type { PeriodSelection } from '../types/metrics'
import { formatDateKey, formatPeriodLabel } from '../utils/metricsPeriod'
import type {
  RunWalkChallenge,
  RunWalkChallengeRankingBoard,
  RunWalkChallengeRankingEntry,
  RunWalkChallengeRankingTabId,
} from '../types/runWalkChallenges'
import { buildPeriodSelection } from '../utils/metricsPeriod'

export function buildDefaultRankingPeriod() {
  return buildPeriodSelection('month')
}

const BASE_RULES = {
  dailyLimit: 'Conta até 90 minutos por dia.',
  privacy: 'Seu nome aparece apenas para quem participa do desafio.',
  reward: 'Selo digital e destaque no painel semanal.',
}

export const MOCK_RUN_WALK_CHALLENGES: RunWalkChallenge[] = [
  {
    id: 'move-12-days',
    title: 'Movimente-se por 12 dias',
    subtitle: 'Registre atividade em 12 dias diferentes neste mês.',
    categories: ['walk', 'consistency', 'health'],
    completedUnits: 7,
    totalUnits: 12,
    unitLabel: 'dias',
    remainingDays: 14,
    participantsCount: 1284,
    rules: {
      period: '1º ao último dia do mês atual.',
      validModalities: 'Caminhada, caminhada ativa e corrida.',
      ...BASE_RULES,
      criteria: 'Cada dia com pelo menos 10 minutos ativos conta 1 dia.',
      reward: 'Selo “12 dias em movimento” + destaque no painel.',
    },
  },
  {
    id: '150-active-minutes',
    title: '150 minutos ativos por semana',
    subtitle: 'Some caminhadas e corridas ao longo da semana.',
    categories: ['active-minutes', 'health'],
    completedUnits: 96,
    totalUnits: 150,
    unitLabel: 'min',
    remainingDays: 4,
    participantsCount: 892,
    rules: {
      period: 'Segunda a domingo da semana corrente.',
      validModalities: 'Todas as modalidades de corrida e caminhada.',
      ...BASE_RULES,
      criteria: 'Minutos ativos acumulados na semana.',
    },
  },
  {
    id: 'join-4-walks',
    title: 'Participar de 4 caminhadas',
    subtitle: 'Complete quatro caminhadas registradas no app.',
    categories: ['walk', 'municipal'],
    completedUnits: 2,
    totalUnits: 4,
    unitLabel: 'caminhadas',
    remainingDays: 21,
    participantsCount: 456,
    rules: {
      period: '30 dias a partir da inscrição.',
      validModalities: 'Caminhada e caminhada ativa.',
      ...BASE_RULES,
      criteria: 'Cada caminhada concluída com no mínimo 15 minutos.',
    },
  },
  {
    id: 'walk-20km',
    title: 'Percorrer 20 km caminhando',
    subtitle: 'Acumule distância caminhando no mês.',
    categories: ['walk', 'municipal'],
    completedUnits: 12,
    totalUnits: 20,
    unitLabel: 'km',
    remainingDays: 18,
    participantsCount: 673,
    rules: {
      period: 'Mês corrente.',
      validModalities: 'Somente caminhada e caminhada ativa.',
      ...BASE_RULES,
      criteria: 'Distância total caminhada no período.',
      reward: 'Selo “Explorador a pé” no perfil.',
    },
  },
  {
    id: 'activity-30km',
    title: 'Completar 30 km em atividades',
    subtitle: 'Some caminhadas e corridas registradas.',
    categories: ['walk', 'run', 'personal'],
    completedUnits: 18,
    totalUnits: 30,
    unitLabel: 'km',
    remainingDays: 25,
    participantsCount: 531,
    rules: {
      period: '30 dias a partir da inscrição.',
      validModalities: 'Caminhada, corrida e treinos mistos.',
      ...BASE_RULES,
      criteria: 'Distância total em atividades concluídas.',
    },
  },
  {
    id: 'three-weeks-streak',
    title: 'Realizar atividades por três semanas',
    subtitle: 'Mantenha movimento por três semanas seguidas.',
    categories: ['consistency', 'health'],
    completedUnits: 2,
    totalUnits: 3,
    unitLabel: 'semanas',
    remainingDays: 12,
    participantsCount: 389,
    rules: {
      period: 'Três semanas consecutivas.',
      validModalities: 'Qualquer modalidade de corrida ou caminhada.',
      ...BASE_RULES,
      criteria: 'Pelo menos 3 dias com atividade em cada semana.',
    },
  },
  {
    id: 'five-municipal-routes',
    title: 'Conhecer cinco rotas municipais',
    subtitle: 'Visite rotas cadastradas pela prefeitura.',
    categories: ['municipal', 'walk', 'seasonal'],
    completedUnits: 1,
    totalUnits: 5,
    unitLabel: 'rotas',
    remainingDays: 28,
    participantsCount: 214,
    rules: {
      period: 'Trimestre corrente.',
      validModalities: 'Caminhada ou corrida em rotas municipais.',
      ...BASE_RULES,
      criteria: 'Check-in em rotas oficiais do município.',
      reward: 'Selo “Conhecedor da cidade”.',
    },
  },
  {
    id: 'group-walk',
    title: 'Caminhar em grupo',
    subtitle: 'Participe de caminhadas com amigos ou grupos.',
    categories: ['group', 'walk', 'neighborhood'],
    completedUnits: 0,
    totalUnits: 3,
    unitLabel: 'encontros',
    remainingDays: 30,
    participantsCount: 167,
    rules: {
      period: '30 dias a partir da inscrição.',
      validModalities: 'Caminhada em grupo (mínimo 2 participantes).',
      ...BASE_RULES,
      criteria: 'Encontros registrados com convite aceito.',
      privacy: 'Visível apenas para membros do grupo.',
    },
  },
  {
    id: 'daily-steps-goal',
    title: 'Bater 10 mil passos por dia',
    subtitle: 'Registre passos em 10 dias diferentes neste mês.',
    categories: ['steps', 'health', 'consistency'],
    completedUnits: 4,
    totalUnits: 10,
    unitLabel: 'dias',
    remainingDays: 16,
    participantsCount: 744,
    rules: {
      period: 'Mês corrente.',
      validModalities: 'Caminhada, corrida e caminhada ativa.',
      ...BASE_RULES,
      criteria: 'Dias com pelo menos 10.000 passos estimados.',
    },
  },
  {
    id: 'first-3km-run',
    title: 'Primeira corrida de 3 km',
    subtitle: 'Complete uma corrida contínua de 3 km.',
    categories: ['run', 'personal'],
    completedUnits: 0,
    totalUnits: 3,
    unitLabel: 'km',
    remainingDays: 45,
    participantsCount: 298,
    rules: {
      period: '45 dias a partir da inscrição.',
      validModalities: 'Somente corrida.',
      ...BASE_RULES,
      criteria: 'Uma atividade de corrida com pelo menos 3 km.',
      reward: 'Selo “Primeiros 3 km”.',
    },
  },
]

export function getRunWalkChallengeById(challengeId: string): RunWalkChallenge | null {
  return MOCK_RUN_WALK_CHALLENGES.find((challenge) => challenge.id === challengeId) ?? null
}

const TOP_TEN_NAMES = [
  'Lucas M.',
  'Marina S.',
  'João P.',
  'Ana L.',
  'Carlos R.',
  'Helena C.',
  'Paula V.',
  'Rafa T.',
  'Sônia G.',
  'Diego A.',
]

function buildMockAvatarUri(name: string) {
  const seed = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const imgId = (seed % 70) + 1
  return `https://i.pravatar.cc/150?img=${imgId}`
}

function getPeriodSeed(period: PeriodSelection) {
  const key = `${period.preset}:${formatDateKey(period.start)}:${formatDateKey(period.end)}`

  return key.split('').reduce((acc, char) => (acc * 33 + char.charCodeAt(0)) >>> 0, 5381)
}

function rotateNames(names: readonly string[], offset: number) {
  if (names.length === 0) return []

  const normalizedOffset = ((offset % names.length) + names.length) % names.length
  return [...names.slice(normalizedOffset), ...names.slice(0, normalizedOffset)]
}

function buildTopTen(
  names: readonly string[],
  detailForRank: (rank: number, seed: number) => string,
  scoreForRank: (rank: number, seed: number) => string,
  seed: number,
): RunWalkChallengeRankingEntry[] {
  return names.map((name, index) => {
    const rank = index + 1

    return {
      id: `top-${rank}-${seed}`,
      rank,
      name,
      detail: detailForRank(rank, seed),
      scoreLabel: scoreForRank(rank, seed),
      avatarUri: buildMockAvatarUri(name),
    }
  })
}

export function getMockChallengeRankingBoard(
  tab: RunWalkChallengeRankingTabId,
  patientName: string,
  period: PeriodSelection,
): RunWalkChallengeRankingBoard {
  const you = patientName.trim().split(/\s+/)[0] || 'Você'
  const seed = getPeriodSeed(period)
  const orderedNames = rotateNames(TOP_TEN_NAMES, seed % TOP_TEN_NAMES.length)
  const userRank = 11 + (seed % 14)

  const boards: Record<
    RunWalkChallengeRankingTabId,
    {
      top10: RunWalkChallengeRankingEntry[]
      currentUser: RunWalkChallengeRankingEntry
    }
  > = {
    consistency: {
      top10: buildTopTen(
        orderedNames,
        (rank, rankingSeed) => `${Math.max(8, 24 - rank - (rankingSeed % 4))} dias ativos`,
        (rank, rankingSeed) => `${Math.max(68, 98 - rank * 2 - (rankingSeed % 5))}%`,
        seed,
      ),
      currentUser: {
        id: 'current-user',
        rank: userRank,
        name: you,
        detail: `${Math.max(6, 16 - (seed % 6))} dias ativos`,
        scoreLabel: `${Math.max(64, 90 - (seed % 12))}%`,
        highlight: true,
      },
    },
    participation: {
      top10: buildTopTen(
        orderedNames,
        (rank, rankingSeed) => `${Math.max(2, 13 - rank - (rankingSeed % 3))} encontros`,
        (rank, rankingSeed) => `${Math.max(52, 98 - rank * 4 - (rankingSeed % 4))}%`,
        seed,
      ),
      currentUser: {
        id: 'current-user',
        rank: userRank,
        name: you,
        detail: `${Math.max(2, 5 - (seed % 3))} encontros`,
        scoreLabel: `${Math.max(48, 72 - (seed % 10))}%`,
        highlight: true,
      },
    },
    evolution: {
      top10: buildTopTen(
        orderedNames,
        (rank, rankingSeed) => `+${Math.max(6, 54 - rank * 3 - (rankingSeed % 4))} min/semana`,
        (rank, rankingSeed) => `↑ ${Math.max(6, 34 - rank * 2 - (rankingSeed % 3))}%`,
        seed,
      ),
      currentUser: {
        id: 'current-user',
        rank: userRank,
        name: you,
        detail: `+${Math.max(8, 22 - (seed % 8))} min/semana`,
        scoreLabel: `↑ ${Math.max(6, 14 - (seed % 6))}%`,
        highlight: true,
      },
    },
    'active-minutes': {
      top10: buildTopTen(
        orderedNames,
        (rank, rankingSeed) => `${Math.max(90, 248 - rank * 8 - (rankingSeed % 6))} min`,
        (rank, rankingSeed) => `${Math.max(90, 248 - rank * 8 - (rankingSeed % 6))} min`,
        seed,
      ),
      currentUser: {
        id: 'current-user',
        rank: userRank,
        name: you,
        detail: `${Math.max(80, 160 - (seed % 24))} min`,
        scoreLabel: `${Math.max(80, 160 - (seed % 24))} min`,
        highlight: true,
      },
    },
    'distance-walk': {
      top10: buildTopTen(
        orderedNames,
        () => 'Caminhada',
        (rank, rankingSeed) =>
          `${Math.max(8, 36 - rank * 1.4 - (rankingSeed % 3)).toFixed(1).replace('.', ',')} km`,
        seed,
      ),
      currentUser: {
        id: 'current-user',
        rank: userRank,
        name: you,
        detail: 'Caminhada',
        scoreLabel: `${Math.max(6, 20 - (seed % 8)).toFixed(1).replace('.', ',')} km`,
        highlight: true,
      },
    },
    'distance-run': {
      top10: buildTopTen(
        orderedNames,
        () => 'Corrida',
        (rank, rankingSeed) =>
          `${Math.max(6, 44 - rank * 1.8 - (rankingSeed % 4)).toFixed(1).replace('.', ',')} km`,
        seed,
      ),
      currentUser: {
        id: 'current-user',
        rank: userRank,
        name: you,
        detail: 'Corrida',
        scoreLabel: `${Math.max(5, 14 - (seed % 6)).toFixed(1).replace('.', ',')} km`,
        highlight: true,
      },
    },
    teams: {
      top10: buildTopTen(
        orderedNames,
        (rank, rankingSeed) => `${Math.max(8, 36 - rank - (rankingSeed % 4))} participantes`,
        (rank, rankingSeed) => `${Math.max(58, 96 - rank * 3 - (rankingSeed % 4))}%`,
        seed,
      ),
      currentUser: {
        id: 'current-user',
        rank: userRank,
        name: you,
        detail: 'Equipe Parque',
        scoreLabel: `${Math.max(58, 84 - (seed % 10))}%`,
        highlight: true,
      },
    },
    neighborhoods: {
      top10: buildTopTen(
        orderedNames,
        (rank, rankingSeed) => `${Math.max(180, 540 - rank * 18 - (rankingSeed % 20))} participantes`,
        (rank, rankingSeed) => `${Math.max(55, 93 - rank * 3 - (rankingSeed % 5))}%`,
        seed,
      ),
      currentUser: {
        id: 'current-user',
        rank: userRank,
        name: you,
        detail: 'Vila Nova',
        scoreLabel: `${Math.max(55, 82 - (seed % 8))}%`,
        highlight: true,
      },
    },
  }

  const board = boards[tab]

  return {
    periodLabel: formatPeriodLabel(period),
    top10: board.top10,
    currentUser: board.currentUser,
  }
}

/** @deprecated Use getMockChallengeRankingBoard */
export function getMockChallengeRanking(
  tab: RunWalkChallengeRankingTabId,
  patientName: string,
  period: PeriodSelection = buildDefaultRankingPeriod(),
): RunWalkChallengeRankingEntry[] {
  const board = getMockChallengeRankingBoard(tab, patientName, period)
  const userInTop10 = board.top10.some((entry) => entry.rank === board.currentUser.rank)

  if (userInTop10) {
    return board.top10.map((entry) =>
      entry.rank === board.currentUser.rank ? { ...entry, ...board.currentUser, highlight: true } : entry,
    )
  }

  return [...board.top10, board.currentUser]
}
