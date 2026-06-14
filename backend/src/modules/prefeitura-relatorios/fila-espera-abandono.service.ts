import { supabaseAdmin } from '../../db/supabase.js'
import {
  computeDeltaPercent,
  computeDeltaPp,
  formatPeriodLabel,
  buildDailySeries,
} from '../prefeitura-consultas/formatters.js'
import { periodBounds, resolvePreviousPeriod, spDateKey } from '../prefeitura-consultas/period.js'
import { fetchConsultasForPeriod } from '../prefeitura-consultas/query.service.js'
import type {
  ConsultaAggregateRow,
  PrefeituraConsultasDailyPointDto,
  PrefeituraConsultasKpiDto,
} from '../prefeitura-consultas/types.js'
import { fetchUnitsMetrics } from '../prefeitura-rede/metrics.service.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import type { FilaEsperaAbandonoReportDto, FilaEsperaAbandonoReportUnitRowDto } from './types.js'

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

type FilaPeriodRow = {
  unidade_ubt_id: string
  status: string
  chegada_em: string
  chamado_em: string | null
  atendimento_inicio_em: string | null
}

type UnitFilaMetrics = {
  completed: number
  cancelled: number
  abandoned: number
  filaProcessed: number
  avgWaitMinutes: number
}

type DailyFilaBucket = {
  waitSum: number
  waitCount: number
  completed: number
  cancelled: number
  abandoned: number
  filaVolume: number
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

function emptyUnitMetrics(): UnitFilaMetrics {
  return {
    completed: 0,
    cancelled: 0,
    abandoned: 0,
    filaProcessed: 0,
    avgWaitMinutes: 0,
  }
}

function computeAbandonmentRate(metrics: UnitFilaMetrics) {
  const total = metrics.completed + metrics.cancelled + metrics.abandoned
  if (total <= 0) return 0
  return Math.round(((metrics.cancelled + metrics.abandoned) / total) * 1000) / 10
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

function waitEndTimestamp(row: FilaPeriodRow): string | null {
  return row.atendimento_inicio_em ?? row.chamado_em
}

function waitMinutesBetween(chegadaEm: string, waitEndEm: string) {
  return Math.max(
    0,
    Math.round((Date.parse(String(waitEndEm)) - Date.parse(String(chegadaEm))) / 60_000),
  )
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

function buildUnitMetricsMap(
  units: RedeUnitApi[],
  consultas: ConsultaAggregateRow[],
  filaRows: FilaPeriodRow[],
) {
  const metrics = new Map<string, UnitFilaMetrics>()
  for (const unit of units) {
    metrics.set(unit.id, emptyUnitMetrics())
  }

  for (const row of consultas) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue

    const status = String(row.status)
    if (status === 'concluida') current.completed += 1
    else if (status === 'cancelada' || status === 'interrompida') current.cancelled += 1
  }

  const waitTotals = new Map<string, { sum: number; count: number }>()
  for (const row of filaRows) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue

    current.filaProcessed += 1
    if (row.status === 'desistiu') current.abandoned += 1

    const waitEndEm = waitEndTimestamp(row)
    if (waitEndEm) {
      const waitMinutes = waitMinutesBetween(String(row.chegada_em), waitEndEm)
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

  return metrics
}

function buildDailyBuckets(
  consultas: ConsultaAggregateRow[],
  filaRows: FilaPeriodRow[],
): Map<string, DailyFilaBucket> {
  const buckets = new Map<string, DailyFilaBucket>()

  function ensureBucket(date: string) {
    const current = buckets.get(date)
    if (current) return current
    const next: DailyFilaBucket = {
      waitSum: 0,
      waitCount: 0,
      completed: 0,
      cancelled: 0,
      abandoned: 0,
      filaVolume: 0,
    }
    buckets.set(date, next)
    return next
  }

  for (const row of consultas) {
    const date = spDateKey(row.criado_em)
    const bucket = ensureBucket(date)
    const status = String(row.status)
    if (status === 'concluida') bucket.completed += 1
    else if (status === 'cancelada' || status === 'interrompida') bucket.cancelled += 1
  }

  for (const row of filaRows) {
    const date = spDateKey(row.chegada_em)
    const bucket = ensureBucket(date)
    bucket.filaVolume += 1
    if (row.status === 'desistiu') bucket.abandoned += 1

    const waitEndEm = waitEndTimestamp(row)
    if (waitEndEm) {
      bucket.waitSum += waitMinutesBetween(String(row.chegada_em), waitEndEm)
      bucket.waitCount += 1
    }
  }

  return buckets
}

function bucketsToDailyCounts(
  buckets: Map<string, DailyFilaBucket>,
  picker: (bucket: DailyFilaBucket) => number,
) {
  const counts = new Map<string, number>()
  for (const [date, bucket] of buckets) {
    counts.set(date, picker(bucket))
  }
  return counts
}

function buildMonthlySeries(
  buckets: Map<string, DailyFilaBucket>,
  periodStart: string,
  periodEnd: string,
  picker: (bucket: DailyFilaBucket) => number,
): PrefeituraConsultasDailyPointDto[] {
  const monthly = new Map<string, DailyFilaBucket>()

  for (const [date, bucket] of buckets) {
    const monthKey = date.slice(0, 7)
    const current = monthly.get(monthKey) ?? {
      waitSum: 0,
      waitCount: 0,
      completed: 0,
      cancelled: 0,
      abandoned: 0,
      filaVolume: 0,
    }
    current.waitSum += bucket.waitSum
    current.waitCount += bucket.waitCount
    current.completed += bucket.completed
    current.cancelled += bucket.cancelled
    current.abandoned += bucket.abandoned
    current.filaVolume += bucket.filaVolume
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

function aggregateNetwork(metricsMap: Map<string, UnitFilaMetrics>) {
  let completed = 0
  let cancelled = 0
  let abandoned = 0
  let filaProcessed = 0
  let waitSum = 0
  let waitCount = 0

  for (const metrics of metricsMap.values()) {
    completed += metrics.completed
    cancelled += metrics.cancelled
    abandoned += metrics.abandoned
    filaProcessed += metrics.filaProcessed
    if (metrics.avgWaitMinutes > 0) {
      waitSum += metrics.avgWaitMinutes
      waitCount += 1
    }
  }

  const networkMetrics: UnitFilaMetrics = {
    completed,
    cancelled,
    abandoned,
    filaProcessed,
    avgWaitMinutes: waitCount > 0 ? Math.round(waitSum / waitCount) : 0,
  }

  return {
    networkMetrics,
    abandonmentRatePercent: computeAbandonmentRate(networkMetrics),
    absencesTotal: abandoned + cancelled,
  }
}

function buildKpis(summary: FilaEsperaAbandonoReportDto['summary']): PrefeituraConsultasKpiDto[] {
  const waitDelta = summary.avgWaitDeltaMinutes
  const abandonmentDelta = summary.abandonmentDeltaPp

  return [
    {
      label: 'Fila na rede (agora)',
      value: formatNumber(summary.queueNow),
      footer: 'Pacientes aguardando ou chamados no terminal',
      footerTone: 'neutral',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Tempo médio de espera',
      value: summary.avgWaitMinutes > 0 ? `${summary.avgWaitMinutes} min` : '—',
      footer:
        waitDelta === 0
          ? 'Estável vs período anterior'
          : `${waitDelta > 0 ? '+' : ''}${waitDelta} min vs período anterior`,
      footerTone: waitDelta <= 0 ? 'positive' : 'muted',
      footerIcon: waitDelta <= 0 ? 'down' : 'up',
      topBar: 'from-cyan-400 to-sky-500',
    },
    {
      label: 'Taxa de abandono',
      value: `${formatPercent(summary.abandonmentRatePercent)}%`,
      footer:
        abandonmentDelta === 0
          ? 'Estável vs período anterior'
          : `${abandonmentDelta > 0 ? '+' : ''}${formatPercent(abandonmentDelta)} p.p. vs período anterior`,
      footerTone: abandonmentDelta <= 0 ? 'positive' : 'muted',
      footerIcon: abandonmentDelta <= 0 ? 'down' : 'up',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      label: 'Pacientes na fila (período)',
      value: formatNumber(summary.filaProcessed),
      footer: 'Entradas finalizadas ou com desistência no terminal',
      footerTone: 'neutral',
      topBar: 'from-indigo-400 to-blue-600',
    },
    {
      label: 'Desistências e cancelamentos',
      value: formatNumber(summary.absencesTotal),
      footer: 'Desistências na fila + consultas canceladas ou interrompidas',
      footerTone: 'muted',
      topBar: 'from-violet-400 to-purple-600',
    },
  ]
}

export async function getFilaEsperaAbandonoReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<FilaEsperaAbandonoReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const stationsOnlineByUnit = new Map(visibleUnits.map((unit) => [unit.id, unit.stationsOnline]))
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const dayCount = countDaysInclusive(params.periodStart, params.periodEnd)
  const useMonthlyEvolution = dayCount > 45

  const [
    currentConsultas,
    previousConsultas,
    currentFilaRows,
    previousFilaRows,
    liveMetrics,
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
    fetchUnitsMetrics(entidadeId, unitIds, stationsOnlineByUnit),
  ])

  const currentMetricsMap = buildUnitMetricsMap(visibleUnits, currentConsultas, currentFilaRows)
  const previousMetricsMap = buildUnitMetricsMap(visibleUnits, previousConsultas, previousFilaRows)
  const currentNetwork = aggregateNetwork(currentMetricsMap)
  const previousNetwork = aggregateNetwork(previousMetricsMap)

  const queueNow = [...liveMetrics.values()].reduce((sum, item) => sum + (item.queueNow ?? 0), 0)

  const units: FilaEsperaAbandonoReportUnitRowDto[] = visibleUnits
    .map((unit) => {
      const metrics = currentMetricsMap.get(unit.id) ?? emptyUnitMetrics()
      const abandonmentRatePercent = computeAbandonmentRate(metrics)
      const absencesTotal = metrics.abandoned + metrics.cancelled

      return {
        id: unit.id,
        name: unit.name,
        address: unit.address,
        region: unit.region,
        regionKey: unit.regionKey,
        queueNow: liveMetrics.get(unit.id)?.queueNow ?? 0,
        avgWaitMinutes: metrics.avgWaitMinutes,
        filaProcessed: metrics.filaProcessed,
        abandoned: metrics.abandoned,
        cancelled: metrics.cancelled,
        completed: metrics.completed,
        abandonmentRatePercent,
        absencesTotal,
        waitVsNetworkMinutes: metrics.avgWaitMinutes - currentNetwork.networkMetrics.avgWaitMinutes,
        abandonmentVsNetworkPp:
          abandonmentRatePercent - currentNetwork.abandonmentRatePercent,
      }
    })
    .sort((a, b) => b.abandonmentRatePercent - a.abandonmentRatePercent)

  const dailyBuckets = buildDailyBuckets(currentConsultas, currentFilaRows)
  const pickWait = (bucket: DailyFilaBucket) =>
    bucket.waitCount > 0 ? Math.round(bucket.waitSum / bucket.waitCount) : 0
  const pickAbandonment = (bucket: DailyFilaBucket) => {
    const total = bucket.completed + bucket.cancelled + bucket.abandoned
    if (total <= 0) return 0
    return Math.round(((bucket.cancelled + bucket.abandoned) / total) * 1000) / 10
  }
  const pickVolume = (bucket: DailyFilaBucket) => bucket.filaVolume

  const buildSeries = useMonthlyEvolution
    ? (picker: (bucket: DailyFilaBucket) => number) =>
        buildMonthlySeries(dailyBuckets, params.periodStart, params.periodEnd, picker)
    : (picker: (bucket: DailyFilaBucket) => number) =>
        buildDailySeries(
          bucketsToDailyCounts(dailyBuckets, picker),
          params.periodStart,
          params.periodEnd,
        )

  const summary = {
    queueNow,
    filaProcessed: currentNetwork.networkMetrics.filaProcessed,
    avgWaitMinutes: currentNetwork.networkMetrics.avgWaitMinutes,
    abandonmentRatePercent: currentNetwork.abandonmentRatePercent,
    absencesTotal: currentNetwork.absencesTotal,
    unitsCount: visibleUnits.length,
    avgWaitDeltaMinutes:
      currentNetwork.networkMetrics.avgWaitMinutes -
      previousNetwork.networkMetrics.avgWaitMinutes,
    abandonmentDeltaPp: computeDeltaPp(
      currentNetwork.abandonmentRatePercent,
      previousNetwork.abandonmentRatePercent,
    ),
    filaProcessedDeltaPercent: computeDeltaPercent(
      currentNetwork.networkMetrics.filaProcessed,
      previousNetwork.networkMetrics.filaProcessed,
    ),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }

  summary.kpis = buildKpis(summary)

  return {
    reportId: 'fila-espera-abandono',
    title: 'Fila, espera e abandono',
    description:
      'Tempo médio de espera, tamanho da fila e taxa de abandono antes ou durante o atendimento no terminal.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    units,
    evolution: {
      mode: useMonthlyEvolution ? 'monthly' : 'daily',
      waitPoints: buildSeries(pickWait),
      abandonmentPoints: buildSeries(pickAbandonment),
      volumePoints: buildSeries(pickVolume),
    },
  }
}
