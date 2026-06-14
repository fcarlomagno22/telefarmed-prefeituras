import {
  computeDeltaPp,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  detectReconnectionSignal,
  loadQualityConsultasInPeriod,
  type QualityConsultaRow,
} from './quality-data.service.js'
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
  InterrupcoesReconexoesBreakdownRowDto,
  InterrupcoesReconexoesHighlightDto,
  InterrupcoesReconexoesReportDto,
  InterrupcoesReconexoesReportUnitRowDto,
} from './types.js'

type UnitEventMetrics = {
  total: number
  interruptions: number
  reconnections: number
  completed: number
  completedWithEvent: number
}

function emptyUnitMetrics(): UnitEventMetrics {
  return {
    total: 0,
    interruptions: 0,
    reconnections: 0,
    completed: 0,
    completedWithEvent: 0,
  }
}

function classifyConsulta(row: QualityConsultaRow) {
  const status = String(row.status)
  if (status === 'interrompida') return 'interruption' as const
  if (status === 'concluida' && detectReconnectionSignal(row)) return 'reconnection' as const
  if (status === 'concluida') return 'completed_clean' as const
  return 'other' as const
}

function consultaDateKey(row: QualityConsultaRow): string {
  return row.finalizada_em?.slice(0, 10) ?? row.criado_em.slice(0, 10)
}

function aggregateMetrics(rows: QualityConsultaRow[]) {
  const unitMap = new Map<string, UnitEventMetrics>()
  let total = 0
  let interruptions = 0
  let reconnections = 0
  let completed = 0
  let completedWithEvent = 0

  for (const row of rows) {
    total += 1
    const unitId = String(row.unidade_ubt_id)
    const unit = unitMap.get(unitId) ?? emptyUnitMetrics()
    unit.total += 1

    const kind = classifyConsulta(row)
    if (kind === 'interruption') {
      interruptions += 1
      unit.interruptions += 1
    } else if (kind === 'reconnection') {
      reconnections += 1
      unit.reconnections += 1
      completed += 1
      completedWithEvent += 1
      unit.completed += 1
      unit.completedWithEvent += 1
    } else if (kind === 'completed_clean') {
      completed += 1
      unit.completed += 1
    }

    unitMap.set(unitId, unit)
  }

  const interruptionRatePercent = conversionPercent(interruptions, total)
  const reconnectionRatePercent = conversionPercent(reconnections, total)
  const completionRatePercent = conversionPercent(completed, total)
  const completionWithEventsPercent = conversionPercent(completedWithEvent, interruptions + reconnections)

  return {
    unitMap,
    total,
    interruptions,
    reconnections,
    completed,
    completedWithEvent,
    interruptionRatePercent,
    reconnectionRatePercent,
    completionRatePercent,
    completionWithEventsPercent,
  }
}

function buildBreakdown(metrics: ReturnType<typeof aggregateMetrics>): InterrupcoesReconexoesBreakdownRowDto[] {
  const cleanCompleted = metrics.completed - metrics.completedWithEvent
  const other = metrics.total - metrics.interruptions - metrics.reconnections - cleanCompleted

  const rows: InterrupcoesReconexoesBreakdownRowDto[] = [
    {
      key: 'interrupcao',
      label: 'Interrupções',
      count: metrics.interruptions,
      sharePercent: conversionPercent(metrics.interruptions, metrics.total),
      completionRatePercent: 0,
    },
    {
      key: 'reconexao',
      label: 'Reconexões',
      count: metrics.reconnections,
      sharePercent: conversionPercent(metrics.reconnections, metrics.total),
      completionRatePercent: conversionPercent(metrics.completedWithEvent, metrics.reconnections),
    },
    {
      key: 'concluida_sem_evento',
      label: 'Concluídas sem evento',
      count: cleanCompleted,
      sharePercent: conversionPercent(cleanCompleted, metrics.total),
      completionRatePercent: 100,
    },
    {
      key: 'outros',
      label: 'Outros status',
      count: other,
      sharePercent: conversionPercent(other, metrics.total),
      completionRatePercent: conversionPercent(metrics.completed, metrics.total),
    },
  ]

  return rows.filter((row) => row.count > 0)
}

function buildUnitRows(
  units: RedeUnitApi[],
  unitMap: Map<string, UnitEventMetrics>,
  networkCompletion: number,
): InterrupcoesReconexoesReportUnitRowDto[] {
  return units
    .map((unit) => {
      const metrics = unitMap.get(unit.id) ?? emptyUnitMetrics()
      const interruptionRatePercent = conversionPercent(metrics.interruptions, metrics.total)
      const reconnectionRatePercent = conversionPercent(metrics.reconnections, metrics.total)
      const completionRatePercent = conversionPercent(metrics.completed, metrics.total)

      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        totalConsultas: metrics.total,
        interruptions: metrics.interruptions,
        reconnections: metrics.reconnections,
        interruptionRatePercent,
        reconnectionRatePercent,
        completionRatePercent,
        completionVsNetworkPp: completionRatePercent - networkCompletion,
      }
    })
    .sort((a, b) => b.interruptions + b.reconnections - (a.interruptions + a.reconnections))
}

function buildHighlights(
  metrics: ReturnType<typeof aggregateMetrics>,
  units: InterrupcoesReconexoesReportUnitRowDto[],
): InterrupcoesReconexoesHighlightDto[] {
  const topInterruption = [...units].sort((a, b) => b.interruptions - a.interruptions)[0]
  const topReconnection = [...units].sort((a, b) => b.reconnections - a.reconnections)[0]

  return [
    {
      id: 'interruptions',
      title: 'Interrupções no período',
      subtitle: `${formatNumber(metrics.interruptions)} ocorrências · ${formatPercent(metrics.interruptionRatePercent)}% do total`,
      tone: metrics.interruptionRatePercent > 5 ? 'red' : 'amber',
    },
    {
      id: 'reconnections',
      title: 'Reconexões detectadas',
      subtitle: `${formatNumber(metrics.reconnections)} consultas · ${formatPercent(metrics.reconnectionRatePercent)}% do total`,
      tone: 'blue',
    },
    {
      id: 'completion-impact',
      title: 'Conclusão após evento',
      subtitle: `${formatPercent(metrics.completionWithEventsPercent)}% das consultas com reconexão foram concluídas`,
      tone: metrics.completionWithEventsPercent >= 80 ? 'green' : 'amber',
    },
    {
      id: 'top-unit',
      title: 'Unidade com mais interrupções',
      subtitle: topInterruption
        ? `${topInterruption.name} · ${formatNumber(topInterruption.interruptions)} interrupções`
        : '—',
      tone: 'red',
    },
    {
      id: 'top-reconnection',
      title: 'Unidade com mais reconexões',
      subtitle: topReconnection
        ? `${topReconnection.name} · ${formatNumber(topReconnection.reconnections)} reconexões`
        : '—',
      tone: 'amber',
    },
  ]
}

function buildEvolution(rows: QualityConsultaRow[], periodStart: string, periodEnd: string, monthly: boolean) {
  const interruptionByDate = new Map<string, number>()
  const reconnectionByDate = new Map<string, number>()
  const totalByDate = new Map<string, number>()
  const completedByDate = new Map<string, number>()

  for (const row of rows) {
    const date = consultaDateKey(row)
    const kind = classifyConsulta(row)
    totalByDate.set(date, (totalByDate.get(date) ?? 0) + 1)

    if (kind === 'interruption') {
      interruptionByDate.set(date, (interruptionByDate.get(date) ?? 0) + 1)
    } else if (kind === 'reconnection') {
      reconnectionByDate.set(date, (reconnectionByDate.get(date) ?? 0) + 1)
      completedByDate.set(date, (completedByDate.get(date) ?? 0) + 1)
    } else if (kind === 'completed_clean') {
      completedByDate.set(date, (completedByDate.get(date) ?? 0) + 1)
    }
  }

  const completionRateByDate = new Map<string, number>()
  for (const [date, total] of totalByDate) {
    const completed = completedByDate.get(date) ?? 0
    completionRateByDate.set(date, conversionPercent(completed, total))
  }

  return {
    interruptionPoints: buildEvolutionSeries(interruptionByDate, periodStart, periodEnd, monthly),
    reconnectionPoints: buildEvolutionSeries(reconnectionByDate, periodStart, periodEnd, monthly),
    completionRatePoints: buildEvolutionSeries(
      completionRateByDate,
      periodStart,
      periodEnd,
      monthly,
    ),
  }
}

function buildKpis(summary: InterrupcoesReconexoesReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Interrupções',
      value: formatNumber(summary.interruptions),
      footer:
        summary.interruptionDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.interruptionDeltaPp > 0 ? '+' : ''}${formatPercent(summary.interruptionDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.interruptionDeltaPp <= 0 ? 'positive' : 'muted',
      footerIcon: summary.interruptionDeltaPp <= 0 ? 'down' : 'up',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Reconexões',
      value: formatNumber(summary.reconnections),
      footer:
        summary.reconnectionDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.reconnectionDeltaPp > 0 ? '+' : ''}${formatPercent(summary.reconnectionDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.reconnectionDeltaPp <= 0 ? 'positive' : 'muted',
      footerIcon: summary.reconnectionDeltaPp <= 0 ? 'down' : 'up',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Taxa de interrupção',
      value: `${formatPercent(summary.interruptionRatePercent)}%`,
      footer: `${formatNumber(summary.totalConsultas)} consultas no período`,
      footerTone: summary.interruptionRatePercent > 5 ? 'muted' : 'positive',
      topBar: 'from-red-400 to-rose-500',
    },
    {
      label: 'Conclusão após evento',
      value: `${formatPercent(summary.completionWithEventsPercent)}%`,
      footer: `${formatPercent(summary.completionRatePercent)}% de conclusão geral`,
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
  ]
}

export async function getInterrupcoesReconexoesReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<InterrupcoesReconexoesReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)

  const [currentRows, previousRows] = await Promise.all([
    loadQualityConsultasInPeriod(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadQualityConsultasInPeriod(
      entidadeId,
      unitIds,
      previous.previousStart,
      previous.previousEnd,
    ),
  ])

  const current = aggregateMetrics(currentRows)
  const prev = aggregateMetrics(previousRows)
  const units = buildUnitRows(visibleUnits, current.unitMap, current.completionRatePercent)

  const summary = {
    totalConsultas: current.total,
    interruptions: current.interruptions,
    reconnections: current.reconnections,
    interruptionRatePercent: current.interruptionRatePercent,
    reconnectionRatePercent: current.reconnectionRatePercent,
    completionRatePercent: current.completionRatePercent,
    completionWithEventsPercent: current.completionWithEventsPercent,
    unitsCount: visibleUnits.length,
    interruptionDeltaPp: computeDeltaPp(current.interruptionRatePercent, prev.interruptionRatePercent),
    reconnectionDeltaPp: computeDeltaPp(current.reconnectionRatePercent, prev.reconnectionRatePercent),
    completionDeltaPp: computeDeltaPp(current.completionRatePercent, prev.completionRatePercent),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  const evolution = buildEvolution(currentRows, params.periodStart, params.periodEnd, monthly)

  return {
    reportId: 'interrupcoes-reconexoes',
    title: 'Interrupções e reconexões',
    description:
      'Ocorrências de queda de chamada, reconexões e impacto na conclusão das teleconsultas.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(current, units),
    breakdown: buildBreakdown(current),
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      ...evolution,
    },
  }
}
