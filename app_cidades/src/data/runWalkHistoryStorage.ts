import { isRunWalkApiEnabled } from '../config/runWalkApi'
import {
  getRunWalkAtividade,
  getRunWalkAtividadesResumo,
  listRunWalkAtividades,
  type ListRunWalkAtividadesQuery,
  type ResumoRunWalkAtividadesQuery,
  type RunWalkAtividadesResumoDto,
  type RunWalkResumoChartDayDto,
} from '../lib/api/vd/runWalk'
import type { WeeklyCalendarDay } from '../types/runWalk'
import type {
  RunWalkHistoryAdvancedFilters,
  RunWalkHistoryDateRange,
  RunWalkHistoryHeatmapCell,
  RunWalkHistoryHighlight,
  RunWalkHistoryPeriod,
  RunWalkHistoryPeriodSummary,
  RunWalkHistorySort,
  RunWalkHistoryTrendPoint,
} from '../types/runWalkHistory'
import { mapAtividadeDtoToSummary, mapDetailDtoToSummary } from '../utils/runWalkAtividadeMappers'
import {
  buildHistoryChartDaysForPeriod,
  computeHistoryHighlights,
  computeHistoryPeriodSummary,
  buildHistoryHeatmap,
  buildHistoryTrendPoints,
  filterHistoryActivities,
} from '../utils/runWalkHistoryStats'
import type { RunWalkActivitySummary } from './runWalkActivitySummaryStorage'
import {
  flushRunWalkActivitySyncQueue,
  loadLocalRunWalkActivityHistory,
} from './runWalkActivityHistoryStorage'

export type RunWalkHistoryDashboard = {
  periodSummary: RunWalkHistoryPeriodSummary
  trendPoints: RunWalkHistoryTrendPoint[]
  heatmapCells: RunWalkHistoryHeatmapCell[]
  highlights: RunWalkHistoryHighlight[]
  chartDays: WeeklyCalendarDay[]
}

export type RunWalkHistoryBundle = {
  activities: RunWalkActivitySummary[]
  dashboard: RunWalkHistoryDashboard
  fromApi: boolean
}

export type RunWalkHistoryQuery = {
  period: RunWalkHistoryPeriod
  customDateRange: RunWalkHistoryDateRange | null
  sort: RunWalkHistorySort
  filters: RunWalkHistoryAdvancedFilters
  chartMetric?: 'minutes' | 'distance'
}

function isGuestPatient(patientCpf: string) {
  return patientCpf === 'guest'
}

function shouldUseRunWalkApi(patientCpf: string) {
  return isRunWalkApiEnabled() && !isGuestPatient(patientCpf)
}

function stripLegacyMockActivities(activities: RunWalkActivitySummary[]) {
  return activities.filter((activity) => !activity.id.startsWith('mock-history-'))
}

export function buildRunWalkHistoryApiQuery(
  query: RunWalkHistoryQuery,
): ListRunWalkAtividadesQuery & ResumoRunWalkAtividadesQuery {
  const base = {
    sort: query.sort,
    minDistanceKm: query.filters.minDistanceKm,
    chartMetric: query.chartMetric ?? 'minutes',
  }

  if (query.period === 'custom' && query.customDateRange) {
    return {
      ...base,
      startIso: query.customDateRange.startIso,
      endIso: query.customDateRange.endIso,
    }
  }

  if (query.period === 'all') {
    return { ...base, period: 'all' }
  }

  return { ...base, period: query.period }
}

function mapResumoChartDayToWeeklyCalendarDay(day: RunWalkResumoChartDayDto): WeeklyCalendarDay {
  return {
    dateIso: day.dateIso,
    dayLabel: day.dayLabel,
    weekdayShort: day.weekdayShort,
    dateShort: day.dateShort,
    isToday: day.isToday,
    isFuture: day.isFuture,
    activeMinutes: day.activeMinutes,
    activities:
      day.activeMinutes > 0
        ? [{ type: 'walk', label: 'Atividade', completed: true }]
        : [{ type: 'rest', label: 'Descanso' }],
  }
}

function mapResumoToDashboard(dto: RunWalkAtividadesResumoDto): RunWalkHistoryDashboard {
  return {
    periodSummary: dto.periodSummary,
    trendPoints: dto.trendPoints,
    heatmapCells: dto.heatmapCells,
    highlights: dto.highlights,
    chartDays: dto.chartDays.map(mapResumoChartDayToWeeklyCalendarDay),
  }
}

function buildLocalDashboard(
  activities: RunWalkActivitySummary[],
  query: RunWalkHistoryQuery,
  now = new Date(),
): RunWalkHistoryDashboard {
  const { period, customDateRange, filters, chartMetric = 'minutes' } = query
  const scoped = filterHistoryActivities(
    activities,
    period,
    filters,
    null,
    now,
    customDateRange,
  )

  return {
    periodSummary: computeHistoryPeriodSummary(scoped, period, now, customDateRange),
    trendPoints: buildHistoryTrendPoints(scoped),
    heatmapCells: buildHistoryHeatmap(activities),
    highlights: computeHistoryHighlights(scoped),
    chartDays: buildHistoryChartDaysForPeriod(
      scoped,
      period,
      chartMetric,
      now,
      customDateRange,
    ),
  }
}

async function fetchAllAtividadesFromApi(apiQuery: ListRunWalkAtividadesQuery) {
  const pageSize = 100
  let page = 1
  const activities = []

  while (true) {
    const result = await listRunWalkAtividades({ ...apiQuery, page, pageSize })
    activities.push(...result.activities)
    if (!result.hasMore) break
    page += 1
  }

  return activities
}

async function loadActivitiesFromApi(
  patientCpf: string,
  apiQuery: ListRunWalkAtividadesQuery,
): Promise<RunWalkActivitySummary[]> {
  await flushRunWalkActivitySyncQueue(patientCpf)
  const remote = await fetchAllAtividadesFromApi(apiQuery)
  return remote.map((dto) => mapAtividadeDtoToSummary(dto, patientCpf))
}

async function loadDashboardFromApi(apiQuery: ResumoRunWalkAtividadesQuery) {
  const resumo = await getRunWalkAtividadesResumo(apiQuery)
  return mapResumoToDashboard(resumo)
}

/** Carrega lista + painel do histórico (API quando habilitada, senão cache local). */
export async function loadRunWalkHistoryBundle(
  patientCpf: string,
  query: RunWalkHistoryQuery,
): Promise<RunWalkHistoryBundle> {
  const apiQuery = buildRunWalkHistoryApiQuery(query)

  if (!shouldUseRunWalkApi(patientCpf)) {
    const local = stripLegacyMockActivities(await loadLocalRunWalkActivityHistory(patientCpf))
    return {
      activities: local,
      dashboard: buildLocalDashboard(local, query),
      fromApi: false,
    }
  }

  try {
    const [activities, dashboard] = await Promise.all([
      loadActivitiesFromApi(patientCpf, apiQuery),
      loadDashboardFromApi(apiQuery),
    ])

    return {
      activities,
      dashboard,
      fromApi: true,
    }
  } catch {
    const local = stripLegacyMockActivities(await loadLocalRunWalkActivityHistory(patientCpf))
    return {
      activities: local,
      dashboard: buildLocalDashboard(local, query),
      fromApi: false,
    }
  }
}

/** Detalhe completo (trilha) via GET /atividades/:id quando disponível. */
export async function loadRunWalkHistoryActivityDetail(
  patientCpf: string,
  activity: RunWalkActivitySummary,
): Promise<RunWalkActivitySummary> {
  if (!shouldUseRunWalkApi(patientCpf) || !activity.serverId) {
    return activity
  }

  try {
    const result = await getRunWalkAtividade(activity.serverId)
    return mapDetailDtoToSummary(result.activity, patientCpf)
  } catch {
    return activity
  }
}
