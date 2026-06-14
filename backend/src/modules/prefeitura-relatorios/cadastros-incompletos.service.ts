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
  CadastrosIncompletosFieldRowDto,
  CadastrosIncompletosReportDto,
  CadastrosIncompletosSampleRowDto,
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

function enrichPatients(
  rows: Awaited<ReturnType<typeof loadPatientsForEntity>>,
  stats: Awaited<ReturnType<typeof loadPatientConsultationStats>>,
) {
  return rows.map((row) => enrichPatientRow(row, stats))
}

function filterIncomplete(rows: EnrichedPatientRow[]) {
  return rows.filter((row) => row.missingFields.length > 0)
}

function buildFields(rows: EnrichedPatientRow[]): CadastrosIncompletosFieldRowDto[] {
  const labels: Record<string, string> = {
    telefone: 'Telefone',
    'e-mail': 'E-mail',
    'contato de emergência': 'Contato de emergência',
    CEP: 'CEP',
    bairro: 'Bairro',
  }
  const counts = new Map<string, number>()

  for (const row of rows) {
    for (const field of row.missingFields) {
      counts.set(field, (counts.get(field) ?? 0) + 1)
    }
  }

  const totalRows = rows.length
  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: labels[key] ?? key,
      count,
      sharePercent: conversionPercent(count, totalRows),
    }))
    .sort((a, b) => b.count - a.count)
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

function buildSamples(rows: EnrichedPatientRow[]): CadastrosIncompletosSampleRowDto[] {
  return rows
    .slice()
    .sort((a, b) => {
      const byMissing = b.missingFields.length - a.missingFields.length
      if (byMissing !== 0) return byMissing
      return b.criado_em.localeCompare(a.criado_em)
    })
    .slice(0, 12)
    .map((row) => ({
      id: row.id,
      name: row.nome,
      unitName: row.unidade_ubt_principal_nome ?? '—',
      missingFields: row.missingFields,
      missingCount: row.missingFields.length,
    }))
}

function buildHighlights(
  summary: CadastrosIncompletosReportDto['summary'],
  fields: CadastrosIncompletosFieldRowDto[],
  units: PatientReportUnitRowDto[],
): PatientReportHighlightDto[] {
  const topField = fields[0]
  const topUnit = units[0]
  return [
    {
      id: 'incomplete-count',
      title: 'Cadastros incompletos',
      subtitle: `${formatNumber(summary.incompleteCount)} pacientes com pendências`,
      tone: 'red',
    },
    {
      id: 'incomplete-rate',
      title: 'Taxa de incompletude',
      subtitle: `${formatPercent(summary.incompleteRatePercent)}% da base analisada`,
      tone: 'amber',
    },
    {
      id: 'top-field',
      title: 'Campo mais pendente',
      subtitle: topField
        ? `${topField.label} · ${formatNumber(topField.count)} ocorrências`
        : 'Sem pendências no período',
      tone: 'blue',
    },
    {
      id: 'top-unit',
      title: 'Unidade com mais pendências',
      subtitle: topUnit ? `${topUnit.name} · ${formatNumber(topUnit.count)}` : '—',
      tone: 'amber',
    },
  ]
}

function buildKpis(
  summary: CadastrosIncompletosReportDto['summary'],
): PrefeituraConsultasKpiDto[] {
  const deltaPercent = computeDeltaPercent(
    summary.incompleteCount,
    summary.incompleteCount - summary.incompleteDeltaCount,
  )

  return [
    {
      label: 'Pacientes incompletos',
      value: formatNumber(summary.incompleteCount),
      footer:
        summary.incompleteDeltaCount === 0
          ? 'Estável vs período anterior'
          : `${summary.incompleteDeltaCount > 0 ? '+' : ''}${formatNumber(summary.incompleteDeltaCount)} vs período anterior`,
      footerTone: summary.incompleteDeltaCount <= 0 ? 'positive' : 'muted',
      footerIcon: summary.incompleteDeltaCount <= 0 ? 'down' : 'up',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      label: 'Taxa de incompletude',
      value: `${formatPercent(summary.incompleteRatePercent)}%`,
      footer:
        deltaPercent === 0
          ? 'Estável vs período anterior'
          : `${deltaPercent > 0 ? '+' : ''}${formatPercent(deltaPercent)}% vs período anterior`,
      footerTone: deltaPercent <= 0 ? 'positive' : 'muted',
      footerIcon: deltaPercent <= 0 ? 'down' : 'up',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Pacientes analisados',
      value: formatNumber(summary.totalPatients),
      footer: 'Base total da seleção aplicada',
      footerTone: 'neutral',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Unidades no recorte',
      value: formatNumber(summary.unitsCount),
      footer: 'UBTs filtradas para o relatório',
      footerTone: 'muted',
      topBar: 'from-violet-400 to-purple-600',
    },
  ]
}

export async function getCadastrosIncompletosReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<CadastrosIncompletosReportDto> {
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
  const enrichedRows = enrichPatients(scopedPatients, consultationStats)
  const incompleteRows = filterIncomplete(enrichedRows)

  const currentIncompleteRows = filterPatientsCreatedInPeriod(
    incompleteRows,
    params.periodStart,
    params.periodEnd,
  )
  const previousIncompleteRows = filterPatientsCreatedInPeriod(
    incompleteRows,
    previous.previousStart,
    previous.previousEnd,
  )

  const fields = buildFields(incompleteRows)
  const units = buildUnitRows(visibleUnits, incompleteRows)
  const samples = buildSamples(incompleteRows)

  const countByDate = new Map<string, number>()
  for (const row of currentIncompleteRows) {
    const date = row.criado_em.slice(0, 10)
    countByDate.set(date, (countByDate.get(date) ?? 0) + 1)
  }

  const summary = {
    incompleteCount: incompleteRows.length,
    totalPatients: enrichedRows.length,
    incompleteRatePercent: conversionPercent(incompleteRows.length, enrichedRows.length),
    unitsCount: visibleUnits.length,
    incompleteDeltaCount: currentIncompleteRows.length - previousIncompleteRows.length,
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  return {
    reportId: 'cadastros-incompletos',
    title: 'Cadastros incompletos',
    description:
      'Pacientes com dados obrigatórios incompletos, detalhados por campo pendente, unidade e evolução do período.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(summary, fields, units),
    fields,
    units,
    samples,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      incompletePoints: buildEvolutionSeries(
        countByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
