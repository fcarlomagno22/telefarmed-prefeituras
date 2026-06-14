import {
  computeDeltaPercent,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  loadPatientsForEntity,
  loadPendingRetornos,
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
  RetornosPendentesBreakdownRowDto,
  RetornosPendentesPatientRowDto,
  RetornosPendentesReportDto,
} from './patient-reports.types.js'

type PendingRetorno = Awaited<ReturnType<typeof loadPendingRetornos>>[number]

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

function enrichRetornosWithPatientNames(
  rows: PendingRetorno[],
  patientNameById: Map<string, string>,
): PendingRetorno[] {
  return rows.map((row) => ({
    ...row,
    paciente_nome: patientNameById.get(row.paciente_id) ?? row.paciente_nome ?? 'Paciente',
  }))
}

function buildBreakdown(rows: PendingRetorno[]): RetornosPendentesBreakdownRowDto[] {
  let notScheduled = 0
  let notPerformed = 0
  let overdue = 0

  for (const row of rows) {
    if (row.kind === 'nao_agendado') notScheduled += 1
    if (row.kind === 'nao_realizado') notPerformed += 1
    if (row.daysOverdue > 7) overdue += 1
  }

  const total = rows.length
  return [
    {
      key: 'nao_agendado',
      label: 'Não agendado',
      count: notScheduled,
      sharePercent: conversionPercent(notScheduled, total),
    },
    {
      key: 'nao_realizado',
      label: 'Não realizado',
      count: notPerformed,
      sharePercent: conversionPercent(notPerformed, total),
    },
    {
      key: 'atrasado',
      label: 'Atrasado (+7 dias)',
      count: overdue,
      sharePercent: conversionPercent(overdue, total),
    },
  ]
}

function buildUnitRows(units: RedeUnitApi[], rows: PendingRetorno[]): PatientReportUnitRowDto[] {
  const counts = new Map<string, number>()
  for (const unit of units) counts.set(unit.id, 0)

  for (const row of rows) {
    counts.set(row.unidade_ubt_id, (counts.get(row.unidade_ubt_id) ?? 0) + 1)
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

function buildPatientRows(rows: PendingRetorno[]): RetornosPendentesPatientRowDto[] {
  return rows
    .slice()
    .sort((a, b) => {
      const byOverdue = b.daysOverdue - a.daysOverdue
      if (byOverdue !== 0) return byOverdue
      return a.data.localeCompare(b.data)
    })
    .slice(0, 15)
    .map((row) => ({
      id: row.id,
      patientName: row.paciente_nome || 'Paciente',
      unitName: row.unidade_nome || '—',
      scheduledDate: row.data,
      status: row.status,
      kind: row.kind,
      daysOverdue: row.daysOverdue,
    }))
}

function buildHighlights(
  summary: RetornosPendentesReportDto['summary'],
  breakdown: RetornosPendentesBreakdownRowDto[],
  units: PatientReportUnitRowDto[],
): PatientReportHighlightDto[] {
  const overdue = breakdown.find((item) => item.key === 'atrasado')
  const topUnit = units[0]
  return [
    {
      id: 'pending-total',
      title: 'Retornos pendentes',
      subtitle: `${formatNumber(summary.pendingCount)} casos em aberto`,
      tone: 'red',
    },
    {
      id: 'overdue-total',
      title: 'Pendências críticas',
      subtitle: `${formatNumber(summary.overdueCount)} atrasados há mais de 7 dias`,
      tone: 'amber',
    },
    {
      id: 'not-scheduled',
      title: 'Não agendados',
      subtitle: `${formatNumber(summary.notScheduledCount)} (${formatPercent(
        breakdown.find((item) => item.key === 'nao_agendado')?.sharePercent ?? 0,
      )}%)`,
      tone: 'blue',
    },
    {
      id: 'top-unit',
      title: 'Unidade com mais pendências',
      subtitle: topUnit
        ? `${topUnit.name} · ${formatNumber(topUnit.count)} (${formatPercent(topUnit.sharePercent)}%)`
        : overdue
          ? `${formatPercent(overdue.sharePercent)}% em atraso`
          : '—',
      tone: 'amber',
    },
  ]
}

function buildKpis(summary: RetornosPendentesReportDto['summary']): PrefeituraConsultasKpiDto[] {
  const deltaPercent = computeDeltaPercent(
    summary.pendingCount,
    summary.pendingCount - summary.pendingDeltaCount,
  )

  return [
    {
      label: 'Retornos pendentes',
      value: formatNumber(summary.pendingCount),
      footer:
        summary.pendingDeltaCount === 0
          ? 'Estável vs período anterior'
          : `${summary.pendingDeltaCount > 0 ? '+' : ''}${formatNumber(summary.pendingDeltaCount)} vs período anterior`,
      footerTone: summary.pendingDeltaCount <= 0 ? 'positive' : 'muted',
      footerIcon: summary.pendingDeltaCount <= 0 ? 'down' : 'up',
      topBar: 'from-rose-400 to-red-500',
    },
    {
      label: 'Não agendados',
      value: formatNumber(summary.notScheduledCount),
      footer: 'Retornos sem encaixe em agenda',
      footerTone: 'muted',
      topBar: 'from-violet-400 to-purple-600',
    },
    {
      label: 'Não realizados',
      value: formatNumber(summary.notPerformedCount),
      footer: 'Retornos com agendamento não concluído',
      footerTone: 'muted',
      topBar: 'from-amber-400 to-orange-500',
    },
    {
      label: 'Pendências críticas',
      value: formatNumber(summary.overdueCount),
      footer:
        deltaPercent === 0
          ? 'Estável vs período anterior'
          : `${deltaPercent > 0 ? '+' : ''}${formatPercent(deltaPercent)}% vs período anterior`,
      footerTone: deltaPercent <= 0 ? 'positive' : 'muted',
      footerIcon: deltaPercent <= 0 ? 'down' : 'up',
      topBar: 'from-sky-400 to-blue-500',
    },
  ]
}

export async function getRetornosPendentesReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<RetornosPendentesReportDto> {
  const [allUnits, entidadeRazaoSocial, allPatients] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
    loadPatientsForEntity(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)
  const scopedPatients = scopePatientsByParams(allPatients, visibleUnits, params)
  const patientNameById = new Map(scopedPatients.map((row) => [row.id, row.nome]))
  const unitIds = visibleUnits.map((unit) => unit.id)

  const [currentPendingRaw, previousPendingRaw] = await Promise.all([
    loadPendingRetornos(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadPendingRetornos(entidadeId, unitIds, previous.previousStart, previous.previousEnd),
  ])

  const currentPending = enrichRetornosWithPatientNames(currentPendingRaw, patientNameById)
  const previousPending = enrichRetornosWithPatientNames(previousPendingRaw, patientNameById)

  const breakdown = buildBreakdown(currentPending)
  const units = buildUnitRows(visibleUnits, currentPending)
  const patients = buildPatientRows(currentPending)

  const countByDate = new Map<string, number>()
  for (const row of currentPending) {
    countByDate.set(row.data, (countByDate.get(row.data) ?? 0) + 1)
  }

  const summary = {
    pendingCount: currentPending.length,
    notScheduledCount: breakdown.find((item) => item.key === 'nao_agendado')?.count ?? 0,
    notPerformedCount: breakdown.find((item) => item.key === 'nao_realizado')?.count ?? 0,
    overdueCount: breakdown.find((item) => item.key === 'atrasado')?.count ?? 0,
    unitsCount: visibleUnits.length,
    pendingDeltaCount: currentPending.length - previousPending.length,
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  return {
    reportId: 'retornos-pendentes',
    title: 'Retornos pendentes',
    description:
      'Monitoramento de retornos não agendados, não realizados e atrasados, com distribuição por unidade e amostra de pacientes.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(summary, breakdown, units),
    breakdown,
    units,
    patients,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      pendingPoints: buildEvolutionSeries(
        countByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
