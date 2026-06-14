import { PrefeituraRedeError } from '../prefeitura-rede/errors.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import {
  aggregateConsultas,
  buildDailySeries,
  buildFilterOptionsFromUnits,
  buildGenderStats,
  buildKpis,
  buildSpecialtyItems,
  buildSpecialtySlices,
  buildUnitRow,
  completionRate,
  computeDeltaPercent,
  computeDeltaPp,
  formatPeriodLabel,
  cancelledRate,
  emptyUnitStats,
} from './formatters.js'
import { resolvePreviousPeriod } from './period.js'
import { fetchConsultasForPeriod } from './query.service.js'
import type {
  PrefeituraConsultasOverviewDto,
  PrefeituraConsultasUnitDetailDto,
} from './types.js'

function filterUnitsByParams(
  units: Awaited<ReturnType<typeof listRedeUnits>>,
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

export async function getPrefeituraConsultasOverview(
  entidadeId: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<PrefeituraConsultasOverviewDto> {
  const allUnits = await listRedeUnits(entidadeId)
  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)

  const [currentRows, previousRows] = await Promise.all([
    fetchConsultasForPeriod(entidadeId, params.periodStart, params.periodEnd, unitIds),
    fetchConsultasForPeriod(
      entidadeId,
      previous.previousStart,
      previous.previousEnd,
      unitIds,
    ),
  ])

  const currentStats = aggregateConsultas(currentRows)
  const previousStats = aggregateConsultas(previousRows)

  const units = visibleUnits
    .map((unit) => buildUnitRow(unit, currentStats.byUnit.get(unit.id) ?? emptyUnitStats()))
    .sort((a, b) => b.volumeTotal - a.volumeTotal)

  return {
    kpis: buildKpis(currentStats, previousStats),
    units,
    dailySeries: buildDailySeries(
      currentStats.dailyCounts,
      params.periodStart,
      params.periodEnd,
    ),
    periodTotal: currentStats.total,
    specialties: buildSpecialtyItems(currentStats.specialtyCounts, currentStats.total),
    filterOptions: buildFilterOptionsFromUnits(allUnits),
  }
}

export async function getPrefeituraConsultasUnitDetail(
  entidadeId: string,
  unitId: string,
  params: { periodStart: string; periodEnd: string },
): Promise<PrefeituraConsultasUnitDetailDto> {
  const allUnits = await listRedeUnits(entidadeId)
  const unit = allUnits.find((item) => item.id === unitId)
  if (!unit) {
    throw new PrefeituraRedeError('Unidade não encontrada.', 'NOT_FOUND', 404)
  }

  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)

  const [currentRows, previousRows, allCurrentRows] = await Promise.all([
    fetchConsultasForPeriod(entidadeId, params.periodStart, params.periodEnd, [unitId]),
    fetchConsultasForPeriod(
      entidadeId,
      previous.previousStart,
      previous.previousEnd,
      [unitId],
    ),
    fetchConsultasForPeriod(entidadeId, params.periodStart, params.periodEnd),
  ])

  const currentStats = aggregateConsultas(currentRows)
  const previousStats = aggregateConsultas(previousRows)
  const networkStats = aggregateConsultas(allCurrentRows)

  const unitStats = currentStats.byUnit.get(unitId) ?? emptyUnitStats()
  const previousUnitStats = previousStats.byUnit.get(unitId) ?? emptyUnitStats()

  const unitRow = buildUnitRow(unit, unitStats)
  const networkAvgVolume =
    allUnits.length > 0 ? networkStats.total / allUnits.length : 0
  const volumeVsNetworkPercent =
    networkAvgVolume > 0
      ? Number((((unitRow.volumeTotal - networkAvgVolume) / networkAvgVolume) * 100).toFixed(1))
      : 0

  const currentCompletion = completionRate(unitStats.completed, unitStats.total)
  const previousCompletion = completionRate(previousUnitStats.completed, previousUnitStats.total)
  const currentCancelledRate = cancelledRate(unitStats.cancelled, unitStats.total)
  const previousCancelledRate = cancelledRate(previousUnitStats.cancelled, previousUnitStats.total)
  const currentAvg =
    unitStats.durationCount > 0 ? Math.round(unitStats.durationSum / unitStats.durationCount) : 0
  const previousAvg =
    previousUnitStats.durationCount > 0
      ? Math.round(previousUnitStats.durationSum / previousUnitStats.durationCount)
      : 0

  return {
    unit: unitRow,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    cnes: unit.cnes !== '—' ? unit.cnes : null,
    responsibleName: unit.responsibleName ?? null,
    networkAvgVolume: Math.round(networkAvgVolume),
    volumeVsNetworkPercent,
    previousPeriod: {
      volumeDeltaPercent: computeDeltaPercent(unitStats.total, previousUnitStats.total),
      completionDeltaPp: computeDeltaPp(currentCompletion, previousCompletion),
      cancelledDeltaPp: computeDeltaPp(currentCancelledRate, previousCancelledRate),
      durationDeltaMin: currentAvg - previousAvg,
    },
    dailySeries: buildDailySeries(unitStats.dailyCounts, params.periodStart, params.periodEnd),
    specialties: buildSpecialtySlices(unitStats.specialtyCounts, unitStats.total),
    genderStats: buildGenderStats(unitStats.genderCounts, unitStats.total),
  }
}
