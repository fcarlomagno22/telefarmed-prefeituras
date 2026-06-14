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
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { slotVisibleToUbt } from '../ubt-agenda/slot-utils.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  buildSpecialtyNameMap,
  loadPlantoesInPeriod,
  resolveSpecialtyLabel,
  type PlantaoPeriodRow,
} from './demand-data.service.js'
import {
  buildMonthlyEvolutionSeries,
  conversionPercent,
  filterUnitsByParams,
  formatNumber,
  formatPercent,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import type {
  MedicosPlantaoHighlightDto,
  MedicosPlantaoProfessionalRowDto,
  MedicosPlantaoReportDto,
  MedicosPlantaoReportUnitRowDto,
} from './types.js'

const COMPLETED_AGENDA_STATUSES = new Set(['realizado'])

type SlotConsultaMetrics = {
  scheduled: number
  completed: number
}

type UnitPlantaoMetrics = {
  plantoesCount: number
  scheduledConsultas: number
  completedConsultas: number
}

type ProfessionalMetrics = {
  name: string
  plantoesCount: number
  scheduledConsultas: number
  completedConsultas: number
  especialidadeName: string
}

function plantaoVisibleToUnits(plantao: PlantaoPeriodRow, unitIds: string[]): boolean {
  for (const unitId of unitIds) {
    if (
      slotVisibleToUbt(
        plantao.slot.escopo_ubt,
        unitId,
        String(plantao.slot.modalidade ?? 'tele'),
      )
    ) {
      return true
    }
  }
  return false
}

function filterVisiblePlantoes(plantoes: PlantaoPeriodRow[], unitIds: string[]) {
  return plantoes.filter((plantao) => plantaoVisibleToUnits(plantao, unitIds))
}

function buildAgendaBySlot(agendaRows: AgendaAggregateRow[]) {
  const bySlot = new Map<string, SlotConsultaMetrics>()

  for (const row of agendaRows) {
    if (!row.escala_slot_id) continue
    const slotId = String(row.escala_slot_id)
    const current = bySlot.get(slotId) ?? { scheduled: 0, completed: 0 }
    current.scheduled += 1
    if (COMPLETED_AGENDA_STATUSES.has(String(row.status))) {
      current.completed += 1
    }
    bySlot.set(slotId, current)
  }

  return bySlot
}

function aggregatePeriod(
  units: RedeUnitApi[],
  unitIds: string[],
  plantoes: PlantaoPeriodRow[],
  agendaBySlot: Map<string, SlotConsultaMetrics>,
  specialtyNames: Map<string, string>,
) {
  const unitMap = new Map<string, UnitPlantaoMetrics>()
  const professionalMap = new Map<string, ProfessionalMetrics>()

  for (const unit of units) {
    unitMap.set(unit.id, {
      plantoesCount: 0,
      scheduledConsultas: 0,
      completedConsultas: 0,
    })
  }

  let scheduledConsultas = 0
  let completedConsultas = 0
  const visiblePlantoes = filterVisiblePlantoes(plantoes, unitIds)

  for (const plantao of visiblePlantoes) {
    const slotMetrics = agendaBySlot.get(String(plantao.slot_id)) ?? {
      scheduled: 0,
      completed: 0,
    }
    scheduledConsultas += slotMetrics.scheduled
    completedConsultas += slotMetrics.completed

    const specialtyId = String(plantao.slot.especialidade_id)
    const especialidadeName = resolveSpecialtyLabel(specialtyId, specialtyNames)

    const prof = professionalMap.get(plantao.profissional_id) ?? {
      name: plantao.profissional_nome,
      plantoesCount: 0,
      scheduledConsultas: 0,
      completedConsultas: 0,
      especialidadeName,
    }
    prof.plantoesCount += 1
    prof.scheduledConsultas += slotMetrics.scheduled
    prof.completedConsultas += slotMetrics.completed
    professionalMap.set(plantao.profissional_id, prof)

    for (const unitId of unitIds) {
      if (
        !slotVisibleToUbt(
          plantao.slot.escopo_ubt,
          unitId,
          String(plantao.slot.modalidade ?? 'tele'),
        )
      ) {
        continue
      }

      const unit = unitMap.get(unitId)!
      unit.plantoesCount += 1
      unit.scheduledConsultas += slotMetrics.scheduled
      unit.completedConsultas += slotMetrics.completed
    }
  }

  const adherencePercent = conversionPercent(completedConsultas, scheduledConsultas)
  const avgConsultasPerPlantao =
    visiblePlantoes.length > 0
      ? Math.round((completedConsultas / visiblePlantoes.length) * 10) / 10
      : 0

  return {
    unitMap,
    professionalMap,
    plantoesCount: visiblePlantoes.length,
    professionalsCount: professionalMap.size,
    scheduledConsultas,
    completedConsultas,
    adherencePercent,
    avgConsultasPerPlantao,
    visiblePlantoes,
  }
}

function buildProfessionalRows(
  professionalMap: Map<string, ProfessionalMetrics>,
): MedicosPlantaoProfessionalRowDto[] {
  return [...professionalMap.entries()]
    .map(([id, metrics]) => ({
      id,
      name: metrics.name,
      plantoesCount: metrics.plantoesCount,
      scheduledConsultas: metrics.scheduledConsultas,
      completedConsultas: metrics.completedConsultas,
      adherencePercent: conversionPercent(metrics.completedConsultas, metrics.scheduledConsultas),
      especialidadeName: metrics.especialidadeName,
    }))
    .sort((a, b) => b.completedConsultas - a.completedConsultas)
}

function buildUnitRows(
  units: RedeUnitApi[],
  unitMap: Map<string, UnitPlantaoMetrics>,
): MedicosPlantaoReportUnitRowDto[] {
  return units
    .map((unit) => {
      const metrics = unitMap.get(unit.id) ?? {
        plantoesCount: 0,
        scheduledConsultas: 0,
        completedConsultas: 0,
      }

      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        plantoesCount: metrics.plantoesCount,
        scheduledConsultas: metrics.scheduledConsultas,
        completedConsultas: metrics.completedConsultas,
        adherencePercent: conversionPercent(
          metrics.completedConsultas,
          metrics.scheduledConsultas,
        ),
      }
    })
    .sort((a, b) => b.plantoesCount - a.plantoesCount)
}

function buildHighlights(
  professionals: MedicosPlantaoProfessionalRowDto[],
  units: MedicosPlantaoReportUnitRowDto[],
  summary: MedicosPlantaoReportDto['summary'],
): MedicosPlantaoHighlightDto[] {
  const topProfessional = professionals[0]
  const topUnit = units[0]
  const bestAdherence = [...professionals]
    .filter((row) => row.scheduledConsultas >= 3)
    .sort((a, b) => b.adherencePercent - a.adherencePercent)[0]

  return [
    {
      id: 'top-professional',
      title: 'Profissional com mais consultas',
      subtitle: `${topProfessional?.name ?? '—'} · ${formatNumber(topProfessional?.completedConsultas ?? 0)} realizadas`,
      tone: 'green',
    },
    {
      id: 'top-unit',
      title: 'UBT com mais plantões',
      subtitle: `${topUnit?.name ?? '—'} · ${formatNumber(topUnit?.plantoesCount ?? 0)} plantões`,
      tone: 'blue',
    },
    {
      id: 'best-adherence',
      title: 'Melhor aderência ao plantão',
      subtitle: bestAdherence
        ? `${bestAdherence.name} · ${formatPercent(bestAdherence.adherencePercent)}%`
        : `Rede · ${formatPercent(summary.adherencePercent)}%`,
      tone: 'amber',
    },
    {
      id: 'avg-per-plantao',
      title: 'Média de consultas por plantão',
      subtitle: `${summary.avgConsultasPerPlantao} consultas concluídas em média`,
      tone: 'red',
    },
  ]
}

function buildDailyEvolution(
  plantoes: PlantaoPeriodRow[],
  agendaBySlot: Map<string, SlotConsultaMetrics>,
) {
  const plantoesByDate = new Map<string, number>()
  const consultasByDate = new Map<string, number>()

  for (const plantao of plantoes) {
    const date = String(plantao.slot.data)
    plantoesByDate.set(date, (plantoesByDate.get(date) ?? 0) + 1)

    const slotMetrics = agendaBySlot.get(String(plantao.slot_id))
    if (slotMetrics) {
      consultasByDate.set(date, (consultasByDate.get(date) ?? 0) + slotMetrics.completed)
    }
  }

  return { plantoesByDate, consultasByDate }
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

function buildKpis(summary: MedicosPlantaoReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Plantões no período',
      value: formatNumber(summary.plantoesCount),
      footer:
        summary.plantoesDeltaPercent === 0
          ? 'Estável vs período anterior'
          : `${summary.plantoesDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.plantoesDeltaPercent)}% vs período anterior`,
      footerTone: summary.plantoesDeltaPercent >= 0 ? 'positive' : 'muted',
      footerIcon: summary.plantoesDeltaPercent >= 0 ? 'up' : 'down',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Profissionais escalados',
      value: formatNumber(summary.professionalsCount),
      footer: 'Médicos com plantão confirmado ou realizado',
      footerTone: 'neutral',
      topBar: 'from-cyan-400 to-sky-500',
    },
    {
      label: 'Consultas realizadas',
      value: formatNumber(summary.completedConsultas),
      footer: `${formatNumber(summary.scheduledConsultas)} agendadas nos slots de plantão`,
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Aderência ao plantão',
      value: `${formatPercent(summary.adherencePercent)}%`,
      footer:
        summary.adherenceDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.adherenceDeltaPp > 0 ? '+' : ''}${formatPercent(summary.adherenceDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.adherenceDeltaPp >= 0 ? 'positive' : 'muted',
      footerIcon: summary.adherenceDeltaPp >= 0 ? 'up' : 'down',
      topBar: 'from-indigo-400 to-blue-600',
    },
    {
      label: 'Média por plantão',
      value: String(summary.avgConsultasPerPlantao),
      footer: 'Consultas concluídas por slot de plantão',
      footerTone: 'muted',
      topBar: 'from-violet-400 to-purple-600',
    },
  ]
}

export async function getMedicosPlantaoReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<MedicosPlantaoReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previousPeriod = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)

  const [
    currentPlantoes,
    previousPlantoes,
    currentAgenda,
    previousAgenda,
    currentConsultas,
  ] = await Promise.all([
    loadPlantoesInPeriod(entidadeId, params.periodStart, params.periodEnd),
    loadPlantoesInPeriod(
      entidadeId,
      previousPeriod.previousStart,
      previousPeriod.previousEnd,
    ),
    fetchAgendaRowsForPeriod(entidadeId, params.periodStart, params.periodEnd, unitIds),
    fetchAgendaRowsForPeriod(
      entidadeId,
      previousPeriod.previousStart,
      previousPeriod.previousEnd,
      unitIds,
    ),
    fetchConsultasForPeriod(entidadeId, params.periodStart, params.periodEnd, unitIds),
  ])

  const specialtyNames = buildSpecialtyNameMap(
    currentConsultas.map((row) => ({
      especialidade_id: row.especialidade_id,
      especialidade_nome: row.especialidade_nome,
    })),
  )

  const currentAgendaBySlot = buildAgendaBySlot(currentAgenda)
  const previousAgendaBySlot = buildAgendaBySlot(previousAgenda)

  const current = aggregatePeriod(
    visibleUnits,
    unitIds,
    currentPlantoes,
    currentAgendaBySlot,
    specialtyNames,
  )
  const previousMetrics = aggregatePeriod(
    visibleUnits,
    unitIds,
    previousPlantoes,
    previousAgendaBySlot,
    specialtyNames,
  )

  const professionals = buildProfessionalRows(current.professionalMap)
  const units = buildUnitRows(visibleUnits, current.unitMap)

  const summary = {
    plantoesCount: current.plantoesCount,
    professionalsCount: current.professionalsCount,
    scheduledConsultas: current.scheduledConsultas,
    completedConsultas: current.completedConsultas,
    adherencePercent: current.adherencePercent,
    avgConsultasPerPlantao: current.avgConsultasPerPlantao,
    unitsCount: visibleUnits.length,
    plantoesDeltaPercent: computeDeltaPercent(
      current.plantoesCount,
      previousMetrics.plantoesCount,
    ),
    adherenceDeltaPp: computeDeltaPp(
      current.adherencePercent,
      previousMetrics.adherencePercent,
    ),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  const { plantoesByDate, consultasByDate } = buildDailyEvolution(
    current.visiblePlantoes,
    currentAgendaBySlot,
  )

  return {
    reportId: 'medicos-plantao',
    title: 'Médicos em plantão',
    description:
      'Profissionais escalados, consultas realizadas por plantão e aderência à cobertura contratada.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(professionals, units, summary),
    professionals,
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      plantoesPoints: buildEvolutionPoints(
        plantoesByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
      consultasPoints: buildEvolutionPoints(
        consultasByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
