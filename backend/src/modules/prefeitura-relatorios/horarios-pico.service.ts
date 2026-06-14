import { fetchAgendaRowsForPeriod } from '../prefeitura-agendas/query.service.js'
import { parseHourFromTime } from '../prefeitura-agendas/formatters.js'
import type { AgendaAggregateRow } from '../prefeitura-agendas/types.js'
import {
  buildDailySeries,
  computeDeltaPercent,
  formatPeriodLabel,
} from '../prefeitura-consultas/formatters.js'
import { resolvePreviousPeriod, spDateKey } from '../prefeitura-consultas/period.js'
import {
  bucketConsultationHour,
  formatTimelineHourLabels,
  TIMELINE_HOUR_BUCKETS,
} from '../prefeitura-monitor/period.js'
import { listRedeUnits } from '../prefeitura-rede/units.service.js'
import type { RedeUnitApi } from '../prefeitura-rede/types.js'
import type { PrefeituraConsultasKpiDto } from '../prefeitura-consultas/types.js'
import { loadFilaRowsWithSpecialty, type FilaSpecialtyRow } from './demand-data.service.js'
import {
  buildMonthlyEvolutionSeries,
  filterUnitsByParams,
  formatNumber,
  formatPercent,
  resolveEntidadeRazaoSocial,
  useMonthlyEvolution,
} from './report-shared.js'
import type {
  HorariosPicoHighlightDto,
  HorariosPicoHourlyRowDto,
  HorariosPicoReportDto,
  HorariosPicoReportUnitRowDto,
  HorariosPicoWeekdayRowDto,
} from './types.js'

const WEEKDAY_LABELS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'] as const

function bucketAgendaHour(hora: string): number | null {
  const hour = parseHourFromTime(hora)
  let bucketIndex = -1
  for (let index = TIMELINE_HOUR_BUCKETS.length - 1; index >= 0; index -= 1) {
    if (hour >= TIMELINE_HOUR_BUCKETS[index]!) {
      bucketIndex = index
      break
    }
  }
  return bucketIndex >= 0 ? bucketIndex : null
}

function spWeekday(isoTimestamp: string): number {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short',
  }).format(new Date(isoTimestamp))

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }
  return map[weekday] ?? 0
}

function weekdayFromDateKey(dateKey: string): number {
  return new Date(`${dateKey}T12:00:00-03:00`).getDay()
}

type VolumeBuckets = {
  hourlyFila: number[]
  hourlyAgenda: number[]
  weekdayFila: number[]
  weekdayAgenda: number[]
}

function emptyVolumeBuckets(): VolumeBuckets {
  return {
    hourlyFila: Array.from({ length: TIMELINE_HOUR_BUCKETS.length }, () => 0),
    hourlyAgenda: Array.from({ length: TIMELINE_HOUR_BUCKETS.length }, () => 0),
    weekdayFila: Array.from({ length: 7 }, () => 0),
    weekdayAgenda: Array.from({ length: 7 }, () => 0),
  }
}

function accumulateFila(buckets: VolumeBuckets, row: FilaSpecialtyRow) {
  const hourIndex = bucketConsultationHour(row.chegada_em)
  if (hourIndex != null) {
    buckets.hourlyFila[hourIndex] = (buckets.hourlyFila[hourIndex] ?? 0) + 1
  }

  const weekday = spWeekday(row.chegada_em)
  buckets.weekdayFila[weekday] = (buckets.weekdayFila[weekday] ?? 0) + 1
}

function accumulateAgenda(buckets: VolumeBuckets, row: AgendaAggregateRow) {
  const hourIndex = bucketAgendaHour(String(row.hora))
  if (hourIndex != null) {
    buckets.hourlyAgenda[hourIndex] = (buckets.hourlyAgenda[hourIndex] ?? 0) + 1
  }

  const weekday = weekdayFromDateKey(String(row.data))
  buckets.weekdayAgenda[weekday] = (buckets.weekdayAgenda[weekday] ?? 0) + 1
}

function mergeBuckets(
  filaRows: FilaSpecialtyRow[],
  agendaRows: AgendaAggregateRow[],
): VolumeBuckets {
  const buckets = emptyVolumeBuckets()
  for (const row of filaRows) accumulateFila(buckets, row)
  for (const row of agendaRows) accumulateAgenda(buckets, row)
  return buckets
}

function buildHourlyRows(buckets: VolumeBuckets): HorariosPicoHourlyRowDto[] {
  const labels = formatTimelineHourLabels()
  return labels.map((hour, index) => {
    const filaCount = buckets.hourlyFila[index] ?? 0
    const agendaCount = buckets.hourlyAgenda[index] ?? 0
    return {
      bucketIndex: index,
      hour,
      filaCount,
      agendaCount,
      totalCount: filaCount + agendaCount,
    }
  })
}

function buildWeekdayRows(buckets: VolumeBuckets): HorariosPicoWeekdayRowDto[] {
  return WEEKDAY_LABELS.map((label, weekday) => {
    const filaCount = buckets.weekdayFila[weekday] ?? 0
    const agendaCount = buckets.weekdayAgenda[weekday] ?? 0
    return {
      weekday,
      label,
      filaCount,
      agendaCount,
      totalCount: filaCount + agendaCount,
    }
  })
}

function findPeakHour(hourly: HorariosPicoHourlyRowDto[]) {
  return [...hourly].sort((a, b) => b.totalCount - a.totalCount)[0]
}

function findPeakWeekday(weekday: HorariosPicoWeekdayRowDto[]) {
  return [...weekday].sort((a, b) => b.totalCount - a.totalCount)[0]
}

function buildUnitPeakRows(
  units: RedeUnitApi[],
  filaRows: FilaSpecialtyRow[],
  agendaRows: AgendaAggregateRow[],
): HorariosPicoReportUnitRowDto[] {
  const hourLabels = formatTimelineHourLabels()

  return units.map((unit) => {
    const unitFila = filaRows.filter((row) => String(row.unidade_ubt_id) === unit.id)
    const unitAgenda = agendaRows.filter((row) => String(row.unidade_ubt_id) === unit.id)
    const buckets = mergeBuckets(unitFila, unitAgenda)
    const hourly = buildHourlyRows(buckets)
    const weekday = buildWeekdayRows(buckets)

    const peakHourRow = findPeakHour(hourly)
    const peakWeekdayRow = findPeakWeekday(weekday)
    const filaPeak = [...hourly].sort((a, b) => b.filaCount - a.filaCount)[0]
    const agendaPeak = [...hourly].sort((a, b) => b.agendaCount - a.agendaCount)[0]

    return {
      id: unit.id,
      name: unit.name,
      region: unit.region,
      regionKey: unit.regionKey,
      peakHour: peakHourRow?.hour ?? hourLabels[0] ?? '—',
      peakWeekday: peakWeekdayRow?.label ?? '—',
      peakVolume: peakHourRow?.totalCount ?? 0,
      filaPeakHour: filaPeak?.hour ?? '—',
      agendaPeakHour: agendaPeak?.hour ?? '—',
    }
  }).sort((a, b) => b.peakVolume - a.peakVolume)
}

function buildHighlights(
  peakHour: HorariosPicoHourlyRowDto | undefined,
  peakWeekday: HorariosPicoWeekdayRowDto | undefined,
  units: HorariosPicoReportUnitRowDto[],
): HorariosPicoHighlightDto[] {
  const topUnit = units[0]

  return [
    {
      id: 'network-peak-hour',
      title: 'Horário de maior demanda na rede',
      subtitle: `${peakHour?.hour ?? '—'} · ${formatNumber(peakHour?.totalCount ?? 0)} registros`,
      tone: 'blue',
    },
    {
      id: 'network-peak-weekday',
      title: 'Dia de maior demanda na rede',
      subtitle: `${peakWeekday?.label ?? '—'} · ${formatNumber(peakWeekday?.totalCount ?? 0)} registros`,
      tone: 'green',
    },
    {
      id: 'top-unit-peak',
      title: 'UBT com maior concentração',
      subtitle: `${topUnit?.name ?? '—'} · pico ${topUnit?.peakHour ?? '—'}`,
      tone: 'amber',
    },
    {
      id: 'fila-vs-agenda',
      title: 'Composição do pico horário',
      subtitle: peakHour
        ? `${formatNumber(peakHour.filaCount)} fila · ${formatNumber(peakHour.agendaCount)} agenda`
        : '—',
      tone: 'red',
    },
  ]
}

function buildDailyVolumeCounts(
  filaRows: FilaSpecialtyRow[],
  agendaRows: AgendaAggregateRow[],
) {
  const totalByDate = new Map<string, number>()

  for (const row of filaRows) {
    const date = spDateKey(row.chegada_em)
    totalByDate.set(date, (totalByDate.get(date) ?? 0) + 1)
  }
  for (const row of agendaRows) {
    const date = String(row.data)
    totalByDate.set(date, (totalByDate.get(date) ?? 0) + 1)
  }

  return totalByDate
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

function buildKpis(summary: HorariosPicoReportDto['summary']): PrefeituraConsultasKpiDto[] {
  return [
    {
      label: 'Horário de pico',
      value: summary.peakHour,
      footer: `${formatNumber(summary.peakHourVolume)} registros concentrados`,
      footerTone: 'neutral',
      topBar: 'from-orange-400 to-amber-500',
    },
    {
      label: 'Dia de pico',
      value: summary.peakWeekday,
      footer: `${formatNumber(summary.peakDayVolume)} registros no dia`,
      footerTone: 'neutral',
      topBar: 'from-emerald-400 to-green-500',
    },
    {
      label: 'Volume total analisado',
      value: formatNumber(summary.totalVolume),
      footer:
        summary.volumeDeltaPercent === 0
          ? 'Estável vs período anterior'
          : `${summary.volumeDeltaPercent > 0 ? '+' : ''}${formatPercent(summary.volumeDeltaPercent)}% vs período anterior`,
      footerTone: summary.volumeDeltaPercent >= 0 ? 'positive' : 'muted',
      footerIcon: summary.volumeDeltaPercent >= 0 ? 'up' : 'down',
      topBar: 'from-sky-400 to-blue-500',
    },
    {
      label: 'Faixas horárias monitoradas',
      value: String(TIMELINE_HOUR_BUCKETS.length),
      footer: formatTimelineHourLabels().join(', '),
      footerTone: 'muted',
      topBar: 'from-violet-400 to-purple-600',
    },
    {
      label: 'Unidades na análise',
      value: formatNumber(summary.unitsCount),
      footer: 'Comparativo de pico por UBT',
      footerTone: 'muted',
      topBar: 'from-cyan-400 to-sky-500',
    },
  ]
}

export async function getHorariosPicoReport(
  entidadeId: string,
  generatedBy: string,
  params: {
    periodStart: string
    periodEnd: string
    unidadeUbtId?: string
    regionKey?: string
  },
): Promise<HorariosPicoReportDto> {
  const [allUnits, entidadeRazaoSocial] = await Promise.all([
    listRedeUnits(entidadeId),
    resolveEntidadeRazaoSocial(entidadeId),
  ])

  const visibleUnits = filterUnitsByParams(allUnits, params)
  const unitIds = visibleUnits.map((unit) => unit.id)
  const previousPeriod = resolvePreviousPeriod(params.periodStart, params.periodEnd)
  const monthly = useMonthlyEvolution(params.periodStart, params.periodEnd)

  const [currentFila, previousFila, currentAgenda, previousAgenda] = await Promise.all([
    loadFilaRowsWithSpecialty(entidadeId, unitIds, params.periodStart, params.periodEnd),
    loadFilaRowsWithSpecialty(
      entidadeId,
      unitIds,
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
  ])

  const buckets = mergeBuckets(currentFila, currentAgenda)
  const hourly = buildHourlyRows(buckets)
  const weekday = buildWeekdayRows(buckets)
  const peakHour = findPeakHour(hourly)
  const peakWeekday = findPeakWeekday(weekday)
  const totalVolume = hourly.reduce((sum, row) => sum + row.totalCount, 0)

  const previousBuckets = mergeBuckets(previousFila, previousAgenda)
  const previousTotal = buildHourlyRows(previousBuckets).reduce(
    (sum, row) => sum + row.totalCount,
    0,
  )

  const units = buildUnitPeakRows(visibleUnits, currentFila, currentAgenda)

  const summary = {
    peakHour: peakHour?.hour ?? '—',
    peakWeekday: peakWeekday?.label ?? '—',
    peakHourVolume: peakHour?.totalCount ?? 0,
    peakDayVolume: peakWeekday?.totalCount ?? 0,
    totalVolume,
    unitsCount: visibleUnits.length,
    volumeDeltaPercent: computeDeltaPercent(totalVolume, previousTotal),
    kpis: [] as PrefeituraConsultasKpiDto[],
  }
  summary.kpis = buildKpis(summary)

  const volumeByDate = buildDailyVolumeCounts(currentFila, currentAgenda)

  return {
    reportId: 'horarios-pico',
    title: 'Horários de pico',
    description:
      'Faixas horárias e dias da semana com maior concentração de demanda e fila de espera.',
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    periodLabel: formatPeriodLabel(params.periodStart, params.periodEnd),
    generatedAt: new Date().toISOString(),
    entidadeRazaoSocial,
    generatedBy,
    summary,
    highlights: buildHighlights(peakHour, peakWeekday, units),
    hourly,
    weekday,
    units,
    evolution: {
      mode: monthly ? 'monthly' : 'daily',
      volumePoints: buildEvolutionPoints(
        volumeByDate,
        params.periodStart,
        params.periodEnd,
        monthly,
      ),
    },
  }
}
