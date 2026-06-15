import { supabaseAdmin } from '../../db/supabase.js'
import { loadTriageSummariesForDashboard } from '../admin-dashboard/catalog.service.js'
import { aggregateTriageCharts } from '../admin-dashboard/triage-metrics.service.js'
import { aggregateConsultas } from '../prefeitura-consultas/formatters.js'
import { fetchConsultasForPeriod } from '../prefeitura-consultas/query.service.js'
import { fetchUnitsMetrics } from '../prefeitura-rede/metrics.service.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  bucketConsultationHour,
  formatTimelineHourLabels,
} from '../prefeitura-monitor/period.js'
import {
  buildAlerts,
  buildFilterOptions,
  buildKpis,
  buildRegionVolumes,
  buildSlaRows,
  buildSpecialtyStats,
  buildUbsRow,
} from './formatters.js'
import { countOnlineHealthProfessionals } from './professionals-online.service.js'
import { resolveDashboardPeriod } from './period.js'
import type {
  DashboardPeriod,
  PrefeituraDashboardHourlyPointDto,
  PrefeituraDashboardOverviewDto,
  UnitWaitStats,
} from './types.js'

type FilaPeriodRow = {
  unidade_ubt_id: string
  status: string
  chegada_em: string
  atendimento_inicio_em: string | null
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

function throwUnlessMissingRelation(error: unknown): void {
  if (!error) return
  if (!isMissingRelationError(error)) throw error
}

function filterUnits(
  units: RedeUnitApi[],
  params: { regionKey: string; unidadeUbtId?: string },
): RedeUnitApi[] {
  let filtered = units.filter((unit) => unit.status !== 'inativa')

  if (params.regionKey !== 'todas') {
    filtered = filtered.filter((unit) => unit.regionKey === params.regionKey)
  }

  if (params.unidadeUbtId) {
    filtered = filtered.filter((unit) => unit.id === params.unidadeUbtId)
  }

  return filtered
}

async function loadUnitTypes(
  entidadeId: string,
  unitIds: string[],
): Promise<Map<string, 'fixa' | 'movel'>> {
  const map = new Map<string, 'fixa' | 'movel'>()
  if (unitIds.length === 0) return map

  const { data, error } = await supabaseAdmin
    .from('unidades_ubt')
    .select('id, tipo_unidade')
    .eq('entidade_contratante_id', entidadeId)
    .in('id', unitIds)

  if (error) {
    throwUnlessMissingRelation(error)
    return map
  }

  for (const row of data ?? []) {
    const tipo = String(row.tipo_unidade)
    map.set(String(row.id), tipo === 'movel' ? 'movel' : 'fixa')
  }

  return map
}

async function loadFilaRowsInPeriod(
  entidadeId: string,
  unitIds: string[],
  startIso: string,
  endIso: string,
): Promise<FilaPeriodRow[]> {
  if (unitIds.length === 0) return []

  const { data, error } = await supabaseAdmin
    .from('fila_espera')
    .select('unidade_ubt_id, status, chegada_em, atendimento_inicio_em')
    .eq('entidade_contratante_id', entidadeId)
    .in('unidade_ubt_id', unitIds)
    .gte('chegada_em', startIso)
    .lte('chegada_em', endIso)
    .in('status', ['finalizado', 'desistiu'])

  if (error) {
    throwUnlessMissingRelation(error)
    return []
  }

  return (data ?? []) as FilaPeriodRow[]
}

function buildWaitStatsByUnit(filaRows: FilaPeriodRow[]): Map<string, UnitWaitStats> {
  const stats = new Map<string, UnitWaitStats>()
  const waitTotals = new Map<string, { sum: number; count: number }>()

  for (const row of filaRows) {
    const unitId = String(row.unidade_ubt_id)
    const current = stats.get(unitId) ?? { avgWaitMinutes: 0, absences: 0 }

    if (row.status === 'desistiu') {
      current.absences += 1
    }

    if (row.atendimento_inicio_em) {
      const waitMinutes = Math.max(
        0,
        Math.round(
          (Date.parse(String(row.atendimento_inicio_em)) - Date.parse(String(row.chegada_em))) /
            60_000,
        ),
      )
      const bucket = waitTotals.get(unitId) ?? { sum: 0, count: 0 }
      bucket.sum += waitMinutes
      bucket.count += 1
      waitTotals.set(unitId, bucket)
    }

    stats.set(unitId, current)
  }

  for (const [unitId, bucket] of waitTotals) {
    const current = stats.get(unitId) ?? { avgWaitMinutes: 0, absences: 0 }
    current.avgWaitMinutes = bucket.count > 0 ? Math.round(bucket.sum / bucket.count) : 0
    stats.set(unitId, current)
  }

  return stats
}

function buildHourlySeries(
  consultas: Awaited<ReturnType<typeof fetchConsultasForPeriod>>,
): PrefeituraDashboardHourlyPointDto[] {
  const labels = formatTimelineHourLabels()
  const values = Array.from({ length: labels.length }, () => 0)

  for (const row of consultas) {
    const bucketIndex = bucketConsultationHour(row.iniciada_em ?? row.criado_em)
    if (bucketIndex == null) continue
    values[bucketIndex] = (values[bucketIndex] ?? 0) + 1
  }

  return labels.map((hour, index) => ({
    hour,
    value: values[index] ?? 0,
  }))
}

function emptyWaitStats(): UnitWaitStats {
  return { avgWaitMinutes: 0, absences: 0 }
}

export async function getPrefeituraDashboardOverview(
  entidadeId: string,
  params: { period: DashboardPeriod; regionKey: string; unidadeUbtId?: string },
): Promise<PrefeituraDashboardOverviewDto> {
  const range = resolveDashboardPeriod(params.period)
  const allUnits = await listRedeUnits(entidadeId)
  const visibleUnits = filterUnits(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const stationsOnlineByUnit = new Map(visibleUnits.map((unit) => [unit.id, unit.stationsOnline]))

  const [consultas, filaRows, liveMetrics, unitTypes, professionalsOnline] = await Promise.all([
    fetchConsultasForPeriod(entidadeId, range.periodStart, range.periodEnd, unitIds),
    loadFilaRowsInPeriod(entidadeId, unitIds, range.startIso, range.endIso),
    fetchUnitsMetrics(entidadeId, unitIds, stationsOnlineByUnit),
    loadUnitTypes(entidadeId, unitIds),
    countOnlineHealthProfessionals(entidadeId, visibleUnits, {
      unidadeUbtId: params.unidadeUbtId,
    }),
  ])

  const aggregated = aggregateConsultas(consultas)
  const waitStatsByUnit = buildWaitStatsByUnit(filaRows)

  for (const row of consultas) {
    const unitId = String(row.unidade_ubt_id)
    const status = String(row.status)
    if (status !== 'cancelada' && status !== 'interrompida') continue

    const current = waitStatsByUnit.get(unitId) ?? emptyWaitStats()
    current.absences += 1
    waitStatsByUnit.set(unitId, current)
  }

  const consultationsByUnit = new Map<string, number>()
  for (const unit of visibleUnits) {
    const unitStats = aggregated.byUnit.get(unit.id)
    consultationsByUnit.set(unit.id, unitStats?.total ?? 0)
  }

  const ubsRows = visibleUnits.map((unit) => {
    const live = liveMetrics.get(unit.id)
    const waitStats = waitStatsByUnit.get(unit.id) ?? emptyWaitStats()
    return buildUbsRow(
      unit,
      unitTypes.get(unit.id),
      consultationsByUnit.get(unit.id) ?? 0,
      live?.queueNow ?? 0,
      waitStats,
    )
  })

  const hourly = buildHourlySeries(consultas)
  const { specialties, specialtyTotal } = buildSpecialtyStats(aggregated.specialtyCounts)
  const regions = buildRegionVolumes(visibleUnits, consultationsByUnit)
  const slaRows = buildSlaRows(ubsRows)
  const allAlerts = buildAlerts(ubsRows)

  const consultationsTotal = aggregated.total
  const queueNow = ubsRows.reduce((sum, row) => sum + row.queueNow, 0)
  const terminalsOnline = visibleUnits.reduce((sum, unit) => sum + unit.stationsOnline, 0)
  const terminalsTotal = visibleUnits.reduce((sum, unit) => sum + unit.stationsTotal, 0)
  const absencesTotal = ubsRows.reduce((sum, row) => sum + row.absencesToday, 0)

  const waitValues = [...waitStatsByUnit.values()]
    .map((item) => item.avgWaitMinutes)
    .filter((value) => value > 0)
  const networkAvgWait =
    waitValues.length > 0
      ? Math.round(waitValues.reduce((sum, value) => sum + value, 0) / waitValues.length)
      : 0

  const filterRegionUnits =
    params.regionKey === 'todas'
      ? allUnits.filter((unit) => unit.status !== 'inativa')
      : allUnits.filter(
          (unit) => unit.status !== 'inativa' && unit.regionKey === params.regionKey,
        )

  const triageSummaries = await loadTriageSummariesForDashboard(
    [entidadeId],
    range.startIso,
    range.endIso,
    unitIds,
  )
  const triageCharts = aggregateTriageCharts(triageSummaries)

  return {
    kpis: buildKpis({
      period: params.period,
      consultationsTotal,
      queueNow,
      professionalsOnline,
      terminalsOnline,
      terminalsTotal,
      absencesTotal,
      avgWaitMinutes: networkAvgWait,
    }),
    ubsRows,
    hourly,
    regions,
    specialties,
    specialtyTotal,
    slaRows,
    alerts: allAlerts.slice(0, 3),
    allAlerts,
    triageCharts,
    filterOptions: buildFilterOptions(allUnits, filterRegionUnits),
    isEmpty: visibleUnits.length === 0,
  }
}
