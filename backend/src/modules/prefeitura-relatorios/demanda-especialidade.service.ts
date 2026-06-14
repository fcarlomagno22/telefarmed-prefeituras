import { fetchAgendaRowsForPeriod } from '../prefeitura-agendas/query.service.js'
import type { AgendaAggregateRow } from '../prefeitura-agendas/types.js'
import {
  buildDailySeries,
  computeDeltaPercent,
  computeDeltaPp,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod } from '../prefeitura-consultas/period.js'
import { fetchConsultasForPeriod } from '../prefeitura-consultas/query.service.js'
import type { ConsultaAggregateRow } from '../prefeitura-consultas/types.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  buildMonthlyEvolutionSeries,
  conversionPercent,
  filterUnitsByParams,
  formatNumber,
  formatPercent,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import {
  buildSpecialtyNameMap,
  loadFilaRowsWithSpecialty,
  resolveSpecialtyLabel,
  type FilaSpecialtyRow,
} from './demand-data.service.js'
import type {
  DemandaEspecialidadeHighlightDto,
  DemandaEspecialidadeReportDto,
  DemandaEspecialidadeReportUnitRowDto,
  DemandaEspecialidadeSpecialtyRowDto,
} from './types.js'

type SpecialtyMetrics = {
  agendaCount: number
  filaCount: number
  completed: number
}

type UnitMetrics = {
  requested: number
  completed: number
  bySpecialty: Map<string, { id: string; label: string; requested: number }>
}

function emptySpecialtyMetrics(): SpecialtyMetrics {
  return { agendaCount: 0, filaCount: 0, completed: 0 }
}

function emptyUnitMetrics(): UnitMetrics {
  return { requested: 0, completed: 0, bySpecialty: new Map() }
}

function accumulateAgenda(
  specialtyMap: Map<string, SpecialtyMetrics & { label: string }>,
  unitMap: Map<string, UnitMetrics>,
  row: AgendaAggregateRow,
  specialtyNames: Map<string, string>,
) {
  const specialtyId = String(row.especialidade_id ?? 'unknown')
  const label = resolveSpecialtyLabel(specialtyId, specialtyNames)
  const unitId = String(row.unidade_ubt_id)

  const specialty = specialtyMap.get(specialtyId) ?? {
    ...emptySpecialtyMetrics(),
    label,
  }
  specialty.agendaCount += 1
  specialtyMap.set(specialtyId, specialty)

  const unit = unitMap.get(unitId) ?? emptyUnitMetrics()
  unit.requested += 1
  const unitSpec = unit.bySpecialty.get(specialtyId) ?? { id: specialtyId, label, requested: 0 }
  unitSpec.requested += 1
  unit.bySpecialty.set(specialtyId, unitSpec)
  unitMap.set(unitId, unit)
}

function accumulateFila(
  specialtyMap: Map<string, SpecialtyMetrics & { label: string }>,
  unitMap: Map<string, UnitMetrics>,
  row: FilaSpecialtyRow,
  specialtyNames: Map<string, string>,
) {
  const specialtyId = row.especialidade_id ? String(row.especialidade_id) : 'unknown'
  const label = resolveSpecialtyLabel(specialtyId, specialtyNames)
  const unitId = String(row.unidade_ubt_id)

  const specialty = specialtyMap.get(specialtyId) ?? {
    ...emptySpecialtyMetrics(),
    label,
  }
  specialty.filaCount += 1
  specialtyMap.set(specialtyId, specialty)

  const unit = unitMap.get(unitId) ?? emptyUnitMetrics()
  unit.requested += 1
  const unitSpec = unit.bySpecialty.get(specialtyId) ?? { id: specialtyId, label, requested: 0 }
  unitSpec.requested += 1
  unit.bySpecialty.set(specialtyId, unitSpec)
  unitMap.set(unitId, unit)
}

function accumulateConsulta(
  specialtyMap: Map<string, SpecialtyMetrics & { label: string }>,
  unitMap: Map<string, UnitMetrics>,
  row: ConsultaAggregateRow,
) {
  if (String(row.status) !== 'concluida') return

  const specialtyId = String(row.especialidade_id)
  const label = String(row.especialidade_nome ?? 'Especialidade')
  const unitId = String(row.unidade_ubt_id)

  const specialty = specialtyMap.get(specialtyId) ?? {
    ...emptySpecialtyMetrics(),
    label,
  }
  specialty.completed += 1
  specialtyMap.set(specialtyId, specialty)

  const unit = unitMap.get(unitId) ?? emptyUnitMetrics()
  unit.completed += 1
  unitMap.set(unitId, unit)
}

function aggregatePeriod(
  units: RedeUnitApi[],
  agendaRows: AgendaAggregateRow[],
  filaRows: FilaSpecialtyRow[],
  consultas: ConsultaAggregateRow[],
) {
  const specialtyMap = new Map<string, SpecialtyMetrics & { label: string }>()
  const unitMap = new Map<string, UnitMetrics>()
  const specialtyNames = buildSpecialtyNameMap(
    consultas.map((row) => ({
      especialidade_id: row.especialidade_id,
      especialidade_nome: row.especialidade_nome,
    })),
  )

  for (const unit of units) {
    unitMap.set(unit.id, emptyUnitMetrics())
  }

  for (const row of agendaRows) accumulateAgenda(specialtyMap, unitMap, row, specialtyNames)
  for (const row of filaRows) accumulateFila(specialtyMap, unitMap, row, specialtyNames)
  for (const row of consultas) accumulateConsulta(specialtyMap, unitMap, row)

  let requested = 0
  let completed = 0
  for (const metrics of specialtyMap.values()) {
    requested += metrics.agendaCount + metrics.filaCount
    completed += metrics.completed
  }

  return {
    specialtyMap,
    unitMap,
    requested,
    completed,
    completionRatePercent: conversionPercent(completed, requested),
  }
}

function buildSpecialtyRows(
  current: Map<string, SpecialtyMetrics & { label: string }>,
  previous: Map<string, SpecialtyMetrics & { label: string }>,
  totalRequested: number,
): DemandaEspecialidadeSpecialtyRowDto[] {
  return [...current.entries()]
    .map(([id, metrics]) => {
      const requested = metrics.agendaCount + metrics.filaCount
      const prev = previous.get(id)
      const prevRequested = prev ? prev.agendaCount + prev.filaCount : 0

      return {
        id,
        name: metrics.label,
        requested,
        agendaCount: metrics.agendaCount,
        filaCount: metrics.filaCount,
        completed: metrics.completed,
        completionRatePercent: conversionPercent(metrics.completed, requested),
        sharePercent: conversionPercent(requested, totalRequested),
        requestedDeltaPercent: computeDeltaPercent(requested, prevRequested),
      }
    })
    .sort((a, b) => b.requested - a.requested)
}

function buildUnitRows(
  units: RedeUnitApi[],
  unitMap: Map<string, UnitMetrics>,
  networkCompletionRate: number,
): DemandaEspecialidadeReportUnitRowDto[] {
  return units
    .map((unit) => {
      const metrics = unitMap.get(unit.id) ?? emptyUnitMetrics()
      const topSpecialty = [...metrics.bySpecialty.values()].sort(
        (a, b) => b.requested - a.requested,
      )[0]
      const completionRate = conversionPercent(metrics.completed, metrics.requested)

      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        requested: metrics.requested,
        completed: metrics.completed,
        completionRatePercent: completionRate,
        topSpecialtyName: topSpecialty?.label ?? '—',
        topSpecialtySharePercent: topSpecialty
          ? conversionPercent(topSpecialty.requested, metrics.requested)
          : 0,
        completionVsNetworkPp: completionRate - networkCompletionRate,
      }
    })
    .sort((a, b) => b.requested - a.requested)
}

function buildHighlights(
  specialties: DemandaEspecialidadeSpecialtyRowDto[],
): DemandaEspecialidadeHighlightDto[] {
  if (specialties.length === 0) return []

  const topDemand = specialties[0]
  const topCompletion = [...specialties]
    .filter((row) => row.requested >= 5)
    .sort((a, b) => b.completionRatePercent - a.completionRatePercent)[0]
  const lowestCompletion = [...specialties]
    .filter((row) => row.requested >= 5)
    .sort((a, b) => a.completionRatePercent - b.completionRatePercent)[0]
  const topFila = [...specialties].sort((a, b) => b.filaCount - a.filaCount)[0]

  return [
    {
      id: 'top-demand',
      title: 'Maior demanda solicitada',
      subtitle: `${topDemand?.name ?? '—'} · ${formatNumber(topDemand?.requested ?? 0)} solicitações`,
      tone: 'blue',
    },
    {
      id: 'top-completion',
      title: 'Melhor taxa de conclusão',
      subtitle: topCompletion
        ? `${topCompletion.name} · ${formatPercent(topCompletion.completionRatePercent)}% concluídas`
        : '—',
      tone: 'green',
    },
    {
      id: 'top-fila',
      title: 'Maior demanda espontânea na fila',
      subtitle: `${topFila?.name ?? '—'} · ${formatNumber(topFila?.filaCount ?? 0)} chegadas`,
      tone: 'amber',
    },
    {
      id: 'lowest-completion',
      title: 'Menor taxa de conclusão',
      subtitle: lowestCompletion
        ? `${lowestCompletion.name} · ${formatPercent(lowestCompletion.completionRatePercent)}% concluídas`
        : '—',
      tone: 'red',
    },
  ]
}

function buildDailyCounts(
  agendaRows: AgendaAggregateRow[],
  filaRows: FilaSpecialtyRow[],
  consultas: ConsultaAggregateRow[],
) {
  const requestedByDate = new Map<string, number>()
  const completedByDate = new Map<string, number>()

  for (const row of agendaRows) {
    const date = String(row.data)
    requestedByDate.set(date, (requestedByDate.get(date) ?? 0) + 1)
  }
  for (const row of filaRows) {
    const date = row.chegada_em.slice(0, 10)
    requestedByDate.set(date, (requestedByDate.get(date) ?? 0) + 1)
  }
  for (const row of consultas) {
    if (String(row.status) !== 'concluida') continue
    const date = row.finalizada_em?.slice(0, 10) ?? row.criado_em.slice(0, 10)
    completedByDate.set(date, (completedByDate.get(date) ?? 0) + 1)
  }

  return { requestedByDate, completedByDate }
}

function buildEvolutionPoints(
  dailyCounts: Map<string, number>,
  periodStart: string,
  periodEnd: string,
  monthly: boolean,
) {
  return monthly
    ? buildMonthlyEvolutionSeries(dailyCounts, periodStart, periodEnd)
    : buildDailySeries(dailyCounts, periodStart, periodEnd)
}

function buildCompletionRateSeries(
  requestedByDate: Map<string, number>,
  completedByDate: Map<string, number>,
  periodStart: string,
  periodEnd: string,
  monthly: boolean,
) {
  const rateByDate = new Map<string, number>()
  const allDates = new Set([...requestedByDate.keys(), ...completedByDate.keys()])

  for (const date of allDates) {
    const requested = requestedByDate.get(date) ?? 0
    const completed = completedByDate.get(date) ?? 0
    rateByDate.set(date, conversionPercent(completed, requested))
  }

  return buildEvolutionPoints(rateByDate, periodStart, periodEnd, monthly)
}

function buildKpis(summary: DemandaEspecialidadeReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Demanda solicitada',
      value: formatNumber(summary.requested),
      footer:
        summary.requestedDeltaPercent === 0
          ? 'Estável vs período anterior'
          : `${summary.requestedDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.requestedDeltaPercent)}% vs período anterior`,
      footerTone: summary.requestedDeltaPercent >= 0 ? 'positive' : 'muted',
      footerIcon: summary.requestedDeltaPercent >= 0 ? 'up' : 'down',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Consultas concluídas',
      value: formatNumber(summary.completed),
      footer: `${formatPercent(summary.completionRatePercent)}% da demanda solicitada`,
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Taxa de conclusão',
      value: `${formatPercent(summary.completionRatePercent)}%`,
      footer:
        summary.completionDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.completionDeltaPp > 0 ? '+' : ''}${formatPercent(summary.completionDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.completionDeltaPp >= 0 ? 'positive' : 'muted',
      footerIcon: summary.completionDeltaPp >= 0 ? 'up' : 'down',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Especialidades com demanda',
      value: formatNumber(summary.specialtiesCount),
      footer: `Principal: ${summary.topSpecialtyName}`,
      footerTone: 'neutral',
      topBar: 'from-violet-400 to-purple-600',
    },
    {
      label: 'Unidades na análise',
      value: formatNumber(summary.unitsCount),
      footer: 'UBTs com demanda registrada no período',
      footerTone: 'muted',
      topBar: 'from-cyan-400 to-sky-500',
    },
  ]
}

export async function getDemandaEspecialidadeReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<DemandaEspecialidadeReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previous = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)

  const [
    currentAgenda,
    previousAgenda,
    currentFila,
    previousFila,
    currentConsultas,
    previousConsultas,
  ] = await Promise.all([
    fetchAgendaRowsForPeriod(entidadeId, params.periodStart, params.periodEnd, unitIds),
    fetchAgendaRowsForPeriod(
      entidadeId,
      previous.previousStart,
      previous.previousEnd,
      unitIds,
    ),
    loadFilaRowsWithSpecialty(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadFilaRowsWithSpecialty(
      entidadeId,
      unitIds,
      previous.previousStart,
      previous.previousEnd,
    ),
    fetchConsultasForPeriod(entidadeId, params.periodStart, params.periodEnd, unitIds),
    fetchConsultasForPeriod(
      entidadeId,
      previous.previousStart,
      previous.previousEnd,
      unitIds,
    ),
  ])

  const current = aggregatePeriod(visibleUnits, currentAgenda, currentFila, currentConsultas)
  const prev = aggregatePeriod(visibleUnits, previousAgenda, previousFila, previousConsultas)

  const specialties = buildSpecialtyRows(
    current.specialtyMap,
    prev.specialtyMap,
    current.requested,
  )
  const topSpecialty = specialties[0]

  const summary = {
    requested: current.requested,
    completed: current.completed,
    completionRatePercent: current.completionRatePercent,
    specialtiesCount: current.specialtyMap.size,
    topSpecialtyName: topSpecialty?.name ?? '—',
    unitsCount: visibleUnits.length,
    requestedDeltaPercent: computeDeltaPercent(current.requested, prev.requested),
    completionDeltaPp: computeDeltaPp(current.completionRatePercent, prev.completionRatePercent),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  const { requestedByDate, completedByDate } = buildDailyCounts(
    currentAgenda,
    currentFila,
    currentConsultas,
  )

  return {
    reportId: 'demanda-especialidade',
    title: 'Demanda por especialidade',
    description:
      'Distribuição das consultas solicitadas e realizadas entre especialidades médicas e de apoio.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(specialties),
    specialties,
    units: buildUnitRows(visibleUnits, current.unitMap, current.completionRatePercent),
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      volumePoints: buildEvolutionPoints(
        requestedByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
      completionPoints: buildEvolutionPoints(
        completedByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
      completionRatePoints: buildCompletionRateSeries(
        requestedByDate,
        completedByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
