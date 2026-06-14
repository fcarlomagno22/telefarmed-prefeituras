import { supabaseAdmin } from '../../db/supabase.js'
import {
  buildDailySeries,
  computeDeltaPercent,
  computeDeltaPp,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { periodBounds, resolvePreviousPeriod, spDateKey } from '../prefeitura-consultas/period.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import type {
  PrefeituraConsultasDailyPointDto,
  PrefeituraConsultasKpiDto,
} from '../prefeitura-consultas/types.js'
import type {
  FluxoTerminalFunnelStageDto,
  FluxoTerminalHighlightDto,
  FluxoTerminalOriginRowDto,
  FluxoTerminalReportDto,
  FluxoTerminalReportUnitRowDto,
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

type FilaFlowRow = {
  id: string
  unidade_ubt_id: string
  status: string
  origem: string
  chegada_em: string
  chamado_em: string | null
  atendimento_inicio_em: string | null
  encerrado_em: string | null
  agenda_consulta_id: string | null
}

type ConsultaFlowRow = {
  unidade_ubt_id: string
  status: string
  criado_em: string
  iniciada_em: string | null
  finalizada_em: string | null
  fila_espera_id: string | null
  agenda_consulta_id: string | null
}

type UnitFlowMetrics = {
  arrivals: number
  triaged: number
  referred: number
  completed: number
  abandoned: number
  triageMinutesSum: number
  triageMinutesCount: number
  journeyMinutesSum: number
  journeyMinutesCount: number
}

type DailyFlowBucket = {
  arrivals: number
  completed: number
  triageMinutesSum: number
  triageMinutesCount: number
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

function emptyUnitMetrics(): UnitFlowMetrics {
  return {
    arrivals: 0,
    triaged: 0,
    referred: 0,
    completed: 0,
    abandoned: 0,
    triageMinutesSum: 0,
    triageMinutesCount: 0,
    journeyMinutesSum: 0,
    journeyMinutesCount: 0,
  }
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

function minutesBetween(startIso: string, endIso: string) {
  return Math.max(0, Math.round((Date.parse(endIso) - Date.parse(startIso)) / 60_000))
}

function conversionPercent(numerator: number, denominator: number) {
  if (denominator <= 0) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

function completionRatePercent(completed: number, arrivals: number) {
  return conversionPercent(completed, arrivals)
}

function avgMinutes(sum: number, count: number) {
  return count > 0 ? Math.round(sum / count) : 0
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

function isTriaged(row: FilaFlowRow) {
  return Boolean(row.chamado_em || row.atendimento_inicio_em || row.status !== 'aguardando')
}

function triageEndTimestamp(row: FilaFlowRow) {
  return row.atendimento_inicio_em ?? row.chamado_em
}

function isReferredConsulta(row: ConsultaFlowRow) {
  const status = String(row.status)
  return (
    Boolean(row.iniciada_em) ||
    status === 'aguardando_medico' ||
    status === 'em_andamento' ||
    status === 'concluida'
  )
}

function isCompletedConsulta(row: ConsultaFlowRow) {
  return String(row.status) === 'concluida'
}

async function loadFilaRowsInPeriod(
  entidadeId: string,
  unitIds: string[],
  periodStart: string,
  periodEnd: string,
): Promise<FilaFlowRow[]> {
  if (unitIds.length === 0) return []

  const { startIso, endIso } = periodBounds(periodStart, periodEnd)
  const { data, error } = await supabaseAdmin
    .from('fila_espera')
    .select(
      'id, unidade_ubt_id, status, origem, chegada_em, chamado_em, atendimento_inicio_em, encerrado_em, agenda_consulta_id',
    )
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .gte('chegada_em', startIso)
    .lte('chegada_em', endIso)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as FilaFlowRow[]
}

async function loadConsultasInPeriod(
  entidadeId: string,
  unitIds: string[],
  periodStart: string,
  periodEnd: string,
): Promise<ConsultaFlowRow[]> {
  if (unitIds.length === 0) return []

  const { startIso, endIso } = periodBounds(periodStart, periodEnd)
  const { data, error } = await supabaseAdmin
    .from('vw_consultas_operacional')
    .select(
      'unidade_ubt_id, status, criado_em, iniciada_em, finalizada_em, fila_espera_id, agenda_consulta_id',
    )
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .gte('criado_em', startIso)
    .lte('criado_em', endIso)

  if (error) {
    if (isMissingRelationError(error)) return []
    throw error
  }

  return (data ?? []) as ConsultaFlowRow[]
}

function buildConsultaLookup(consultas: ConsultaFlowRow[]) {
  const byFilaId = new Map<string, ConsultaFlowRow>()
  const byAgendaId = new Map<string, ConsultaFlowRow>()

  for (const row of consultas) {
    if (row.fila_espera_id) byFilaId.set(String(row.fila_espera_id), row)
    if (row.agenda_consulta_id) byAgendaId.set(String(row.agenda_consulta_id), row)
  }

  return { byFilaId, byAgendaId }
}

function resolveConsultaForFila(
  row: FilaFlowRow,
  lookup: ReturnType<typeof buildConsultaLookup>,
): ConsultaFlowRow | null {
  return (
    lookup.byFilaId.get(String(row.id)) ??
    (row.agenda_consulta_id
      ? (lookup.byAgendaId.get(String(row.agenda_consulta_id)) ?? null)
      : null)
  )
}

function buildUnitMetricsMap(
  units: RedeUnitApi[],
  filaRows: FilaFlowRow[],
  consultas: ConsultaFlowRow[],
) {
  const metrics = new Map<string, UnitFlowMetrics>()
  for (const unit of units) {
    metrics.set(unit.id, emptyUnitMetrics())
  }

  const lookup = buildConsultaLookup(consultas)
  const referredFilaIds = new Set<string>()
  const completedFilaIds = new Set<string>()

  for (const row of filaRows) {
    const unitId = String(row.unidade_ubt_id)
    const current = metrics.get(unitId)
    if (!current) continue

    current.arrivals += 1

    if (row.status === 'desistiu') {
      current.abandoned += 1
    }

    if (isTriaged(row)) {
      current.triaged += 1
      const triageEnd = triageEndTimestamp(row)
      if (triageEnd) {
        current.triageMinutesSum += minutesBetween(String(row.chegada_em), triageEnd)
        current.triageMinutesCount += 1
      }
    }

    const consulta = resolveConsultaForFila(row, lookup)
    if (consulta && isReferredConsulta(consulta) && !referredFilaIds.has(String(row.id))) {
      referredFilaIds.add(String(row.id))
      current.referred += 1
    }

    if (consulta && isCompletedConsulta(consulta) && !completedFilaIds.has(String(row.id))) {
      completedFilaIds.add(String(row.id))
      current.completed += 1

      if (consulta.finalizada_em) {
        current.journeyMinutesSum += minutesBetween(String(row.chegada_em), String(consulta.finalizada_em))
        current.journeyMinutesCount += 1
      }
    }
  }

  return metrics
}

function aggregateNetwork(metricsMap: Map<string, UnitFlowMetrics>) {
  const totals = emptyUnitMetrics()
  for (const metrics of metricsMap.values()) {
    totals.arrivals += metrics.arrivals
    totals.triaged += metrics.triaged
    totals.referred += metrics.referred
    totals.completed += metrics.completed
    totals.abandoned += metrics.abandoned
    totals.triageMinutesSum += metrics.triageMinutesSum
    totals.triageMinutesCount += metrics.triageMinutesCount
    totals.journeyMinutesSum += metrics.journeyMinutesSum
    totals.journeyMinutesCount += metrics.journeyMinutesCount
  }

  return {
    ...totals,
    completionRatePercent: completionRatePercent(totals.completed, totals.arrivals),
    avgTriageMinutes: avgMinutes(totals.triageMinutesSum, totals.triageMinutesCount),
    avgJourneyMinutes: avgMinutes(totals.journeyMinutesSum, totals.journeyMinutesCount),
  }
}

function buildFunnel(network: ReturnType<typeof aggregateNetwork>): FluxoTerminalFunnelStageDto[] {
  return [
    {
      stage: 'chegada',
      label: 'Chegada no terminal',
      count: network.arrivals,
      conversionPercent: 100,
      avgMinutes: 0,
    },
    {
      stage: 'triagem',
      label: 'Triagem concluída',
      count: network.triaged,
      conversionPercent: conversionPercent(network.triaged, network.arrivals),
      avgMinutes: network.avgTriageMinutes,
    },
    {
      stage: 'encaminhamento',
      label: 'Encaminhamento à consulta',
      count: network.referred,
      conversionPercent: conversionPercent(network.referred, network.triaged),
      avgMinutes: 0,
    },
    {
      stage: 'conclusao',
      label: 'Consulta concluída',
      count: network.completed,
      conversionPercent: conversionPercent(network.completed, network.referred),
      avgMinutes: network.avgJourneyMinutes,
    },
  ]
}

function buildOrigins(
  filaRows: FilaFlowRow[],
  consultas: ConsultaFlowRow[],
): FluxoTerminalOriginRowDto[] {
  const lookup = buildConsultaLookup(consultas)
  const buckets = new Map<
    'agendado' | 'espontaneo',
    { count: number; completed: number }
  >()

  for (const row of filaRows) {
    const origin = row.origem === 'espontaneo' ? 'espontaneo' : 'agendado'
    const current = buckets.get(origin) ?? { count: 0, completed: 0 }
    current.count += 1

    const consulta = resolveConsultaForFila(row, lookup)
    if (consulta && isCompletedConsulta(consulta)) {
      current.completed += 1
    }

    buckets.set(origin, current)
  }

  const labels = {
    agendado: 'Agendado',
    espontaneo: 'Espontâneo',
  } as const

  return (['agendado', 'espontaneo'] as const).map((origin) => {
    const bucket = buckets.get(origin) ?? { count: 0, completed: 0 }
    return {
      origin,
      label: labels[origin],
      count: bucket.count,
      completionRatePercent: completionRatePercent(bucket.completed, bucket.count),
    }
  })
}

function buildHighlights(
  units: FluxoTerminalReportUnitRowDto[],
  network: ReturnType<typeof aggregateNetwork>,
): FluxoTerminalHighlightDto[] {
  if (units.length === 0) return []

  const topArrivals = [...units].sort((a, b) => b.arrivals - a.arrivals)[0]
  const topCompletion = [...units].sort(
    (a, b) => b.completionRatePercent - a.completionRatePercent,
  )[0]
  const fastestTriage = [...units]
    .filter((unit) => unit.avgTriageMinutes > 0)
    .sort((a, b) => a.avgTriageMinutes - b.avgTriageMinutes)[0]
  const highestAbandonment = [...units].sort((a, b) => b.abandoned - a.abandoned)[0]

  return [
    {
      id: 'top-arrivals',
      title: 'Maior fluxo de chegadas',
      subtitle: `${topArrivals?.name ?? '—'} · ${formatNumber(topArrivals?.arrivals ?? 0)} pacientes`,
      tone: 'blue',
    },
    {
      id: 'top-completion',
      title: 'Melhor conclusão da jornada',
      subtitle: `${topCompletion?.name ?? '—'} · ${formatPercent(topCompletion?.completionRatePercent ?? 0)}% concluídos`,
      tone: 'green',
    },
    {
      id: 'fastest-triage',
      title: 'Triagem mais rápida',
      subtitle: fastestTriage
        ? `${fastestTriage.name} · ${fastestTriage.avgTriageMinutes} min em média`
        : `Rede · ${network.avgTriageMinutes} min em média`,
      tone: 'amber',
    },
    {
      id: 'highest-abandonment',
      title: 'Maior abandono no terminal',
      subtitle: `${highestAbandonment?.name ?? '—'} · ${formatNumber(highestAbandonment?.abandoned ?? 0)} desistências`,
      tone: 'red',
    },
  ]
}

function buildDailyBuckets(filaRows: FilaFlowRow[], consultas: ConsultaFlowRow[]) {
  const buckets = new Map<string, DailyFlowBucket>()
  const lookup = buildConsultaLookup(consultas)
  const completedFilaIdsByDate = new Map<string, Set<string>>()

  function ensureBucket(date: string) {
    const current = buckets.get(date)
    if (current) return current
    const next: DailyFlowBucket = {
      arrivals: 0,
      completed: 0,
      triageMinutesSum: 0,
      triageMinutesCount: 0,
    }
    buckets.set(date, next)
    return next
  }

  for (const row of filaRows) {
    const date = spDateKey(row.chegada_em)
    const bucket = ensureBucket(date)
    bucket.arrivals += 1

    const triageEnd = triageEndTimestamp(row)
    if (triageEnd) {
      bucket.triageMinutesSum += minutesBetween(String(row.chegada_em), triageEnd)
      bucket.triageMinutesCount += 1
    }

    const consulta = resolveConsultaForFila(row, lookup)
    if (consulta && isCompletedConsulta(consulta)) {
      const completedSet = completedFilaIdsByDate.get(date) ?? new Set<string>()
      if (!completedSet.has(String(row.id))) {
        completedSet.add(String(row.id))
        completedFilaIdsByDate.set(date, completedSet)
        bucket.completed += 1
      }
    }
  }

  return buckets
}

function bucketsToDailyCounts(
  buckets: Map<string, DailyFlowBucket>,
  picker: (bucket: DailyFlowBucket) => number,
) {
  const counts = new Map<string, number>()
  for (const [date, bucket] of buckets) {
    counts.set(date, picker(bucket))
  }
  return counts
}

function buildMonthlySeries(
  buckets: Map<string, DailyFlowBucket>,
  periodStart: string,
  periodEnd: string,
  picker: (bucket: DailyFlowBucket) => number,
): PrefeituraConsultasDailyPointDto[] {
  const monthly = new Map<string, DailyFlowBucket>()

  for (const [date, bucket] of buckets) {
    const monthKey = date.slice(0, 7)
    const current = monthly.get(monthKey) ?? {
      arrivals: 0,
      completed: 0,
      triageMinutesSum: 0,
      triageMinutesCount: 0,
    }
    current.arrivals += bucket.arrivals
    current.completed += bucket.completed
    current.triageMinutesSum += bucket.triageMinutesSum
    current.triageMinutesCount += bucket.triageMinutesCount
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

function buildKpis(summary: FluxoTerminalReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Chegadas no terminal',
      value: formatNumber(summary.arrivals),
      footer:
        summary.arrivalsDeltaPercent === 0
          ? 'Estável vs período anterior'
          : `${summary.arrivalsDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.arrivalsDeltaPercent)}% vs período anterior`,
      footerTone: summary.arrivalsDeltaPercent >= 0 ? 'positive' : 'muted',
      footerIcon: summary.arrivalsDeltaPercent >= 0 ? 'up' : 'down',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Taxa de conclusão da jornada',
      value: `${formatPercent(summary.completionRatePercent)}%`,
      footer:
        summary.completionDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.completionDeltaPp > 0 ? '+' : ''}${formatPercent(summary.completionDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.completionDeltaPp >= 0 ? 'positive' : 'muted',
      footerIcon: summary.completionDeltaPp >= 0 ? 'up' : 'down',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Tempo médio de triagem',
      value: summary.avgTriageMinutes > 0 ? `${summary.avgTriageMinutes} min` : '—',
      footer: 'Da chegada até a chamada ou início do atendimento presencial',
      footerTone: 'neutral',
      topBar: 'from-cyan-400 to-sky-500',
    },
    {
      label: 'Encaminhamentos realizados',
      value: formatNumber(summary.referred),
      footer: 'Pacientes encaminhados à teleconsulta após triagem',
      footerTone: 'neutral',
      topBar: 'from-indigo-400 to-blue-600',
    },
    {
      label: 'Desistências no terminal',
      value: formatNumber(summary.abandoned),
      footer: 'Pacientes que abandonaram a jornada antes da conclusão',
      footerTone: 'muted',
      topBar: 'from-rose-400 to-red-500',
    },
  ]
}

export async function getFluxoTerminalReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<FluxoTerminalReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const dayCount = countDaysInclusive(params.periodStart, params.periodEnd)
  const useMonthlyEvolution = dayCount > 45

  const [currentFilaRows, previousFilaRows, currentConsultas, previousConsultas] =
    await Promise.all([
      loadFilaRowsInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
      loadFilaRowsInPeriod(
        entidadeId,
        unitIds,
        previous.previousStart,
        previous.previousEnd,
      ),
      loadConsultasInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
      loadConsultasInPeriod(
        entidadeId,
        unitIds,
        previous.previousStart,
        previous.previousEnd,
      ),
    ])

  const currentMetricsMap = buildUnitMetricsMap(visibleUnits, currentFilaRows, currentConsultas)
  const previousMetricsMap = buildUnitMetricsMap(visibleUnits, previousFilaRows, previousConsultas)
  const currentNetwork = aggregateNetwork(currentMetricsMap)
  const previousNetwork = aggregateNetwork(previousMetricsMap)

  const units: FluxoTerminalReportUnitRowDto[] = visibleUnits
    .map((unit) => {
      const metrics = currentMetricsMap.get(unit.id) ?? emptyUnitMetrics()
      const completionRate = completionRatePercent(metrics.completed, metrics.arrivals)

      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        arrivals: metrics.arrivals,
        triaged: metrics.triaged,
        referred: metrics.referred,
        completed: metrics.completed,
        abandoned: metrics.abandoned,
        completionRatePercent: completionRate,
        avgTriageMinutes: avgMinutes(metrics.triageMinutesSum, metrics.triageMinutesCount),
        avgJourneyMinutes: avgMinutes(metrics.journeyMinutesSum, metrics.journeyMinutesCount),
        completionVsNetworkPp: completionRate - currentNetwork.completionRatePercent,
      }
    })
    .sort((a, b) => b.arrivals - a.arrivals)

  const dailyBuckets = buildDailyBuckets(currentFilaRows, currentConsultas)
  const pickArrivals = (bucket: DailyFlowBucket) => bucket.arrivals
  const pickCompleted = (bucket: DailyFlowBucket) => bucket.completed
  const pickCompletionRate = (bucket: DailyFlowBucket) =>
    completionRatePercent(bucket.completed, bucket.arrivals)
  const pickTriageTime = (bucket: DailyFlowBucket) =>
    avgMinutes(bucket.triageMinutesSum, bucket.triageMinutesCount)

  const buildSeries = useMonthlyEvolution
    ? (picker: (bucket: DailyFlowBucket) => number) =>
        buildMonthlySeries(dailyBuckets, params.periodStart, params.periodEnd, picker)
    : (picker: (bucket: DailyFlowBucket) => number) =>
        buildDailySeries(
          bucketsToDailyCounts(dailyBuckets, picker),
          params.periodStart,
          params.periodEnd,
        )

  const summary = {
    arrivals: currentNetwork.arrivals,
    triaged: currentNetwork.triaged,
    referred: currentNetwork.referred,
    completed: currentNetwork.completed,
    abandoned: currentNetwork.abandoned,
    completionRatePercent: currentNetwork.completionRatePercent,
    avgTriageMinutes: currentNetwork.avgTriageMinutes,
    avgJourneyMinutes: currentNetwork.avgJourneyMinutes,
    unitsCount: visibleUnits.length,
    arrivalsDeltaPercent: computeDeltaPercent(currentNetwork.arrivals, previousNetwork.arrivals),
    completionDeltaPp: computeDeltaPp(
      currentNetwork.completionRatePercent,
      previousNetwork.completionRatePercent,
    ),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  return {
    reportId: 'fluxo-terminal',
    title: 'Fluxo do terminal',
    description:
      'Jornada do paciente no terminal de autoatendimento: chegada, triagem, encaminhamento e conclusão da consulta.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(units, currentNetwork),
    funnel: buildFunnel(currentNetwork),
    origins: buildOrigins(currentFilaRows, currentConsultas),
    units,
    evolution: {
      mode: useMonthlyEvolution ? 'monthly' : 'daily',
      arrivalPoints: buildSeries(pickArrivals),
      completionPoints: buildSeries(pickCompleted),
      completionRatePoints: buildSeries(pickCompletionRate),
      triageTimePoints: buildSeries(pickTriageTime),
    },
  }
}
