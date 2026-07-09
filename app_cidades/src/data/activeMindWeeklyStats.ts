import { isActiveMindApiEnabled } from '../config/activeMindApi'
import { getActiveMindGameById } from '../config/activeMindGames'
import {
  getActiveMindWeeklyStats,
  type WeeklyActiveMindStatsDto,
} from '../lib/api/vd/activeMind'
import type { ActiveMindGameId } from '../types/activeMind'
import type { ActiveMindSession } from '../types/activeMindSession'
import { getWeekStartIso } from '../utils/myRoutinePlanEngine'
import { loadSessions } from './activeMindSessionStorage'

export type ActiveMindWeeklyStats = {
  totalSessions: number
  totalMinutes: number
  topGameId: ActiveMindGameId | null
  topGameTitle: string | null
  weekStartIso: string
  weekEndIso: string
}

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function shouldUseActiveMindApi(patientCpf: string) {
  return isActiveMindApiEnabled() && !isGuestPatient(patientCpf)
}

/** Segunda 00:00 local → domingo 23:59:59.999 local (ISO). */
function resolveLocalWeekBounds(referenceDate = new Date()) {
  const weekStartDate = getWeekStartIso(referenceDate)
  const start = new Date(`${weekStartDate}T00:00:00`)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return {
    weekStartDate,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
  }
}

function resolveTopGame(byGame: { gameId: ActiveMindGameId; count: number }[]) {
  const top = byGame.find((item) => item.count > 0) ?? null
  if (!top) {
    return { topGameId: null as ActiveMindGameId | null, topGameTitle: null as string | null }
  }

  return {
    topGameId: top.gameId,
    topGameTitle: getActiveMindGameById(top.gameId)?.title ?? top.gameId,
  }
}

function mapDtoToWeeklyStats(dto: WeeklyActiveMindStatsDto): ActiveMindWeeklyStats {
  const top = resolveTopGame(dto.byGame)

  return {
    totalSessions: dto.totalSessions,
    totalMinutes: Math.round(dto.totalDurationSec / 60),
    topGameId: top.topGameId,
    topGameTitle: top.topGameTitle,
    weekStartIso: dto.weekStartIso,
    weekEndIso: dto.weekEndIso,
  }
}

export function computeActiveMindWeeklyStatsFromSessions(
  sessions: ActiveMindSession[],
  referenceDate = new Date(),
): ActiveMindWeeklyStats {
  const bounds = resolveLocalWeekBounds(referenceDate)
  const weekSessions = sessions.filter(
    (session) => session.completedAt >= bounds.startIso && session.completedAt <= bounds.endIso,
  )

  const byGameMap = new Map<ActiveMindGameId, number>()
  let totalDurationSec = 0

  for (const session of weekSessions) {
    totalDurationSec += session.durationSec ?? 0
    byGameMap.set(session.gameId, (byGameMap.get(session.gameId) ?? 0) + 1)
  }

  const byGame = [...byGameMap.entries()]
    .map(([gameId, count]) => ({ gameId, count }))
    .sort((left, right) => right.count - left.count)

  const top = resolveTopGame(byGame)

  return {
    totalSessions: weekSessions.length,
    totalMinutes: Math.round(totalDurationSec / 60),
    topGameId: top.topGameId,
    topGameTitle: top.topGameTitle,
    weekStartIso: bounds.startIso,
    weekEndIso: bounds.endIso,
  }
}

export function emptyActiveMindWeeklyStats(referenceDate = new Date()): ActiveMindWeeklyStats {
  const bounds = resolveLocalWeekBounds(referenceDate)
  return {
    totalSessions: 0,
    totalMinutes: 0,
    topGameId: null,
    topGameTitle: null,
    weekStartIso: bounds.startIso,
    weekEndIso: bounds.endIso,
  }
}

export async function loadActiveMindWeeklyStats(
  patientCpf: string,
): Promise<ActiveMindWeeklyStats> {
  if (shouldUseActiveMindApi(patientCpf)) {
    try {
      const dto = await getActiveMindWeeklyStats()
      return mapDtoToWeeklyStats(dto)
    } catch {
      // Offline — agrega do cache local.
    }
  }

  const sessions = await loadSessions(patientCpf)
  return computeActiveMindWeeklyStatsFromSessions(sessions)
}
