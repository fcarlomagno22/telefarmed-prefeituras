import {
  buildAvgDurationMinutes,
  buildConsultasSummary,
  buildGenderDistribution,
  buildSpecialtyDistribution,
  buildStatusDistribution,
  mapConsultaOperacionalRow,
} from './formatters.js'
import { fetchConsultasFilterOptions, fetchConsultasOperacionais } from './query.service.js'
import type {
  UbtConsultasOverviewDto,
  UbtConsultasOverviewQuery,
  UbtConsultasScope,
} from './types.js'

export async function getUbtConsultasOverview(
  scope: UbtConsultasScope,
  query: UbtConsultasOverviewQuery,
): Promise<UbtConsultasOverviewDto> {
  const baseParams = {
    periodStart: query.periodStart,
    periodEnd: query.periodEnd,
    page: 1,
    pageSize: 1,
  }

  const [{ rows }, filterOptions] = await Promise.all([
    fetchConsultasOperacionais(scope, baseParams, { paginate: false }),
    fetchConsultasFilterOptions(scope),
  ])

  const records = rows.map(mapConsultaOperacionalRow)
  const summary = buildConsultasSummary(records)

  return {
    summary,
    avgDurationMinutes: buildAvgDurationMinutes(records),
    statusDistribution: buildStatusDistribution(records),
    specialtyDistribution: buildSpecialtyDistribution(records),
    genderDistribution: buildGenderDistribution(records),
    filterOptions,
  }
}
