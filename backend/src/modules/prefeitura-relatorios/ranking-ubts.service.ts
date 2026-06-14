import { supabaseAdmin } from '../../db/supabase.js'
import { fetchAgendaRowsForPeriod } from '../prefeitura-agendas/query.service.js'
import {
  aggregateConsultas,
  buildDailySeries,
  completionRate,
  computeDeltaPercent,
  computeDeltaPp,
  formatPeriodLabel,
  resolveSlaStatus,
} from '../prefeitura-consultas/formatters.js'
import { periodBounds, resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import { fetchConsultasForPeriod } from '../prefeitura-consultas/query.service.js'
import type {
  PrefeituraConsultasDailyPointDto,
  PrefeituraConsultasKpiDto,
} from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import type {
  RankingUbtsDimensionRankingDto,
  RankingUbtsHighlightDto,
  RankingUbtsReportDto,
  RankingUbtsReportUnitRowDto,
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

const NETWORK_GOALS = {
  completionRatePercent: 92,
  maxAbandonmentRatePercent: 15,
  maxWaitMinutes: 15,
  minAttendanceRatePercent: 75,
} as const

const ATTENDED_AGENDA_STATUSES = new Set(['realizado', 'em_atendimento', 'aguardando'])

type FilaPeriodRow = {
  unidade_ubt_id: string
  status: string
  chegada_em: string
  chamado_em: string | null
  atendimento_inicio_em: string | null
}

type AgendaPeriodRow = {
  unidade_ubt_id: string
  status: string
  data: string
}

type AvaliacaoPeriodRow = {
  nota: number | null
  nota_teleconsulta: number | null
  consultas:
    | { unidade_ubt_id: string }
    | { unidade_ubt_id: string }[]
    | null
}

type UnitRankingMetrics = {
  production: number
  completed: number
  cancelled: number
  abandoned: number
  avgWaitMinutes: number
  attended: number
  noShows: number
  avgRating: number
  ratingCount: number
}

type DailyRankingBucket = {
  production: number
  completed: number
  cancelled: number
  abandoned: number
  attended: number
  noShows: number
}

function isMissingRelationError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false
  const code = 'code' in error ? String((error as { code: unknown }).code) : ''
  const message = 'message' in error ? String((error as { message: unknown }).message) : ''
  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    /relation .* does not exist/i.test(message) ||
    /Could not find the table/i.test(message)
  )
}

function countDaysInclusive(periodStart: string, periodEnd: string) {
  const start = new Date(`${periodStart}T12:00:00-03:00`)
  const end = new Date(`${periodEnd}T12:00:00-03:00`)
  return Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
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

function emptyUnitMetrics(): UnitRankingMetrics {
  return {
    production: 0,
    completed: 0,
    cancelled: 0,
    abandoned: 0,
    avgWaitMinutes: 0,
    attended: 0,
    noShows: 0,
    avgRating: 0,
    ratingCount: 0,
  }
}

function abandonmentRate(metrics: UnitRankingMetrics) {
  const total = metrics.completed + metrics.cancelled + metrics.abandoned
  if (total <= 0) return 0
  return Math.round(((metrics.cancelled + metrics.abandoned) / total) * 1000) / 10
}

function attendanceRate(metrics: UnitRankingMetrics) {
  const resolved = metrics.attended + metrics.noShows
  if (resolved <= 0) return 0
  return Math.round((metrics.attended / resolved) * 1000) / 10
}

function goalFulfillmentPercent(
  completionRatePercent: number,
  abandonmentRatePercent: number,
  avgWaitMinutes: number,
  attendanceRatePercent: number,
) {
  const completionGoal = Math.min(
    100,
    Math.round((completionRatePercent / NETWORK_GOALS.completionRatePercent) * 1000) / 10,
  )
  const abandonmentGoal = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        ((NETWORK_GOALS.maxAbandonmentRatePercent - abandonmentRatePercent) /
          NETWORK_GOALS.maxAbandonmentRatePercent) *
          1000,
      ) / 10,
    ),
  )
  const waitGoal =
    avgWaitMinutes <= 0
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(
              ((NETWORK_GOALS.maxWaitMinutes - avgWaitMinutes) / NETWORK_GOALS.maxWaitMinutes) *
                1000,
            ) / 10,
          ),
        )
  const attendanceGoal =
    attendanceRatePercent <= 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (attendanceRatePercent / NETWORK_GOALS.minAttendanceRatePercent) * 1000,
          ) / 10,
        )

  return Math.round(
    ((completionGoal + abandonmentGoal + waitGoal + attendanceGoal) / 4) * 10,
  ) / 10
}

function compositeScore(
  production: number,
  maxProduction: number,
  completionRatePercent: number,
  abandonmentRatePercent: number,
  goalPercent: number,
) {
  const productionNorm =
    maxProduction > 0 ? Math.round((production / maxProduction) * 1000) / 10 : 0
  const abandonmentScore = Math.max(0, 100 - abandonmentRatePercent)

  return Math.round(
    productionNorm * 0.35 +
      completionRatePercent * 0.25 +
      abandonmentScore * 0.2 +
      goalPercent * 0.2,
  )
}

function variationPercent(current: number, previous: number) {
  if (previous <= 0) return current > 0 ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
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

async function loadFilaRowsInPeriod(
  entidadeId: string,
  unitIds: string[],
  periodStart: string,
  periodEnd: string,
): Promise<FilaPeriodRow[]> {
  if (unitIds.length === 0) return []

  const { startIso, endIso } = periodBounds(periodStart, periodEnd)
  const { data, error } = await supabaseAdmin
    .from('fila_espera')
    .select('unidade_ubt_id, status, chegada_em, chamado_em, atendimento_inicio_em')
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .gte('chegada_em', startIso)
    .lte('chegada_em', endIso)
    .in('status', ['finalizado', 'desistiu'])

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as FilaPeriodRow[]
}

async function loadAvaliacoesInPeriod(
  entidadeId: string,
  unitIds: string[],
  periodStart: string,
  periodEnd: string,
): Promise<AvaliacaoPeriodRow[]> {
  if (unitIds.length === 0) return []

  const { startIso, endIso } = periodBounds(periodStart, periodEnd)
  const { data, error } = await supabaseAdmin
    .from('consulta_avaliacoes')
    .select('nota, nota_teleconsulta, consultas!inner(unidade_ubt_id, criado_em, entidade_contratante_id)')
    .eq('consultas.entidade_contratante_id', entidadeId)
    .in('consultas.unidade_ubt_id', unitIds)
    .gte('consultas.criado_em', startIso)
    .lte('consultas.criado_em', endIso)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as AvaliacaoPeriodRow[]
}

function waitEndTimestamp(row: FilaPeriodRow) {
  return row.atendimento_inicio_em ?? row.chamado_em
}

function buildUnitMetricsMap(
  units: RedeUnitApi[],
  aggregatedByUnit: ReturnType<typeof aggregateConsultas>['byUnit'],
  filaRows: FilaPeriodRow[],
  agendaRows: AgendaPeriodRow[],
  avaliacoes: AvaliacaoPeriodRow[],
) {
  const metrics = new Map<string, UnitRankingMetrics>()
  for (const unit of units) {
    metrics.set(unit.id, emptyUnitMetrics())
  }

  for (const unit of units) {
    const stats = aggregatedByUnit.get(unit.id)
    const current = metrics.get(unit.id)
    if (!current || !stats) continue
    current.production = stats.completed
    current.completed = stats.completed
    current.cancelled = stats.cancelled
  }

  const waitTotals = new Map<string, { sum: number; count: number }>()
  for (const row of filaRows) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue

    if (row.status === 'desistiu') current.abandoned += 1

    const waitEnd = waitEndTimestamp(row)
    if (waitEnd) {
      const waitMinutes = Math.max(
        0,
        Math.round((Date.parse(String(waitEnd)) - Date.parse(String(row.chegada_em))) / 60_000),
      )
      const bucket = waitTotals.get(unitId) ?? { sum: 0, count: 0 }
      bucket.sum += waitMinutes
      bucket.count += 1
      waitTotals.set(unitId, bucket)
    }
  }

  for (const [unitId, bucket] of waitTotals) {
    const current = metrics.get(unitId)
    if (!current || bucket.count <= 0) continue
    current.avgWaitMinutes = Math.round(bucket.sum / bucket.count)
  }

  for (const row of agendaRows) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue
    const status = String(row.status)
    if (ATTENDED_AGENDA_STATUSES.has(status)) current.attended += 1
    else if (status === 'faltou') current.noShows += 1
  }

  const ratingTotals = new Map<string, { sum: number; count: number }>()
  for (const row of avaliacoes) {
    const consulta = Array.isArray(row.consultas) ? row.consultas[0] : row.consultas
    if (!consulta) continue

    const unitId = String(consulta.unidade_ubt_id)
    const score =
      typeof row.nota_teleconsulta === 'number'
        ? row.nota_teleconsulta
        : typeof row.nota === 'number'
          ? row.nota
          : null
    if (score == null) continue

    const bucket = ratingTotals.get(unitId) ?? { sum: 0, count: 0 }
    bucket.sum += score
    bucket.count += 1
    ratingTotals.set(unitId, bucket)
  }

  for (const [unitId, bucket] of ratingTotals) {
    const current = metrics.get(unitId)
    if (!current || bucket.count <= 0) continue
    current.ratingCount = bucket.count
    current.avgRating = Math.round((bucket.sum / bucket.count) * 10) / 10
  }

  return metrics
}

function buildDailyBuckets(
  aggregated: ReturnType<typeof aggregateConsultas>,
  filaRows: FilaPeriodRow[],
  agendaRows: AgendaPeriodRow[],
) {
  const buckets = new Map<string, DailyRankingBucket>()

  function ensureBucket(date: string) {
    const current = buckets.get(date)
    if (current) return current
    const next: DailyRankingBucket = {
      production: 0,
      completed: 0,
      cancelled: 0,
      abandoned: 0,
      attended: 0,
      noShows: 0,
    }
    buckets.set(date, next)
    return next
  }

  for (const [date, count] of aggregated.dailyCounts) {
    const bucket = ensureBucket(date)
    bucket.production += count
    bucket.completed += count
  }

  for (const row of filaRows) {
    const date = String(row.chegada_em).slice(0, 10)
    const bucket = ensureBucket(date)
    if (row.status === 'desistiu') bucket.abandoned += 1
  }

  for (const row of agendaRows) {
    const date = String(row.data)
    const bucket = ensureBucket(date)
    const status = String(row.status)
    if (ATTENDED_AGENDA_STATUSES.has(status)) bucket.attended += 1
    else if (status === 'faltou') bucket.noShows += 1
  }

  return buckets
}

function bucketsToDailyCounts(
  buckets: Map<string, DailyRankingBucket>,
  picker: (bucket: DailyRankingBucket) => number,
) {
  const counts = new Map<string, number>()
  for (const [date, bucket] of buckets) {
    counts.set(date, picker(bucket))
  }
  return counts
}

function buildMonthlySeries(
  buckets: Map<string, DailyRankingBucket>,
  periodStart: string,
  periodEnd: string,
  picker: (bucket: DailyRankingBucket) => number,
): PrefeituraConsultasDailyPointDto[] {
  const monthly = new Map<string, DailyRankingBucket>()

  for (const [date, bucket] of buckets) {
    const monthKey = date.slice(0, 7)
    const current = monthly.get(monthKey) ?? {
      production: 0,
      completed: 0,
      cancelled: 0,
      abandoned: 0,
      attended: 0,
      noShows: 0,
    }
    current.production += bucket.production
    current.completed += bucket.completed
    current.cancelled += bucket.cancelled
    current.abandoned += bucket.abandoned
    current.attended += bucket.attended
    current.noShows += bucket.noShows
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

function buildUnitRows(
  units: RedeUnitApi[],
  currentMetrics: Map<string, UnitRankingMetrics>,
  previousMetrics: Map<string, UnitRankingMetrics>,
  currentAggregated: ReturnType<typeof aggregateConsultas>,
  previousAggregated: ReturnType<typeof aggregateConsultas>,
) {
  const maxProduction = Math.max(
    ...units.map((unit) => currentMetrics.get(unit.id)?.production ?? 0),
    1,
  )

  const rows = units.map((unit) => {
    const current = currentMetrics.get(unit.id) ?? emptyUnitMetrics()
    const previous = previousMetrics.get(unit.id) ?? emptyUnitMetrics()
    const currentStats = currentAggregated.byUnit.get(unit.id)
    const previousStats = previousAggregated.byUnit.get(unit.id)
    const currentTotal = currentStats?.total ?? 0
    const previousTotal = previousStats?.total ?? 0
    const completionRatePercent = completionRate(current.completed, currentTotal)
    const cancelledRatePercent =
      currentTotal > 0 ? Math.round((current.cancelled / currentTotal) * 1000) / 10 : 0
    const abandonmentRatePercent = abandonmentRate(current)
    const attendanceRatePercent = attendanceRate(current)
    const goalsPercent = goalFulfillmentPercent(
      completionRatePercent,
      abandonmentRatePercent,
      current.avgWaitMinutes,
      attendanceRatePercent,
    )
    const score = compositeScore(
      current.production,
      maxProduction,
      completionRatePercent,
      abandonmentRatePercent,
      goalsPercent,
    )
    const previousCompletion = completionRate(previous.completed, previousTotal)
    const previousAbandonment = abandonmentRate(previous)
    const previousAttendance = attendanceRate(previous)
    const previousGoals = goalFulfillmentPercent(
      previousCompletion,
      previousAbandonment,
      previous.avgWaitMinutes,
      previousAttendance,
    )
    const previousScore = compositeScore(
      previous.production,
      maxProduction,
      previousCompletion,
      previousAbandonment,
      previousGoals,
    )

    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      rank: 0,
      production: current.production,
      completionRatePercent,
      abandonmentRatePercent,
      avgWaitMinutes: current.avgWaitMinutes,
      attendanceRatePercent,
      avgRating: current.avgRating,
      goalFulfillmentPercent: goalsPercent,
      compositeScore: score,
      slaStatus: resolveSlaStatus(completionRatePercent, cancelledRatePercent),
      productionDeltaPercent: variationPercent(current.production, previous.production),
      compositeDeltaPp: computeDeltaPp(score, previousScore),
    }
  })

  return rows
    .sort((a, b) => b.compositeScore - a.compositeScore)
    .map((row, index) => ({ ...row, rank: index + 1 }))
}

function buildDimensionRanking(
  units: RankingUbtsReportUnitRowDto[],
  picker: (row: RankingUbtsReportUnitRowDto) => number,
  formatValue: (value: number, row: RankingUbtsReportUnitRowDto) => string,
  ascending = false,
): RankingUbtsDimensionRankingDto[] {
  const sorted = [...units].sort((a, b) => {
    const diff = picker(a) - picker(b)
    return ascending ? diff : -diff
  })

  return sorted.map((row, index) => ({
    position: index + 1,
    unitId: row.id,
    unitName: row.name,
    region: row.region,
    value: picker(row),
    valueLabel: formatValue(picker(row), row),
    variationPercent: row.productionDeltaPercent,
  }))
}

function buildHighlights(units: RankingUbtsReportUnitRowDto[]): RankingUbtsHighlightDto[] {
  if (units.length === 0) return []

  const byProduction = [...units].sort((a, b) => b.production - a.production)[0]
  const byEfficiency = [...units].sort((a, b) => b.completionRatePercent - a.completionRatePercent)[0]
  const byAbandonment = [...units].sort(
    (a, b) => a.abandonmentRatePercent - b.abandonmentRatePercent,
  )[0]
  const byGoals = [...units].sort((a, b) => b.goalFulfillmentPercent - a.goalFulfillmentPercent)[0]

  return [
    {
      id: 'top-production',
      title: 'Maior produção',
      subtitle: `${byProduction?.name ?? '—'} · ${byProduction?.production ?? 0} consultas concluídas`,
      tone: 'blue',
    },
    {
      id: 'top-efficiency',
      title: 'Melhor eficiência',
      subtitle: `${byEfficiency?.name ?? '—'} · ${byEfficiency?.completionRatePercent ?? 0}% de conclusão`,
      tone: 'green',
    },
    {
      id: 'low-abandonment',
      title: 'Menor abandono',
      subtitle: `${byAbandonment?.name ?? '—'} · ${byAbandonment?.abandonmentRatePercent ?? 0}% de abandono`,
      tone: 'amber',
    },
    {
      id: 'top-goals',
      title: 'Cumprimento de metas',
      subtitle: `${byGoals?.name ?? '—'} · ${byGoals?.goalFulfillmentPercent ?? 0}% das metas da rede`,
      tone: 'red',
    },
  ]
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

function buildKpis(summary: RankingUbtsReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Unidades classificadas',
      value: formatNumber(summary.unitsCount),
      footer: 'UBTs ativas no recorte do relatório',
      footerTone: 'neutral',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Produção total',
      value: formatNumber(summary.totalProduction),
      footer: `${summary.productionDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.productionDeltaPercent)}% vs período anterior`,
      footerTone: summary.productionDeltaPercent >= 0 ? 'positive' : 'muted',
      footerIcon: summary.productionDeltaPercent >= 0 ? 'up' : 'down',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Cumprimento médio de metas',
      value: `${formatPercent(summary.avgGoalFulfillmentPercent)}%`,
      footer: 'Média das metas de conclusão, abandono, espera e comparecimento',
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Score composto da rede',
      value: `${formatPercent(summary.networkCompositeScore)}`,
      footer:
        summary.compositeDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.compositeDeltaPp > 0 ? '+' : ''}${formatPercent(summary.compositeDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.compositeDeltaPp >= 0 ? 'positive' : 'muted',
      footerIcon: summary.compositeDeltaPp >= 0 ? 'up' : 'down',
      topBar: 'from-violet-400 to-purple-600',
    },
    {
      label: 'Unidades em meta',
      value: formatNumber(summary.unitsMeetingGoals),
      footer: 'UBTs com cumprimento de metas igual ou superior a 75%',
      footerTone: 'neutral',
      topBar: 'from-indigo-400 to-blue-600',
    },
  ]
}

export async function getRankingUbtsReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<RankingUbtsReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const useMonthlyEvolution = countDaysInclusive(params.periodStart, params.periodEnd) > 45

  const [
    currentConsultas,
    previousConsultas,
    currentFilaRows,
    previousFilaRows,
    currentAgendaRows,
    previousAgendaRows,
    currentAvaliacoes,
    previousAvaliacoes,
  ] = await Promise.all([
    fetchConsultasForPeriod(entidadeId, params.periodStart, params.periodEnd, unitIds),
    fetchConsultasForPeriod(
      entidadeId,
      previous.previousStart,
      previous.previousEnd,
      unitIds,
    ),
    loadFilaRowsInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadFilaRowsInPeriod(
      entidadeId,
      unitIds,
      previous.previousStart,
      previous.previousEnd,
    ),
    fetchAgendaRowsForPeriod(entidadeId, params.periodStart, params.periodEnd, unitIds),
    fetchAgendaRowsForPeriod(
      entidadeId,
      previous.previousStart,
      previous.previousEnd,
      unitIds,
    ),
    loadAvaliacoesInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadAvaliacoesInPeriod(
      entidadeId,
      unitIds,
      previous.previousStart,
      previous.previousEnd,
    ),
  ])

  const currentAggregated = aggregateConsultas(currentConsultas)
  const previousAggregated = aggregateConsultas(previousConsultas)

  const currentMetrics = buildUnitMetricsMap(
    visibleUnits,
    currentAggregated.byUnit,
    currentFilaRows,
    currentAgendaRows,
    currentAvaliacoes,
  )
  const previousMetrics = buildUnitMetricsMap(
    visibleUnits,
    previousAggregated.byUnit,
    previousFilaRows,
    previousAgendaRows,
    previousAvaliacoes,
  )

  const units = buildUnitRows(
    visibleUnits,
    currentMetrics,
    previousMetrics,
    currentAggregated,
    previousAggregated,
  )

  const totalProduction = units.reduce((sum, unit) => sum + unit.production, 0)
  const previousProduction = visibleUnits.reduce(
    (sum, unit) => sum + (previousMetrics.get(unit.id)?.production ?? 0),
    0,
  )
  const avgGoalFulfillmentPercent =
    units.length > 0
      ? Math.round(
          (units.reduce((sum, unit) => sum + unit.goalFulfillmentPercent, 0) / units.length) * 10,
        ) / 10
      : 0
  const networkCompositeScore =
    units.length > 0
      ? Math.round((units.reduce((sum, unit) => sum + unit.compositeScore, 0) / units.length) * 10) /
        10
      : 0
  const previousCompositeScore =
    visibleUnits.length > 0
      ? (() => {
          const maxProduction = Math.max(
            ...visibleUnits.map((unit) => previousMetrics.get(unit.id)?.production ?? 0),
            1,
          )
          const scores = visibleUnits.map((unit) => {
            const current = previousMetrics.get(unit.id) ?? emptyUnitMetrics()
            const completion = completionRate(current.completed, current.completed + current.cancelled)
            const goals = goalFulfillmentPercent(
              completion,
              abandonmentRate(current),
              current.avgWaitMinutes,
              attendanceRate(current),
            )
            return compositeScore(
              current.production,
              maxProduction,
              completion,
              abandonmentRate(current),
              goals,
            )
          })
          return Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10) / 10
        })()
      : 0

  const dailyBuckets = buildDailyBuckets(currentAggregated, currentFilaRows, currentAgendaRows)
  const pickComposite = (bucket: DailyRankingBucket) => {
    const completion = completionRate(bucket.completed, bucket.completed + bucket.cancelled)
    const abandonment =
      bucket.completed + bucket.cancelled + bucket.abandoned > 0
        ? Math.round(
            ((bucket.cancelled + bucket.abandoned) /
              (bucket.completed + bucket.cancelled + bucket.abandoned)) *
              1000,
          ) / 10
        : 0
    const attendance =
      bucket.attended + bucket.noShows > 0
        ? Math.round((bucket.attended / (bucket.attended + bucket.noShows)) * 1000) / 10
        : 0
    const goals = goalFulfillmentPercent(completion, abandonment, 0, attendance)
    return compositeScore(bucket.production, bucket.production || 1, completion, abandonment, goals)
  }
  const pickProduction = (bucket: DailyRankingBucket) => bucket.production
  const pickGoals = (bucket: DailyRankingBucket) => {
    const completion = completionRate(bucket.completed, bucket.completed + bucket.cancelled)
    const abandonment =
      bucket.completed + bucket.cancelled + bucket.abandoned > 0
        ? Math.round(
            ((bucket.cancelled + bucket.abandoned) /
              (bucket.completed + bucket.cancelled + bucket.abandoned)) *
              1000,
          ) / 10
        : 0
    const attendance =
      bucket.attended + bucket.noShows > 0
        ? Math.round((bucket.attended / (bucket.attended + bucket.noShows)) * 1000) / 10
        : 0
    return goalFulfillmentPercent(completion, abandonment, 0, attendance)
  }

  const buildSeries = useMonthlyEvolution
    ? (picker: (bucket: DailyRankingBucket) => number) =>
        buildMonthlySeries(dailyBuckets, params.periodStart, params.periodEnd, picker)
    : (picker: (bucket: DailyRankingBucket) => number) =>
        buildDailySeries(
          bucketsToDailyCounts(dailyBuckets, picker),
          params.periodStart,
          params.periodEnd,
        )

  const summary = {
    unitsCount: units.length,
    totalProduction,
    productionDeltaPercent: computeDeltaPercent(totalProduction, previousProduction),
    avgGoalFulfillmentPercent,
    networkCompositeScore,
    compositeDeltaPp: computeDeltaPp(networkCompositeScore, previousCompositeScore),
    unitsMeetingGoals: units.filter((unit) => unit.goalFulfillmentPercent >= 75).length,
    topUnitName: units[0]?.name ?? '—',
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  return {
    reportId: 'ranking-ubts',
    title: 'Ranking de UBTs',
    description:
      'Classificação das unidades por produção, eficiência operacional e cumprimento de metas da rede municipal.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(units),
    units,
    rankings: {
      producao: buildDimensionRanking(
        units,
        (row) => row.production,
        (value) => formatNumber(value),
      ),
      eficiencia: buildDimensionRanking(
        units,
        (row) => row.completionRatePercent,
        (value) => `${formatPercent(value)}%`,
      ),
      abandono: buildDimensionRanking(
        units,
        (row) => row.abandonmentRatePercent,
        (value) => `${formatPercent(value)}%`,
        true,
      ),
      metas: buildDimensionRanking(
        units,
        (row) => row.goalFulfillmentPercent,
        (value) => `${formatPercent(value)}%`,
      ),
    },
    evolution: {
      mode: useMonthlyEvolution ? 'monthly' : 'daily',
      compositePoints: buildSeries(pickComposite),
      productionPoints: buildSeries(pickProduction),
      goalPoints: buildSeries(pickGoals),
    },
    goals: {
      completionRatePercent: NETWORK_GOALS.completionRatePercent,
      maxAbandonmentRatePercent: NETWORK_GOALS.maxAbandonmentRatePercent,
      maxWaitMinutes: NETWORK_GOALS.maxWaitMinutes,
      minAttendanceRatePercent: NETWORK_GOALS.minAttendanceRatePercent,
    },
  }
}
