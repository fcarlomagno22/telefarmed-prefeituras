import {
  computeDeltaPercent,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  enrichPatientRow,
  filterPatientsCreatedInPeriod,
  loadPatientConsultationStats,
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
  PacientesInativosBandRowDto,
  PacientesInativosReportDto,
  PatientReportHighlightDto,
  PatientReportUnitRowDto,
} from './patient-reports.types.js'

type EnrichedPatientRow = ReturnType<typeof enrichPatientRow>

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

function isInactivePatient(row: EnrichedPatientRow) {
  return row.monthsWithoutConsultation == null || row.monthsWithoutConsultation >= 6
}

function buildBands(rows: EnrichedPatientRow[]): PacientesInativosBandRowDto[] {
  const counts: Record<PacientesInativosBandRowDto['key'], number> = {
    '6m': 0,
    '12m': 0,
    never: 0,
  }

  for (const row of rows) {
    if (row.monthsWithoutConsultation == null) {
      counts.never += 1
      continue
    }
    if (row.monthsWithoutConsultation >= 12) {
      counts['12m'] += 1
      continue
    }
    counts['6m'] += 1
  }

  const labels: Record<PacientesInativosBandRowDto['key'], string> = {
    '6m': '6 a 11 meses',
    '12m': '12+ meses',
    never: 'Nunca consultou',
  }

  const total = rows.length
  return (['6m', '12m', 'never'] as const).map((key) => ({
    key,
    label: labels[key],
    count: counts[key],
    sharePercent: conversionPercent(counts[key], total),
  }))
}

function buildUnitRows(
  units: RedeUnitApi[],
  rows: EnrichedPatientRow[],
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
  summary: PacientesInativosReportDto['summary'],
  bands: PacientesInativosBandRowDto[],
  units: PatientReportUnitRowDto[],
): PatientReportHighlightDto[] {
  const neverBand = bands.find((band) => band.key === 'never')
  const topUnit = units[0]
  return [
    {
      id: 'inactive-total',
      title: 'Pacientes inativos',
      subtitle: `${formatNumber(summary.inactiveCount)} sem consulta recente`,
      tone: 'amber',
    },
    {
      id: 'inactive-rate',
      title: 'Taxa de inatividade',
      subtitle: `${formatPercent(summary.inactiveRatePercent)}% da carteira`,
      tone: 'red',
    },
    {
      id: 'never-consulted',
      title: 'Nunca consultaram',
      subtitle: `${formatNumber(summary.neverConsultedCount)} pacientes (${formatPercent(neverBand?.sharePercent ?? 0)}%)`,
      tone: 'blue',
    },
    {
      id: 'top-unit',
      title: 'Maior concentração',
      subtitle: topUnit ? `${topUnit.name} · ${formatNumber(topUnit.count)}` : '—',
      tone: 'amber',
    },
  ]
}

function buildKpis(summary: PacientesInativosReportDto['summary']): PrefeituraConsultasKpiDto[] {
  const deltaPercent = computeDeltaPercent(
    summary.inactiveCount,
    summary.inactiveCount - summary.inactiveDeltaCount,
  )

  return [
    {
      label: 'Pacientes inativos',
      value: formatNumber(summary.inactiveCount),
      footer:
        summary.inactiveDeltaCount === 0
          ? 'Estável vs período anterior'
          : `${summary.inactiveDeltaCount > 0 ? '+' : ''}${formatNumber(summary.inactiveDeltaCount)} vs período anterior`,
      footerTone: summary.inactiveDeltaCount <= 0 ? 'positive' : 'muted',
      footerIcon: summary.inactiveDeltaCount <= 0 ? 'down' : 'up',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Taxa de inatividade',
      value: `${formatPercent(summary.inactiveRatePercent)}%`,
      footer:
        deltaPercent === 0
          ? 'Estável vs período anterior'
          : `${deltaPercent > 0 ? '+' : ''}${formatPercent(deltaPercent)}% vs período anterior`,
      footerTone: deltaPercent <= 0 ? 'positive' : 'muted',
      footerIcon: deltaPercent <= 0 ? 'down' : 'up',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      label: 'Nunca consultaram',
      value: formatNumber(summary.neverConsultedCount),
      footer: 'Pacientes sem qualquer histórico',
      footerTone: 'neutral',
      topBar: 'from-violet-400 to-purple-600',
    },
    {
      label: 'Unidades no recorte',
      value: formatNumber(summary.unitsCount),
      footer: 'UBTs consideradas no relatório',
      footerTone: 'muted',
      topBar: 'from-sky-400 to-blue-500',
    },
  ]
}

export async function getPacientesInativosReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<PacientesInativosReportDto> {
  const [allUnits, entidadeRazaoSocial, allPatients] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
    loadPatientsForEntity(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)
  const scopedPatients = scopePatientsByParams(allPatients, visibleUnits, params)

  const consultationStats = await loadPatientConsultationStats(scopedPatients.map((row) => row.id))
  const enrichedRows = scopedPatients.map((row) => enrichPatientRow(row, consultationStats))
  const inactiveRows = enrichedRows.filter(isInactivePatient)

  const currentInactiveRows = filterPatientsCreatedInPeriod(
    inactiveRows,
    params.periodStart,
    params.periodEnd,
  )
  const previousInactiveRows = filterPatientsCreatedInPeriod(
    inactiveRows,
    previous.previousStart,
    previous.previousEnd,
  )

  const bands = buildBands(inactiveRows)
  const units = buildUnitRows(visibleUnits, inactiveRows)

  const countByDate = new Map<string, number>()
  for (const row of currentInactiveRows) {
    const date = row.criado_em.slice(0, 10)
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1)
  }

  const summary = {
    inactiveCount: inactiveRows.length,
    totalPatients: enrichedRows.length,
    inactiveRatePercent: conversionPercent(inactiveRows.length, enrichedRows.length),
    neverConsultedCount: inactiveRows.filter((row) => row.totalConsultations === 0).length,
    unitsCount: visibleUnits.length,
    inactiveDeltaCount: currentInactiveRows.length - previousInactiveRows.length,
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  return {
    reportId: 'pacientes-inativos',
    title: 'Pacientes inativos',
    description:
      'Pacientes sem consulta há 6 meses ou mais, com faixas de inatividade, concentração por unidade e evolução temporal.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(summary, bands, units),
    bands,
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      inactivePoints: buildEvolutionSeries(
        countByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
