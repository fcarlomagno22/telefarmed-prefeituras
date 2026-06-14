import {
  fetchAgendaRowsForPeriod,
  fetchUnitDailyCapacities,
} from '../prefeitura-agendas/query.service.js'
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
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import {
  loadPublishedSlotsInPeriod,
  resolveSpecialtyLabel,
  slotVisibleCapacityForUnit,
  buildSpecialtyNameMap,
  type EscalaSlotPeriodRow,
} from './demand-data.service.js'
import {
  buildMonthlyEvolutionSeries,
  conversionPercent,
  countDaysInclusive,
  filterUnitsByParams,
  formatNumber,
  formatPercent,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import type {
  CapacidadeOcupacaoHighlightDto,
  CapacidadeOcupacaoReportDto,
  CapacidadeOcupacaoReportUnitRowDto,
  CapacidadeOcupacaoSpecialtyRowDto,
} from './types.js'

type UnitCapacityMetrics = {
  capacity: number
  booked: number
  bySpecialty: Map<string, { id: string; label: string; capacity: number; booked: number }>
}

function emptyUnitMetrics(): UnitCapacityMetrics {
  return { capacity: 0, booked: 0, bySpecialty: new Map() }
}

function accumulateSlotCapacity(
  unitMap: Map<string, UnitCapacityMetrics>,
  specialtyMap: Map<string, { id: string; label: string; capacity: number; booked: number }>,
  slot: EscalaSlotPeriodRow,
  unitIds: string[],
  specialtyNames: Map<string, string>,
) {
  const specialtyId = String(slot.especialidade_id)
  const label = resolveSpecialtyLabel(specialtyId, specialtyNames)
  let slotCapacity = 0

  for (const unitId of unitIds) {
    const visible = slotVisibleCapacityForUnit(slot, unitId)
    if (visible <= 0) continue

    slotCapacity += visible
    const unit = unitMap.get(unitId) ?? emptyUnitMetrics()
    unit.capacity += visible

    const unitSpec = unit.bySpecialty.get(specialtyId) ?? {
      id: specialtyId,
      label,
      capacity: 0,
      booked: 0,
    }
    unitSpec.capacity += visible
    unit.bySpecialty.set(specialtyId, unitSpec)
    unitMap.set(unitId, unit)
  }

  if (slotCapacity > 0) {
    const spec = specialtyMap.get(specialtyId) ?? {
      id: specialtyId,
      label,
      capacity: 0,
      booked: 0,
    }
    spec.capacity += slotCapacity
    specialtyMap.set(specialtyId, spec)
  }
}

function applyUnitDailyFallback(
  units: RedeUnitApi[],
  unitMap: Map<string, UnitCapacityMetrics>,
  dailyCapacities: Map<string, number>,
  dayCount: number,
) {
  for (const unit of units) {
    const current = unitMap.get(unit.id) ?? emptyUnitMetrics()
    if (current.capacity > 0) continue

    const fallback = Math.max(0, (dailyCapacities.get(unit.id) ?? 0) * dayCount)
    current.capacity = fallback
    unitMap.set(unit.id, current)
  }
}

function accumulateBookedAgenda(
  unitMap: Map<string, UnitCapacityMetrics>,
  specialtyMap: Map<string, { id: string; label: string; capacity: number; booked: number }>,
  row: AgendaAggregateRow,
  specialtyNames: Map<string, string>,
) {
  const unitId = String(row.unidade_ubt_id)
  const specialtyId = String(row.especialidade_id ?? 'unknown')
  const label = resolveSpecialtyLabel(specialtyId, specialtyNames)

  const unit = unitMap.get(unitId) ?? emptyUnitMetrics()
  unit.booked += 1

  const unitSpec = unit.bySpecialty.get(specialtyId) ?? {
    id: specialtyId,
    label,
    capacity: 0,
    booked: 0,
  }
  unitSpec.booked += 1
  unit.bySpecialty.set(specialtyId, unitSpec)
  unitMap.set(unitId, unit)

  const spec = specialtyMap.get(specialtyId) ?? {
    id: specialtyId,
    label,
    capacity: 0,
    booked: 0,
  }
  spec.booked += 1
  specialtyMap.set(specialtyId, spec)
}

function aggregatePeriod(
  units: RedeUnitApi[],
  unitIds: string[],
  slots: EscalaSlotPeriodRow[],
  agendaRows: AgendaAggregateRow[],
  dailyCapacities: Map<string, number>,
  dayCount: number,
  specialtyNames: Map<string, string>,
) {
  const unitMap = new Map<string, UnitCapacityMetrics>()
  const specialtyMap = new Map<
    string,
    { id: string; label: string; capacity: number; booked: number }
  >()

  for (const unit of units) {
    unitMap.set(unit.id, emptyUnitMetrics())
  }

  for (const slot of slots) {
    accumulateSlotCapacity(unitMap, specialtyMap, slot, unitIds, specialtyNames)
  }

  applyUnitDailyFallback(units, unitMap, dailyCapacities, dayCount)

  for (const row of agendaRows) {
    accumulateBookedAgenda(unitMap, specialtyMap, row, specialtyNames)
  }

  let capacity = 0
  let booked = 0
  for (const metrics of unitMap.values()) {
    capacity += metrics.capacity
    booked += metrics.booked
  }

  return {
    unitMap,
    specialtyMap,
    capacity,
    booked,
    occupancyPercent: conversionPercent(booked, capacity),
  }
}

function buildSpecialtyRows(
  specialtyMap: Map<string, { id: string; label: string; capacity: number; booked: number }>,
  totalBooked: number,
): CapacidadeOcupacaoSpecialtyRowDto[] {
  return [...specialtyMap.values()]
    .map((row) => ({
      id: row.id,
      name: row.label,
      capacity: row.capacity,
      booked: row.booked,
      occupancyPercent: conversionPercent(row.booked, row.capacity),
      sharePercent: conversionPercent(row.booked, totalBooked),
    }))
    .sort((a, b) => b.booked - a.booked)
}

function buildUnitRows(
  units: RedeUnitApi[],
  unitMap: Map<string, UnitCapacityMetrics>,
  networkOccupancy: number,
): CapacidadeOcupacaoReportUnitRowDto[] {
  return units
    .map((unit) => {
      const metrics = unitMap.get(unit.id) ?? emptyUnitMetrics()
      const occupancy = conversionPercent(metrics.booked, metrics.capacity)

      return {
        id: unit.id,
        name: unit.name,
        region: unit.region,
        regionKey: unit.regionKey,
        capacity: metrics.capacity,
        booked: metrics.booked,
        occupancyPercent: occupancy,
        occupancyVsNetworkPp: occupancy - networkOccupancy,
      }
    })
    .sort((a, b) => b.occupancyPercent - a.occupancyPercent)
}

function buildHighlights(
  units: CapacidadeOcupacaoReportUnitRowDto[],
  specialties: CapacidadeOcupacaoSpecialtyRowDto[],
): CapacidadeOcupacaoHighlightDto[] {
  if (units.length === 0) return []

  const topOccupancy = units[0]
  const lowestOccupancy = [...units].sort((a, b) => a.occupancyPercent - b.occupancyPercent)[0]
  const topBooked = [...units].sort((a, b) => b.booked - a.booked)[0]
  const topSpecialty = specialties[0]

  return [
    {
      id: 'top-occupancy',
      title: 'Maior taxa de ocupação',
      subtitle: `${topOccupancy?.name ?? '—'} · ${formatPercent(topOccupancy?.occupancyPercent ?? 0)}%`,
      tone: 'green',
    },
    {
      id: 'lowest-occupancy',
      title: 'Menor taxa de ocupação',
      subtitle: `${lowestOccupancy?.name ?? '—'} · ${formatPercent(lowestOccupancy?.occupancyPercent ?? 0)}%`,
      tone: 'amber',
    },
    {
      id: 'top-booked',
      title: 'Maior volume agendado',
      subtitle: `${topBooked?.name ?? '—'} · ${formatNumber(topBooked?.booked ?? 0)} horários`,
      tone: 'blue',
    },
    {
      id: 'top-specialty',
      title: 'Especialidade mais demandada',
      subtitle: `${topSpecialty?.name ?? '—'} · ${formatPercent(topSpecialty?.occupancyPercent ?? 0)}% de ocupação`,
      tone: 'red',
    },
  ]
}

function buildDailyBookedCounts(agendaRows: AgendaAggregateRow[]) {
  const bookedByDate = new Map<string, number>()
  const occupancyByDate = new Map<string, number>()
  const capacityByDate = new Map<string, number>()

  for (const row of agendaRows) {
    const date = String(row.data)
    bookedByDate.set(date, (bookedByDate.get(date) ?? 0) + 1)
  }

  for (const [date, booked] of bookedByDate) {
    occupancyByDate.set(date, booked)
  }

  return { bookedByDate, occupancyByDate, capacityByDate }
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

function buildOccupancyEvolution(
  bookedByDate: Map<string, number>,
  totalCapacity: number,
  dayCount: number,
  periodStart: string,
  periodEnd: string,
  monthly: boolean,
) {
  const dailyCapacity = dayCount > 0 ? totalCapacity / dayCount : 0
  const occupancyByDate = new Map<string, number>()

  for (const [date, booked] of bookedByDate) {
    occupancyByDate.set(date, conversionPercent(booked, dailyCapacity))
  }

  return buildEvolutionPoints(occupancyByDate, periodStart, periodEnd, monthly)
}

function buildKpis(summary: CapacidadeOcupacaoReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Capacidade disponível',
      value: formatNumber(summary.capacity),
      footer: 'Vagas de escala visíveis ou capacidade diária das UBTs',
      footerTone: 'neutral',
      topBar: 'from-cyan-400 to-sky-500',
    },
    {
      label: 'Horários agendados',
      value: formatNumber(summary.booked),
      footer:
        summary.bookedDeltaPercent === 0
          ? 'Estável vs período anterior'
          : `${summary.bookedDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.bookedDeltaPercent)}% vs período anterior`,
      footerTone: summary.bookedDeltaPercent >= 0 ? 'positive' : 'muted',
      footerIcon: summary.bookedDeltaPercent >= 0 ? 'up' : 'down',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Taxa de ocupação',
      value: `${formatPercent(summary.occupancyPercent)}%`,
      footer:
        summary.occupancyDeltaPp === 0
          ? 'Estável vs período anterior'
          : `${summary.occupancyDeltaPp > 0 ? '+' : ''}${formatPercent(summary.occupancyDeltaPp)} p.p. vs período anterior`,
      footerTone: summary.occupancyDeltaPp >= 0 ? 'positive' : 'muted',
      footerIcon: summary.occupancyDeltaPp >= 0 ? 'up' : 'down',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Especialidades na agenda',
      value: formatNumber(summary.specialtiesCount),
      footer: 'Com vagas ou agendamentos no período',
      footerTone: 'neutral',
      topBar: 'from-violet-400 to-purple-600',
    },
    {
      label: 'Unidades analisadas',
      value: formatNumber(summary.unitsCount),
      footer: 'UBTs incluídas no comparativo',
      footerTone: 'muted',
      topBar: 'from-indigo-400 to-blue-600',
    },
  ]
}

export async function getCapacidadeOcupacaoReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<CapacidadeOcupacaoReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previousPeriod = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const dayCount = countDaysInclusive(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)

  const unitCapacities = await fetchUnitDailyCapacities(entidadeId, unitIds)

  const [
    currentSlots,
    currentAgenda,
    previousAgenda,
    currentConsultas,
  ] = await Promise.all([
    loadPublishedSlotsInPeriod(entidadeId, params.periodStart, params.periodEnd),
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

  const current = aggregatePeriod(
    visibleUnits,
    unitIds,
    currentSlots,
    currentAgenda,
    unitCapacities,
    dayCount,
    specialtyNames,
  )

  const previousMetrics = aggregatePeriod(
    visibleUnits,
    unitIds,
    [],
    previousAgenda,
    unitCapacities,
    countDaysInclusive(previousPeriod.previousStart, previousPeriod.previousEnd),
    specialtyNames,
  )

  const specialties = buildSpecialtyRows(current.specialtyMap, current.booked)
  const units = buildUnitRows(visibleUnits, current.unitMap, current.occupancyPercent)

  const summary = {
    capacity: current.capacity,
    booked: current.booked,
    occupancyPercent: current.occupancyPercent,
    specialtiesCount: current.specialtyMap.size,
    unitsCount: visibleUnits.length,
    occupancyDeltaPp: computeDeltaPp(current.occupancyPercent, previousMetrics.occupancyPercent),
    bookedDeltaPercent: computeDeltaPercent(current.booked, previousMetrics.booked),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  const { bookedByDate } = buildDailyBookedCounts(currentAgenda)

  return {
    reportId: 'capacidade-ocupacao',
    title: 'Capacidade x ocupação',
    description:
      'Comparativo entre vagas disponíveis na agenda e taxa de utilização por especialidade ou unidade.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(units, specialties),
    specialties,
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      occupancyPoints: buildOccupancyEvolution(
        bookedByDate,
        current.capacity,
        dayCount,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
      bookedPoints: buildEvolutionPoints(
        bookedByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
