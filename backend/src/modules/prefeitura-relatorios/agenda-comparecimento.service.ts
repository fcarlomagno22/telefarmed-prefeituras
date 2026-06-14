import { supabaseAdmin } from '../../db/supabase.js'
import {
  buildHeatmapRows,
  buildHighlights,
} from '../prefeitura-agendas/formatters.js'
import {
  fetchAgendaRowsForPeriod,
  fetchCancelledAgendaRowsForPeriod,
} from '../prefeitura-agendas/query.service.js'
import type { AgendaAggregateRow } from '../prefeitura-agendas/types.js'
import {
  buildDailySeries,
  computeDeltaPercent,
  computeDeltaPp,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import type {
  PrefeituraConsultasDailyPointDto,
  PrefeituraConsultasKpiDto,
} from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import type {
  AgendaComparecimentoReportDto,
  AgendaComparecimentoReportUnitRowDto,
} from './types.js'

const MONTH_LABELS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
] as const

const ATTENDED_STATUSES = new Set(['realizado', 'em_atendimento', 'aguardando'])

type AgendaStatusMetrics = {
  scheduled: number
  attended: number
  noShows: number
  pending: number
  rescheduled: number
}

type DailyAgendaBucket = {
  scheduled: number
  attended: number
  noShows: number
  pending: number
  rescheduled: number
}

function countDaysInclusive(periodStart: string, periodEnd: string) {
  const start = new Date(`${periodStart}T12:00:00-03:00`)
  const end = new Date(`${periodEnd}T12:00:00-03:00`)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
}

function enumerateDayKeys(periodStart: string, periodEnd: string): string[] {
  const keys: string[] = []
  const cursor = new Date(`${periodStart}T12:00:00-03:00`)
  const end = new Date(`${periodEnd}T12:00:00-03:00`)

  while (cursor <= end) {
    keys.push(cursor.toISOString().slice(0, 10))
    cursor.setDate(cursor.getDate() + 1)
  }

  return keys
}

function filterUnitsByParams(
  units: RedeUnitApi[],
  params: { unidadeUbtId?: string; regionKey?: string },
) {
  let filtered = units.filter((unit) => unit.status !== 'inativa')

  if (params.regionKey && params.regionKey !== 'todas') {
    filtered = filtered.filter((unit) => unit.regionKey === params.regionKey)
  }

  if (params.unidadeUbtId && params.unidadeUbtId !== 'todas') {
    filtered = filtered.filter((unit) => unit.id === params.unidadeUbtId)
  }

  return filtered
}

function emptyMetrics(): AgendaStatusMetrics {
  return {
    scheduled: 0,
    attended: 0,
    noShows: 0,
    pending: 0,
    rescheduled: 0,
  }
}

function attendanceRate(metrics: AgendaStatusMetrics) {
  const resolved = metrics.attended + metrics.noShows
  if (resolved <= 0) return 0
  return Math.round((metrics.attended / resolved) * 1000) / 10
}

function absenceRate(metrics: AgendaStatusMetrics) {
  const resolved = metrics.attended + metrics.noShows
  if (resolved <= 0) return 0
  return Math.round((metrics.noShows / resolved) * 1000) / 10
}

function classifyActiveRow(status: string) {
  if (ATTENDED_STATUSES.has(status)) return 'attended' as const
  if (status === 'faltou') return 'noShow' as const
  if (status === 'agendado') return 'pending' as const
  return null
}

function accumulateActiveRow(metrics: AgendaStatusMetrics, status: string) {
  metrics.scheduled += 1
  const bucket = classifyActiveRow(status)
  if (bucket === 'attended') metrics.attended += 1
  else if (bucket === 'noShow') metrics.noShows += 1
  else if (bucket === 'pending') metrics.pending += 1
}

function buildMetricsFromRows(activeRows: AgendaAggregateRow[], cancelledRows: AgendaAggregateRow[]) {
  const metrics = emptyMetrics()

  for (const row of activeRows) {
    accumulateActiveRow(metrics, String(row.status))
  }

  metrics.rescheduled = cancelledRows.length
  return metrics
}

function buildUnitMetricsMap(
  units: RedeUnitApi[],
  activeRows: AgendaAggregateRow[],
  cancelledRows: AgendaAggregateRow[],
) {
  const metrics = new Map<string, AgendaStatusMetrics>()
  for (const unit of units) {
    metrics.set(unit.id, emptyMetrics())
  }

  for (const row of activeRows) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue
    accumulateActiveRow(current, String(row.status))
  }

  for (const row of cancelledRows) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue
    current.rescheduled += 1
  }

  return metrics
}

function buildDailyBuckets(activeRows: AgendaAggregateRow[], cancelledRows: AgendaAggregateRow[]) {
  const buckets = new Map<string, DailyAgendaBucket>()

  function ensureBucket(date: string) {
    const current = buckets.get(date)
    if (current) return current
    const next: DailyAgendaBucket = {
      scheduled: 0,
      attended: 0,
      noShows: 0,
      pending: 0,
      rescheduled: 0,
    }
    buckets.set(date, next)
    return next
  }

  for (const row of activeRows) {
    const date = String(row.data)
    const bucket = ensureBucket(date)
    bucket.scheduled += 1
    const kind = classifyActiveRow(String(row.status))
    if (kind === 'attended') bucket.attended += 1
    else if (kind === 'noShow') bucket.noShows += 1
    else if (kind === 'pending') bucket.pending += 1
  }

  for (const row of cancelledRows) {
    const date = String(row.data)
    const bucket = ensureBucket(date)
    bucket.rescheduled += 1
  }

  return buckets
}

function bucketsToDailyCounts(
  buckets: Map<string, DailyAgendaBucket>,
  picker: (bucket: DailyAgendaBucket) => number,
) {
  const counts = new Map<string, number>()
  for (const [date, bucket] of buckets) {
    counts.set(date, picker(bucket))
  }
  return counts
}

function buildMonthlySeries(
  buckets: Map<string, DailyAgendaBucket>,
  periodStart: string,
  periodEnd: string,
  picker: (bucket: DailyAgendaBucket) => number,
): PrefeituraConsultasDailyPointDto[] {
  const monthly = new Map<string, DailyAgendaBucket>()

  for (const [date, bucket] of buckets) {
    const monthKey = date.slice(0, 7)
    const current = monthly.get(monthKey) ?? {
      scheduled: 0,
      attended: 0,
      noShows: 0,
      pending: 0,
      rescheduled: 0,
    }
    current.scheduled += bucket.scheduled
    current.attended += bucket.attended
    current.noShows += bucket.noShows
    current.pending += bucket.pending
    current.rescheduled += bucket.rescheduled
    monthly.set(monthKey, current)
  }

  const start = new Date(`${periodStart.slice(0, 7)}-01T12:00:00-03:00`)
  const end = new Date(`${periodEnd.slice(0, 7)}-01T12:00:00-03:00`)
  const points: PrefeituraConsultasDailyPointDto[] = []

  for (let cursor = new Date(start); cursor <= end; cursor.setMonth(cursor.getMonth() + 1)) {
    const monthKey = cursor.toISOString().slice(0, 7)
    const monthIndex = Number(monthKey.slice(5, 7)) - 1
    const bucket = monthly.get(monthKey)
    points.push({
      date: `${monthKey}-01`,
      label: `${MONTH_LABELS[monthIndex] ?? monthKey}/${monthKey.slice(2, 4)}`,
      value: bucket ? picker(bucket) : 0,
    })
  }

  return points
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value)
}

function formatPercent(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)
}

async function resolveEntidadeRazaoSocial(entidadeId: string) {
  const { data, error } = await supabaseAdmin
    .from('entidades_contratantes')
    .select('razao_social')
    .eq('id', entidadeId)
    .maybeSingle()

  if (error) throw error
  return data?.razao_social ? String(data.razao_social) : 'Prefeitura'
}

function buildKpis(summary: AgendaComparecimentoReportDto['summary']): PrefeituraConsultasKpiDto[] {
  const attendanceDelta = summary.attendanceDeltaPp
  const noShowsDelta = summary.noShowsDeltaPercent

  return [
    {
      label: 'Agendamentos no período',
      value: formatNumber(summary.scheduled),
      footer: 'Horários reservados nas agendas das UBTs',
      footerTone: 'neutral',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Comparecimentos',
      value: formatNumber(summary.attended),
      footer: 'Consultas com presença confirmada ou em andamento',
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Taxa de comparecimento',
      value: `${formatPercent(summary.attendanceRatePercent)}%`,
      footer:
        attendanceDelta === 0
          ? 'Estável vs período anterior'
          : `${attendanceDelta > 0 ? '+' : ''}${formatPercent(attendanceDelta)} p.p. vs período anterior`,
      footerTone: attendanceDelta >= 0 ? 'positive' : 'muted',
      footerIcon: attendanceDelta >= 0 ? 'up' : 'down',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Faltas',
      value: formatNumber(summary.noShows),
      footer:
        noShowsDelta === 0
          ? 'Estável vs período anterior'
          : `${noShowsDelta > 0 ? '+' : ''}${formatPercent(noShowsDelta)}% vs período anterior`,
      footerTone: noShowsDelta <= 0 ? 'positive' : 'muted',
      footerIcon: noShowsDelta <= 0 ? 'down' : 'up',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      label: 'Remarcações e cancelamentos',
      value: formatNumber(summary.rescheduled),
      footer: 'Agendamentos cancelados ou reagendados no período',
      footerTone: 'muted',
      topBar: 'from-violet-400 to-purple-600',
    },
  ]
}

export async function getAgendaComparecimentoReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<AgendaComparecimentoReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const dayKeys = enumerateDayKeys(params.periodStart, params.periodEnd)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const useMonthlyEvolution = countDaysInclusive(params.periodStart, params.periodEnd) > 45

  const [
    currentActiveRows,
    previousActiveRows,
    currentCancelledRows,
    previousCancelledRows,
  ] = await Promise.all([
    fetchAgendaRowsForPeriod(entidadeId, params.periodStart, params.periodEnd, unitIds),
    fetchAgendaRowsForPeriod(
      entidadeId,
      previous.previousStart,
      previous.previousEnd,
      unitIds,
    ),
    fetchCancelledAgendaRowsForPeriod(
      entidadeId,
      params.periodStart,
      params.periodEnd,
      unitIds,
    ),
    fetchCancelledAgendaRowsForPeriod(
      entidadeId,
      previous.previousStart,
      previous.previousEnd,
      unitIds,
    ),
  ])

  const currentMetrics = buildMetricsFromRows(currentActiveRows, currentCancelledRows)
  const previousMetrics = buildMetricsFromRows(previousActiveRows, previousCancelledRows)
  const currentUnitMetrics = buildUnitMetricsMap(
    visibleUnits,
    currentActiveRows,
    currentCancelledRows,
  )
  const networkAttendanceRate = attendanceRate(currentMetrics)

  const heatmapRows = buildHeatmapRows(visibleUnits, dayKeys, currentActiveRows)
  const highlights = buildHighlights(heatmapRows, dayKeys)

  const units: AgendaComparecimentoReportUnitRowDto[] = visibleUnits
    .map((unit) => {
      const metrics = currentUnitMetrics.get(unit.id) ?? emptyMetrics()
      const unitAttendanceRate = attendanceRate(metrics)
      const unitAbsenceRate = absenceRate(metrics)

      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        scheduled: metrics.scheduled,
        attended: metrics.attended,
        noShows: metrics.noShows,
        pending: metrics.pending,
        rescheduled: metrics.rescheduled,
        attendanceRatePercent: unitAttendanceRate,
        absenceRatePercent: unitAbsenceRate,
        attendanceVsNetworkPp: unitAttendanceRate - networkAttendanceRate,
      }
    })
    .sort((a, b) => b.attendanceRatePercent - a.attendanceRatePercent)

  const dailyBuckets = buildDailyBuckets(currentActiveRows, currentCancelledRows)
  const pickAttendance = (bucket: DailyAgendaBucket) => {
    const resolved = bucket.attended + bucket.noShows
    if (resolved <= 0) return 0
    return Math.round((bucket.attended / resolved) * 1000) / 10
  }
  const pickNoShows = (bucket: DailyAgendaBucket) => bucket.noShows
  const pickRescheduled = (bucket: DailyAgendaBucket) => bucket.rescheduled
  const pickVolume = (bucket: DailyAgendaBucket) => bucket.scheduled

  const buildSeries = useMonthlyEvolution
    ? (picker: (bucket: DailyAgendaBucket) => number) =>
        buildMonthlySeries(dailyBuckets, params.periodStart, params.periodEnd, picker)
    : (picker: (bucket: DailyAgendaBucket) => number) =>
        buildDailySeries(
          bucketsToDailyCounts(dailyBuckets, picker),
          params.periodStart,
          params.periodEnd,
        )

  const summary = {
    scheduled: currentMetrics.scheduled,
    attended: currentMetrics.attended,
    noShows: currentMetrics.noShows,
    pending: currentMetrics.pending,
    rescheduled: currentMetrics.rescheduled,
    attendanceRatePercent: networkAttendanceRate,
    unitsCount: visibleUnits.length,
    attendanceDeltaPp: computeDeltaPp(
      networkAttendanceRate,
      attendanceRate(previousMetrics),
    ),
    noShowsDeltaPercent: computeDeltaPercent(
      currentMetrics.noShows,
      previousMetrics.noShows,
    ),
    scheduledDeltaPercent: computeDeltaPercent(
      currentMetrics.scheduled,
      previousMetrics.scheduled,
    ),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }

  summary.kpis = buildKpis(summary)

  return {
    reportId: 'agenda-comparecimento',
    title: 'Agenda vs comparecimento',
    description:
      'Relação entre horários agendados e consultas efetivamente realizadas, incluindo faltas e remarcações.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights,
    units,
    evolution: {
      mode: useMonthlyEvolution ? 'monthly' : 'daily',
      attendancePoints: buildSeries(pickAttendance),
      noShowPoints: buildSeries(pickNoShows),
      rescheduledPoints: buildSeries(pickRescheduled),
      volumePoints: buildSeries(pickVolume),
    },
  }
}
