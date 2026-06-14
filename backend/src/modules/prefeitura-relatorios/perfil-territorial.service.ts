import { formatPeriodLabel } from '../prefeitura-consultas/formatters.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { readEnderecoField } from '../admin-pacientes/formatters.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  filterPatientsCreatedInPeriod,
  loadPatientsForEntity,
} from './patient-data.service.js'
import {
  buildEvolutionSeries,
  conversionPercent,
  filterUnitsByParams,
  formatNumber,
  formatPercent,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import type {
  PatientReportHighlightDto,
  PatientReportUnitRowDto,
  PerfilTerritorialNeighborhoodRowDto,
  PerfilTerritorialRegionRowDto,
  PerfilTerritorialReportDto,
} from './patient-reports.types.js'

function scopePatientsByParams(
  allPatients: Awaited<ReturnType<typeof loadPatientsForEntity>>,
  visibleUnits: RedeUnitApi[],
  params: { unidadeUbtId?: string; regionKey?: string },
) {
  if (params.unidadeUbtId && params.unidadeUbtId !== 'todas') {
    return allPatients.filter((row) => row.unidade_ubt_principal_id === params.unidadeUbtId)
  }
  if (params.regionKey && params.regionKey !== 'todas') {
    const visibleIds = new Set(
      visibleUnits.filter((unit) => unit.regionKey === params.regionKey).map((unit) => unit.id),
    )
    return allPatients.filter(
      (row) => row.unidade_ubt_principal_id && visibleIds.has(row.unidade_ubt_principal_id),
    )
  }
  return allPatients
}

function normalizeNeighborhood(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return 'Sem bairro informado'
  return trimmed
}

function buildNeighborhoodRows(
  rows: Awaited<ReturnType<typeof loadPatientsForEntity>>,
): PerfilTerritorialNeighborhoodRowDto[] {
  const counts = new Map<string, { key: string; label: string; count: number }>()
  for (const row of rows) {
    const bairro = normalizeNeighborhood(readEnderecoField(row.endereco, 'bairro'))
    const key = bairro.toLowerCase()
    const current = counts.get(key) ?? { key, label: bairro, count: 0 }
    current.count += 1
    counts.set(key, current)
  }

  const total = rows.length
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, 12)
    .map((item) => ({
      key: item.key,
      label: item.label,
      patientsCount: item.count,
      sharePercent: conversionPercent(item.count, total),
    }))
}

function buildRegionRows(
  rows: Awaited<ReturnType<typeof loadPatientsForEntity>>,
  visibleUnits: RedeUnitApi[],
): PerfilTerritorialRegionRowDto[] {
  const unitById = new Map(visibleUnits.map((unit) => [unit.id, unit]))
  const counts = new Map<string, { key: string; label: string; count: number }>()
  let mappedCount = 0

  for (const row of rows) {
    const unitId = row.unidade_ubt_principal_id
    if (!unitId) continue
    const unit = unitById.get(unitId)
    if (!unit) continue
    mappedCount += 1
    const key = unit.regionKey
    const current = counts.get(key) ?? { key, label: unit.region, count: 0 }
    current.count += 1
    counts.set(key, current)
  }

  const total = Math.max(mappedCount, 1)
  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .map((item) => ({
      key: item.key,
      label: item.label,
      patientsCount: item.count,
      sharePercent: conversionPercent(item.count, total),
    }))
}

function buildUnitRows(
  units: RedeUnitApi[],
  rows: Awaited<ReturnType<typeof loadPatientsForEntity>>,
): PatientReportUnitRowDto[] {
  const counts = new Map<string, number>()
  for (const unit of units) counts.set(unit.id, 0)

  for (const row of rows) {
    const unitId = row.unidade_ubt_principal_id
    if (!unitId) continue
    counts.set(unitId, (counts.get(unitId) ?? 0) + 1)
  }

  const total = rows.length
  return units
    .map((unit) => ({
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      count: counts.get(unit.id) ?? 0,
      sharePercent: conversionPercent(counts.get(unit.id) ?? 0, total),
    }))
    .filter((row) => row.count > 0)
    .sort((a, b) => b.count - a.count)
}

function buildHighlights(
  summary: PerfilTerritorialReportDto['summary'],
  neighborhoods: PerfilTerritorialNeighborhoodRowDto[],
  regions: PerfilTerritorialRegionRowDto[],
): PatientReportHighlightDto[] {
  const topNeighborhood = neighborhoods[0]
  const topRegion = regions[0]
  return [
    {
      id: 'territorial-total',
      title: 'Pacientes mapeados',
      subtitle: `${formatNumber(summary.totalPatients)} pacientes no recorte`,
      tone: 'blue',
    },
    {
      id: 'top-neighborhood',
      title: 'Bairro com maior volume',
      subtitle: topNeighborhood
        ? `${topNeighborhood.label} · ${formatNumber(topNeighborhood.patientsCount)}`
        : 'Sem bairro identificado',
      tone: 'amber',
    },
    {
      id: 'top-region',
      title: 'Região de referência',
      subtitle: topRegion
        ? `${topRegion.label} · ${formatNumber(topRegion.patientsCount)}`
        : 'Sem região mapeada',
      tone: 'green',
    },
    {
      id: 'mapping-coverage',
      title: 'Cobertura de mapeamento',
      subtitle: `${formatPercent(summary.mappedPatientsPercent)}% com UBT principal`,
      tone: 'blue',
    },
  ]
}

function buildKpis(summary: PerfilTerritorialReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Pacientes mapeados',
      value: formatNumber(summary.totalPatients),
      footer: 'Total de pacientes na seleção',
      footerTone: 'neutral',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Bairros identificados',
      value: formatNumber(summary.neighborhoodsCount),
      footer: 'Com concentração de pacientes',
      footerTone: 'neutral',
      topBar: 'from-violet-400 to-purple-600',
    },
    {
      label: 'Regiões com pacientes',
      value: formatNumber(summary.regionsCount),
      footer: 'Distribuição por região da rede',
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Novos no período',
      value: formatNumber(summary.newInPeriod),
      footer: 'Cadastros criados no intervalo',
      footerTone: 'muted',
      topBar: 'from-orange-400 to-amber-500',
    },
  ]
}

export async function getPerfilTerritorialReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<PerfilTerritorialReportDto> {
  const [allUnits, entidadeRazaoSocial, allPatients] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
    loadPatientsForEntity(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)
  const scopedPatients = scopePatientsByParams(allPatients, visibleUnits, params)

  const neighborhoods = buildNeighborhoodRows(scopedPatients)
  const regions = buildRegionRows(scopedPatients, visibleUnits)
  const units = buildUnitRows(visibleUnits, scopedPatients)

  const newInPeriodRows = filterPatientsCreatedInPeriod(
    scopedPatients,
    params.periodStart,
    params.periodEnd,
  )

  const countByDate = new Map<string, number>()
  for (const row of newInPeriodRows) {
    const date = row.criado_em.slice(0, 10)
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1)
  }

  const mappedPatients = scopedPatients.filter((row) => {
    if (!row.unidade_ubt_principal_id) return false
    return visibleUnits.some((unit) => unit.id === row.unidade_ubt_principal_id)
  }).length

  const summary = {
    totalPatients: scopedPatients.length,
    neighborhoodsCount: neighborhoods.length,
    regionsCount: regions.length,
    mappedPatientsPercent: conversionPercent(mappedPatients, scopedPatients.length),
    unitsCount: visibleUnits.length,
    newInPeriod: newInPeriodRows.length,
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  return {
    reportId: 'perfil-territorial',
    title: 'Perfil territorial',
    description:
      'Distribuição territorial da carteira de pacientes por bairro e região da rede, com foco em cobertura e evolução de novos cadastros.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(summary, neighborhoods, regions),
    neighborhoods,
    regions,
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      patientsPoints: buildEvolutionSeries(
        countByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
